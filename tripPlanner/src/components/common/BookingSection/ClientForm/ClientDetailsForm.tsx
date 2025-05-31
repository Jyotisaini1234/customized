import React, { useEffect, useState } from 'react';
import {Dialog,DialogTitle,DialogContent,DialogActions, TextField, Button,Typography,Box,IconButton, FormControl,InputLabel,Select,MenuItem, SelectChangeEvent} from '@mui/material';
import { Close } from '@mui/icons-material';
import './ClientDetailsForm.scss';
import { useSubmitLeadMutation, useUpdateLeadMutation } from '../../../../api/TourAPI.tsx';
import { ClientDetailsFormProps } from '../../../../types/types.ts';


const ClientDetailsForm: React.FC<ClientDetailsFormProps> = ({open,onClose,onSubmit,destinations,bookingRef,
  nights,travelDate,grandTotal = 0, isEditMode = false,initialClientData = null,
  marginTotal = '0',currency = 'USD'}) => {
  const [clientData, setClientData] = useState({name: '', destination:'',options:'package', type: 'package'});
  const [bookingStatus, setBookingStatus] = useState('confirmed');
  const [isEditModeState, setIsEditModeState] = useState(false);
  const [currentBookingRef, setCurrentBookingRef] = useState('');
  
  const [updateLead] = useUpdateLeadMutation(); 
  const [submitLead] = useSubmitLeadMutation();

  const handleChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setClientData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setClientData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

useEffect(() => {
  const editLeadData = sessionStorage.getItem('editLeadData');
  
  if (editLeadData) {
    try {
      const parsedData = JSON.parse(editLeadData);
      console.log(" Edit Lead Data from Session:", parsedData);
      
      if (parsedData.isEditMode) {
        setIsEditModeState(true);
        setCurrentBookingRef(parsedData.bookingRef || parsedData.leadId);
        
        if (parsedData.clientData) {
          setClientData(prevData => ({
            ...prevData,
            name: parsedData.clientData.name || '',
            options: parsedData.clientData.options || 'package',
          }));
        }
      }
    } catch (error) {
      console.error("Error parsing edit lead data:", error);
    }
  } else if (isEditMode && initialClientData) {
    setIsEditModeState(true);
    setCurrentBookingRef(bookingRef);
    setClientData(initialClientData);
  } else {
    setIsEditModeState(false);
    setCurrentBookingRef(bookingRef);
  }
}, [open, isEditMode, initialClientData, bookingRef]);



useEffect(() => {
    if (!open) {
      sessionStorage.removeItem('editLeadData');
    }
  }, [open]);



  const handleSubmit = async () => {
    if (!clientData.name) {
      alert('Please fill in all required fields');
      return;
    }
    
    const marginValue = typeof marginTotal === 'string' ? parseFloat(marginTotal) || 0 : marginTotal;
    const totalAmount = grandTotal + marginValue;
    const finalId = isEditModeState ? currentBookingRef : (bookingRef || currentBookingRef);
    
    const leadData = {
      id: finalId,
      clientName: clientData.name,
      options: clientData.options,
      travelDate: travelDate,
      totalAmount: totalAmount,
      bookingStatus: bookingStatus,
      destination: clientData.destination,
      ...(isEditModeState && (() => {
        const editingDataStr = sessionStorage.getItem('editingClientData');
        const editingData = editingDataStr ? JSON.parse(editingDataStr) : null;
        
        return {
          creationDate: editingData?.creationDate || new Date().toISOString(),
          bookingTime: editingData?.bookingTime || new Date().toISOString(),
        };
      })())
      
    };
    console.log("📌 Final ID for operation:", finalId);
    console.log("📌 isEditMode:", isEditModeState);
    console.log("📌 Lead Data:", leadData);
    try {
      if (isEditModeState) {
        await updateLead({ id: finalId, lead: leadData }).unwrap();
      } else {
        await submitLead(leadData).unwrap();
      }
      sessionStorage.removeItem('editLeadData');
      onSubmit(clientData);
    } catch (err) {
      alert('Failed to submit lead.');
    }
  };

  const submitButtonText = isEditModeState ? 'Update & Download' : 'Submit & Download';

  return (
    <Dialog  open={open}  onClose={onClose}  maxWidth="sm"  className="client-details-dialog">
      <DialogTitle>
        <Box className='heading'>
        <Box>
            <Typography variant="h6">
              {isEditModeState ? 'Edit Client Details' : 'Client Details'}
            </Typography>
          </Box>
          <Box>
            <IconButton onClick={onClose} size="small">  <Close /></IconButton>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
      <TextField autoFocus   margin="dense"    name="name" label="Client Name *"  type="text"  fullWidth  variant="outlined"  value={clientData.name}  onChange={handleInputChange}  required  />
        <FormControl fullWidth margin="dense">
          <InputLabel id="option-mode-label">Options</InputLabel>
          <Select labelId="option-mode-label" name="options" value={clientData.options} label="package"  onChange={handleChange}>
            <MenuItem value="package">Package</MenuItem>
            <MenuItem value="flight"> Flight</MenuItem>
          </Select>
        </FormControl>

      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{bgcolor:'grey',color:'white'}}> Cancel </Button>
        <Button onClick={handleSubmit} variant="contained" sx={{bgcolor:'red'}}> 
          {submitButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ClientDetailsForm;



