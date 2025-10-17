import React, { useEffect, useState, useCallback } from "react";
import { TextField, Button, Radio, FormControlLabel, Box, Typography, Alert, CircularProgress, IconButton, InputAdornment, FormControl } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import "./Login.scss";
import { READYMADE_PACKAGE } from "../../utils/ApiConstants.ts";
import ForgotPassword from "../ForgotPassword/ForgotPassword.tsx";
import { useAuth } from "../../constants/useAuth.ts";
import { useGetUserCompanyInfoQuery } from "../../api/TourAPI.tsx";

const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [localError, setLocalError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [redirectInProgress, setRedirectInProgress] = useState<boolean>(false);
  const [hasAttemptedLogin, setHasAttemptedLogin] = useState<boolean>(false);
  const [shouldFetchCompanyInfo, setShouldFetchCompanyInfo] = useState<boolean>(false);
  const [companyInfoFetched, setCompanyInfoFetched] = useState<boolean>(false);
  const [showForgotPassword, setShowForgotPassword] = useState<boolean>(false);
  const {isAuthenticated, isLoading, error: authError, user,  token, refreshToken, login, clearError,updateCompanyInfo,registrationSuccess,setRegistrationSuccess,companyName: reduxCompanyName,logoPath: reduxLogoPath,userName: reduxUserName,loginEmail } = useAuth();
  
  const getEmailForQuery = useCallback(() => {
    if (username.includes('@')) return username;
    if (loginEmail && loginEmail.includes('@')) return loginEmail;
    if (user?.email) return user.email;
    return '';
  }, [username, user?.email, loginEmail]);
  
  const {data: companyInfoData, error: companyInfoError, isLoading: isLoadingCompanyInfo, refetch: refetchCompanyInfo } = useGetUserCompanyInfoQuery(getEmailForQuery(), { skip: !shouldFetchCompanyInfo || !getEmailForQuery(), refetchOnMountOrArgChange: true});

  const getRedirectUrl = useCallback((): string => {
    const urlParams = new URLSearchParams(window.location.search);
    const redirectParam = urlParams.get('redirect');
    if (redirectParam) {
      try {
        const decodedUrl = decodeURIComponent(redirectParam);
        console.log('Redirect URL found:', decodedUrl);
        return decodedUrl;
      } catch (e) {
        console.error('Failed to decode redirect URL:', e);
      }
    }
    return READYMADE_PACKAGE;
  }, []);

  const handleSuccessfulLogin = useCallback(async () => {
    if (redirectInProgress) return;
    
    try {
      setSuccess('Login successful! Loading user data...');
      setRedirectInProgress(true);
      
      // Wait a bit for company info to load if needed
      if (!shouldFetchCompanyInfo && getEmailForQuery()) {
        setShouldFetchCompanyInfo(true);
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
      
      // Try to refetch company info if not loaded
      if (!companyInfoData && !companyInfoError && getEmailForQuery()) {
        console.log('🔄 Refetching company info...');
        try {
          await refetchCompanyInfo();
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.warn('Company info refetch failed:', error);
        }
      }
      
      if (token && refreshToken) {
        let emailToSend = loginEmail || user?.email;
        if (!emailToSend || !emailToSend.includes('@')) {
          emailToSend = username.includes('@') ? username : user?.email || username;
        }
        let userDisplayName = reduxUserName;
        let companyName = reduxCompanyName;
        let logoPath = reduxLogoPath;
        if (token) {
          try {
            const tokenPayload = JSON.parse(atob(token.split('.')[1]));
            console.log('Token payload:', tokenPayload);
            
            if (tokenPayload.sub && !userDisplayName) {
              userDisplayName = tokenPayload.sub;
            }
            
            if (tokenPayload.companyName && !companyName) {
              companyName = tokenPayload.companyName;
            }
            
            if (!userDisplayName && emailToSend && emailToSend.includes('@')) {
              const emailName = emailToSend.split('@')[0];
              userDisplayName = emailName.charAt(0).toUpperCase() + emailName.slice(1).toLowerCase();
            }
          } catch (tokenError) {
            console.error('Error decoding token:', tokenError);
            if (emailToSend && emailToSend.includes('@') && !userDisplayName) {
              const emailName = emailToSend.split('@')[0];
              userDisplayName = emailName.charAt(0).toUpperCase() + emailName.slice(1).toLowerCase();
            }
          }
        }
        if (companyInfoData && !companyInfoError) {
          console.log('Using company info from API:', companyInfoData);
          if (companyInfoData.companyName) companyName = companyInfoData.companyName;
          if (companyInfoData.logoPath) logoPath = companyInfoData.logoPath;
          if (companyInfoData.username) userDisplayName = companyInfoData.username;
        }
        
        const finalCompanyInfo = {
          companyName: companyName,
          logoPath: logoPath || '',
          userName: userDisplayName || 'User'
        };
        
        updateCompanyInfo(finalCompanyInfo);
        const redirectUrl = getRedirectUrl();
        let finalUrl: string;
        
        try {
          const isExternalUrl = redirectUrl.startsWith('http://') || redirectUrl.startsWith('https://');
          const baseUrl = isExternalUrl ? redirectUrl : `${window.location.origin}${redirectUrl.startsWith('/') ? '' : '/'}${redirectUrl}`;
          const url = new URL(baseUrl);
          url.searchParams.set('authToken', token);
          if (refreshToken) url.searchParams.set('refreshToken', refreshToken);
          if (emailToSend) url.searchParams.set('userEmail', encodeURIComponent(emailToSend));
          if (companyName) url.searchParams.set('companyName', encodeURIComponent(companyName));
          if (logoPath) url.searchParams.set('logoPath', encodeURIComponent(logoPath));
          if (userDisplayName) url.searchParams.set('username', encodeURIComponent(userDisplayName));
          url.searchParams.set('authenticated', 'true');
          finalUrl = url.toString();
        } catch (urlError) {
          console.error('❌ URL construction failed:', urlError);
          finalUrl = redirectUrl;
        }
        const authData = { 
          token, 
          refreshToken, 
          email: emailToSend, 
          companyName, 
          logoPath,
          userName: userDisplayName,
          loginTime: new Date().toISOString(), 
          redirectFrom: 'login', 
          isAuthenticated: true
        };
        console.log('📤 Dispatching auth update event:', authData);
        window.dispatchEvent(new CustomEvent('authUpdated', { detail: authData }));
        
        setSuccess('Login successful! Redirecting...');
        
        console.log('🚀 Redirecting to:', finalUrl);
        setTimeout(() => {
          window.location.href = finalUrl;
        }, 1000);
        
      } else {
        console.error('❌ Missing required data for redirect:', {
          token: !!token,
          refreshToken: !!refreshToken
        });
        setLocalError('Session setup incomplete. Please try logging in again.');
        setRedirectInProgress(false);
      }
    } catch (error) {
      console.error('❌ Error processing login:', error);
      setLocalError('Login successful but session setup failed. Please try again.');
      setRedirectInProgress(false);
    }
  }, [redirectInProgress, token, refreshToken, user, loginEmail, getRedirectUrl, username, companyInfoData, companyInfoError, shouldFetchCompanyInfo, refetchCompanyInfo, updateCompanyInfo, reduxCompanyName, reduxLogoPath, reduxUserName, getEmailForQuery]);

  useEffect(() => {
    if (companyInfoData && !companyInfoError && !companyInfoFetched) {
      console.log('Processing company info from API:', companyInfoData);
      const companyInfo = {companyName: companyInfoData.companyName,logoPath: companyInfoData.logoPath,userName: companyInfoData.username };
      updateCompanyInfo(companyInfo);
      setCompanyInfoFetched(true);
      window.dispatchEvent(new CustomEvent('authUpdated', { detail: { companyInfo, source: 'companyInfoAPI' } }));
    }
    if (isAuthenticated && token && refreshToken && !redirectInProgress && hasAttemptedLogin) {
      console.log('All login conditions met, processing successful login');
      handleSuccessfulLogin();
    }
    if (authError && hasAttemptedLogin) {
      setLocalError(authError);
      setHasAttemptedLogin(false);
    }
    if (registrationSuccess) {
      setSuccess('Registration successful! Please login with your credentials.');
      setRegistrationSuccess(false);
    }
  }, [companyInfoData, companyInfoError, companyInfoFetched, updateCompanyInfo, isAuthenticated, token,  refreshToken, redirectInProgress, hasAttemptedLogin, handleSuccessfulLogin, isLoadingCompanyInfo,authError,registrationSuccess,setRegistrationSuccess]);

  useEffect(() => {
    if (success && !redirectInProgress) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success, redirectInProgress]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    setSuccess("");
    clearError();
    setCompanyInfoFetched(false);
    if (redirectInProgress) {return;}
    if (!username.trim()) {setLocalError("Please enter your email");return;}
    if (!password.trim()) { setLocalError("Please enter your password");  return; }
    if (password.length < 6) {setLocalError("Password must be at least 6 characters long");return;}
    try {
      setHasAttemptedLogin(true);
      if (username.includes('@')) {setShouldFetchCompanyInfo(true);}
      console.log('Attempting login for:', username);
      const result = await login({ identifier: username.trim(), password: password.trim() });
      if (result.type.endsWith('/fulfilled')) {
        console.log("Login successful, payload:", result.payload);
        const loginPayload = result.payload as {token: string; refreshToken: string;loginEmail?: string; message?: string;};
        const authData = {token: loginPayload.token, refreshToken: loginPayload.refreshToken,email: loginPayload.loginEmail || username,loginTime: new Date().toISOString(), source: 'loginSuccess'};
        window.dispatchEvent(new CustomEvent('authUpdated', { detail: authData }));
      } else if (result.type.endsWith('/rejected')) {
        console.error("Login failed:", result.payload);
        setLocalError(result.payload as string || "Login failed. Please try again.");
        setHasAttemptedLogin(false);
        setShouldFetchCompanyInfo(false);
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setLocalError("Login failed. Please check your connection and try again.");
      setHasAttemptedLogin(false);
      setShouldFetchCompanyInfo(false);
    }
  };

  const handleRegisterClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!redirectInProgress) {
      navigate("/home/new-user", { state: { from: location.state?.from } });
    }
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!redirectInProgress) {
      setShowForgotPassword(true); 
    }
  };
  
  const handleInputChange = useCallback((field: 'username' | 'password', value: string) => {
    if (field === 'username') { setUsername(value);} 
    else { setPassword(value); }
    if (localError || authError) {
      setLocalError('');
      clearError();
    }
  }, [localError, authError, clearError]);
  
  const displayError = localError || authError;
  const isProcessing = isLoading || redirectInProgress || isLoadingCompanyInfo;

  return (
    <>
      <Box className="login-form-container">
        <form onSubmit={handleSubmit} className="login-form">
          {success && (<Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>)}
          {displayError && (<Alert severity="error" sx={{ mb: 2 }}>{displayError}</Alert>)}
          <Box className="input-fields">
            <FormControl fullWidth size="small">
              <TextField fullWidth placeholder="Enter your email or username" className="mui-input" value={username} onChange={(e) => handleInputChange('username', e.target.value)} disabled={isProcessing} required autoComplete="username" InputProps={{ classes: { root: "input-root" } }}/>
              <TextField className="mui-input_2" fullWidth type={showPassword ? 'text' : 'password'} placeholder="Enter your password" value={password} onChange={(e) => handleInputChange('password', e.target.value)} disabled={isProcessing} required autoComplete="current-password" InputProps={{ endAdornment: (<InputAdornment position="end"><IconButton onClick={() => setShowPassword(!showPassword)} edge="end" disabled={isProcessing}>{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment>), }} />
            </FormControl>
          </Box>
        
          <Box className="form-options">
            <FormControlLabel control={<Radio checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="remember-radio" size="small" disabled={isProcessing} />} label={<Typography className="remember-text">Remember Me</Typography>} />
            <Typography className="forgot-password" component="button" type="button" onClick={handleForgotPassword} disabled={isProcessing}>Forgot password?</Typography>
          </Box>
          
          <Box className="form-actions">
            <Typography className="register-link" component="button" type="button" onClick={handleRegisterClick} disabled={isProcessing}>New user? Register Now</Typography>
            <Button type="submit" size="large" className="login-button" disableElevation disabled={isProcessing || !username.trim() || !password.trim()} startIcon={isProcessing ? <CircularProgress size={20} color="inherit" /> : undefined}> 
              {isLoadingCompanyInfo ? 'LOADING USER DATA...' : isLoading ? 'SIGNING IN...' : 'LOGIN'}
            </Button>
          </Box>
        </form>
      </Box>
      <ForgotPassword open={showForgotPassword} onClose={() => setShowForgotPassword(false)} userEmail={username.includes('@') ? username : undefined} />
    </>
  );
};

export default LoginForm;
