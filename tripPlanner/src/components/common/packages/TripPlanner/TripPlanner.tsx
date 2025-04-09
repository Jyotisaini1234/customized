import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './TripPlanner.scss';
import { Box, Container, Typography, Button, Grid, IconButton, Paper, Tabs, Tab } from '@mui/material';
import { ArrowDownIcon } from '../../../../icons/icons.tsx';
import Customize from '../Customize/Customize.tsx';
import { AddCircleOutline, DeleteOutline } from '@mui/icons-material';
import { PlannerItem, TripPlannerProps } from '../../../../types/types.ts';

const TripPlanner: React.FC<TripPlannerProps> = ({nights, checkInDate, checkOutDate, onCancel, onProceed}) => {
const location = useLocation(); 
const navigate = useNavigate();
const getSearchParams = () => {
    if (location.state && Object.keys(location.state).length > 0) {
      sessionStorage.setItem('tripPlannerParams', JSON.stringify(location.state));
      return location.state;
    }
    const storedParams = sessionStorage.getItem('tripPlannerParams');
    if (storedParams) {
      return JSON.parse(storedParams);
    }
    return {
      checkInDate: checkInDate, 
      checkOutDate: checkOutDate, 
      nights: nights || 1, // Ensure nights has a default value
      city: 'Baku',
      packageType: 'hotel-land' // Default to hotel-land package
    };
};
const searchParams = getSearchParams();
const [currentSearchParams, setCurrentSearchParams] = useState(searchParams);
const [hotels, setHotels] = useState<any[]>([]);
const [showModifySearch, setShowModifySearch] = useState(false);
const [activeTab, setActiveTab] = useState<'planner' | 'hotel'>('planner');
const [grandTotal, setGrandTotal] = useState(0);
const [selectedHotel, setSelectedHotel] = useState<any>(null);
const packageType = currentSearchParams.packageType || 'hotel-land';
const calculateNights = (startDate: Date | null, endDate: Date | null) => {
    if (startDate && endDate) {
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    return 0;
};
const generateInitialPlannerItems = () => {
    let startDate, endDate;
    if (searchParams?.checkInDate && searchParams?.checkOutDate) {
      startDate = new Date(searchParams.checkInDate);
      endDate = new Date(searchParams.checkOutDate);
    }
    else if (checkInDate && checkOutDate) {
      startDate = new Date(checkInDate);
      endDate = new Date(checkOutDate);
    }
    else {
      startDate = new Date();
      endDate = new Date();
      endDate.setDate(endDate.getDate() + 1);
    }
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      console.error('Invalid date values', { checkInDate, checkOutDate, searchParamsIn: searchParams?.checkInDate, searchParamsOut: searchParams?.checkOutDate });
      startDate = new Date();
      endDate = new Date();
      endDate.setDate(endDate.getDate() + 1);
    }
    const items: PlannerItem[] = [];
    const currentDate = new Date(startDate);
    const totalNights = calculateNights(startDate, endDate);
    for (let i = 0; i <= totalNights; i++) {
      const dayDate = new Date(currentDate);
      const day = dayDate.getDate();
      const month = dayDate.toLocaleString('default', { month: 'short' });
      const year = dayDate.getFullYear();
      items.push({
        id: `day-${items.length + 1}`,
        date: `${day.toString().padStart(2, '0')}-${month} ${year}`,
        dateObj: new Date(dayDate),
        hotel: null, 
        transfer: null, 
        tours: null, 
        meals: null
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return items;
};
const [plannerItems, setPlannerItems] = useState<PlannerItem[]>(generateInitialPlannerItems());

useEffect(() => {
    const searchParams = location.state || {};
    if (Object.keys(searchParams).length > 0) {
      sessionStorage.setItem('tripPlannerParams', JSON.stringify(searchParams));
      setCurrentSearchParams(searchParams);
    }
  }, [location.state]);

/////save hotels
useEffect(() => {
  const savedHotels = sessionStorage.getItem('tripPlannerHotels');
  if (savedHotels) {
    try {
      const parsedHotels = JSON.parse(savedHotels);
      if (Array.isArray(parsedHotels) && parsedHotels.length > 0) {
        console.log("Loaded hotels from session storage:", parsedHotels);
        setHotels(parsedHotels);
      }
    } catch (e) {
      console.error('Error parsing saved hotels', e);
    }
  }
}, []);

const handleHotelSelection = (itemId) => {
  const plannerItem = plannerItems.find(item => item.id === itemId);
  if (!plannerItem) return;
  const itemDate = new Date(plannerItem.dateObj);
  const dayHasHotel = plannerItems.find(item =>
    item.id === itemId && item.hotel !== null
  );
  if (dayHasHotel) {
    console.log("This day already has a hotel assigned");
    return;
  }
  const checkInDate = new Date(itemDate);
  const checkOutDate = new Date(itemDate);
  checkOutDate.setDate(checkOutDate.getDate() + 2);
  const tripCheckOutDate = new Date(currentSearchParams.checkOutDate);
  const isLastNight = checkOutDate.toDateString() === tripCheckOutDate.toDateString();
  const hotelSearchParams = {
    ...currentSearchParams,
    checkInDate: checkInDate.toISOString(),
    checkOutDate: checkOutDate.toISOString(),
    nights: 1,
    specificDayId: itemId,
    applyToAllDays: false,
    isHotelSpecific: true,
    isLastDay: isLastNight,
    originalCheckInDate: currentSearchParams.checkInDate,
    originalCheckOutDate: currentSearchParams.checkOutDate,
  };
  if (isLastNight) {
    const extraDay = new Date(checkOutDate);
    const additionalSearchParams = {
      ...hotelSearchParams,
      checkInDate: extraDay.toISOString(),
      checkOutDate: new Date(extraDay.setDate(extraDay.getDate() + 1)).toISOString()
    };
    sessionStorage.setItem('lastNightHotelParams', JSON.stringify(additionalSearchParams));
  }
  sessionStorage.setItem('tripPlannerParams', JSON.stringify(currentSearchParams));
  sessionStorage.setItem('hotelSearchParams', JSON.stringify(hotelSearchParams));
  navigate('/trip-planner-area', {
    state: hotelSearchParams
  });
};

useEffect(() => {
  if (hotels.length > 0) {
    console.log("Processing hotels for calendar:", hotels);
    setPlannerItems(prevItems => {
      const updatedItems = [...prevItems];
      
      // Create a copy of all items with nullified hotels
      updatedItems.forEach(item => {
        item.hotel = null;
      });
      
      // Process each hotel and assign it to the appropriate days
      hotels.forEach(hotel => {
        if (hotel.specificDayId) {
          // Handle specific day hotel assignments
          const specificDay = updatedItems.find(item => item.id === hotel.specificDayId);
          if (specificDay) {
            const dayIndex = updatedItems.indexOf(specificDay);
            const hotelCheckIn = new Date(specificDay.dateObj);
            const hotelCheckOut = new Date(hotelCheckIn);
            hotelCheckOut.setDate(hotelCheckOut.getDate() + 1); // Just for one night
            
            // Assign hotel to this specific day
            updatedItems[dayIndex].hotel = {
              name: hotel.hotel?.hotelName || "Unknown Hotel",
              details: hotel
            };
          }
        } else if (hotel.booking?.checkInDate && hotel.booking?.checkOutDate) {
          // Handle regular hotel assignments based on date ranges
          const hotelCheckIn = new Date(hotel.booking.checkInDate);
          const hotelCheckOut = new Date(hotel.booking.checkOutDate);
          
          updatedItems.forEach((item, index) => {
            const itemDate = new Date(item.dateObj);
            itemDate.setHours(0, 0, 0, 0);
            
            const inDate = new Date(hotelCheckIn);
            const outDate = new Date(hotelCheckOut);
            inDate.setHours(0, 0, 0, 0);
            outDate.setHours(0, 0, 0, 0);
            
            // If item date is within hotel check-in and check-out range
            if (itemDate >= inDate && itemDate < outDate) {
              updatedItems[index].hotel = {
                name: hotel.hotel?.hotelName || "Unknown Hotel",
                details: hotel
              };
            }
            
            // Special case for the last day of the trip
            if (
              itemDate.getTime() === outDate.getTime() &&
              index === updatedItems.length - 1
            ) {
              updatedItems[index].hotel = {
                name: hotel.hotel?.hotelName || "Unknown Hotel",
                details: hotel
              };
            }
          });
        }
      });
      
      return updatedItems;
    });
    
    if (!selectedHotel && hotels.length > 0) {
      setSelectedHotel(hotels[0]);
    }
    
    // Calculate total price from all hotels
    const total = hotels.reduce((sum, hotel) => {
      if (hotel.booking && typeof hotel.booking.totalPrice === 'number') {
        return sum + hotel.booking.totalPrice;
      }
      return sum;
    }, 0);
    
    setGrandTotal(total);
    sessionStorage.setItem('tripPlannerHotels', JSON.stringify(hotels));
  } else {
    setGrandTotal(0);
    setSelectedHotel(null);
    setPlannerItems(prevItems => {
      return prevItems.map(item => ({
        ...item,
        hotel: null
      }));
    });
  }
}, [hotels, currentSearchParams.nights]);

useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const hotelData = urlParams.get('hotelData');
  if (hotelData) {
    try {
      const hotelDetails = JSON.parse(decodeURIComponent(hotelData));
      if (hotelDetails.booking?.checkInDate) {
        hotelDetails.booking.checkInDate = new Date(hotelDetails.booking.checkInDate).toISOString();
      }
      if (hotelDetails.booking?.checkOutDate) {
        hotelDetails.booking.checkOutDate = new Date(hotelDetails.booking.checkOutDate).toISOString();
      }
      
      // Important: Add a unique ID if not present to ensure we can identify this hotel
      if (!hotelDetails.uniqueId) {
        hotelDetails.uniqueId = `hotel-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      }
      
      // Always add the new hotel to the existing hotels array - never replace
      setHotels(prevHotels => {
        // Create a copy of the existing hotels
        const existingHotels = [...prevHotels];
        
        // If it's for a specific day, handle specially
        if (hotelDetails.specificDayId) {
          const specificDayItem = plannerItems.find(item => item.id === hotelDetails.specificDayId);
          if (specificDayItem) {
            hotelDetails.booking.checkInDate = new Date(specificDayItem.dateObj).toISOString();
            const checkInDate = new Date(specificDayItem.dateObj);
            const checkOutDate = new Date(checkInDate);
            checkOutDate.setDate(checkOutDate.getDate() + 1); // Just one night
            hotelDetails.booking.checkOutDate = checkOutDate.toISOString();
            hotelDetails.booking.nights = 1;
            
            // Check if this specific day already has a hotel
            const existingHotelForDay = existingHotels.findIndex(existingHotel => 
              existingHotel.specificDayId === hotelDetails.specificDayId
            );
            
            // If there's already a hotel for this day, replace it
            if (existingHotelForDay !== -1) {
              existingHotels[existingHotelForDay] = hotelDetails;
            } else {
              // Otherwise add the new hotel
              existingHotels.push(hotelDetails);
            }
          } else {
            // If we can't find the specific day, just add the hotel
            existingHotels.push(hotelDetails);
          }
        } else {
          // For regular hotels (not specific day), just add them
          existingHotels.push(hotelDetails);
        }
        
        // Save to session storage and return the updated array
        sessionStorage.setItem('tripPlannerHotels', JSON.stringify(existingHotels));
        return existingHotels;
      });
      
      // Clear URL params after processing
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    } catch (e) {
      console.error('Error parsing hotel data from URL', e);
    }
  }
}, [plannerItems, currentSearchParams.nights]);

useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const tourData = urlParams.get('tourData');
  if (tourData) {
    try {
      const tourDetails = JSON.parse(decodeURIComponent(tourData));
      setPlannerItems(prevItems => {
        const updatedItems = [...prevItems];
        const specificDayItem = updatedItems.find(item => item.id === tourDetails.specificDayId);
        if (specificDayItem) {
          const index = updatedItems.indexOf(specificDayItem);
          if (updatedItems[index].tours) {
            console.log("This day already has a tour scheduled");
          } else {
            updatedItems[index] = {
              ...updatedItems[index],
              tours: {
                name: tourDetails.tour.tourName,
                details: tourDetails
              }
            };
          }
        }
        sessionStorage.setItem('tripPlannerItems', JSON.stringify(updatedItems));
        return updatedItems;
      });
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
      
    } catch (e) {
      console.error('Error parsing tour data from URL', e);
    }
  }
}, []);

const handleAddItem = (itemId: string, itemType: 'hotel' | 'transfer' | 'tours' | 'meals') => {
  const plannerItem = plannerItems.find(item => item.id === itemId);
  if (!plannerItem) {
    console.error(`Could not find planner item with id ${itemId}`);
    return;
  }
  const itemDate = plannerItem.dateObj instanceof Date 
  ? plannerItem.dateObj 
  : new Date(plannerItem.dateObj);

  if (isNaN(itemDate.getTime())) {
    console.error(`Invalid date object for planner item ${itemId}`);
    return;
  }
  sessionStorage.setItem('tripPlannerParams', JSON.stringify(currentSearchParams));
  sessionStorage.setItem('tripPlannerHotels', JSON.stringify(hotels));
  sessionStorage.setItem('tripPlannerItems', JSON.stringify(plannerItems));
  
  let selectedArea = '';
  if (packageType === 'hotel-land' && hotels.length > 0 && hotels[0].hotel?.area) {
    selectedArea = hotels[0].hotel.area;
  } else {
    const storedParams = sessionStorage.getItem('selectedHotelArea');
    if (storedParams) {
      selectedArea = storedParams;
    }
  }
  
  if (itemType === 'hotel') {
    // For hotel selections, we want single night selections
    const checkoutDate = new Date(itemDate);
    checkoutDate.setDate(checkoutDate.getDate() + 1); // Just one night
    
    // Determine if this is the last day in the trip
    const tripEndDate = new Date(currentSearchParams.checkOutDate);
    const isLastDay = checkoutDate.getTime() >= tripEndDate.getTime();
    
    navigate('/trip-planner-area', {
      state: {
        ...currentSearchParams,
        dayId: itemId.split('-')[1],
        fromTripPlanner: true,
        checkInDate: itemDate.toISOString(),
        checkOutDate: checkoutDate.toISOString(),
        nights: 1, // Always set to 1 night
        specificDay: false,
        specificDayId: itemId,
        applyToAllDays: false,
        isLastDay: isLastDay // Flag for the view
      }
    });
  } else if (itemType === 'tours') {
    const params = new URLSearchParams();
    params.append('city', currentSearchParams.city || 'Baku');
    params.append('country', currentSearchParams.country || 'Azerbaijan');
    params.append('state', selectedArea || currentSearchParams.area || '');
    params.append('occupancy', String(currentSearchParams.rooms?.[0]?.adults || 2));
    params.append('adult', String(currentSearchParams.rooms?.[0]?.adults || 2));
    params.append('fromTripPlanner', 'true');
    params.append('dayId', itemId.split('-')[1]);
    params.append('checkInDate', itemDate.toISOString());
    params.append('specificDayId', itemId);
    params.append('packageType', packageType);
    window.location.href = `http://localhost:3002/home-page?${params.toString()}`;
  } else {
    navigate(`/${itemType}-summary`, {
      state: {
        ...currentSearchParams,
        dayId: itemId.split('-')[1],
        fromTripPlanner: true,
        checkInDate: itemDate.toISOString()
      }
    });
  }
};

useEffect(() => {
  if (hotels.length > 0) {
    setPlannerItems(prevItems => {
      const updatedItems = JSON.parse(JSON.stringify(prevItems));
      hotels.forEach(hotel => {
        let hotelCheckIn, hotelCheckOut;
        if (hotel.specificDayId) {
          const specificDay = updatedItems.find(item => item.id === hotel.specificDayId);
          if (specificDay) {
            hotelCheckIn = new Date(specificDay.dateObj);
            hotelCheckOut = new Date(hotelCheckIn);
            hotelCheckOut.setDate(hotelCheckOut.getDate() + 1);
          }
        } else if (hotel.booking?.checkInDate && hotel.booking?.checkOutDate) {
          hotelCheckIn = new Date(hotel.booking.checkInDate);
          hotelCheckOut = new Date(hotel.booking.checkOutDate);
        }
        if (hotelCheckIn && hotelCheckOut) {
          updatedItems.forEach(item => {
            const itemDate = new Date(item.dateObj);
            itemDate.setHours(0, 0, 0, 0);
            hotelCheckIn.setHours(0, 0, 0, 0);
            hotelCheckOut.setHours(0, 0, 0, 0);
            if (itemDate >= hotelCheckIn && itemDate < hotelCheckOut) {
              item.hotel = {
                name: hotel.hotel?.hotelName || "Unknown Hotel",
                details: hotel
              };
            }
            const isLastDay = updatedItems.indexOf(item) === updatedItems.length - 1;
            if (isLastDay && itemDate.getTime() === hotelCheckOut.getTime()) {
              item.hotel = {
                name: hotel.hotel?.hotelName || "Unknown Hotel",
                details: hotel
              };
            }
          });
        }
      });
      return updatedItems;
    });
    if (!selectedHotel && hotels.length > 0) {
      setSelectedHotel(hotels[0]);
    }
    const total = hotels.reduce((sum, hotel) => {
      if (hotel.booking && typeof hotel.booking.totalPrice === 'number') {
        return sum + hotel.booking.totalPrice;
      }
      return sum;
    }, 0);
    setGrandTotal(total);
  } else {
    setGrandTotal(0);
    setSelectedHotel(null);
    setPlannerItems(prevItems => {
      return prevItems.map(item => ({
        ...item,
        hotel: null
      }));
    });
  }
}, [hotels]);

useEffect(() => {
  const savedItems = sessionStorage.getItem('tripPlannerItems');
  if (savedItems) {
    try {
      const parsedItems = JSON.parse(savedItems);
      if (parsedItems && Array.isArray(parsedItems) && parsedItems.length > 0) {
        // Only restore tours from saved items
        setPlannerItems(prevItems => {
          const updatedItems = [...prevItems];
          parsedItems.forEach(savedItem => {
            if (savedItem.tours) {
              const matchingItem = updatedItems.find(item => item.id === savedItem.id);
              if (matchingItem) {
                const itemIndex = updatedItems.indexOf(matchingItem);
                updatedItems[itemIndex] = {
                  ...updatedItems[itemIndex],
                  tours: savedItem.tours
                };
              }
            }
          });
          return updatedItems;
        });
      }
    } catch (e) {
      console.error('Error parsing saved planner items', e);
    }
  }
}, []);

useEffect(() => {
  let total = 0;
  const uniqueHotels = new Set();
  hotels.forEach(hotel => {
    const hotelIdentifier = hotel.hotel?.hotelId || hotel.hotel?.hotelName;
    if (hotelIdentifier && !uniqueHotels.has(hotelIdentifier)) {
      uniqueHotels.add(hotelIdentifier);
      if (hotel.booking && typeof hotel.booking.totalPrice === 'number') {
        total += hotel.booking.totalPrice;
      }
    }
  });
  plannerItems.forEach(item => {
    if (item.tours && item.tours.details && 
        item.tours.details.booking && 
        typeof item.tours.details.booking.totalPrice === 'number') {
      total += item.tours.details.booking.totalPrice;
    }
  });
  
  setGrandTotal(total);
}, [hotels, plannerItems]);

const handleRemoveTour = (plannerItem) => {
  if (!plannerItem.tours) return;
  
  setPlannerItems(prevItems => {
    const updatedItems = [...prevItems];
    const index = updatedItems.findIndex(item => item.id === plannerItem.id);
    
    if (index !== -1) {
      // Subtract the tour price from grand total
      if (plannerItem.tours.details?.booking?.totalPrice) {
        setGrandTotal(prev => prev - plannerItem.tours.details.booking.totalPrice);
      }
      
      // Remove the tour from the planner item
      updatedItems[index] = {
        ...updatedItems[index],
        tours: null
      };
      
      // Update session storage with the modified items
      sessionStorage.setItem('tripPlannerItems', JSON.stringify(updatedItems));
    }
    
    return updatedItems;
  });
};

const handleRemoveHotel = (plannerItem: PlannerItem) => {
  if (!plannerItem.hotel) return;
  
  const hotelToRemove = hotels.find(h => {
    // If it's a specific day hotel
    if (plannerItem.hotel && plannerItem.hotel.details && plannerItem.hotel.details.specificDayId) {
      return h.specificDayId === plannerItem.hotel.details.specificDayId;
    } 
    // Otherwise check if the item date is within the hotel's date range
    else if (plannerItem.hotel && plannerItem.hotel.details) {
      const hCheckIn = new Date(h.booking?.checkInDate);
      const hCheckOut = new Date(h.booking?.checkOutDate);
      const itemDate = new Date(plannerItem.dateObj);
      
      // Set hours to 0 for accurate date comparison
      hCheckIn.setHours(0, 0, 0, 0);
      hCheckOut.setHours(0, 0, 0, 0);
      itemDate.setHours(0, 0, 0, 0);
      
      // Only remove if the exact hotel matches
      return (itemDate >= hCheckIn && itemDate < hCheckOut) && 
             h.hotel?.hotelId === plannerItem.hotel.details.hotel?.hotelId;
    }
    return false;
  });
  
  if (hotelToRemove) {
    const updatedHotels = hotels.filter(h => h !== hotelToRemove);
    setHotels(updatedHotels);
    sessionStorage.setItem('tripPlannerHotels', JSON.stringify(updatedHotels));
    
    // Update planner items to reflect the removed hotel
    setPlannerItems(prevItems => {
      const updatedItems = [...prevItems];
      
      updatedItems.forEach((item, index) => {
        if (item.hotel?.details === hotelToRemove) {
          updatedItems[index].hotel = null;
        }
      });
      
      return updatedItems;
    });
    
    // Update selected hotel if needed
    if (selectedHotel === hotelToRemove) {
      setSelectedHotel(updatedHotels.length > 0 ? updatedHotels[0] : null);
    }
  }
};
const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        if (dateString.includes('-')) {
          const [day, rest] = dateString.split('-');
          return `${day}-${rest.split(' ')[0]}`;
        }
        return dateString;
      }
      return date.toLocaleDateString('en-US', {day: '2-digit', month: 'short'});
    } catch (e) {
      return dateString;
    }
  };
const formatYear = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        if (dateString.includes(' ')) {
          return dateString.split(' ')[1];
        }
        return '';
      }
      return date.getFullYear().toString();
    } catch (e) {
      return '';
    }
  };
const formatHeaderDate = (dateString: string | undefined) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      
      return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    } catch (e) {
      return '';
    }
};
const displayCheckInDate = formatHeaderDate(currentSearchParams?.checkInDate) || '08/04/2025';
const displayCheckOutDate = formatHeaderDate(currentSearchParams?.checkOutDate) || '09/04/2025';
const displayNights = currentSearchParams?.nights || nights || '1';
const displayCity = currentSearchParams?.city || 'BAKU';
const handleSearchComplete = (updatedParams: any) => {
    if (updatedParams) { 
      setCurrentSearchParams(updatedParams);
      sessionStorage.setItem('tripPlannerParams', JSON.stringify(updatedParams));
      setPlannerItems(generateInitialPlannerItems());
      if (hotels.length > 0) {
        const newStartDate = new Date(updatedParams.checkInDate);
        const newEndDate = new Date(updatedParams.checkOutDate);
        setHotels(prevHotels => prevHotels.filter(hotel => {
          if (hotel.specificDayId) {
            const hotelDate = new Date(hotel.booking?.checkInDate);
            return hotelDate >= newStartDate && hotelDate < newEndDate;
          }
          const hotelCheckIn = new Date(hotel.booking?.checkInDate);
          const hotelCheckOut = new Date(hotel.booking?.checkOutDate);
          return hotelCheckIn < newEndDate && hotelCheckOut > newStartDate;
        }));
      }
    }
    setShowModifySearch(false);
  };
const handleTabChange = (event: React.SyntheticEvent, newValue: 'planner' | 'hotel') => {
  setActiveTab(newValue);
};
const showHotelTab = packageType === 'hotel-land';
return (
    <Box className="trip-planner-page">
      <Container sx={{ paddingLeft: '0rem', paddingRight: '0rem', maxWidth: '100%' }}>
        <Box className="search-info heading">
          <Typography variant="h5" component="h1">
            {displayCity} | {displayNights} NIGHT/S | {displayCheckInDate} - {displayCheckOutDate}
          </Typography>
          <Button className="modify-search" onClick={() => setShowModifySearch(!showModifySearch)}> Modify search<ArrowDownIcon width="16" height="16" fill="#000" /></Button>
        </Box>
        {showModifySearch && (
          <div className="modify-search-container">
            <Customize isModifying={true} initialValues={currentSearchParams} onSearchComplete={handleSearchComplete}  />
          </div>
        )}
        <Box sx={{ mb: 0 }}>
          <Tabs value={activeTab} onChange={handleTabChange} sx={{color:'black'}}>
            <Tab value="planner" label="Planner" style={{color: activeTab === 'planner' ? 'white' : 'black', }}  sx={{  color: activeTab === 'planner' ? 'black' : 'white', 
              bgcolor: activeTab === 'planner' ? 'grey' : 'white',marginLeft:'0rem', width:'10rem'}}  />
            {showHotelTab && (
              <Tab value="hotel" label="Hotel Details" style={{color: activeTab === 'planner' ? 'black' : 'white', }}  sx={{color: activeTab === 'planner' ? 'black' : 'white', 
                bgcolor: activeTab === 'planner' ? 'white' : 'grey',marginLeft:'0.5rem', width:'10rem' }}  />
            )}
          </Tabs>
        </Box>
        {activeTab === 'planner' && (
          <Paper elevation={3} className="planner-table-container">
            <Box className="planner-table">
              <Box className="table-header">
                <Box className="header-cell date-cell">Date</Box>
                {/* Show hotel column only for hotel-land package */}
                {packageType === 'hotel-land' && <Box className="header-cell">Hotel</Box>}
                <Box className="header-cell">Transfer</Box>
                <Box className="header-cell">Tours</Box>
                <Box className="header-cell">Meals</Box>
              </Box>
              {plannerItems.map((plannerItem) => (
                <Box key={plannerItem.id} className="table-row">
                  <Box className="cell date-cell">
                    <Typography variant="body2">{formatDate(plannerItem.date)}</Typography>
                    <Typography variant="body2">{formatYear(plannerItem.date)}</Typography>
                  </Box>
                  
                  {/* Show hotel cell only for hotel-land package */}
                  {packageType === 'hotel-land' && (
                    <Box className="cell">
                      {plannerItem.hotel ? (
                        <Box className="selected-hotel">
                          <Typography variant="body2" sx={{ whiteSpace: 'nowrap', overflow: 'hidden',
                            textOverflow: 'ellipsis', maxWidth: '120px' }} >
                            {plannerItem.hotel.name}
                          </Typography>
                          <IconButton   className="remove-button"  onClick={() => handleRemoveHotel(plannerItem)}aria-label="Remove hotel" size="small" >
                            <DeleteOutline sx={{ color: '#777777', fontSize: '18px' }} />
                          </IconButton>
                        </Box>
                      ) : (
                        <Box display="flex" justifyContent="flex-end">
                          <IconButton className="add-button" 
                          onClick={() =>
                            handleHotelSelection(plannerItem.id)
                          }
                            sx={{ color: '#777777' }}>
                            <AddCircleOutline />
                          </IconButton>
                        </Box>
                      )}
                    </Box>
                  )}
                  
                  <Box className="cell">
                    <Box display="flex" justifyContent="flex-end">
                      <IconButton
                        className="add-button" onClick={() => handleAddItem(plannerItem.id, 'transfer')} aria-label="Add transfer"sx={{ color: '#777777' }}> 
                        <AddCircleOutline />
                      </IconButton>
                    </Box>
                  </Box>

                  <Box className="cell">
                    {plannerItem.tours ? (
                      <Box className="selected-tour">
                        <Typography variant="body2" sx={{ whiteSpace: 'nowrap', overflow: 'hidden',
                          textOverflow: 'ellipsis', maxWidth: '120px' }} >
                          {plannerItem.tours.name}
                        </Typography>
                        <IconButton className="remove-button" onClick={() => handleRemoveTour(plannerItem)} 
                          aria-label="Remove tour" size="small" >
                          <DeleteOutline sx={{ color: '#777777', fontSize: '18px' }} />
                        </IconButton>
                      </Box>
                    ) : (
                      <Box display="flex" justifyContent="flex-end">
                        <IconButton className="add-button" 
                          onClick={() => handleAddItem(plannerItem.id, 'tours')}
                          aria-label="Add tours" sx={{ color: '#777777' }}>
                          <AddCircleOutline />
                        </IconButton>
                      </Box>
                    )}
                  </Box>
                  <Box className="cell">
                    <Box display="flex" justifyContent="flex-end">
                      <IconButton className="add-button"onClick={() => handleAddItem(plannerItem.id, 'meals')} aria-label="Add meals" sx={{ color: '#777777' }} >
                        <AddCircleOutline />
                      </IconButton>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
            <Box className="total-section">
              <Typography variant="h6" align="right"> 
                Grand Total : <span className="total-amount">USD {grandTotal.toFixed(2)}</span>
              </Typography>
            </Box>
            <Box className="action-buttons">
              <Button variant="contained" color="error" className="proceed-button" onClick={() => onProceed && onProceed(currentSearchParams)} > Proceed To Next </Button>
              <Button variant="contained" className="cancel-button" onClick={onCancel}>Cancel </Button>
            </Box>
          </Paper>
        )}
        {activeTab === 'hotel' && showHotelTab && (
        <Paper elevation={3} className="hotel-details-container" sx={{bgcolor:'transparent',boxShadow:'none'}}>
          {hotels.length > 0 ? (
            hotels.map((hotel, index) => (
              <Grid 
                key={`hotel-${index}`} 
                className='item-container'
                item xs={14} md={8} 
                sx={{marginLeft:'0.5rem', maxWidth:'100%', padding:'0.5rem', marginBottom: '1rem'}}
              >
                <Grid container spacing={2} sx={{bgcolor:'white', padding:'0rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'}}>
                  <Grid item xs={12} md={4} sx={{'& .MuiGrid-root':{maxWidth:'21%'}}}>
                    {hotel.hotel?.imageUrl ? (
                      <img 
                        src={hotel.hotel.imageUrl} 
                        alt={hotel.hotel.hotelName} 
                        style={{  width: '98%',  height: '10rem',  objectFit: 'cover',  padding:'0.5rem', borderRadius: '8px'  }}
                      />
                    ) : (
                      <Box 
                        sx={{ bgcolor: 'white', height: '200px', width: '100%', display: 'flex',alignItems: 'center', justifyContent: 'center',borderRadius: '8px' }} >
                        <Typography>No Image Available</Typography>
                      </Box>
                    )}
                  </Grid>
                  <Grid item xs={12} md={8} className='hotel-details'>
                    <Typography variant="h6" sx={{ color: '#2c3e50',fontWeight: 'bold' }}>
                      {hotel.hotel?.hotelName || "Hotel Name"}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'start', marginBottom:'1rem' }}>
                      {Array(hotel.hotel?.starRating || 0).fill(0).map((_, i) => (
                        <span key={i} style={{ color: '#FFD700', fontSize: '20px' }}>★</span>
                      ))}
                    </Box>
                    <Grid container spacing={2} className="booking-details">
                      <Grid item xs={12} sm={8} md={2} className="booking-column">
                        <Typography className="details-label">Check In: {new Date(hotel.booking?.checkInDate).toLocaleDateString()}</Typography>
                        <Typography className="details-label">Check Out: {new Date(hotel.booking?.checkOutDate).toLocaleDateString()}</Typography>
                        <Typography className="details-label">Nights: {hotel.booking?.nights || 1}</Typography>
                      </Grid>
                      
                      <Grid item xs={12} sm={8} md={2} className="booking-column">
                        <Typography className="details-label">Room Type: {hotel.booking?.roomType || "Deluxe Room"}</Typography>
                        <Typography className="details-label">Meal Plan: {hotel.booking?.mealPlan || "BB"}</Typography>
                        <Typography className="details-label">Total Room(s): {hotel.booking?.totalRooms || 1}</Typography>
                      </Grid>
                      
                      <Grid item xs={12} sm={8} md={2} className="booking-column">
                        <Typography className="details-label">Adult(s): {hotel.booking?.adults || 2}</Typography>
                        <Typography className="details-label">Child With Bed: {hotel.booking?.cwb || 0}</Typography>
                        <Typography className="details-label">Child Without Bed: {hotel.booking?.cnb || 0}</Typography>
                      </Grid> 
                      
                      <Grid item xs={12} sm={8} md={2} className="booking-column">
                        <Typography className="details-label">Total Amount: USD {hotel.booking?.totalPrice?.toFixed(2) || "0.00"}</Typography>
                        <Typography className="details-label">Status: {hotel.booking?.status || 'Available (Payment Needed)'}</Typography>
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
        </Paper>
        )}
      </Container>
    </Box>
  );
};

export default TripPlanner;

