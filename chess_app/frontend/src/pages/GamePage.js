import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ChessBoard from '../components/ChessBoard';
import api, { API_BASE_URL } from '../services/api';
import '../styles/GamePage.css';

const GamePage = () => {
  const { gameId } = useParams();
  const [gameData, setGameData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userColor, setUserColor] = useState('white');
  const [moveHistory, setMoveHistory] = useState([]);
  const [gameStatus, setGameStatus] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [opponentUsername, setOpponentUsername] = useState('');

  const navigate = useNavigate();
  const websocket = useRef(null);

  useEffect(() => {
    // Function to fetch game data from the backend
    const fetchGameData = async () => {
      try {
        const data = await api.getGame(gameId);
        setGameData(data);
        setMoveHistory(data.moves);
        
        // Determine user's color and opponent
        const currentUser = localStorage.getItem('username');
        if (currentUser === data.white_player.username) {
          setUserColor('white');
          setOpponentUsername(data.black_player.username);
        } else {
          setUserColor('black');
          setOpponentUsername(data.white_player.username);
        }

        // Set game status
        setGameStatus(data.status);
        updateStatusMessage(data.status, data.result);
        
        setLoading(false);
      } catch (err) {
        setError(err.message || 'An error occurred while loading the game');
        setLoading(false);
      }
    };

    fetchGameData();

    // Set up WebSocket connection for real-time game updates
    const setupWebSocket = () => {
      const wsScheme = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
      const token = localStorage.getItem('authToken');
      
      // Hardcode backend host:port for Django
      const { host } = new URL(API_BASE_URL);

      
      // Connect to the lobby WebSocket endpoint only
      const gameSocket = new WebSocket(`${wsScheme}${host}/ws/lobby/?token=${token}`);

      
      let reconnectAttempts = 0;
      let reconnectTimer = null;
      const maxReconnectAttempts = 5;
      
      gameSocket.onopen = () => {
        console.log('WebSocket connection established');
        reconnectAttempts = 0; // Reset reconnect attempts on successful connection
        
        // Clear any reconnect timers if we connected successfully
        if (reconnectTimer) {
          clearTimeout(reconnectTimer);
          reconnectTimer = null;
        }
        
        setError(null); // Clear any previous connection errors
      };

      gameSocket.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          console.log('Received WebSocket message:', data);
          
          if (data.type === 'connection_established') {
            console.log('WebSocket connection confirmed by server');
          } else if (data.type === 'error') {
            setError(`Server error: ${data.message}`);
          } else if (data.type === 'move') {
            // If reload flag is true, fetch fresh game data
            //if (data.game_id !== gameId) return; // Ignore messages for other games

            if (data.reload) {
              console.log('Reloading game data after move');
              fetchGameData();
            } else {
              // Update game state with new move
              console.log('Received move:', data.move);
              
              // Force a re-render by creating a new object reference
              setGameData(prevGameData => {
                if (!prevGameData) return null;
                
                // Create a new move object in the format your app expects
                const newMove = {
                  move_notation: data.move,
                  from_player: data.player
                };
                
                const updatedMoves = [...prevGameData.moves, newMove];
                
                // Update game data with the new move
                return {
                  ...prevGameData,
                  moves: updatedMoves
                };
              });
              
              // Also update move history state separately to ensure UI updates
              setMoveHistory(prevMoves => [
                ...prevMoves, 
                {
                  move_notation: data.move,
                  from_player: data.player
                }
              ]);
            }
            
            // Force-update the status message if the game state has changed
            if (data.game_status) {
              setGameStatus(data.game_status);
              updateStatusMessage(data.game_status, data.result);
            }
          } else if (data.type === 'game_update') {
            // Update entire game state
            console.log('Received game update:', data.game);
            setGameData(data.game);
            setMoveHistory(data.game.moves);
            updateStatusMessage(data.game.status, data.game.result);
          } else if (data.type === 'resign') {
            // Handle resignation
            setGameData(prevGameData => {
              if (!prevGameData) return null;
              
              const updatedGameData = {
                ...prevGameData,
                status: 'finished',
                result: data.player === 'white' ? 'black_win' : 'white_win'
              };
              
              // Update status message
              updateStatusMessage('finished', updatedGameData.result);
              
              return updatedGameData;
            });
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
          // Continue operation even if a single message fails to parse
        }
      };

      gameSocket.onclose = (e) => {
        console.warn('WebSocket connection closed:', e);
        
        // Only attempt to reconnect if it wasn't a normal closure and we haven't exceeded max attempts
        if (e.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++;
          
          // Calculate delay with exponential backoff (1s, 2s, 4s, etc.)
          const delay = Math.min(1000 * (2 ** reconnectAttempts), 30000);
          
          setError(`Connection to game server lost. Attempting to reconnect... (Attempt ${reconnectAttempts}/${maxReconnectAttempts})`);
          console.log(`Attempting to reconnect in ${delay/1000} seconds... (Attempt ${reconnectAttempts}/${maxReconnectAttempts})`);
          
          reconnectTimer = setTimeout(() => {
            console.log('Attempting to reconnect to game WebSocket...');
            if (websocket.current) {
              websocket.current = setupWebSocket();
            }
          }, delay);
        } else if (reconnectAttempts >= maxReconnectAttempts) {
          setError(`Connection to game server lost. Max reconnection attempts (${maxReconnectAttempts}) reached. Please refresh the page.`);
        }
      };

      gameSocket.onerror = (err) => {
        console.error('WebSocket error:', err);
        // Don't set error message here as onclose will be called right after
      };
      
      return gameSocket;
    };

    // Setup WebSocket and store reference
    websocket.current = setupWebSocket();

    // Clean up function
    return () => {
      if (websocket.current && websocket.current.readyState === WebSocket.OPEN) {
        websocket.current.close(1000, "Component unmounting");
      }
    };
  }, [gameId]);

  const updateStatusMessage = (status, result) => {
    if (status === 'finished') {
      if (result === 'white_win') {
        setStatusMessage('White wins!');
      } else if (result === 'black_win') {
        setStatusMessage('Black wins!');
      } else if (result === 'draw') {
        setStatusMessage('Game ended in a draw');
      }
    } else if (status === 'active') {
      setStatusMessage('Game in progress');
    } else {
      setStatusMessage('Waiting for players');
    }
  };

  const handleMove = async (move) => {
    try {
      // Send move to backend
      const response = await api.makeMove(gameId, move);
  
      // Immediately update gameData with new move and FEN
      setGameData(prevGameData => {
        if (!prevGameData) return null;
  
        const newMove = {
          move_notation: response.move_notation,
          from_player: response.player.username
        };
  
        return {
          ...prevGameData,
          fen: response.fen_after_move,
          current_turn: response.fen_after_move.split(' ')[1] === 'w' ? 'white' : 'black',
          moves: [...prevGameData.moves, newMove]
        };
      });
  
      setMoveHistory(prevMoves => [
        ...prevMoves,
        {
          move_notation: response.move_notation,
          from_player: response.player.username
        }
      ]);
      
      // Send websocket notification about the move
      if (websocket.current && websocket.current.readyState === WebSocket.OPEN) {
        websocket.current.send(JSON.stringify({
          type: 'move',
          move: response.move_notation,
          player: response.player.username,
          game_id: gameId
        }));
      }
      
    } catch (err) {
      setError('Failed to submit move. Please try again.');
      console.error(err);
    }
  };
  

  const handleResign = async () => {
    if (window.confirm('Are you sure you want to resign this game?')) {
      try {
        await api.resignGame(gameId);
        
        // Send websocket notification about resignation
        if (websocket.current && websocket.current.readyState === WebSocket.OPEN) {
          const currentUser = localStorage.getItem('username');
          const playerColor = userColor; // We already determined this earlier
          
          websocket.current.send(JSON.stringify({
            type: 'resign',
            player: playerColor,
            game_id: gameId
          }));
        }
      } catch (err) {
        setError('Failed to resign. Please try again.');
        console.error(err);
      }
    }
  };

  const handleGoToHome = () => {
    navigate('/');
  };

  if (loading) return <div className="loading">Loading game...</div>;
  if (error) return <div className="error-message">Error: {error}</div>;
  if (!gameData) return <div className="error-message">Game not found</div>;

  return (
    <div className="game-page">
      <div className="game-header">
        <h1>Chess Game</h1>
        <div className="game-info">
          <div className="players-info">
            <div className="player-info">
              <strong>White:</strong> {gameData.white_player.username}
            </div>
            <div className="player-info">
              <strong>Black:</strong> {gameData.black_player.username}
            </div>
          </div>
          <div className="status-info">
            <div className="game-status">{statusMessage}</div>
            {gameData.status === 'active' && (
              <div className="current-turn">
                {gameData.fen.split(' ')[1] === 'w' ? "White's turn" : "Black's turn"}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="game-board-container">
        <ChessBoard 
          position={gameData.fen}
          onMove={handleMove}
          orientation={userColor}
        />
      </div>
      
      <div className="game-controls">
        {gameData.status === 'active' && (
          <button className="resign-button" onClick={handleResign}>Resign</button>
        )}
        <button className="home-button" onClick={handleGoToHome}>Back to Home</button>
      </div>
      
      <div className="game-history">
        <h3>Move History</h3>
        <div className="move-list">
          {moveHistory.length > 0 ? (
            <ol>
              {moveHistory.map((move, index) => (
                <li key={index}>{move.move_notation}</li>
              ))}
            </ol>
          ) : (
            <p>No moves yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default GamePage;
