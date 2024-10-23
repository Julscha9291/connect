from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserRegistrationView, LoginView, UserProfileView, UserListView, UserContactView, ChannelViewSet, ChannelMembershipViewSet, get_messages, edit_message, delete_message, create_private_channel, ReactionViewSet, ThreadViewSet, ThreadReactionViewSet, upload_file, get_threads, delete_thread, edit_thread


router = DefaultRouter()
router.register(r'channels', ChannelViewSet)
router.register(r'channel-memberships', ChannelMembershipViewSet, basename='channel_membership')
router.register(r'reactions', ReactionViewSet, basename='reaction')
router.register(r'threads', ThreadViewSet)
router.register(r'thread-reactions', ThreadReactionViewSet, basename='thread-reaction')


urlpatterns = [
    path('', include(router.urls)),
    path('register/', UserRegistrationView.as_view(), name='user-register'),
    path('login/', LoginView.as_view(), name='login'),
    path('profile/', UserProfileView.as_view(), name='user-profile'),
    path('users/', UserListView.as_view(), name='user-list'),
    path('user-contact/', UserContactView.as_view(), name='user-contact'),
    path('messages/<int:channel_id>/', get_messages, name='get_messages'),
    path('message/<int:message_id>/edit/', edit_message, name='edit_message'),
    path('message/<int:message_id>/delete/', delete_message, name='delete_message'),
    path('api/channels/<int:channel_id>/members/', ChannelMembershipViewSet.as_view({'get': 'list'}), name='channel-members'),
    path('create-private-channel/', create_private_channel, name='create_private_channel'),
    path('channels/private/', create_private_channel, name='check_private_channel'),
    path('reactions/message/<int:message_id>/', ReactionViewSet.as_view({'get': 'reactions_for_message'}), name='reactions-for-message'),
    path('thread-reactions/threads/<int:thread_id>/', ThreadReactionViewSet.as_view({'get': 'reactions_for_threads'}), name='reactions_for_threads'),
    path('upload/', upload_file, name='file-upload'),
    path('threads/', get_threads, name='get-threads'),
    path('threads/<int:thread_id>/', ThreadViewSet.as_view({'get': 'retrieve'}), name='thread-detail'), 
    path('threads/<int:thread_id>/delete/', delete_thread, name='delete_thread'),
    path('threads/<int:thread_id>/edit/', edit_thread, name='edit_thread'),
    path('channels/<int:channel_id>/delete_user/', ChannelViewSet.as_view({'delete': 'delete_user'}), name='delete_user'),
]
