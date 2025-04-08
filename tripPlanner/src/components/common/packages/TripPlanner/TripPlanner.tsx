import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './TripPlanner.scss';
import { Box, Container, Typography, Button, Grid, IconButton, Paper, Tabs, Tab } from '@mui/material';
import { ArrowDownIcon } from '../../../../icons/icons.tsx';
import Customize from '../Customize/Customize.tsx';
import { AddCircleOutline, DeleteOutline } from '@mui/icons-material';
import { PlannerItem, TripPlannerProps } from '../../../../types/types.ts';

// Update the props interface to include packageType
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
  const [selectedHotel, setSelectedHotel] = useState<any>(null); // For hotel details tab
  
  // Extract packageType from searchParams
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
    const savedHotels = sessionStorage.getItem('tripPlannerHotels');
    if (savedHotels) {
      try {
        const parsedHotels = JSON.parse(savedHotels);
        setHotels(parsedHotels);
      } catch (e) {
        console.error('Error parsing saved hotels', e);
      }
    }
  }, []);

useEffect(() => {
    const searchParams = location.state || {};
    if (Object.keys(searchParams).length > 0) {
      sessionStorage.setItem('tripPlannerParams', JSON.stringify(searchParams));
      setCurrentSearchParams(searchParams);
    }
  }, [location.state]);

  useEffect(() => {
    setPlannerItems(generateInitialPlannerItems());
  }, [checkInDate, checkOutDate, location.state]);

useEffect(() => {
  if (hotels.length > 0) {
    let newTotal = 0;
    setPlannerItems(prevItems => {
      const updatedItems = [...prevItems];
      updatedItems.forEach(item => {
        item.hotel = null;
      });
      const uniqueHotels = new Set();
      let total = 0;
    
      hotels.forEach(hotel => {
        const hotelIdentifier = hotel.hotel?.hotelId || hotel.hotel?.hotelName;
        if (hotelIdentifier && !uniqueHotels.has(hotelIdentifier)) {
          uniqueHotels.add(hotelIdentifier);
          if (hotel.booking && typeof hotel.booking.totalPrice === 'number') {
            total += hotel.booking.totalPrice;
          }
        }
        let hotelCheckIn, hotelCheckOut;
        
        if (hotel.specificDayId) {
          const specificDay = updatedItems.find(item => item.id === hotel.specificDayId);
          if (specificDay) {
            hotelCheckIn = new Date(specificDay.dateObj);
            const hotelNights = hotel.booking?.nights || currentSearchParams.nights || 1;
            hotelCheckOut = new Date(hotelCheckIn);
            hotelCheckOut.setDate(hotelCheckOut.getDate() + parseInt(hotelNights));
          }
        } else {
          hotelCheckIn = new Date(hotel.booking?.checkInDate);
          hotelCheckOut = new Date(hotel.booking?.checkOutDate);
        }
        if (hotelCheckIn && hotelCheckOut && !isNaN(hotelCheckIn.getTime()) && !isNaN(hotelCheckOut.getTime())) {
          updatedItems.forEach(item => {
            const itemDate = new Date(item.dateObj);
            if (itemDate >= hotelCheckIn && itemDate < hotelCheckOut) {
              item.hotel = {
                name: hotel.hotel?.hotelName || "Unknown Hotel",
                details: hotel
              };
            }
          });
        }
      });
      setGrandTotal(total);
      return updatedItems;
    });
    if (hotels.length > 0 && !selectedHotel) {
      setSelectedHotel(hotels[0]);
    }
  } else {
    setGrandTotal(0);
    setSelectedHotel(null);
  }
}, [hotels, currentSearchParams.nights]);

const handleHotelSelection = (itemId) => {
  const plannerItem = plannerItems.find(item => item.id === itemId);
  if (!plannerItem) return;
  const itemDate = new Date(plannerItem.dateObj);
  let latestCheckout = null;
  hotels.forEach(hotel => {
    let hotelCheckOut;
    
    if (hotel.specificDayId) {
      const hotelItem = plannerItems.find(item => item.id === hotel.specificDayId);
      if (hotelItem) {
        const checkInDate = new Date(hotelItem.dateObj);
        const nights = parseInt(hotel.booking?.nights || currentSearchParams.nights || 1);
        hotelCheckOut = new Date(checkInDate);
        hotelCheckOut.setDate(hotelCheckOut.getDate() + nights);
      }
    } else if (hotel.booking?.checkOutDate) {
      hotelCheckOut = new Date(hotel.booking.checkOutDate);
    }
    
    if (hotelCheckOut && (!latestCheckout || hotelCheckOut > latestCheckout)) {
      latestCheckout = hotelCheckOut;
    }
  });
  const newCheckInDate = latestCheckout || itemDate;
  const selectedNights = parseInt(currentSearchParams.nights) || 1;
  const newCheckOutDate = new Date(newCheckInDate);
  newCheckOutDate.setDate(newCheckOutDate.getDate() + selectedNights);
  const tripEndDate = new Date(currentSearchParams.checkOutDate);
  const adjustedCheckOutDate = newCheckOutDate > tripEndDate ? tripEndDate : newCheckOutDate;
  const hotelSearchParams = {
    ...currentSearchParams,
    checkInDate: newCheckInDate.toISOString(),
    checkOutDate: adjustedCheckOutDate.toISOString(),
    nights: selectedNights,
    specificDayId: itemId,
    applyToAllDays: true
  };
  
  sessionStorage.setItem('tripPlannerParams', JSON.stringify(hotelSearchParams));
  
  navigate('/trip-planner-area', {
    state: hotelSearchParams
  });
};
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hotelData = urlParams.get('hotelData');
    if (hotelData) {
      try {
        const hotelDetails = JSON.parse(decodeURIComponent(hotelData));
        
        // Ensure booking dates are properly formatted
        if (hotelDetails.booking?.checkInDate) {
          hotelDetails.booking.checkInDate = new Date(hotelDetails.booking.checkInDate).toISOString();
        }
        if (hotelDetails.booking?.checkOutDate) {
          hotelDetails.booking.checkOutDate = new Date(hotelDetails.booking.checkOutDate).toISOString();
        }
        
        setHotels(prevHotels => {
          // Start with existing hotels
          const newHotels = [...prevHotels];
          
          // Remove hotels that would overlap with this new one
          const filteredHotels = newHotels.filter(existingHotel => {
            // Handle hotel with specificDayId
            if (hotelDetails.specificDayId) {
              const specificDayItem = plannerItems.find(item => item.id === hotelDetails.specificDayId);
              if (!specificDayItem) return true; // Keep if no matching day found
              
              const newCheckIn = new Date(specificDayItem.dateObj);
              const newNights = parseInt(hotelDetails.booking?.nights || currentSearchParams.nights || 1);
              const newCheckOut = new Date(newCheckIn);
              newCheckOut.setDate(newCheckOut.getDate() + newNights);
              
              // Check if this existing hotel overlaps with new hotel dates
              if (existingHotel.specificDayId) {
                const existingDayItem = plannerItems.find(item => item.id === existingHotel.specificDayId);
                if (!existingDayItem) return true;
                
                const existingDate = new Date(existingDayItem.dateObj);
                const existingNights = parseInt(existingHotel.booking?.nights || currentSearchParams.nights || 1);
                const existingEndDate = new Date(existingDate);
                existingEndDate.setDate(existingEndDate.getDate() + existingNights);
                return !(existingDate < newCheckOut && existingEndDate > newCheckIn);
              } else if (existingHotel.booking?.checkInDate && existingHotel.booking?.checkOutDate) {
                const existingCheckIn = new Date(existingHotel.booking.checkInDate);
                const existingCheckOut = new Date(existingHotel.booking.checkOutDate);
                return !(existingCheckIn < newCheckOut && existingCheckOut > newCheckIn);
              }
            } else {
              const newCheckIn = new Date(hotelDetails.booking?.checkInDate);
              const newCheckOut = new Date(hotelDetails.booking?.checkOutDate);
              
              if (existingHotel.specificDayId) {
                const existingDayItem = plannerItems.find(item => item.id === existingHotel.specificDayId);
                if (!existingDayItem) return true;
                
                const existingDate = new Date(existingDayItem.dateObj);
                const existingNights = parseInt(existingHotel.booking?.nights || currentSearchParams.nights || 1);
                const existingEndDate = new Date(existingDate);
                existingEndDate.setDate(existingEndDate.getDate() + existingNights);
                return !(existingDate < newCheckOut && existingEndDate > newCheckIn);
              } else if (existingHotel.booking?.checkInDate && existingHotel.booking?.checkOutDate) {
                const existingCheckIn = new Date(existingHotel.booking.checkInDate);
                const existingCheckOut = new Date(existingHotel.booking.checkOutDate);
                return !(existingCheckIn < newCheckOut && existingCheckOut > newCheckIn);
              }
            }
            
            return true; 
          });
          return [...filteredHotels, hotelDetails];
        });
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      } catch (e) {
        console.error('Error parsing hotel data from URL', e);
      }
    }
  }, [plannerItems, currentSearchParams.nights]);

  useEffect(() => {
    const uniqueHotels = new Set();
    let total = 0;
  
    hotels.forEach(hotel => {
      const hotelIdentifier = hotel.hotel?.hotelId || hotel.hotel?.hotelName;
      if (hotelIdentifier && !uniqueHotels.has(hotelIdentifier)) {
        uniqueHotels.add(hotelIdentifier);
        if (hotel.booking && typeof hotel.booking.totalPrice === 'number') {
          total += hotel.booking.totalPrice;
        }
      }
    }, 0);
    setGrandTotal(total);
  }, [plannerItems]);

  const handleAddItem = (itemId: string, itemType: 'hotel' | 'transfer' | 'tours' | 'meals') => {
  const plannerItem = plannerItems.find(item => item.id === itemId);
  if (!plannerItem) {
    console.error(`Could not find planner item with id ${itemId}`);
    return;
  }
  const itemDate = plannerItem.dateObj;
  const selectedNights = currentSearchParams.nights || 1;
  const checkoutDate = new Date(itemDate);
  checkoutDate.setDate(checkoutDate.getDate() + selectedNights);
  const tripEndDate = new Date(currentSearchParams.checkOutDate);
  const adjustedCheckoutDate = checkoutDate > tripEndDate ? tripEndDate : checkoutDate;
  sessionStorage.setItem('tripPlannerParams', JSON.stringify(currentSearchParams));
  sessionStorage.setItem('tripPlannerHotels', JSON.stringify(hotels));
  
  // Save the current planner items to session storage to preserve tours across navigation
  sessionStorage.setItem('tripPlannerItems', JSON.stringify(plannerItems));
  
  // Get the area from the first hotel if available (for hotel+land package)
  // For land package, we'll handle this differently
  let selectedArea = '';
  if (packageType === 'hotel-land' && hotels.length > 0 && hotels[0].hotel?.area) {
    selectedArea = hotels[0].hotel.area;
  } else {
    // Try to get from session storage
    const storedParams = sessionStorage.getItem('selectedHotelArea');
    if (storedParams) {
      selectedArea = storedParams;
    }
  }
  
  if (itemType === 'hotel') {
    const actualNights = Math.ceil((adjustedCheckoutDate.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24));
    navigate('/trip-planner-area', {
      state: {
        ...currentSearchParams,
        dayId: itemId.split('-')[1],
        fromTripPlanner: true,
        checkInDate: itemDate.toISOString(),
        checkOutDate: adjustedCheckoutDate.toISOString(),
        nights: actualNights,
        specificDay: false,
        specificDayId: itemId,
        applyToAllDays: true
      }
    });
  } else if (itemType === 'tours') {
    // For tours, redirect to home-page with required parameters
    const params = new URLSearchParams();
    params.append('city', currentSearchParams.city || 'Baku');
    params.append('country', currentSearchParams.country || 'Azerbaijan');
    
    // Add the selected area if available
    params.append('state', selectedArea || currentSearchParams.area || '');
    params.append('occupancy', String(currentSearchParams.rooms?.[0]?.adults || 2));
    params.append('adult', String(currentSearchParams.rooms?.[0]?.adults || 2));
    params.append('fromTripPlanner', 'true');
    params.append('dayId', itemId.split('-')[1]);
    params.append('checkInDate', itemDate.toISOString());
    params.append('specificDayId', itemId);
    
    // Add package type parameter to inform HomePage which mode to operate in
    params.append('packageType', packageType);
    
    // Redirect to the home page with tour selection
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
    let newTotal = 0;
    setPlannerItems(prevItems => {
      const updatedItems = [...prevItems];
      updatedItems.forEach(item => {
        item.hotel = null;
      });
      hotels.forEach(hotel => {
        if (hotel.booking && typeof hotel.booking.totalPrice === 'number') {
          newTotal += hotel.booking.totalPrice;
        }
        if (hotel.specificDayId) {
          const specificDay = updatedItems.find(item => item.id === hotel.specificDayId);
          if (specificDay) {
            const hotelCheckIn = new Date(hotel.booking?.checkInDate);
            const hotelCheckOut = new Date(hotel.booking?.checkOutDate);
            updatedItems.forEach(item => {
              const itemDate = item.dateObj;
              if (itemDate >= hotelCheckIn && itemDate <= hotelCheckOut) {
                item.hotel = {
                  name: hotel.hotel?.hotelName || "Unknown Hotel",
                  details: hotel
                };
              }
            });
          }
        } else {
          const hotelCheckIn = new Date(hotel.booking?.checkInDate);
          const hotelCheckOut = new Date(hotel.booking?.checkOutDate);
          updatedItems.forEach(item => {
            const itemDate = item.dateObj;
            if (itemDate >= hotelCheckIn && itemDate <= hotelCheckOut) {
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
    setGrandTotal(newTotal);
    if (hotels.length > 0 && !selectedHotel) {
      setSelectedHotel(hotels[0]);
    }
  } else {
    setGrandTotal(0);
    setSelectedHotel(null);
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
        // Save the updated items to session storage to persist tours
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
      if (plannerItem.hotel?.details?.specificDayId) {
        return h.specificDayId === plannerItem.hotel.details.specificDayId;
      } else {
        const hCheckIn = new Date(h.booking?.checkInDate);
        const hCheckOut = new Date(h.booking?.checkOutDate);
        const itemDate = plannerItem.dateObj;
        return itemDate >= hCheckIn && itemDate < hCheckOut;
      }
    });
    
    if (hotelToRemove) {
      const updatedHotels = hotels.filter(h => h !== hotelToRemove);
      setHotels(updatedHotels);
      sessionStorage.setItem('tripPlannerHotels', JSON.stringify(updatedHotels));
      const updatedItems = [...plannerItems];
      if (hotelToRemove.specificDayId) {
        const specificDay = plannerItems.find(item => item.id === hotelToRemove.specificDayId);
        if (specificDay) {
          const specificDayIndex = plannerItems.findIndex(item => item.id === hotelToRemove.specificDayId);
          const nights = hotelToRemove.booking?.nights || currentSearchParams.nights || 1;
          for (let i = 0; i < nights && specificDayIndex + i < updatedItems.length; i++) {
            if (updatedItems[specificDayIndex + i].hotel?.details === hotelToRemove) {
              updatedItems[specificDayIndex + i].hotel = null;
            }
          }
        }
      } else {
        const hotelCheckIn = new Date(hotelToRemove.booking?.checkInDate);
        const hotelCheckOut = new Date(hotelToRemove.booking?.checkOutDate);
        updatedItems.forEach((item, index) => {
          const itemDate = item.dateObj;
          if (itemDate >= hotelCheckIn && itemDate < hotelCheckOut && item.hotel?.details === hotelToRemove) {
            updatedItems[index].hotel = null;
          }
        });
      }
      setPlannerItems(updatedItems);
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

// Only show hotel tab if packageType is hotel-land
const showHotelTab = packageType === 'hotel-land';
return (
    <Box className="trip-planner-page">
      <Container sx={{ paddingLeft: '0rem', paddingRight: '0rem', maxWidth: '100%' }}>
        <Box className="search-info heading">
          <Typography variant="h5" component="h1">
            {displayCity} | {displayNights} NIGHT/S | {displayCheckInDate} - {displayCheckOutDate}
          </Typography>
          <Button className="modify-search" onClick={() => setShowModifySearch(!showModifySearch)}>
            Modify search<ArrowDownIcon width="16" height="16" fill="#000" />
          </Button>
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

      {activeTab === 'hotel' && selectedHotel && showHotelTab && (
        <Grid className='item-container' item xs={14} md={8} sx={{marginLeft:'0.5rem',maxWidth:'100%',padding:'0.5rem'}}>
          <Grid container spacing={2} sx={{bgcolor:'white',padding:'0rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1))'}}>
            <Grid item xs={12} md={4} sx={{'& .MuiGrid-root':{maxWidth:'21%'}}}>
              {selectedHotel.hotel?.imageUrl ? (
                <img 
                  src={selectedHotel.hotel.imageUrl} 
                  alt={selectedHotel.hotel.hotelName} 
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
                {selectedHotel.hotel?.hotelName || "Hotel Name"}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'start', marginBottom:'1rem' }}>
                {Array(selectedHotel.hotel?.starRating || 0).fill(0).map((_, i) => (
                  <span key={i} style={{ color: '#FFD700', fontSize: '20px' }}>★</span>
                ))}
              </Box>
              <Grid container spacing={2} className="booking-details">
                <Grid item xs={12} sm={8} md={2} className="booking-column">
                  <Typography className="details-label">Check In: {new Date(selectedHotel.booking?.checkInDate).toLocaleDateString()}</Typography>
                  <Typography className="details-label">Check Out: {new Date(selectedHotel.booking?.checkOutDate).toLocaleDateString()}</Typography>
                  <Typography className="details-label">Nights: {selectedHotel.booking?.nights || currentSearchParams.nights || 1}</Typography>
                </Grid>
                
                <Grid item xs={12} sm={8} md={2} className="booking-column">
                  <Typography className="details-label">Room Type: {selectedHotel.booking?.roomType || "Deluxe Room"}</Typography>
                  <Typography className="details-label">Meal Plan: {selectedHotel.booking?.mealPlan || "BB"}</Typography>
                  <Typography className="details-label">Total Room(s): {selectedHotel.booking?.totalRooms || 1}</Typography>
                </Grid>
                
                <Grid item xs={12} sm={8} md={2} className="booking-column">
                  <Typography className="details-label">Adult(s): {selectedHotel.booking?.adults || 2}</Typography>
                  <Typography className="details-label">Child With Bed: {selectedHotel.booking?.cwb || 0}</Typography>
                  <Typography className="details-label">Child Without Bed: {selectedHotel.booking?.cnb || 0}</Typography>
                </Grid> 
                
                <Grid item xs={12} sm={8} md={2} className="booking-column">
                  <Typography className="details-label">Total Amount: USD {selectedHotel.booking?.totalPrice?.toFixed(2) || "0.00"}</Typography>
                  <Typography className="details-label">Status: {selectedHotel.booking?.status || 'Available (Payment Needed)'}</Typography>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      )}
      </Container>
    </Box>
  );
};

export default TripPlanner;
