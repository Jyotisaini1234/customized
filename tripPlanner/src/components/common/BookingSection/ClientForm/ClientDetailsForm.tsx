import React, { useEffect, useState } from 'react';
import {Dialog,DialogTitle,DialogContent,DialogActions, TextField, Button,Typography,Box,IconButton, FormControl,InputLabel,Select,MenuItem, SelectChangeEvent} from '@mui/material';
import { Close } from '@mui/icons-material';
import './ClientDetailsForm.scss';
import { useSubmitLeadMutation, useUpdateLeadMutation } from '../../../../api/TourAPI.tsx';
import { ClientDetailsFormProps, Lead, PlannerItem } from '../../../../types/types.ts';
import { Hotel } from '../../../../types/hotel.types.ts';


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
  setClientData((prevData) => ({...prevData,[name]: value,}));};

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
          console.error("No valid bookingRef or leadId found in sessionStorage");
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
    const formData = {
      name: clientData.name.trim(),
      options: clientData.options || 'package',
      destination: destinations || clientData.destination,
      bookingStatus: bookingStatus || 'confirm',
      hotels: selectedHotels,
      plannerItems: selectedPlannerItems,
      marginTotal: marginTotal,
      grandTotal: grandTotal,
      bookingRef: isEditModeState ? currentBookingRef : bookingRef,
      travelDate: travelDate,
      currency: typeof currency === 'number' ? currency.toString() : (currency || 'USD'),
      isEditMode: isEditModeState,
      currentBookingRef: currentBookingRef
    };
    onSubmit(formData);
  };
  const submitButtonText = isEditModeState ? 'Update & Download' : 'Submit & Download';

  return (
    <Dialog  open={open}  onClose={onClose}  maxWidth="sm"  className="client-details-dialog">
      <DialogTitle>
        <Box className='heading'>
        <Box>
        <Typography variant="h6">{isEditModeState ? 'Edit Client Details' : 'Client Details'}</Typography>
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
