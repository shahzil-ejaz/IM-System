import api from './apiClient';

export const userService = {
  getUsers: async (skip = 0, limit = 100) => {
    const response = await api.get('/api/users/', { params: { skip, limit } });
    return response.data;
  },

  registerUser: async (userData) => {
    const response = await api.post('/api/users/', userData);
    return response.data;
  },

  toggleUserStatus: async (userId) => {
    const response = await api.patch(`/api/users/${userId}/status`);
    return response.data;
  },
  
  deleteUser: async (userId) => {
    const response = await api.delete(`/api/users/${userId}`);
    return response.data;
  }
};
