import React, { useEffect, useState } from 'react';
import {Dialog,DialogTitle,DialogContent,DialogActions, TextField, Button,Typography,Box,IconButton, FormControl,InputLabel,Select,MenuItem, SelectChangeEvent} from '@mui/material';
import { Close } from '@mui/icons-material';
import './ClientDetailsForm.scss';
import { useSubmitLeadMutation, useUpdateLeadMutation } from '../../../../api/TourAPI.tsx';
import { ClientDetailsFormProps, Hotel, Lead, PlannerItem } from '../../../../types/types.ts';


const ClientDetailsForm: React.FC<ClientDetailsFormProps> = ({open,onClose,onSubmit,destinations,bookingRef,
  nights,travelDate,grandTotal = 0, isEditMode = false,initialClientData = null,
  marginTotal = '0',currency = 'USD' , selectedHotels = [],selectedPlannerItems = [] }) => {
  const [clientData, setClientData] = useState({name: '', destination:'',options:'package', type: 'package'});
  const [bookingStatus, setBookingStatus] = useState('confirm');
  const [isEditModeState, setIsEditModeState] = useState(false);
  const [currentBookingRef, setCurrentBookingRef] = useState('');
  
  const [updateLead] = useUpdateLeadMutation(); 
  const [submitLead] = useSubmitLeadMutation();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [plannerItems, setPlannerItems] = useState<PlannerItem[]>([]);
  
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
      console.log("Edit Lead Data from Session:", parsedData);
  
      if (parsedData.isEditMode) {
        setIsEditModeState(true);
        const ref = parsedData.bookingRef || parsedData.leadId;
        if (ref) {
          setCurrentBookingRef(ref);
        } else {
          console.error("❌ No valid bookingRef or leadId found in sessionStorage");
        }
  
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
  }
  else if (isEditMode && initialClientData) {
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
    if (!clientData.name?.trim()) {
      alert('Please enter client name');
      return;
    }
    
    const marginValue = typeof marginTotal === 'string' ? parseFloat(marginTotal) || 0 : marginTotal;
    const totalAmount = grandTotal + marginValue;
    const finalId = isEditModeState ? currentBookingRef : (bookingRef || currentBookingRef);
    if (!finalId) {
      alert('Invalid booking reference. Please try again.');
      return;
    }
    const loginEmail = localStorage.getItem('email');

    const currencyValue = typeof currency === 'number' ? currency.toString() : (currency || 'USD');
    const leadData: Partial<Lead> = {
      id: finalId,
      clientName: clientData.name.trim(),
      options: clientData.options || 'package',
      createdByEmail:loginEmail,
      travelDate: travelDate,
      totalAmount: totalAmount,
      bookingStatus: bookingStatus || 'confirm',
      destinations: clientData.destination,
      hotelDetails: hotels || [],
      plannerItems: plannerItems || [],
      lastUpdated: new Date().toISOString(),
      currency: currencyValue
    };
    if (isEditModeState) {
      const editingDataStr = sessionStorage.getItem('editingClientData');
      if (editingDataStr) {
        try {
          const editingData = JSON.parse(editingDataStr);
          leadData.creationDate = editingData.creationDate || new Date().toISOString();
          leadData.bookingTime = editingData.bookingTime || new Date().toISOString();
          leadData.paidAmount = editingData.paidAmount || 0;
        } catch (error) {
          console.error('Error parsing editing data:', error);
        }
      }
    }
    try {
      if (isEditModeState) {
        await updateLead({ id: finalId, lead: leadData }).unwrap();
      } else {
        await submitLead(leadData).unwrap();
        console.log("Lead created successfully");
      }
      sessionStorage.removeItem('editLeadData');
      sessionStorage.removeItem('editingClientData');
      onSubmit({ ...clientData, hotels,plannerItems, marginTotal, grandTotal, bookingRef: finalId, travelDate, currency: 'USD', bookingStatus, destination: clientData.destination });
      
    } catch (error) {
      console.error('Error in lead operation:', error);
      alert(isEditModeState ? 'Failed to update lead.' : 'Failed to create lead.');
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
        <Button onClick={handleSubmit} className='submit_download'> 
          {submitButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ClientDetailsForm;
