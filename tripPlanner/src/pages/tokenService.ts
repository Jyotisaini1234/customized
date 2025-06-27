
class MainAppTokenService {
  private readonly ACCESS_TOKEN_KEY = 'main_app_access_token';
  private readonly REFRESH_TOKEN_KEY = 'main_app_refresh_token';
  private readonly USERNAME_KEY = 'main_app_username';
  private readonly LAST_ACTIVITY_KEY = 'main_app_last_activity';
  
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000;

  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  getUsername(): string | null {
    return localStorage.getItem(this.USERNAME_KEY);
  }

  setTokens(accessToken: string, refreshToken: string, username: string): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(this.USERNAME_KEY, username);
    this.updateActivity();
  }

  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    const refreshToken = this.getRefreshToken();
    return !!(token && refreshToken);
  }

  updateActivity(): void {
    localStorage.setItem(this.LAST_ACTIVITY_KEY, Date.now().toString());
  }

  isSessionExpired(): boolean {
    const lastActivity = localStorage.getItem(this.LAST_ACTIVITY_KEY);
    if (!lastActivity) return true;
    
    const timeDiff = Date.now() - parseInt(lastActivity);
    return timeDiff > this.SESSION_TIMEOUT;
  }

  getAuthHeaders(): { [key: string]: string } {
    const token = this.getAccessToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  async validateToken(): Promise<boolean> {
    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();
    
    if (!accessToken || !refreshToken) return false;

    try {
      const response = await fetch('https://b2b.flydivinetravels.com/sso/authenticate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken,
          refreshToken
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.refreshed) {
          this.setTokens(data.token, data.refreshToken, this.getUsername() || '');
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token validation failed:', error);
      return false;
    }
  }

  // Clear tokens and redirect to login
  clearTokensAndRedirect(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USERNAME_KEY);
    localStorage.removeItem(this.LAST_ACTIVITY_KEY);
    const currentUrl = encodeURIComponent(window.location.href);
    window.location.href = `http://b2b.flydivinetravels.com/hotel`;
  }

  extractTokensFromUrl(): { success: boolean; tokens?: any } {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const refreshToken = urlParams.get('refreshToken');
    const username = urlParams.get('username');

    if (token && refreshToken && username) {
      this.setTokens(token, refreshToken, username);
      
      // Clean URL
      const url = new URL(window.location.href);
      url.searchParams.delete('token');
      url.searchParams.delete('refreshToken');
      url.searchParams.delete('username');
      window.history.replaceState({}, document.title, url.toString());
      
      return { success: true, tokens: { token, refreshToken, username } };
    }
    
    return { success: false };
  }
}

export default new MainAppTokenService();
