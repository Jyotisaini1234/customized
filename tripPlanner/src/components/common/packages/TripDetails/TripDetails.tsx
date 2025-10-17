import React from 'react';
import { Typography, Grid, Box } from '@mui/material';
import './TripDetails.scss';

interface TripDetailsProps {
  hotels: any[];
  totalPrice: any;
  tripEndDate?: string;
}

const TripDetails: React.FC<TripDetailsProps> = ({ hotels, totalPrice, tripEndDate }) => {

const formatDate = (dateString: string | Date) => {
    if (!dateString) return 'N/A';
    try {
    if (typeof dateString === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {return dateString;}
    let date: Date;
    if (dateString instanceof Date) {
        date = dateString;
    } else {
        date = new Date(dateString);
    }
    if (isNaN(date.getTime())) {
        if (typeof dateString === 'string' && dateString.includes('-')) {
        const parts = dateString.split('-');
        if (parts.length === 3) {
            date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        }
        }
    }
    if (isNaN(date.getTime())) {return typeof dateString === 'string' ? dateString : 'N/A';
    }
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
    } catch (error) {
    console.error('Error formatting date:', error);
    return typeof dateString === 'string' ? dateString : 'N/A';
    }
};

const calculateHotelDates = (hotel: any, index: number, allHotels: any[]) => {
    const nights = parseInt(hotel.booking?.nights) || 1;
    if (index === 0) {
    const checkIn = new Date(hotel.booking?.checkInDate);
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + nights);
    if (tripEndDate) {
        const tripEnd = new Date(tripEndDate);
        if (checkOut > tripEnd) {
        return { checkIn, checkOut: tripEnd };
        }}
    return { checkIn, checkOut };
    }
    let checkIn = new Date(hotel.booking?.checkInDate);
    for (let i = 0; i < index; i++) {
    const prevHotel = allHotels[i];
    const prevNights = parseInt(prevHotel.booking?.nights) || 1;
    if (i === 0) {checkIn = new Date(prevHotel.booking?.checkInDate);}checkIn.setDate(checkIn.getDate() + prevNights);
    }
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + nights);
    if (tripEndDate) {
    const tripEnd = new Date(tripEndDate);
    if (checkOut > tripEnd) {return { checkIn, checkOut: tripEnd };}
    }
    return { checkIn, checkOut };
};

return (
    <Box className="hotel-details-container" sx={{ bgcolor: "transparent", boxShadow: "none" }}>
    {hotels.length > 0 ? (
        hotels.map((hotel, index) => {
        const { checkIn: actualCheckIn, checkOut: actualCheckOut } = calculateHotelDates(hotel, index, hotels);

return (
    <Grid key={`hotel-${index}`} className="item-container" item xs={14} md={8} sx={{marginLeft: "0.5rem", maxWidth: "100%", padding: "0.5rem", marginBottom: "1rem", }}>
    <Grid container spacing={2}>
                <Grid item xs={12} md={4}sx={{ "& .MuiGrid-root": { maxWidth: "21%" } }} > {hotel.hotel?.imageUrl ? (
                    <img src={hotel.hotel.imageUrl}alt={hotel.hotel.hotelName}style={{width: "98%", height: "10rem", objectFit: "cover", padding: "0.5rem", borderRadius: "8px",}}/>
                    ) : (
                    <Box sx={{ bgcolor: "white", height: "200px",  width: "100%", display: "flex",alignItems: "center", justifyContent: "center", borderRadius: "8px",}} ><Typography>No Image Available</Typography>
                    </Box>)}</Grid>
                <Grid item xs={12} md={8} className="hotel-details">
                <Typography  variant="h6"  sx={{ color: "#2c3e50", fontWeight: "bold" }} >{hotel.hotel?.hotelName || hotel.hotel?.name ||"Hotel Name"}</Typography>
                <Box sx={{display: "flex",justifyContent: "start",   marginBottom: "1rem", }}>
                    {Array(hotel.hotel?.starRating || 0).fill(0).map((_, i) => (<span key={i}  style={{ color: "#FFD700", fontSize: "20px" }}> ★</span> ))}
                </Box>
                <Grid container spacing={2} className="booking-details">
                    <Grid item xs={12} sm={8} md={2} className="booking-column">
                    <Typography component="span" className="details-label"> Check In: {formatDate(actualCheckIn)}</Typography>
                    <Typography component="span" className="details-label"> Check Out: {formatDate(actualCheckOut)}</Typography>
                    <Typography component="span" className="details-label"> Nights: {hotel.booking?.nights || 1} </Typography>
                    </Grid>
                    <Grid item xs={12} sm={8} md={2} className="booking-column">
                    <Typography component="span" className="details-label">Room Type:{" "}{hotel.room?.roomCategory || hotel.booking?.roomType || "Standard Room"}</Typography>
                    <Typography component="span" className="details-label"> Meal Plan:{" "} {hotel.room?.mealPlan || hotel.booking?.mealPlan || "BB"}
                    </Typography>
                    <Typography component="span" className="details-label">Total Room(s): {hotel.booking?.totalRooms || 1}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={8} md={2} className="booking-column">
                    <Typography component="span" className="details-label">
                        Adult(s): {hotel.booking?.adults || 2} </Typography>
                    <Typography component="span" className="details-label">
                        Child With Bed: {hotel.booking?.cwb || 0} </Typography>
                    <Typography component="span" className="details-label"> Child Without Bed: {hotel.booking?.cnb || 0} </Typography>
                    </Grid>
                    <Grid item xs={12} sm={8} md={2} className="booking-column">
                    <Typography component="span" className="details-label">
                        Total Amount:{" "} {hotel.booking?.currency || "USD"}{" "} {hotel.booking?.totalPrice || 0}</Typography>
                    <Typography component="span" className="details-label">
                        Status:{" "}  {hotel.room?.status || hotel.booking?.status || "Available (Payment Needed)"} </Typography>
                    </Grid>
                </Grid>
                </Grid>
            </Grid>
            </Grid>
        );
        })
    ) : (
        <Typography variant="body1" align="center"sx={{ padding: "2rem" }}>No hotels selected yet. Please select hotels from the Planner tab.</Typography>
    )}
    </Box>
);
}

export default TripDetails;