// API service to handle communication with the backend

// API base URL
export const API_BASE_URL = 'http://127.0.0.1:8000';

// Helper function to handle API responses
const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type');
  
  if (contentType && contentType.indexOf('application/json') !== -1) {
    if (response.ok) {
      return await response.json();
    }
    
    const error = await response.json();
    return Promise.reject(error);
  }
  
  if (!response.ok) {
    return Promise.reject(new Error(`HTTP error! Status: ${response.status}`));
  }
  
  return await response.text();
};

// Function to get auth token from local storage
const getAuthToken = () => localStorage.getItem('authToken');

// Function to get auth headers
const getAuthHeaders = () => {
  const token = getAuthToken();
  return token ? { 'Authorization': `Token ${token}` } : {};
};

// API methods
const api = {
  // Authentication
  login: async (credentials) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    
    const data = await handleResponse(response);
    
    // Store username along with token
    if (data.token) {
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('username', credentials.username);
    }
    
    return data;
  },
  
  register: async (userData) => {
    // Ensure password2 field is included for the backend
    const dataToSend = {
      ...userData,
      password2: userData.confirmPassword || userData.password2 || userData.password
    };
    
    const response = await fetch(`${API_BASE_URL}/api/auth/register/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataToSend),
    });
    return handleResponse(response);
  },
  
  logout: async () => {
    const token = getAuthToken();
    if (!token) return Promise.resolve();
    
    const response = await fetch(`${API_BASE_URL}/api/auth/logout/`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders()
      },
    });
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    return handleResponse(response);
  },
  
  // User Management
  getUsers: async () => {
    const response = await fetch(`${API_BASE_URL}/api/auth/users/`, {
      headers: {
        ...getAuthHeaders()
      },
    });
    return handleResponse(response);
  },
  
  getUserProfile: async () => {
    const response = await fetch(`${API_BASE_URL}/api/auth/user/`, {
      headers: {
        ...getAuthHeaders()
      },
    });
    return handleResponse(response);
  },
  
  // Games
  getGames: async () => {
    const response = await fetch(`${API_BASE_URL}/api/chess/games/`, {
      headers: {
        ...getAuthHeaders()
      },
    });
    return handleResponse(response);
  },
  
  getGame: async (gameId) => {
    const response = await fetch(`${API_BASE_URL}/api/chess/games/${gameId}/`, {
      headers: {
        ...getAuthHeaders()
      },
    });
    return handleResponse(response);
  },
  
  createGame: async (gameData) => {
    const response = await fetch(`${API_BASE_URL}/api/chess/games/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(gameData),
    });
    return handleResponse(response);
  },
  
  makeMove: async (gameId, move) => {
    const response = await fetch(`${API_BASE_URL}/api/chess/moves/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({
        game: gameId,
        move_notation: move.san
      }),
    });
    return handleResponse(response);
  },
  
  resignGame: async (gameId) => {
    const response = await fetch(`${API_BASE_URL}/api/chess/resign-game/${gameId}/`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders()
      },
    });
    return handleResponse(response);
  },
  
  // Game Invitations
  getInvitations: async () => {
    const response = await fetch(`${API_BASE_URL}/api/chess/invitations/`, {
      headers: {
        ...getAuthHeaders()
      },
    });
    return handleResponse(response);
  },
  
  createInvitation: async (invitationData) => {
    const response = await fetch(`${API_BASE_URL}/api/chess/invitations/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(invitationData),
    });
    return handleResponse(response);
  },
  
  acceptInvitation: async (invitationId) => {
    const response = await fetch(`${API_BASE_URL}/api/chess/accept-invitation/${invitationId}/`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders()
      },
    });
    return handleResponse(response);
  },
  
  declineInvitation: async (invitationId) => {
    const response = await fetch(`${API_BASE_URL}/api/chess/decline-invitation/${invitationId}/`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders()
      },
    });
    return handleResponse(response);
  }
};

export default api;
