import React from 'react';
import Navigation from '../components/Navigation/Navigation';
import '../styles/StaticPages.css';

const RulesPage = () => {
  return (
    <div className="page-container">
      <Navigation />
      <div className="content-container">
        <h1>Chess Rules</h1>
        
        <section className="rules-section">
          <h2>The Chess Board</h2>
          <p>
            The chessboard is an 8x8 grid with alternating light and dark squares.
            The board is positioned so that each player has a light-colored square in the bottom right corner.
            Each player starts with 16 pieces: one king, one queen, two rooks, two knights, two bishops, and eight pawns.
          </p>
        </section>
        
        <section className="rules-section">
          <h2>How the Pieces Move</h2>
          
          <h3>King</h3>
          <p>The king can move one square in any direction (horizontally, vertically, or diagonally).</p>
          
          <h3>Queen</h3>
          <p>The queen can move any number of squares along a rank, file, or diagonal.</p>
          
          <h3>Rook</h3>
          <p>The rook can move any number of squares along a rank or file.</p>
          
          <h3>Bishop</h3>
          <p>The bishop can move any number of squares diagonally.</p>
          
          <h3>Knight</h3>
          <p>The knight moves in an "L" shape: two squares in a straight line, then one square at a 90-degree angle.</p>
          
          <h3>Pawn</h3>
          <p>
            Pawns move forward one square, but on their first move, they can move forward two squares.
            Pawns capture diagonally forward one square.
            When a pawn reaches the opposite end of the board, it can be promoted to any other piece (usually a queen).
          </p>
        </section>
        
        <section className="rules-section">
          <h2>Special Rules</h2>
          
          <h3>Castling</h3>
          <p>
            Castling is a special move involving the king and either rook. It's the only time you can move two pieces in one turn.
            The king moves two squares towards the rook, and the rook moves to the square the king crossed.
          </p>
          
          <h3>En Passant</h3>
          <p>
            If a pawn advances two squares on its first move and lands beside an opponent's pawn,
            the opponent's pawn can capture it as if it had only moved one square forward.
          </p>
          
          <h3>Pawn Promotion</h3>
          <p>
            When a pawn reaches the eighth rank, it must be promoted to a queen, rook, bishop, or knight of the same color.
          </p>
        </section>
        
        <section className="rules-section">
          <h2>End of the Game</h2>
          
          <h3>Checkmate</h3>
          <p>
            The game is won by the player who checkmates the opponent's king.
            This happens when the king is in check and there is no legal move to escape the check.
          </p>
          
          <h3>Stalemate</h3>
          <p>
            The game is drawn when the player to move has no legal move and their king is not in check.
          </p>
          
          <h3>Draw</h3>
          <p>
            The game can also end in a draw by agreement, threefold repetition, the fifty-move rule,
            or insufficient material to checkmate.
          </p>
        </section>
      </div>
    </div>
  );
};

export default RulesPage;