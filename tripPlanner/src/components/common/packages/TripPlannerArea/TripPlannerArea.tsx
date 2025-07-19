import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {Box,Container,Typography,TextField,FormControl,Grid,Button,Select,MenuItem,Paper, SelectChangeEvent,} from '@mui/material';
import './TripPlannerArea.scss';
import { AreaOption, Areas } from '../../../../types/types.ts';
import { TRIP_PLANNER_PAGE } from '../../../../utils/ApiConstants.ts'
import { citiesList as cityOptions, country as countryOptions } from "../../../../model/selectOptions.ts";

const TripPlannerArea: React.FC = () => {
const location = useLocation();
const navigate = useNavigate();
const { state } = location;
const searchParams = location.state || {};
const [city, setCity] = useState<string>(searchParams.city || '');
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
const [country, setCountry] = useState<string>(searchParams.country || searchParams.selectedCountry);

const getFilteredCities = () => {
  if (!country && !selectedCountry) {
    return [];
  }
  
  const currentCountry = country || selectedCountry;
  const countryObj = countryOptions.find(c => c.label === currentCountry);
  
  if (!countryObj) {
    return [];
  }
  
  return cityOptions.filter(city => city.countryId === countryObj.id);
};
const filteredCities = getFilteredCities();
const getTotalBookedNights = () => {
  const savedHotels = sessionStorage.getItem('tripPlannerHotels');
  if (savedHotels) {
    try {
      const hotels = JSON.parse(savedHotels);
      return hotels.reduce((total, hotel) => total + (hotel.nights || 0), 0);
    } catch (e) {
      console.error('Error parsing saved hotels', e);
      return 0;
    }
  }
  return 0;
};

const getMaxNightsAllowed = () => {
  const originalTotalNights = searchParams.originalNights || searchParams.totalNights || 5;
  const bookedNights = getTotalBookedNights();
  const remainingNights = originalTotalNights - bookedNights;
  return Math.max(remainingNights, 1); // minimum 1 night
};
const [maxNightsAllowed, setMaxNightsAllowed] = useState<number>(getMaxNightsAllowed());
useEffect(() => {
  setMaxNightsAllowed(getMaxNightsAllowed());
}, []);
const handleClose = () => {
let savedHotels = [];
const storedHotels = sessionStorage.getItem('tripPlannerHotels');
  if (storedHotels) {
    try {savedHotels = JSON.parse(storedHotels);}
    catch (e) {console.error('Error parsing saved hotels', e);}}
      navigate(-1);
};

useEffect(() => {
  if (!country) {
    const storedParams = sessionStorage.getItem('tripPlannerParams');
    if (storedParams) {
      try {
        const params = JSON.parse(storedParams);
        console.log('Retrieved params from sessionStorage:', params);
        if (params.country) {
          setCountry(params.country);
        } else if (params.selectedCountry) {
          setCountry(params.selectedCountry);
        }
        if (params.city && !city) { 
          setCity(params.city); 
        } else if (params.selectedCity && !city) {
          setCity(params.selectedCity);
        }
        
        if (params.rooms && params.rooms.length > 0) {
          const firstRoom = params.rooms[0]; // Get first room data
          setAdultsCount(firstRoom.adults || 2);
          setCwbCount(firstRoom.cwb || 0);
          setCnbCount(firstRoom.cnb || 0);
          setInfantsCount(firstRoom.infants || 0);
        }
        if (params.selectedCountry) {
          setSelectedCountry(params.selectedCountry);
        }
        if (params.selectedCity) {
          setSelectedCity(params.selectedCity);
        }
        
      } catch (e) {
        console.error('Error parsing stored trip planner params', e);
      }
    }
  }
}, [country, city]);

useEffect(() => {
  if (country || selectedCountry) {
    const currentCountry = country || selectedCountry;
    const countryObj = countryOptions.find(c => c.label === currentCountry);
    if (countryObj) {
      const cityBelongsToCountry = cityOptions.some(city => 
        city.label === selectedCity && city.countryId === countryObj.id
      );
      if (!cityBelongsToCountry) {
        setSelectedCity('');
        setCity('');
      }
    }
  }
}, [country, selectedCountry]);

const handleSearch = () => {
  const params = new URLSearchParams();
  const checkInDate = searchParams.checkInDate || new Date().toISOString();
  const currentCity = selectedCity || city;
  const nightsNumber = parseInt(nights as string, 10) || 1;
  params.append('checkInDate', checkInDate);
  const checkOutDateObj = new Date(new Date(checkInDate));
  checkOutDateObj.setDate(checkOutDateObj.getDate() + nightsNumber);
  const checkOutDate = checkOutDateObj.toISOString();
  params.append('checkOutDate', checkOutDate);
  params.append('city', currentCity);
  params.append('country', country);
  params.append('nights', String(nightsNumber));
  params.append('fromTripPlanner', 'true');
  if (searchParams.fromReadymadePackage === 'true' || searchParams.fromReadymadePackage === true) {
        params.append('fromReadymadePackage', 'true');
      }
  if (searchParams.specificDay) {
    params.append('specificDay', 'true');
    if (searchParams.specificDayId) {
      params.append('specificDayId', searchParams.specificDayId);
    }
    if (searchParams.dayNumber) {
      params.append('dayNumber', searchParams.dayNumber);
    }
  }
  params.append('applyToAllDays', searchParams.specificDay ? 'false' : String(applyToAllDays));
  
  if (searchParams.allDays) {
    params.append('allDays', JSON.stringify(searchParams.allDays));
  }
const editLeadData = JSON.parse(sessionStorage.getItem('editLeadData') || '{}');
const leadId = editLeadData.leadId || searchParams.leadId || null;
if (leadId) {
  params.append('bookingRef', leadId);
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
  params.append('roomsData',  encodeURIComponent(JSON.stringify(rooms)));
  window.location.href = `${TRIP_PLANNER_PAGE}${params.toString()}`;
};

const formatDate = (dateStr) => {
  try {return new Date(dateStr).toLocaleDateString();}
  catch (e) {return dateStr || '';}
    };

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

const getRoomDisplayText = () => {
  const roomCount = searchParams.rooms?.length || 1;
  if (roomCount > 1) {
    return `Total Guests (${roomCount} Rooms)`;
  }
  return "Room 1";
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
                    <Select value={country || selectedCountry || searchParams.country || ''}  disabled  className="select-input" >
                    <MenuItem value="">Select country</MenuItem>
                    {(country || selectedCountry || searchParams.country) && (<MenuItem value={country || selectedCountry || searchParams.country}> {country || selectedCountry || searchParams.country}</MenuItem>)}
                    {countryOptions && countryOptions.map((countryItem) => (<MenuItem key={countryItem.id} value={countryItem.label}>  {countryItem.label} </MenuItem>))}</Select>
                  </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth variant="outlined" size="small" className="form-control">
                      <Select value={selectedCity || searchedCity || ""}  onChange={(e) => setSelectedCity(e.target.value)}   className="select-input" disabled={!country && !selectedCountry}  >
                        <MenuItem value="">Select city</MenuItem>
                        {filteredCities.map((cityItem) => ( <MenuItem key={cityItem.id} value={cityItem.label}> {cityItem.label} </MenuItem> ))}
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
                <Box className="image-box"> <img src="https://assets.micontenthub.com/traveloffers/travel-tips/baku_OIPJAbO-S.jpg"  alt="Trans Studio baku"  className="attraction-image" /> </Box>
              </Grid>
            </Grid>
          </Paper>
        </Container>
      </Box>
    );
};

export default TripPlannerArea;