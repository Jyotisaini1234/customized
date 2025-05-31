import React from 'react';
import {Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Grid, Divider} from '@mui/material';
import HotelIcon from '@mui/icons-material/Hotel';
import AttractionsIcon from '@mui/icons-material/Attractions';
import PersonIcon from '@mui/icons-material/Person';
import PaymentIcon from '@mui/icons-material/Payment';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import MapIcon from '@mui/icons-material/Map';
import './LeadDetailsDialog.scss';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

interface LeadDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  selectedLead: any;
}

const LeadDetailsDialog: React.FC<LeadDetailsDialogProps> = ({ open, onClose, selectedLead }) => {
  if (!selectedLead) return null;

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (e) {
      return 'N/A';
    }
  };

  const hotelDetails = selectedLead.hotelDetails || [];
  const activityDetails = selectedLead.activityDetails || [];
  const plannerItems = selectedLead.plannerItems || [];
  
  const personDetails = selectedLead.details?.persons || {
    adults: selectedLead.adults || 0,
    children: selectedLead.children || 0,
    total: selectedLead.totalPersons || 0
  };

  const calculateTotalAmount = () => {
    if (selectedLead.totalAmount) return parseFloat(selectedLead.totalAmount);
    if (selectedLead.totalPrice) return parseFloat(selectedLead.totalPrice);
    
    let total = 0;
    
    if (hotelDetails && hotelDetails.length > 0) {
      hotelDetails.forEach((hotel: any) => {
        total += hotel.totalPrice || 0;
      });
    }
    
    if (activityDetails && activityDetails.length > 0) {
      activityDetails.forEach((activity: any) => {
        total += activity.price || 0;
      });
    }
    
    return total;
  };

  const getPendingAmount = () => {
    const totalAmount = calculateTotalAmount();
    if (selectedLead.pendingAmount !== undefined && selectedLead.pendingAmount !== null) {
      return selectedLead.pendingAmount;
    }
    if (selectedLead.paidAmount !== undefined && selectedLead.paidAmount !== null) {
      return (totalAmount - selectedLead.paidAmount).toFixed(2);
    }
    return totalAmount.toFixed(2);
  };
  const bookingRef = selectedLead?.referenceId || selectedLead?.bookingNo || selectedLead?.id;

  const handlePdfDownload = () => {
        if (!bookingRef) {
          alert('Booking reference is missing. Cannot generate PDF.');
          return;
        }
        const pdfUrl = `/tour-package-pdf?bookingRef=${bookingRef}`;
        window.open(pdfUrl, '_blank');
      };
    


  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
            Booking Details: {selectedLead.referenceId || selectedLead.bookingNo}
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Grid container spacing={3}>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                <LocationOnIcon fontSize="small" sx={{ mr: 1 }} color="primary" />
                <Typography variant="h6">Trip Details</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Typography gutterBottom><strong>Travel Date:</strong> {formatDate(selectedLead.travelDate)}</Typography>
              <Typography gutterBottom><strong>Nights:</strong> {selectedLead.nights || 'N/A'}</Typography>
              <Typography gutterBottom>
                <strong>Travelers:</strong> {selectedLead.totalPersons || 'N/A'} Person(s)
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                <PaymentIcon fontSize="small" sx={{ mr: 1 }} color="primary" />
                <Typography variant="h6">Payment Details</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Typography gutterBottom><strong>Total Amount:</strong> {calculateTotalAmount().toFixed(2)}</Typography>
              <Typography gutterBottom><strong>Pending Amount:</strong> {getPendingAmount()}</Typography>
              <Typography><strong>Payment Status:</strong> {selectedLead.paymentStatus || 'Pending'}</Typography>
            </Box>
          </Grid>
          {hotelDetails && hotelDetails.length > 0 && (
            <Grid item xs={12}>
              <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                  <HotelIcon fontSize="small" sx={{ mr: 1 }} color="primary" />
                  <Typography variant="h6">Hotel Details</Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                
                <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ mb: 2 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: 'primary.light' }}>
                      <TableRow>
                        <TableCell>Hotel Name</TableCell>
                        <TableCell>Room Type</TableCell>
                        <TableCell>Meal Plan</TableCell>
                        <TableCell>Check-In</TableCell>
                        <TableCell>Check-Out</TableCell>
                        <TableCell>Nights</TableCell>
                        <TableCell>Stars</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {hotelDetails.map((hotel: any, index: number) => (
                        <TableRow key={index} hover>
                          <TableCell>{hotel.hotelName || 'N/A'}</TableCell>
                          <TableCell>{hotel.roomType || 'N/A'}</TableCell>
                          <TableCell>{hotel.mealPlan || 'N/A'}</TableCell>
                          <TableCell>{formatDate(hotel.checkInDate)}</TableCell>
                          <TableCell>{formatDate(hotel.checkOutDate)}</TableCell>
                          <TableCell>{hotel.nights || selectedLead.nights || 'N/A'}</TableCell>
                          <TableCell>{hotel.starRating || 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Grid>
          )}
          {plannerItems && plannerItems.length > 0 && (
            <Grid item xs={12}>
              <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                  <MapIcon fontSize="small" sx={{ mr: 1 }} color="primary" />
                  <Typography variant="h6">Tour Itinerary</Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                
                {plannerItems.map((item: any, index: number) => (
                  <Box key={index} sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, bgcolor: 'primary.light', p: 1, borderRadius: 1 }}>
                      Day {index + 1}: {item.date || 'N/A'}
                    </Typography>
                    {item.tours ? (
                      <>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                          {item.tours.name || 'Day Activities'}
                        </Typography>
                        
                        <Typography sx={{ whiteSpace: 'pre-line', mb: 2, pl: 2 }}>
                          {item.tours.description || 'No activities planned'}
                        </Typography>
                        
                        {item.tours.activities && item.tours.activities.length > 0 && (
                          <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ mb: 2 }}>
                            <Table size="small">
                              <TableHead sx={{ bgcolor: 'primary.light' }}>
                                <TableRow>
                                  <TableCell>Activity Name</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {item.tours.activities.map((activity: any, actIndex: number) => (
                                  <TableRow key={actIndex} hover>
                                    <TableCell>{activity.name || 'N/A'}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        )}
                        
                      </>
                    ) : (
                      <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
                        Free day - No activities planned
                      </Typography>
                    )}
                    
                    <Divider sx={{ mt: 2 }} />
                  </Box>
                ))}
              </Box>
            </Grid>
          )}
          
          {/* Activity Details */}
          {activityDetails && activityDetails.length > 0 && (
            <Grid item xs={12}>
              <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                  <AttractionsIcon fontSize="small" sx={{ mr: 1 }} color="primary" />
                  <Typography variant="h6">Activity Details</Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                
                <TableContainer component={Paper} elevation={0} variant="outlined">
                  <Table size="small">
                    <TableHead sx={{ bgcolor: 'primary.light' }}>
                      <TableRow>
                        <TableCell>Activity Name</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {activityDetails.map((activity: any, index: number) => (
                        <TableRow key={index} hover>
                          <TableCell>{activity.activityName || 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      
      <DialogActions sx={{ p: 2 }}>
        <Button  variant="contained" 
          startIcon={<PictureAsPdfIcon />}  onClick={handlePdfDownload} sx={{   bgcolor: 'green', color: 'white', '&:hover': {   bgcolor: 'darkgreen' }  }}>
          Download PDF
        </Button>
        <Button variant="contained" sx={{color:'white', bgcolor:'red'}} onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default LeadDetailsDialog;
