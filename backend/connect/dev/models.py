from django.db import models
import random
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.dispatch import receiver
from django.db.models.signals import post_save
from django.core.files.storage import FileSystemStorage
from django.contrib.auth.models import User
from django.conf import settings


# Definieren Sie eine Liste von eindeutigen Farben
COLOR_CHOICES = [
    '#FF5733', '#33FF57', '#3357FF', '#FF33A8', '#A833FF', '#33FFF2', '#FF8333', '#33FF83', '#5733FF'
]

def get_unique_color():
    used_colors = set(Contact.objects.values_list('color', flat=True))
    available_colors = list(set(COLOR_CHOICES) - used_colors)
    if not available_colors:
        raise ValueError("Keine eindeutigen Farben mehr verfügbar")
    return random.choice(available_colors)

class Contact(models.Model):
    email = models.CharField(max_length=200, default='')
    first_name = models.CharField(max_length=200)
    last_name = models.CharField(max_length=200, default='Doe')
    color = models.CharField(max_length=7, default='#ffffff', unique=False)

    def save(self, *args, **kwargs):
        if not self.pk:  # Wenn der Kontakt neu ist
            if self.first_name and self.last_name:
                try:
                    user = CustomUser.objects.get(first_name=self.first_name, last_name=self.last_name)
                    self.color = user.color
                except CustomUser.DoesNotExist:
                    pass
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

# Definiere ein benutzerdefiniertes Dateispeicherziel für Profilbilder
profile_picture_storage = FileSystemStorage(location='/media/profile_pictures/')


class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=30, blank=True)
    last_name = models.CharField(max_length=30, blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)
    profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True, null=True)
    is_online = models.BooleanField(default=False)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']

    groups = models.ManyToManyField(
        'auth.Group',
        related_name='customuser_set',
        blank=True,
        help_text='The groups this user belongs to. A user will get all permissions granted to each of their groups.',
        verbose_name='groups',
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='customuser_set',
        blank=True,
        help_text='Specific permissions for this user.',
        verbose_name='user permissions',
    )
    color = models.CharField(max_length=7, default='#ffffff', unique=False)

    def __str__(self):
        return self.email


class Channel(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()
    creator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_channels')
    created_at = models.DateTimeField(auto_now_add=True)
    is_private = models.BooleanField(default=False)  # Neues Feld

    def __str__(self):
        return self.name

class ChannelMembership(models.Model):
    channel = models.ForeignKey('Channel', on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='channel_memberships')
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('channel', 'user')

    def __str__(self):
        return f"{self.user.username} in {self.channel.name}"
    
    
    
class Message(models.Model):
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_messages')
    channel = models.ForeignKey('Channel', on_delete=models.CASCADE, related_name='messages', default=1)
    content = models.TextField()
    file_url = models.FileField(upload_to='uploads/', null=True, blank=True)  # Füge dieses Feld hinzu
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sender} to {self.channel}: {self.content[:20]}"    
    
    
    
class Reaction(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    message = models.ForeignKey(Message, on_delete=models.CASCADE)
    reaction_type = models.CharField(max_length=255)

    class Meta:
        unique_together = ('user', 'message', 'reaction_type')
        
    
        
class Thread(models.Model):
    message = models.ForeignKey('Message', on_delete=models.CASCADE, related_name='threads')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    content = models.TextField(blank=True, null=True)  # Erlaube leeres Feld
    timestamp = models.DateTimeField(auto_now_add=True)
    file_url = models.CharField(max_length=255, null=True, blank=True)

    def __str__(self):
        return self.content        
    
    
class ThreadReaction(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    thread_message = models.ForeignKey(Thread, on_delete=models.CASCADE)  # Hier solltest du sicherstellen, dass das Thread-Modell existiert
    reaction_type = models.CharField(max_length=255)

    class Meta:
        unique_together = ('user', 'thread_message', 'reaction_type')        
            