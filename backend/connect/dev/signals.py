from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import CustomUser, Channel

@receiver(post_save, sender=CustomUser)
def create_user_channel(sender, instance, created, **kwargs):
    if created:
        Channel.objects.create(
            name=f"{instance.first_name} {instance.last_name}'s Channel",
            description=f"Private channel for {instance.first_name} {instance.last_name}",
            creator=instance
        )
