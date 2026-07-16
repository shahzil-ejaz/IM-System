import api from './apiClient';

export const settingsService = {
  getPOSSettings: async () => {
    const response = await api.get('/settings/pos');
    return response.data;
  },
  
  updatePOSSettings: async (settings) => {
    const response = await api.put('/settings/pos', settings);
    return response.data;
  }
};
