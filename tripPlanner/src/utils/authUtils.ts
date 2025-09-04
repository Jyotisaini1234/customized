import { getFromDB, STORES, saveToDB } from "./TripPlannerDB";

export const isTokenValid = (token: string | null): boolean => {
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      if (payload.exp && payload.exp < currentTime) {
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Invalid token format:', error);
      return false;
    }
};

export const getTokenFromStorage = async (): Promise<string | null> => {
  try {
    const jwtToken = await getFromDB(STORES.plannerData, 'jwt_token', null);
    if (jwtToken) return jwtToken;
    
    const token = await getFromDB(STORES.plannerData, 'token', null);
    if (token) return token;
    
    const authToken = await getFromDB(STORES.plannerData, 'authToken', null);
    if (authToken) return authToken;
    
    return null;
  } catch (error) {
    console.error('Error getting token from IndexedDB:', error);
    return null;
  }
};

export const removeTokenFromStorage = async (): Promise<void> => {
  try {
    await Promise.all([
      saveToDB(STORES.plannerData, 'jwt_token', null),
      saveToDB(STORES.plannerData, 'token', null),
      saveToDB(STORES.plannerData, 'authToken', null),
      saveToDB(STORES.plannerData, 'username', null)
    ]);
    console.log('All auth tokens removed from IndexedDB');
  } catch (error) {
    console.error('Error removing tokens from IndexedDB:', error);
  }
};

export const setTokenInStorage = async (token: string): Promise<void> => {
  try {
    await saveToDB(STORES.plannerData, 'jwt_token', token);
    console.log('Token successfully stored in IndexedDB');
  } catch (error) {
    console.error('Error storing token in IndexedDB:', error);
    throw error;
  }
};

export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const token = await getTokenFromStorage();
    return isTokenValid(token);
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
};