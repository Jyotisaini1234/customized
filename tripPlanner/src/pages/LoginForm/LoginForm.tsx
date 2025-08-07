import React, { useEffect, useState, useCallback } from "react";
import { TextField, Button, Radio, FormControlLabel, Box, Typography, Alert, CircularProgress, IconButton, InputAdornment, FormControl, InputLabel } from "@mui/material";
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
  const { isAuthenticated, isLoading, error: authError, user, token, refreshToken, login, clearError } = useAuth();
  const [showForgotPassword, setShowForgotPassword] = useState<boolean>(false);
  
  const getEmailForQuery = useCallback(() => {
    if (username.includes('@')) return username;
    if (user?.email) return user.email;
    return '';
  }, [username, user?.email]);
  const { data: companyInfoData, error: companyInfoError, isLoading: isLoadingCompanyInfo, refetch: refetchCompanyInfo} = useGetUserCompanyInfoQuery(getEmailForQuery(), { skip: !shouldFetchCompanyInfo || !getEmailForQuery(), refetchOnMountOrArgChange: true});
  const getRedirectUrl = useCallback((): string => {
    const urlParams = new URLSearchParams(window.location.search);
    const redirectParam = urlParams.get('redirect');
    if (redirectParam) {
      try {
        const decodedUrl = decodeURIComponent(redirectParam);
        console.log(' Redirect URL found:', decodedUrl);
        return decodedUrl;}
      catch (e) {console.error(' Failed to decode redirect URL:', e); }
    }
    return READYMADE_PACKAGE;
  }, []);

  useEffect(() => {
    if (companyInfoData && !companyInfoError && !companyInfoFetched) {
      if (companyInfoData.companyName) { localStorage.setItem('companyName', companyInfoData.companyName); }
      if (companyInfoData.logoPath) { localStorage.setItem('logoPath', companyInfoData.logoPath);}
      if (companyInfoData.username) { localStorage.setItem('userName', companyInfoData.username);  }
      setCompanyInfoFetched(true);
    }
  }, [companyInfoData, companyInfoError, companyInfoFetched]);

  const handleSuccessfulLogin = useCallback(async () => {
    if (redirectInProgress) return;
    
    try {
      setSuccess('Login successful! Loading user data...');
      setRedirectInProgress(true);
      if (!shouldFetchCompanyInfo) {
        setShouldFetchCompanyInfo(true);
        await new Promise(resolve => setTimeout(resolve, 2000)); }
      if (!companyInfoData && !companyInfoError) {
        console.log('Port 3002 - Refetching company info...');
        await refetchCompanyInfo();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      if (token && refreshToken) {
        let emailToSend = user?.email;
        if (!emailToSend || !emailToSend.includes('@')) { emailToSend = username.includes('@') ? username : user?.email || username; }
        let userDisplayName = '';
        let companyName = '';
        let logoPath = '';
        try {
          const tokenPayload = JSON.parse(atob(token.split('.')[1]));
          console.log('Port 3002 - Token payload:', tokenPayload);
          if (tokenPayload.sub) { userDisplayName = tokenPayload.sub;}
          else if (emailToSend && emailToSend.includes('@')) {
            const emailName = emailToSend.split('@')[0];
            userDisplayName = emailName.charAt(0).toUpperCase() + emailName.slice(1).toLowerCase(); }
          if (tokenPayload.companyName) { companyName = tokenPayload.companyName;} 
          else if (user?.companyName) {companyName = user.companyName; }
          
        } catch (tokenError) {
          console.error('Port 3002 - Error decoding token:', tokenError);
          if (emailToSend && emailToSend.includes('@')) {
            const emailName = emailToSend.split('@')[0];
            userDisplayName = emailName.charAt(0).toUpperCase() + emailName.slice(1).toLowerCase(); }
        }
        if (companyInfoData && !companyInfoError) {
          console.log('Port 3002 - Using company info from API:', companyInfoData); 
          if (companyInfoData.companyName) {companyName = companyInfoData.companyName;}
          if (companyInfoData.logoPath) { logoPath = companyInfoData.logoPath; }
          if (companyInfoData.username) { userDisplayName = companyInfoData.username; }
        } else {
          const storedCompanyName = localStorage.getItem('companyName');
          const storedLogoPath = localStorage.getItem('logoPath');
          const storedUserName = localStorage.getItem('userName');
          if (storedCompanyName) companyName = storedCompanyName;
          if (storedLogoPath) logoPath = storedLogoPath;
          if (storedUserName) userDisplayName = storedUserName;
        }
        const redirectUrl = getRedirectUrl();
        const authData = {token, refreshToken, email: emailToSend, userName: userDisplayName, companyName: companyName, logoPath: logoPath,loginTime: new Date().toISOString(), redirectFrom: 'login' };
        localStorage.clear();
        // Store new auth data
        localStorage.setItem('authData', JSON.stringify(authData));
        localStorage.setItem('authToken', token);
        localStorage.setItem('authRefreshToken', refreshToken);
        localStorage.setItem('userEmail', emailToSend);
        localStorage.setItem('userName', userDisplayName);
        localStorage.setItem('companyName', companyName);
        if (logoPath) {
          localStorage.setItem('logoPath', logoPath);
        }
        window.dispatchEvent(new CustomEvent('authUpdated', {
          detail: authData
        }));
        setSuccess('Login successful! Redirecting...');
        let finalUrl: string;
        try {
          if (redirectUrl.startsWith('http://') || redirectUrl.startsWith('https://')) {
            finalUrl = redirectUrl;
          } else {
            const baseUrl = window.location.origin;
            const separator = redirectUrl.startsWith('/') ? '' : '/';
            finalUrl = `${baseUrl}${separator}${redirectUrl}`;
          }
        } catch (urlError) {
          console.error('Port 3002 - URL construction failed, using fallback:', urlError);
          finalUrl = redirectUrl;
        }
        
        console.log('Port 3002 - Redirecting to:', finalUrl);
        setTimeout(() => {
          window.location.href = finalUrl;
        }, 1500);
        
      } else {
        console.error('Port 3002 - Missing required data for redirect:', {
          token: !!token,
          refreshToken: !!refreshToken
        });
        setLocalError('Session setup incomplete. Please try logging in again.');
        setRedirectInProgress(false);
      }
      
    } catch (error) {
      console.error('Port 3002 - Error processing login:', error);
      setLocalError('Login successful but session setup failed. Please try again.');
      setRedirectInProgress(false);
    }
  }, [redirectInProgress,  token,  refreshToken,  user, getRedirectUrl,  username, companyInfoData,  companyInfoError,shouldFetchCompanyInfo, refetchCompanyInfo ]);

  useEffect(() => {
    if (isAuthenticated && token && refreshToken && !redirectInProgress && hasAttemptedLogin) {
      console.log('Port 3002 - All conditions met, calling handleSuccessfulLogin');
      handleSuccessfulLogin();
    }
  }, [ isAuthenticated,  token,  refreshToken,  user?.email,  redirectInProgress,  hasAttemptedLogin, handleSuccessfulLogin, isLoadingCompanyInfo ]);

  useEffect(() => {
    const registrationSuccess = localStorage.getItem('registrationSuccess');
    if (registrationSuccess) {
      setSuccess('Registration successful! Please login with your credentials.');
      localStorage.removeItem('registrationSuccess');
    }
  }, []);

  useEffect(() => {
    if (success && !redirectInProgress) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success, redirectInProgress]);

  useEffect(() => {
    if (authError && hasAttemptedLogin) {
      setLocalError(authError);
      setHasAttemptedLogin(false);
    }
  }, [authError, hasAttemptedLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    const existingCompanyName = localStorage.getItem('companyName');
    const existingLogoPath = localStorage.getItem('logoPath');
    localStorage.clear();
    sessionStorage.clear();
    if (existingCompanyName) {
      localStorage.setItem('companyName', existingCompanyName);
    }
    if (existingLogoPath) {
      localStorage.setItem('logoPath', existingLogoPath);
    }
    e.preventDefault();
    setLocalError("");
    setSuccess("");
    clearError();
    setCompanyInfoFetched(false);
    if (redirectInProgress) {
      return;
    }
    if (!username.trim()) {
      setLocalError("Please enter your email");
      return;
    }
    if (!password.trim()) {
      setLocalError("Please enter your password");
      return;
    }
    if (password.length < 6) {
      setLocalError("Password must be at least 6 characters long");
      return;
    }
  
    try {
      setHasAttemptedLogin(true);
      if (username.includes('@')) {setShouldFetchCompanyInfo(true); }
      const result = await login({ identifier: username.trim(), password: password.trim() });
      if (result.meta.requestStatus === 'fulfilled') {
        console.log("Port 3002 - Login successful, payload:", result.payload);
      } else if (result.meta.requestStatus === 'rejected') {
        console.error("Port 3002 - Login failed:", result.payload);
        setLocalError(result.payload as string || "Login failed. Please try again.");
        setHasAttemptedLogin(false);
        setShouldFetchCompanyInfo(false);
      }
    } catch (err: any) {
      console.error("Port 3002 - Login error:", err);
      setLocalError("Login failed. Please check your connection and try again.");
      setHasAttemptedLogin(false);
      setShouldFetchCompanyInfo(false);
    }
  };

  const handleRegisterClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!redirectInProgress) {
      navigate("/home/new-user", {
        state: { from: location.state?.from }
      });
    }
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!redirectInProgress) {
      setShowForgotPassword(true);
    }
  };
  
  const handleInputChange = useCallback((field: 'username' | 'password', value: string) => {
    if (field === 'username') {
      setUsername(value);
    } else {
      setPassword(value);
    }
    
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
        {success && (<Alert severity="success" sx={{ mb: 2 }}> {success} </Alert>)}
        {displayError && (<Alert severity="error" sx={{ mb: 2 }}> {displayError} </Alert>)}
        <Box className="input-fields">
            <FormControl fullWidth size="small">
            <TextField  fullWidth  placeholder="Enter your email or username"   className="mui-input" value={username}  onChange={(e) => handleInputChange('username', e.target.value)}    disabled={isProcessing}  required   autoComplete="username"    InputProps={{ classes: { root: "input-root" } }}   />
            <TextField   className="mui-input_2" fullWidth  type={showPassword ? 'text' : 'password'}  placeholder="Enter your password"  value={password}  onChange={(e) => handleInputChange('password', e.target.value)}   disabled={isProcessing}  required    autoComplete="current-password" InputProps={{ endAdornment: (
            <InputAdornment position="end">
              <IconButton  onClick={() => setShowPassword(!showPassword)}  edge="end" disabled={isProcessing}  >  {showPassword ? <VisibilityOff /> : <Visibility />}   </IconButton> 
            </InputAdornment> ),  }}  />
            </FormControl>
        </Box>
        
        <Box className="form-options">
          <FormControlLabel control={ <Radio   checked={rememberMe}    onChange={(e) => setRememberMe(e.target.checked)}    className="remember-radio"    size="small"   disabled={isProcessing}  /> }  label={<Typography className="remember-text">Remember Me</Typography>}   />
          <Typography   className="forgot-password"   component="button"   type="button"  onClick={handleForgotPassword}   disabled={isProcessing}    >  Forgot password?   </Typography>
        </Box>
        <Box className="form-actions">
          <Typography   className="register-link"   component="button"  type="button"  onClick={handleRegisterClick} disabled={isProcessing}   >  New user? Register Now  </Typography>
          <Button type="submit"  size="large"   className="login-button"   disableElevation  disabled={isProcessing || !username.trim() || !password.trim()} startIcon={isProcessing ? <CircularProgress size={20} color="inherit" /> : undefined}  >
            {isLoadingCompanyInfo ? 'LOADING USER DATA...' : isLoading ? 'SIGNING IN...' : 'LOGIN'} 
          </Button>
        </Box>
      </form>
    </Box>
  <ForgotPassword open={showForgotPassword} onClose={() => setShowForgotPassword(false)} userEmail={username.includes('@') ? username : undefined}/>
</>
  );
};

export default LoginForm;