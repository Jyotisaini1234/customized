import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import './TripPlanner.scss';
import { Box, Container, Typography, Button, Grid, IconButton, Paper, Tabs, Tab, TextField } from '@mui/material';
import { ArrowDownIcon } from '../../../../icons/icons.tsx';
import Customize from '../Customize/Customize.tsx';
import { AddCircleOutline, DeleteOutline } from '@mui/icons-material';
import { PlannerItem } from '../../../../types/types.ts';
import { TRIP_PLANNER } from '../../../../utils/ApiConstants.ts';
import TripDetails from '../TripDetails/TripDetails.tsx';
import ClientDetailsForm from '../../BookingSection/ClientForm/ClientDetailsForm.tsx';
import {  useSubmitLeadMutation, useUpdateLeadMutation, useRemoveHotelFromPlannerMutation, useRemoveTourFromPlannerMutation, useSaveSearchParamsMutation, useSyncHotelToBackendMutation, useSyncTourToBackendMutation, useLoadPlannerDataQuery, useLazyLoadPlannerDataQuery } from '../../../../api/TourAPI.tsx';
import { TourData, TripPlannerProps } from '../../../../types/tour.types.ts';
import {setTripPlannerParams,setHotels,addHotel,removeHotel,setPlannerItems,updatePlannerItem,addTourToPlannerItem,removeTour,setGrandTotal,setSelectedHotel,setCurrentSearchParams,selectTripPlannerState,selectHotels,selectPlannerItems,selectCurrentSearchParams,selectGrandTotal,selectSelectedHotel,setSessionId, addTour, selectTours, removeTourFromDay,} from '../../../../store/slices/tripPlannerSlice.ts';
import { useAppSelector } from '../../../../store/store.tsx';


const TripPlanner: React.FC<TripPlannerProps> = ({ nights, checkInDate, checkOutDate, onProceed, initialClientData = null }) => {
const location = useLocation();
const navigate = useNavigate();
const dispatch = useDispatch();
const plannerItems = useAppSelector(state => state.tripPlanner.plannerItems);
const tripPlannerState = useSelector(selectTripPlannerState);
const hotels = useSelector(selectHotels);
const currentSearchParams = useSelector(selectCurrentSearchParams);
const grandTotal = useSelector(selectGrandTotal);
const selectedHotel = useSelector(selectSelectedHotel);
const sessionId = useAppSelector(state => state.tripPlanner.sessionId);
const [clientData, setClientData] = useState({ name: '', destination: '', options: 'package', type: 'package'});
const [currency, setCurrency] = useState('');
const [showModifySearch, setShowModifySearch] = useState(false);
const [activeTab, setActiveTab] = useState<'planner' | 'hotel'>('planner');
const [marginTotal, setMarginTotal] = useState('0');
const [clientFormOpen, setClientFormOpen] = useState(false);
const [bookingRef] = useState(`BK${Math.floor(Math.random() * 90000) + 10000}`);
const [showThankYou, setShowThankYou] = useState(false);
const [isEditMode, setIsEditMode] = useState(false);
const [originalLeadId, setOriginalLeadId] = useState<string | null>(null);
const [editingClientData, setEditingClientData] = useState<any>(null);
const [updateLead] = useUpdateLeadMutation();
const [submitLead] = useSubmitLeadMutation();
const tours = useAppSelector(selectTours);
const [isDataLoaded, setIsDataLoaded] = useState(false);
const onCancel = () => { navigate('/customize-package'); };
const calculateNights = (startDate: Date | null, endDate: Date | null) => { if (startDate && endDate) {const diffTime = Math.abs(endDate.getTime() - startDate.getTime());const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));return diffDays;} return 0; };
const getSessionIdFromURL = () => { const urlParams = new URLSearchParams(window.location.search);return urlParams.get('sessionId');};
const [removeHotelFromPlanner] = useRemoveHotelFromPlannerMutation();
const [removeTourFromPlanner] = useRemoveTourFromPlannerMutation();
const [saveTemporaryHotelSearchParams] = useSaveSearchParamsMutation();
const handleMarginChange = (event) => {const inputValue = event.target.value;if (inputValue === '' || !isNaN(parseFloat(inputValue))) {setMarginTotal(inputValue); } };
const [saveSearchParams] = useSaveSearchParamsMutation();
const [loadPlannerData] = useLazyLoadPlannerDataQuery();
const [syncHotel] = useSyncHotelToBackendMutation();
const [syncTour] = useSyncTourToBackendMutation();
const generateInitialPlannerItems = (searchParams: any) => {
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
      endDate.setDate(endDate.getDate() + 1);
    }
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) { console.error('Invalid date values');startDate = new Date();endDate = new Date();endDate.setDate(endDate.getDate() + 1);}
    const items: PlannerItem[] = [];
    const currentDate = new Date(startDate);
    const totalNights = calculateNights(startDate, endDate);
    for (let i = 0; i <= totalNights; i++) {
      const dayDate = new Date(currentDate);
      const day = dayDate.getDate();
      const month = dayDate.toLocaleString('default', { month: 'short' });
      const year = dayDate.getFullYear();
      items.push({id: `day-${items.length + 1}`,date: `${day.toString().padStart(2, '0')}-${month} ${year}`, dateObj: new Date(dayDate),hotel: null,transfer: null,tours: null, meals: null,eventDate: '', dayNumber: '',hotels: false});currentDate.setDate(currentDate.getDate() + 1);
    }
    return items;
  };

const processBackendData = (result: any, sessionId: string) => {
  if (result.searchParams && Object.keys(result.searchParams).length > 0) {
    dispatch(setCurrentSearchParams(result.searchParams));
    dispatch(setTripPlannerParams({...result.searchParams,sessionId: sessionId})); }
  if (result.allHotels && result.allHotels.length > 0) {
    const processedHotels = result.allHotels.map((hotelEntry: any) => ({
      hotel: hotelEntry.hotel,
      booking: hotelEntry.booking,
      room: hotelEntry.room,
      uniqueId: hotelEntry.uniqueId,
      specificDayId: hotelEntry.specificDayId,
      hotelSpecificDetails: hotelEntry.hotelSpecificDetails,
      fromTripPlanner: true,
      addedToPlanner: true,
      sessionId: sessionId
    }));
    dispatch(setHotels(processedHotels));
  }
  
  const processedTours: any[] = [];
  if (result.allTours && Array.isArray(result.allTours) && result.allTours.length > 0) {
    console.log('Processing tours from allTours:', result.allTours.length);
    result.allTours.forEach((tourEntry: any) => {
      if (tourEntry.tours && tourEntry.specificDayId) {
        const tourData = {
          specificDayId: tourEntry.specificDayId,
          date: tourEntry.date || '',
          tours: {
            name: tourEntry.tours.name || '',
            details: tourEntry.tours.details || {},
            uniqueId: tourEntry.tours.uniqueId || ''
          },
          sessionId: sessionId,
          fromTripPlanner: true,
          addedToPlanner: true,
          timestamp: tourEntry.timestamp || Date.now(),
          tourId: tourEntry.tours.tourId || ""
        };
        processedTours.push(tourData);
      }
    });
  } else if (result.plannerItems && result.plannerItems.length > 0) {
    result.plannerItems.forEach((item: any) => {
      if (item.tours) {
        if (Array.isArray(item.tours)) {
          item.tours.forEach((tour: any) => {
            const tourData = {
              specificDayId: item.id || item.specificDayId,
              date: item.date || '',
              tours: {
                name: tour.name || '',
                details: tour.details || {},
                uniqueId: tour.uniqueId || ''
              },
              sessionId: sessionId,
              fromTripPlanner: true,
              addedToPlanner: true,
              timestamp: tour.timestamp || Date.now(),
              tourId: tour.tourId || ""
            };
            processedTours.push(tourData);
          });
        } else {
          const tourData = {
            specificDayId: item.id || item.specificDayId,
            date: item.date || '',
            tours: {
              name: item.tours.name || '',
              details: item.tours.details || {},
              uniqueId: item.tours.uniqueId || ''
            },
            sessionId: sessionId,
            fromTripPlanner: true,
            addedToPlanner: true,
            timestamp: item.tours.timestamp || Date.now(),
            tourId: item.tours.tourId || ""
          };
          processedTours.push(tourData);
        }
      }
    });
  }
  if (processedTours.length > 0) {
    processedTours.forEach(tour => {
      dispatch(addTour(tour));
    });
  }

  const searchParams = result.searchParams || currentSearchParams;
  if (searchParams && searchParams.checkInDate && searchParams.checkOutDate) {
    const initialItems = generateInitialPlannerItems(searchParams);
    const mergedItems = initialItems.map(generatedItem => {
    const backendItem = result.plannerItems?.find((item: any) => item.id === generatedItem.id || item.specificDayId === generatedItem.id);
      if (backendItem) {
        return {
          ...generatedItem, 
          ...backendItem, 
          dateObj: generatedItem.dateObj,
          id: generatedItem.id
        };
      }
      return generatedItem;
    });
    dispatch(setPlannerItems(mergedItems));
  } else if (result.plannerItems && result.plannerItems.length > 0) {
    dispatch(setPlannerItems(result.plannerItems));
  }
};

useEffect(() => {
  const initializeComponent = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlSessionId = getSessionIdFromURL();
      const urlDataSource = urlParams.get('dataSource');
      const isEditModeFromURL = urlParams.get('isEditMode') === 'true' || urlParams.get('editModeActive') === 'true';
      const originalLeadIdFromURL = urlParams.get('originalLeadId');
      const bookingRefFromURL = urlParams.get('bookingRef');
      let sessionToUse = urlSessionId || tripPlannerState.sessionId || currentSearchParams?.sessionId;
      const locationSearchParams = location.state;
      if (isEditModeFromURL) {
        setIsEditMode(true);
        if (originalLeadIdFromURL) {setOriginalLeadId(originalLeadIdFromURL);}
        if (bookingRefFromURL && !editingClientData?.bookingNo) {
          setEditingClientData(prev => ({...prev,bookingNo: bookingRefFromURL, originalLeadId: originalLeadIdFromURL}));
        }
      }
      if (sessionToUse) {
        dispatch(setSessionId(sessionToUse));
        const response = await loadPlannerData(sessionToUse);
        const result = response.data;
        const isSuccess = response.isSuccess;
        if (isSuccess && result) {
          processBackendData(result, sessionToUse);
          const currentHotels = hotels.length;
          const currentTours = tours.length;
          if (locationSearchParams) {
            if (!locationSearchParams.isTemporaryHotelSearch && 
                !locationSearchParams.isHotelSpecific && 
                !locationSearchParams.specificDayId) {
              const mergedSearchParams = { ...locationSearchParams, sessionId: sessionToUse, preserveBackendData: true, isEditMode: isEditModeFromURL || isEditMode, originalLeadId: originalLeadIdFromURL || originalLeadId };
              await saveSearchParams(mergedSearchParams).unwrap();
              dispatch(setCurrentSearchParams(mergedSearchParams));
              dispatch(setTripPlannerParams(mergedSearchParams));
            } else {
              console.log(' Hotel-specific search detected - preserving original trip search params');
            }
          }
        } else {
          console.log(' Failed to load from backend, using fallback approach');
          if (locationSearchParams && !locationSearchParams.isTemporaryHotelSearch) {
            const searchParamsToSave = { ...locationSearchParams,  sessionId: sessionToUse,fallbackMode: true, isEditMode: isEditModeFromURL || isEditMode, originalLeadId: originalLeadIdFromURL || originalLeadId };
            const result = await saveSearchParams(searchParamsToSave).unwrap();
            if (result?.data) {
              dispatch(setCurrentSearchParams(searchParamsToSave));
              dispatch(setTripPlannerParams(searchParamsToSave));
              const initialItems = generateInitialPlannerItems(searchParamsToSave);
              dispatch(setPlannerItems(initialItems));
            }
          }
        }
      } else {
        const searchParamsToSave = locationSearchParams || currentSearchParams || {checkInDate, checkOutDate,nights: nights || 1, city: '', country: 'Azerbaijan', packageType: 'hotel-land',isEditMode: isEditModeFromURL, originalLeadId: originalLeadIdFromURL};
        const result = await saveSearchParams(searchParamsToSave).unwrap();
        if (result?.data) {
          dispatch(setSessionId(result.data));
          const updatedSearchParams = {...searchParamsToSave,sessionId: result.data};
          dispatch(setCurrentSearchParams(updatedSearchParams));
          dispatch(setTripPlannerParams(updatedSearchParams));
          const initialItems = generateInitialPlannerItems(updatedSearchParams);
          dispatch(setPlannerItems(initialItems));
        }
      }
      setIsDataLoaded(true);
      console.log('Initialization complete');
    } catch (error) {
      console.error('TripPlanner - Error during initialization:', error);
      setIsDataLoaded(true);
    }
  };
  initializeComponent();
}, [location.pathname, location.search]);

useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const hotelData = urlParams.get("hotelData");
  if (hotelData && sessionId) {
    try {
      const hotelDetails = JSON.parse(decodeURIComponent(hotelData));
      const transformedHotel = {
        hotel: hotelDetails.hotel || hotelDetails.data?.hotel,
        booking: hotelDetails.booking || hotelDetails.data?.booking || {
          checkInDate: hotelDetails.data?.booking?.checkInDate || hotelDetails.data?.searchContext?.checkInDate,
          checkOutDate: hotelDetails.data?.booking?.checkOutDate || hotelDetails.data?.searchContext?.checkOutDate,
          nights: hotelDetails.data?.booking?.nights || hotelDetails.data?.searchContext?.nights,
          totalPrice: hotelDetails.data?.booking?.totalPrice,
          currency: hotelDetails.data?.booking?.currency || 'USD',
          roomType: hotelDetails.data?.roomType,
          mealPlan: hotelDetails.data?.mealPlan
        },
        room: hotelDetails.room || hotelDetails.data?.room || {
          roomCategory: hotelDetails.data?.roomType,
          mealPlan: hotelDetails.data?.mealPlan
        },
        uniqueId: hotelDetails.uniqueId || hotelDetails.data?.uniqueId,
        specificDayId: hotelDetails.specificDayId || hotelDetails.data?.specificDayId,
        hotelSpecificDetails: hotelDetails.hotelSpecificDetails || hotelDetails.data?.hotelSpecificDetails || {},
        city: hotelDetails.city || hotelDetails.data?.city,
        destination: hotelDetails.destination || hotelDetails.data?.destination,
        area: hotelDetails.area || hotelDetails.data?.area || '',
        fromTripPlanner: true,
        addedToPlanner: true,
        sessionId: sessionId
      };
      dispatch(addHotel(transformedHotel));
      syncHotel(transformedHotel);
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (e) {
      console.error("Error parsing hotel data", e);
    }
  }
}, [sessionId, dispatch, syncHotel]);


const getHotelsWithPlannerDates = () => {
  const hotelsWithCorrectDates = hotels.map(hotel => {
  const firstAssignedDay = plannerItems.find(item => item.hotel?.details?.uniqueId === hotel.uniqueId);
    if (firstAssignedDay) {
      const checkInDate = new Date(firstAssignedDay.dateObj);
      checkInDate.setHours(0, 0, 0, 0);
      const nights = parseInt(hotel.booking?.nights) || 1;
      const checkOutDate = new Date(checkInDate);
      checkOutDate.setDate(checkOutDate.getDate() + nights);
      checkOutDate.setHours(0, 0, 0, 0);
      return { ...hotel,booking: { ...hotel.booking,checkInDate: checkInDate.toISOString(),checkOutDate: checkOutDate.toISOString(),nights: nights } };
    }
    return hotel;
  });
  return hotelsWithCorrectDates;
};

useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const tourData = urlParams.get('tourData');
  const tourAdded = urlParams.get('tourAdded');
  if (tourData && plannerItems.length > 0 && tourAdded === 'true') {
    try {
      const tourDetails = JSON.parse(decodeURIComponent(tourData));
      const specificDayId = tourDetails.specificDayId;
      if (specificDayId) {
        const uniqueId = tourDetails.tour?.uniqueId || `tour-${specificDayId}-${Date.now()}`;
        const tourToAdd = {
          specificDayId: specificDayId,
          date: tourDetails.booking?.date,
          tourId: tourDetails.tour?.id || '',
          tours: {
            name: tourDetails.tour?.tourName || tourDetails.tour?.sightName,
            uniqueId: uniqueId,
            details: {...tourDetails, uniqueId: uniqueId}
          },
          sessionId: sessionId,
          fromTripPlanner: true,
          addedToPlanner: true,
          timestamp: Date.now()
        };
        dispatch(addTour(tourToAdd));
        syncTour(tourToAdd).unwrap()
          .then((response) => {
            if (response.success) {
              console.log('Backend sync successful:', response);
              if (response.data.tourUniqueId && response.data.tourUniqueId !== uniqueId) {
                const updatedTour = {
                  ...tourToAdd,
                  tours: {
                    ...tourToAdd.tours,
                    uniqueId: response.data.tourUniqueId,
                    details: {
                      ...tourToAdd.tours.details,
                      uniqueId: response.data.tourUniqueId
                    }
                  }
                };
                dispatch(addTour(updatedTour));
              }
            } else {
              console.error('Backend sync failed, but tour remains in frontend');
            }
          })
          .catch(error => {
            console.error('Backend sync error, but tour remains in frontend:', error);
          });
      }
      window.history.replaceState({}, document.title, window.location.pathname + window.location.search.replace(/[?&]tourData=[^&]*/, '') .replace(/[?&]tourAdded=[^&]*/, '') .replace(/[?&]specificDayId=[^&]*/, '')
      );
    } catch (e) {
      console.error('Error parsing tour data from URL:', e);
    }
  }
}, [plannerItems.length, dispatch, sessionId, syncTour]);

useEffect(() => {
  if (hotels.length > 0 || tours.length > 0) {
    const hotelCurrency = hotels[0]?.booking?.currency || tours[0]?.tours?.details?.booking?.currency || 'USD';
    setCurrency(hotelCurrency);
    if (!selectedHotel && hotels.length > 0) { dispatch(setSelectedHotel(hotels[0])); }
    let total = 0;
    const processedHotels = new Map();
    hotels.forEach(hotel => {
      const hotelKey = hotel.specificDayId || `${hotel.hotel?.hotelId}-${hotel.booking?.checkInDate}-${hotel.booking?.checkOutDate}`;
      if (!processedHotels.has(hotelKey)) {
        processedHotels.set(hotelKey, true);
        if (hotel.booking && typeof hotel.booking.totalPrice === 'number') {total += hotel.booking.totalPrice; }
      }
    });
    const processedTours = new Map();
    tours.forEach(tour => {
      const tourIdentifier = tour.tourId || tour.tours?.details?.tour?.id || tour.tours?.name || tour.tours?.details?.tourName;
      const uniqueKey = `${tour.specificDayId}-${tourIdentifier}`;
      if (uniqueKey && !processedTours.has(uniqueKey)) {
        processedTours.set(uniqueKey, true);
        const tourPrice = tour.tours?.details?.booking?.totalPrice;
        if (typeof tourPrice === 'number') {total += tourPrice;} 
        else {console.warn('Tour missing price:', tour.tours?.name, tourPrice);}
      } else {console.log(`Skipping duplicate tour: ${tour.tours?.name} (Key: ${uniqueKey})`);}
    });
    dispatch(setGrandTotal(total));
  } else {
    dispatch(setGrandTotal(0));
  }
}, [hotels, tours, dispatch, selectedHotel]);

useEffect(() => {
  if (hotels.length > 0 && plannerItems.length > 0) {
    const updatedItems = JSON.parse(JSON.stringify(plannerItems));
    updatedItems.forEach(item => {  item.hotel = null; });
    const sortedHotels = [...hotels].sort((a, b) => {
      const dateA = a.booking?.checkInDate ? new Date(a.booking.checkInDate) : new Date();
      const dateB = b.booking?.checkInDate ? new Date(b.booking.checkInDate) : new Date();
      return dateA.getTime() - dateB.getTime();});
    sortedHotels.forEach((hotel, hotelIndex) => {
      if (hotel.specificDayId) {
        const dayIndex = updatedItems.findIndex(item => item.id === hotel.specificDayId);
        if (dayIndex !== -1) {
          const nights = parseInt(hotel.booking?.nights) || 1;
          for (let i = 0; i < nights && (dayIndex + i) < updatedItems.length; i++) {
            const assignIndex = dayIndex + i;
            updatedItems[assignIndex] = {
              ...updatedItems[assignIndex],
              hotel: {
                name: hotel.hotel?.hotelName || hotel.hotel?.name || "Unknown Hotel",
                details: hotel,
                hotelSpecificDetails: hotel.hotelSpecificDetails || {}
              }
            };
          }
        }
      }
      else if (hotel.booking?.checkInDate && hotel.booking?.checkOutDate) {
        const checkInDate = new Date(hotel.booking.checkInDate);
        const checkOutDate = new Date(hotel.booking.checkOutDate);
        checkInDate.setHours(0, 0, 0, 0);
        checkOutDate.setHours(0, 0, 0, 0);
        const nightsFromDates = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
        const actualNights = parseInt(hotel.booking?.nights) || nightsFromDates;
        updatedItems.forEach((item, index) => {
          const itemDate = new Date(item.dateObj);
          itemDate.setHours(0, 0, 0, 0);
          if (itemDate >= checkInDate && itemDate <= checkOutDate) {
            const isCheckOutDay = itemDate.getTime() === checkOutDate.getTime();
            let shouldShowOnCheckOut = false;
            if (isCheckOutDay) {
              const isLastDay = index === updatedItems.length - 1;
              const hasAnotherHotelStarting = sortedHotels.some((otherHotel, otherIndex) => {
                if (otherIndex <= hotelIndex) return false;
                const otherCheckIn = new Date(otherHotel.booking?.checkInDate);
                otherCheckIn.setHours(0, 0, 0, 0);
                return otherCheckIn.getTime() === checkOutDate.getTime();
              });
              shouldShowOnCheckOut = isLastDay || !hasAnotherHotelStarting || actualNights === 1;
            }
            if (!isCheckOutDay || shouldShowOnCheckOut) {
              updatedItems[index] = {
                ...updatedItems[index],
                hotel: {
                  name: hotel.hotel?.hotelName || hotel.hotel?.name || "Unknown Hotel",
                  details: hotel,
                  hotelSpecificDetails: hotel.hotelSpecificDetails || {}
                }
              };
            }
          }
        });
      }
    });
    const lastDayIndex = updatedItems.length - 1;
    const secondLastDayIndex = lastDayIndex - 1;
    if (lastDayIndex >= 0 && secondLastDayIndex >= 0) {
      if (!updatedItems[lastDayIndex].hotel && updatedItems[secondLastDayIndex].hotel) {
        updatedItems[lastDayIndex] = {...updatedItems[lastDayIndex],hotel: updatedItems[secondLastDayIndex].hotel };
      }
    }
    updatedItems.forEach((item, index) => {
      const hotelName = item.hotel ? item.hotel.name : 'No Hotel';
      const tourName = item.tours ? (Array.isArray(item.tours) ? `${item.tours.length} tours` : item.tours.name) : 'No Tours';
    });
    dispatch(setPlannerItems(updatedItems));
  } else if (plannerItems.length > 0 && hotels.length === 0) {
    const clearedItems = plannerItems.map(item => ({ ...item, hotel: null }));
    dispatch(setPlannerItems(clearedItems));
  }
}, [hotels.length, dispatch, plannerItems.length,isDataLoaded]);

const handleHotelSelection = async (itemId: string) => {
  const plannerItem = plannerItems.find(item => item.id === itemId);
  if (!plannerItem) return;
  const selectedDayIndex = plannerItems.findIndex(item => item.id === itemId);
  const itemDate = new Date(plannerItem.dateObj);
  const dayHasHotel = plannerItem.hotel !== null;
  if (dayHasHotel) return;
  const remainingDays = plannerItems.length - selectedDayIndex;
  const maxAvailableNights = remainingDays > 0 ? remainingDays : 1;
  let availableNights = 1;
  for (let i = selectedDayIndex + 1; i < plannerItems.length; i++) {
  if (plannerItems[i].hotel === null) { availableNights++;  } else {break;} }
  const checkInDate = new Date(itemDate);
  const checkOutDate = new Date(itemDate);
  checkOutDate.setDate(checkOutDate.getDate() + 1);
  const roomsData = currentSearchParams?.rooms || [{ adults: 2, cwb: 0, cnb: 0, infants: 0 }];
  const editBookingRef = editingClientData?.bookingNo || editingClientData?.originalLeadId;
  const temporaryHotelSearchParams = {
      checkInDate: checkInDate.toISOString(),
      checkOutDate: checkOutDate.toISOString(),
      nights: 1,
      city: currentSearchParams?.city,
      country: currentSearchParams?.country,
      specificDayId: itemId,
      selectedDayIndex: selectedDayIndex,
      availableNights: availableNights,
      maxNights: maxAvailableNights,
      applyToAllDays: false,
      isHotelSpecific: true,
      rooms: roomsData,
      sessionId: sessionId,
      bookingRef: isEditMode ? editBookingRef : currentSearchParams?.bookingRef,
      isTemporaryHotelSearch: true,
      preserveOriginalParams: true,
      sourceAction: 'dailyHotelSelection',
      isEditMode: isEditMode,
      editModeActive: isEditMode,
      originalLeadId: isEditMode ? (originalLeadId || editBookingRef) : undefined,
      originalMainTripParams: {
          checkInDate: currentSearchParams?.checkInDate,
          checkOutDate: currentSearchParams?.checkOutDate,
          nights: currentSearchParams?.nights,
          city: currentSearchParams?.city,
          country: currentSearchParams?.country,
          packageType: currentSearchParams?.packageType,
          rooms: currentSearchParams?.rooms
      }
  };
  try {
      await saveTemporaryHotelSearchParams(temporaryHotelSearchParams).unwrap();
      console.log('Temporary hotel search params saved successfully');
  } catch (error: any) {
      console.error('Error saving temporary hotel search params:', error);
  }
  const redirectParams = new URLSearchParams();
  redirectParams.append('sessionId', sessionId);
  redirectParams.append('specificDayId', itemId);
  redirectParams.append('selectedDayIndex', selectedDayIndex.toString());
  redirectParams.append('availableNights', availableNights.toString());
  redirectParams.append('maxNights', maxAvailableNights.toString());
  redirectParams.append('isHotelSpecific', 'true');
  redirectParams.append('dataSource', 'backend');
  redirectParams.append('isTemporaryHotelSearch', 'true');
  if (isEditMode) {
      redirectParams.append('isEditMode', 'true');
      redirectParams.append('editModeActive', 'true');
      if (originalLeadId || editBookingRef) {redirectParams.append('originalLeadId', originalLeadId || editBookingRef);}
      if (editBookingRef) {redirectParams.append('bookingRef', editBookingRef);}
  }
  const destinationUrl = `/trip-planner-area?${redirectParams.toString()}`;
  navigate(destinationUrl);
};


const handleAddItem = (itemId: string, itemType: 'tours') => {
    const plannerItem = plannerItems.find(item => item.id === itemId);
    if (!plannerItem) {console.error(`Could not find planner item with id ${itemId}`); return; }
    const itemDate = plannerItem.dateObj instanceof Date ? plannerItem.dateObj : new Date(plannerItem.dateObj);
    if (isNaN(itemDate.getTime())) { console.error(`Invalid date object for planner item ${itemId}`);return; }
    let selectedArea = '';
    let selectedCity = currentSearchParams?.city;
    let selectedCountry = currentSearchParams?.country || 'Azerbaijan';
    const packageType = currentSearchParams?.packageType || 'hotel-land';
    if (packageType === 'hotel-land' && hotels.length > 0 && hotels[0].hotel?.area) {selectedArea = hotels[0].hotel.area;}
    if (itemType === 'tours') {
      const { totalPax, adults, infants } = calculatePassengersBreakdown(currentSearchParams?.rooms);
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
      params.append('sessionId', sessionId);
      if (isEditMode) {
      params.append('isEditMode', 'true');
      params.append('editModeActive', 'true');
      if (originalLeadId) {
      params.append('originalLeadId', originalLeadId); }
      if (editingClientData?.bookingNo) {
      params.append('bookingRef', editingClientData.bookingNo);}}
      if (currentSearchParams?.rooms && currentSearchParams.rooms.length > 0) {params.append('rooms', encodeURIComponent(JSON.stringify(currentSearchParams.rooms))); }
      window.location.href = `${TRIP_PLANNER}${params.toString()}`;
    }
  };

const calculatePassengersBreakdown = (rooms) => {
    if (!rooms || !Array.isArray(rooms)) {return { totalPax: 2, adults: 2, infants: 0 };}
    let adults = 0;
    let infants = 0;
    rooms.forEach(room => {adults += room.adults + room.cwb + room.cnb;infants += room.infant || 0;});  
    const totalPax = adults + infants;
    return { totalPax, adults, infants };
  };

const handleRemoveHotel = async (uniqueId: string) => {
  try {
      const response = await removeHotelFromPlanner({ uniqueId, sessionId }).unwrap();
      dispatch(removeHotel(uniqueId));
  } catch (err: any) {
      console.error("Error removing hotel:", err);
      if (err?.status === 404) {
          dispatch(removeHotel(uniqueId));
      } else {
          const errorMsg = err?.data?.developerMessage || err?.message || "Failed to remove hotel";
          alert("Hotel remove failed: " + errorMsg);
      }
  }
};
const handleRemoveTour = async (plannerItem: any, tourIndex: number = 0) => {
  if (!plannerItem.tours) {return;}
  try {
      const tours = Array.isArray(plannerItem.tours) ? plannerItem.tours : [plannerItem.tours];
      if (tourIndex >= tours.length) {  console.error('Invalid tour index'); return; }
      const tourToRemove = tours[tourIndex];
      const tourUniqueId = tourToRemove.uniqueId || tourToRemove.details?.uniqueId || `tour-${plannerItem.id}-${tourIndex}`;
      const response = await removeTourFromPlanner({uniqueId: tourUniqueId,  sessionId,specificDayId: plannerItem.id }).unwrap();
  } catch (error: any) {
      console.error('Error removing tour:', error);
      const errorMsg = error?.data?.developerMessage || error?.message || "Failed to remove tour";
      alert('Failed to remove tour: ' + errorMsg);
  }
};

const handleSearchComplete = async (updatedParams: any) => {
  if (updatedParams) {
    try {
      const result = await saveSearchParams({...updatedParams,sessionId: sessionId, isNewSearch: false}).unwrap();
      dispatch(setCurrentSearchParams({ ...updatedParams, sessionId: sessionId }));
      dispatch(setTripPlannerParams({ ...updatedParams, sessionId: sessionId }));
      const newItems = generateInitialPlannerItems(updatedParams);
      dispatch(setPlannerItems(newItems));
      if (hotels.length > 0) {
        const validHotels = hotels.filter(hotel => {
          const hotelCheckIn = new Date(hotel.booking.checkInDate);
          const hotelCheckOut = new Date(hotel.booking.checkOutDate);
          const newStart = new Date(updatedParams.checkInDate);
          const newEnd = new Date(updatedParams.checkOutDate);
          return hotelCheckIn < newEnd && hotelCheckOut > newStart;});
        dispatch(setHotels(validHotels));
      }
    } catch (error) {console.error('Error updating search params:', error);}
  }
  setShowModifySearch(false);
};
const handleTabChange = (event: React.SyntheticEvent, newValue: 'planner' | 'hotel') => {setActiveTab(newValue);};
const hotelsWithPlannerDates = getHotelsWithPlannerDates();

const handleClientFormSubmit = async ({name,options,marginTotal,grandTotal,bookingRef: submittedBookingRef,travelDate,currency: submittedCurrency, bookingStatus,destination,isEditMode: formIsEditMode,currentBookingRef: formBookingRef,...restClientData}) => {
  try {
    setClientFormOpen(false);
    let finalBookingRef;
    if (isEditMode || formIsEditMode) {finalBookingRef = originalLeadId || editingClientData?.originalLeadId ||editingClientData?.bookingNo || formBookingRef || submittedBookingRef; } 
    else {finalBookingRef = submittedBookingRef;}
    const loginEmail = localStorage.getItem('userEmail') || localStorage.getItem('email') || 'jyotisaini5614@gmail.com';
    const finalCurrency = submittedCurrency || currency || 'USD';
    const finalGrandTotal = grandTotal || 0;
    const marginValue = parseFloat(String(marginTotal)) || 0;
    const roomsList = currentSearchParams?.rooms?.map(room => ({adults: room.adults || 0,cwb: room.cwb || 0,cnb: room.cnb || 0, infants: room.infants || 0})) || [{ adults: 2, cwb: 0, cnb: 0, infants: 0 }];
    const totalPersonsCount = roomsList.reduce((total, room) => total + room.adults + room.cwb + room.cnb + room.infants, 0);
    const adultCount = roomsList.reduce((total, room) => total + room.adults, 0);
    const cnbCount = roomsList.reduce((total, room) => total + room.cnb, 0);
    const cwbCount = roomsList.reduce((total, room) => total + room.cwb, 0);
      const hotelDetails = hotelsWithPlannerDates.map(hotel => ({
      hotelName: hotel.hotel?.hotelName || hotel.hotel?.name || 'Unknown Hotel',
      roomType: hotel.booking?.roomType || hotel.room?.roomCategory || 'Standard',
      mealPlan: hotel.booking?.mealPlan || hotel.room?.mealPlan || 'None',
      checkInDate: hotel.booking?.checkInDate || new Date().toISOString(),
      checkOutDate: hotel.booking?.checkOutDate || new Date().toISOString(),
      nights: parseInt(String(hotel.booking?.nights)) || 1,
      totalPrice: parseFloat(String(hotel.booking?.totalPrice)) || 0,
      currency: hotel.booking?.currency || finalCurrency,
      starRating: String(hotel.hotel?.starRating || hotel.hotel?.starRatings || 'No Rating'),
      city: hotel.city || hotel.hotel?.city || currentSearchParams?.city || 'Unknown City',
      description: hotel.hotel?.description || 'No description available',
      totalRooms: String(hotel.booking?.totalRooms || 1),
      roomOccupancy: hotel.hotel?.roomsOccupancyDetails || null}));
    const processedPlannerItems = plannerItems.map(item => {
      const dayTours = tours.filter(tour => tour.specificDayId === item.id);
      let tourData: TourData | null = null;
      if (dayTours.length > 0) {
        const uniqueTours = Array.from(new Map(dayTours.map(t => [t.tours?.uniqueId, t])).values());
        const firstTour = uniqueTours[0];
        const tourPrice = parseFloat(String(firstTour.tours?.details?.booking?.totalPrice || 0));
        const activityDetails = firstTour.tours?.details?.booking?.activityDetails || [];
        tourData = {
          name: firstTour.tours?.name || 'Unknown Tour',
          description: firstTour.tours?.details?.tour?.description || '',
          duration: firstTour.tours?.details?.tour?.eventDuration || 'N/A',
          currency: firstTour.tours?.details?.booking?.currency || finalCurrency,
          price: tourPrice,
          city: currentSearchParams?.city || 'Unknown City',
          eventDuration: firstTour.tours?.details?.tour?.eventDuration || 'N/A',
          details: firstTour.tours?.details || {},
          activities: activityDetails.map((activity: any) => ({
            name: activity.name || '',
            price: parseFloat(String(activity.price || 0)),
            currency: activity.currency || 'USD' })),
            carType: firstTour.tours?.details?.booking?.carType ? [{
            carType: firstTour.tours.details.booking.carType.type || 'N/A',
            price: parseFloat(String(firstTour.tours.details.booking.carType.price || 0))
          }] : []};}
      return {date: item.date || 'N/A', tours: tourData,transfer: null, meals: null};
    });
    const newLead = {
      id: finalBookingRef,
      _id: (isEditMode || formIsEditMode) ? originalLeadId : undefined,
      sessionId: sessionId,
      clientName: name,
      createdByEmail: loginEmail,
      creationDate: (isEditMode || formIsEditMode) ? (editingClientData?.creationDate || new Date().toISOString()) :  new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      bookingTime: (isEditMode || formIsEditMode) ? (editingClientData?.bookingTime || new Date().toISOString()) :  new Date().toISOString(),
      status: bookingStatus || 'Confirm',
      destinations: currentSearchParams?.city || destination || '',
      country: currentSearchParams?.country || 'Azerbaijan',
      travelDate: currentSearchParams?.checkInDate || travelDate || new Date().toISOString(),
      nights: Number(currentSearchParams?.nights || nights || 1),
      totalAmount: finalGrandTotal + marginValue,
      paidAmount: parseFloat(String(editingClientData?.paidAmount || 0)),
      pendingAmount: finalGrandTotal + marginValue,
      referenceId: finalBookingRef,
      invoice: `/invoices/${finalBookingRef}`,
      voucher: `/vouchers/${finalBookingRef}`,
      totalPersons: String(totalPersonsCount),
      totalRooms: roomsList,
      adult: adultCount,
      cnb: cnbCount,
      cwb: cwbCount,
      bookingNo: finalBookingRef,
      originalLeadId: originalLeadId || finalBookingRef,
      options: options || 'package',
      hotelName: hotelDetails[0]?.hotelName || '',
      hotelDetails: hotelDetails,
      plannerItems: processedPlannerItems,
      modificationCount: (editingClientData?.modificationCount || 0) + (isEditMode || formIsEditMode ? 1 : 0)
    };
    if (isEditMode || formIsEditMode) {
      await updateLead({id: originalLeadId || finalBookingRef,  lead: newLead }).unwrap();
      alert(`Lead updated successfully! Booking: ${finalBookingRef}`);
    } else {
      await submitLead(newLead).unwrap();
      alert('Lead created successfully!');
    }
    setShowThankYou(true);
    window.open(`/tour-package-pdf?bookingRef=${finalBookingRef}`, '_blank');
  } catch (err: any) {
    console.error(' Error:', err);
    alert(`Failed: ${err?.data?.message || err?.message || 'Unknown error'}`);
  }
};

  useEffect(() => {
    const editModeData = tripPlannerState.editModeData;
    if (editModeData && editModeData.isEditMode) {
      setIsEditMode(true);
      setOriginalLeadId(editModeData.originalLeadId || editModeData.leadId || editModeData.bookingRef);
      if (editModeData.clientData) {
        const clientDataToSet = {
          ...editModeData.clientData,
          name: editModeData.clientData.clientName || editModeData.clientData.name,
          bookingNo: editModeData.bookingRef || editModeData.clientData.bookingNo,
          originalLeadId: editModeData.originalLeadId || editModeData.leadId,
          creationDate: editModeData.creationDate || editModeData.clientData.creationDate,
          bookingTime: editModeData.bookingTime || editModeData.clientData.bookingTime,
          modificationCount: editModeData.modificationCount || 0,
          paidAmount: editModeData.paidAmount || editModeData.clientData.paidAmount || 0,
          totalAmount: editModeData.totalAmount || editModeData.clientData.totalAmount || 0,
          pendingAmount: editModeData.pendingAmount || editModeData.clientData.pendingAmount || 0,
          destination: editModeData.clientData.destination || currentSearchParams?.city || ''
        };
        setEditingClientData(clientDataToSet);
      }
    }
  }, [tripPlannerState.editModeData]);
const handleDownloadPDF = () => {
    if (isEditMode && !editingClientData?.name) {
      console.warn('Edit mode active but no client data. Loading from Redux...');
      const editData = tripPlannerState.editModeData;
      if (editData && editData.clientData) {
        setEditingClientData({ ...editData.clientData, name: editData.clientData.clientName || editData.clientData.name, bookingNo: editData.bookingRef || originalLeadId,originalLeadId: originalLeadId});
      }
    }
    setClientFormOpen(true);
};
  const formatDate = (dateString: string) => {if (!dateString) return ''; try {const date = new Date(dateString);if (isNaN(date.getTime())) {if (dateString.includes('-')) { const [day, rest] = dateString.split('-'); return `${day}-${rest.split(' ')[0]}`;}return dateString;}return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });} catch (e) {return dateString; }};
  const formatYear = (dateString: string) => {if (!dateString) return '';try {const date = new Date(dateString);if (isNaN(date.getTime())) {if (dateString.includes(' ')) {return dateString.split(' ')[1];}return ''; }return date.getFullYear().toString();} catch (e) {return '';} };
  const formatHeaderDate = (dateString: string | undefined) => { if (!dateString) return '';try { const date = new Date(dateString); if (isNaN(date.getTime())) return '';return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;} catch (e) { return '';}};
  const displayCheckInDate = formatHeaderDate(currentSearchParams?.checkInDate);
  const displayCheckOutDate = formatHeaderDate(currentSearchParams?.checkOutDate);
  const displayNights = currentSearchParams?.nights || nights || '1';
  const displayCity = currentSearchParams?.city || '';
  const packageType = currentSearchParams?.packageType || 'hotel-land';
  const showHotelTab = packageType === 'hotel-land';

  if (!isDataLoaded) {
    return (
      <Box className="trip-planner-page">
        <Container sx={{ paddingLeft: '0rem', paddingRight: '0rem', maxWidth: '100%' }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}><Typography variant="h6">Loading trip data...</Typography> </Box>
        </Container>
      </Box>
    );
  }
  return (
    <Box className="trip-planner-page">
      <Container sx={{ paddingLeft: '0rem', paddingRight: '0rem', maxWidth: '100%' }}>
        {!showThankYou && (
          <>
            <Box className="search-info heading">
              <Typography variant="h5" component="h1">{displayCity} | {displayNights} NIGHT/S | {displayCheckInDate} - {displayCheckOutDate}</Typography>
              <Button className="modify-search" onClick={() => setShowModifySearch(!showModifySearch)}> Modify search<ArrowDownIcon width="16" height="16" fill="#000" /></Button>
            </Box>
            {showModifySearch && (
              <div className="modify-search-container">
                <Customize  isModifying={true} initialValues={currentSearchParams}  onSearchComplete={handleSearchComplete} />
              </div>
            )}
            <Box sx={{ mb: 0, height: '2rem' }} className='tablist-container'>
              <Tabs className='tablist-btn' value={activeTab} onChange={handleTabChange} sx={{ color: 'black' }}>
                <Tab  className='planner-btn' value="planner"  label="Planner"  style={{ color: activeTab === 'planner' ? 'white' : 'black' }}  sx={{ color: activeTab === 'planner' ? 'black' : 'white',  bgcolor: activeTab === 'planner' ? 'grey' : 'white', marginLeft: '0rem',  width: '10rem'   }}   />
                {showHotelTab && (
                  <Tab className='hotel-btn'  value="hotel"  label="Hotel Details"  style={{ color: activeTab === 'planner' ? 'black' : 'white' }} sx={{ color: activeTab === 'planner' ? 'black' : 'white',  bgcolor: activeTab === 'planner' ? 'white' : 'grey',  marginLeft: '0.5rem',  width: '10rem'  }}  />)}
              </Tabs>
            </Box>
          </>
        )}
        {activeTab === 'planner' && !showThankYou && (
          <Paper elevation={3} className="planner-table-container">
            <Box className="planner-table">
              <Box className="table-header">
                <Box className="header-cell date-cell">Date</Box>
                {packageType === 'hotel-land' && <Box className="header-cell">Hotel</Box>}
                <Box className="header-cell">Tours</Box>
              </Box>
              {plannerItems && plannerItems.length > 0 ? (
                plannerItems.map((plannerItem) => (
                  <Box key={plannerItem.id} className="table-row">
                    <Box className="cell date-cell">
                      <Typography className='date-cell-1' variant="body2"> {formatDate(plannerItem.date)}</Typography>
                      <Typography className='date-cell-2' variant="body2"> {formatYear(plannerItem.date)}</Typography>
                    </Box>
                    {packageType === 'hotel-land' && (
                      <Box className="cell">
                        {plannerItem.hotel ? (
                          <Box className="selected-hotel">
                            <Box>
                              <Typography className='hotel_name'  variant="body2"  sx={{  fontSize: '0.8rem',  textOverflow: 'ellipsis',    whiteSpace: 'nowrap',  overflow: 'hidden',  textAlign: 'center',  maxWidth: '100%' }} > {plannerItem.hotel.name} </Typography>
                            </Box>
                            <Box>
                              <IconButton  sx={{ position: 'absolute', right: 0 }}  className="remove-button"  onClick={() => handleRemoveHotel(plannerItem.hotel.details.uniqueId)}  aria-label="Remove hotel"  size="small" ><DeleteOutline sx={{ color: '#777777', fontSize: '1rem' }} />
                              </IconButton>
                            </Box>
                          </Box>
                        ) : (
                          <Box display="flex" justifyContent="flex-end">
                            <IconButton className="add-button"  onClick={() => handleHotelSelection(plannerItem.id)}  sx={{ color: '#777777', fontSize: '1rem', '& .MuiSvgIcon-root': { fill: 'grey' }  }}> <AddCircleOutline className='add-btn' /> </IconButton>
                          </Box>
                        )}
                      </Box>
                    )}
                    <Box className="cell">
                      {plannerItem.tours ? (
                        <Box className="selected-tour">
                          <Box className='tour-container'>
                            <Typography  variant="body2"  sx={{ fontSize: '0.8rem',  textOverflow: 'ellipsis', textAlign: 'center', maxWidth: '100%', color: '#000' }}> 
                              {(() => {if (Array.isArray(plannerItem.tours)) {const uniqueNames = [...new Set(plannerItem.tours.map(t => t.name).filter(Boolean))];  return uniqueNames.join(', ') || 'Tour Added';} return plannerItem.tours.name || 'Tour Added'; })()}
                            </Typography>
                          </Box>
                          <Box>
                            <IconButton  sx={{ position: 'absolute', right: 0 }} className="remove-button"  onClick={() => handleRemoveTour(plannerItem)}  aria-label="Remove tour"  size="small" >
                              <DeleteOutline sx={{ color: '#777777', fontSize: '1rem' }} />
                            </IconButton>
                          </Box>
                        </Box>
                      ) : (
                        <Box display="flex" justifyContent="flex-end">
                          <IconButton className="add-button"   onClick={() => handleAddItem(plannerItem.id, 'tours')}aria-label="Add tours"  sx={{  color: '#777777', fontSize: '1rem', "& .MuiSvgIcon-root": { fill: 'grey' }  }} > <AddCircleOutline className='add-btn' />
                          </IconButton>
                        </Box>
                      )}
                    </Box>
                  </Box>
                ))
              ) : (
                <Box className="table-row">
                  <Box className="cell" sx={{ gridColumn: '1 / -1', textAlign: 'center', py: 2 }}>
                    <Typography variant="body2" color="text.secondary">Loading planner items... </Typography>
                  </Box>
                </Box>
              )}
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
                  <TextField  type="number" value={marginTotal}  onChange={handleMarginChange}  size="small" sx={{ width: '4rem', height: '2rem' }} />
                </Box>
              </Box>
              <Box className="total-row">
                <Typography className="label">Final Amt:</Typography>
                <Typography className="value"> {currency} {(grandTotal + (parseFloat(marginTotal) || 0)).toFixed(2)} </Typography>
              </Box>
            </Box>
            <Box className="action-buttons">
              <Button color="error" className="proceed-button" onClick={handleDownloadPDF}> Download Now</Button>
              <Button className="cancel-button" onClick={onCancel}>Cancel    </Button>
            </Box>
          </Paper>
        )}
          {activeTab === 'hotel' && showHotelTab && !showThankYou && (
          <Paper elevation={3} className="hotel-details-container" sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
            <TripDetails hotels={getHotelsWithPlannerDates()} totalPrice={undefined} />
          </Paper>
          )}
        {showThankYou && (
          <Paper elevation={3}  className="thank-you-container"  sx={{ padding: '2rem', margin: '2rem 0', textAlign: 'center',  bgcolor: '#f8f8f8',  border: '1px solid #e0e0e0', borderRadius: '8px' }}>
            <Typography variant="h4" sx={{ color: '#4CAF50', marginBottom: '1rem' }}> Thank You!</Typography>
            <Typography variant="body1" sx={{ marginBottom: '1rem', fontSize: '1.3rem' }}>Your PDF is being generated in a new tab. </Typography>
          </Paper>
        )}
      </Container>
      {clientFormOpen && (<ClientDetailsForm  open={clientFormOpen}  isEditMode={isEditMode}  onClose={() => setClientFormOpen(false)}  onSubmit={handleClientFormSubmit} bookingRef={bookingRef} destinations={currentSearchParams?.city} nights={currentSearchParams?.nights?.toString() || displayNights.toString()} travelDate={currentSearchParams?.checkInDate} grandTotal={grandTotal + (parseFloat(marginTotal) || 0)} marginTotal={marginTotal}  initialClientData={editingClientData} originalLeadId={originalLeadId || editingClientData?.id || editingClientData?._id}  hotelName={''}  currency={0} currentSearchParams={''}  hotels={''} plannerItems={''} hotelDetails={[]}  tourActivities={[]} activities={[]}  persons={''}   selectedHotels={hotels} selectedPlannerItems={plannerItems}  /> )}
    </Box>
  );
};
export default TripPlanner;