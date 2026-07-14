import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/authService';
import { useSessionStore } from './useSessionStore';
import { useNavigate } from 'react-router-dom';

export function useAuth() {
  const { setSession, clearSession, isAuthenticated, user } = useSessionStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const loginMutation = useMutation({
    mutationFn: async ({ username, password }) => {
      // Step 1: Get the token
      const tokenData = await authService.login(username, password);
      // Temporarily store token in local storage so the interceptor picks it up for the next call
      localStorage.setItem('access_token', tokenData.access_token);
      
      // Step 2: Fetch the user profile data to know the role
      const userData = await authService.getCurrentProfile();
      return { token: tokenData.access_token, user: userData };
    },
    onSuccess: (data) => {
      setSession(data.token, data.user);
      
      // Redirect based on role
      if (data.user.role === 'cashier') {
        navigate('/pos');
      } else if (data.user.role === 'manager') {
        navigate('/manager');
      } else if (data.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/'); // fallback
      }
    },
    onError: (error) => {
      // Ensure we clean up if something failed
      localStorage.removeItem('access_token');
      console.error('Login failed', error);
    }
  });

  const logout = () => {
    clearSession();
    queryClient.clear(); // Clear all react-query cache on logout
    navigate('/login');
  };

  return {
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    logout,
    isAuthenticated,
    user,
  };
}
