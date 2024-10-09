from channels.generic.websocket import AsyncWebsocketConsumer
import json
from django.db.models import ObjectDoesNotExist
from asgiref.sync import sync_to_async
from .models import Message, Thread, ThreadReaction, ChannelMembership


class ThreadConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        self.message_id = self.scope['url_route']['kwargs'].get('message_id')
        self.thread_group_name = f'message_{self.message_id}'  # Gruppennamen basierend auf der message_id

        # Überprüfen, ob die message_id vorhanden ist und der Benutzer nicht anonym ist
        if not self.message_id or self.user.is_anonymous:
            print("Abgelehnt: Ungültige message_id oder anonymer Benutzer.")
            await self.close()
            return

        try:
            # Hole die Nachricht anhand der message_id
            message = await sync_to_async(Message.objects.get)(id=self.message_id)

            # Hole den Channel, zu dem die Nachricht gehört
            channel = await sync_to_async(lambda: message.channel)()

            # Hole alle Benutzer, die Mitglieder des Channels sind
            members = await sync_to_async(list)(
                ChannelMembership.objects.filter(channel=channel).values_list('user', flat=True)
            )

            # Prüfen, ob der Benutzer Mitglied des Channels ist
            if self.user.id not in members:
                print(f"Benutzer {self.user.email} ist kein Mitglied des Channels {channel.id}.")
                await self.close()
                return

            # Benutzer zur Gruppen-Thread-Gruppe hinzufügen
            await self.channel_layer.group_add(
                self.thread_group_name,
                self.channel_name
            )
            await self.accept()
            print(f"Benutzer {self.user.email} erfolgreich mit Thread der Nachricht {self.message_id} verbunden (Channel {channel.id}).")

        except ObjectDoesNotExist:
            print(f"Abgelehnt: Nachricht mit ID {self.message_id} existiert nicht.")
            await self.close()

    async def disconnect(self, close_code):
        # Benutzer von der Thread-Gruppe entfernen
        await self.channel_layer.group_discard(
            self.thread_group_name,
            self.channel_name
        )
        
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        action = text_data_json.get('type')
        message_id = self.message_id  # Verwende message_id
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
            thread = await sync_to_async(Thread.objects.filter)(message=message)  # Filter nach Thread, der zur Nachricht gehört

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

            # Überprüfe den Sender in einer sync_to_async-Funktion
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
                    print(f"Received delete request for message_id: {thread_id}")  # Debugging-Ausgabe
                    thread = await sync_to_async(Thread.objects.get)(id=thread_id)
                    print(f"Trying to delete thread with ID: {thread_id}")  # Überprüfe die Thread-ID
                    # Überprüfe, ob der Benutzer der Sender des Threads ist
                    thread_sender = await sync_to_async(lambda: thread.sender)()
                    if thread_sender != self.user:
                        await self.send(text_data=json.dumps({
                            'error': 'Unauthorized to delete this thread'
                        }))
                        return

                    # Thread löschen
                    await sync_to_async(thread.delete)()

                    # Sende ein Lösch-Ereignis an die Kanalgruppe
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

                        # Verwende sync_to_async als Dekorator oder bei Methodenaufrufen
                        thread = await sync_to_async(Thread.objects.get)(id=thread_id)  # Hol das Thread-Objekt

                        # Danach kannst du wie gewohnt fortfahren:
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

                # Erstelle den neuen Thread
                new_thread = await sync_to_async(Thread.objects.create)(
                    sender=self.user,
                    message=message,  # Hier kannst du die Message-Referenz setzen
                    content=message_content,  # Setze den content für den Thread
                    file_url=file_url
                )

                # Sende die Nachricht über WebSocket
                await self.channel_layer.group_send(
                    self.thread_group_name,
                    {
                        'type': 'thread_message',
                        'message_id': new_thread.id,  # Verwende die ID des neuen Threads
                        'content': new_thread.content,  # Hier den Inhalt des neu erstellten Threads verwenden
                        'sender': new_thread.sender.username,  # Sender aus dem Thread-Modell
                        'sender_id': new_thread.sender.id,  # Sender-ID
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
        file_url = event.get('fileUrl')  # Reaktionstyp

        await self.send(text_data=json.dumps({
            'sender': sender,
            'sender_id': sender_id,
            'action': action,
            'message_id': message_id,
            'reaction_type': reaction_type,
            'content': content,
            'fileUrl': file_url
        }))
