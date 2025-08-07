  import React, { useState, useEffect } from 'react';
  import './UserRegistration.scss';
  import { useRegisterUserMutation, useUploadLogoMutation } from '../../api/TourAPI.tsx';
  import { useNavigate } from 'react-router-dom';
  import TokenService from '../../pages/tokenService.ts';
  import { Person, CheckCircle, ErrorOutline, Phone, Email,  LocationOn, Lock, VisibilityOff, Visibility, CloudUpload, Image as ImageIcon,Delete } from '@mui/icons-material';
  import { Box,Container, Avatar,Typography, Card,CardContent,  Alert, Divider,  Grid, TextField, InputAdornment, IconButton, LinearProgress, Button } from '@mui/material';
  interface FormData {
    username: string;
    mobileNumber: string;
    email: string;
    address: string;
    password: string;
    confirmPassword: string;
    logo?: File;
}

  const UserRegistration: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<FormData>({ username: '',  mobileNumber: '',email: '', address: '',  password: '', confirmPassword: ''  });
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [registerUser, { isLoading, isSuccess, error: apiError }] = useRegisterUserMutation();
    const [uploadLogo, { isLoading: isUploadingLogo }] = useUploadLogoMutation();

    useEffect(() => {
      if (TokenService.isAuthenticated()) {
        TokenService.authenticateToken().then(isValid => {
          if (isValid) {
            navigate('/home/', { replace: true });
          }
        });
      }
    }, [navigate]);

    useEffect(() => {
      if (isSuccess) {
        setSubmitSuccess(true);
        localStorage.setItem('registrationSuccess', 'true');
        setTimeout(() => { navigate('/home/', { replace: true }); }, 2000);
      }
    }, [isSuccess, navigate]);

    useEffect(() => {
      if (apiError) {
        if ('data' in apiError) { const errorData = apiError.data as any;
          if (errorData?.message) { setError(errorData.message);}
          else if (typeof errorData === 'string') { setError(errorData); } 
          else {setError('Registration failed. Please try again.');}
        }
        else { setError('Network error. Please try again.');}
      }
    }, [apiError]);

    useEffect(() => {
      const calculatePasswordStrength = (password: string): number => {
        let strength = 0;
        if (password.length >= 8) strength += 25;
        if (/[a-z]/.test(password)) strength += 25;
        if (/[A-Z]/.test(password)) strength += 25;
        if (/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) strength += 25;
        return strength;
      };
      setPasswordStrength(calculatePasswordStrength(formData.password));
    }, [formData.password]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData({ ...formData, [name]: value });
      if (error) {setError(''); }
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
        if (!validTypes.includes(file.type)) {
          setError('Only image files (PNG, JPG, JPEG, GIF) are allowed for logo');
          return;
        }
        if (file.size > 5 * 1024 * 1024) {setError('Logo file size exceeds maximum limit of 5MB');  return; }
        setFormData({ ...formData,  logo: file});
        const reader = new FileReader();
        reader.onload = (e) => {setLogoPreview(e.target?.result as string); };
        reader.readAsDataURL(file);
      }
    };

    const handleRemoveLogo = () => {
      setFormData({ ...formData, logo: undefined });
      setLogoPreview(null);
      const fileInput = document.getElementById('logo-upload') as HTMLInputElement;
      if (fileInput) {fileInput.value = ''; }
    };

    const validateEmail = (email: string): boolean => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    const validatePhone = (phone: string): boolean => {
      const phoneRegex = /^\d{10}$/;
      return phoneRegex.test(phone.replace(/\D/g, ''));
    };

const handleSubmit = async (e: React.FormEvent) => {
  if (e) e.preventDefault();
  setError('');
  if (!formData.username || !formData.email || !formData.mobileNumber || !formData.password) {
    setError("Please fill in all required fields: Username, Email, Mobile Number, and Password");
    return;
  }

  if (!validateEmail(formData.email)) {
    setError("Please enter a valid email address");
    return;
  }

  if (!validatePhone(formData.mobileNumber)) {
    setError("Please enter a valid 10-digit mobile number");
    return;
  }

  if (formData.password.length < 6) {
    setError("Password must be at least 6 characters long");
    return;}
  if (formData.password !== formData.confirmPassword) {
    setError("Passwords don't match");
    return; }

  try {
    const payload = {
      username: formData.username.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      mobile: formData.mobileNumber.replace(/\D/g, ''),
      companyName: formData.address || 'Default Company'
    };
    
    console.log('Sending registration payload:', payload);
    const registerResponse = await registerUser(payload).unwrap();
    console.log('Registration response:', registerResponse);
    if (registerResponse && formData.logo) {
      try {
        console.log('Starting logo upload for email:', payload.email);
        const logoUploadResponse = await uploadLogo({
          file: formData.logo,
          email: payload.email,
        }).unwrap();
        console.log('Logo upload successful:', logoUploadResponse);
      } catch (logoError) {
        console.error('Logo upload failed:', logoError);
        console.warn('Registration successful but logo upload failed. User can upload later.');
      }
    }

  } catch (err: any) {
    console.error("Registration error:", err);
    if (err?.status === 'PARSING_ERROR') {
      setError("Server returned invalid response. Please try again or contact support.");
    } else if (err?.status === 400 && err?.data?.message) {
      setError(err.data.message);
    } else if (err?.data?.message) {
      setError(err.data.message);
    } else if (err?.message) {
      setError(err.message);
    } else {
      setError("Registration failed. Please try again.");
    }
  }
};
    const handleCancel = () => {
      setFormData({ username: '', mobileNumber: '', email: '', address: '',  password: '', confirmPassword: '' });
      setLogoPreview(null);
      setError('');
      setPasswordStrength(0);
      setSubmitSuccess(false);
      
      const fileInput = document.getElementById('logo-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    };

    const getPasswordStrengthColor = () => {
      if (passwordStrength < 25) return 'error';
      if (passwordStrength < 50) return 'warning';
      if (passwordStrength < 75) return 'info';
      return 'success';
    };

    const getPasswordStrengthText = () => {
      if (passwordStrength < 25) return 'Weak';
      if (passwordStrength < 50) return 'Fair';
      if (passwordStrength < 75) return 'Good';
      return 'Strong';
    };

    return (
      <Box className="user-registration-container">
        <Container maxWidth="sm" className="main-container">
          <Box className="header-section">
            <Avatar className="header-avatar"> <Person fontSize="large" /> </Avatar>
            <Typography variant="h4" className="header-title"> Create Your Account</Typography>
          </Box>

          <Card className="registration-card" elevation={3}>
            <CardContent className="card-content">
              {submitSuccess && (<Alert severity="success" className="success-alert" icon={<CheckCircle />}> Registration successful! Redirecting to login... </Alert>)}
              {error && ( <Alert severity="error" className="error-alert" icon={<ErrorOutline />}>{error} </Alert>)}
              <form onSubmit={handleSubmit}>
                <Box className="form-section">
                  <Typography variant="h5" className="section-title"> <Person className="section-icon" /> Personal Information</Typography>
                  <Divider className="section-divider" />
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth name="username"  label="Name" placeholder="Enter your username"  value={formData.username} onChange={handleChange}   required disabled={isLoading} InputProps={{ startAdornment: (<InputAdornment position="start"> <Person className="input-icon" /></InputAdornment> ), }} className="form-input" />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth name="mobileNumber" label="Mobile Number" placeholder="Enter your mobile number" value={formData.mobileNumber} onChange={handleChange} required disabled={isLoading}  InputProps={{startAdornment: (<InputAdornment position="start"><Phone className="input-icon" />  </InputAdornment> ), }} className="form-input" />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth name="email" label="Email Address" type="email" placeholder="Enter your email address"   value={formData.email} onChange={handleChange}  required disabled={isLoading} InputProps={{startAdornment: (<InputAdornment position="start"> <Email className="input-icon" /> </InputAdornment> ),}} className="form-input" />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField  fullWidth name="address"  label="Company Name" placeholder="Enter company name"value={formData.address}    onChange={handleChange} multiline  rows={1} disabled={isLoading}  InputProps={{ startAdornment: ( <InputAdornment position="start"><LocationOn className="input-icon" /></InputAdornment>),  }} className="form-input"  />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth name="password" label="Password" placeholder="Create a strong password"  type={showPassword ? 'text' : 'password'}  value={formData.password}   onChange={handleChange} required  disabled={isLoading} InputProps={{startAdornment: (<InputAdornment position="start"> <Lock className="input-icon" /> </InputAdornment>), endAdornment: ( <InputAdornment position="end"> <IconButton onClick={() => setShowPassword(!showPassword)}   edge="end" disabled={isLoading}>{showPassword ? <VisibilityOff /> : <Visibility />}  </IconButton>  </InputAdornment> ),}}  className="form-input"  />
                      {formData.password && (
                        <Box className="password-strength">
                          <Box className="strength-header"> <Typography variant="caption" className="strength-text"> Password Strength: {getPasswordStrengthText()} </Typography></Box>
                          <LinearProgress variant="determinate" value={passwordStrength} color={getPasswordStrengthColor() as any} className="strength-bar"/></Box> )}
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth name="confirmPassword" label="Confirm Password" placeholder="Confirm your password" type={showConfirmPassword ? 'text' : 'password'}    value={formData.confirmPassword}  onChange={handleChange} required  disabled={isLoading}  InputProps={{ startAdornment: (<InputAdornment position="start"> <Lock className="input-icon" /> </InputAdornment> ),endAdornment: ( <InputAdornment position="end"> <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)}  edge="end" disabled={isLoading}  > {showConfirmPassword ? <VisibilityOff /> : <Visibility />} </IconButton></InputAdornment> ),}} className="form-input"   />
                    </Grid>
                  </Grid>
                </Box>
                <Box className="form-section">
                  <Grid item xs={12}>
                      <Box className="logo-upload-section">
                        <Typography variant="subtitle1" className="logo-upload-label"><ImageIcon className="section-icon" />Company Logo </Typography>
                        <Box className="logo-upload-container">
                          <input  id="logo-upload" type="file" accept="image/*" onChange={handleLogoChange} style={{ display: 'none' }} disabled={isLoading}/>
                          {logoPreview ? (
                            <Box className="logo-preview-container">
                              <img src={logoPreview}  alt="Logo preview"  className="logo-preview-image" />
                              <Box className="logo-actions"><IconButton  onClick={handleRemoveLogo} className="remove-logo-btn"disabled={isLoading} >  <Delete /> </IconButton> </Box>
                            </Box>
                          ) : (
                            <label htmlFor="logo-upload"> <Button  component="span" startIcon={<CloudUpload />} className="logo-upload-btn" disabled={isLoading}> Upload Logo</Button> </label>
                          )}
                        </Box>
                        <Typography variant="caption" className="logo-upload-hint">Supported formats: PNG, JPG, JPEG, GIF (Max 5MB)</Typography>
                      </Box>
                    </Grid>
                </Box>
                <Box className="form-note"> <Typography variant="body2" className="note-text"> <strong>Note:</strong> Fields marked with <span className="required-mark">*</span> are mandatory.  </Typography></Box>
                <Box className="form-buttons">
                  <Button  type="submit" variant="contained"  size="large"   disabled={isLoading || isUploadingLogo} className="submit-button" startIcon={isLoading ? undefined : <CheckCircle />}    onClick={handleSubmit}  > {isLoading ? 'Creating Account...' : 'SUBMIT'} </Button>
                  <Button type="button" size="large"  onClick={handleCancel} disabled={isLoading}  className="cancel-button" > CANCEL </Button>
                </Box>
                {(isLoading || isUploadingLogo) && ( <Box className="loading-container"> <LinearProgress className="loading-bar" /> <Typography variant="caption" className="loading-text">  {isUploadingLogo ? 'Uploading logo...' : 'Creating account...'} </Typography> </Box> )}
              </form>
            </CardContent>
          </Card>
        </Container>
      </Box>
    );
  };

  export default UserRegistration;
