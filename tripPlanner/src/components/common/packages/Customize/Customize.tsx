  import React, { useEffect, useState } from "react";
  import {Box,Container,Grid,Typography, Button,Autocomplete,TextField,Paper, FormControl,Select,MenuItem, RadioGroup, FormControlLabel, Radio,} from "@mui/material";
  import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
  import { DatePicker } from "@mui/x-date-pickers/DatePicker";
  import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
  import { useLocation, useNavigate } from "react-router-dom";
  import "./Customize.scss"; 
  import { useGetHotelsByCityQuery } from "../../../../api/TourAPI.tsx";
  import { CustomizeSearchProps, HotelSummaryParams, OptionType } from "../../../../types/types.ts";
  import TripPlanner from "../TripPlanner/TripPlanner.tsx";
  import { country as countriesList  ,citiesList as citiesList} from "../../../../model/selectOptions.ts"; 

  const Customize: React.FC<CustomizeSearchProps> = ({ isModifying = false, initialValues = {}, onSearchComplete }) => {
    const location = useLocation();
    const navigate = useNavigate();
    useEffect(() => {
      if (!isModifying) {
        sessionStorage.removeItem('tripPlannerParams');
        sessionStorage.removeItem('tripPlannerHotels');
      }
    }, [isModifying]);
    
    const getInitialSearchParams = () => {
      if (Object.keys(initialValues).length > 0) {
        return initialValues;
      }
      if (isModifying) {
        const storedParams = sessionStorage.getItem('tripPlannerParams');
        if (storedParams) {
          return JSON.parse(storedParams);
        }
      }
      return location.state || {};
    };
    const searchParams = getInitialSearchParams();
    const [showHotelListing, setShowHotelListing] = useState(false);
    const [country, setCountry] = useState(countriesList[0]);
    const [cityOptions, setCityOptions] = useState(
      citiesList.filter(city => city.countryId === countriesList[0].id)
    );
    const [city, setCity] = useState(cityOptions[0]);
    const parseDate = (dateString: string | null | undefined) => {
      if (!dateString) return null;
      try {
        const parsedDate = new Date(dateString);
        return isNaN(parsedDate.getTime()) ? null : parsedDate;
      } catch (e) {
        return null;
      }
    };
    const addDays = (date: Date, days: number): Date => {
      const newDate = new Date(date);
      newDate.setDate(newDate.getDate() + days);
      return newDate;
    };
    const [checkInDate, setCheckInDate] = useState<Date | null>(
      parseDate(searchParams?.checkInDate) || new Date()
    );
    const [checkOutDate, setCheckOutDate] = useState<Date | null>(
      parseDate(searchParams?.checkOutDate) || addDays(new Date(), 1)
    );
    
    const [nights, setNights] = useState<number>(1); 
    const { data, isLoading, error } = useGetHotelsByCityQuery({ city: city?.id.toString()  || '', country: country?.id.toString() || '' });
    const [packageType, setPackageType] = useState(searchParams?.packageType || "hotel-land");
    const [searchStartDate, setSearchStartDate] = useState('28-04-2025');
    const [searchEndDate, setSearchEndDate] = useState('01-07-2025');
    const [occupancyRequired, setOccupancyRequired] = useState(2);
    const [rooms, setRooms] = useState(searchParams?.rooms || [{ id: 1, adults: 2, cwb: 0, cnb: 0, infants: 0 }]);
    useEffect(() => {
      if (isModifying && country && city && checkInDate && checkOutDate) {
        const currentParams = {
          country: country.label,
          city: city.label,
          checkInDate: checkInDate.toISOString(),
          checkOutDate: checkOutDate.toISOString(),
          nights,
          rooms,
          packageType
        };
        sessionStorage.setItem('tripPlannerParams', JSON.stringify(currentParams));
      }
    }, [country, city, checkInDate, checkOutDate, nights, packageType, isModifying]);
    
    useEffect(() => {
      if (checkInDate && checkOutDate) {
        const calculatedNights = calculateNights(checkInDate, checkOutDate);
        setNights(calculatedNights);
      }
    }, [checkInDate, checkOutDate]);

    const calculateNights = (startDate: Date | null, endDate: Date | null) => {
      if (startDate && endDate) {
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;}
      return 0;};
    const handleNightsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const nightsValue = parseInt(e.target.value, 10);
      setNights(nightsValue);
    
      if (checkInDate && nightsValue > 0) {
        setCheckOutDate(addDays(checkInDate, nightsValue));
      }
    };
    const handleCheckInChange = (date: Date | null) => {
      setCheckInDate(date);
      if (!nights) setNights(1); 
      if (date && nights) {
        setCheckOutDate(addDays(date, nights));
      }
    };
    const handleCheckOutChange = (date: Date | null) => {
      if (date && checkInDate) {
        setCheckOutDate(date);
        const isSameDay = 
          date.getDate() === checkInDate.getDate() && 
          date.getMonth() === checkInDate.getMonth() && 
          date.getFullYear() === checkInDate.getFullYear();
          
        if (isSameDay) {
          setNights(1);
        } else if (date < checkInDate) {
          setCheckOutDate(checkInDate);
          setCheckInDate(date);
          setNights(1);
        } else {
          const nightsCount = calculateNights(checkInDate, date);
          setNights(nightsCount);
        }
      }
    };
    const handleAddRoom = () => {
      setRooms([
        ...rooms,
        { id: rooms.length + 1, adults: 2, cwb: 0, cnb: 0, infants: 0 }
      ]);
    };

    const handleRemoveRoom = (roomId: number) => {
      if (rooms.length > 1) {
        setRooms(rooms.filter(room => room.id !== roomId));
      }
    };

    const handleRoomChange = (
      roomId: number,
      field: 'adults' | 'cwb' | 'cnb' | 'infants',
      value: number
    ) => {
      setRooms(
        rooms.map(room =>
          room.id === roomId ? { ...room, [field]: value } : room
        )
      );
    };

    const handleSearch = () => {
      sessionStorage.removeItem('editLeadData');
      sessionStorage.removeItem('editingClientData');
      if (!country || !city || !checkInDate || !checkOutDate) {
        alert("All fields are required!");
        return;
      }
      let filteredHotels = [];
      if (data && data.data) {
        const searchStart = new Date(searchStartDate.split('-').reverse().join('-'));
        const searchEnd = new Date(searchEndDate.split('-').reverse().join('-'));
        filteredHotels = data.data.filter((hotel) =>
          hotel.hotel.rooms.some((room) =>
            room.occupancyPricing.some((pricing) => {
              const pricingStartDate = new Date(pricing.startDate.split('-').reverse().join('-'));
              const pricingEndDate = new Date(pricing.endDate.split('-').reverse().join('-'));
              return (
                searchStart >= pricingStartDate &&
                searchEnd <= pricingEndDate &&
                pricing.occupancy === occupancyRequired
              );
            })
          )
        );
      }

      const params: HotelSummaryParams = {
        country: country.label,
        city: city.label,
        checkInDate: checkInDate.toISOString(),
        checkOutDate: checkOutDate.toISOString(),
        nights,
        rooms,
        packageType,
        filteredHotels
      };
      if (!isModifying) {
        // sessionStorage.removeItem('tripPlannerHotels');
        // sessionStorage.removeItem('tripPlannerItems');
      }
      sessionStorage.setItem('tripPlannerParams', JSON.stringify(params));
      if (isModifying && onSearchComplete) {
        onSearchComplete(params);
      } else {
        navigate("/trip-planner", { state: params });
      }
    };

    
    const handlePackageTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setPackageType(event.target.value);
    };
    const handleCountrySelect = (newValue) => {
      setCountry(newValue);
      const filteredCities = citiesList.filter(city => city.countryId === newValue.id);
      setCityOptions(filteredCities);
      setCity(filteredCities[0] || null); // set first city or null
    };
    
    
return (
  <Box className={`customize-search-page ${isModifying ? 'modify-mode' : ''}`}>
      <Container sx={{paddingLeft:'0rem', paddingRight:'0rem'}}>
        {!showHotelListing ? (<>
          {!isModifying && (
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" sx={{ color: '#333', fontWeight: 'bold' }} className="heading">Customize Search</Typography>
          <Button className='entry-btn'  sx={{ borderRadius: '4px',boxShadow:'none', textTransform: 'none', py: 1 }} > baku Entry Requirements</Button>
          </Box>)}
            <Grid container spacing={1} className='form-container'>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Grid container spacing={2} className='select-form'>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth variant="outlined" size="small" className='select-option-1'>
                    <Autocomplete  options={countriesList}  getOptionLabel={(option) => option.label}value={country}onChange={(_, newValue) => handleCountrySelect(newValue)} renderInput={(params) => (
                    <TextField {...params}  variant="outlined" size="small" fullWidth required  inputProps={{ ...params.inputProps }}  />)}
                    sx={{bgcolor:'white', '& .MuiInputBase-input': { cursor: 'default' }, '& .MuiInputBase-root': { height: '2rem', width: '16rem' }}}/>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth variant="outlined" size="small" className='select-option-2'>
                  <Autocomplete options={cityOptions}getOptionLabel={(option) => option.label} value={city} onChange={(_, newValue) => setCity(newValue)}renderInput={(params) => (
                      <TextField {...params} variant="outlined" size="small" fullWidth required inputProps={{ ...params.inputProps }}  /> )}
                      sx={{bgcolor:'white', '& .MuiInputBase-input': { cursor: 'default' }, '& .MuiInputBase-root': { height: '2rem', width: '16rem' }}} disableClearable/>
                  </FormControl>
                </Grid>

                    <Grid item xs={12}><RadioGroup row name="package-type" sx={{}} value={packageType} onChange={handlePackageTypeChange}>
                        <FormControlLabel value="hotel-land"  control={<Radio size="small" sx={{height:'1rem',width:'1rem',padding:'1rem', '&.Mui-checked': { color: 'blue'} }}/>} label="Hotel + Land Package"  />
                        <FormControlLabel value="land-only"  control={<Radio size="small" sx={{height:'1rem',width:'1rem',padding:'1rem', '&.Mui-checked': { color: 'blue' } }}/>} label="Land Package" />
                        </RadioGroup>
                        </Grid>
                    <Grid item xs={12} container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="body2" sx={{ mb: 0.5 }}>Check In</Typography>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                          <DatePicker
                            value={checkInDate}onChange={handleCheckInChange}minDate={new Date()}
                            slotProps={{textField: {size: "small",fullWidth: true,InputProps: { sx: { height: '40px' } }}}}/>
                        </LocalizationProvider>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="body2" sx={{ mb: 0.5 }}>Night/s</Typography>
                        <TextField type="number" value={nights || ''}onChange={handleNightsChange} InputProps={{inputProps: { min: 1 }, sx: { height: '40px' }}}fullWidth size="small" variant="outlined"/>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="body2" sx={{ mb: 0.5 }}>Check Out</Typography>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                          <DatePicker value={checkOutDate} onChange={handleCheckOutChange}
                            minDate={checkInDate ? addDays(checkInDate, 1) : addDays(new Date(), 1)}
                            slotProps={{textField: {size: "small",fullWidth: true,InputProps: { sx: { height: '40px' } }} }}/>
                        </LocalizationProvider>
                      </Grid>
                    </Grid>
                    {rooms.map((room) => (
                      <Grid item xs={12} key={room.id} className='person-count'>
                        <Box sx={{ mb: 1 }} className='person-div'>
                          <Typography variant="body1" fontWeight="medium" className='room'>Room {room.id}</Typography>
                          <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} sm={2}>
                              <Typography variant="body2" sx={{ mb: 0.5 }}>Adult/s<br/>+ 12 yrs</Typography>
                              <FormControl fullWidth size="small">
                                <Select  value={room.adults.toString()} 
                                  onChange={(e) => handleRoomChange(room.id, 'adults', +e.target.value)}sx={{ height: '40px' }}  >
                                  {[...Array(4)].map((_, i) => (<MenuItem key={i} value={i+1}>{i+1}</MenuItem> ))}
                                </Select>
                              </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={2}>
                              <Typography variant="body2" sx={{ mb: 0.5 }}>CWB<br/>&lt; 12 yrs </Typography>
                              <FormControl fullWidth size="small">
                                <Select 
                                  value={room.cwb.toString()} 
                                  onChange={(e) => handleRoomChange(room.id, 'cwb', +e.target.value)}
                                  sx={{ height: '40px' }}>{[0, 1, 2].map((num) => (<MenuItem key={num} value={num}>{num}</MenuItem>))}
                                </Select>
                              </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={2}>
                              <Typography variant="body2" sx={{ mb: 0.5 }}>Infant/s<br/>&lt; 2 yrs</Typography>
                              <FormControl fullWidth size="small">
                                <Select value={room.infants.toString()} 
                                  onChange={(e) => handleRoomChange(room.id, 'infants', +e.target.value)}
                                  sx={{ height: '40px' }} >{[0, 1, 2].map((num) => ( <MenuItem key={num} value={num}>{num}</MenuItem>))}
                                </Select>
                              </FormControl>
                            </Grid>
                            {room.id > 1 && (
                              <Grid item xs={12} sm={3}className="remove-container">
                                <Button variant="contained" className="remove-btn" color="secondary" onClick={() => handleRemoveRoom(room.id)}fullWidth 
                                  sx={{ mt: { xs: 0, sm: 3.5 },backgroundColor: '#6c757d',  boxShadow:'none',  '&:hover': { backgroundColor: '#5a6268' } }} >  Remove
                                </Button>
                              </Grid>
                            )}
                          </Grid>
                        </Box>
                      </Grid>
                    ))}
                    <Grid item xs={12}>
                      <Box display="flex"  mt={1} className='btn-container'>
                        <Button className='add-another-btn' variant="contained" onClick={handleAddRoom}
                          sx={{  backgroundColor: '#6c757d', boxShadow:'none',  textTransform: 'none'  }} >+ Add Another Room
                        </Button>
                        <Button className='search-btn'  variant="contained"  color="error"  onClick={handleSearch}
                          sx={{  minWidth: '120px',  backgroundColor: '#ff0000',textTransform: 'none',boxShadow:'none',}}  >   {isModifying ? 'Search' : 'Search'}
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
              <Grid item xs={12} md={5} className='side-image'>
                <Box sx={{ overflow: 'hidden', height: '100%' }} className='side-box'>
                  <img src="https://assets.micontenthub.com/traveloffers/travel-tips/baku_OIPJAbO-S.jpg"  alt="Trans Studio baku" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                </Box>
              </Grid>
            </Grid></>): (<TripPlanner location={city?.label || ""}  nights={Number(nights)}  checkInDate={checkInDate ? checkInDate.toISOString() : new Date().toISOString()} 
                          checkOutDate={checkOutDate ? checkOutDate.toISOString() : new Date().toISOString()} onCancel={() => console.log("Cancel clicked")} onProceed={() => console.log("Proceed clicked")}/> )}
        </Container>
  </Box>
  );
};
export default Customize;
