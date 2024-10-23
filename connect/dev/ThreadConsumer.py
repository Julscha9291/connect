from channels.generic.websocket import AsyncWebsocketConsumer
import json
from django.db.models import ObjectDoesNotExist
from asgiref.sync import sync_to_async
from .models import Message, Thread, ThreadReaction, ChannelMembership

class ThreadConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        self.message_id = self.scope['url_route']['kwargs'].get('message_id')
        self.thread_group_name = f'message_{self.message_id}'  

        if not self.message_id or self.user.is_anonymous:
            print("Abgelehnt: Ungültige message_id oder anonymer Benutzer.")
            await self.close()
            return

        try:
            message = await sync_to_async(Message.objects.get)(id=self.message_id)
            channel = await sync_to_async(lambda: message.channel)()

            members = await sync_to_async(list)(
                ChannelMembership.objects.filter(channel=channel).values_list('user', flat=True)
            )
            if self.user.id not in members:
                print(f"Benutzer {self.user.email} ist kein Mitglied des Channels {channel.id}.")
                await self.close()
                return

            await self.channel_layer.group_add(
                self.thread_group_name,
                self.channel_name
            )
            
            await self.accept()

        except ObjectDoesNotExist:
            await self.close()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.thread_group_name,
            self.channel_name
        )
        
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        action = text_data_json.get('type')
        message_id = self.message_id 
        reaction_type = text_data_json.get('reaction_type')
        file_url = text_data_json.get('fileUrl')
        thread_id = text_data_json.get('message_id')

        if self.user.is_anonymous:
            await self.send(text_data=json.dumps({
                'error': 'Unauthorized user'
            }))
            return

        try:
            message = await sync_to_async(Message.objects.get)(id=message_id)
            thread = await sync_to_async(Thread.objects.filter)(message=message)  

        except ObjectDoesNotExist:
            await self.send(text_data=json.dumps({
                'error': 'Message does not exist'
            }))
            return

        if action == 'edit':
            new_content = text_data_json.get('content')

            if not new_content:
                await self.send(text_data=json.dumps({
                    'error': 'No message content found'
                }))
                return

            thread = await sync_to_async(Thread.objects.get)(id=thread_id)

            thread_sender = await sync_to_async(lambda: thread.sender)()
            if thread_sender != self.user:
                    await self.send(text_data=json.dumps({
                        'error': 'Unauthorized to delete this thread'
                    }))
                    return

            thread.content = new_content
            await sync_to_async(thread.save)()

            await self.channel_layer.group_send(
                self.thread_group_name,
                {
                    'type': 'thread_message',
                    'content': new_content,
                    'sender_id': self.user.id,
                    'sender': self.user.username,
                    'message_id': thread_id,
                    'action': 'edit'
                }
            )

        elif action == 'delete':
                if not message_id:
                    await self.send(text_data=json.dumps({
                        'error': 'No message ID found'
                    }))
                    return

                try:
                    thread = await sync_to_async(Thread.objects.get)(id=thread_id)
                    thread_sender = await sync_to_async(lambda: thread.sender)()
                    if thread_sender != self.user:
                        await self.send(text_data=json.dumps({
                            'error': 'Unauthorized to delete this thread'
                        }))
                        return

                    await sync_to_async(thread.delete)()

                    await self.channel_layer.group_send(
                        self.thread_group_name,
                        {
                            'type': 'thread_message',
                            'message_id': thread_id,
                            'action': 'delete'
                        }
                    )
                except Thread.DoesNotExist:
                    await self.send(text_data=json.dumps({
                        'error': 'Thread not found'
                    }))


        elif action == 'react':
                        if not reaction_type:
                            await self.send(text_data=json.dumps({
                                'error': 'Missing reaction type'
                            }))
                            return

                        thread = await sync_to_async(Thread.objects.get)(id=thread_id)  

                        existing_reaction = await sync_to_async(lambda: ThreadReaction.objects.filter(
                            user=self.user,
                            thread_message_id=thread_id,
                            reaction_type=reaction_type
                        ).exists())()

                        if existing_reaction:
                            await self.send(text_data=json.dumps({
                                'error': 'Reaction already exists'
                            }))
                            return

                        await sync_to_async(ThreadReaction.objects.create)(
                            user=self.user,
                            thread_message_id=thread_id,
                            reaction_type=reaction_type
                        )

                        await self.channel_layer.group_send(
                            self.thread_group_name,
                            {
                                'type': 'thread_message',
                                'message_id': thread_id,
                                'reaction_type': reaction_type,
                                'action': 'react',
                                'sender_id': self.user.id
                            }
                        )

        else:  # Aktion 'new'
                message_content = text_data_json.get('content')
                if not message_content:
                    await self.send(text_data=json.dumps({
                        'error': 'No message content found'
                    }))
                    return

                new_thread = await sync_to_async(Thread.objects.create)(
                    sender=self.user,
                    message=message,  
                    content=message_content, 
                    file_url=file_url
                )

                await self.channel_layer.group_send(
                    self.thread_group_name,
                    {
                        'type': 'thread_message',
                        'message_id': new_thread.id, 
                        'content': new_thread.content,  
                        'sender': new_thread.sender.username,  
                        'sender_id': new_thread.sender.id,  
                        'action': 'new',
                    }
                )

    async def thread_message(self, event):
        sender = event.get('sender')
        sender_id = event.get('sender_id')
        action = event.get('action')
        message_id = event.get('message_id')
        reaction_type = event.get('reaction_type')
        content = event.get('content')
        file_url = event.get('fileUrl')  

        await self.send(text_data=json.dumps({
            'sender': sender,
            'sender_id': sender_id,
            'action': action,
            'message_id': message_id,
            'reaction_type': reaction_type,
            'content': content,
            'fileUrl': file_url
        }))
