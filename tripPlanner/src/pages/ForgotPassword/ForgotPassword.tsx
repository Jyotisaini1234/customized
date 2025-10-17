import  { useState } from "react";
import {TextField, Button, Box, Typography, Alert, CircularProgress,Dialog, DialogTitle, DialogContent, DialogActions} from "@mui/material";
import { useChangePasswordMutation } from "../../api/TourAPI.tsx";
import './ForgotPassword.scss';
import React from "react";

interface ForgotPasswordProps {
  open: boolean;
  onClose: () => void;
  userEmail?: string;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ open, onClose, userEmail }) => {
  const [email, setEmail] = useState<string>(userEmail || "");
  const [mobile, setMobile] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [localError, setLocalError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [changePassword, { isLoading, error }] = useChangePasswordMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    setSuccess("");

    if (!email.trim()) {
      setLocalError("Please enter your email");
      return;
    }
    if (!email.includes('@')) {
      setLocalError("Please enter a valid email address");
      return;
    }
    if (!mobile.trim()) {
      setLocalError("Please enter your mobile number");
      return;
    }
    if (mobile.length < 10) {
      setLocalError("Please enter a valid mobile number (at least 10 digits)");
      return;
    }
    if (!newPassword.trim()) {
      setLocalError("Please enter a new password");
      return;
    }
    if (newPassword.length < 6) {
      setLocalError("Password must be at least 6 characters long");
      return;
    }
    if (newPassword !== confirmPassword) {
      setLocalError("Passwords do not match");
      return;
    }

    try {
      console.log('Attempting to change password for email:', email, 'mobile:', mobile);
      
      const result = await changePassword({
        email: email.trim(),
        mobile: mobile.trim(),
        newPassword: newPassword.trim()
      }).unwrap();

      console.log('Password change successful:', result);
      setSuccess("Password changed successfully!");
      
      setTimeout(() => {
        onClose();
        setEmail("");
        setMobile("");
        setNewPassword("");
        setConfirmPassword("");
        setSuccess("");
      }, 2000);
      
    } catch (error: any) {
      console.error("Password change error:", error);
      
      if (error?.data?.message) {
        setLocalError(error.data.message);
      } else if (error?.message) {
        setLocalError(error.message);
      } else if (error?.status) {
        setLocalError(`Error ${error.status}: Request failed`);
      } else {
        setLocalError("Password change failed. Please check your connection and try again.");
      }
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setEmail("");
      setMobile("");
      setNewPassword("");
      setConfirmPassword("");
      setLocalError("");
      setSuccess("");
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth  className="forgot-container">
      <DialogTitle>
        <Typography variant="h6">Forget Password</Typography>
      </DialogTitle>
      
      <form onSubmit={handleSubmit} >
        <DialogContent>
          {success && ( <Alert severity="success" sx={{ mb: 2 }}> {success}</Alert> )}
          {localError && ( <Alert severity="error" sx={{ mb: 2 }}> {localError} </Alert>)}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField fullWidth label="Email" type="email"  value={email}  onChange={(e) => setEmail(e.target.value)}  disabled={isLoading} required   autoComplete="email" />
            <TextField fullWidth label="Mobile Number"   type="tel" value={mobile}   onChange={(e) => setMobile(e.target.value)}   disabled={isLoading}  required autoComplete="tel" placeholder="Enter your mobile number"/>
            <TextField fullWidth  label="New Password"   type="password" value={newPassword}    onChange={(e) => setNewPassword(e.target.value)}  disabled={isLoading}  required   autoComplete="new-password"   />
            <TextField fullWidth label="Confirm New Password"   type="password"  value={confirmPassword}    onChange={(e) => setConfirmPassword(e.target.value)} disabled={isLoading}  required  autoComplete="new-password"  />
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 2 }}>
          <Button  className='cancel-btn' onClick={handleClose}  disabled={isLoading} >  Cancel </Button>
          <Button  className="forgot-btn"  type="submit"  disabled={isLoading || !email.trim() || !mobile.trim() || !newPassword.trim() || !confirmPassword.trim()}   startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : undefined} > {isLoading ? 'Changing...' : 'Forgot Password'}   </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ForgotPassword;