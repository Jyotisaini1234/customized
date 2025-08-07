import { TokenResponse } from "../types/types.ts";
import { BASE_URL_JWT } from "../utils/ApiConstants.ts";

class TokenService {
  [x: string]: any;
  private readonly BASE_URL = BASE_URL_JWT;
  private inactivityTimer: NodeJS.Timeout | null = null;
  private tokenCheckInterval: NodeJS.Timeout | null = null;
  private readonly INACTIVITY_TIMEOUT = 30 * 60 * 1000;
  private readonly TOKEN_CHECK_INTERVAL = 5 * 60 * 1000;

  constructor() {
    this.setupActivityTracking();
    this.setupTokenValidation();
  }

  setTokens(accessToken: string, refreshToken: string, username: string): void {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', username);
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('lastActivity', Date.now().toString());
    this.resetInactivityTimer();
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  getUsername(): string | null {
    return localStorage.getItem('user');
  }

  getLastActivity(): number {
    const lastActivity = localStorage.getItem('lastActivity');
    return lastActivity ? parseInt(lastActivity, 10) : 0;
  }

  updateActivity(): void {
    if (this.isAuthenticated()) {
      localStorage.setItem('lastActivity', Date.now().toString());
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

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('lastActivity');
    localStorage.removeItem('shouldRedirectToLogin');
  }

  private setupActivityTracking(): void {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, () => {
        this.updateActivity();
      }, true);
    });
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
      console.log('User inactive for 30 minutes, logging out...');
      this.clearTokensAndRedirect();
    }, this.INACTIVITY_TIMEOUT);
  }

  private isUserActive(): boolean {
    const lastActivity = this.getLastActivity();
    const now = Date.now();
    return (now - lastActivity) < this.INACTIVITY_TIMEOUT;
  }
  isAuthenticated(): boolean {
    const hasTokens = localStorage.getItem('isAuthenticated') === 'true' && 
        this.getAccessToken() !== null;
    
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
    localStorage.setItem('shouldRedirectToLogin', 'true');
  }

  shouldRedirectToLogin(): boolean {
    return localStorage.getItem('shouldRedirectToLogin') === 'true';
  }

  clearRedirectFlag(): void {
    localStorage.removeItem('shouldRedirectToLogin');
  }
  async authenticateToken(): Promise<boolean> {
    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();

    if (!accessToken || !refreshToken) {
      this.clearTokensAndRedirect();
      return false;
    }

    try {
      const response = await fetch(`${this.BASE_URL}/authenticate`, {
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
        if (data.refreshed && data.token && data.refreshToken) {
          const username = this.getUsername() || '';
          this.setTokens(data.token, data.refreshToken, username);
        } else {
          this.updateActivity(); // Update activity for valid token
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
        await fetch(`${this.BASE_URL}/logout`, {
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
      const validateResponse = await fetch(`${this.BASE_URL}/authenticate`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          accessToken,
          refreshToken
        })
      });

      if (validateResponse.ok) {
        const data: TokenResponse = await validateResponse.json();
        
        if (data.refreshed && data.token && data.refreshToken) {
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
  }
}

export default new TokenService();
