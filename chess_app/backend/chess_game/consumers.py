import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User, AnonymousUser


# Set up logging
logger = logging.getLogger(__name__)


class ChessGameConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for handling real-time chess game communication.
    """
    async def connect(self):
        try:
            self.user = self.scope["user"]
            self.game_id = self.scope['url_route']['kwargs']['game_id']
            self.game_group_name = f'game_{self.game_id}'
            
            logger.info(f"Attempting connection to game {self.game_id} by user {self.user}")
            
            # Join the game group
            await self.channel_layer.group_add(
                self.game_group_name,
                self.channel_name
            )

            # Accept the connection
            await self.accept()
            logger.info(f"WebSocket connection accepted for game {self.game_id}, user {self.user}")
            
            # Send initial game state message
            await self.send(text_data=json.dumps({
                'type': 'connection_established',
                'message': 'Connected to game socket'
            }))
            
        except Exception as e:
            logger.error(f"Error in ChessGameConsumer.connect: {str(e)}")
            # Still accept the connection but report the error
            if not hasattr(self, 'channel_name'):
                # If we haven't gotten far enough to set up channel name, we can't proceed
                return
                
            await self.accept()
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Failed to connect to game properly'
            }))
            await self.close()

    async def disconnect(self, close_code):
        # Leave the game group
        try:
            logger.info(f"Disconnecting from game {self.game_id}, code: {close_code}")
            await self.channel_layer.group_discard(
                self.game_group_name,
                self.channel_name
            )
        except Exception as e:
            logger.error(f"Error in disconnect: {str(e)}")

    async def receive(self, text_data):
        """
        Receive message from WebSocket and broadcast to the game group
        """
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            logger.debug(f"Received {message_type} message in game {self.game_id}")
            
            # Handle different message types
            if message_type == 'move':
                # Process chess move
                await self.channel_layer.group_send(
                    self.game_group_name,
                    {
                        'type': 'game_move',
                        'move': data.get('move'),
                        'player': data.get('player'),
                        'fen': data.get('fen')
                    }
                )
            elif message_type == 'resign':
                # Handle game resignation
                await self.channel_layer.group_send(
                    self.game_group_name,
                    {
                        'type': 'game_resign',
                        'player': data.get('player')
                    }
                )
        except Exception as e:
            logger.error(f"Error in receive: {str(e)}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Error processing your message'
            }))

    async def game_move(self, event):
        """
        Send game move to WebSocket
        """
        try:
            await self.send(text_data=json.dumps({
                'type': 'move',
                'move': event['move'],
                'player': event['player'],
                'fen': event['fen']
            }))
        except Exception as e:
            logger.error(f"Error in game_move: {str(e)}")

    async def game_resign(self, event):
        """
        Send game resignation to WebSocket
        """
        try:
            await self.send(text_data=json.dumps({
                'type': 'resign',
                'player': event['player']
            }))
        except Exception as e:
            logger.error(f"Error in game_resign: {str(e)}")


class LobbyConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for handling real-time lobby communication.
    """
    async def connect(self):
        try:
            self.lobby_group_name = 'chess_lobby'
            
            # Join the lobby group
            await self.channel_layer.group_add(
                self.lobby_group_name,
                self.channel_name
            )

            await self.accept()
            
            logger.info(f"WebSocket connection accepted for lobby, user: {self.scope['user']}")
            
            # Send initial connection confirmation
            await self.send(text_data=json.dumps({
                'type': 'connection_established',
                'message': 'Connected to lobby socket'
            }))
            
            # Notify about user connection
            if self.scope["user"].is_authenticated:
                username = self.scope["user"].username
                logger.info(f"User {username} connected to lobby")
                await self.channel_layer.group_send(
                    self.lobby_group_name,
                    {
                        "type": "user_online",
                        "username": username
                    }
                )
        except Exception as e:
            logger.error(f"Error in LobbyConsumer.connect: {str(e)}")
            # Still try to accept the connection but report the error
            if not hasattr(self, 'channel_name'):
                # If we haven't gotten far enough to set up channel name, we can't proceed
                return
                
            await self.accept()
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Failed to connect to lobby properly'
            }))
            await self.close()

    async def disconnect(self, close_code):
        try:
            logger.info(f"Disconnecting from lobby, code: {close_code}, user: {self.scope['user']}")
            
            # Notify about user disconnection
            if self.scope["user"].is_authenticated:
                username = self.scope["user"].username
                await self.channel_layer.group_send(
                    self.lobby_group_name,
                    {
                        "type": "user_offline",
                        "username": username
                    }
                )
            
            # Leave the lobby group
            await self.channel_layer.group_discard(
                self.lobby_group_name,
                self.channel_name
            )
        except Exception as e:
            logger.error(f"Error in LobbyConsumer.disconnect: {str(e)}")

    async def receive(self, text_data):
        """
        Receive message from WebSocket and broadcast to the lobby group
        """
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            logger.debug(f"Received {message_type} message in lobby from {self.scope['user']}")
            
            # Handle different message types
            if message_type == 'challenge':
                # Process game challenge
                await self.channel_layer.group_send(
                    self.lobby_group_name,
                    {
                        'type': 'game_challenge',
                        'challenger': data.get('challenger'),
                        'challenged': data.get('challenged'),
                        'game_id': data.get('game_id')
                    }
                )
            
            elif message_type == 'challenge_response':
                # Process challenge response
                await self.channel_layer.group_send(
                    self.lobby_group_name,
                    {
                        'type': 'challenge_response',
                        'accepted': data.get('accepted'),
                        'challenger': data.get('challenger'),
                        'challenged': data.get('challenged'),
                        'game_id': data.get('game_id')
                    }
                )
        except Exception as e:
            logger.error(f"Error in LobbyConsumer.receive: {str(e)}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Error processing your message'
            }))

    async def user_online(self, event):
        """
        Send user online notification to WebSocket
        """
        try:
            await self.send(text_data=json.dumps({
                'type': 'user_online',
                'username': event['username']
            }))
        except Exception as e:
            logger.error(f"Error in user_online: {str(e)}")

    async def user_offline(self, event):
        """
        Send user offline notification to WebSocket
        """
        try:
            await self.send(text_data=json.dumps({
                'type': 'user_offline',
                'username': event['username']
            }))
        except Exception as e:
            logger.error(f"Error in user_offline: {str(e)}")

    async def game_challenge(self, event):
        """
        Send game challenge to WebSocket
        """
        try:
            await self.send(text_data=json.dumps({
                'type': 'challenge',
                'challenger': event['challenger'],
                'challenged': event['challenged'],
                'game_id': event['game_id']
            }))
        except Exception as e:
            logger.error(f"Error in game_challenge: {str(e)}")

    async def challenge_response(self, event):
        """
        Send challenge response to WebSocket
        """
        try:
            await self.send(text_data=json.dumps({
                'type': 'challenge_response',
                'accepted': event['accepted'],
                'challenger': event['challenger'],
                'challenged': event['challenged'],
                'game_id': event['game_id']
            }))
        except Exception as e:
            logger.error(f"Error in challenge_response: {str(e)}")