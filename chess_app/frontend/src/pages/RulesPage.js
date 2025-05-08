import React from 'react';
import Navigation from '../components/Navigation';
import '../styles/InfoPages.css';

const RulesPage = () => {
  // Get auth status from localStorage (same as HomePage)
  const isAuthenticated = localStorage.getItem('authToken') !== null;
  const username = localStorage.getItem('username');
  
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    window.location.href = '/';
  };

  return (
    <div className="page-container">
      <Navigation 
        isAuthenticated={isAuthenticated} 
        username={username}
        onLogout={handleLogout}
      />
      
      <div className="content-container">
        <h1>Chess Rules</h1>
        
        <section className="info-section">
          <h2>The Board and Pieces</h2>
          <p>
            Chess is played on a square board divided into 64 squares (8×8) of alternating colors, 
            typically light and dark. At the beginning of the game, each player controls 16 pieces:
          </p>
          <ul>
            <li><strong>1 King</strong> - Moves one square in any direction</li>
            <li><strong>1 Queen</strong> - Moves any number of squares diagonally, horizontally, or vertically</li>
            <li><strong>2 Rooks</strong> - Move any number of squares horizontally or vertically</li>
            <li><strong>2 Bishops</strong> - Move any number of squares diagonally</li>
            <li><strong>2 Knights</strong> - Move in an 'L' shape: two squares horizontally or vertically and then one square at a right angle</li>
            <li><strong>8 Pawns</strong> - Move one square forward, or two squares from their starting position; capture diagonally</li>
          </ul>
        </section>
        
        <section className="info-section">
          <h2>Setup</h2>
          <p>
            The board is placed so that each player has a white square at their right-hand corner. 
            The pieces are set up as follows (from left to right) in the first row: Rook, Knight, 
            Bishop, Queen, King, Bishop, Knight, Rook. The second row is filled with pawns.
          </p>
          <p>
            White always moves first, and players take turns moving one piece at a time. A piece 
            cannot move through other pieces and can only capture opponent's pieces by landing on their square.
          </p>
        </section>
        
        <section className="info-section">
          <h2>Special Moves</h2>
          <p><strong>Castling:</strong> The king moves two squares towards a rook, and the rook moves to the square the king crossed. Conditions:</p>
          <ul>
            <li>Neither the king nor the rook has moved</li>
            <li>No pieces between the king and the rook</li>
            <li>The king is not in check, and doesn't pass through or end up in check</li>
          </ul>
          
          <p><strong>En Passant:</strong> If a pawn advances two squares on its first move and lands beside an opponent's pawn, 
          the opponent's pawn can capture it as if it had only moved one square.</p>
          
          <p><strong>Pawn Promotion:</strong> When a pawn reaches the opposite end of the board, it can be 
          promoted to any other piece (usually a queen).</p>
        </section>
        
        <section className="info-section">
          <h2>Check and Checkmate</h2>
          <p>
            <strong>Check:</strong> When a king is under threat of capture, it is in "check." A player must get out of check 
            by moving the king, blocking the attack, or capturing the attacking piece.
          </p>
          <p>
            <strong>Checkmate:</strong> When a king is in check and there is no legal move to escape, it's "checkmate" 
            and the game is over. The player whose king is checkmated loses.
          </p>
          <p>
            <strong>Stalemate:</strong> If a player has no legal moves and their king is not in check, 
            the game is a draw (stalemate).
          </p>
        </section>
        
        <section className="info-section">
          <h2>Other Draw Conditions</h2>
          <ul>
            <li><strong>Threefold Repetition:</strong> If the same position occurs three times, a player can claim a draw</li>
            <li><strong>Fifty-Move Rule:</strong> If 50 moves have been played without a pawn move or a capture, a player can claim a draw</li>
            <li><strong>Insufficient Material:</strong> When neither player has enough pieces to deliver checkmate (e.g., king vs. king)</li>
            <li><strong>Agreement:</strong> Players can agree to a draw at any time</li>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default RulesPage;