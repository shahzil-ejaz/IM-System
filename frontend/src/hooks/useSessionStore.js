import { create } from 'zustand';

export const useSessionStore = create((set) => ({
  user: localStorage.getItem('user_role') ? { role: localStorage.getItem('user_role') } : null,
  accessToken: localStorage.getItem('access_token') || null,
  isAuthenticated: !!localStorage.getItem('access_token'),

  setSession: (token, userData) => {
    localStorage.setItem('access_token', token);
    localStorage.setItem('user_role', userData.role);
    set({
      accessToken: token,
      user: userData,
      isAuthenticated: true,
    });
  },

  clearSession: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_role');
    set({
      accessToken: null,
      user: null,
      isAuthenticated: false,
    });
  },
}));
