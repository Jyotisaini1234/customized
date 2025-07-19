import React, { useState } from 'react';
import { Button,  Menu, MenuItem, ListItemIcon, ListItemText,Dialog,DialogTitle,DialogContent,DialogActions,TextField,Typography,Box,Alert} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import ArticleIcon from '@mui/icons-material/Article';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { BAKU_REQUIREMENT } from '../../../utils/ApiConstants.ts';
import './BakuEntryDropdown.scss';
interface BakuEntryDropdownProps {className?: string;}

const BakuEntryDropdown: React.FC<BakuEntryDropdownProps> = ({ className }) => {
const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
const [formDialogOpen, setFormDialogOpen] = useState(false);
const [formData, setFormData] = useState({name: '',email: '', phone: '', message: ''});
const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
const open = Boolean(anchorEl);
const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {setAnchorEl(event.currentTarget);};

const handleClose = () => {setAnchorEl(null);};
const handleEmailRequest = () => {
    const subject = "Baku Entry Requirements Request";
    const body = `Dear Team,

I would like to request information about Baku entry requirements for my upcoming trip.
Please provide me with the latest requirements and documentation needed.
Thank you for your assistance.

Best regards`;
const mailtoLink = `mailto:support@flydivinetravels.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
window.location.href = mailtoLink;
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
    await new Promise(resolve => setTimeout(resolve, 1000));

    setSubmitStatus('success');
    setTimeout(() => {
        setFormDialogOpen(false);
        setFormData({ name: '', email: '', phone: '', message: '' });
        setSubmitStatus('idle');
    }, 2000);
    
    } catch (error) {
    setSubmitStatus('error');
    console.error('Error submitting form:', error);
    }
};

const handleInputChange = (field: keyof typeof formData) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
    ...prev,
    [field]: event.target.value
    }));
};
const handleDirectLink = () => {
    window.open(BAKU_REQUIREMENT, '_blank');
    handleClose();
};

return (
    <>
    <Button className={className || 'entry-btn'}onClick={handleClick} endIcon={<ExpandMoreIcon />}aria-controls={open ? 'baku-menu' : undefined} aria-haspopup="true"aria-expanded={open ? 'true' : undefined}> Baku Entry Requirements</Button>
    <Menu id="baku-menu" anchorEl={anchorEl} open={open} onClose={handleClose} MenuListProps={{'aria-labelledby': 'baku-button',  }}  PaperProps={{ style: {minWidth: '200px', }, }}>
        {/* <MenuItem onClick={handleDirectLink}>
        <ListItemIcon><ArticleIcon fontSize="small" /> </ListItemIcon>
        <ListItemText>View Requirements</ListItemText>
        </MenuItem>
         */}
        <MenuItem onClick={handleEmailRequest}>
        <ListItemIcon> <EmailIcon fontSize="small" /> </ListItemIcon>
        <ListItemText>Email Request</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={handleFormOption}>
        <ListItemIcon> <ArticleIcon fontSize="small" /></ListItemIcon>
        <ListItemText>Form Request</ListItemText>
        </MenuItem>
    </Menu>
    
      {/* Form Dialog */}
    <Dialog open={formDialogOpen} onClose={() => setFormDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle><Typography variant="h6"> Baku Entry Requirements Request</Typography></DialogTitle>
        <form onSubmit={handleFormSubmit}>
        <DialogContent>
            {submitStatus === 'success' && (<Alert severity="success" sx={{ mb: 2 }}> Your request has been submitted successfully! We'll get back to you soon.</Alert>  )}
            {submitStatus === 'error' && ( <Alert severity="error" sx={{ mb: 2 }}>There was an error submitting your request. Please try again.</Alert> )}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField fullWidth  label="Full Name"  value={formData.name} onChange={handleInputChange('name')} required  disabled={submitStatus === 'loading'} />
            <TextField  fullWidth label="Email Address"  type="email" value={formData.email} onChange={handleInputChange('email')}  required disabled={submitStatus === 'loading'} />
            <TextField fullWidth label="Phone Number"  value={formData.phone} onChange={handleInputChange('phone')} required disabled={submitStatus === 'loading'} />
            <TextField fullWidth label="Additional Message"  multiline rows={4} value={formData.message} onChange={handleInputChange('message')}  placeholder="Please specify any particular requirements or questions about Baku entry..."  disabled={submitStatus === 'loading'}/>
            </Box>
        </DialogContent>
        
        <DialogActions>
            <Button  onClick={() => setFormDialogOpen(false)} disabled={submitStatus === 'loading'}> Cancel </Button>
            <Button type="submit" className='submit-btn' sx={{bgcolor:'#0369a1', color:'white'}}  disabled={submitStatus === 'loading'} > {submitStatus === 'loading' ? 'Submitting...' : 'Submit Request'}
            </Button>
        </DialogActions>
        </form>
    </Dialog>
    </>
);
};

export default BakuEntryDropdown;