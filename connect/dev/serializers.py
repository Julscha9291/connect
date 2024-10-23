from rest_framework import serializers
from .models import Contact,CustomUser, Channel, ChannelMembership, Message, Reaction, Thread, ThreadReaction
import random


def get_unique_color():
    colors = [
    '#007bff', '#28a745', '#dc3545', '#ffc107', '#17a2b8', 
    '#6c757d', '#6610f2', '#e83e8c', '#fd7e14', '#20c997',
    '#343a40', '#f8f9fa', '#ffffff', '#6f42c1', '#e9ecef',
    '#17a2b8', '#343a40', '#f5f5f5', '#212529', '#007bff',
    '#28a745', '#dc3545', '#ffc107', '#e83e8c', '#fd7e14',
    '#20c997', '#6c757d', '#6610f2', '#e9ecef', '#f1f1f1',
    '#d3d3d3', '#a9a9a9', '#ff6347', '#ff1493', '#00fa9a'
    ]
    used_colors = CustomUser.objects.values_list('color', flat=True)
    available_colors = [color for color in colors if color not in used_colors]
    
    if not available_colors:
        raise ValueError("No available colors")

    return random.choice(available_colors)

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('id', 'email', 'first_name', 'last_name', 'color', 'profile_picture')

class UserRegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'password', 'color', 'profile_picture']

    def create(self, validated_data):
        color = get_unique_color()
        user = CustomUser.objects.create_user(
            username=validated_data['username'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            email=validated_data['email'],
            password=validated_data['password'],
            color=color,  # Farbezuteilung
            profile_picture=validated_data.get('profile_picture')  
        )
        return user
    
class UserListSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'first_name', 'last_name', 'email', 'color', 'profile_picture', 'is_online']
        
class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = ('id', 'first_name','last_name', 'color')

class ChannelMembershipSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChannelMembership
        fields = ['user', 'joined_at', 'channel']

class ChannelSerializer(serializers.ModelSerializer):
    members = ChannelMembershipSerializer(many=True, read_only=True)
    creator = serializers.ReadOnlyField(source='creator.username')

    class Meta:
        model = Channel
        fields = ['id', 'name', 'description', 'creator', 'created_at', 'members', 'is_private']
         
class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['id', 'sender', 'file_url', 'channel', 'content', 'timestamp', 'sender_id']        
        
class ReactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reaction
        fields = ['id', 'user', 'message', 'reaction_type']   
        
class ThreadSerializer(serializers.ModelSerializer):
    class Meta:
        file_url = serializers.CharField(allow_blank=True, required=False) 
        model = Thread
        fields = '__all__'       
              
class ThreadReactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ThreadReaction
        fields = ['id', 'user', 'thread_message', 'reaction_type']        
        
        