import { TokenResponse } from "../types/auth.types.ts";
import { BASE_URL_JWT } from "../utils/ApiConstants.ts";

class TokenService {
  private readonly BASE_URL = BASE_URL_JWT;
  private inactivityTimer: NodeJS.Timeout | null = null;
  private tokenCheckInterval: NodeJS.Timeout | null = null;
  private readonly INACTIVITY_TIMEOUT = 30 * 60 * 1000;
  private readonly TOKEN_CHECK_INTERVAL = 5 * 60 * 1000;

  private reduxStore: any = null;
  private lastActivity: number = Date.now();

  constructor() {
    this.setupActivityTracking();
    this.setupTokenValidation();
  }

  initializeStore(store: any): void {
    this.reduxStore = store;
    console.log('TokenService initialized with Redux store');
  }

  private getReduxState(): any {
    if (!this.reduxStore) {
      return {
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        userName: null,
        loginEmail: null,
        lastActivity: Date.now()
      };
    }
    return this.reduxStore.getState().auth;
  }

  private isStoreInitialized(): boolean {
    return this.reduxStore !== null;
  }

  setTokens(accessToken: string, refreshToken: string, username: string): void {
    const authData = {
      token: accessToken,
      refreshToken: refreshToken,
      userName: username,
      isAuthenticated: true,
      lastActivity: Date.now(),
      source: 'tokenService'
    };
    
    window.dispatchEvent(new CustomEvent('authUpdated', { detail: authData }));
    this.lastActivity = Date.now();
    this.resetInactivityTimer();
    
    console.log('Tokens set in TokenService, event dispatched');
  }

  getAccessToken(): string | null {
    const state = this.getReduxState();
    return state?.token || null;
  }

  getRefreshToken(): string | null {
    const state = this.getReduxState();
    return state?.refreshToken || null;
  }

  getUsername(): string | null {
    const state = this.getReduxState();
    return state?.userName || state?.user?.username || state?.loginEmail || null;
  }

  getLastActivity(): number {
    const state = this.getReduxState();
    return state?.lastActivity || this.lastActivity;
  }

  updateActivity(): void {
    if (this.isAuthenticated()) {
      this.lastActivity = Date.now();
      
      window.dispatchEvent(new CustomEvent('updateActivity', { 
        detail: { lastActivity: this.lastActivity }
      }));
      
      this.resetInactivityTimer();
    }
  }

  clearTokens(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
    
    if (this.tokenCheckInterval) {
      clearInterval(this.tokenCheckInterval);
      this.tokenCheckInterval = null;
    }

    window.dispatchEvent(new CustomEvent('forceLogout', { 
      detail: { reason: 'clearTokens', source: 'tokenService' }
    }));
    
    this.lastActivity = 0;
    console.log('Tokens cleared from TokenService, logout event dispatched');
  }

  private setupActivityTracking(): void {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const throttledUpdate = this.throttle(() => {
      this.updateActivity();
    }, 1000);
    
    events.forEach(event => {
      document.addEventListener(event, throttledUpdate, { passive: true });
    });
  }

  private throttle(func: Function, delay: number): () => void {
    let lastCall = 0;
    return () => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        func();
      }
    };
  }

  private setupTokenValidation(): void {
    this.tokenCheckInterval = setInterval(async () => {
      if (this.isAuthenticated()) {
        const isValid = await this.validateAndRefreshToken();
        if (!isValid) {
          this.clearTokensAndRedirect();
        }
      }
    }, this.TOKEN_CHECK_INTERVAL);
  }

  private resetInactivityTimer(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }

    this.inactivityTimer = setTimeout(() => {
      console.log('⏱️ User inactive for 30 minutes, logging out...');
      this.clearTokensAndRedirect();
    }, this.INACTIVITY_TIMEOUT);
  }

  private isUserActive(): boolean {
    const lastActivity = this.getLastActivity();
    const now = Date.now();
    return (now - lastActivity) < this.INACTIVITY_TIMEOUT;
  }

  isAuthenticated(): boolean {
    const state = this.getReduxState();
    const hasTokens = state?.isAuthenticated === true && state?.token !== null;
    
    if (!hasTokens) {
      return false;
    }
    
    if (!this.isUserActive()) {
      this.clearTokensAndRedirect();
      return false;
    }

    return true;
  }

  clearTokensAndRedirect(): void {
    this.clearTokens();
    
    // Dispatch redirect flag event
    window.dispatchEvent(new CustomEvent('shouldRedirectToLogin', { 
      detail: { shouldRedirect: true, source: 'tokenService' }
    }));
  }

  shouldRedirectToLogin(): boolean {
    const state = this.getReduxState();
    return !state?.isAuthenticated && state?.token === null;
  }

  clearRedirectFlag(): void {
    console.log('Redirect flag cleared (handled by Redux)');
  }

  async authenticateToken(): Promise<boolean> {
    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();

    if (!accessToken || !refreshToken) {
      this.clearTokensAndRedirect();
      return false;
    }

    try {
      const response = await fetch(`${this.BASE_URL}/sso/authenticate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          accessToken,
          refreshToken
        })
      });

      if (response.ok) {
        const data: TokenResponse = await response.json();
        if (data.token && data.refreshToken) {
          const username = this.getUsername() || '';
          this.setTokens(data.token, data.refreshToken, username);
        } else {
          this.updateActivity();
        }
        return true;
      } else {
        console.error('Token authentication failed:', response.status);
        this.clearTokensAndRedirect();
        return false;
      }
    } catch (error) {
      console.error('Token authentication error:', error);
      this.clearTokensAndRedirect();
      return false;
    }
  }

  getAuthHeaders(): HeadersInit {
    const token = this.getAccessToken();
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  async logout(): Promise<void> {
    const token = this.getAccessToken();
    
    if (token) {
      try {
        await fetch(`${this.BASE_URL}/sso/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    
    this.clearTokensAndRedirect();
  }

  async validateAndRefreshToken(): Promise<boolean> {
    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();

    if (!accessToken || !refreshToken) {
      return false;
    }

    if (!this.isUserActive()) {
      this.clearTokensAndRedirect();
      return false;
    }

    try {
      const validateResponse = await fetch(`${this.BASE_URL}/sso/authenticate`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          accessToken,
          refreshToken
        })
      });

      if (validateResponse.ok) {
        const data: TokenResponse = await validateResponse.json();
        
        if (data.token && data.refreshToken) {
          const username = this.getUsername() || '';
          this.setTokens(data.token, data.refreshToken, username);
        } else {
          this.updateActivity();
        }
        return true;
      }

      this.clearTokensAndRedirect();
      return false;
    } catch (error) {
      console.error('Token validation error:', error);
      this.clearTokensAndRedirect();
      return false;
    }
  }

  destroy(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }
    if (this.tokenCheckInterval) {
      clearInterval(this.tokenCheckInterval);
    }
    
    this.reduxStore = null;
    console.log('TokenService destroyed');
  }
}

export default new TokenService();