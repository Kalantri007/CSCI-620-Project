import React, { useState, useEffect, useCallback } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import '../styles/ChessBoard.css';

const ChessBoard = ({ position = 'start', onMove, orientation = 'white' }) => {
  const [game, setGame] = useState(new Chess(position));
  const [boardOrientation, setBoardOrientation] = useState(orientation);
  const [moveFrom, setMoveFrom] = useState('');
  const [moveTo, setMoveTo] = useState(null);
  const [showPromotionDialog, setShowPromotionDialog] = useState(false);
  const [highlightedSquares, setHighlightedSquares] = useState({});
  const [moveHistory, setMoveHistory] = useState([]);

  // Reset game state when position changes externally
  useEffect(() => {
    try {
      // Update the chess position when the FEN string changes
      if (position !== 'start' && position !== game.fen()) {
        const newGame = new Chess(position);
        setGame(newGame);
        setMoveHistory(newGame.history({ verbose: true }));
      }
      
      // Update orientation if it changes
      if (orientation !== boardOrientation) {
        setBoardOrientation(orientation);
      }
    } catch (error) {
      console.error('Invalid position:', error);
    }
  }, [position, orientation, game, boardOrientation]);

  // Handle the piece move
  const onDrop = (sourceSquare, targetSquare) => {
    try {
      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q', // always promote to queen for simplicity
      });

      if (move === null) return false; // illegal move

      setGame(new Chess(game.fen()));
      setMoveHistory(game.history({ verbose: true }));

      // Highlight squares involved in the move
      setHighlightedSquares({
        [sourceSquare]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' },
        [targetSquare]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' },
      });

      // Call the onMove callback with the move information
      if (onMove) {
        onMove({
          from: sourceSquare,
          to: targetSquare,
          promotion: 'q',
          fen: game.fen(),
          san: move.san
        });
      }
      
      return true;
    } catch (error) {
      return false;
    }
  };

  return (
    <div className="chess-board">
      <Chessboard 
        position={game.fen()} 
        onPieceDrop={onDrop}
        boardOrientation={boardOrientation}
        customBoardStyle={{
          borderRadius: '4px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)'
        }}
        customSquareStyles={highlightedSquares}
        id="chess-board"
      />

      <div className="game-status">
        {game.isCheckmate() ? 'Checkmate!' : 
          game.isDraw() ? 'Draw!' :
            game.isCheck() ? 'Check!' : ''}
      </div>
    </div>
  );
};

export default ChessBoard;
