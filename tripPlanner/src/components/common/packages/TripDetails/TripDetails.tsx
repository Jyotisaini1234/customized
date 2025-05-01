import React from 'react';
import { Typography, Grid, Box ,Paper} from '@mui/material';

interface TripDetailsProps {
  hotels: any[];
  totalPrice: any;
}

const TripDetails: React.FC<TripDetailsProps> = ({ hotels, totalPrice}) => {
  
  return (
    <Box className="hotel-details-container" sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
    {hotels.length > 0 ? (
        hotels.map((hotel, index) => (<Grid 
            key={`hotel-${index}`}  className='item-container' item xs={14} md={8}
            sx={{ marginLeft: '0.5rem', maxWidth: '100%', padding: '0.5rem', marginBottom: '1rem' }}>
            <Grid container spacing={2} sx={{ bgcolor: 'white', padding: '0rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <Grid item xs={12} md={4} sx={{ '& .MuiGrid-root': { maxWidth: '21%' } }}>{hotel.hotel?.imageUrl ? (
                <img src={hotel.hotel.imageUrl} alt={hotel.hotel.hotelName}
                    style={{width: '98%',height: '10rem',objectFit: 'cover',padding: '0.5rem',borderRadius: '8px'}}/>
                ) : (
                <Box sx={{bgcolor: 'white',height: '200px',width: '100%', display: 'flex',alignItems: 'center',justifyContent: 'center', borderRadius: '8px'}}>
                    <Typography>No Image Available</Typography> </Box> )}
            </Grid>
            <Grid item xs={12} md={8} className='hotel-details'>
                <Typography variant="h6" sx={{ color: '#2c3e50', fontWeight: 'bold' }}>
                {hotel.hotel?.hotelName || "Hotel Name"}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'start', marginBottom: '1rem' }}>
                {Array(hotel.hotel?.starRating || 0).fill(0).map((_, i) => (
                    <span key={i} style={{ color: '#FFD700', fontSize: '20px' }}>★</span>
                ))}
                </Box>
                <Grid container spacing={2} className="booking-details">
                <Grid item xs={12} sm={8} md={2} className="booking-column">
                    <Typography component='span' className="details-label">
                    Check In: {new Date(hotel.booking?.checkInDate).toLocaleDateString()}
                    </Typography>
                    <Typography component='span' className="details-label">
                    Check Out: {new Date(hotel.booking?.checkOutDate).toLocaleDateString()}
                    </Typography>
                    <Typography component='span' className="details-label">
                    Nights: {hotel.booking?.nights || 1}
                    </Typography>
                </Grid>
                <Grid item xs={12} sm={8} md={2} className="booking-column">
                    <Typography component='span' className="details-label">
                    Room Type: {hotel.room?.roomCategory || hotel.booking?.roomType || "Standard Room"}
                    </Typography>
                    <Typography component='span' className="details-label">
                    Meal Plan: {hotel.room?.mealPlan || hotel.booking?.mealPlan || "BB"}
                    </Typography>
                    <Typography component='span' className="details-label">
                    Total Room(s): {hotel.booking?.totalRooms || 1}
                    </Typography>
                </Grid>
                <Grid item xs={12} sm={8} md={2} className="booking-column">
                    <Typography component='span' className="details-label">
                    Adult(s): {hotel.booking?.adults || 2}
                    </Typography>
                    <Typography component='span' className="details-label">
                    Child With Bed: {hotel.booking?.cwb || 0}
                    </Typography>
                    <Typography component='span' className="details-label">
                    Child Without Bed: {hotel.booking?.cnb || 0}
                    </Typography>
                </Grid>
                <Grid item xs={12} sm={8} md={2} className="booking-column">
                    <Typography component='span' className="details-label">
                    Total Amount: USD {totalPrice.toFixed(2) || "0.00"}
                    </Typography>
                    <Typography component='span' className="details-label">
                    Status: {hotel.room?.status || hotel.booking?.status || 'Available (Payment Needed)'}
                    </Typography>
                </Grid>
                </Grid>
            </Grid>
            </Grid>
        </Grid>
        ))
    ) : (
        <Typography variant="body1" align="center" sx={{ padding: '2rem' }}>
        No hotels selected yet. Please select hotels from the Planner tab.
        </Typography>
    )}
    </Box>
);
};

export default TripDetails;