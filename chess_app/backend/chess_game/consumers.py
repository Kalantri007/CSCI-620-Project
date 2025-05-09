import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User, AnonymousUser

# Set up logging
logger = logging.getLogger(__name__)

class LobbyConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for handling real-time lobby and game communication.
    """
    async def connect(self):
        try:
            self.lobby_group_name = 'chess_lobby'
            
            # Join the lobby group
            await self.channel_layer.group_add(
                self.lobby_group_name,
                self.channel_name
            )
            
            # Join game-specific group if game_id is provided in the URL
            if 'url_route' in self.scope and 'kwargs' in self.scope['url_route'] and 'game_id' in self.scope['url_route']['kwargs']:
                self.game_id = self.scope['url_route']['kwargs']['game_id']
                # self.game_group_name = f'game_{self.game_id}'
                logger.info(f"Game ID detected in URL: {self.game_id}. Joining game group.")
                
                # Join the game group
                await self.channel_layer.group_add(
                    # self.game_group_name,
                    self.channel_name
                )

            await self.accept()
            
            logger.info(f"WebSocket connection accepted for user: {self.scope['user']}")
            
            # Send initial connection confirmation
            await self.send(text_data=json.dumps({
                'type': 'connection_established',
                'message': 'Connected to socket'
            }))
            
            # Notify about user connection
            if self.scope["user"].is_authenticated:
                username = self.scope["user"].username
                logger.info(f"User {username} connected")
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
                'message': 'Failed to connect properly'
            }))
            await self.close()

    async def disconnect(self, close_code):
        try:
            logger.info(f"Disconnecting, code: {close_code}, user: {self.scope['user']}")
            
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
            
            # Leave the game group if we joined one
            # if hasattr(self, 'game_group_name'):
            #     await self.channel_layer.group_discard(
            #         self.game_group_name,
            #         self.channel_name
            #     )
        except Exception as e:
            logger.error(f"Error in LobbyConsumer.disconnect: {str(e)}")

    async def receive(self, text_data):
        """
        Receive message from WebSocket and broadcast to the appropriate group
        """
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            logger.debug(f"Received {message_type} message from {self.scope['user']}")
            
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
            
            # Handle game-specific messages if in a game group
            elif message_type == 'move':
                
                # Send to game group for players in the game
                await self.channel_layer.group_send(
                    self.lobby_group_name,
                    {
                        'type': 'game_move',
                        # 'move': data.get('move'),
                        # 'player': data.get('player'),
                        # 'game_id': game_id,
                        'reload': True
                    }
                )
                
                # Also broadcast to lobby that a game has been updated
                await self.channel_layer.group_send(
                    self.lobby_group_name,
                    {
                        'type': 'game_updated',
                        # 'game_id': game_id,
                        'player': data.get('player'),
                        'move': data.get('move')
                    }
                )
            
            elif message_type == 'resign':
                game_id = data.get('game_id') or self.game_id
                
                # Handle game resignation for players in the game
                await self.channel_layer.group_send(
                    self.lobby_group_name,
                    {
                        'type': 'game_resign',
                        'player': data.get('player'),
                        'game_id': game_id
                    }
                )
                
                # Also broadcast to lobby that a game has been finished
                await self.channel_layer.group_send(
                    self.lobby_group_name,
                    {
                        'type': 'game_updated',
                        'game_id': game_id,
                        'status': 'finished',
                        'result': 'black_win' if data.get('player') == 'white' else 'white_win'
                    }
                )
        except Exception as e:
            logger.error(f"Error in LobbyConsumer.receive: {str(e)}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Error processing your message'
            }))

    # Lobby handler methods
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
            
    # Game handler methods
    async def game_move(self, event):
        """
        Send game move notification to WebSocket, telling client to reload
        """
        try:
            await self.send(text_data=json.dumps({
                'type': 'move',
                # 'move': event['move'],
                # 'player': event['player'],
                # 'game_id': event['game_id'],
                'reload': event.get('reload', True)
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
                'player': event['player'],
                'game_id': event['game_id']
            }))
        except Exception as e:
            logger.error(f"Error in game_resign: {str(e)}")
            
    async def game_updated(self, event):
        """
        Send game update notification to WebSocket
        """
        try:
            await self.send(text_data=json.dumps({
                'type': 'game_updated',
                'game_id': event['game_id'],
                **event  # Include all other event data
            }))
        except Exception as e:
            logger.error(f"Error in game_updated: {str(e)}")