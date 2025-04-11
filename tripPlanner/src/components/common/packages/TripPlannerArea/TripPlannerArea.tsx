  import React, { useState, useEffect } from 'react';
  import { useLocation, useNavigate } from 'react-router-dom';
  import {Box,Container,Typography,TextField,FormControl,Grid,Button,Select,MenuItem,Paper, SelectChangeEvent,} from '@mui/material';
  import './TripPlannerArea.scss';
  import { AreaOption, Areas } from '../../../../types/types.ts';

  const TripPlannerArea: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { state } = location;
    const searchParams = location.state || {};
    const [selectedArea, setSelectedArea] = useState<string>('');
    const [areas, setAreas] = useState<AreaOption[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [hotelDetails, setHotelDetails] = useState(null);
    const [city, setCity] = useState<string>(searchParams.city || '');
    const [nights, setNights] = useState<number>(searchParams.nights || 1);
    const [adultsCount, setAdultsCount] = useState<number>(searchParams.rooms?.[0]?.adults || 2);
    const [cwbCount, setCwbCount] = useState<number>(searchParams.rooms?.[0]?.cwb || 0);
    const [cnbCount, setCnbCount] = useState<number>(searchParams.rooms?.[0]?.cnb || 0);
    const [infantsCount, setInfantsCount] = useState<number>(searchParams.rooms?.[0]?.infants || 0);
    const [applyToAllDays, setApplyToAllDays] = useState<boolean>(searchParams.applyToAllDays || false);

    useEffect(() => {
      if (state && (state.hotel || state.tripPlan)) {
          setHotelDetails(state);
          if (state.tripPlan) {
              console.log('Hotel added from trip planner:', state);
          }
      } else {
          const storedDetails = sessionStorage.getItem('selectedHotelDetails');
          if (storedDetails) {
              const parsedDetails = JSON.parse(storedDetails);
              setHotelDetails(parsedDetails);
              if (parsedDetails.tripPlan) {
                  console.log('Retrieved trip plan hotel from storage:', parsedDetails);
              }
          }
      }
    }, [state]);

    useEffect(() => {
      console.log('Search params received:', searchParams); 
      console.log('Current city value:', city);
      if (city) {
        setLoading(true);
        console.log(`Loading areas for city: ${city}`);
        setTimeout(() => {
          setAreas(Areas);
          setLoading(false);
        }, 500);
      } else if (searchParams.city) {
        setCity(searchParams.city);
      } else {
        console.error('No city provided in search parameters');
      }
    }, [city, searchParams]);
    const handleAreaChange = (event: SelectChangeEvent<string>) => {
      setSelectedArea(event.target.value);
    };

    const handleClose = () => {
      let savedHotels = [];
      const storedHotels = sessionStorage.getItem('tripPlannerHotels');
      if (storedHotels) {
        try {
          savedHotels = JSON.parse(storedHotels);
        } catch (e) {
          console.error('Error parsing saved hotels', e);
        }
      }
      navigate(-1);
    };
    
    const handleSearch = () => {
      if (!selectedArea) {
        alert('Please select an area to continue');
        return;
      }
      const params = new URLSearchParams();
      const checkInDate = searchParams.checkInDate || new Date().toISOString();
      const checkOutDateObj = new Date(checkInDate);
      checkOutDateObj.setDate(checkOutDateObj.getDate() + nights);
      const checkOutDate = checkOutDateObj.toISOString();
      params.append('city', city);
      params.append('country', searchParams.country || 'Indonesia');
      params.append('area', selectedArea);
      params.append('checkInDate', checkInDate);
      params.append('checkOutDate', checkOutDate);
      params.append('nights', String(nights)); 
      params.append('fromTripPlanner', 'true');
      if (searchParams.specificDay) {
        params.append('specificDay', 'true');
        if (searchParams.specificDayId) {
          params.append('specificDayId', searchParams.specificDayId);
        }
      }
      params.append('applyToAllDays', searchParams.specificDay ? 'false' : String(applyToAllDays));
      
      if (searchParams.allDays) {
        params.append('allDays', JSON.stringify(searchParams.allDays));
      }
      let savedHotels = [];
      const storedHotels = sessionStorage.getItem('tripPlannerHotels');
      if (storedHotels) {
        try {
          savedHotels = JSON.parse(storedHotels);
          params.append('savedHotels', encodeURIComponent(JSON.stringify(savedHotels)));
        } catch (e) {
          console.error('Error parsing saved hotels', e);
        }
      }
      const rooms = [{
        id: 1,
        adults: adultsCount,
        cwb: cwbCount,
        cnb: cnbCount,
        infants: infantsCount
      }];
      params.append('adults', String(rooms[0].adults));
      params.append('cwb', String(rooms[0].cwb));
      params.append('cnb', String(rooms[0].cnb));
      params.append('infants', String(rooms[0].infants));
      params.append('roomsData', encodeURIComponent(JSON.stringify(rooms)));
      window.location.href = `http://ec2-13-203-143-204.ap-south-1.compute.amazonaws.com:3002/hotel-summary?${params.toString()}`;
    };
    const formatDate = (dateStr) => {
      try {
        return new Date(dateStr).toLocaleDateString();
      } catch (e) {
        return dateStr || '';
      }
    };

  
    const getCheckOutDate = () => {
      try {
        const checkInObj = new Date(searchParams.checkInDate);
        const checkOutObj = new Date(checkInObj);
        checkOutObj.setDate(checkOutObj.getDate() + nights);
        const tripEndDate = new Date(searchParams.originalCheckOutDate || searchParams.checkOutDate);
        if (checkOutObj > tripEndDate) {
          return tripEndDate.toLocaleDateString();
        }
        return checkOutObj.toLocaleDateString();
      } catch (e) {
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
                      <Select value={city || ''}   disabled className="select-input">
                      <MenuItem value={city || searchParams.city || ''}>{city || searchParams.city || 'Select city'}</MenuItem>  </Select>
                      
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth variant="outlined" size="small" className="form-control">
                      <Select value={selectedArea}  onChange={handleAreaChange} className="select-input" >
                        <MenuItem value="">  Select Area </MenuItem>
                        {areas.map((area) => ( <MenuItem key={area.value} value={area.value}> {area.label}</MenuItem> ))}
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
                      value={nights} 
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 1;
                        setNights(value);
                      }}
                      fullWidth size="small" 
                      variant="outlined" 
                      className="nights-input"
                      type="number"
                      InputProps={{ inputProps: { min: 1 } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" className="label">Check Out</Typography>
                    <TextField value={getCheckOutDate()} fullWidth  size="small" variant="outlined"   className="date-input" disabled />
                  </Grid>
                  <Grid item xs={12}>
                    <Box className="room-details">
                      <Typography variant="body1" fontWeight="medium" className="room-title">  Room 1 </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={3}>
                          <Typography variant="body2" className="occupancy-label">Adult/s<br/>+12 yrs</Typography>
                          <TextField
                            value={adultsCount}
                            onChange={(e) => setAdultsCount(parseInt(e.target.value) || 2)}
                            fullWidth
                            size="small"
                            type="number" 
                            variant="outlined" 
                            className="occupancy-input"
                            InputProps={{ inputProps: { min: 1, max: 6 } }}
                          />
                        </Grid>
                        <Grid item xs={3}>
                          <Typography variant="body2" className="occupancy-label">CWB<br/>&lt;12 yrs  </Typography>
                          <TextField  
                            value={cwbCount}  
                            onChange={(e) => setCwbCount(parseInt(e.target.value) || 0)}
                            fullWidth 
                            size="small"  
                            variant="outlined"
                            className="occupancy-input"
                            type="number"
                            InputProps={{ inputProps: { min: 0 } }}
                          />
                        </Grid>
                        <Grid item xs={3}>
                          <Typography variant="body2" className="occupancy-label">  CNB<br/>&lt;12 yrs </Typography>
                          <TextField 
                            value={cnbCount}   
                            onChange={(e) => setCnbCount(parseInt(e.target.value) || 0)}
                            fullWidth 
                            size="small"  
                            variant="outlined"  
                            className="occupancy-input"
                            type="number"
                            InputProps={{ inputProps: { min: 0 } }}
                          />
                        </Grid>
                        <Grid item xs={3}>
                          <Typography variant="body2" className="occupancy-label">
                            Infant/s<br/>&lt;2 yrs
                          </Typography>
                          <TextField 
                            value={infantsCount} 
                            onChange={(e) => setInfantsCount(parseInt(e.target.value) || 0)}
                            fullWidth 
                            size="small" 
                            variant="outlined"  
                            className="occupancy-input"
                            type="number"
                            InputProps={{ inputProps: { min: 0 } }}
                          />
                        </Grid>
                      </Grid>
                    </Box>
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
                    alt="Trans Studio Bali" 
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

