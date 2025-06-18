import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Box, Container, Typography, Button, FormControl, Select, MenuItem, TextField, Grid, Paper, CircularProgress, Alert, RadioGroup, FormControlLabel, Radio } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import './ReadyMadeSearch.scss';
import { ReadymadeData } from "../../../../../../types/types.ts";
import { enGB } from "date-fns/locale";

interface Room {
  id: string;
  adults: number;
  cwb: number;
  cnb: number;
  infants: number;
}

const ReadyMadeSearch: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchData = location.state as ReadymadeData;
  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
  const [totalNights, setTotalNights] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [packageType, setPackageType] = useState<string>("hotel-land");
  const [rooms, setRooms] = useState<Room[]>([{ id: '1', adults: 2, cwb: 0, cnb: 0, infants: 0 }]);
  const packageData = searchData?.packageData;
  const packageDetails = packageData?.packageDetails;
  const selectedOptionIndex = parseInt(searchData?.selectedHotelOption || '0');
  const selectedHotelOption = packageDetails?.hotelOption?.[selectedOptionIndex];

  useEffect(() => {
    if (packageDetails) {
      const packageName = packageDetails.packageName || packageDetails.title || '';
      const nightsFromName = extractNightsFromPackageName(packageName);
      const nightsFromHotel = selectedHotelOption?.hotels?.reduce((total: number, hotel: any) =>  
        total + (hotel.nights || 0), 0) || 0;
      const calculatedNights = nightsFromName || nightsFromHotel || 3;
      setTotalNights(calculatedNights);
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setCheckInDate(tomorrow);
      
      const checkOutDateObj = new Date(tomorrow);
      checkOutDateObj.setDate(checkOutDateObj.getDate() + calculatedNights);
      setCheckOutDate(checkOutDateObj);
    }
  }, [packageDetails, selectedHotelOption]);

  const extractNightsFromPackageName = (packageName: string): number => {
    const nightMatches = packageName.match(/(\d+)N/g);
    if (nightMatches) {
      return nightMatches.reduce((total, match) => {
        const nights = parseInt(match.replace('N', ''));
        return total + (isNaN(nights) ? 0 : nights);
      }, 0);
    }
    return 0;
  };

  const addDays = (date: Date, days: number): Date => { const newDate = new Date(date); newDate.setDate(newDate.getDate() + days); return newDate;};
  const handleNightsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nightsValue = parseInt(e.target.value, 10);
    setTotalNights(nightsValue);
    
    if (checkInDate && nightsValue > 0) {
      setCheckOutDate(addDays(checkInDate, nightsValue));
    }
  };

  const handleCheckInChange = (date: Date | null) => {
    setCheckInDate(date);
    if (date && totalNights) {
      setCheckOutDate(addDays(date, totalNights));
    }
  };

  const handleCheckOutChange = (date: Date | null) => {
    if (date && checkInDate) {
      setCheckOutDate(date);
      const diffTime = Math.abs(date.getTime() - checkInDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setTotalNights(diffDays);
    }
  };

  const addRoom = () => {
    const newRoom: Room = {
      id: Date.now().toString(),
      adults: 2,
      cwb: 0,
      cnb: 0,
      infants: 0
    };
    setRooms([...rooms, newRoom]);
  };

  const removeRoom = (roomId: string) => {
    if (rooms.length > 1) {
      setRooms(rooms.filter(room => room.id !== roomId));
    }
  };

  const updateRoom = (roomId: string, field: keyof Omit<Room, 'id'>, value: number) => {
    setRooms(rooms.map(room => 
      room.id === roomId ? { ...room, [field]: value } : room
    ));
  };

  const calculateTotals = () => {
    return rooms.reduce((totals, room) => ({
      totalAdults: totals.totalAdults + room.adults,
      totalCwb: totals.totalCwb + room.cwb,
      totalCnb: totals.totalCnb + room.cnb,
      totalInfants: totals.totalInfants + room.infants,
      totalGuests: totals.totalGuests + room.adults + room.cwb + room.cnb + room.infants
    }), {
      totalAdults: 0,
      totalCwb: 0,
      totalCnb: 0,
      totalInfants: 0,
      totalGuests: 0
    });
  };
 const calculatePricing = () => {
    const totals = calculateTotals();
    const basePrice = packageData?.pricing?.basePrice || 0;
  
    const totalAdultCount = totals.totalAdults;
    const baseAdultCount = 2;
    const additionalAdults = Math.max(0, totalAdultCount - baseAdultCount);
  
    const additionalAdultPrice = additionalAdults * (packageData?.pricing?.additionalAdultPrice || basePrice * 0.5);
    const baseAdultPrice = basePrice;
  
    const cwbPrice = totals.totalCwb * (packageData?.pricing?.cwbPrice || basePrice * 0.7);
    const cnbPrice = totals.totalCnb * (packageData?.pricing?.cnbPrice || basePrice * 0.3);
  
    const additionalRooms = Math.max(0, rooms.length - 1);
    const additionalRoomPrice = additionalRooms * (packageData?.pricing?.additionalRoomPrice || basePrice * 0.8);
  
    const infantPrice = 0;
  
    const totalPrice = baseAdultPrice + additionalAdultPrice + cwbPrice + cnbPrice + additionalRoomPrice + infantPrice;
  
    return {
      basePrice: baseAdultPrice,
      additionalAdultPrice,
      cwbPrice,
      cnbPrice,
      additionalRoomPrice,
      infantPrice,
      totalPrice,
      breakdown: {
        adults: {
          count: totalAdultCount,
          baseIncluded: baseAdultCount,
          additionalCount: additionalAdults,
          pricePerPerson: basePrice,
          total: baseAdultPrice + additionalAdultPrice
        },
        cwb: {
          count: totals.totalCwb,
          pricePerPerson: basePrice * 0.7,
          total: cwbPrice
        },
        cnb: {
          count: totals.totalCnb,
          pricePerPerson: basePrice * 0.3,
          total: cnbPrice
        },
        infants: {
          count: totals.totalInfants,
          total: infantPrice
        },
        rooms: {
          count: rooms.length,
          additional: additionalRooms,
          pricePerRoom: basePrice * 0.8,
          total: additionalRoomPrice
        }
      }
    };
  };
  const handleBack = () => { navigate(-1);};
  const handleSearch = async () => {
    setLoading(true);
    const totals = calculateTotals();
    const pricing = calculatePricing();
    const searchParams = {
      packageId: searchData?.packageId,
      selectedHotelOption: searchData?.selectedHotelOption,
      selectedSeason: searchData?.selectedSeason,
      checkInDate: checkInDate?.toISOString(),
      checkOutDate: checkOutDate?.toISOString(),
      totalNights,
      nights: totalNights, // Add both for compatibility
      rooms: rooms,
      room: rooms, // Add both formats for compatibility
      totalRooms: rooms.length,
      guests: {
        totalAdults: totals.totalAdults,
        totalCwb: totals.totalCwb,
        totalCnb: totals.totalCnb,
        totalInfants: totals.totalInfants,
        totalGuests: totals.totalGuests,
        adults: totals.totalAdults,
        cwb: totals.totalCwb,
        cnb: totals.totalCnb,
        infants: totals.totalInfants
      },
      roomDetails: rooms.map((room, index) => ({
        roomNumber: index + 1,
        adults: room.adults,
        cwb: room.cwb,
        cnb: room.cnb,
        infants: room.infants,
        totalGuestsInRoom: room.adults + room.cwb + room.cnb + room.infants
      })),
      guestBreakdown: {
        totalAdults: totals.totalAdults,
        totalChildren: totals.totalCwb + totals.totalCnb,
        totalCwb: totals.totalCwb,
        totalCnb: totals.totalCnb,
        totalInfants: totals.totalInfants,
        totalGuests: totals.totalGuests,
        roomCount: rooms.length
      },
      pricing: pricing,
      packageType,
      adults: totals.totalAdults,
      cwb: totals.totalCwb,
      cnb: totals.totalCnb,
      infants: totals.totalInfants,
      totalGuests: totals.totalGuests
    };

    try {
      const hotels = selectedHotelOption?.hotels || [];
      const tripPlannerData = {
        ...searchData,
        ...searchParams,
        packageData: {
          ...packageData,
          packageDetails: {
            ...packageDetails,
            hotelOption: [{
              hotels: hotels.map((hotel: any) => ({
                ...hotel,
                requiredRooms: rooms.length,
                guestCapacity: totals.totalGuests,
                roomConfiguration: rooms
              }))
            }]
          }
        },
        destinations: packageDetails?.destinations || [],
        userSelections: {
          totalRooms: rooms.length,
          roomConfiguration: rooms,
          guestCounts: totals,
          dates: {
            checkIn: checkInDate?.toISOString(),
            checkOut: checkOutDate?.toISOString(),
            nights: totalNights
          },
          pricing: pricing
        }
      };
      sessionStorage.setItem('readymadeSearchData', JSON.stringify(tripPlannerData));
      sessionStorage.setItem('originalReadymadeSearchData', JSON.stringify(tripPlannerData));
      navigate('/readymade-planner', {
        state: tripPlannerData 
      });
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!searchData || !packageData) {
    return (
      <Container className="error-container">
        <Alert severity="warning"> No package data found. Please go back and select a package. </Alert>
        <Button onClick={handleBack} startIcon={<ArrowBackIcon />}>  Go Back</Button>
      </Container>
    );
  }

  const destinations = selectedHotelOption?.hotels?.map((hotel: any) => hotel.destination) || [];
  const uniqueDestinations = [...new Set(destinations)];
  const packageTitle = packageDetails.packageName || packageDetails.title || 'Package Search';
  const totals = calculateTotals();
  const pricing = calculatePricing();

  return (
    <Box className="customize-search-page">
      <Container sx={{ paddingLeft: '0rem', paddingRight: '0rem' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" sx={{ color: '#333', fontWeight: 'bold' }} className="heading"> Readymade Packages Search </Typography>
          <Button className='entry-btn' sx={{ borderRadius: '4px', boxShadow: 'none', textTransform: 'none', py: 1 }}> baku Entry Requirements</Button>
        </Box>

        {/* Display current selections summary */}
        <Box mb={2} p={2} sx={{ bgcolor: '#f8f9fa', borderRadius: 2 }}>
          <Typography variant="body2" color="primary" fontWeight="medium">
            Current Selection: {totals.totalGuests} Guests ({totals.totalAdults} Adults, {totals.totalCwb} CWB, {totals.totalCnb} CNB, {totals.totalInfants} Infants) in {rooms.length} Room{rooms.length > 1 ? 's' : ''}
          </Typography>
        </Box>

        <Grid container spacing={1} className='form-container'>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Grid container spacing={2} className='select-form'>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>Country</Typography>
                  <FormControl fullWidth variant="outlined" size="small" className='select-option-1'>
                    <Select value={'Georgia'} displayEmpty disabled sx={{ bgcolor: '#f5f5f5', '& .MuiInputBase-root': { height: '2rem', width: '16rem' } }}>
                      <MenuItem value={'Georgia'}>Georgia</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>City</Typography>
                  <FormControl fullWidth variant="outlined" size="small" className='select-option-2'>
                    <Select value={uniqueDestinations[0]} displayEmpty disabled sx={{ bgcolor: '#f5f5f5', '& .MuiInputBase-root': { height: '2rem', width: '16rem' } }}>
                      <MenuItem value={uniqueDestinations[0]}>{uniqueDestinations[0]}</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>Check In</Typography>
                    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={enGB}>
                      <DatePicker value={checkInDate}  onChange={handleCheckInChange}  minDate={new Date()}  slotProps={{textField: {size: "small", fullWidth: true, InputProps: { sx: { height: '40px' } } }}} />
                    </LocalizationProvider>
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>Night/s</Typography>
                    <TextField  type="number"  value={totalNights || ''}  onChange={handleNightsChange}  InputProps={{ inputProps: { min: 1 }, sx: { height: '40px' }}}  fullWidth   size="small"  variant="outlined" />
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>Check Out</Typography>
                    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={enGB}>
                      <DatePicker value={checkOutDate} onChange={handleCheckOutChange}   minDate={checkInDate ? addDays(checkInDate, 1) : addDays(new Date(), 1)}  slotProps={{ textField: { size: "small", fullWidth: true, InputProps: { sx: { height: '40px' } } } }}/>
                    </LocalizationProvider>
                  </Grid>
                </Grid>
            {rooms.map((room, index) => (
                  <Grid item xs={12} key={room.id} className='person-count'>
                    <Box sx={{ mb: 1, p: 0,borderRadius: '8px' }} className='person-div'>
                    <Typography variant="body1" fontWeight="medium" className='room'>  Room {index + 1} </Typography>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={3}>
                          <Typography variant="body2" sx={{ mb: 0.5 }}>   Adult/s<br/>+ 12 yrs </Typography>
                          <FormControl fullWidth size="small">
                            <Select  value={room.adults.toString()}   onChange={(e) => updateRoom(room.id, 'adults', Number(e.target.value))} sx={{ height: '40px' }} > {[1, 2, 3, 4].map(num => (<MenuItem key={num} value={num}>{num}</MenuItem>  ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <Typography variant="body2" sx={{ mb: 0.5 }}> CWB<br/>&lt; 12 yrs </Typography>
                          <FormControl fullWidth size="small">
                            <Select  value={room.cwb.toString()}   onChange={(e) => updateRoom(room.id, 'cwb', Number(e.target.value))}  sx={{ height: '40px' }} > {[0, 1, 2, 3, 4].map(num => ( <MenuItem key={num} value={num}>{num}</MenuItem> ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <Typography variant="body2" sx={{ mb: 0.5 }}>  CNB<br/>&lt; 12 yrs</Typography>
                          <FormControl fullWidth size="small">
                            <Select  value={room.cnb.toString()}  onChange={(e) => updateRoom(room.id, 'cnb', Number(e.target.value))}  sx={{ height: '40px' }} > {[0, 1, 2, 3, 4].map(num => ( <MenuItem key={num} value={num}>{num}</MenuItem> ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <Typography variant="body2" sx={{ mb: 0.5 }}>  Infant/s<br/>&lt; 2 yrs </Typography>
                          <FormControl fullWidth size="small">
                            <Select  value={room.infants.toString()}   onChange={(e) => updateRoom(room.id, 'infants', Number(e.target.value))}  sx={{ height: '40px' }} > {[0, 1, 2, 3, 4].map(num => (  <MenuItem key={num} value={num}>{num}</MenuItem> ))}
                            </Select>
                          </FormControl>
                        </Grid>
                      </Grid>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        {rooms.length > 1 && (
                          <Button size="small"onClick={() => removeRoom(room.id)} startIcon={<DeleteIcon />} sx={{ minWidth: 'auto' , bgcolor:'grey' ,color:"white" ,marginTop:'3.5rem'}}> Remove</Button>)}
                      </Box>
                    </Box>
                  </Grid>
                ))}
                <Grid item xs={12}>
                  <Box display="flex" mt={1} className='btn-container'>
                    <Button  className='add-another-btn'  onClick={addRoom}
                      sx={{backgroundColor: '#6c757d', color:'white',  boxShadow: 'none',   textTransform: 'none', mr: 2 }} >  + Add Another Room
                    </Button>
                    <Button  className='search-btn'  onClick={handleSearch} disabled={loading}  sx={{ minWidth: '120px',  color:'white',  backgroundColor: '#ff0000',  textTransform: 'none',  boxShadow: 'none' }} > {loading ? <CircularProgress size={24} /> : 'Search'} </Button>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          <Grid item xs={12} md={5} className='side-image'>
            <Box sx={{ overflow: 'hidden', height: '100%' }} className='side-box'>
              <img src="https://assets.micontenthub.com/traveloffers/travel-tips/baku_OIPJAbO-S.jpg"   alt="Trans Studio baku"   style={{ width: '100%', height: '100%', objectFit: 'cover' }}   />
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default ReadyMadeSearch;