from channels.generic.websocket import AsyncWebsocketConsumer
import json
from django.db.models import ObjectDoesNotExist
from asgiref.sync import sync_to_async
from .models import Message, Channel, ChannelMembership, Reaction

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        self.channel_id = self.scope['url_route']['kwargs'].get('channel_id')
        self.channel_group_name = f'chat_{self.channel_id}'

        if not self.channel_id:
            await self.close()
            return

        if self.user.is_anonymous:
            await self.close()
            return

        # Überprüfen, ob der Benutzer Mitglied des Kanals ist
        try:
            channel = await sync_to_async(Channel.objects.get)(id=self.channel_id)
            is_member = await sync_to_async(lambda: ChannelMembership.objects.filter(
                channel=channel,
                user=self.user
            ).exists())()

            if not is_member:
                await self.close()
                return

            # Benutzer zur Kanalgruppe hinzufügen
            await self.channel_layer.group_add(
                self.channel_group_name,
                self.channel_name
            )
            await self.accept()

        except ObjectDoesNotExist:
            await self.close()
            return

    async def disconnect(self, close_code):
        # Benutzer aus der Kanalgruppe entfernen
        await self.channel_layer.group_discard(
            self.channel_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        action = text_data_json.get('type')  # 'type' statt 'action'
        message_id = text_data_json.get('message_id')
        reaction_type = text_data_json.get('reaction_type')  # Typ der Reaktion
        file_url = text_data_json.get('fileUrl')

        # Debugging-Ausgabe
        print(f'Empfangene Aktion: {action}')
        print(f'Nachricht ID: {message_id}')
        print(f'Reaktions Typ: {reaction_type}')

        if self.user.is_anonymous:
            await self.send(text_data=json.dumps({
                'error': 'Unauthorized user'
            }))
            return

        try:
            channel = await sync_to_async(Channel.objects.get)(id=self.channel_id)
        except ObjectDoesNotExist:
            await self.send(text_data=json.dumps({
                'error': 'Channel does not exist'
            }))
            return

        if action == 'edit':
            if not message_id and not file_url:
                await self.send(text_data=json.dumps({
                    'error': 'No message ID found'
                }))
                return

            new_content = text_data_json.get('message')
            if not new_content:
                await self.send(text_data=json.dumps({
                    'error': 'No message content found'
                }))
                return
            

            try:
                message = await sync_to_async(Message.objects.get)(id=message_id)
                message_sender = await sync_to_async(lambda: message.sender)()  # Hier asynchron den Sender abfragen
                if message_sender != self.user:
                    await self.send(text_data=json.dumps({
                        'error': 'Unauthorized to edit this message'
                    }))
                    return

                message.content = new_content
                await sync_to_async(message.save)()

                # Broadcast der aktualisierten Nachricht
                await self.channel_layer.group_send(
                    self.channel_group_name,
                    {
                        'type': 'chat_message',
                        'message': new_content,
                        'sender_id': self.user.id,
                        'sender': self.user.username,
                        'message_id': message_id,
                        'action': 'edit'
                    }
                )
            except Message.DoesNotExist:
                await self.send(text_data=json.dumps({
                    'error': 'Message not found'
                }))

        elif action == 'delete':
            if not message_id:
                await self.send(text_data=json.dumps({
                    'error': 'No message ID found'
                }))
                return

            try:
                # Überprüfe, ob die Nachricht existiert und im richtigen Kanal ist
                message = await sync_to_async(Message.objects.get)(id=message_id)

                # Überprüfe, ob der Benutzer die Nachricht löschen darf
                message_sender = await sync_to_async(lambda: message.sender)()  # Hier asynchron den Sender abfragen
                if message_sender != self.user:
                    await self.send(text_data=json.dumps({
                        'error': 'Unauthorized to delete this message'
                    }))
                    return

                # Nachricht löschen
                await sync_to_async(message.delete)()

                # Sende ein Lösch-Ereignis an die Kanalgruppe
                await self.channel_layer.group_send(
                    self.channel_group_name,
                    {
                        'type': 'chat_message',
                        'message_id': message_id,
                        'action': 'delete'
                    }
                )
            except Message.DoesNotExist:
                await self.send(text_data=json.dumps({
                    'error': 'Message not found'
                }))

        elif action == 'react':
            if not message_id or not reaction_type:
                await self.send(text_data=json.dumps({
                    'error': 'Missing message ID or reaction type'
                }))
                return

            try:
                message = await sync_to_async(Message.objects.get)(id=message_id)

                # Überprüfe, ob die Reaktion bereits existiert
                existing_reaction = await sync_to_async(lambda: Reaction.objects.filter(
                    user=self.user,
                    message=message,
                    reaction_type=reaction_type
                ).exists())()

                if existing_reaction:
                    await self.send(text_data=json.dumps({
                        'error': 'Reaction already exists'
                    }))
                    return

                # Füge die Reaktion hinzu
                await sync_to_async(Reaction.objects.create)(
                    user=self.user,
                    message=message,
                    reaction_type=reaction_type
                )

                # Sende die Reaktionsaktualisierung an die Kanalgruppe
                await self.channel_layer.group_send(
                    self.channel_group_name,
                    {
                        'type': 'chat_message',
                        'message_id': message_id,
                        'reaction_type': reaction_type,
                        'action': 'react', 
                        'sender_id': self.user.id  # Füge die user_id hinzu
                    }
                )

            except Message.DoesNotExist:
                await self.send(text_data=json.dumps({
                    'error': 'Message not found'
                }))

        else:  # Aktion 'new'
            message_content = text_data_json.get('message')
            file_url = text_data_json.get('fileUrl')
            
            if not message_content and not file_url:
                await self.send(text_data=json.dumps({
                    'error': 'No message content found'
                }))
                return

            message = await sync_to_async(Message.objects.create)(
                sender=self.user,
                channel=channel,
                content=message_content or '',
                file_url=file_url
            )

            # Nachricht an die Kanalgruppe senden
            await self.channel_layer.group_send(
                self.channel_group_name,
                {
                    'type': 'chat_message',
                    'message': message_content ,
                    'sender_id': self.user.id,
                    'sender': self.user.username,
                    'message_id': message.id,
                    'fileUrl': file_url,
                    'action': 'new'
                }
            )

    async def chat_message(self, event):
        message = event.get('message')
        sender = event.get('sender')
        sender_id = event.get('sender_id')
        action = event.get('action')
        message_id = event.get('message_id')
        reaction_type = event.get('reaction_type')  # Reaktionstyp
        file_url = event.get('fileUrl')  # Reaktionstyp

        # Nachricht an WebSocket senden
        await self.send(text_data=json.dumps({
            'message': message,
            'sender': sender,
            'sender_id': sender_id,
            'action': action,
            'message_id': message_id,
            'reaction_type': reaction_type,
            'fileUrl': file_url
        }))
