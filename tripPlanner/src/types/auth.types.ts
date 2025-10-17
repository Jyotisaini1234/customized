
export interface RegisterData {
  username: string;
  email: string;
  password: string;
  mobile?: string;
  companyName?: string;
}
export interface TokenResponse {
  token: string;
  refreshToken: string;
  message?: string;
  refreshed?: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  tokenExpiry: number | null;
  lastActivity: number;
  sessionTimeout: number;
  isInitialized: boolean;
  loginEmail: string | null;
  companyName?: string;
  logoPath?: string;
  userName?: string;
  redirectFrom?: string;
  loginTime?: string;
  registrationSuccess?: boolean;
}

export interface LoginCredentials {
  identifier: string;
  password: string;
}

export interface JWTPayload {
  sub: string;
  username?: string;
  email?: string;
  user_email?: string;
  userEmail?: string;
  role?: string;
  exp: number;
  iat: number;
  [key: string]: any;
  company_name?: string;
  organizationName?: string; 
}

export interface User {
    id?: string;
    email: string;
    username?: string;
    companyName?: string;
    company?: string;
    mobile?: string;
    name?: string;
    sub?: string;
    role?: 'USER' | 'ADMIN';
  }
  
  
  
  export interface CompanyInfo {
    companyName?: string;
    logoPath?: string;
    username?: string;
  }
  
  export interface AuthActions {
    login: (credentials: LoginCredentials) => Promise<any>;
    register: (userData: RegisterData) => Promise<any>;
    logout: () => void;
    refreshTokenAction: () => Promise<any>;
    clearError: () => void;
    forceSignOut: () => void;
    initializeAuth: () => void;
    checkSession: () => void;
    updateCompanyInfo: (companyInfo: CompanyInfo) => void;
    setRegistrationSuccess: (success: boolean) => void;
    handleUrlParams: (params: {
      email?: string;
      companyName?: string;
      logoPath?: string;
      userName?: string;
      authToken?: string;
      refreshToken?: string;
    }) => void;
  }
  
  export interface AuthContextType extends AuthState, AuthActions {}
  
  export interface UrlAuthParams {
    authToken?: string;
    refreshToken?: string;
    userEmail?: string;
    companyName?: string;
    logoPath?: string;
    username?: string;
    authenticated?: string;
  }
  
  export interface TokenPayload {
    sub?: string;
    email?: string;
    username?: string;
    name?: string;
    preferred_username?: string;
    given_name?: string;
    companyName?: string;
    company?: string;
    exp?: number;
    iat?: number;
  }
  
  export interface LoginPayload {
    token: string;
    refreshToken: string;
    loginEmail: string | null;
    message?: string;
  }
  
  export interface RefreshTokenPayload {
    token: string;
    refreshToken?: string;
  }
  
  export interface SetAuthPayload {
    user: User;
    token: string;
    refreshToken: string;
    loginEmail: string | null;
    tokenExpiry: number;
    companyName?: string;
    logoPath?: string;
    userName?: string;
  }
  