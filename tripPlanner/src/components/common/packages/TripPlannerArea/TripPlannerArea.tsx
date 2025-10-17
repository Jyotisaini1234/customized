import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {Box,Container,Typography,TextField,FormControl,Grid,Button,Select,MenuItem,Paper} from '@mui/material';
import './TripPlannerArea.scss';
import { BASE_URL, TRIP_PLANNER_PAGE } from '../../../../utils/ApiConstants.ts'
import { citiesList as cityOptions, country as countryOptions } from "../../../../model/selectOptions.ts";
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../../store/store.tsx';
import { setTripPlannerParams, setCurrentSearchParams, updateSearchParams } from '../../../../store/slices/tripPlannerSlice.ts';
import { setSearchDetails, setSearchParams } from '../../../../store/slices/hotelSlice.ts';

const TripPlannerArea: React.FC = () => {
const dispatch = useDispatch();
const location = useLocation();
const navigate = useNavigate();
const searchParams = location.state || {};
const tripPlannerState = useSelector((state: RootState) => state.tripPlanner);
const hotelState = useSelector((state: RootState) => state.hotel);
const [sessionId, setSessionId] = useState<string>(() => {const existingSessionId = searchParams.sessionId || tripPlannerState.currentSearchParams?.sessionId ||hotelState.searchDetails?.sessionId;if (existingSessionId) {console.log('TripPlanner - Using existing sessionId:', existingSessionId);return existingSessionId;}
const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`; console.log('TripPlanner - Generated new sessionId:', newSessionId); return newSessionId;});
const [city, setCity] = useState<string>(searchParams.city || tripPlannerState.city ||  hotelState.searchDetails?.city || '');
const [applyToAllDays] = useState<boolean>(searchParams.applyToAllDays || false);
const [selectedCity, setSelectedCity] = useState<string>(searchParams.city || tripPlannerState.city || hotelState.searchDetails?.city || '' );
const [selectedCountry, setSelectedCountry] = useState<string>(searchParams.country || tripPlannerState.country || hotelState.searchDetails?.country ||  '');
const [searchedCity] = useState("");
const [nights, setNights] = useState<number | string>(searchParams.nights || tripPlannerState.nights ||  hotelState.searchDetails?.nights || 1);
const [authData, setAuthData] = useState({authToken: null,refreshToken: null,userEmail: null,username: null,companyName: null,logoPath: null});
const getJWTTokens = async () => {try {return {sessionRefreshToken: null,localAuthToken: authData.authToken, localRefreshToken: authData.refreshToken, localAuthData: authData,email: authData.userEmail, username: authData.username, companyName: authData.companyName,logoPath: authData.logoPath };} catch (error) { console.error('Error retrieving JWT tokens:', error);return {sessionRefreshToken: null,localAuthToken: null,localRefreshToken: null, localAuthData: null,email: null,username: null,companyName: null,logoPath: null};}};
const buildURLWithJWTTokens = async (baseUrl: string, params: URLSearchParams, sessionId?: string): Promise<string> => {
const tokens = await getJWTTokens();
const url = new URL(`${baseUrl}${params.toString()}`);
const activeAuthToken = tokens.localAuthToken;
const activeRefreshToken = tokens.localRefreshToken;if (activeAuthToken) {url.searchParams.append('authToken', activeAuthToken);}if (activeRefreshToken) {url.searchParams.append('refreshToken', activeRefreshToken);}if (tokens.email) {url.searchParams.append('userEmail', encodeURIComponent(tokens.email));}if (sessionId) {url.searchParams.append('sessionId', sessionId); console.log('TripPlanner - Adding sessionId to hotel page URL:', sessionId);}url.searchParams.append('authenticated', activeAuthToken ? 'true' : 'false'); return url.toString();};
const totalFromRooms = (field: 'adults' | 'cwb' | 'cnb' | 'infants') => {
const roomsData = searchParams.roomDetails ||  searchParams.rooms ||   searchParams.room ||  tripPlannerState.rooms ||  hotelState.searchDetails?.rooms ||  [];if (Array.isArray(roomsData)) {return roomsData.reduce((sum, room) => sum + (room[field] || 0), 0);} return 0;};
const [adultsCount, setAdultsCount] = useState<number>(totalFromRooms('adults') || 2);
const [cwbCount, setCwbCount] = useState<number>(totalFromRooms('cwb') || 0);
const [cnbCount, setCnbCount] = useState<number>(totalFromRooms('cnb') || 0);
const [infantsCount, setInfantsCount] = useState<number>(totalFromRooms('infants') || 0);
const [country, setCountry] = useState<string>(searchParams.country || searchParams.selectedCountry || tripPlannerState.country || hotelState.searchDetails?.country ||  '' );
const getFilteredCities = () => {if (!country && !selectedCountry) { return []; }
const currentCountry = country || selectedCountry;
const countryObj = countryOptions.find(c => c.label === currentCountry);if (!countryObj) {return []; }return cityOptions.filter(city => city.countryId === countryObj.id);};
const filteredCities = getFilteredCities();
const handleClose = async () => { const savedHotels = hotelState.hotelDetails || [];console.log('Saved hotels from Redux:', savedHotels.length);navigate(-1);};
const urlParams = new URLSearchParams(window.location.search);
const selectedDayIndex = parseInt(urlParams.get('selectedDayIndex') || '0', 10);
const availableNights = parseInt(urlParams.get('availableNights') || '1', 10);
const maxAvailableNights = parseInt(urlParams.get('maxNights') || '1', 10);
const [isEditMode, setIsEditMode] = useState<boolean>(false);
const [originalLeadId, setOriginalLeadId] = useState<string | null>(null);
const [bookingRef, setBookingRef] = useState<string | null>(null);

const calculateDatesForSelectedDay = () => {
  try {
      const originalStartDate = searchParams.originalMainTripParams?.checkInDate || tripPlannerState.currentSearchParams?.checkInDate || searchParams.checkInDate ||hotelState.searchDetails?.checkInDate;
      if (!originalStartDate) {
          console.error('No original start date found, using current date');
          const fallbackDate = new Date();
          const nightsNumber = parseInt(nights as string, 10) || 1;
          const checkOutDate = new Date(fallbackDate);
          checkOutDate.setDate(fallbackDate.getDate() + nightsNumber);
          return {checkInDate: fallbackDate,checkOutDate: checkOutDate };
      }
      const checkInDate = new Date(originalStartDate);
      if (isNaN(checkInDate.getTime())) {
          console.error('Invalid start date, using current date');
          const fallbackDate = new Date();
          const nightsNumber = parseInt(nights as string, 10) || 1;
          const checkOutDate = new Date(fallbackDate);
          checkOutDate.setDate(fallbackDate.getDate() + nightsNumber);
          return {checkInDate: fallbackDate,checkOutDate: checkOutDate};
      }
      checkInDate.setDate(checkInDate.getDate() + selectedDayIndex);
      const nightsNumber = parseInt(nights as string, 10) || 1;
      const checkOutDate = new Date(checkInDate);
      checkOutDate.setDate(checkOutDate.getDate() + nightsNumber);
      return { checkInDate, checkOutDate };
  } catch (error) {
      console.error('Error calculating dates:', error);
      const fallbackDate = new Date();
      const nightsNumber = parseInt(nights as string, 10) || 1;
      const checkOutDate = new Date(fallbackDate);
      checkOutDate.setDate(fallbackDate.getDate() + nightsNumber);
      return {checkInDate: fallbackDate,checkOutDate: checkOutDate };
  }
};
const { checkInDate: calculatedCheckInDate, checkOutDate: calculatedCheckOutDate } = calculateDatesForSelectedDay();

useEffect(() => {
    const loadStoredParams = async () => {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const isTemporarySearch = urlParams.get('isTemporaryHotelSearch') === 'true' || urlParams.get('isHotelSpecific') === 'true';
            if (isTemporarySearch) {console.log('Loading temporary hotel search params - NOT updating main trip params'); return;}
            if (!country && (tripPlannerState.country || hotelState.searchDetails?.country)) {
            const storedCountry = tripPlannerState.country || hotelState.searchDetails?.country;
            if (storedCountry) {console.log('Loading country from main trip params:', storedCountry);setCountry(storedCountry);}
            }
        } catch (e) {console.error('Error loading trip planner params', e);
        }
    };
    loadStoredParams();
}, [tripPlannerState, hotelState.searchDetails, sessionId]);

useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const editMode = urlParams.get('isEditMode') === 'true' || urlParams.get('editModeActive') === 'true' ||searchParams.isEditMode === 'true';
  const leadId = urlParams.get('originalLeadId') || searchParams.originalLeadId;
  const bookingReference = urlParams.get('bookingRef') || searchParams.bookingRef;
  if (editMode) {
    setIsEditMode(editMode);
    setOriginalLeadId(leadId);
    setBookingRef(bookingReference);
  }
}, []);
useEffect(() => {
    if (country || selectedCountry) {
      const currentCountry = country || selectedCountry;
      const countryObj = countryOptions.find(c => c.label === currentCountry);
      if (countryObj) {
        const cityBelongsToCountry = cityOptions.some(city =>city.label === selectedCity && city.countryId === countryObj.id );
        if (!cityBelongsToCountry) {setSelectedCity('');setCity('');}
      }
    }
  }, [country, selectedCountry]);
const handleSearch = async () => {
    const params = new URLSearchParams();
    const checkInDate = searchParams.checkInDate || new Date().toISOString();
    const currentCity = selectedCity || city;
    const nightsNumber = parseInt(nights as string, 10) || 1;
    const urlParams = new URLSearchParams(window.location.search);
    const selectedDayIndex = parseInt(urlParams.get('selectedDayIndex') || '0', 10);
    const specificDayId = urlParams.get('specificDayId') || searchParams.specificDayId;
    const availableNights = parseInt(urlParams.get('availableNights') || '1', 10);
    const maxAvailableNights = parseInt(urlParams.get('maxNights') || '1', 10);
    const originalTripStartDate = new Date(searchParams.originalMainTripParams?.checkInDate || checkInDate);
    const hotelCheckInDate = new Date(originalTripStartDate);
    hotelCheckInDate.setDate(hotelCheckInDate.getDate() + selectedDayIndex);
    const hotelCheckOutDate = new Date(hotelCheckInDate);
    hotelCheckOutDate.setDate(hotelCheckOutDate.getDate() + nightsNumber);
    params.append('checkInDate', hotelCheckInDate.toISOString());
    params.append('checkOutDate', hotelCheckOutDate.toISOString());
    params.append('city', currentCity);
    params.append('country', country);
    params.append('nights', String(nightsNumber));
    params.append('fromTripPlanner', 'true');
    params.append('sessionId', sessionId);
    params.append('isTemporaryHotelSearch', 'true');
    params.append('isHotelSpecific', 'true');
    params.append('selectedDayIndex', selectedDayIndex.toString());
    params.append('specificDayId', specificDayId);
    params.append('availableNights', availableNights.toString());
    if (isEditMode) {
      params.append('isEditMode', 'true');
      params.append('editModeActive', 'true');
      if (originalLeadId) {
        params.append('originalLeadId', originalLeadId);
      }
      if (bookingRef) {
        params.append('bookingRef', bookingRef);
      }
    }
    if (searchParams.fromReadymadePackage === 'true' || searchParams.fromReadymadePackage === true) {
      params.append('fromReadymadePackage', 'true');
    }
    if (searchParams.specificDay) {
      params.append('specificDay', 'true');
      if (specificDayId) {
        params.append('specificDayId', specificDayId);
      }
      if (searchParams.dayNumber) {
        params.append('dayNumber', searchParams.dayNumber);
      }
    }
    params.append('applyToAllDays', 'false');
    if (searchParams.allDays) {
      params.append('allDays', JSON.stringify(searchParams.allDays));
    }
    const leadId = tripPlannerState.currentSearchParams?.leadId || searchParams.leadId || null;
    if (leadId) {
      params.append('bookingRef', leadId);
    }
    const roomsData = searchParams.roomDetails || searchParams.rooms || searchParams.room || tripPlannerState.rooms || [];
    console.log('Room data for hotel search:', roomsData);
    let totalAdults = 0;
    let totalCWB = 0;
    let totalCNB = 0;
    let totalInfants = 0;
    if (Array.isArray(roomsData) && roomsData.length > 0) {
      totalAdults = roomsData.reduce((sum, room) => sum + (room.adults || 0), 0);
      totalCWB = roomsData.reduce((sum, room) => sum + (room.cwb || 0), 0);
      totalCNB = roomsData.reduce((sum, room) => sum + (room.cnb || 0), 0);
      totalInfants = roomsData.reduce((sum, room) => sum + (room.infants || 0), 0);
    } else {
      totalAdults = adultsCount || 2;
      totalCWB = cwbCount || 0;
      totalCNB = cnbCount || 0;
      totalInfants = infantsCount || 0;
    }
    params.append('adults', String(totalAdults));
    params.append('cwb', String(totalCWB));
    params.append('cnb', String(totalCNB));
    params.append('infants', String(totalInfants));
    params.append('totalRooms', String(roomsData.length || 1));
    params.append('roomsData', encodeURIComponent(JSON.stringify(roomsData)));
    const searchData = {
      country,
      city: currentCity,
      checkInDate: hotelCheckInDate.toISOString(),
      checkOutDate: hotelCheckOutDate.toISOString(),
      nights: nightsNumber,
      rooms: roomsData.length > 0 ? roomsData : [{
        id: 1,
        adults: totalAdults, 
        cwb: totalCWB, 
        cnb: totalCNB,
        infants: totalInfants
      }],
      packageType: 'hotel-land',
      searchTimestamp: Date.now(),
      leadId,
      applyToAllDays: false,
      specificDay: true,
      specificDayId: specificDayId,
      selectedDayIndex: selectedDayIndex,
      dayNumber: selectedDayIndex + 1,
      allDays: searchParams.allDays,
      fromReadymadePackage: searchParams.fromReadymadePackage,
      sessionId: sessionId,
      isTemporaryHotelSearch: true,
      isHotelSpecific: true,
      preserveMainTripParams: true,
      isEditMode: isEditMode,
      originalLeadId: originalLeadId,
      bookingRef: bookingRef,
      originalMainTripParams: searchParams.originalMainTripParams || {
        checkInDate: searchParams.checkInDate,
        checkOutDate: searchParams.checkOutDate || searchParams.originalCheckOutDate,
        nights: searchParams.nights || searchParams.originalNights,
        city: searchParams.city,
        country: searchParams.country,
        packageType: searchParams.packageType || 'hotel-land',
        rooms: searchParams.rooms
      }
    };
    
    dispatch(setSearchDetails({
      checkInDate: hotelCheckInDate.toISOString(),
      checkOutDate: hotelCheckOutDate.toISOString(), 
      nights: nightsNumber,
      city: currentCity,
      country, 
      rooms: searchData.rooms,
      packageType: 'hotel-land',
      sessionId: sessionId,
      isTemporarySearch: true,
      selectedDayIndex: selectedDayIndex,
      specificDayId: specificDayId
    }));
    await updateBackendSearchParams(searchData, false, true);
    const finalUrl = await buildURLWithJWTTokens(TRIP_PLANNER_PAGE, params, sessionId);
    window.location.href = finalUrl;
  };
const updateBackendSearchParams = async (searchData: any, isNew: boolean = false, isTemporary: boolean = false) => {
  try {
    const currentSessionId = sessionId || tripPlannerState.currentSearchParams?.sessionId || tripPlannerState.sessionId;
    if (!currentSessionId) {
      console.error('No sessionId available for backend update');
      return;
    }
    const updatePayload = {
      ...searchData,
      sessionId: currentSessionId,
      isNewSearch: isNew,
      isTemporaryHotelSearch: isTemporary, 
      timestamp: Date.now(),
      isEditMode: isEditMode,
      originalLeadId: originalLeadId,
      bookingRef: bookingRef,
      updateExisting: isEditMode,
      preserveBookingId: isEditMode
    };
    const response = await fetch(`${BASE_URL}/sightTour/planner/search-params`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Email': authData.userEmail || 'guest@example.com',
        'User-Role': 'USER'
      },
      body: JSON.stringify(updatePayload)
    });
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Backend search params updated:', result);
    } else {
      console.error('❌ Failed to update backend search params:', response.statusText);
    }
  } catch (error) {
    console.error('❌ Error updating backend search params:', error);
  }
};

const getRoomDisplayText = () => {
  const roomsData = searchParams.roomDetails || searchParams.rooms ||  searchParams.room || tripPlannerState.rooms || [];
  const roomCount = Array.isArray(roomsData) ? roomsData.length : 1;
  if (roomCount > 1) { return `Total Guests (${roomCount} Rooms)`;}
  return "Room 1";
};

const formatDate = (dateInput) => {
  try {
      if (!dateInput) return '';
      let date;
      if (dateInput instanceof Date) { date = dateInput;
      } else if (typeof dateInput === 'string') {date = new Date(dateInput);
      } else {return '';}
      if (isNaN(date.getTime())) {return '';}
      return date.toLocaleDateString('en-GB', {day: '2-digit', month: '2-digit', year: 'numeric'  });
  } catch (e) {
      console.error('Error formatting date:', e);
      return '';
  }
};

const getCheckOutDate = () => {
  try {return formatDate(calculatedCheckOutDate)}
  catch (e) { console.error("Error calculating check-out date:", e);return '';}
};

const getMaxNights = () => {
  try {
      const originalTripEnd = searchParams.originalMainTripParams?.checkOutDate || tripPlannerState.currentSearchParams?.checkOutDate || searchParams.originalCheckOutDate || searchParams.checkOutDate;
      if (originalTripEnd && calculatedCheckInDate) {
          const tripEndDate = new Date(originalTripEnd);
          const maxNights = Math.ceil((tripEndDate.getTime() - calculatedCheckInDate.getTime()) / (1000 * 60 * 60 * 24));
          return maxNights > 0 ? maxNights : 1;
      }
      return maxAvailableNights || availableNights || 1;
  } catch (e) {
      console.error("Error calculating max nights:", e);
      return availableNights || 1;
  }
};
const formatCheckInDate = () => {
  try {
      const checkInSources = [calculatedCheckInDate, searchParams.checkInDate,tripPlannerState.currentSearchParams?.checkInDate, hotelState.searchDetails?.checkInDate,searchParams.originalMainTripParams?.checkInDate];
      console.log('Check-in date sources:', checkInSources);
      for (const dateSource of checkInSources) {
          if (dateSource) {
              let date;
              if (dateSource instanceof Date) {date = dateSource;} 
              else if (typeof dateSource === 'string') {date = new Date(dateSource); }
              if (date && !isNaN(date.getTime())) {
                  const formatted = date.toLocaleDateString('en-GB', {day: '2-digit', month: '2-digit',year: 'numeric' });
                  console.log('Formatted check-in date:', formatted);
                  return formatted;
              }
          }
      }

      const today = new Date();
      return today.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch (error) {
      console.error('Error formatting check-in date:', error);
      return '';
  }
};
const maxNights = getMaxNights();

  return (
    <Box className="trip-planner-area-container">
      <Container maxWidth="lg">
        <Paper elevation={3} className="area-selection-paper">
          <Box display="flex" justifyContent="space-between" alignItems="center" className="header">
            <Typography variant="h6" color="error" className="note-text">  Note : Modify Room nights for split stay </Typography>
          </Box>
          <Grid container spacing={3} className="selection-container">
            <Grid item xs={12} md={7}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth variant="outlined" size="small" className="form-control">
                    <Select value={country || selectedCountry || searchParams.country || ''}  disabled className="select-input" >
                      <MenuItem value="">Select country</MenuItem>
                      {(country || selectedCountry || searchParams.country) && (<MenuItem value={country || selectedCountry || searchParams.country}>  {country || selectedCountry || searchParams.country}</MenuItem> )}
                      {countryOptions && countryOptions.map((countryItem) => (<MenuItem key={countryItem.id} value={countryItem.label}>  {countryItem.label} </MenuItem> ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth variant="outlined" size="small" className="form-control">
                    <Select value={selectedCity || searchedCity || ""}  onChange={(e) => setSelectedCity(e.target.value)}     className="select-input" disabled={!country && !selectedCountry} >
                      <MenuItem value="">Select city</MenuItem>{filteredCities.map((cityItem) => (  <MenuItem key={cityItem.id} value={cityItem.label}>  {cityItem.label} </MenuItem>  ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" className="label">Check In</Typography>
                  <TextField  value={formatCheckInDate()}fullWidth size="small"  variant="outlined"  className="date-input" disabled />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" className="label">Night/s</Typography>
                  <TextField value={nights === null || nights === undefined ? '' : nights}  onChange={(e) => {  const value = e.target.value.trim();if (value === '') {  setNights('');   } else {const parsedValue = parseInt(value, 10);if (maxNights && parsedValue > maxNights) {  setNights(maxNights);} else {  setNights(parsedValue);  } } }} fullWidth  size="small"  variant="outlined" className="nights-input"  type="number" InputProps={{ inputProps: { min: 1,  max: maxNights || undefined   } }}    helperText={maxNights ? `Maximum ${maxNights} nights allowed` : ''}/>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" className="label">Check Out</Typography>
                  <TextField  value={getCheckOutDate()}   fullWidth  size="small"  variant="outlined"   className="date-input"  disabled />
                </Grid>
                <Grid item xs={12}>
                  <Grid item xs={12}>
                    <Box className="room-details">
                      <Typography variant="body1" fontWeight="medium" className="room-title">  {getRoomDisplayText()}</Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={3}>
                          <Typography variant="body2" className="occupancy-label">  Adult/s<br/>+12 yrs </Typography>
                          <TextField  value={adultsCount}  onChange={(e) => setAdultsCount(parseInt(e.target.value) || 0)}  fullWidth   size="small"  type="number" variant="outlined"   className="occupancy-input"   InputProps={{ inputProps: { min: 1, max: 20 } }}  />
                        </Grid>
                        <Grid item xs={3}>
                          <Typography variant="body2" className="occupancy-label">  CWB<br/>&lt;12 yrs   </Typography>
                          <TextField value={cwbCount} onChange={(e) => setCwbCount(parseInt(e.target.value) || 0)}  fullWidth size="small" variant="outlined"className="occupancy-input"   type="number"  InputProps={{ inputProps: { min: 0, max: 20 } }}  />
                        </Grid>
                        <Grid item xs={3}>
                          <Typography variant="body2" className="occupancy-label">  CNB<br/>2-12 yrs </Typography>
                          <TextField value={cnbCount}   onChange={(e) => setCnbCount(parseInt(e.target.value) || 0)}  fullWidth   size="small"  variant="outlined" className="occupancy-input"   type="number"   InputProps={{ inputProps: { min: 0, max: 20 } }} />
                        </Grid>
                        <Grid item xs={3}>
                          <Typography variant="body2" className="occupancy-label">  Infant/s<br/>&lt;2 yrs  </Typography>
                          <TextField value={infantsCount} onChange={(e) => setInfantsCount(parseInt(e.target.value) || 0)}  fullWidth size="small"  variant="outlined" className="occupancy-input"   type="number"InputProps={{ inputProps: { min: 0, max: 20 } }} />
                        </Grid>
                      </Grid>
                    </Box>
                  </Grid>
                </Grid>
                <Grid item xs={12}>
                  <Box display="flex" justifyContent="flex-end" className="button-container">
                    <Button  variant="contained" color="error" onClick={handleSearch}  className="search-button"> Search Hotels </Button>
                  </Box>
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12} md={5} className="image-container">
              <Box className="image-box">  <img  src="https://assets.micontenthub.com/traveloffers/travel-tips/baku_OIPJAbO-S.jpg"    alt="Trans Studio baku"   className="attraction-image"  />   </Box>
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </Box>
  );
};
export default TripPlannerArea;
