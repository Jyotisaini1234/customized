import React, { useState } from 'react';
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  SelectChangeEvent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import './CreateUser.scss';

interface UserFormData {
  name: string;
  email: string;
  password: string;
  role: string;
}

interface CreateUserProps {
  onClose: () => void;
}

const CreateUser: React.FC<CreateUserProps> = ({ onClose }) => {
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    password: '',
    role: ''
  });

  const [errors, setErrors] = useState<Partial<UserFormData>>({});

  const handleInputChange = (field: keyof UserFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleRoleChange = (event: SelectChangeEvent<string>) => {
    handleInputChange('role', event.target.value);
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<UserFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.role) {
      newErrors.role = 'Role is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Handle form submission logic here
      console.log('User created:', formData);
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        password: '',
        role: ''
      });
      
      alert('User created successfully!');
      onClose(); // Close modal after successful submission
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: ''
    });
    setErrors({});
  };

  return (
    <Dialog 
      open={true} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '500px',
          maxHeight: '80vh'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Create User
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Name *"
              variant="outlined"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              error={!!errors.name}
              helperText={errors.name}
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Email *"
              type="email"
              variant="outlined"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              error={!!errors.email}
              helperText={errors.email}
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Password *"
              type="password"
              variant="outlined"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              error={!!errors.password}
              helperText={errors.password}
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <FormControl fullWidth error={!!errors.role}>
              <InputLabel>Role *</InputLabel>
              <Select
                value={formData.role}
                onChange={handleRoleChange}
                label="Role *"
              >
                <MenuItem value="ADMIN">ADMIN</MenuItem>
                <MenuItem value="USER">USER</MenuItem>
              </Select>
              {errors.role && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                  {errors.role}
                </Typography>
              )}
            </FormControl>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          type="button"
          variant="outlined"
          onClick={handleReset}
          sx={{ mr: 2 }}
        >
          Reset
        </Button>
        <Button
          type="submit"
          variant="contained"
          onClick={handleSubmit}
        >
          Create User
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateUser;