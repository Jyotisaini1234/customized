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

const TripPlanner: React.FC<TripPlannerProps> = ({ nights, checkInDate, checkOutDate, onCancel, onProceed }) => {
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

  const [totalHotelPrice, setTotalHotelPrice] = useState(0);
  const [currency, setCurrency] = useState('');
  const searchParams = getSearchParams();
  const [currentSearchParams, setCurrentSearchParams] = useState(searchParams);
  const [hotels, setHotels] = useState<any[]>([]);
  const [showModifySearch, setShowModifySearch] = useState(false);
  const [activeTab, setActiveTab] = useState<'planner' | 'hotel'>('planner');
  // const [grandTotal, setGrandTotal] = useState(0);
  const [marginTotal, setMarginTotal] = useState('0');
  const [selectedHotel, setSelectedHotel] = useState<any>(null);
  const packageType = currentSearchParams.packageType || 'hotel-land';
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
      return diffDays; // Add 1 because diffDays is 0 for same day
    }
    return 0;
  };

  const generateInitialPlannerItems = () => {
    let startDate, endDate;
    if (searchParams?.checkInDate && searchParams?.checkOutDate) {
      startDate = new Date(searchParams.checkInDate);
      endDate = new Date(searchParams.checkOutDate);
    } else if (checkInDate && checkOutDate) {
      startDate = new Date(checkInDate);
      endDate = new Date(checkOutDate);
    } else {
      startDate = new Date();
      endDate = new Date();
    }
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      console.error('Invalid date values', { checkInDate, checkOutDate, searchParamsIn: searchParams?.checkInDate, searchParamsOut: searchParams?.checkOutDate });
      startDate = new Date();
      endDate = new Date();
    }

    const items: PlannerItem[] = [];
    const currentDate = new Date(startDate);
    const totalNights = searchParams?.nights || calculateNights(startDate, endDate);
    if (totalNights === 1) {
      const dayDate = new Date(currentDate);
      const day = dayDate.getDate();
      const month = dayDate.toLocaleString('default', { month: 'short' });
      const year = dayDate.getFullYear();
      items.push({
        id: `day-1`,
        date: `${day.toString().padStart(2, '0')}-${month} ${year}`,
        dateObj: new Date(dayDate),
        hotel: null,
        transfer: null,
        tours: null,
        meals: null,
      });
    } else {
      for (let i = 0; i < totalNights; i++) {
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
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }
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
    let selectedCity = currentSearchParams.city || 'Baku';
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
          isLastDay: isLastDay
        }
      });
    } else if (itemType === 'tours') {
      const params = new URLSearchParams();
      params.append('city', selectedCity);
      params.append('country', selectedCountry);
      params.append('occupancy', String(currentSearchParams.rooms?.[0]?.adults || 2));
      params.append('adult', String(currentSearchParams.rooms?.[0]?.adults || 2));
      params.append('fromTripPlanner', 'true');
      params.append('dayId', itemId.split('-')[1]);
      params.append('checkInDate', itemDate.toISOString());
      params.append('specificDayId', itemId);
      params.append('packageType', packageType);
      window.location.href = `${TRIP_PLANNER}${params.toString()}`;
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
      console.log("Processing hotels:", hotels);

      setPlannerItems(prevItems => {
        const updatedItems = JSON.parse(JSON.stringify(prevItems));

        // Clear existing hotel assignments
        updatedItems.forEach(item => {
          item.hotel = null;
        });

        hotels.forEach(hotel => {
          console.log("Processing hotel:", hotel.hotel?.hotelName);

          // Handle specifically assigned day hotels (specificDayId)
          if (hotel.specificDayId) {
            const dayIndex = updatedItems.findIndex(item => item.id === hotel.specificDayId);
            if (dayIndex !== -1) {
              console.log(`✅ Assigning specific-day hotel ${hotel.hotel?.hotelName} to day ${hotel.specificDayId}`);
              updatedItems[dayIndex].hotel = {
                name: hotel.hotel?.hotelName || "Unknown Hotel",
                details: hotel
              };
            }
          }
          // Handle multi-day hotel bookings (no specificDayId)
          else if (hotel.booking?.checkInDate && hotel.booking?.checkOutDate) {
            const checkInDate = new Date(hotel.booking.checkInDate);
            let checkOutDate = new Date(hotel.booking.checkOutDate);

            // If check-in and check-out are the same, do not adjust check-out
            if (checkInDate.getTime() === checkOutDate.getTime()) {
              console.log("Single-night booking, no adjustment to check-out.");
              checkOutDate = checkInDate; // Keep check-out the same as check-in
            } else {
              // If check-in and check-out are different, adjust the check-out to the next day if needed
              checkOutDate.setHours(0, 0, 0, 0);
            }

            // Reset time components for accurate comparison
            checkInDate.setHours(0, 0, 0, 0);

            console.log(`Hotel ${hotel.hotel?.hotelName} is assigned from ${checkInDate.toISOString()} to ${checkOutDate.toISOString()}`);

            // Process each day between check-in and check-out
            updatedItems.forEach(item => {
              const itemDate = new Date(item.dateObj);
              itemDate.setHours(0, 0, 0, 0);

              console.log(`Comparing item date ${itemDate.toISOString()} with hotel check-in ${checkInDate.toISOString()} and check-out ${checkOutDate.toISOString()}`);


              let hotelPrice = Number(hotel.booking?.totalPrice) / Number(hotel.booking?.nights)

              // For both single and multi-day bookings, assign hotel to all dates from check-in to check-out
              if (itemDate.getTime() >= checkInDate.getTime() && itemDate.getTime() <= checkOutDate.getTime()) {
                if (!item.hotel) {
                  console.log(`✅ Assigning hotel ${hotel.hotel?.hotelName} to date ${itemDate.toISOString()}`);
                  item.hotel = {
                    name: hotel.hotel?.hotelName ||
                      "Unknown Hotel",
                    details: hotel,
                    hotelSpecificDetails: hotelPrice
                  };
                }
              }
            });
          }
        });

        console.log("Updated planner items:", updatedItems);
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
    const processedHotels = new Map();
    hotels.forEach(hotel => {
      const hotelKey = hotel.specificDayId || `${hotel.hotel?.hotelId}-${hotel.booking?.checkInDate}-${hotel.booking?.checkOutDate}`;
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
    // setGrandTotal(total);
  }, [hotels, plannerItems]);

  useEffect(() => {

    const processedHotels = new Map();
    let total = 0; 

    hotels.forEach(hotel => {
      const hotelKey = hotel.specificDayId || `${hotel.hotel?.hotelId}-${hotel.booking?.checkInDate}-${hotel.booking?.checkOutDate}`;
      if (!processedHotels.has(hotelKey)) {
        processedHotels.set(hotelKey, true);
        if (hotel.booking && typeof hotel.booking.totalPrice === 'number') {
          total += hotel.booking.totalPrice;
        }
      }
    });
    setTotalHotelPrice(total);
  },[hotels])



  const handleRemoveHotel = (plannerItem: PlannerItem) => {
    if (!plannerItem.hotel || !plannerItem.hotel.details) return;
    const hotelUniqueId = plannerItem.hotel.details.uniqueId;
    const hotelDetails = plannerItem.hotel.details;
    const hotelPrice = plannerItem.hotel.hotelSpecificDetails;
    setTotalHotelPrice(prev => prev - hotelPrice);
    let totalPrice = totalHotelPrice;
    const hotelNights = hotelDetails.booking?.nights || 1;
    const plannerItemId = plannerItem.id;
    // Step 1: Remove the hotel from the planner items
    const newPlannerItems = plannerItems.map(item => {
      if (item.id === plannerItemId) {
        return {
          ...item,
          hotel: null
        };
      }
      return item;
    });
    console.log("plannerItems", newPlannerItems)
    // Step 2: Update sessionStorage
    setPlannerItems(newPlannerItems);
    sessionStorage.setItem('tripPlannerItems', JSON.stringify(newPlannerItems));

    // Step 3: Find other instances of the same hotel
    const updatedPlannerItems = plannerItems.map(item =>
      item.id === plannerItem.id ? { ...item, hotel: null } : item
    );
    const otherDaysWithSameHotel = updatedPlannerItems.filter(item =>
      item.hotel?.details?.uniqueId === hotelUniqueId
    );
    // Step 4: Update hotel list based on the removal
    let updatedHotels = [...hotels];
    if (otherDaysWithSameHotel.length === 0) {
      updatedHotels = hotels.filter(hotel => hotel.uniqueId !== hotelUniqueId);
    } else {
      updatedHotels = hotels.map(hotel => {
        if (hotel.uniqueId === hotelUniqueId) {
          const updatedNights = Math.max(1, (hotel.booking?.nights || 1) - 1);
          const updatedTotalPrice = (hotel.booking?.totalPrice || 0) - hotelPrice;
          return {
            ...hotel,
            booking: {
              ...hotel.booking,
              nights: updatedNights,
              totalPrice: updatedTotalPrice
            }
          };
        }
        return hotel;
      });
    }
    // Step 5: Calculate new Grand Total after removing the hotel
    let updatedGrandTotal =
      (totalHotelPrice - hotelPrice)
    +
      updatedPlannerItems.reduce((sum, item) => {
        return sum + (item.tours?.details?.booking?.totalPrice || 0);
      }, 0);

    // setGrandTotal(updatedGrandTotal);
    // Step 6: Remove from sessionStorage and update UI
    setTimeout(() => {
      const itemsFromStorage = JSON.parse(sessionStorage.getItem('tripPlannerItems') || '[]');
      const nightsStillUsing = itemsFromStorage.filter(
        (item: PlannerItem) => item.hotel?.details?.uniqueId === hotelUniqueId
      ).length;
      const totalNightsBefore = plannerItems.filter(
        (item) => item.hotel?.details?.uniqueId === hotelUniqueId
      ).length;
    //   // Update Grand Total
    //   const pricePerNight = totalNightsBefore > 0 ? totalHotelPrice / totalNightsBefore : 0;
    //   setGrandTotal(prev => prev - hotelPrice);
      if (nightsStillUsing === 0) {
        const updatedHotels = hotels.filter(hotel => hotel.uniqueId !== hotelUniqueId);
        setHotels(updatedHotels);
        sessionStorage.setItem('tripPlannerHotels', JSON.stringify(updatedHotels));
        if (selectedHotel?.uniqueId === hotelUniqueId) {
          setSelectedHotel(updatedHotels.length > 0 ? updatedHotels[0] : null);
        }
      }
    }, 0);

    // Step 7: Update Hotels and Grand Total in UI
    // setPlannerItems(updatedHotels);
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
      setTotalHotelPrice(prev => prev - priceToSubtract);
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
      return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
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
  const displayCheckInDate = formatHeaderDate(currentSearchParams?.checkInDate);
  const displayCheckOutDate = formatHeaderDate(currentSearchParams?.checkOutDate);
  const displayNights = currentSearchParams?.nights || nights || '1';
  const displayCity = currentSearchParams?.city || 'BAKU';
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

  const handleDownloadPDF = () => {
    const calculateTotalPersons = () => {
      if (!currentSearchParams?.rooms || !Array.isArray(currentSearchParams.rooms)) {
        return 2; // Default to 2 persons if no room data
      }
      return currentSearchParams.rooms.reduce((total, room) => {
        const adults = room.adults || 0;
        const cwb = room.cwb || 0;    // Child with bed
        const cnb = room.cnb || 0;    // Child no bed
        const infants = room.infants || 0;
        return total + adults + cwb + cnb + infants;
      }, 0);
    };
    const totalPersons = calculateTotalPersons();
    const tripPlannerData = {
      bookingRef: `BK${Math.floor(Math.random() * 90000) + 10000}`,
      generateDate: new Date().toLocaleDateString(),
      currentSearchParams: {
        checkInDate: currentSearchParams.checkInDate,
        checkOutDate: currentSearchParams.checkOutDate,
        nights: currentSearchParams.nights || nights,
        rooms: currentSearchParams.rooms || [{ adults: 2 }]
      },
      hotels: hotels.map(hotel => ({
        ...hotel,
        hotel: {
          ...hotel.hotel,
          hotelName: hotel.hotel.hotelName || hotel.hotel.name,
          description: hotel.hotel.description
        },
        booking: {
          ...hotel.booking,
          roomType: hotel.booking.roomType || hotel.room?.roomCategory,
          mealPlan: hotel.booking.mealPlan || hotel.room?.mealPlan,
          totalRooms: hotel.booking.totalRooms || 1
        },
        room: hotel.room || {}
      })),
      plannerItems: plannerItems.map(item => {
        let toursData = null;
        if (item.tours) {
          toursData = {
            ...item.tours,
            name: item.tours.name || item.tours.details?.tour?.tourName || 'Tour Activity',
            details: {
              ...(item.tours.details || {}),
              tour: {
                ...(item.tours.details?.tour || {}),
                description: item.tours.details?.tour?.description || item.tours.description || 'N/A',
                duration: item.tours.details?.tour?.duration || item.tours.eventDuration || 'N/A'
              }
            },
          };
        }
        return {
          ...item,
          tours: toursData,
          transfer: item.transfer || null,
          meals: item.meals || null
        };
      }),
      costs: {
        finalAmount: totalHotelPrice + (parseFloat(marginTotal) || 0),
        packageDetails: { totalPersons: totalPersons }
      },
      currency: currency || 'USD'
    };
    if (tripPlannerData.plannerItems.length > 0) {
      console.log("Example planner item structure:",
        JSON.stringify(tripPlannerData.plannerItems[0], null, 2));
    }
    sessionStorage.setItem('tripPlannerData', JSON.stringify(tripPlannerData));
    navigate('/tour-package-pdf');
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
            <Customize isModifying={true} initialValues={currentSearchParams} onSearchComplete={handleSearchComplete} />
          </div>)}
        <Box sx={{ mb: 0 }}>
          <Tabs value={activeTab} onChange={handleTabChange} sx={{ color: 'black' }}>
            <Tab value="planner" label="Planner" style={{ color: activeTab === 'planner' ? 'white' : 'black', }} sx={{
              color: activeTab === 'planner' ? 'black' : 'white',
              bgcolor: activeTab === 'planner' ? 'grey' : 'white', marginLeft: '0rem', width: '10rem'
            }} />
            {showHotelTab && (
              <Tab value="hotel" label="Hotel Details" style={{ color: activeTab === 'planner' ? 'black' : 'white', }} sx={{
                color: activeTab === 'planner' ? 'black' : 'white',
                bgcolor: activeTab === 'planner' ? 'white' : 'grey', marginLeft: '0.5rem', width: '10rem'
              }} />
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
                          <Box sx={{}}>
                            <Typography variant="body2" sx={{
                              fontSize: '0.8rem', textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap', overflow: 'hidden', textAlign: 'center', maxWidth: '100%',
                            }}>
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
                            <AddCircleOutline />
                          </IconButton>
                        </Box>
                      )}
                    </Box>

                  )}
                  <Box className="cell">
                    <Box display="flex" justifyContent="flex-end">
                      <IconButton className="add-button" onClick={() => handleAddItem(plannerItem.id, 'transfer')} aria-label="Add transfer" sx={{ color: '#777777', "& .MuiSvgIcon-root": { fill: 'grey' } }}>
                        <AddCircleOutline />
                      </IconButton>
                    </Box>
                  </Box>
                  <Box className="cell">
                    {plannerItem.tours ? (
                      <Box className="selected-tour">
                        <Box>
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
                          <AddCircleOutline />
                        </IconButton>
                      </Box>
                    )}
                  </Box>
                  <Box className="cell">
                    <Box display="flex" justifyContent="flex-end">
                      <IconButton className="add-button" onClick={() => handleAddItem(plannerItem.id, 'meals')} aria-label="Add meals" sx={{ color: '#777777', "& .MuiSvgIcon-root": { fill: 'grey' } }} >
                        <AddCircleOutline />
                      </IconButton>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
            <Box className="total-section" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
              <Box className="total-row">
                <Typography className="label">Net Total:</Typography>
                <Typography className="value">{currency} {totalHotelPrice.toFixed(2)}</Typography>
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
                <Typography className="value">{currency} {(totalHotelPrice + (parseFloat(marginTotal) || 0)).toFixed(2)}</Typography>
              </Box>
            </Box>
            <Box className="action-buttons">
              <Button variant="contained" color="error" className="proceed-button" onClick={handleDownloadPDF} > Download Now </Button>
              <Button variant="contained" className="cancel-button" onClick={onCancel}>Cancel </Button>
            </Box>
          </Paper>
        )}
        {activeTab === 'hotel' && showHotelTab && (
          <Paper elevation={3} className="hotel-details-container" sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
            <TripDetails hotels={hotels} totalPrice={totalHotelPrice} />
          </Paper>
        )}
      </Container>
    </Box>
  );
};
export default TripPlanner;