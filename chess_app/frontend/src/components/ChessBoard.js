import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';

const ChessBoard = ({ position = 'start', onMove, orientation = 'white' }) => {
  const [game, setGame] = useState(new Chess(position));
  const [boardOrientation, setBoardOrientation] = useState(orientation);

  useEffect(() => {
    // Update the chess position when the FEN string changes
    if (position !== 'start' && position !== game.fen()) {
      setGame(new Chess(position));
    }
    
    // Update orientation if it changes
    if (orientation !== boardOrientation) {
      setBoardOrientation(orientation);
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
