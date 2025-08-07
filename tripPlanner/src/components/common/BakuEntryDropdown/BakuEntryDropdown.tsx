import React, { useState } from 'react';
import EmailIcon from '@mui/icons-material/Email';
import ArticleIcon from '@mui/icons-material/Article';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { BAKU_REQUIREMENT, BASE_URL_JWT } from '../../../utils/ApiConstants.ts';
import './BakuEntryDropdown.scss';
import { Button, Menu, MenuItem, ListItemIcon, ListItemText, Dialog, DialogTitle, Typography, DialogContent, Alert, Box, TextField, DialogActions, Snackbar } from '@mui/material';

interface BakuEntryDropdownProps {
  className?: string;
}

interface EmailRequest {
  to: string;
  subject: string;
  body: string;
  from?: string;
  replyTo?: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
}

const BakuEntryDropdown: React.FC<BakuEntryDropdownProps> = ({ className }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '',  email: '',  phone: '',  message: '' });
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [emailStatus, setEmailStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const sendEmailViaAPI = async (emailData: EmailRequest): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${BASE_URL_JWT}/sso/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      const data: ApiResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send email');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  };

  const handleEmailRequest = async () => {
    setEmailStatus('loading');
    
    const emailData: EmailRequest = {
      to: 'jyotisaini5614@gmail.com',
      subject: "Baku Entry Requirements Request",
      body: `Dear Team,
        I would like to request information about Baku entry requirements for my upcoming trip.
        Please provide me with the latest requirements and documentation needed.
        Thank you for your assistance.
        Best regards`,
      from: 'noreply@flydivinetravels.com'
    };

    try {
      const result = await sendEmailViaAPI(emailData);
      
      if (result.success) {
        setEmailStatus('success');
        setSnackbarMessage('Email sent successfully!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } else {
        throw new Error(result.message);
      }
      
    } catch (error) {
      setEmailStatus('error');
      setSnackbarMessage('Failed to send email. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      
      const subject = "Baku Entry Requirements Request";
      const body = `Dear Team,

I would like to request information about Baku entry requirements for my upcoming trip.
Please provide me with the latest requirements and documentation needed.
Thank you for your assistance.

Best regards`;
      const mailtoLink = `mailto:jyotisaini5614@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(mailtoLink, '_blank');
    } finally {
      setTimeout(() => {
        setEmailStatus('idle');
      }, 2000);
    }
    
    handleClose();
  };

  // Handle Form Option
  const handleFormOption = () => {
    setFormDialogOpen(true);
    handleClose();
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitStatus('loading');
    
    try {
      const emailData: EmailRequest = {
        to: 'support@flydivinetravels.com',
        subject: `Baku Entry Requirements Request from ${formData.name}`,
        body: `Dear Team,

New Baku entry requirements request received:

Name: ${formData.name}
Email: ${formData.email}
Phone: ${formData.phone}
Message: ${formData.message || 'No additional message provided'}

Please respond to the customer at their provided email address.

Best regards,
Website Contact System`,
        from: 'noreply@flydivinetravels.com',
        replyTo: formData.email
      };
      const result = await sendEmailViaAPI(emailData);
      
      if (result.success) {
        setSubmitStatus('success');
        setTimeout(() => {
          setFormDialogOpen(false);
          setFormData({ name: '', email: '', phone: '', message: '' });
          setSubmitStatus('idle');
        }, 2000);
      } else {
        throw new Error(result.message);
      }
      
    } catch (error) {
      setSubmitStatus('error');
      console.error('Error submitting form:', error);
    }
  };

  const handleInputChange = (field: keyof typeof formData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <>
      <Button className={className || 'entry-btn'} onClick={handleClick} endIcon={<ExpandMoreIcon />}aria-controls={open ? 'baku-menu' : undefined} aria-haspopup="true" aria-expanded={open ? 'true' : undefined} > 
        Baku Entry Requirements
      </Button>
      
      <Menu id="baku-menu" anchorEl={anchorEl}  open={open} onClose={handleClose}  MenuListProps={{   'aria-labelledby': 'baku-button',   }}   PaperProps={{   style: {  minWidth: '200px',   }, }} >
        <MenuItem onClick={handleEmailRequest} disabled={emailStatus === 'loading'}>
          <ListItemIcon><EmailIcon fontSize="small" /> </ListItemIcon>
          <ListItemText> {emailStatus === 'loading' ? 'Sending Email...' : 'Email Request'} </ListItemText>
        </MenuItem>
        
        <MenuItem onClick={handleFormOption}>
          <ListItemIcon> 
            <ArticleIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Form Request</ListItemText>
        </MenuItem>
      </Menu>
    
      {/* Form Dialog */}
      <Dialog  open={formDialogOpen}  onClose={() => setFormDialogOpen(false)}  maxWidth="sm"  fullWidth >
        <DialogTitle>
          <Typography variant="h6">  Baku Entry Requirements Request </Typography>
        </DialogTitle>
        <form onSubmit={handleFormSubmit}>
          <DialogContent>
            {submitStatus === 'success' && (
              <Alert severity="success" sx={{ mb: 2 }}>  Your request has been submitted successfully! We'll get back to you soon. </Alert>   )}
            {submitStatus === 'error' && ( 
              <Alert severity="error" sx={{ mb: 2 }}>  There was an error submitting your request. Please try again. </Alert> 
            )}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField fullWidth label="Full Name" value={formData.name}  onChange={handleInputChange('name')}   required   disabled={submitStatus === 'loading'}   />
              <TextField fullWidth label="Email Address"  type="email" value={formData.email}  onChange={handleInputChange('email')}   required disabled={submitStatus === 'loading'} />
              <TextField fullWidth  label="Phone Number"   value={formData.phone}  onChange={handleInputChange('phone')}   required  disabled={submitStatus === 'loading'} />
              <TextField fullWidth label="Additional Message"   multiline  rows={4}  value={formData.message}   onChange={handleInputChange('message')}   placeholder="Please specify any particular requirements or questions about Baku entry..."   disabled={submitStatus === 'loading'}/>
            </Box>
          </DialogContent>
        
          <DialogActions>
            <Button  onClick={() => setFormDialogOpen(false)}  disabled={submitStatus === 'loading'} >  Cancel   </Button>
            <Button type="submit" className='submit-btn'  sx={{bgcolor:'#0369a1', color:'white'}}   disabled={submitStatus === 'loading'}  > 
              {submitStatus === 'loading' ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      <Snackbar open={snackbarOpen}  autoHideDuration={4000}onClose={handleSnackbarClose} anchorOrigin={{ vertical: 'top', horizontal: 'right' }} >
        <Alert onClose={handleSnackbarClose}  severity={snackbarSeverity}  sx={{ width: '100%' }} > {snackbarMessage} </Alert>
      </Snackbar>
    </>
  );
};

export default BakuEntryDropdown;
