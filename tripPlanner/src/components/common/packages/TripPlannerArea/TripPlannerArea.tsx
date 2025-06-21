import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {Box,Container,Typography,TextField,FormControl,Grid,Button,Select,MenuItem,Paper, SelectChangeEvent,} from '@mui/material';
import './TripPlannerArea.scss';
import { AreaOption, Areas } from '../../../../types/types.ts';
import { TRIP_PLANNER_PAGE } from '../../../../utils/ApiConstants.ts'
import {  citiesList as cityOptions,country} from "../../../../model/selectOptions.ts"; 

const TripPlannerArea: React.FC = () => {
const location = useLocation();
const navigate = useNavigate();
const { state } = location;
const searchParams = location.state || {};
const [areas, setAreas] = useState<AreaOption[]>([]);
const [loading, setLoading] = useState<boolean>(false);
const [hotelDetails, setHotelDetails] = useState(null);
const [city, setCity] = useState<string>(searchParams.city || '');
const [country, setCountry] = useState<string>(searchParams.country);
const [applyToAllDays, setApplyToAllDays] = useState<boolean>(searchParams.applyToAllDays || false);
const [selectedCity, setSelectedCity] = useState<string>(searchParams.city || '');
const [selectedCountry, setSelectedCountry] = useState<string>(searchParams.country || '');
const [searchedCity, setSearchedCity] = useState("");
const [nights, setNights] = useState<number | string>(searchParams.nights || 1);
const totalFromRooms = (field: 'adults' | 'cwb' | 'cnb' | 'infants') => {if (Array.isArray(searchParams.rooms)) {return searchParams.rooms.reduce((sum, room) => sum + (room[field] || 0), 0);}return 0;};
const [adultsCount, setAdultsCount] = useState<number>(totalFromRooms('adults') || 2);
const [cwbCount, setCwbCount] = useState<number>(totalFromRooms('cwb') || 0);
const [cnbCount, setCnbCount] = useState<number>(totalFromRooms('cnb') || 0);
const [infantsCount, setInfantsCount] = useState<number>(totalFromRooms('infants') || 0);
    
const handleClose = () => {
let savedHotels = [];
const storedHotels = sessionStorage.getItem('tripPlannerHotels');
  if (storedHotels) {
    try {savedHotels = JSON.parse(storedHotels);}
    catch (e) {console.error('Error parsing saved hotels', e);}}
      navigate(-1);
};
const handleSearch = () => {
  const params = new URLSearchParams();
  const checkInDate = searchParams.checkInDate || new Date().toISOString();
  const currentCity = selectedCity || city;
  const currentCountry = selectedCountry || country;
  const nightsNumber = parseInt(nights as string, 10) || 1;
  params.append('checkInDate', checkInDate);
  const checkOutDateObj = new Date(new Date(checkInDate));
  checkOutDateObj.setDate(checkOutDateObj.getDate() + nightsNumber);
  const checkOutDate = checkOutDateObj.toISOString();
  params.append('checkOutDate', checkOutDate);
  params.append('city', currentCity);
  params.append('country', currentCountry || 'Georgia' || 'Azerbaijan');
  params.append('nights', String(nightsNumber));
  params.append('fromTripPlanner', 'true');
  if (searchParams.fromReadymadePackage === 'true' || searchParams.fromReadymadePackage === true) {
    params.append('fromReadymadePackage', 'true');
  }
  const complexData = {
    fromReadymadePackage: searchParams.fromReadymadePackage,
    specificDay: searchParams.specificDay,
    specificDayId: searchParams.specificDayId,
    dayNumber: searchParams.dayNumber,
    originalCheckInDate: searchParams.originalCheckInDate,
    originalCheckOutDate: searchParams.originalCheckOutDate,
    applyToAllDays: searchParams.specificDay ? false : applyToAllDays,
    allDays: searchParams.allDays,
    rooms: searchParams.rooms || []
  };
  sessionStorage.setItem('tripPlannerSearchData', JSON.stringify(complexData));
  let savedHotels = [];
  const storedHotels = sessionStorage.getItem('tripPlannerHotels');
  if (storedHotels) {
    try {
      savedHotels = JSON.parse(storedHotels);
      sessionStorage.setItem('savedHotelsForSearch', JSON.stringify(savedHotels));
    } catch (e) {
      console.error('Error parsing saved hotels', e);
    }
  }
  const rooms = searchParams.rooms || [];
  const totalAdults = rooms.reduce((sum, room) => sum + room.adults, 0);
  const totalCWB = rooms.reduce((sum, room) => sum + room.cwb, 0);
  const totalCNB = rooms.reduce((sum, room) => sum + room.cnb, 0);
  const totalInfants = rooms.reduce((sum, room) => sum + room.infants, 0);
  params.append('adults', String(totalAdults));
  params.append('cwb', String(totalCWB));
  params.append('cnb', String(totalCNB));
  params.append('infants', String(totalInfants));
  params.append('totalRooms', String(rooms.length));
  window.location.href = `${TRIP_PLANNER_PAGE}${params.toString()}`;
};

const getRoomDisplayText = () => {
  const roomCount = searchParams.rooms?.length || 1;
  if (roomCount > 1) {
    return `Total Guests (${roomCount} Rooms)`;
  }
  return "Room 1";
};

const formatDate = (dateStr) => {
  try {return new Date(dateStr).toLocaleDateString();}
  catch (e) {return dateStr || '';}
    };
    
useEffect(() => {
  if (!country) {
    const storedParams = sessionStorage.getItem('tripPlannerParams');
    if (storedParams) {
      try {
        const params = JSON.parse(storedParams);
        console.log('Retrieved params from sessionStorage:', params);
        if (params.country) {setCountry(params.country);}
        if (params.city && !city) { setCity(params.city); }
        if (params.rooms && params.rooms.length > 0) {
          setAdultsCount(params.rooms.adults || 2);
          setCwbCount(params.rooms.cwb || 0);
          setCnbCount(params.rooms.cnb || 0);
          setInfantsCount(params.rooms.infants || 0);}
      } catch (e) {
        console.error('Error parsing stored trip planner params', e);
      }
    }
  }
}, [country, city]);

const getCheckOutDate = () => {
  try {
    const checkInObj = new Date(searchParams.checkInDate);
    const checkOutObj = new Date(checkInObj);
    const nightsNumber = parseInt(nights as string, 10) || 1;
    checkOutObj.setDate(checkOutObj.getDate() + nightsNumber);
    if (searchParams.originalCheckOutDate) {
      const tripEndDate = new Date(searchParams.originalCheckOutDate);
      if (checkOutObj > tripEndDate) {
        return tripEndDate.toLocaleDateString();
      }
    }
    return checkOutObj.toLocaleDateString();
  } catch (e) {
    console.error("Error calculating check-out date:", e);
    return formatDate(searchParams.checkOutDate);
  }
};

return (
      <Box className="trip-planner-area-container">
        <Container maxWidth="lg">
          <Paper elevation={3} className="area-selection-paper">
            <Box display="flex" justifyContent="space-between" alignItems="center" className="header">
              <Typography variant="h6" color="error" className="note-text"> Note : Modify Room nights for split stay </Typography>
              <Button onClick={handleClose}  variant="contained" className="close-button">Close </Button>
            </Box>
            <Grid container spacing={3} className="selection-container">
              <Grid item xs={12} md={7}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                  <FormControl fullWidth variant="outlined" size="small" className="form-control">
                    <Select value={country || searchParams.country || ''} disabled className="select-input">
                    <MenuItem value={ searchParams.countrie || ''}>
                        { searchParams.countrie || 'Select countries'}
                      </MenuItem>
                    </Select>
                  </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth variant="outlined" size="small" className="form-control">
                      <Select value={selectedCity || searchedCity || ""}    onChange={(e) => setSelectedCity(e.target.value)} className="select-input" >
                        <MenuItem value="">  Select city </MenuItem>
                        {cityOptions.map((cityItem) => ( <MenuItem key={cityItem.id} value={cityItem.label}> {cityItem.label}</MenuItem> ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" className="label">Check In</Typography>
                    <TextField value={formatDate(searchParams.checkInDate)}  fullWidth  size="small"  variant="outlined"  className="date-input"/>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" className="label">Night/s</Typography>
                    <TextField 
                      value={nights === null || nights === undefined ? '' : nights}
                      onChange={(e) => {const value = e.target.value.trim();
                      if (value === '') { setNights('');  } else {
                      const parsedValue = parseInt(value, 10); setNights(parsedValue);}}}
                      fullWidth size="small" variant="outlined" 
                      className="nights-input" type="number" InputProps={{ inputProps: { min: 1 } }}/>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" className="label">Check Out</Typography>
                    <TextField value={getCheckOutDate()} fullWidth  size="small" variant="outlined"   className="date-input" disabled />
                  </Grid>
                  <Grid item xs={12}>

                    <Grid item xs={12}>
          <Box className="room-details">
              <Typography variant="body1" fontWeight="medium" className="room-title">  {getRoomDisplayText()}</Typography>
            <Grid container spacing={2}>
            <Grid item xs={3}>
              <Typography variant="body2" className="occupancy-label">Adult/s<br/>+12 yrs </Typography>
              <TextField value={adultsCount} onChange={(e) => setAdultsCount(parseInt(e.target.value) || 0)} fullWidth size="small"   type="number"  variant="outlined"   className="occupancy-input"  InputProps={{ inputProps: { min: 1, max: 20 } }} />
            </Grid>
            <Grid item xs={3}>
              <Typography variant="body2" className="occupancy-label"> CWB<br/>&lt;12 yrs   </Typography>
              <TextField value={cwbCount} onChange={(e) => setCwbCount(parseInt(e.target.value) || 0)} fullWidth size="small" variant="outlined"className="occupancy-input"  type="number"  InputProps={{ inputProps: { min: 0, max: 20 } }}  />
            </Grid>
            <Grid item xs={3}>
              <Typography variant="body2" className="occupancy-label">  CNB<br/>2-12 yrs </Typography>
              <TextField value={cnbCount}   onChange={(e) => setCnbCount(parseInt(e.target.value) || 0)}  fullWidth   size="small"  variant="outlined"className="occupancy-input"  type="number"  InputProps={{ inputProps: { min: 0, max: 20 } }}  />
            </Grid>
            <Grid item xs={3}>
              <Typography variant="body2" className="occupancy-label">  Infant/s<br/>&lt;2 yrs </Typography>
              <TextField  value={infantsCount} onChange={(e) => setInfantsCount(parseInt(e.target.value) || 0)} fullWidth   size="small"  variant="outlined"    className="occupancy-input"  type="number"InputProps={{ inputProps: { min: 0, max: 20 } }} />
            </Grid>
            </Grid>
            </Box></Grid>
            </Grid>
                  <Grid item xs={12}>
                    <Box display="flex" justifyContent="flex-end" className="button-container">
                      <Button variant="contained" color="error" onClick={handleSearch} className="search-button"> Search </Button>
                    </Box>
                  </Grid>
                </Grid>
              </Grid>
              <Grid item xs={12} md={5} className="image-container">
                <Box className="image-box">
                  <img 
                    src="https://www.uandiholidays.net/Admin/UploadFiles/Advertising/WhatsAppImage2023-12-02at1.09.55PM_2-12-2023-13438.jpeg" 
                    alt="Trans Studio baku" 
                    className="attraction-image"
                  />
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Container>
      </Box>
    );
};
export default TripPlannerArea;