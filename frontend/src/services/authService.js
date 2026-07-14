import api from './apiClient';

export const authService = {
  login: async (username, password) => {
    // The backend implements standard OAuth2 Bearer token authentication
    // Expects Form Data (application/x-www-form-urlencoded)
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await api.post('/api/users/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data; // { access_token, token_type }
  },

  getCurrentProfile: async () => {
    const response = await api.get('/api/users/me');
    return response.data;
  },
};
