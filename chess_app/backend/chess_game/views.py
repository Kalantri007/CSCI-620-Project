from django.shortcuts import render
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q
from django.contrib.auth.models import User
from .models import Game, Move, GameInvitation
from .serializers import (
    GameSerializer, MoveSerializer, GameInvitationSerializer,
    GameCreateSerializer, MoveCreateSerializer, GameInvitationCreateSerializer,
    UserSerializer
)
import chess


class GameViewSet(viewsets.ModelViewSet):
    """
    A viewset for viewing and editing game instances.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = GameSerializer
    
    def get_queryset(self):
        """Return games where the user is a player"""
        user = self.request.user
        return Game.objects.filter(
            Q(white_player=user) | Q(black_player=user)
        ).order_by('-created_at')
    
    def get_serializer_class(self):
        if self.action in ['create', 'update']:
            return GameCreateSerializer
        return GameSerializer
    

class MoveViewSet(viewsets.ModelViewSet):
    """
    A viewset for viewing and creating moves.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = MoveSerializer
    
    def get_queryset(self):
        """Return moves for a specific game"""
        game_id = self.request.query_params.get('game')
        if game_id:
            return Move.objects.filter(game_id=game_id).order_by('move_number')
        return Move.objects.none()
    
    def get_serializer_class(self):
        if self.action in ['create']:
            return MoveCreateSerializer
        return MoveSerializer
    
    def create(self, request, *args, **kwargs):
        """
        Create a new move for a game after validating it.
        """
        serializer = MoveCreateSerializer(data=request.data)
        
        if serializer.is_valid():
            game_id = serializer.validated_data.get('game').id
            move_notation = serializer.validated_data.get('move_notation')
            
            # Get the game object
            try:
                game = Game.objects.get(id=game_id)
            except Game.DoesNotExist:
                return Response({"error": "Game not found"}, status=status.HTTP_404_NOT_FOUND)
                
            # Check if the user is a player in this game
            if request.user != game.white_player and request.user != game.black_player:
                return Response({"error": "You are not a player in this game"}, 
                                status=status.HTTP_403_FORBIDDEN)
            
            # Check if the game is active
            if game.status != 'active':
                return Response({"error": "Game is not active"}, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if it's the user's turn
            current_board = chess.Board(game.fen)
            is_white_turn = current_board.turn == chess.WHITE
            
            if (is_white_turn and request.user != game.white_player) or \
               (not is_white_turn and request.user != game.black_player):
                return Response({"error": "It's not your turn"}, status=status.HTTP_400_BAD_REQUEST)
                
            # Validate and apply the move
            try:
                # Convert SAN notation to UCI if needed
                move = current_board.parse_san(move_notation)
                move_uci = move.uci()
                
                # Apply the move
                current_board.push(move)
                new_fen = current_board.fen()
                
                # Save the move
                new_move = Move.objects.create(
                    game=game,
                    player=request.user,
                    move_notation=move_notation,
                    fen_after_move=new_fen,
                    move_number=game.move_count + 1
                )
                
                # Update game state
                game.fen = new_fen
                game.move_count += 1
                
                # Check for game end conditions
                if current_board.is_checkmate():
                    game.status = 'finished'
                    game.result = 'white_win' if not is_white_turn else 'black_win'
                elif current_board.is_stalemate() or current_board.is_insufficient_material():
                    game.status = 'finished'
                    game.result = 'draw'
                
                game.save()
                
                return Response(MoveSerializer(new_move).data, status=status.HTTP_201_CREATED)
                
            except Exception as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        

class GameInvitationViewSet(viewsets.ModelViewSet):
    """
    A viewset for viewing and creating game invitations.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = GameInvitationSerializer
    
    def get_queryset(self):
        """Return invitations where the user is a sender or recipient"""
        user = self.request.user
        return GameInvitation.objects.filter(
            Q(sender=user) | Q(recipient=user)
        ).order_by('-created_at')
    
    def get_serializer_class(self):
        if self.action in ['create']:
            return GameInvitationCreateSerializer
        return GameInvitationSerializer
    
    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def accept_invitation(request, invitation_id):
    """
    Accept a game invitation and create a new game.
    """
    try:
        invitation = GameInvitation.objects.get(id=invitation_id)
        
        # Check if the user is the recipient of the invitation
        if request.user != invitation.recipient:
            return Response({"error": "You are not the recipient of this invitation"},
                           status=status.HTTP_403_FORBIDDEN)
        
        # Check if the invitation is pending
        if invitation.status != 'pending':
            return Response({"error": "This invitation has already been processed"},
                           status=status.HTTP_400_BAD_REQUEST)
        
        # Accept invitation and create a new game
        game = invitation.accept()
        if game:
            return Response(GameSerializer(game).data, status=status.HTTP_201_CREATED)
        else:
            return Response({"error": "Failed to accept invitation"}, 
                           status=status.HTTP_400_BAD_REQUEST)
        
    except GameInvitation.DoesNotExist:
        return Response({"error": "Invitation not found"}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def decline_invitation(request, invitation_id):
    """
    Decline a game invitation.
    """
    try:
        invitation = GameInvitation.objects.get(id=invitation_id)
        
        # Check if the user is the recipient of the invitation
        if request.user != invitation.recipient:
            return Response({"error": "You are not the recipient of this invitation"},
                           status=status.HTTP_403_FORBIDDEN)
        
        # Check if the invitation is pending
        if invitation.status != 'pending':
            return Response({"error": "This invitation has already been processed"},
                           status=status.HTTP_400_BAD_REQUEST)
        
        # Decline invitation
        if invitation.decline():
            return Response({"message": "Invitation declined"}, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Failed to decline invitation"}, 
                           status=status.HTTP_400_BAD_REQUEST)
        
    except GameInvitation.DoesNotExist:
        return Response({"error": "Invitation not found"}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def resign_game(request, game_id):
    """
    Resign from a game.
    """
    try:
        game = Game.objects.get(id=game_id)
        
        # Check if the user is a player in the game
        if request.user != game.white_player and request.user != game.black_player:
            return Response({"error": "You are not a player in this game"},
                           status=status.HTTP_403_FORBIDDEN)
        
        # Check if the game is active
        if game.status != 'active':
            return Response({"error": "This game is not active"},
                           status=status.HTTP_400_BAD_REQUEST)
        
        # Update game status and result
        game.status = 'finished'
        game.result = 'black_win' if request.user == game.white_player else 'white_win'
        game.save()
        
        return Response(GameSerializer(game).data, status=status.HTTP_200_OK)
        
    except Game.DoesNotExist:
        return Response({"error": "Game not found"}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def active_players(request):
    """
    Get a list of active users who are online and available for a game.
    """
    # In a more sophisticated implementation, this would use a presence system
    # For now, we'll just return all users except the current user
    users = User.objects.exclude(id=request.user.id)
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_active_game(request):
    """
    Get the user's current active game if any exists.
    """
    user = request.user
    active_game = Game.objects.filter(
        Q(white_player=user) | Q(black_player=user),
        status='active'
    ).first()
    
    if active_game:
        serializer = GameSerializer(active_game)
        return Response(serializer.data)
    else:
        return Response({"message": "No active game found"}, status=status.HTTP_404_NOT_FOUND)
