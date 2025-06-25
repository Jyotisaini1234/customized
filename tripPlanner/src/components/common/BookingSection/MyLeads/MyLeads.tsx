import React, { useState } from 'react';
import { Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, Chip, Link, Button } from '@mui/material';
import { tourApi, useGetLeadByIdQuery, useGetLeadsQuery } from '../../../../api/TourAPI.tsx';
import './MyLeads.scss';
import LeadDetailsDialog from '../OnRequestBooking/LeadDetailsDialog.tsx';
import { useNavigate } from 'react-router-dom';
import { useLeadInvoiceDownload } from '../LeadInvoicePDF/LeadInvoicePDF.tsx';
import { Edit } from '@mui/icons-material';
import { Lead } from '../../../../types/types.ts';
import { useDispatch } from 'react-redux';

const MyLeads: React.FC = () => {
const { data: leads = [], isLoading, isError } = useGetLeadsQuery();
const [detailsOpen, setDetailsOpen] = useState<boolean>(false);
const navigate = useNavigate();
const handleInvoiceDownload = useLeadInvoiceDownload();
const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

const getStatusChip = (status: string) => {
  if (status === 'confirmed') {
    return <Chip label="confirmed" color="success" />;
  } else {
    return <Chip label="confirm" color="warning" />;
  }
};

const handleLeadDetails = (lead: any) => {
  setSelectedLead(lead);
  setDetailsOpen(true);
};

const handleCloseDetails = () => {
  setDetailsOpen(false);
};

const handleEditLead = (lead: Lead) => {
  const leadId =lead.id;
  const selectedLead = leads.find((l) => (l._id || l.id) === leadId);
  if (!selectedLead) {
    alert(' Lead not found. Please refresh the list.');
    return;
  }
  const checkInDate = new Date(selectedLead.travelDate);
  const nights = parseInt(selectedLead.nights || '1');
  const checkOutDate = new Date(checkInDate.getTime() + nights * 24 * 60 * 60 * 1000);
  const totalPersons = parseInt(selectedLead.totalPersons || '1');
  const rooms = selectedLead.searchParams?.rooms || [
    {
      adults: selectedLead.adult || totalPersons || 2,
      cwb: selectedLead.cwb || 0,
      cnb: selectedLead.cnb || 0,
      infants: 0
    }
  ];

  const editLeadData = {
    leadId,
    bookingRef: selectedLead.bookingNo || selectedLead.referenceId,
    isEditMode: true,
    clientData: {
      name: selectedLead.clientName || '',
      options: selectedLead.options || selectedLead.type || 'package',
      destination: selectedLead.destinations || '',
    },
    currentSearchParams: {
      city: selectedLead.destinations || '',
      country: selectedLead.country || '',
      checkInDate: checkInDate.toISOString().split('T')[0],
      checkOutDate: checkOutDate.toISOString().split('T')[0],
      nights,
      rooms,
      totalPersons
    },
    hotelDetails: (selectedLead.hotelDetails || []).map((hotel, index) => ({
      id: hotel.id || `hotel_${index}`,
      uniqueId: hotel.uniqueId || `hotel-${Date.now()}-${index}`,
      hotel: {
        hotelName: hotel.hotelName || hotel.completeHotelData?.hotelName || 'Unknown Hotel',
        description: hotel.description || hotel.completeHotelData?.description || '',
        starRating: hotel.starRating || hotel.completeHotelData?.starRating || '',
        city: hotel.city || selectedLead.destinations || '',
        roomsOccupancyDetails: hotel.roomOccupancy || hotel.completeHotelData?.roomsOccupancyDetails || []
      },
      booking: {
        roomType: hotel.roomType || hotel.completeBookingData?.roomType || 'Standard',
        mealPlan: hotel.mealPlan || hotel.completeBookingData?.mealPlan || 'None',
        checkInDate: hotel.checkInDate || checkInDate.toISOString(),
        checkOutDate: hotel.checkOutDate || checkOutDate.toISOString(),
        nights: hotel.nights || nights,
        totalPrice: parseFloat(hotel.totalPrice || hotel.completeBookingData?.totalPrice || 0),
        currency: hotel.currency || selectedLead.currency || 'USD',
        totalRooms: hotel.totalRooms || hotel.completeBookingData?.totalRooms || 1
      },
      city: hotel.city || selectedLead.destinations || '',
      specificDayId: hotel.specificDayId || null
    })),

    plannerItems: (selectedLead.plannerItems || []).map((item, index) => ({
      id: item.id || `planner_${index}`,
      date: item.date || '',
      dateObj: item.dateObj || item.date || '',
      tours: item.tours ? {
        id: item.id ,
        name: item.tours.name || 'Tour',
        description: item.tours.description || '',
        duration: item.tours.duration || 'N/A',
        currency: item.tours.currency || selectedLead.currency,
        price: parseFloat(item.tours.price || 0),
        city: item.tours.city || selectedLead.destinations || '',
        activities: Array.isArray(item.tours.activities) ? item.tours.activities : [],
      } : null,
    })),
    totalAmount: selectedLead.totalAmount || 0,
    pendingAmount: selectedLead.pendingAmount || 0,
    paidAmount: selectedLead.paidAmount || 0,
    grandTotal: selectedLead.costs?.grandTotal || selectedLead.totalAmount || 0,
    marginTotal: selectedLead.costs?.marginTotal || 0,
    bookingStatus: selectedLead.status || selectedLead.bookingStatus || 'confirmed',
    currency: selectedLead.currency,
    creationDate: selectedLead.creationDate || new Date().toISOString(),
    bookingTime: selectedLead.bookingTime || selectedLead.creationDate || new Date().toISOString(),
    nights,
    totalRooms: selectedLead.totalRooms || 1,
    adult: selectedLead.adult || totalPersons,
    cnb: selectedLead.cnb || 0,
    cwb: selectedLead.cwb || 0
  };
  sessionStorage.setItem('editingClientData', JSON.stringify({ id: leadId,originalLeadId: leadId,bookingNo: selectedLead.bookingNo || selectedLead.referenceId, clientName: selectedLead.clientName,creationDate: selectedLead.creationDate, bookingTime: selectedLead.bookingTime || selectedLead.creationDate,paidAmount: selectedLead.paidAmount || 0,totalAmount: selectedLead.totalAmount || 0,pendingAmount: selectedLead.pendingAmount || 0}));
  sessionStorage.setItem('editLeadData', JSON.stringify(editLeadData));
  console.log('Edit data saved to sessionStorage:', editLeadData);
  navigate(`/trip-planner?editMode=true&bookingRef=${editLeadData.bookingRef}`);
};

const getCorrectDestination = (lead) => {
  if (lead.currentSearchParams && lead.currentSearchParams.city) {
    return lead.currentSearchParams.city;
  }
  if (lead.clientDetails && lead.clientDetails.destinations) {
    return lead.clientDetails.destinations;
  }
  return lead.destinations || "N/A";
};
if (isLoading) return <Typography>Loading leads...</Typography>;
if (isError) return <Typography>Error loading leads.</Typography>;

return (
      <Box sx={{ padding: 3 }}>
        <Typography variant="h5" gutterBottom>My Leads</Typography>

        {isLoading ? (
          <Typography>Loading leads...</Typography>
        ) : isError ? (
          <Typography>Error loading leads.</Typography>
        ) : (
          <Table sx={{ bgcolor: 'white' }}>
            <TableHead sx={{ bgcolor: 'lightgrey' }}>
              <TableRow>
                <TableCell><strong>Reference No.</strong></TableCell>
                <TableCell><strong>Edit</strong></TableCell>
                <TableCell><strong>Type</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>Creation Time</strong></TableCell>
                <TableCell><strong>Destinations</strong></TableCell>
                <TableCell><strong>Travel Date</strong></TableCell>
                <TableCell><strong>Invoice</strong></TableCell>
                <TableCell><strong>Itinerary</strong></TableCell>
                <TableCell><strong>Total Amount</strong></TableCell>
                <TableCell><strong>Pending Amount</strong></TableCell>
                <TableCell><strong>Amount Paid</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {leads && leads.length > 0 ? (
                leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <Button sx={{ textTransform: 'none', fontWeight: 'bold', padding: 0, minWidth: 'auto', textAlign: 'left', color: '#0275d8'}} 
                        onClick={() => handleLeadDetails(lead)}>
                        {lead.referenceId}
                      </Button>
                    </TableCell>
                    <TableCell>
                    <Button
                      onClick={() => handleEditLead(lead)}
                      sx={{minWidth: 'auto', padding: '4px 8px', color: '#0275d8' }} >
                      <Edit fontSize="small" />
                    </Button>
                    </TableCell>
                    <TableCell>{lead.options}</TableCell>
                    <TableCell className='status'>{getStatusChip(lead.status)}</TableCell>
                    <TableCell>{lead.clientName}</TableCell>
                    <TableCell>{new Date(lead.creationDate).toLocaleString()}</TableCell>
                    <TableCell>{getCorrectDestination(lead)}</TableCell>
                    <TableCell>{new Date(lead.travelDate).toLocaleDateString()}</TableCell>
                    <TableCell> <Link component="button"variant="body2" onClick={() => handleInvoiceDownload(lead)}sx={{ cursor: 'pointer', color: '#0275d8', textDecoration: 'none' }}> 
                        Invoice
                      </Link>
                    </TableCell>
                    <TableCell> <Link component="button"variant="body2" onClick={() => handleInvoiceDownload(lead)}sx={{ cursor: 'pointer', color: '#0275d8', textDecoration: 'none' }}> 
                        Itinerary
                      </Link>
                    </TableCell>
                    <TableCell>{lead.totalAmount}</TableCell>
                    <TableCell>{lead.pendingAmount || '0'}</TableCell>
                    <TableCell>{lead.paidAmount}</TableCell>

                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={12} align="center">
                    No leads available.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
        
        <LeadDetailsDialog open={detailsOpen} onClose={handleCloseDetails}selectedLead={selectedLead} />
      </Box>
    );
  };

export default MyLeads;

