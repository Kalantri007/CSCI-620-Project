from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Game, Move, GameInvitation


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']


class MoveSerializer(serializers.ModelSerializer):
    player = UserSerializer(read_only=True)
    
    class Meta:
        model = Move
        fields = ['id', 'game', 'player', 'move_notation', 'fen_after_move', 'move_number', 'timestamp']


class GameSerializer(serializers.ModelSerializer):
    white_player = UserSerializer(read_only=True)
    black_player = UserSerializer(read_only=True)
    moves = MoveSerializer(many=True, read_only=True)
    
    class Meta:
        model = Game
        fields = ['id', 'white_player', 'black_player', 'created_at', 'updated_at', 
                  'status', 'result', 'fen', 'move_count', 'moves']


class GameInvitationSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    recipient = UserSerializer(read_only=True)
    
    class Meta:
        model = GameInvitation
        fields = ['id', 'sender', 'recipient', 'created_at', 'status', 'game']


class GameCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Game
        fields = ['white_player', 'black_player']


class GameInvitationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = GameInvitation
        fields = ['recipient']


class MoveCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Move
        fields = ['game', 'move_notation']