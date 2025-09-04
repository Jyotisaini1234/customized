import React, { useState, useEffect } from 'react';
import { Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, Chip, Link, Button } from '@mui/material';
import { tourApi, useGetLeadByIdQuery, useGetLeadsQuery } from '../../../../api/TourAPI.tsx';
import './MyLeads.scss';
import LeadDetailsDialog from '../OnRequestBooking/LeadDetailsDialog.tsx';
import { useNavigate } from 'react-router-dom';
import { useLeadInvoiceDownload } from '../LeadInvoicePDF/LeadInvoicePDF.tsx';
import { Edit } from '@mui/icons-material';
import { Lead } from '../../../../types/types.ts';
import { AWS_INSTANCE } from '../../../../utils/ApiConstants.ts';

const MyLeads: React.FC = () => {
  const { data: leads = [], isLoading: leadsLoading, isError: leadsError } = useGetLeadsQuery();
  const { data: bookings = [], isLoading: bookingsLoading, isError: bookingsError } = tourApi.useGetAllBookingsQuery();
  const [detailsOpen, setDetailsOpen] = useState<boolean>(false);
  const navigate = useNavigate();
  const handleInvoiceDownload = useLeadInvoiceDownload();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const getStatusChip = (status: string, isTourTransfer: boolean = false) => {
    const statusLower = status?.toLowerCase();
    if (statusLower === 'confirmed') {
      return <Chip label="confirmed" color="success" />;
    } else if (statusLower === 'confirm') {
      return <Chip label="confirm" color="warning" />;
    } else {
      return <Chip label={status || 'pending'} color="default" />;
    }
  };
  
  useEffect(() => {
    sessionStorage.setItem('src', 'B.E.');
  }, [])

  const transformBookingToLead = (booking: any) => {
    const isTourTravel = booking.bookingData.packageType === 'Tours and Travels';
    const plannerItems = booking.bookingData.bookingItems?.map((item, index) => ({
      id: `booking_item_${index}`,
      date: item.date,
      dateObj: item.date,
      tours: {
        id: item._id,
        name: item.sightName,
        description: item.description,
        duration: item.type,
        currency: item.currency,
        price: item.cost,
        city: item.pickUp,
        activities: [],
        pax: item.pax,
        commuteType: item.commuteType,
        selectedActivities: item.selectedActivities || {}
      }
    })) || [];
  
    let creationDate;
    if (booking.bookingData.bookingDate?.$date) {
      creationDate = booking.bookingData.bookingDate.$date;
    } else if (booking.bookingData.bookingDate) {
      creationDate = booking.bookingData.bookingDate;
    } else if (booking.createdAt) {
      creationDate = booking.createdAt;
    } else if (booking._id && typeof booking._id === 'string' && booking._id.length >= 8) {
      creationDate = new Date(parseInt(booking._id.substring(0, 8), 16) * 1000).toISOString();
    } else {
      creationDate = booking.bookingData.createdAt || new Date().toISOString();
    }
    const totalAmount = booking.bookingData.grandTotal || booking.bookingData.totalPrice || 0;
    const actualStatus = booking.bookingData.status?.toLowerCase() || 'pending';
    const pendingAmount = totalAmount;
    const paidAmount = 0;
  
    return {
      id: booking._id,
      referenceId: booking.bookingData.bookingReference,
      options: booking.bookingData.packageType,
      status: actualStatus,
      clientName: booking.bookingData.name,
      email: booking.bookingData.email,
      creationDate: creationDate,
      destinations: booking.bookingData.bookingItems?.[0]?.pickUp || booking.bookingData.city || 'N/A',
      travelDate: booking.bookingData.bookingItems?.[0]?.date || new Date().toISOString(),
      totalAmount: totalAmount,
      pendingAmount: pendingAmount,
      paidAmount: paidAmount,
      currency: booking.bookingData.currency || 'USD',
      isBooking: true,
      isTourTransfer: isTourTravel,
      originalBookingData: booking,
      plannerItems: plannerItems,
      hotelDetails: [],
      costs: {
        finalAmount: totalAmount,
        packageDetails: {
          totalPersons: booking.bookingData.bookingItems?.[0]?.pax || 1
        }
      },
      totalPersons: booking.bookingData.bookingItems?.[0]?.pax || 1,
      country: booking.bookingData.country || booking.bookingData.city || '',
      currentSearchParams: {
        country: booking.bookingData.country || booking.bookingData.city || '',
        city: booking.bookingData.bookingItems?.[0]?.pickUp || booking.bookingData.city || ''
      }
    };
  };
  
  const combinedData = [
    ...leads.map(lead => ({ ...lead, isBooking: false })),
    ...bookings.map(transformBookingToLead)
  ];

  const sortedData = combinedData.sort((a, b) => 
    new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime()
  );

  const handleLeadDetails = (lead: any) => {
    setSelectedLead(lead);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
  };

  const handleEditLead = (lead: Lead) => {
    if (lead.isBooking && lead.isTourTransfer) {
      const bookingData = lead.originalBookingData?.bookingData;
      
      if (!bookingData) {
        alert('Booking data not found. Please refresh the list.');
        return;
      }
      const city = bookingData.city || bookingData.bookingItems?.[0]?.pickUp || '';
      const country = bookingData.country || '';
      const pax = bookingData.bookingItems?.[0]?.pax || 1;
      const bookingId = lead.referenceId || lead.id;
      const checkInDate = bookingData.checkInDate || '';
      const checkOutDate = bookingData.checkOutDate || '';
      
      const packageType = bookingData.packageType || 'Tours and Travels';
      const params = new URLSearchParams({
        city: city,
        country: country,
        pax: pax.toString(),
        bookingId: bookingId,
        editMode: 'true',
        packageType: packageType,
        checkInDate: checkInDate,
        checkOutDate: checkOutDate,
      });
      const editModeData = {
        isEditMode: true,
        bookingId: bookingId,
        originalBookingData: bookingData,
        packageType: packageType,
        checkInDate: checkInDate,
        checkOutDate: checkOutDate,
        modificationCount: (bookingData.modificationCount || 0),
        lastModified: bookingData.lastUpdated || bookingData.lastModified,
        originalType: packageType,
        allowMultipleModifications: true
      };
      sessionStorage.setItem('editModeData', JSON.stringify(editModeData));
      const bookingItemsForEdit = bookingData.bookingItems?.map(item => ({
        ...item,
        type: item.type,
        originalType: item.type,
        sightName: item.sightName,
        pickUp: item.pickUp || city,
        cost: item.cost,
        currency: item.currency,
        pax: item.pax,
        date: item.date,
        selectedActivities: item.selectedActivities || {}
      })) || [];
      sessionStorage.setItem('bookingData', JSON.stringify(bookingItemsForEdit));
      const searchParams = {
        city: city,
        country: country,
        state: city,
        startDate: checkInDate,
        endDate: checkOutDate,
        packageType: packageType
      };
      sessionStorage.setItem('searchParams', JSON.stringify(searchParams));
      window.location.href = `${AWS_INSTANCE}/hotel/home-page?${params.toString()}`;
      return;
    }
    if (lead.isBooking && !lead.isTourTransfer) {
      alert('Regular package bookings cannot be edited from this interface.');
      return;
    }
    sessionStorage.clear();
    const leadId = lead.id;
    const selectedLead = leads.find((l) => (l._id || l.id) === leadId);
    if (!selectedLead) {
      alert('Lead not found. Please refresh the list.');
      return;
    }
    const checkInDate = new Date(selectedLead.travelDate);
    const nights = parseInt(selectedLead.nights || '1');
    const checkOutDate = new Date(checkInDate.getTime() + nights * 24 * 60 * 60 * 1000);
    const totalPersons = parseInt(selectedLead.totalPersons || '1');
    const rooms = selectedLead.totalRooms ?
      selectedLead.totalRooms.map((room, index) => ({
        id: index + 1,
        adults: room.adults || 2,
        cwb: room.cwb || 0,
        cnb: room.cnb || 0,
        infants: room.infants || 0
      })) :
      selectedLead.searchParams?.rooms || [
        {
          id: 1,
          adults: selectedLead.adult || totalPersons || 2,
          cwb: selectedLead.cwb || 0,
          cnb: selectedLead.cnb || 0,
          infants: 0
        }
      ];
    const roomsDataString = JSON.stringify(rooms);
    const roomsDataEncoded = decodeURIComponent(roomsDataString);
    const editLeadData = {
      leadId,
      bookingRef: selectedLead.bookingNo || selectedLead.referenceId,
      isEditMode: true,
      modificationCount: (selectedLead.modificationCount || 0),
      allowMultipleModifications: true,
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
        roomsData: roomsDataEncoded,
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
          id: item.id,
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
      bookingStatus: "confirm",
      currency: selectedLead.currency,
      creationDate: selectedLead.creationDate || new Date().toISOString(),
      bookingTime: selectedLead.bookingTime || selectedLead.creationDate || new Date().toISOString(),
    };
    
    sessionStorage.setItem('editingClientData', JSON.stringify({ 
      id: leadId,
      originalLeadId: leadId,
      bookingNo: selectedLead.bookingNo || selectedLead.referenceId, 
      clientName: selectedLead.clientName,
      creationDate: selectedLead.creationDate, 
      bookingTime: selectedLead.bookingTime || selectedLead.creationDate,
      paidAmount: selectedLead.paidAmount || 0,
      totalAmount: selectedLead.totalAmount || 0,
      pendingAmount: selectedLead.pendingAmount || 0,
      modificationCount: (selectedLead.modificationCount || 0),
      allowMultipleModifications: true
    }));
    sessionStorage.setItem('editLeadData', JSON.stringify(editLeadData));
    sessionStorage.setItem('src', 'lead');
    navigate({
      pathname: '/trip-planner'
    });
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      let date;
      if (dateString.includes('$date')) {
        date = new Date(dateString.$date);
      } else if (dateString.includes('-')) {
        date = new Date(dateString);
      } else {
        const parts = dateString.split('-');
        if (parts.length === 3) {
          const months = {
            'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
            'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
          };
          date = new Date(parseInt(parts[2]), months[parts[1]], parseInt(parts[0]));
        } else {
          date = new Date(dateString);
        }
      }
      return date.toLocaleDateString();
    } catch (error) {
      return dateString;
    }
  };

  const canEdit = (lead: Lead) => {
    if (lead.isBooking && lead.isTourTransfer) {
      return true;
    }
    if (lead.isBooking && !lead.isTourTransfer) {
      return false;
    }
    return true;
  };

  const isLoading = leadsLoading || bookingsLoading;
  const isError = leadsError || bookingsError;
  if (isLoading) return <Typography>Loading leads...</Typography>;
  if (isError) return <Typography>Error loading leads.</Typography>;

  return (
    <Box sx={{ padding: 0 }}>
      <Typography variant="h5" gutterBottom>My Leads</Typography>
      <Table sx={{ bgcolor: 'white' ,width:'77rem'}}>
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
          {sortedData && sortedData.length > 0 ? (
            sortedData.map((lead) => (
              <TableRow key={`${lead.isBooking ? 'booking' : 'lead'}-${lead.id}`}>
                <TableCell> <Button sx={{textTransform: 'none', fontWeight: 'bold',   padding: 0,     minWidth: 'auto',textAlign: 'left', color: '#0275d8' }}onClick={() => handleLeadDetails(lead)} > {lead.referenceId} </Button>  </TableCell>
                <TableCell> <Button  onClick={() => handleEditLead(lead)}sx={{minWidth: 'auto',  color: !canEdit(lead) ? '#ccc' : '#0275d8','&:hover': { backgroundColor: canEdit(lead) ? 'rgba(2, 117, 216, 0.1)' : 'transparent' }}}>  <Edit fontSize="small" /></Button>  </TableCell>
                <TableCell>{lead.options}</TableCell>
                <TableCell className='status'>{getStatusChip(lead.status, lead.isTourTransfer)}</TableCell>
                <TableCell>{lead.clientName}</TableCell>
                <TableCell>{new Date(lead.creationDate).toLocaleString()}</TableCell>
                <TableCell>{getCorrectDestination(lead)}</TableCell>
                <TableCell>{formatDate(lead.travelDate)}</TableCell>
                <TableCell> <Link component="button"  variant="body2" onClick={() => handleInvoiceDownload(lead)} sx={{cursor: 'pointer',    color: '#0275d8',   textDecoration: 'none'   }}  >   Invoice  </Link> </TableCell>
                <TableCell><Link component="button"   variant="body2"   onClick={() => handleInvoiceDownload(lead)} sx={{  cursor: 'pointer',   color: '#0275d8',  textDecoration: 'none'    }} >   Itinerary   </Link></TableCell>
                <TableCell>{lead.totalAmount} USD</TableCell>
                <TableCell>{lead.pendingAmount || '0'} USD</TableCell>
                <TableCell>{lead.paidAmount}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={13} align="center">   No leads or bookings available. </TableCell>
            </TableRow> )}
        </TableBody>
      </Table>
      <LeadDetailsDialog    open={detailsOpen}  onClose={handleCloseDetails}  selectedLead={selectedLead}   />
    </Box>
  );
};

export default MyLeads;
