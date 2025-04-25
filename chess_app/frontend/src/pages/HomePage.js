import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/HomePage.css';

const HomePage = () => {
  const [games, setGames] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [showNewGameModal, setShowNewGameModal] = useState(false);
  const [lobbySocket, setLobbySocket] = useState(null);
  
  const navigate = useNavigate();

  const setupLobbyWebSocket = () => {
    const wsScheme = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
    const token = localStorage.getItem('authToken');
    
    // Include token in WebSocket URL for authentication
    const socket = new WebSocket(`${wsScheme}127.0.0.1:8000/ws/lobby/?token=${token}`);
    
    let reconnectAttempts = 0;
    let reconnectTimer = null;
    const maxReconnectAttempts = 5;
    
    socket.onopen = () => {
      console.log('Lobby WebSocket connected');
      reconnectAttempts = 0; // Reset reconnect attempts on successful connection
      
      // Clear any reconnect timers if we connected successfully
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    };
    
    socket.onmessage = (e) => {
      const data = JSON.parse(e.data);
      console.log('Received lobby message:', data);
      
      if (data.type === 'connection_established') {
        console.log('WebSocket connection confirmed by server');
      } else if (data.type === 'error') {
        console.error('Server error:', data.message);
      } else if (data.type === 'challenge') {
        // Received a game challenge
        fetchInvitations(); // Refresh invitations list
      } else if (data.type === 'challenge_response') {
        // Someone responded to a challenge
        fetchGames(); // Refresh games list
        fetchInvitations(); // Refresh invitations list
      } else if (data.type === 'user_online' || data.type === 'user_offline') {
        // User status changed
        fetchUsers(); // Refresh users list
      }
    };
    
    socket.onclose = (e) => {
      console.log('Lobby WebSocket disconnected');
      
      // Only attempt to reconnect if it wasn't a normal closure and we haven't exceeded max attempts
      if (e.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
        reconnectAttempts++;
        
        // Calculate delay with exponential backoff (1s, 2s, 4s, etc.)
        const delay = Math.min(1000 * (2 ** reconnectAttempts), 30000);
        
        console.log(`Attempting to reconnect in ${delay/1000} seconds... (Attempt ${reconnectAttempts}/${maxReconnectAttempts})`);
        
        reconnectTimer = setTimeout(() => {
          console.log('Attempting to reconnect to lobby WebSocket...');
          const newSocket = setupLobbyWebSocket();
          setLobbySocket(newSocket);
        }, delay);
      }
    };
    
    socket.onerror = (error) => {
      console.error('Lobby WebSocket error:', error);
    };
    
    return socket;
  };

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('authToken');
    const storedUsername = localStorage.getItem('username');
    
    if (token && storedUsername) {
      setIsAuthenticated(true);
      setUsername(storedUsername);
      
      // Fetch active games, invitations, and online users
      fetchGames();
      fetchInvitations();
      fetchUsers();
      
      // Set up WebSocket connection for lobby
      const socket = setupLobbyWebSocket();
      setLobbySocket(socket);
    } else {
      setLoading(false);
    }
    
    return () => {
      // Clean up WebSocket connection
      if (lobbySocket) {
        lobbySocket.close(1000, "Component unmounting"); // Normal closure
      }
    };
  }, []);

  const fetchGames = async () => {
    try {
      const data = await api.getGames();
      setGames(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching games:', error);
      setError('Failed to load games');
      setLoading(false);
    }
  };
  
  const fetchInvitations = async () => {
    try {
      const data = await api.getInvitations();
      setInvitations(data);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    }
  };
  
  const fetchUsers = async () => {
    try {
      const data = await api.getUsers();
      // Filter out current user
      setUsers(data.filter(user => user.username !== username));
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
      localStorage.removeItem('authToken');
      localStorage.removeItem('username');
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const handleCreateGame = async () => {
    if (!selectedUser) {
      alert('Please select an opponent');
      return;
    }

    try {
      await api.createInvitation({ recipient: selectedUser });
      setShowNewGameModal(false);
      setSelectedUser('');
      fetchInvitations();
    } catch (error) {
      console.error('Error creating game invitation:', error);
      alert('Failed to create game invitation. Please try again.');
    }
  };

  const handleAcceptInvitation = async (invitationId) => {
    try {
      const game = await api.acceptInvitation(invitationId);
      navigate(`/game/${game.id}`);
    } catch (error) {
      console.error('Error accepting invitation:', error);
      alert('Failed to accept invitation. Please try again.');
    }
  };

  const handleDeclineInvitation = async (invitationId) => {
    try {
      await api.declineInvitation(invitationId);
      fetchInvitations();
    } catch (error) {
      console.error('Error declining invitation:', error);
      alert('Failed to decline invitation. Please try again.');
    }
  };

  return (
    <div className="home-page">
      <header className="app-header">
        <h1>Chess App</h1>
        
        {isAuthenticated ? (
          <div className="user-controls">
            <span>Welcome, {username}!</span>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
        ) : (
          <div className="auth-links">
            <Link to="/login" className="btn">Login</Link>
            <Link to="/register" className="btn">Register</Link>
          </div>
        )}
      </header>

      {isAuthenticated ? (
        <div className="dashboard">
          <div className="games-section">
            <div className="section-header">
              <h2>Your Active Games</h2>
              <button 
                onClick={() => setShowNewGameModal(true)} 
                className="create-game-btn"
              >
                Start New Game
              </button>
            </div>

            {loading ? (
              <p>Loading games...</p>
            ) : error ? (
              <p className="error-message">{error}</p>
            ) : games.length > 0 ? (
              <div className="game-list">
                {games
                  .filter(game => game.status === 'active')
                  .map(game => (
                    <div key={game.id} className="game-item">
                      <div className="game-details">
                        <div className="players">
                          <span className="white-player">{game.white_player.username}</span>
                          <span> vs </span>
                          <span className="black-player">{game.black_player.username}</span>
                        </div>
                        <div className="game-status">
                          {game.fen.split(' ')[1] === 'w' ? "White's turn" : "Black's turn"}
                        </div>
                      </div>
                      <Link to={`/game/${game.id}`} className="join-game-btn">
                        Join Game
                      </Link>
                    </div>
                  ))}
              </div>
            ) : (
              <p>No active games found.</p>
            )}
          </div>

          <div className="invitations-section">
            <h2>Game Invitations</h2>
            {invitations.length > 0 ? (
              <div className="invitation-list">
                <h3>Received Invitations</h3>
                {invitations
                  .filter(inv => inv.recipient.username === username && inv.status === 'pending')
                  .map(invitation => (
                    <div key={invitation.id} className="invitation-item">
                      <p>From: {invitation.sender.username}</p>
                      <div className="invitation-actions">
                        <button 
                          onClick={() => handleAcceptInvitation(invitation.id)}
                          className="accept-btn"
                        >
                          Accept
                        </button>
                        <button 
                          onClick={() => handleDeclineInvitation(invitation.id)}
                          className="decline-btn"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                
                <h3>Sent Invitations</h3>
                {invitations
                  .filter(inv => inv.sender.username === username && inv.status === 'pending')
                  .map(invitation => (
                    <div key={invitation.id} className="invitation-item">
                      <p>To: {invitation.recipient.username}</p>
                      <p>Status: Pending</p>
                    </div>
                  ))}
              </div>
            ) : (
              <p>No invitations found.</p>
            )}
          </div>
          
          <div className="completed-games-section">
            <h2>Completed Games</h2>
            {games
              .filter(game => game.status === 'finished')
              .length > 0 ? (
              <div className="game-list">
                {games
                  .filter(game => game.status === 'finished')
                  .map(game => (
                    <div key={game.id} className="game-item completed">
                      <div className="game-details">
                        <div className="players">
                          <span className="white-player">{game.white_player.username}</span>
                          <span> vs </span>
                          <span className="black-player">{game.black_player.username}</span>
                        </div>
                        <div className="game-result">
                          {game.result === 'white_win' ? 'White won' : 
                           game.result === 'black_win' ? 'Black won' : 'Draw'}
                        </div>
                      </div>
                      <Link to={`/game/${game.id}`} className="view-game-btn">
                        View Game
                      </Link>
                    </div>
                  ))}
              </div>
            ) : (
              <p>No completed games found.</p>
            )}
          </div>

          {showNewGameModal && (
            <div className="modal-overlay">
              <div className="modal">
                <h2>Start New Game</h2>
                <div className="form-group">
                  <label htmlFor="opponent">Select Opponent:</label>
                  <select 
                    id="opponent"
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                  >
                    <option value="">Select an opponent</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>{user.username}</option>
                    ))}
                  </select>
                </div>
                <div className="modal-actions">
                  <button 
                    onClick={handleCreateGame} 
                    disabled={!selectedUser}
                    className="create-btn"
                  >
                    Send Invitation
                  </button>
                  <button 
                    onClick={() => setShowNewGameModal(false)}
                    className="cancel-btn"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="welcome-section">
          <h2>Welcome to Chess App!</h2>
          <p>Please log in or register to start playing.</p>
        </div>
      )}
    </div>
  );
};

export default HomePage;
