import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './TripPlanner.scss';
import { Box, Container, Typography, Button, Grid, IconButton, Paper, Tabs, Tab, TextField } from '@mui/material';
import { ArrowDownIcon } from '../../../../icons/icons.tsx';
import Customize from '../Customize/Customize.tsx';
import { AddCircleOutline, DeleteOutline } from '@mui/icons-material';
import { PlannerItem, TripPlannerProps } from '../../../../types/types.ts';
import { TRIP_PLANNER } from '../../../../utils/ApiConstants.ts';
import TripDetails from '../TripDetails/TripDetails.tsx';
import ClientDetailsForm from '../../BookingSection/ClientForm/ClientDetailsForm.tsx';
import { useGetLeadByIdQuery, useSubmitLeadMutation, useUpdateLeadMutation } from '../../../../api/TourAPI.tsx';

const TripPlanner: React.FC<TripPlannerProps> = ({nights, checkInDate, checkOutDate, onCancel, onProceed}) => {
const location = useLocation();
const navigate = useNavigate();

const [updateLead] = useUpdateLeadMutation();
const getSearchParams = () => {
    if (location.state && Object.keys(location.state).length > 0) {
      sessionStorage.setItem('tripPlannerParams', JSON.stringify(location.state));
      return location.state;}
    const storedParams = sessionStorage.getItem('tripPlannerParams');
    if (storedParams) {
      return JSON.parse(storedParams);}
    return {
      checkInDate: checkInDate,
      checkOutDate: checkOutDate,
      nights: nights || 1, // Ensure nights has a default value
      city: '',
      packageType: 'hotel-land' // Default to hotel-land package
    };
};
const [isLoading,setIsLoading]= useState(false)
const [submitLead] = useSubmitLeadMutation();
const [currency, setCurrency] = useState('');
const searchParams = getSearchParams();
const [currentSearchParams, setCurrentSearchParams] = useState(searchParams);
const [hotels, setHotels] = useState<any[]>([]);
const [showModifySearch, setShowModifySearch] = useState(false);
const [activeTab, setActiveTab] = useState<'planner' | 'hotel'>('planner');
const [grandTotal, setGrandTotal] = useState(0);
const [marginTotal, setMarginTotal] = useState('0');
const [selectedHotel, setSelectedHotel] = useState<any>(null);
const packageType = currentSearchParams.packageType || 'hotel-land';
const [clientFormOpen, setClientFormOpen] = useState(false);
const [bookingRef,] = useState(`BK${Math.floor(Math.random() * 90000) + 10000}`);
const [showThankYou, setShowThankYou] = useState(false);
const [selectedHotels, setSelectedHotels] = useState<any[]>([]); // if using hotel selection
const [isEditMode, setIsEditMode] = useState(false);
const [originalLeadId, setOriginalLeadId] = useState<string | null>(null);
const [editingClientData, setEditingClientData] = useState<any>(null);
const [editLeadData, setEditLeadData] = useState(null);
const [, setNights] = useState(1);


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
      meals: null,
      eventDate:'',
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return items;
};

const [plannerItems, setPlannerItems] = useState<PlannerItem[]>(generateInitialPlannerItems());
const handleMarginChange = (event) => {
  const inputValue = event.target.value;
  // Allow empty string or valid numbers
  if (inputValue === '' || !isNaN(parseFloat(inputValue))) {
    setMarginTotal(inputValue);
  }
};

useEffect(() => {
    const searchParams = location.state || {};
    if (Object.keys(searchParams).length > 0) {
      sessionStorage.setItem('tripPlannerParams', JSON.stringify(searchParams));
      setCurrentSearchParams(searchParams); }
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
      }} catch (e) {
      console.error('Error parsing saved hotels', e);}}
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
  checkOutDate.setDate(checkOutDate.getDate() + 1);
  const tripCheckOutDate = new Date(currentSearchParams.checkOutDate);
  const isLastNight = checkOutDate.toDateString() === tripCheckOutDate.toDateString();
  const roomsData = currentSearchParams.rooms || [{ adults: 2, cwb: 0, cnb: 0, infants: 0 }];
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
    rooms: roomsData,
    Description: '',
  };
  if (isLastNight) {
    const extraDay = new Date(checkOutDate);
    const additionalSearchParams = {
      ...hotelSearchParams,
      checkInDate: extraDay.toISOString(),
      checkOutDate: new Date(extraDay.setDate(extraDay.getDate() + 1)).toISOString()};
  sessionStorage.setItem('lastNightHotelParams', JSON.stringify(additionalSearchParams));}
  sessionStorage.setItem('tripPlannerParams', JSON.stringify(currentSearchParams));
  sessionStorage.setItem('hotelSearchParams', JSON.stringify(hotelSearchParams));
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
      if (hotelDetails.booking?.checkInDate) {
        hotelDetails.booking.checkInDate = new Date(hotelDetails.booking.checkInDate).toISOString();
      }
      if (hotelDetails.booking?.checkOutDate) {
        hotelDetails.booking.checkOutDate = new Date(hotelDetails.booking.checkOutDate).toISOString();
      }
      if (!hotelDetails.uniqueId) {
        hotelDetails.uniqueId = `hotel-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      }
      setHotels(prevHotels => {
        const existingHotels = [...prevHotels];
        if (hotelDetails.specificDayId) {
          const specificDayItem = plannerItems.find(item => item.id === hotelDetails.specificDayId);
          if (specificDayItem) {
            hotelDetails.booking.checkInDate = new Date(specificDayItem.dateObj).toISOString();
            const checkInDate = new Date(specificDayItem.dateObj);
            const checkOutDate = new Date(checkInDate);
            checkOutDate.setDate(checkOutDate.getDate() + 1); // Just one night
            hotelDetails.booking.checkOutDate = checkOutDate.toISOString();
            hotelDetails.booking.nights = 1;
            const existingHotelForDay = existingHotels.findIndex(existingHotel => 
              existingHotel.specificDayId === hotelDetails.specificDayId
            );
            if (existingHotelForDay !== -1) {
              existingHotels[existingHotelForDay] = hotelDetails;
            } else {
              existingHotels.push(hotelDetails);
            }
          } else {
            existingHotels.push(hotelDetails);
          }
        } else {
          existingHotels.push(hotelDetails);
        }
        sessionStorage.setItem('tripPlannerHotels', JSON.stringify(existingHotels));
        return existingHotels;
      });
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    } catch (e) {
      console.error('Error parsing hotel data from URL', e);
    }
  }
}, [plannerItems, currentSearchParams.nights]);

useEffect(() => {
  if (hotels.length > 0) {
    const hotelCurrency = hotels[0]?.booking?.currency || 'USD';
    setCurrency(hotelCurrency);
    console.log("Processing hotels for calendar:", hotels);
    
    setPlannerItems(prevItems => {
      const updatedItems = [...prevItems];
      updatedItems.forEach(item => {
        item.hotel = null;
      });
      hotels.forEach(hotel => {
        if (hotel.specificDayId) {
          const dayIndex = updatedItems.findIndex(item => item.id === hotel.specificDayId);
          if (dayIndex !== -1) {
            updatedItems[dayIndex].hotel = {
              name: hotel.hotel?.hotelName || "Unknown Hotel",
              details: hotel,
              hotelSpecificDetails: hotel.hotelSpecificDetails || {}
            };
          }
        }
        else if (hotel.booking?.checkInDate && hotel.booking?.checkOutDate) {
          const hotelCheckIn = new Date(hotel.booking.checkInDate);
          const hotelCheckOut = new Date(hotel.booking.checkOutDate);
          hotelCheckIn.setHours(0, 0, 0, 0);
          hotelCheckOut.setHours(0, 0, 0, 0);
          updatedItems.forEach((item, index) => {
            const itemDate = new Date(item.dateObj);
            itemDate.setHours(0, 0, 0, 0);
            if (itemDate >= hotelCheckIn && itemDate < hotelCheckOut) {
              updatedItems[index].hotel = {
                name: hotel.hotel?.hotelName || "Unknown Hotel",
                details: hotel,
                hotelSpecificDetails: hotel.hotelSpecificDetails || {}
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
      window.history.replaceState({}, document.title, newUrl);} catch (e) {
      console.error('Error parsing tour data from URL', e);} }
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
  let selectedCity = currentSearchParams.city;
  let selectedCountry = currentSearchParams.country || 'Azerbaijan';
  if (packageType === 'hotel-land' && hotels.length > 0 && hotels[0].hotel?.area) {
    selectedArea = hotels[0].hotel.area;
  } else {
    const storedParams = sessionStorage.getItem('selectedHotelArea');
    if (storedParams) {
      selectedArea = storedParams;
    }
  }

  if (itemType === 'hotel') {
    const checkoutDate = new Date(itemDate);
    checkoutDate.setDate(checkoutDate.getDate() + 1);
    const tripEndDate = new Date(currentSearchParams.checkOutDate);
    const isLastDay = checkoutDate.getTime() >= tripEndDate.getTime();
    navigate('/trip-planner-area', {
      state: {
        ...currentSearchParams,
        dayId: itemId.split('-')[1],
        fromTripPlanner: true,
        checkInDate: itemDate.toISOString(),
        checkOutDate: checkoutDate.toISOString(),
        nights: 1,
        specificDay: false,
        specificDayId: itemId,
        applyToAllDays: false,
        isLastDay: isLastDay,
        city: selectedCity,
        country: selectedCountry
      }
    });
  } else if (itemType === 'tours') {
    const { totalPax, adults, infants } = calculatePassengersBreakdown(currentSearchParams.rooms);

    const params = new URLSearchParams();
    params.append('city', selectedCity);
    params.append('country', selectedCountry);
    params.append('pax', String(totalPax));
    params.append('adult', String(adults));
    params.append('infant', String(infants));
    params.append('fromTripPlanner', 'true');
    params.append('dayId', itemId.split('-')[1]);
    params.append('checkInDate', itemDate.toISOString());
    params.append('specificDayId', itemId);
    params.append('packageType', packageType);
    if (currentSearchParams.rooms && currentSearchParams.rooms.length > 0) {
      params.append('rooms', encodeURIComponent(JSON.stringify(currentSearchParams.rooms)));
    }
    window.location.href = `${TRIP_PLANNER}${params.toString()}`;
    
  } else {
    navigate(`/${itemType}-summary`, {
      state: {...currentSearchParams,
        dayId: itemId.split('-')[1],
        fromTripPlanner: true,
        checkInDate: itemDate.toISOString(),
        city: selectedCity,
        country: selectedCountry}
    });
  }
};

const calculatePassengersBreakdown = (rooms) => {
  if (!rooms || !Array.isArray(rooms)) {
    return { totalPax: 2, adults: 2, infants: 0};}
  let adults = 0;
  let infants = 0;
  rooms.forEach(room => {
    adults += room.adults +room.cwb +room.cnb;
    infants += room.infant || 0;});
  const totalPax = adults + infants;
  return {totalPax,adults,infants};};


useEffect(() => {
  if (hotels.length > 0) {
    setPlannerItems(prevItems => {
      const updatedItems = JSON.parse(JSON.stringify(prevItems));
      const totalDays = updatedItems.length;
      updatedItems.forEach(item => {
        item.hotel = null;
      });
      hotels.forEach(hotel => {
        if (hotel.specificDayId) {
          const dayIndex = updatedItems.findIndex(item => item.id === hotel.specificDayId);
          if (dayIndex !== -1) {
            const dayNumber = parseInt(hotel.specificDayId.split('-')[1]);
            updatedItems[dayIndex].hotel = {
              name: hotel.hotel?.hotelName || "Unknown Hotel",
              details: hotel
            };
            if (dayIndex === totalDays - 2) {
              const lastDayIndex = totalDays - 1;
              updatedItems[lastDayIndex].hotel = {
                name: hotel.hotel?.hotelName || "Unknown Hotel",
                details: hotel
              };
            }
          }
        }
        else if (hotel.booking?.checkInDate && hotel.booking?.checkOutDate) {
          const checkInDate = new Date(hotel.booking.checkInDate);
          const checkOutDate = new Date(hotel.booking.checkOutDate);
          checkInDate.setHours(0, 0, 0, 0);
          checkOutDate.setHours(0, 0, 0, 0);
          const checkInDayIndex = updatedItems.findIndex(item => {
            const itemDate = new Date(item.dateObj);
            itemDate.setHours(0, 0, 0, 0);
            return itemDate.getTime() === checkInDate.getTime();
          });
          const checkOutDayIndex = updatedItems.findIndex(item => {
            const itemDate = new Date(item.dateObj);
            itemDate.setHours(0, 0, 0, 0);
            return itemDate.getTime() === checkOutDate.getTime();
          });
          if (checkInDayIndex !== -1) {
            const numNights = checkOutDayIndex - checkInDayIndex;
            const isFullItinerary = checkInDayIndex === 0 && checkOutDayIndex === totalDays - 1;
            const isLastDayCheckout = checkOutDayIndex === totalDays - 1;
            const isFirstDayCheckIn = checkInDayIndex === 0;
            const isTwoNightStay = numNights === 2;
            const isOneNightStay = numNights === 1;
            const hasMoreDatesAfterwards = checkOutDayIndex < totalDays - 1;
            let startShowIndex = checkInDayIndex;
            let endShowIndex = checkOutDayIndex;
            // Case 1: Full itinerary booking - show on all days
            if (isFullItinerary) {
              endShowIndex = totalDays - 1; // Show on all days
            }
            else if (isLastDayCheckout) {
              // endShowIndex is already set to checkOutDayIndex
            }
            else if (isTwoNightStay) {
              endShowIndex = checkInDayIndex + 1;
            }
            else if (isOneNightStay && hasMoreDatesAfterwards) {
              endShowIndex = checkInDayIndex;
            }
            else {
              endShowIndex = checkOutDayIndex - 1;
            }
            // Apply the hotel to all relevant days
            for (let i = startShowIndex; i <= endShowIndex; i++) {
              updatedItems[i].hotel = {
                name: hotel.hotel?.hotelName || "Unknown Hotel",
                details: hotel
              };
            }
          }
        }
      });
      return updatedItems;
    });
  }
}, [hotels]);

useEffect(() => {
  const savedItems = sessionStorage.getItem('tripPlannerItems');
  if (savedItems) {
    try {
      const parsedItems = JSON.parse(savedItems);
      if (parsedItems && Array.isArray(parsedItems) && parsedItems.length > 0) {
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
                }; } }});
          return updatedItems;}); }
    } catch (e) {
      console.error('Error parsing saved planner items', e); } }
}, []);

useEffect(() => {
  let total = 0;
  const processedHotels = new Map();
  hotels.forEach(hotel => {
    const hotelKey = hotel.specificDayId ||`${hotel.hotel?.hotelId}-${hotel.booking?.checkInDate}-${hotel.booking?.checkOutDate}`;
    if (!processedHotels.has(hotelKey)) {
      processedHotels.set(hotelKey, true);
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


const handleRemoveHotel = (plannerItem: PlannerItem) => {
  if (!plannerItem.hotel || !plannerItem.hotel.details) return;
  const hotelUniqueId = plannerItem.hotel.details.uniqueId;
  const hotelDetails = plannerItem.hotel.details;
  const totalHotelPrice = hotelDetails.booking?.totalPrice || 0;
  const daysWithSameHotel = plannerItems.filter(item => 
    item.hotel?.details?.uniqueId === hotelUniqueId
  );
  const isMultiDayBooking = daysWithSameHotel.length > 1;
  const newPlannerItems = plannerItems.map(item => {
    if (item.hotel?.details?.uniqueId === hotelUniqueId) {
      return {
        ...item,
        hotel: null
      };
    }
    return item;
  });
  
  setPlannerItems(newPlannerItems);
  sessionStorage.setItem('tripPlannerItems', JSON.stringify(newPlannerItems));
  const updatedHotels = hotels.filter(hotel => hotel.uniqueId !== hotelUniqueId);
  setHotels(updatedHotels);
  sessionStorage.setItem('tripPlannerHotels', JSON.stringify(updatedHotels));
  const updatedGrandTotal = updatedHotels.reduce((sum, hotel) => {
    return sum + (hotel.booking?.totalPrice || 0);
  }, 0) + newPlannerItems.reduce((sum, item) => {
    return sum + (item.tours?.details?.booking?.totalPrice || 0);
  }, 0);
  
  setGrandTotal(updatedGrandTotal);
  if (selectedHotel?.uniqueId === hotelUniqueId) {
    setSelectedHotel(updatedHotels.length > 0 ? updatedHotels[0] : null);
  }
};

const handleRemoveTour = (plannerItem) => {
  if (!plannerItem.tours) return;
  const priceToSubtract = plannerItem.tours.details?.booking?.totalPrice || 0;
  setPlannerItems(prevItems => {
    const updatedItems = [...prevItems];
    const index = updatedItems.findIndex(item => item.id === plannerItem.id);
    if (index !== -1) {
      updatedItems[index] = {
        ...updatedItems[index],
        tours: null
      };
      sessionStorage.setItem('tripPlannerItems', JSON.stringify(updatedItems));
    }
    return updatedItems;
  });
  if (priceToSubtract > 0) {
    setGrandTotal(prev => prev - priceToSubtract);
  }
};
const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        if (dateString.includes('-')) {
          const [day, rest] = dateString.split('-');
          return `${day}-${rest.split(' ')[0]}`;}
        return dateString; }
      return date.toLocaleDateString('en-US', {day: '2-digit', month: 'short'});
    } catch (e) {
      return dateString;}
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
const displayCheckInDate = formatHeaderDate(currentSearchParams?.checkInDate) ;
const displayCheckOutDate = formatHeaderDate(currentSearchParams?.checkOutDate);
const displayNights = currentSearchParams?.nights || nights || '1';
const displayCity = currentSearchParams?.city || '';
const handleSearchComplete = (updatedParams: any) => {
    if (updatedParams) { 
      setCurrentSearchParams(updatedParams);
      sessionStorage.setItem('tripPlannerParams', JSON.stringify(updatedParams));
      sessionStorage.removeItem('tripPlannerItems');
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
useEffect(() => {
  const storedClientData = sessionStorage.getItem('editingClientData'); // Fix: add the key
  if (storedClientData) {
    try {
      const clientData = JSON.parse(storedClientData);
      console.log('Loaded editing client data:', clientData);
      setEditingClientData(clientData);
      setOriginalLeadId(clientData.originalLeadId || clientData.id || clientData._id);
    } catch (error) {
      console.error('Error parsing editing client data:', error);
    }
  }
}, []);

useEffect(() => {
  const storedEditData = sessionStorage.getItem('editLeadData');
  if (storedEditData) {
    try {
      const parsedData = JSON.parse(storedEditData);
      console.log("🔍 Loading edit data:", parsedData);
      
      if (parsedData.isEditMode) {
        setIsEditMode(true);
        setEditLeadData(parsedData);
        
        if (parsedData.currentSearchParams) {
          setCurrentSearchParams(parsedData.currentSearchParams);
          setNights(parsedData.currentSearchParams.nights || 1);
        }
        
        if (parsedData.currency) {
          setCurrency(parsedData.currency);
        }
        
        if (parsedData.hotelDetails && Array.isArray(parsedData.hotelDetails) && parsedData.hotelDetails.length > 0) {
          const formattedHotels = parsedData.hotelDetails.map((hotel, index) => {
            console.log(`Processing hotel ${index}:`, hotel);
            
            return {
              id: hotel.id || `hotel_${index}`,
              hotel: {
                hotelName: hotel.hotel?.hotelName || hotel.hotelName || 'Unknown Hotel',
                name: hotel.hotel?.name || hotel.hotelName || 'Unknown Hotel',
                description: hotel.hotel?.description || hotel.description || 'No description available',
                starRating: hotel.hotel?.starRating || hotel.starRating || 'No Rating',
                starRatings: hotel.hotel?.starRatings || hotel.starRating || 'No Rating',
                city: hotel.hotel?.city || hotel.city || parsedData.currentSearchParams?.city || 'Unknown City',
                roomsOccupancyDetails: hotel.hotel?.roomsOccupancyDetails || hotel.roomOccupancy || []
              },
              booking: {
                roomType: hotel.booking?.roomType || hotel.roomType || 'Standard',
                mealPlan: hotel.booking?.mealPlan || hotel.mealPlan || 'None',
                checkInDate: hotel.booking?.checkInDate || hotel.checkInDate || parsedData.currentSearchParams?.checkInDate,
                checkOutDate: hotel.booking?.checkOutDate || hotel.checkOutDate || parsedData.currentSearchParams?.checkOutDate,
                nights: hotel.booking?.nights || hotel.nights || parsedData.currentSearchParams?.nights || 1,
                totalPrice: parseFloat(hotel.booking?.totalPrice || hotel.totalPrice || 0),
                currency: hotel.booking?.currency || hotel.currency || parsedData.currency || 'USD',
                totalRooms: hotel.booking?.totalRooms || hotel.totalRooms || 1
              },
              room: {
                roomCategory: hotel.room?.roomCategory || hotel.booking?.roomType || hotel.roomType || 'Standard',
                mealPlan: hotel.room?.mealPlan || hotel.booking?.mealPlan || hotel.mealPlan || 'None'
              },
              city: hotel.city || hotel.hotel?.city || parsedData.currentSearchParams?.city || 'Unknown City'
            };
          });
          
          console.log("✅ Formatted hotels:", formattedHotels);
          setHotels(formattedHotels);
          
          setTimeout(() => {
            console.log("🔄 Re-triggering hotel state update");
            setHotels(prev => [...formattedHotels]);
          }, 100);
        }
        
        // Load planner items with better structure
        if (parsedData.plannerItems && Array.isArray(parsedData.plannerItems) && parsedData.plannerItems.length > 0) {
          const formattedPlannerItems = parsedData.plannerItems.map((item, index) => {
            console.log(`Processing planner item ${index}:`, item);
            
            const formattedItem = {
              id: item.id || `planner_${index}`,
              date: item.date || 'N/A',
              dateObj: item.dateObj || item.date, // Ensure dateObj is available
              tours: item.tours ? {
                id: item.tours.id || `tour_${index}`,
                name: item.tours.name || 'Tour Activity',
                description: item.tours.description || 'No description available',
                duration: item.tours.duration || item.tours.eventDuration || 'N/A',
                currency: item.tours.currency || parsedData.currency || 'USD',
                price: parseFloat(item.tours.price || 0),
                city: item.tours.city || parsedData.currentSearchParams?.city || 'Unknown City',
                eventDuration: item.tours.eventDuration || item.tours.duration || 'N/A',
                activities: Array.isArray(item.tours.activities) ? item.tours.activities : [],
                details: item.tours.details || {
                  tour: {
                    tourName: item.tours.name || 'Tour Activity',
                    description: item.tours.description || 'No description available',
                    duration: item.tours.duration || item.tours.eventDuration || 'N/A'
                  },
                  booking: {
                    selectedActivities: item.tours.activities && Array.isArray(item.tours.activities) ? 
                      Object.fromEntries(item.tours.activities.map(activity => [activity.name || 'activity', true])) : {},
                    activityDetails: Array.isArray(item.tours.activities) ? item.tours.activities : []
                  }
                }
              } : null,
              transfer: item.transfer ? {
                ...item.transfer,
                city: item.transfer.city || parsedData.currentSearchParams?.city || 'Unknown City',
                description: item.transfer.description || 'No description available',
                price: parseFloat(item.transfer.price || 0)
              } : null,
              meals: item.meals ? {
                ...item.meals,
                city: item.meals.city || parsedData.currentSearchParams?.city || 'Unknown City',
                description: item.meals.description || 'No description available',
                price: parseFloat(item.meals.price || 0)
              } : null,
              hotel: item.hotel || null // Ensure hotel data is preserved
            };
            
            return formattedItem;
          });
          
          console.log("✅ Formatted planner items:", formattedPlannerItems);
          setPlannerItems(formattedPlannerItems);
          
          setTimeout(() => {
            console.log("🔄 Re-triggering planner items state update");
            setPlannerItems(prev => [...formattedPlannerItems]);
          }, 100);
        }
        
        if (parsedData.totalAmount) {
          console.log("✅ Total amount loaded:", parsedData.totalAmount);
          setTimeout(() => {
            console.log("🔄 Re-calculating totals");
          }, 200);
        }
        
        console.log("✅ Edit mode activated with complete data");
      }
    } catch (error) {
      console.error("❌ Error parsing edit data:", error);
      sessionStorage.removeItem('editLeadData');
    }
  }
}, []);

const handleClientFormSubmit = (clientData) => {
  setClientFormOpen(false);
  setShowThankYou(true);

  const calculateTotalPersons = () => {
    if (!currentSearchParams?.rooms || !Array.isArray(currentSearchParams.rooms)) {
      return 2;
    }
    return currentSearchParams.rooms.reduce((total, room) => {
      const adults = room.adults || 0;
      const cwb = room.cwb || 0;
      const cnb = room.cnb || 0;
      const infants = room.infants || 0;
      return total + adults + cwb + cnb + infants;
    }, 0);
  };
  const totalPersons = calculateTotalPersons();
  const finalBookingRef = isEditMode ? (originalLeadId || editingClientData?.id || editingClientData?._id) : bookingRef;
  const selectedCity = currentSearchParams.city;
  const newLead = {
    id: finalBookingRef,
    bookingNo: finalBookingRef,
    clientName: clientData.name,
    options: clientData.options,
    pendingAmount:grandTotal + (parseFloat(marginTotal) || 0),
    creationDate: isEditMode ? (editingClientData?.creationDate || new Date().toISOString()) : new Date().toISOString(),
    bookingTime: isEditMode ? (editingClientData?.bookingTime || new Date().toISOString()) : new Date().toISOString(),
    ...(isEditMode && {
      lastUpdated: new Date().toISOString()}),
    status: 'Confirm',
    destinations: selectedCity,
    travelDate: currentSearchParams.checkInDate,
    nights: currentSearchParams.nights || nights || 1,
    totalAmount: grandTotal + (parseFloat(marginTotal) || 0),
    isUpdate: isEditMode,
    paidAmount:0,
    referenceId: finalBookingRef,
    bookingStatus: 'confirmed',
    type: clientData.type,
    invoice: `/invoices/${finalBookingRef}`,
    voucher: `/vouchers/${finalBookingRef}`,
    totalPersons: totalPersons,
    
    searchParams: {
      checkInDate: currentSearchParams.checkInDate,
      checkOutDate: currentSearchParams.checkOutDate,
      nights: currentSearchParams.nights || nights,
      city: currentSearchParams.city,
      country: currentSearchParams.country,
      rooms: currentSearchParams.rooms || [{ adults: 2 }]
    },
    
    clientDetails: {
      ...clientData,
      generateDate: new Date().toLocaleDateString()
    },
    
    hotelDetails: hotels.map(hotel => ({
      hotelName: hotel.hotel?.hotelName || hotel.hotel?.name || 'Unknown Hotel',
      roomType: hotel.booking?.roomType || hotel.room?.roomCategory || 'Standard',
      mealPlan: hotel.booking?.mealPlan || hotel.room?.mealPlan || 'None',
      checkInDate: hotel.booking?.checkInDate,
      checkOutDate: hotel.booking?.checkOutDate,
      nights: hotel.booking?.nights || 1,
      totalPrice: hotel.booking?.totalPrice || 0,
      currency: hotel.booking?.currency || currency || 'USD',
      starRating: hotel.hotel?.starRating || hotel.hotel?.starRatings || 'No',
      city: hotel.city || hotel.hotel?.city || currentSearchParams.city || 'Unknown City',
      description: hotel.hotel?.description || 'No description available',
      totalRooms: hotel.booking?.totalRooms || 1,
      roomOccupancy: hotel.hotel?.roomsOccupancyDetails,
      completeHotelData: {
        ...hotel.hotel,
        hotelName: hotel.hotel?.hotelName || hotel.hotel?.name,
        description: hotel.hotel?.description,
        starRating: hotel.hotel?.starRating || hotel.hotel?.starRatings || 'No'
      },
      completeBookingData: {
        ...hotel.booking,
        roomType: hotel.booking?.roomType || hotel.room?.roomCategory,
        mealPlan: hotel.booking?.mealPlan || hotel.room?.mealPlan,
        totalRooms: hotel.booking?.totalRooms || 1
      },
      completeRoomData: hotel.room || {}
    })),
    plannerItems: plannerItems.map(item => {
      let toursData: any = null;
      let processedActivityDetails: any[] = [];
      
      if (item.tours) {
        const selectedActivities = item.tours.details?.booking?.selectedActivities || {};
        const activityDetails = item.tours.details?.booking?.activityDetails || [];
        processedActivityDetails = activityDetails.length > 0 
          ? activityDetails 
          : Object.keys(selectedActivities)
              .filter(activityName => selectedActivities[activityName] === true)
              .map(activityName => ({
                name: activityName,
                price: item.tours.details?.activityPrices?.[activityName] || 0,
                currency: item.tours.currency || currency || 'USD'
              }));
        
        toursData = {
          name: item.tours.name || item.tours.details?.tour?.tourName || 'Tour Activity',
          description: item.tours.description || item.tours.details?.tour?.description || 'No description available',
          duration: item.tours.details?.tour?.duration || item.tours.eventDuration || 'Duration not specified',
          currency: item.tours.currency || currency || 'USD',
          price: item.tours.price || 0,
          city: item.tours.city || currentSearchParams.city || 'Unknown City',
          activities: processedActivityDetails,
          completeToursData: {
            ...item.tours,
            name: item.tours.name || item.tours.details?.tour?.tourName || 'Tour Activity',
            details: {
              ...(item.tours.details || {}),
              tour: {
                ...(item.tours.details?.tour || {}),
                description: item.tours.details?.tour?.description || item.tours.description || 'N/A',
                duration: item.tours.details?.tour?.duration || item.tours.eventDuration || 'N/A',
              },
              booking: {
                ...(item.tours.details?.booking || {}),
                selectedActivities,
                activityDetails: processedActivityDetails
              }
            },
            activities: processedActivityDetails
          }
        };
      }
    
      return {
        date: item.date || 'N/A',
        tours: toursData,
        transfer: item.transfer ? {
          ...item.transfer,
          city: item.transfer.city || currentSearchParams.city || 'Unknown City',
          description: item.transfer.description || 'No description available',
        } : null,
        meals: item.meals ? {
          ...item.meals,
          city: item.meals.city || currentSearchParams.city || 'Unknown City',
          description: item.meals.description || 'No description available',
        } : null,
        completeItemData: {
          ...item,
          tours: item.tours ? {
            ...item.tours,
            name: item.tours.name || item.tours.details?.tour?.tourName || 'Tour Activity',
            details: {
              ...(item.tours.details || {}),
              tour: {
                ...(item.tours.details?.tour || {}),
                description: item.tours.details?.tour?.description || item.tours.description || 'N/A',
                duration: item.tours.details?.tour?.duration || item.tours.eventDuration || 'N/A',
              },
              booking: {
                ...(item.tours.details?.booking || {}),
                selectedActivities: item.tours.details?.booking?.selectedActivities || {},
                activityDetails: processedActivityDetails
              }
            },
            activities: processedActivityDetails
          } : null,
          transfer: item.transfer || null,
          meals: item.meals || null
        }
      };
    }),
    costs: {
      finalAmount: grandTotal + (parseFloat(marginTotal) || 0),
      packageDetails: { totalPersons: totalPersons },
      grandTotal: grandTotal,
      marginTotal: parseFloat(marginTotal) || 0
    },
    
    currency: currency || 'USD'
  };

  try {
    if (isEditMode) {
      console.log("🔄 Updating lead...");
      updateLead({ id: finalBookingRef, lead: newLead }).unwrap()
        .then(() => {
          console.log('Successfully updated lead with hotel and activity details');
          alert('Lead updated successfully!');
          sessionStorage.removeItem('editLeadData');
          sessionStorage.removeItem('editingClientData');
          window.open(`/tour-package-pdf?bookingRef=${finalBookingRef}`, '_blank');
        })
        .catch(error => {
          console.error('Error updating lead:', error);
          alert('Failed to update lead.');
          window.open(`/tour-package-pdf?bookingRef=${finalBookingRef}`, '_blank');
        });
    } else {
      console.log("➕ Creating new lead...");
      submitLead(newLead).unwrap()
        .then(() => {
          console.log('Successfully created lead with hotel and activity details');
          alert('Lead created successfully!');
          window.open(`/tour-package-pdf?bookingRef=${finalBookingRef}`, '_blank');
        })
        .catch(error => {
          console.error('Error submitting lead:', error);
          alert('Failed to submit lead.');
        });
    }
  } catch (err) {
    console.error('Error in submitting lead:', err);
    alert(isEditMode ? 'Failed to update lead.' : 'Failed to submit lead.');
  }
};
const handleDownloadPDF = () => {
  setClientFormOpen(true);
};

const showHotelTab = packageType === 'hotel-land';
return (
    <Box className="trip-planner-page">
      <Container sx={{ paddingLeft: '0rem', paddingRight: '0rem', maxWidth: '100%' }}>
        {!showThankYou && (
          <>
            <Box className="search-info heading">
              <Typography variant="h5" component="h1">
                {displayCity} | {displayNights} NIGHT/S | {displayCheckInDate} - {displayCheckOutDate}
              </Typography>
              <Button className="modify-search" onClick={() => setShowModifySearch(!showModifySearch)}> Modify search<ArrowDownIcon width="16" height="16" fill="#000" /></Button>
            </Box>
            {showModifySearch && (
              <div className="modify-search-container">
                <Customize isModifying={true} initialValues={currentSearchParams} onSearchComplete={handleSearchComplete} />
              </div>
            )}
            <Box sx={{ mb: 0 ,height:'2rem'}} className='tablist-container'>
              <Tabs className='tablist-btn'  value={activeTab} onChange={handleTabChange} sx={{ color: 'black' }}>
                <Tab className='planner-btn' value="planner" label="Planner" style={{ color: activeTab === 'planner' ? 'white' : 'black', }} sx={{ color: activeTab === 'planner' ? 'black' : 'white', 
                  bgcolor: activeTab === 'planner' ? 'grey' : 'white', marginLeft: '0rem', width: '10rem' }} />
                {showHotelTab && (
                  <Tab className='hotel-btn' value="hotel" label="Hotel Details" style={{ color: activeTab === 'planner' ? 'black' : 'white', }} sx={{ color: activeTab === 'planner' ? 'black' : 'white', 
                    bgcolor: activeTab === 'planner' ? 'white' : 'grey', marginLeft: '0.5rem', width: '10rem' }} />
                )}
              </Tabs>
            </Box>
          </>
        )}
        
        {activeTab === 'planner' && !showThankYou && (
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
                <Box key={plannerItem.id} className="table-row ">
                  <Box className="cell date-cell">
                    <Typography className='date-cell-1' variant="body2">{formatDate(plannerItem.date)}</Typography>
                    <Typography className='date-cell-2' variant="body2">{formatYear(plannerItem.date)}</Typography>
                  </Box>
                  {/* Show hotel cell only for hotel-land package */}
                  {packageType === 'hotel-land' && (
                    <Box className="cell">
                      {plannerItem.hotel ? (
                        <Box className="selected-hotel">
                          <Box sx={{}}>
                            <Typography className='hotel_name' variant="body2" sx={{ fontSize: '0.8rem', textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap', overflow: 'hidden', textAlign: 'center', maxWidth: '100%', }}>
                              {plannerItem.hotel.name}
                            </Typography>
                          </Box>
                          <Box>
                            <IconButton sx={{ position: 'absolute', right: 0 }} className="remove-button"
                              onClick={() => handleRemoveHotel(plannerItem)} aria-label="Remove hotel" size="small" >
                              <DeleteOutline sx={{ color: '#777777', fontSize: '1rem' }} />
                            </IconButton>
                          </Box>
                        </Box>
                      ) : (
                        <Box display="flex" justifyContent="flex-end">
                          <IconButton className="add-button" onClick={() => handleHotelSelection(plannerItem.id)} sx={{ color: '#777777', fontSize: '1rem', '& .MuiSvgIcon-root': { fill: 'grey' }, }}>
                            <AddCircleOutline  className='add-btn'/>
                          </IconButton>
                        </Box>
                      )}
                    </Box>
                  )}
                  <Box className="cell">
                    <Box display="flex" justifyContent="flex-end">
                      <IconButton className="add-button" onClick={() => handleAddItem(plannerItem.id, 'transfer')} aria-label="Add transfer" sx={{ color: '#777777', "& .MuiSvgIcon-root": { fill: 'grey' } }}>
                        <AddCircleOutline className='add-btn'/>
                      </IconButton>
                    </Box>
                  </Box>
                  <Box className="cell">
                    {plannerItem.tours ? (
                      <Box className="selected-tour">
                        <Box className='tour-container'>
                          <Typography variant="body2" sx={{ fontSize: '0.8rem', textOverflow: 'ellipsis', textAlign: 'center', maxWidth: '100%' }} >
                            {plannerItem.tours.name}
                          </Typography>
                        </Box>
                        <Box>
                          <IconButton sx={{ position: 'absolute', right: 0 }} className="remove-button" onClick={() => handleRemoveTour(plannerItem)} aria-label="Remove tour" size="small" >
                            <DeleteOutline sx={{ color: '#777777', fontSize: '1rem' }} />
                          </IconButton>
                        </Box>
                      </Box>
                    ) : (
                      <Box display="flex" justifyContent="flex-end">
                        <IconButton className="add-button"
                          onClick={() => handleAddItem(plannerItem.id, 'tours')}
                          aria-label="Add tours" sx={{ color: '#777777', fontSize: '1rem', "& .MuiSvgIcon-root": { fill: 'grey' } }}>
                          <AddCircleOutline className='add-btn' />
                        </IconButton>
                      </Box>
                    )}
                  </Box>
                  <Box className="cell">
                    <Box display="flex" justifyContent="flex-end">
                      <IconButton className="add-button" onClick={() => handleAddItem(plannerItem.id, 'meals')} aria-label="Add meals" sx={{ color: '#777777', "& .MuiSvgIcon-root": { fill: 'grey' } }} >
                        <AddCircleOutline className='add-btn' />
                      </IconButton>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
            <Box className="total-section" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
              <Box className="total-row">
                <Typography className="label">Net Total:</Typography>
                <Typography className="value">{currency} {grandTotal.toFixed(2)}</Typography>
              </Box>
              <Box className="total-row">
                <Typography className="label">Add Margin:</Typography>
                <Box className="value" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {currency}
                  <TextField type="number" value={marginTotal} onChange={handleMarginChange} size="small" sx={{ width: '4rem', height: '2rem' }} />
                </Box>
              </Box>
              <Box className="total-row">
                <Typography className="label">Final Amt:</Typography>
                <Typography className="value">{currency} {(grandTotal + (parseFloat(marginTotal) || 0)).toFixed(2)}</Typography>
              </Box>
            </Box>
            <Box className="action-buttons">
              <Button variant="contained" color="error" className="proceed-button" onClick={handleDownloadPDF}> Download Now </Button>
              <Button variant="contained" className="cancel-button" onClick={onCancel}>Cancel </Button>
            </Box>
          </Paper>
        )}
        
        {activeTab === 'hotel' && showHotelTab && !showThankYou && (
          <Paper elevation={3} className="hotel-details-container" sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
            <TripDetails hotels={hotels} totalPrice={undefined} />
          </Paper>
        )}
        
        {showThankYou && (
          <Paper elevation={3} className="thank-you-container" sx={{ padding: '2rem', margin: '2rem 0', textAlign: 'center', bgcolor: '#f8f8f8', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
            <Typography variant="h4" sx={{ color: '#4CAF50', marginBottom: '1rem' }}>
              Thank You!
            </Typography>
            <Typography variant="body1" sx={{ marginBottom: '1rem' ,fontSize:'1.3rem' }}>
              Your PDF is being generated in a new tab.
            </Typography>
          </Paper>
        )}
      </Container>
      
    
      {clientFormOpen && (

        <ClientDetailsForm
        open={clientFormOpen}
        onClose={() => setClientFormOpen(false)}
        onSubmit={handleClientFormSubmit}
        bookingRef={bookingRef}
        destinations={currentSearchParams?.city}
        nights={currentSearchParams?.nights?.toString() || displayNights.toString()}
        travelDate={currentSearchParams?.checkInDate}
        grandTotal={grandTotal + (parseFloat(marginTotal) || 0)}
        marginTotal={marginTotal}
        isEditMode={isEditMode}
        initialClientData={editingClientData}
        originalLeadId={originalLeadId || editingClientData?.id || editingClientData?._id} 
        hotelName={''} currency={0} currentSearchParams={''} 
        hotels={''} plannerItems={''} hotelDetails={[]} tourActivities={[]} 
        activities={[]} persons={''}/>)}
    </Box>
  );
};
export default TripPlanner;