import { useEffect } from 'react';
import MainAppTokenService from '../pages/tokenService.ts';

export const useActivityTracker = () => {
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    const handleActivity = () => {
      if (MainAppTokenService.isAuthenticated()) {
        MainAppTokenService.updateActivity();
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) return;
      
      if (MainAppTokenService.isAuthenticated() && MainAppTokenService.isSessionExpired()) {
        MainAppTokenService.clearTokensAndRedirect();
      }
    };
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
};