export const isTokenValid = (token: string | null): boolean => {
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      // Check if token has expired
      if (payload.exp && payload.exp < currentTime) {
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Invalid token format:', error);
      return false;
    }
  };
  
  export const getTokenFromStorage = (): string | null => {
    return localStorage.getItem('jwt_token') || localStorage.getItem('token') || localStorage.getItem('authToken');
  };
  
  export const removeTokenFromStorage = (): void => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    // Remove any other auth-related items
  };
  
  export const setTokenInStorage = (token: string): void => {
    localStorage.setItem('jwt_token', token);
  };
  
  // Check if user is authenticated
  export const isAuthenticated = (): boolean => {
    const token = getTokenFromStorage();
    return isTokenValid(token);
  };