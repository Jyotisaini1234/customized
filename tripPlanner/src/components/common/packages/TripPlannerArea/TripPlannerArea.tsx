import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {Box,Container,Typography,TextField,FormControl,Grid,Button,Select,MenuItem,Paper, SelectChangeEvent,} from '@mui/material';
import './TripPlannerArea.scss';
import { TRIP_PLANNER_PAGE } from '../../../../utils/ApiConstants.ts'
import { citiesList as cityOptions, country as countryOptions } from "../../../../model/selectOptions.ts";
import { getFromDB, STORES } from '../../../../utils/TripPlannerDB.ts';

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

const getJWTTokens = async () => {
  const [sessionRefreshToken,  localAuthToken,localRefreshToken, localAuthData,userEmail,email, userName, username,companyName,logoPath] = await Promise.all([
    getFromDB(STORES.plannerData, 'authRefreshToken', null),
    getFromDB(STORES.plannerData, 'authToken', null),
    getFromDB(STORES.plannerData, 'refreshToken', null),
    getFromDB(STORES.plannerData, 'authData', null),
    getFromDB(STORES.plannerData, 'userEmail', null),
    getFromDB(STORES.plannerData, 'email', null),
    getFromDB(STORES.plannerData, 'userName', null),
    getFromDB(STORES.plannerData, 'username', null),
    getFromDB(STORES.plannerData, 'companyName', null),
    getFromDB(STORES.plannerData, 'logoPath', null)
  ]);
  return { sessionRefreshToken, localAuthToken, localRefreshToken,localAuthData,email: userEmail || email, userName: userName || username,companyName, logoPath };
};

const buildURLWithJWTTokens = async (baseUrl: string, params: URLSearchParams): Promise<string> => {
  const tokens = await getJWTTokens();
  const url = new URL(`${baseUrl}${params.toString()}`);
  
  const activeAuthToken =  tokens.localAuthToken;
  const activeRefreshToken =  tokens.localRefreshToken;
  
  if (activeAuthToken) {
    url.searchParams.append('authToken', activeAuthToken);
    console.log('TripPlanner - Adding authToken to hotel page URL');
  }
  if (activeRefreshToken) {
    url.searchParams.append('refreshToken', activeRefreshToken);
  }
  if (tokens.email) {
    url.searchParams.append('userEmail', encodeURIComponent(tokens.email));
  }
  if (tokens.userName) {
    url.searchParams.append('userName', encodeURIComponent(tokens.userName));
  }
  if (tokens.companyName) {
    url.searchParams.append('companyName', encodeURIComponent(tokens.companyName));
  }
  if (tokens.logoPath) {
    url.searchParams.append('logoPath', encodeURIComponent(tokens.logoPath));
  }
  
  url.searchParams.append('authenticated', activeAuthToken ? 'true' : 'false');
  
  console.log('TripPlanner - Final hotel page URL with JWT tokens:', url.toString());
  return url.toString();
};

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

const handleClose = async () => {
  let savedHotels = [];
  const storedHotels = await getFromDB(STORES.hotels, 'tripPlannerHotels', []);
  if (storedHotels && storedHotels.length > 0) {
    savedHotels = storedHotels;
  }
  navigate(-1);
};

useEffect(() => {
  const loadStoredParams = async () => {
    if (!country) {
      const storedParams = await getFromDB(STORES.plannerData, 'tripPlannerParams', {});
      if (storedParams && Object.keys(storedParams).length > 0) {
        console.log('Retrieved params from IndexedDB:', storedParams);
        if (storedParams.country) {
          setCountry(storedParams.country);
        } else if (storedParams.selectedCountry) {
          setCountry(storedParams.selectedCountry);
        }
        if (storedParams.city && !city) { 
          setCity(storedParams.city); 
        } else if (storedParams.selectedCity && !city) {
          setCity(storedParams.selectedCity);
        }
        if (storedParams.rooms && storedParams.rooms.length > 0) {
          const firstRoom = storedParams.rooms[0];
          setAdultsCount(firstRoom.adults || 2);
          setCwbCount(firstRoom.cwb || 0);
          setCnbCount(firstRoom.cnb || 0);
          setInfantsCount(firstRoom.infants || 0);
        }
        
        if (storedParams.selectedCountry) {
          setSelectedCountry(storedParams.selectedCountry);
        }
        if (storedParams.selectedCity) {
          setSelectedCity(storedParams.selectedCity);
        }
      }
    }
  };
  loadStoredParams().catch(e => {
    console.error('Error loading stored trip planner params', e);
  });
}, [country, city]);

useEffect(() => {
  if (country || selectedCountry) {
    const currentCountry = country || selectedCountry;
    const countryObj = countryOptions.find(c => c.label === currentCountry);
    if (countryObj) {
      const cityBelongsToCountry = cityOptions.some(city =>  city.label === selectedCity && city.countryId === countryObj.id );
      if (!cityBelongsToCountry) {
        setSelectedCity('');
        setCity('');
      }
    }
  }
}, [country, selectedCountry]);

const handleSearch = async () => {
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
  const editLeadData = await getFromDB(STORES.plannerData, 'editLeadData', {});
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
  params.append('roomsData', encodeURIComponent(JSON.stringify(rooms)));
  const finalUrl = await buildURLWithJWTTokens(TRIP_PLANNER_PAGE, params);
  console.log('TripPlanner - Redirecting to hotel page with tokens:', finalUrl);
  window.location.href = finalUrl;
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
const getMaxNights = () => {
  if (searchParams.checkInDate && searchParams.originalCheckOutDate) {
    try {
      const checkIn = new Date(searchParams.checkInDate);
      const originalCheckOut = new Date(searchParams.originalCheckOutDate);
      const maxNights = Math.ceil((originalCheckOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      return maxNights > 0 ? maxNights : 1;
    } catch (e) {
      console.error("Error calculating max nights:", e);
      return null;
    }
  }
  return null;
};

const maxNights = getMaxNights();

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
                  <TextField value={nights === null || nights === undefined ? '' : nights} onChange={(e) => { const value = e.target.value.trim();if (value === '') {  setNights('');  
                    } else {const parsedValue = parseInt(value, 10);
                      if (maxNights && parsedValue > maxNights) { setNights(maxNights);
                      } else { setNights(parsedValue); } } }} fullWidth size="small"  variant="outlined"  className="nights-input" type="number"  InputProps={{ inputProps: {  min: 1,  max: maxNights || undefined  } }} helperText={maxNights ? `Maximum ${maxNights} nights allowed` : ''}/>
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