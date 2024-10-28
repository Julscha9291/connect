from rest_framework import viewsets, generics, status, permissions
from django.http import JsonResponse
from .models import Contact, CustomUser, ChannelMembership, Channel, Message, Reaction, Thread, ThreadReaction
from .serializers import UserRegistrationSerializer, UserProfileSerializer, UserListSerializer, ContactSerializer, ChannelMembershipSerializer,ChannelSerializer, MessageSerializer, ReactionSerializer, ThreadSerializer, ThreadReactionSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db import transaction
from rest_framework import status
import logging
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view
from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework.decorators import action
from django.contrib.auth import get_user_model
from django.views.decorators.csrf import csrf_exempt
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.db.models import Count
from django.shortcuts import redirect
from rest_framework.parsers import MultiPartParser, FormParser

User = get_user_model()

def custom_404_view(request, exception):
    return redirect('https://connect.julianschaepermeier.com/')

class LoginView(APIView):
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        user = authenticate(request, email=email, password=password)
        if user is not None:
            refresh = RefreshToken.for_user(user)
            user.is_online = True
            user.save()
            
            user.is_active = True  
            profile_picture_url = user.profile_picture.url if user.profile_picture else None
            return Response({
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                    'user': {
                        'id': user.id,
                        'username': user.username,
                        'email': user.email,
                        'first_name': user.first_name,
                        'last_name': user.last_name,
                        'color': user.color,
                        'profile_picture': profile_picture_url, 
                    }
                })
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)


logger = logging.getLogger(__name__)

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            user = request.user
            user.is_online = False
            user.save()
            refresh_token = request.data.get("refresh")
            token = RefreshToken(refresh_token)
            token.blacklist()

            return Response({"message": "Logout successful"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class ContactViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Contact.objects.all()
    serializer_class = ContactSerializer    
    
class UserContactView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        contact = Contact.objects.get(email=request.user.email)
        serializer = ContactSerializer(contact)
        return Response(serializer.data)    

class UserRegistrationView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserRegistrationSerializer
      
class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        serializer = UserProfileSerializer(user)
        return Response(serializer.data)

    def put(self, request):
        user = request.user
        serializer = UserProfileSerializer(user, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)  
     
class UserListView(generics.ListAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserListSerializer  
    
class ChannelViewSet(viewsets.ModelViewSet):
    queryset = Channel.objects.all()
    serializer_class = ChannelSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Channel.objects.filter(members__user=user)

    def perform_create(self, serializer):
        channel = serializer.save(creator=self.request.user)

        members = self.request.data.get('members', [])
        for member_id in members:
            ChannelMembership.objects.create(channel=channel, user_id=member_id)

        ChannelMembership.objects.get_or_create(channel=channel, user=self.request.user)
        
            
    @action(detail=True, methods=['post'])
    def add_user(self, request, pk=None):
            channel = self.get_object()
            user_id = request.data.get('user_id')
            if user_id:
                try:
                    user = User.objects.get(id=user_id)
                    ChannelMembership.objects.get_or_create(channel=channel, user=user)
                    return Response({'status': 'user added'}, status=status.HTTP_200_OK)
                except User.DoesNotExist:
                    return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
            return Response({'error': 'User ID required'}, status=status.HTTP_400_BAD_REQUEST)    
        
        
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        data = request.data.copy()
        allowed_fields = ['name', 'description']
        for field in data:
            if field not in allowed_fields:
                data.pop(field)

        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        return Response(serializer.data)  
    
    
    @action(detail=True, methods=['delete'])
    def delete_user(self, request, pk=None):
        channel = self.get_object()
        user = request.user

        try:
            membership = ChannelMembership.objects.get(channel=channel, user=user)
            membership.delete()
            return Response({'status': 'user removed from channel'}, status=status.HTTP_204_NO_CONTENT)
        except ChannelMembership.DoesNotExist:
            return Response({'error': 'User not a member of this channel'}, status=status.HTTP_404_NOT_FOUND) 

class ChannelMembershipViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ChannelMembership.objects.all()
    serializer_class = ChannelMembershipSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        channel_id = self.kwargs.get('channel_id')
        if channel_id:
            return ChannelMembership.objects.filter(channel_id=channel_id)
        return ChannelMembership.objects.none()  
    
    
def get_messages(request, channel_id):
    messages = Message.objects.filter(channel_id=channel_id).annotate(
        thread_count=Count('threads')  
    ).values(
        'id', 
        'sender__username', 
        'sender__id', 
        'content', 
        'timestamp', 
        'file_url',
        'thread_count'
    )
    return JsonResponse(list(messages), safe=False)

@csrf_exempt
def upload_file(request):
    if request.method == 'POST' and request.FILES.get('file'):
        file = request.FILES['file']
        
        file_name = default_storage.save(f"uploads/{file.name}", ContentFile(file.read()))
        file_url = default_storage.url(file_name)
    
        return JsonResponse({'file_url': file_url})
    
    return JsonResponse({'error': 'No file uploaded'}, status=400)


@api_view(['PUT'])
def edit_message(request, message_id):

    try:
        message = Message.objects.get(id=message_id)
        if message.sender != request.user:
            return Response({"error": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)
        
        new_content = request.data.get('content')
        if new_content:
            message.content = new_content
            message.save()
            return Response(MessageSerializer(message).data)
        else:
            return Response({"error": "No content provided"}, status=status.HTTP_400_BAD_REQUEST)
    
    except Message.DoesNotExist:
        return Response({"error": "Message not found"}, status=status.HTTP_404_NOT_FOUND)


@api_view(['DELETE'])
def delete_message(request, message_id):
    try:
        message = Message.objects.get(id=message_id)
        print(f"Deleting message with ID: {message_id} by user: {request.user}")
        if message.sender != request.user:
            return Response({"error": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)

        message.delete()
        return Response({"message": "Message deleted"}, status=status.HTTP_204_NO_CONTENT)
    
    except Message.DoesNotExist:
        return Response({"error": "Message not found"}, status=status.HTTP_404_NOT_FOUND)
    
    
@api_view(['POST'])
def create_private_channel(request):
    user1 = request.user
    user1_id = user1.id
    user2_id = request.data.get('user2_id')

    try:
        user2 = get_user_model().objects.get(id=user2_id)
    except get_user_model().DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    print(f"Current User: {user1} (ID: {user1_id})")
    print(f"Selected User ID: {user2_id}")
    print(f"Found User2: {user2} (ID: {user2.id})")

    common_channel_ids = ChannelMembership.objects.filter(
        channel__in=ChannelMembership.objects.filter(user=user1_id).values_list('channel_id', flat=True)
    ).filter(user=user2_id).values_list('channel_id', flat=True).distinct()

    print(f"Common Channel IDs: {list(common_channel_ids)}")

    existing_channel = Channel.objects.filter(
        id__in=common_channel_ids,
        is_private=True
    ).distinct().first()

    if existing_channel:
        print(f"Found Existing Channel: {existing_channel} (ID: {existing_channel.id})")
        return Response({
            "message": "Private channel already exists",
            "channel": ChannelSerializer(existing_channel).data
        }, status=status.HTTP_200_OK)

    channel_name = f"#priv_{user1.username}_{user2.username}"
    print(f"Creating New Channel with name: {channel_name}")

    with transaction.atomic():
        channel = Channel.objects.create(
            name=channel_name,
            description="private-chat",
            creator=user1,
            is_private=True
        )

        ChannelMembership.objects.create(channel=channel, user=user1)
        ChannelMembership.objects.create(channel=channel, user=user2)

    print(f"New Channel Created: {channel} (ID: {channel.id})")

    return Response({
        "message": "Private channel created",
        "channel": ChannelSerializer(channel).data
    }, status=status.HTTP_201_CREATED)

class ReactionViewSet(viewsets.ModelViewSet):
    queryset = Reaction.objects.all()
    serializer_class = ReactionSerializer

    @action(detail=False, methods=['delete'], url_path='delete-reaction')
    def delete_reaction(self, request):
        message_id = request.data.get('message')
        reaction_type = request.data.get('reaction_type')
        user = request.data.get('user')

        if not all([message_id, reaction_type, user]):
            return Response({'detail': 'Fehlende Parameter.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            reaction = Reaction.objects.get(message_id=message_id, reaction_type=reaction_type, user=user)
            reaction.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Reaction.DoesNotExist:
            return Response({'detail': 'Reaktion nicht gefunden.'}, status=status.HTTP_404_NOT_FOUND)
        
class ThreadReactionViewSet(viewsets.ModelViewSet):
    queryset = ThreadReaction.objects.all()
    serializer_class = ThreadReactionSerializer

    @action(detail=False, methods=['delete'], url_path='delete-reaction')
    def delete_reaction(self, request):
        thread_message_id = request.data.get('thread_message')  
        reaction_type = request.data.get('reaction_type')
        user = request.data.get('user')

        if not all([thread_message_id, reaction_type, user]):
            return Response({'detail': 'Fehlende Parameter.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            reaction = ThreadReaction.objects.get(thread_message_id=thread_message_id, reaction_type=reaction_type, user=user)
            reaction.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ThreadReaction.DoesNotExist:
            return Response({'detail': 'Reaktion nicht gefunden.'}, status=status.HTTP_404_NOT_FOUND)
       
       
class ThreadViewSet(viewsets.ModelViewSet):
    queryset = Thread.objects.all()
    serializer_class = ThreadSerializer
    parser_classes = (MultiPartParser, FormParser) 

def create(self, request, *args, **kwargs):
    file_url = request.FILES.get('file_url')  

    if file_url:
        if not file_url.name.endswith(('.jpg', '.jpeg', '.png', '.gif')):  
            return Response({"error": "Ungültige Datei-URL"}, status=400)

    return super().create(request, *args, **kwargs)
    
    
def get_threads(request, message_id):
    threads = Thread.objects.filter(message_id=message_id).values(
        'id',
        'sender__username',
        'sender__id',
        'content',
        'timestamp',
    )
    return JsonResponse(list(threads), safe=False)    



@api_view(['DELETE'])
def delete_thread(request, message_id):
    try:
        thread = Thread.objects.get(id=message_id)

        if thread.sender != request.user:
            return Response({"error": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)

        thread.delete()
        return Response({"message": "Thread deleted"}, status=status.HTTP_204_NO_CONTENT)

    except Thread.DoesNotExist:
        return Response({"error": "Thread not found"}, status=status.HTTP_404_NOT_FOUND)
    
@api_view(['PUT'])
def edit_thread(request, message_id):

    try:
        thread = Thread.objects.get(id=message_id)
        
        if thread.sender != request.user:
            return Response({"error": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)
        
        new_content = request.data.get('content')
        if new_content:
            thread.content = new_content
            thread.save()  
            return Response(ThreadSerializer(thread).data)  
        else:
            return Response({"error": "No content provided"}, status=status.HTTP_400_BAD_REQUEST)
    
    except Thread.DoesNotExist:
        return Response({"error": "Thread not found"}, status=status.HTTP_404_NOT_FOUND)


