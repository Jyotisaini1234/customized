import React, { useState } from 'react';
import {Dialog,DialogTitle,DialogContent,DialogActions, TextField, Button,Typography,Box,IconButton, FormControl,InputLabel,Select,MenuItem, SelectChangeEvent} from '@mui/material';
import { Close } from '@mui/icons-material';
import './ClientDetailsForm.scss';
import { useSubmitLeadMutation } from '../../../../api/TourAPI.tsx';
import { ClientDetailsFormProps } from '../../../../types/types.ts';


const ClientDetailsForm: React.FC<ClientDetailsFormProps> = ({open,onClose,onSubmit,destinations,bookingRef,nights,travelDate}) => {
  const [clientData, setClientData] = useState({name: '',email: '',phone: '',from:'', conversion: '',options:'option 1'});
  const handleChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setClientData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };
  const [submitLead] = useSubmitLeadMutation();
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setClientData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };
const handleSubmit = async () => {
    if (!clientData.name) {
      alert('Please fill in all required fields');
      return;
    }
  
    const newLead = {
      id: bookingRef,
      clientName: clientData.name,
      email: clientData.email,
      phone: clientData.phone,
      from: clientData.from,
      conversion: clientData.conversion,
      options: clientData.options,
      creationDate: new Date().toISOString(),
      status: 'New Lead',
      destinations: destinations,
      travelDate: travelDate,
      nights: nights || 1,
    };
  
    try {
      await submitLead(newLead).unwrap();
      onSubmit(clientData);
    } catch (err) {
      console.error('Error submitting lead:', err);
      alert('Failed to submit lead.');
    }
  };
  
  return (
    <Dialog  open={open}  onClose={onClose}  maxWidth="sm"  className="client-details-dialog">
      <DialogTitle>
        <Box className='heading'>
          <Box> <Typography variant="h6">Client Details</Typography></Box>
          <Box> <IconButton onClick={onClose} size="small"> <Close /> </IconButton></Box>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <TextField autoFocus margin="dense"  name="name"label="Client Name *" type="text" fullWidth variant="outlined" value={clientData.name} onChange={handleInputChange} required />
        <TextField margin="dense" name="email" label="email "   type="email" fullWidth variant="outlined" value={clientData.email}onChange={handleInputChange} required />
        <TextField margin="dense" name="phone" label="Phone Number "  type="tel" fullWidth variant="outlined" value={clientData.phone}  onChange={handleInputChange} required />
        <TextField margin="dense" name="conversion" label="Conversion" type="text" fullWidth variant="outlined"value={clientData.conversion}onChange={handleInputChange}required/>
        <TextField margin="dense" name="from" label="From" type="text" fullWidth variant="outlined"value={clientData.from}onChange={handleInputChange}required/>

        <FormControl fullWidth margin="dense">
          <InputLabel id="payment-mode-label">Options</InputLabel>
          <Select labelId="payment-mode-label" name="options" value={clientData.options} label="option 1" onChange={handleChange}>
            <MenuItem value="option 1">option 1</MenuItem>
            <MenuItem value="option 2">option 2</MenuItem>
            <MenuItem value="option 3">option 3</MenuItem>
          </Select>
        </FormControl>

      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{bgcolor:'grey',color:'white'}}> Cancel </Button>
        <Button onClick={handleSubmit} variant="contained" sx={{bgcolor:'red'}}> Submit & Download</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ClientDetailsForm;