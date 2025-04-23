from django.db import models
from django.contrib.auth.models import User
import uuid
import chess


GAME_STATUS_CHOICES = (
    ('pending', 'Pending'),
    ('active', 'Active'),
    ('finished', 'Finished'),
)

RESULT_CHOICES = (
    ('white_win', 'White Win'),
    ('black_win', 'Black Win'),
    ('draw', 'Draw'),
    ('in_progress', 'In Progress'),
)


class Game(models.Model):
    """
    Model representing a chess game between two players
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    white_player = models.ForeignKey(User, on_delete=models.CASCADE, related_name='white_games')
    black_player = models.ForeignKey(User, on_delete=models.CASCADE, related_name='black_games')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    status = models.CharField(max_length=10, choices=GAME_STATUS_CHOICES, default='pending')
    result = models.CharField(max_length=15, choices=RESULT_CHOICES, default='in_progress')
    fen = models.CharField(max_length=100, default=chess.STARTING_FEN)
    move_count = models.IntegerField(default=0)
    
    def __str__(self):
        return f"Game {self.id}: {self.white_player.username} vs {self.black_player.username}"
    
    @property
    def is_active(self):
        return self.status == 'active'
    
    @property
    def is_finished(self):
        return self.status == 'finished'
    
    def get_winner(self):
        if self.result == 'white_win':
            return self.white_player
        elif self.result == 'black_win':
            return self.black_player
        return None


class Move(models.Model):
    """
    Model representing a single move in a chess game
    """
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='moves')
    player = models.ForeignKey(User, on_delete=models.CASCADE)
    move_notation = models.CharField(max_length=10)  # SAN notation (e.g., "e4", "Nf3")
    fen_after_move = models.CharField(max_length=100)
    timestamp = models.DateTimeField(auto_now_add=True)
    move_number = models.IntegerField()
    
    class Meta:
        ordering = ['move_number']
    
    def __str__(self):
        return f"Move {self.move_number}: {self.move_notation} by {self.player.username}"


class GameInvitation(models.Model):
    """
    Model representing an invitation to play a chess game
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_invitations')
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_invitations')
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=10, choices=(
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
    ), default='pending')
    game = models.OneToOneField(Game, on_delete=models.CASCADE, null=True, blank=True)
    
    def __str__(self):
        return f"Invitation from {self.sender.username} to {self.recipient.username}"
    
    def accept(self):
        """Accept the invitation and create a new game"""
        if self.status == 'pending':
            self.status = 'accepted'
            # Create a new game
            game = Game.objects.create(
                white_player=self.sender,
                black_player=self.recipient,
                status='active'
            )
            self.game = game
            self.save()
            return game
        return None
    
    def decline(self):
        """Decline the invitation"""
        if self.status == 'pending':
            self.status = 'declined'
            self.save()
            return True
        return False
