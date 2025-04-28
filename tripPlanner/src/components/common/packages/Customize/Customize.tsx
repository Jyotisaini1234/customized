  import React, { useEffect, useState } from "react";
  import {Box,Container,Grid,Typography, Button,Autocomplete,TextField,Paper, FormControl,Select,MenuItem, RadioGroup, FormControlLabel, Radio,} from "@mui/material";
  import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
  import { DatePicker } from "@mui/x-date-pickers/DatePicker";
  import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
  import { useLocation, useNavigate } from "react-router-dom";
  import "./Customize.scss"; 
  import { useGetHotelsByCityQuery } from "../../../../api/TourAPI.tsx";
  import { CustomizeSearchProps, HotelSummaryParams } from "../../../../types/types.ts";
  import TripPlanner from "../TripPlanner/TripPlanner.tsx";
  import { countrie ,city as cityOptions} from "../../../../model/selectOptions.ts"; 

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
    const [city, setCity] = useState<{ label: string; value: string } | undefined>(
      cityOptions[0] ? { label: cityOptions[0].label, value: cityOptions[0].id.toString() } : undefined
    );
    const [country, setCountry] = useState<{ label: string; value: string } | undefined>(
      countrie[0] ? { label: countrie[0].label, value: countrie[0].id.toString() } : undefined
    );
    const parseDate = (dateString?: string): Date | null => {
      return dateString ? new Date(dateString) : null;
    };
    
    const addDays = (date: Date, days: number): Date => {
      if (days === 1) {
        return new Date(date);
      }
      const newDate = new Date(date);
      newDate.setDate(newDate.getDate() + (days - 1)); // Subtract 1 because 1 night means same day
      return newDate;
    };
    const [checkInDate, setCheckInDate] = useState<Date | null>(
      parseDate(searchParams?.checkInDate) || new Date()
    );
  
    const [checkOutDate, setCheckOutDate] = useState<Date | null>(
      parseDate(searchParams?.checkOutDate) || addDays(new Date(), 1)
    );
    const [nights, setNights] = useState<number>(0); 
  
    const { data, isLoading, error } = useGetHotelsByCityQuery({ city: city?.value || '', country: country?.value || '' });
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
        if (
          startDate.getDate() === endDate.getDate() && 
          startDate.getMonth() === endDate.getMonth() && 
          startDate.getFullYear() === endDate.getFullYear()
        ) {
          return 1;
        }
        const oneDay = 24 * 60 * 60 * 1000;
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / oneDay);
        return diffDays + 1; // Add 1 because diffDays is 0 for same day
      }
      return 0;
    };

    const handleNightsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newNights = parseInt(e.target.value);
      const value = e.target.value;
      if (value === '') {
        setNights(0); 
        setCheckOutDate(null); 
        return;
      }
      if (isNaN(newNights) || newNights < 1) {
        setNights(1);
        if (checkInDate) {
          setCheckOutDate(new Date(checkInDate));
        }
      } else {
        setNights(newNights);
        if (checkInDate) {
          if (newNights === 1) {
            setCheckOutDate(new Date(checkInDate));
          } else {
            const newCheckOutDate = addDays(checkInDate, newNights);
            setCheckOutDate(newCheckOutDate);
          }
        }
      }
    };

  const handleCheckInChange = (date: Date | null) => {
    setCheckInDate(date);
    if (date) {
      if (nights === 1) {
        setCheckOutDate(new Date(date));
      } else if (checkOutDate) {
        const newCheckOutDate = addDays(date, parseInt(nights.toString()));
        setCheckOutDate(newCheckOutDate);
      }
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
      sessionStorage.removeItem('tripPlannerItems');
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
        sessionStorage.removeItem('tripPlannerHotels');
        sessionStorage.removeItem('tripPlannerItems');
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
    const handleCountrySelect = (newValue: { label: string; value: string } | null) => {
      setCountry(newValue ?? country);
    };

return (
  <Box className={`customize-search-page ${isModifying ? 'modify-mode' : ''}`}>
      <Container sx={{paddingLeft:'0rem', paddingRight:'0rem'}}>
        {!showHotelListing ? (<>
          {!isModifying && (
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" sx={{ color: '#333', fontWeight: 'bold' }}>Customize Search</Typography>
          <Button className='entry-btn' variant="contained" sx={{ borderRadius: '4px',boxShadow:'none', textTransform: 'none', py: 1,bgcolor:'red' }} > baku Entry Requirements</Button>
          </Box>)}
            <Grid container spacing={1} className='form-container'>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Grid container spacing={2} className='select-form'>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth variant="outlined" size="small" className='select-option-1'>
                        <Autocomplete 
                          className="destination-select" disabled={true} options={countrie.map(c => ({ label: c.label, value: c.id.toString() }))}
                          getOptionLabel={(option) => option.label}  value={country} onChange={(_, newValue) => handleCountrySelect(newValue)}
                          renderInput={(params) => (
                          <TextField  className='select-destination'   {...params} disabled  variant="outlined" size="small" fullWidth  required  inputProps={{ ...params.inputProps, readOnly: true}} /> )}  
                          sx={{bgcolor:'white',  pointerEvents: 'none','& .MuiInputBase-input': { cursor: 'default'},'& .MuiInputBase-root': { height: '2rem', width:'16rem' } }}  disableClearable  freeSolo={false} />
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth variant="outlined" size="small" className='select-option-2'>
                        <Autocomplete  className="city-select" disabled={true} options={cityOptions.map(c => ({ label: c.label, value: c.id.toString() }))}
                          getOptionLabel={(option) => option.label} value={city} onChange={(_, newValue) => setCity(newValue)} renderInput={(params) => (
                            <TextField 
                              className='city-select' {...params} disabled   variant="outlined" size="small" fullWidth  required inputProps={{ ...params.inputProps, readOnly: true}} />)} 
                              sx={{bgcolor:'white', pointerEvents: 'none','& .MuiInputBase-input': { cursor: 'default'},'& .MuiInputBase-root': { height: '2rem', width:'16rem' } }}disableClearable  />
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
                            minDate={checkInDate ? checkInDate : new Date()}
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
                              <Typography variant="body2" sx={{ mb: 0.5 }}>CNB<br/>&lt; 12 yrs</Typography>
                              <FormControl fullWidth size="small">
                                <Select value={room.cnb.toString()} 
                                  onChange={(e) => handleRoomChange(room.id, 'cnb', +e.target.value)}
                                  sx={{ height: '40px' }} >{[0, 1, 2].map((num) => (<MenuItem key={num} value={num}>{num}</MenuItem> ))}
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
                              <Grid item xs={12} sm={3}>
                                <Button variant="contained" color="secondary" onClick={() => handleRemoveRoom(room.id)}fullWidth 
                                  sx={{ mt: { xs: 0, sm: 3.5 },backgroundColor: '#6c757d',  boxShadow:'none',  '&:hover': { backgroundColor: '#5a6268' } }} >  Remove
                                </Button>
                              </Grid>
                            )}
                          </Grid>
                        </Box>
                      </Grid>
                    ))}
                    <Grid item xs={12}>
                      <Box display="flex" justifyContent="space-between" mt={1} className='btn-container'>
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
                  <img src="https://www.uandiholidays.net/Admin/UploadFiles/Advertising/WhatsAppImage2023-12-02at1.09.55PM_2-12-2023-13438.jpeg"  alt="Trans Studio baku" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                </Box>
              </Grid>
            </Grid></>): (<TripPlanner location={city?.label || ""}  nights={Number(nights)}  checkInDate={checkInDate ? checkInDate.toISOString() : new Date().toISOString()} 
                          checkOutDate={checkOutDate ? checkOutDate.toISOString() : new Date().toISOString()} onCancel={() => console.log("Cancel clicked")} onProceed={() => console.log("Proceed clicked")}/> )}
        </Container>
  </Box>
  );
};
export default Customize;