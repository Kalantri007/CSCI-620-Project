import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { API_BASE_URL } from '../services/api';
import '../styles/HomePage.css';
import Navigation from '../components/Navigation';

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
  const [notification, setNotification] = useState(null);
  
  const navigate = useNavigate();
  const sendTestMessage = () => {
    if (lobbySocket && lobbySocket.readyState === WebSocket.OPEN) {
      const message = {
        type: 'ping',
        message: 'Hello from client!'
      };
      lobbySocket.send(JSON.stringify(message));
      console.log('Sent test message:', message);
    } else {
      console.warn('WebSocket is not open.');
    }
  };
  const setupLobbyWebSocket = () => {
    const wsScheme = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
    const token = localStorage.getItem('authToken');
    const { host } = new URL(API_BASE_URL);
    const socket = new WebSocket(`${wsScheme}${host}/ws/lobby/?token=${token}`);
    
    let reconnectAttempts = 0;
    let reconnectTimer = null;
    const maxReconnectAttempts = 5;
    
    socket.onopen = () => {
      console.log('Lobby WebSocket connected');
      reconnectAttempts = 0;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    };
    
    socket.onmessage = (e) => {
      const data = JSON.parse(e.data);
      console.log('Received lobby message:', data);
      if (data.type === 'pong') {
        console.log('✅ Got pong from server:', data.message);
      }
      if (data.type === 'connection_established') {
        console.log('WebSocket connection confirmed by server');
      } else if (data.type === 'error') {
        console.error('Server error:', data.message);
      } else if (data.type === 'challenge') {
        console.log('New challenge received!');
        setNotification({
          type: 'challenge',
          message: `${data.sender} has challenged you to a game!`,
          timestamp: new Date()
        });
        fetchInvitations();
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('New Chess Challenge!', {
            body: `${data.sender} has challenged you to a game!`
          });
        }
      } else if (data.type === 'challenge_response') {
        console.log('Challenge response received');
        if (data.accepted) {
          setNotification({
            type: 'accepted',
            message: `${data.challenged} accepted your challenge!`,
            timestamp: new Date()
          });
          if (data.challenger === username) {
            navigate(`/game/${data.game_id}`);
          }
        } else {
          setNotification({
            type: 'declined',
            message: `${data.challenged} declined your challenge.`,
            timestamp: new Date()
          });
        }
        fetchGames();
        fetchInvitations();
      } else if (data.type === 'user_online' || data.type === 'user_offline') {
        fetchUsers();
      } else if (data.type === 'game_updated') {
        console.log('Game updated notification received:', data);
        // Refresh the games list when any game is updated
        fetchGames();
        
        // Show notification about the game update
        if (data.game_id) {
          if (data.status === 'finished') {
            setNotification({
              type: 'game_finished',
              message: `Game #${data.game_id} has ended. Result: ${data.result === 'white_win' ? 'White wins!' : 'Black wins!'}`,
              timestamp: new Date()
            });
          } else {
            setNotification({
              type: 'game_move',
              message: `Game #${data.game_id} has been updated.`,
              timestamp: new Date()
            });
          }
        }
      }
    };
    
    socket.onclose = (e) => {
      console.log('Lobby WebSocket disconnected');
      if (e.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
        reconnectAttempts++;
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
    const token = localStorage.getItem('authToken');
    const storedUsername = localStorage.getItem('username');
    if (token && storedUsername) {
      setIsAuthenticated(true);
      setUsername(storedUsername);
      fetchGames();
      fetchInvitations();
      fetchUsers();
      const socket = setupLobbyWebSocket();
      setLobbySocket(socket);
    } else {
      setLoading(false);
    }
    return () => {
      if (lobbySocket) {
        lobbySocket.close(1000, "Component unmounting");
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
      const invitation = await api.createInvitation({ recipient: selectedUser });
      if (lobbySocket && lobbySocket.readyState === WebSocket.OPEN) {
        const message = {
          type: 'challenge',
          challenger: username,
          challenged: users.find(u => u.id === parseInt(selectedUser))?.username,
          game_id: invitation.id
        };
        lobbySocket.send(JSON.stringify(message));
      }
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
      if (lobbySocket && lobbySocket.readyState === WebSocket.OPEN) {
        const message = {
          type: 'challenge_response',
          accepted: true,
          game_id: game.id,
          challenger: game.white_player.username,
          challenged: game.black_player.username
        };
        lobbySocket.send(JSON.stringify(message));
      }
      navigate(`/game/${game.id}`);
    } catch (error) {
      console.error('Error accepting invitation:', error);
      alert('Failed to accept invitation. Please try again.');
    }
  };

  const handleDeclineInvitation = async (invitationId) => {
    try {
      const invitation = invitations.find(inv => inv.id === invitationId);
      await api.declineInvitation(invitationId);
      if (invitation && lobbySocket && lobbySocket.readyState === WebSocket.OPEN) {
        const message = {
          type: 'challenge_response',
          accepted: false,
          game_id: null,
          challenger: invitation.sender.username,
          challenged: invitation.recipient.username
        };
        lobbySocket.send(JSON.stringify(message));
      }
      fetchInvitations();
    } catch (error) {
      console.error('Error declining invitation:', error);
      alert('Failed to decline invitation. Please try again.');
    }
  };
  
  return (
    <div className="page-container">
      <Navigation 
        isAuthenticated={isAuthenticated} 
        username={username}
        onLogout={handleLogout}
      />

      <div className="home-content">
        {notification && (
          <div className={`notification-banner ${notification.type}`}>
            <p>{notification.message}</p>
            <button onClick={() => setNotification(null)} className="close-notification">
              ✕
            </button>
          </div>
        )}

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
            <div className="info-links-section">
              <h3>Explore Chess</h3>
              <div className="info-links">
                <Link to="/history" className="info-link-card">
                  <h4>History of Chess</h4>
                  <p>Explore the rich history of chess from ancient India to modern times.</p>
                </Link>
                <Link to="/rules" className="info-link-card">
                  <h4>Chess Rules</h4>
                  <p>Learn the rules of the game, from basic moves to advanced strategies.</p>
                </Link>
                <Link to="/about" className="info-link-card">
                  <h4>About Us</h4>
                  <p>Meet the development team and learn about the Chess App project.</p>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
