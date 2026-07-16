import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService } from '../services/settingsService';

export function usePOSSettings() {
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ['posSettings'],
    queryFn: () => settingsService.getPOSSettings(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const mutation = useMutation({
    mutationFn: (newSettings) => settingsService.updatePOSSettings(newSettings),
    onMutate: async (newSettings) => {
      await queryClient.cancelQueries({ queryKey: ['posSettings'] });
      const previousSettings = queryClient.getQueryData(['posSettings']);
      
      // Optimistically update
      queryClient.setQueryData(['posSettings'], (old) => ({
        ...old,
        ...newSettings
      }));

      return { previousSettings };
    },
    onError: (err, newSettings, context) => {
      queryClient.setQueryData(['posSettings'], context.previousSettings);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['posSettings'] });
    },
  });

  // Default values while loading
  const currentSettings = settings || {
    enableScanner: true,
    enableHoldCart: true,
    enableReprint: true,
  };

  const toggleSetting = (key) => {
    mutation.mutate({
      [key]: !currentSettings[key]
    });
  };

  return {
    ...currentSettings,
    toggleSetting
  };
}
