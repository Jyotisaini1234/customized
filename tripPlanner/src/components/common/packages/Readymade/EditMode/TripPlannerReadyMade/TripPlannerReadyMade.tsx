import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Box, Container, Typography, Button, Paper, Tabs, Tab, IconButton, TextField, CircularProgress, Grid } from "@mui/material";
import { AddCircleOutline, DeleteOutline } from "@mui/icons-material";
import './TripPlannerReadyMade.scss';
import { useLazyLoadPlannerDataFromBackendQuery, useRemoveHotelFromPlannerMutation, useRemoveTourFromPlannerMutation, useSaveItineraryToBackendMutation, useSaveSearchParamsMutation, useSubmitPackageDataMutation, useSyncHotelToBackendMutation, useSyncTourToBackendMutation } from "../../../../../../api/TourAPI.tsx";
import { TRIP_PLANNER } from "../../../../../../utils/ApiConstants.ts";
import { setSessionId, setSearchParams, setPlannerItems, setHotels, addHotel, removeHotel, setActivities, addActivity, removeActivity, setGrandTotal,loadBackendData,clearPlannerData,selectPlanner, removeTour} from "../../../../../../store/slices/plannerSlice.ts";
import { PlannerItem } from "../../../../../../types/tour.types.ts";

const TripPlannerReadyMade: React.FC = () => {
const location = useLocation();
const navigate = useNavigate();
const dispatch = useDispatch();
const plannerState = useSelector(selectPlanner);
const { plannerItems = [], hotels = [], activities = [], transfers = [], grandTotal = 0, sessionId = null, searchParams = null } = plannerState;
const [activeTab, setActiveTab] = useState<string>('planner');
const [showHotelTab, setShowHotelTab] = useState<boolean>(false);
const [showThankYou, setShowThankYou] = useState<boolean>(false);
const [marginTotal, setMarginTotal] = useState<string>('0');
const [loading, setLoading] = useState<boolean>(false);
const [submitPackageData] = useSubmitPackageDataMutation();
const handleMarginChange = (event: React.ChangeEvent<HTMLInputElement>) => { setMarginTotal(event.target.value);};
const onCancel = () => { navigate(-1);};
const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {setActiveTab(newValue);};
const formatDate = (date: any) => {const d = new Date(date);if (isNaN(d.getTime())) return 'Invalid Date';return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });};
const formatYear = (date: any) => {const d = new Date(date);if (isNaN(d.getTime())) return 'Invalid Year';return d.getFullYear().toString();};
const isDeletingRef = useRef(false);
const [syncHotelToBackend] = useSyncHotelToBackendMutation();
const [syncTourToBackend] = useSyncTourToBackendMutation();
const [removeHotelFromPlanner] = useRemoveHotelFromPlannerMutation();
const [removeTourFromPlanner] = useRemoveTourFromPlannerMutation();
const [saveSearchParams] = useSaveSearchParamsMutation();
const [loadPlannerDataTrigger] = useLazyLoadPlannerDataFromBackendQuery();
const [saveItinerary] = useSaveItineraryToBackendMutation();

useEffect(() => {
  const initialize = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlSessionId = urlParams.get('sessionId');
    if (urlSessionId && sessionId !== urlSessionId) {
      dispatch(setSessionId(urlSessionId));
      try {
        const backendData = await loadPlannerDataTrigger(urlSessionId).unwrap();
        if (backendData.searchParams) { dispatch(setSearchParams(backendData.searchParams));}
        let mappedItems: PlannerItem[] = [];
        if (backendData.searchParams) {
          const checkInDate = new Date(backendData.searchParams.checkInDate || new Date());
          const nights = backendData.searchParams.nights || backendData.searchParams.totalNights || 6;
          const totalDays = nights + 1;
          let currentDate = new Date(checkInDate);
          for (let i = 0; i < totalDays; i++) {
            mappedItems.push({ id: `day-${i + 1}`, date: new Date(currentDate),dateObj: new Date(currentDate).toISOString(),hotel: null,tours: null,transfer: null,itinerary: null,  });
            currentDate.setDate(currentDate.getDate() + 1);
          }
        }
        if (backendData.allHotels?.length > 0) {
          const backendHotels = backendData.allHotels.map((h: any) => ({
            id: h.hotel?.id,
            name: h.hotel?.hotelName,
            destination: h.hotel?.destination || h.booking?.city,
            city: h.booking?.city || h.hotel?.city,
            nights: parseInt(h.booking?.nights || '1'),
            price: Number(h.hotelSpecificDetails?.totalPrice || h.booking?.totalPrice || 0),
            rating: h.hotel?.starRating,
            checkInDate: h.booking?.checkInDate,
            checkOutDate: h.booking?.checkOutDate,
            specificDayId: h.specificDayId,
            uniqueId: h.uniqueId,
            isAdditional: true,
            roomType: h.room?.roomCategory,
            mealPlan: h.room?.mealPlan,
            img: h.hotel?.imageUrl,
            rooms: h.booking?.totalRooms || 1,
            isPackageHotel: h.isPackageHotel || false,
          }));
          dispatch(setHotels(backendHotels));
          const sortedHotels = [...backendHotels].sort((a, b) => {
            const aIndex = mappedItems.findIndex(item => item.id === a.specificDayId);
            const bIndex = mappedItems.findIndex(item => item.id === b.specificDayId);
            return aIndex - bIndex;
          });
          let lastHotelDayIndex = -1;
          sortedHotels.forEach((hotel: any) => {
            const startDayIndex = mappedItems.findIndex(item => item.id === hotel.specificDayId);
            if (startDayIndex !== -1) {
              const naturalEndDay = startDayIndex + hotel.nights - 1;
              if (naturalEndDay > lastHotelDayIndex) { lastHotelDayIndex = naturalEndDay; }
            }
          });
          const totalDays = mappedItems.length;
          const gapDays = totalDays - 1 - lastHotelDayIndex;
          const shouldExtendLastHotel = gapDays === 1;
          sortedHotels.forEach((hotel: any, hotelIndex: number) => {
            dispatch(addHotel(hotel));
            const startDayIndex = mappedItems.findIndex(item => item.id === hotel.specificDayId);
            if (startDayIndex !== -1) {
              const naturalEndDay = startDayIndex + hotel.nights - 1;
              const isLastHotel = hotelIndex === sortedHotels.length - 1;
              const endDayIndex = (isLastHotel && shouldExtendLastHotel) ? mappedItems.length - 1 : naturalEndDay;
              for (let dayOffset = 0; dayOffset <= (endDayIndex - startDayIndex); dayOffset++) {
                const currentDay = startDayIndex + dayOffset;
                if (currentDay < mappedItems.length) {
                  mappedItems[currentDay] = {
                    ...mappedItems[currentDay],
                    hotel: {
                      ...hotel,
                      displayInfo: {
                        isFirstDay: dayOffset === 0,
                        dayNumber: dayOffset + 1,
                        totalDays: endDayIndex - startDayIndex + 1,
                      }
                    }
                  };
                }
              }
            }
          });
        }
        if (backendData.plannerItems?.length > 0) {
          backendData.plannerItems.forEach((backendItem: any) => {
            const itemIndex = mappedItems.findIndex(item => item.id === backendItem.id);
            if (itemIndex !== -1) {
              let tourData: any = null;
              if (backendItem.tours?.details) {
                const tourDetails = backendItem.tours.details;
                tourData = {
                  id: tourDetails.tour?.id || tourDetails.tourDetails?.id,
                  name: tourDetails.tour?.sightName || tourDetails.tourDetails?.sightName,
                  price: Number(tourDetails.booking?.totalPrice || tourDetails.tour?.price || 0),
                  currency: tourDetails.booking?.currency || 'USD',
                  date: tourDetails.booking?.date,
                  commuteType: tourDetails.booking?.commuteType,
                  pax: tourDetails.booking?.pax,
                  description: tourDetails.tour?.description || tourDetails.tourDetails?.description,
                  activities: tourDetails.activities || tourDetails.booking?.activityDetails || [],
                  selectedActivities: tourDetails.selectedActivities || tourDetails.booking?.selectedActivities || {},
                  uniqueId: tourDetails.uniqueId,
                  isAdditional: tourDetails.isAdditional !== false,
                  specificDayId: backendItem.id,
                };
              } else if (backendItem.tours) {
                tourData = {
                  id: backendItem.tours.id,
                  name: backendItem.tours.name || backendItem.tours.sightName,
                  price: Number(backendItem.tours.price || backendItem.tours.totalPrice || 0),
                  currency: backendItem.tours.currency || 'USD',
                  date: backendItem.tours.date,
                  commuteType: backendItem.tours.commuteType,
                  pax: backendItem.tours.pax,
                  description: backendItem.tours.description,
                  activities: backendItem.tours.activities || [],
                  selectedActivities: backendItem.tours.selectedActivities || {},
                  uniqueId: backendItem.tours.uniqueId,
                  isAdditional: backendItem.tours.isAdditional !== false,
                  specificDayId: backendItem.id,
                };
              }
              if (backendItem.itinerary) {
                const itineraryData = {
                  title: backendItem.itinerary.title || backendItem.itinerary.name || '',
                  description: backendItem.itinerary.description || '',
                  activities: backendItem.itinerary.activities || [],
                  day: backendItem.itinerary.day,
                  price: Number(backendItem.itinerary.price || 0),
                };
                mappedItems[itemIndex] = { ...mappedItems[itemIndex],  itinerary: itineraryData };
                if (!tourData) {
                  tourData = {
                    id: `itinerary-${backendItem.id}`,
                    name: itineraryData.title,
                    price: itineraryData.price,
                    currency: 'USD',
                    description: itineraryData.description,
                    uniqueId: `itinerary-${backendItem.id}`,
                    isAdditional: false,
                    specificDayId: backendItem.id,
                    isItinerary: true,
                  };
                }
              }
              if (tourData) {
                mappedItems[itemIndex] = { ...mappedItems[itemIndex], tours: tourData };
                if (!tourData.isItinerary && tourData.isAdditional) {
                  dispatch(addActivity(tourData));
                }
              }
            }
          });
        }
        dispatch(setPlannerItems(mappedItems as any));
        console.log('✅ Loaded from backend successfully');
        return;
      } catch (error) {
        console.error('❌ Backend load failed:', error);
      }
    }
    if (!location.state) return;
    if (plannerItems.length > 0 && sessionId === location.state?.sessionId) return;
    const stateData = location.state as any;
    const checkInDate = new Date(stateData.checkInDate || new Date());
    const nights = stateData.nights || stateData.totalNights || 3;
    const items: PlannerItem[] = [];
    let currentDate = new Date(checkInDate);
    for (let i = 0; i < nights + 1; i++) {
      items.push({ id: `day-${i + 1}`,date: new Date(currentDate),dateObj: new Date(currentDate).toISOString(),});
      currentDate.setDate(currentDate.getDate() + 1);
    }
    dispatch(setPlannerItems(items as any));
    dispatch(setSearchParams(stateData));
    let newSessionId = `readymade_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    dispatch(setSessionId(newSessionId));
    urlParams.set('sessionId', newSessionId);
    window.history.replaceState({}, '', `${window.location.pathname}?${urlParams.toString()}`);
    await saveSearchParams({...stateData,sessionId: newSessionId,isNewSearch: true,timestamp: Date.now()});
    const packageDetails = stateData.packageData?.packageDetails;
    if (!packageDetails) return;
    let finalItems = [...items];
    if (packageDetails.hotelOption?.[0]?.hotels) {
      const packageHotels = packageDetails.hotelOption[0].hotels.map((hotel: any, index: number) => ({
        id: `hotel-package-${index}`,
        name: hotel.name,
        destination: hotel.destination,
        city: hotel.destination,
        nights: hotel.nights || 1,
        price: hotel.price || 0,
        rating: hotel.star || 0,
        checkInDate: items[0]?.date?.toISOString?.() || new Date().toISOString(),
        checkOutDate: new Date(new Date(items[0]?.date || new Date()).getTime() + (hotel.nights || 1) * 24 * 60 * 60 * 1000).toISOString(),
        uniqueId: `package-${hotel.name.replace(/\s+/g, '-').toLowerCase()}-${index}`,
        isAdditional: false,
        roomType: hotel.roomType,
        mealPlan: hotel.mealPlan,
        img: hotel.img,
        rooms: 1,
        isPackageHotel: true,
      }));
      dispatch(setHotels(packageHotels));
      let currentDayIndex = 0;
      for (let hotelIndex = 0; hotelIndex < packageHotels.length; hotelIndex++) {
        const hotel = packageHotels[hotelIndex];
        const isLastHotel = hotelIndex === packageHotels.length - 1;
        const hotelWithDay = { ...hotel, specificDayId: `day-${currentDayIndex + 1}` };
        dispatch(addHotel(hotelWithDay));
        const startDayIndex = currentDayIndex;
        const endDayIndex = isLastHotel ? finalItems.length - 1 : currentDayIndex + hotel.nights - 1;
        for (let dayOffset = 0; dayOffset <= (endDayIndex - startDayIndex); dayOffset++) {
          const dayIndex = startDayIndex + dayOffset;
          if (dayIndex < finalItems.length) {
            finalItems[dayIndex] = {
              ...finalItems[dayIndex],
              hotel: {
                ...hotel,
                displayInfo: {
                  isFirstDay: dayOffset === 0,
                  dayNumber: dayOffset + 1,
                  totalDays: endDayIndex - startDayIndex + 1,
                }
              }
            };
          }
        }
        await syncHotelToBackend({
          hotel: {
            id: hotelWithDay.id,
            hotelName: hotelWithDay.name,
            starRating: hotelWithDay.rating,
            imageUrl: hotelWithDay.img,
            city: hotelWithDay.city,
            destination: hotelWithDay.destination
          },
          booking: {
            checkInDate: hotelWithDay.checkInDate,
            checkOutDate: hotelWithDay.checkOutDate,
            nights: hotelWithDay.nights.toString(),
            totalPrice: hotelWithDay.price,
            currency: 'USD',
            city: hotelWithDay.city,
            totalRooms: hotelWithDay.rooms || 1
          },
          room: {
            roomCategory: hotelWithDay.roomType || 'Standard',
            mealPlan: hotelWithDay.mealPlan || 'BB'
          },
          uniqueId: hotelWithDay.uniqueId,
          specificDayId: hotelWithDay.specificDayId,
          sessionId: newSessionId,
          isPackageHotel: hotelWithDay.isPackageHotel,
          dataType: 'hotel',
          timestamp: Date.now()
        });
        currentDayIndex += hotel.nights;
      }
    }
    if (packageDetails.itinerary?.length > 0) {
      finalItems = finalItems.map((item: any, index: number) => {
        if (packageDetails.itinerary[index]) {
          const itineraryData = {
            title: packageDetails.itinerary[index].title || '',
            description: packageDetails.itinerary[index].details || packageDetails.itinerary[index].description || '',
            activities: packageDetails.itinerary[index].activities || [],
            day: index + 1,
            price: Number(packageDetails.itinerary[index].price || 0),
          };
          const itineraryTour = {
            id: `itinerary-${item.id}`,
            name: itineraryData.title,
            price: itineraryData.price,
            currency: 'USD',
            description: itineraryData.description,
            uniqueId: `itinerary-${item.id}`,
            isAdditional: false,
            specificDayId: item.id,
            isItinerary: true,
          };

          return {...item,  itinerary: itineraryData, tours: itineraryTour };}
        return item;
      });
      for (let i = 0; i < finalItems.length; i++) {
        if (finalItems[i].itinerary) {
          try {
            await saveItinerary({specificDayId: finalItems[i].id,itinerary: finalItems[i].itinerary, sessionId: newSessionId, }).unwrap();
          } catch (error) {
            console.error(`❌ Failed to save itinerary for ${finalItems[i].id}:`, error);
          }
        }
      }
    }
    dispatch(setPlannerItems(finalItems as any));
  };

  initialize();
}, [location.pathname]);

useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const tourAdded = urlParams.get('tourAdded');
  const tourDataEncoded = urlParams.get('tourData');
  const specificDayId = urlParams.get('specificDayId');
  if (tourAdded !== 'true' || !tourDataEncoded || !specificDayId || plannerItems.length === 0) return;
  try {
    const tourData = JSON.parse(decodeURIComponent(tourDataEncoded));
    const newTour = {
      id: tourData.tour?.id || tourData.tourDetails?.id,
      name: tourData.tour?.sightName || tourData.tourDetails?.sightName,
      price: tourData.booking?.totalPrice || 0,
      currency: tourData.booking?.currency || 'USD',
      date: tourData.booking?.date,
      commuteType: tourData.booking?.commuteType,
      pax: tourData.booking?.pax,
      description: tourData.tour?.description || tourData.tourDetails?.description || '',
      activities: tourData.activities || tourData.booking?.activityDetails || [],
      selectedActivities: tourData.booking?.selectedActivities || {},
      activityDetails: tourData.booking?.activityDetails || [],
      uniqueId: tourData.uniqueId,
      isAdditional: true,
      specificDayId: specificDayId,
    };
    const existingItem = plannerItems.find((item: any) => item.id === specificDayId);
    if (existingItem?.tours?.uniqueId === newTour.uniqueId) {
      urlParams.delete('tourAdded');
      urlParams.delete('tourData');
      urlParams.delete('addedToPlanner');
      urlParams.delete('timestamp');
      window.history.replaceState({}, '', `${window.location.pathname}?${urlParams.toString()}`);
      return;
    }
    const updatedPlannerItems = plannerItems.map((item: any) => {
      if (item.id === specificDayId) { return { ...item, tours: newTour };}
      return item;
    });
    dispatch(setPlannerItems(updatedPlannerItems as any));
    dispatch(addActivity(newTour));
    const sessionId = urlParams.get('sessionId');
    if (sessionId) {
      syncTourToBackend({
        tour: {
          id: newTour.id, 
          sightName: newTour.name, 
          description: newTour.description
        },
        booking: {
          totalPrice: newTour.price, 
          currency: newTour.currency, 
          date: newTour.date, 
          commuteType: newTour.commuteType, 
          pax: newTour.pax,
          activityDetails: newTour.activities,
          selectedActivities: newTour.selectedActivities
        },
        activities: newTour.activities,
        selectedActivities: newTour.selectedActivities,
        activityDetails: newTour.activityDetails,
        uniqueId: newTour.uniqueId,
        specificDayId: specificDayId,
        sessionId: sessionId,
        isAdditional: true,
        dataType: 'tour',
        timestamp: Date.now()
      }).then(() => {
        console.log('✅ Tour saved to backend with activities:', newTour.activities);
      }).catch(err => {
        console.error('❌ Tour save failed:', err);
      });
    }
    urlParams.delete('tourAdded');
    urlParams.delete('tourData');
    urlParams.delete('addedToPlanner');
    urlParams.delete('timestamp');
    window.history.replaceState({}, '', `${window.location.pathname}?${urlParams.toString()}`);
  } catch (error) {
    console.error('❌ Tour add error:', error);
  }
}, [window.location.search, plannerItems]);

const handleRemoveTour = async (plannerItem: any) => {
  if (!plannerItem.tours && !plannerItem.itinerary) {   console.warn('❌ No tour to remove'); return; }
  if (isDeletingRef.current) {console.warn('⚠️ Delete already in progress, skipping...');return;}
  isDeletingRef.current = true;
  const tourToRemove = plannerItem.tours || plannerItem.itinerary;
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('sessionId');
    const tourUniqueId = tourToRemove?.uniqueId || `itinerary-${plannerItem.id}`;
    if (!sessionId) {
      console.error('❌ SessionId is missing!');
      isDeletingRef.current = false;
      return;
    }
    if (tourToRemove.isAdditional && !tourToRemove?.isItinerary) {
      dispatch(removeActivity(tourUniqueId));
    }
    const updatedPlannerItems = plannerItems.map((item: any) => {
      if (item.id === plannerItem.id) {const { tours, itinerary, ...rest } = item;
      return { ...rest, tours: null, itinerary: null }; }
      return item;
    });
    dispatch(setPlannerItems(updatedPlannerItems as any));
    removeTourFromPlanner({ uniqueId: tourUniqueId, sessionId: sessionId,specificDayId: plannerItem.id }).unwrap()
      .then(() => {console.log('✅ Tour removed from backend'); })
      .catch((backendError: any) => { console.error('❌ Backend delete failed:', backendError); });
  } catch (error: any) {
    console.error('❌ Delete operation failed:', error);
  } finally {
    setTimeout(() => {
      isDeletingRef.current = false;
    }, 500);
  }
};

const handleRemoveHotel = async (plannerItem: any) => {
      if (!plannerItem.hotel) return;
      const hotelToRemove = plannerItem.hotel;
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('sessionId');
        if (sessionId && hotelToRemove.uniqueId) {
          await removeHotelFromPlanner({uniqueId: hotelToRemove.uniqueId,sessionId: sessionId}).unwrap();}
        const updatedPlannerItems = plannerItems.map((item: any) => {
          if (item.hotel?.uniqueId === hotelToRemove.uniqueId) {return { ...item, hotel: null };}
          return item;
        });
        dispatch(setPlannerItems(updatedPlannerItems as any));
      } catch (error) {
        console.error(' Backend delete failed:', error);
      }
};

const handleHotelSelection = async (itemId: string) => {
    const plannerItem = plannerItems.find((item: any) => item.id === itemId);
    if (!plannerItem) return;
    const itemDate = new Date(plannerItem.date);
    const dayNumber = parseInt(itemId.replace('day-', '')) - 1;
    const checkInDate = new Date(itemDate);
    const checkOutDate = new Date(itemDate);
    checkOutDate.setDate(checkOutDate.getDate() + 2);
    const hotelSearchParams = {...searchParams,
        checkInDate: checkInDate.toISOString(),
        checkOutDate: checkOutDate.toISOString(),
        nights: 2,
        specificDayId: itemId,
        sessionId: sessionId,
        fromReadymadePackage: true,
        isHotelSpecific: true,
    };
    navigate('/trip-planner-area', { state: hotelSearchParams });
    };

const handleAddTour = (itemId: string) => {
    const plannerItem = plannerItems.find((item: any) => item.id === itemId);
    if (!plannerItem) return;
    const itemDate = new Date(plannerItem.date);
    const tourSearchParams = {
        ...searchParams,
        city: searchParams?.city || 'Batumi',
        country: searchParams?.country || 'Georgia',
        checkInDate: itemDate.toISOString(),
        checkOutDate: itemDate.toISOString(),
        adults: searchParams?.adults || 2,
        children: searchParams?.children || 0,
        cwb: searchParams?.cwb || 0,
        cnb: searchParams?.cnb || 0,
        pax: (searchParams?.adults || 2) + (searchParams?.children || 0),
        fromTripPlanner: true,
        specificDayId: itemId,
        sessionId: sessionId || '',
        isReadymadePackage: true,};
    const tourSelectionUrl = new URL(TRIP_PLANNER);
    Object.keys(tourSearchParams).forEach(key => {
        const value = tourSearchParams[key];
        if (value !== null && value !== undefined) {tourSelectionUrl.searchParams.set(key, value.toString()); }
    });
    window.location.href = tourSelectionUrl.toString();
};

const calculateTotal = () => {
  let total = 0;
  const processedHotels = new Set();
  const processedTours = new Set();
  let hasAnyHotel = false;
  let hasAnyTour = false;
  let hasPackageItems = false;
  plannerItems.forEach((item: any) => {
    if (item.hotel) hasAnyHotel = true;
    if (item.tours || item.itinerary) hasAnyTour = true;
    if (item.hotel?.isPackageHotel || (item.tours?.isItinerary && !item.tours?.isAdditional)) {
      hasPackageItems = true;
    }
  });
  if (searchParams?.pricing?.totalPrice && hasPackageItems) {
      total = Number(searchParams.pricing.totalPrice);
  } else {
      console.log('⚠️ No base package price - all package items removed');
  }
  plannerItems.forEach((item: any) => {
      if (item.hotel && !item.hotel.isPackageHotel) {
          const hotelKey = item.hotel.uniqueId;
          if (!processedHotels.has(hotelKey) && item.hotel.displayInfo?.isFirstDay) {
              const hotelPrice = Number(item.hotel.price || 0);
              total += hotelPrice;
              processedHotels.add(hotelKey);
          }
      }
      
      if (item.tours) {
        const tourKey = item.tours.uniqueId;
        const tourPrice = Number(item.tours.price || 0);
        if (!processedTours.has(tourKey)) {
            if (item.tours.isAdditional && !item.tours.isItinerary) {
                total += tourPrice;
                processedTours.add(tourKey);
            } else if (item.tours.isItinerary && tourPrice > 0) {
                total += tourPrice;
                processedTours.add(tourKey);
            } else {
                console.log(`⏭️ Skipped tour ${item.tours.name}: isAdditional=${item.tours.isAdditional}, isItinerary=${item.tours.isItinerary}, price=${tourPrice}`);
            }
        }
      }
      if (item.itinerary && !item.tours) {
          const itineraryPrice = Number(item.itinerary.price || 0);
          const itineraryKey = `itinerary-${item.id}`;
          if (!processedTours.has(itineraryKey) && itineraryPrice > 0) {total += itineraryPrice;  processedTours.add(itineraryKey);}
      }
      if (item.transfer && !item.transfer.isPackageTransfer) {total += Number(item.transfer.price || 0); }
  });
  dispatch(setGrandTotal(total));
};
const handleDownloadPDF = async () => {
  setLoading(true);
  try {
      const hotelDateMap = new Map();
      hotels.forEach((hotel) => {
        const hotelDays = plannerItems.filter((item: any) => 
          item.hotel?.uniqueId === hotel.uniqueId || item.hotel?.id === hotel.id
        );
        
        if (hotelDays.length > 0) {
          const actualCheckIn = new Date(hotelDays[0].date);
          const lastDay = new Date(hotelDays[hotelDays.length - 1].date);
          lastDay.setDate(lastDay.getDate() + 1);
          
          hotelDateMap.set(hotel.uniqueId || hotel.id, {
            checkInDate: actualCheckIn.toISOString(),
            checkOutDate: lastDay.toISOString(),
            nights: hotelDays.length
          });
        }
      });

      const dbData = {
          tripDetails: {
              destination: searchParams?.city,
              country: searchParams?.country,
              checkInDate: searchParams?.checkInDate,
              checkOutDate: searchParams?.checkOutDate,
              nights: searchParams?.nights,
              rooms: searchParams?.rooms,
          },
          pricing: { grandTotal,marginTotal,},
          plannerItems: plannerItems.map((item: any, index: number) => {
              let tourData: any = null;
              if (item.tours) {
                  tourData = {
                      id: item.tours.id,
                      name: item.tours.name,
                      price: item.tours.price,
                      currency: item.tours.currency,
                      description: item.tours.description || '',
                      commuteType: item.tours.commuteType,
                      pax: item.tours.pax,
                      uniqueId: item.tours.uniqueId,
                      isAdditional: item.tours.isAdditional,
                      activities: item.tours.activities || item.tours.activityDetails || [],
                      selectedActivities: item.tours.selectedActivities || {},
                  };
              }
              let itineraryData:any = null;
              if (item.itinerary) {
                  itineraryData = {
                      title: item.itinerary.title || '',
                      description: item.itinerary.description || '',
                      activities: item.itinerary.activities || [],
                      meals: item.itinerary.meals || '',
                      day: item.itinerary.day || index + 1,
                      price: item.itinerary.price || 0,
                  };
              }
              let hotelData = item.hotel;
              if (hotelData) {
                const hotelKey = hotelData.uniqueId || hotelData.id;
                const actualDates = hotelDateMap.get(hotelKey);
                if (actualDates) {
                  hotelData = {
                    ...hotelData,
                    checkInDate: actualDates.checkInDate,
                    checkOutDate: actualDates.checkOutDate,
                    nights: actualDates.nights
                  };
                }
              }

              return {
                  dayId: item.id,
                  date: item.date,
                  dayNumber: index + 1,
                  hotel: hotelData,
                  tours: tourData,
                  itinerary: itineraryData,
                  transfer: item.transfer,
              };
          }),
      };
      await submitPackageData(dbData).unwrap();
      setTimeout(() => {setLoading(false); setShowThankYou(true); dispatch(clearPlannerData());}, 2000);
  } catch (error) {
      setLoading(false);
      console.error('❌ Error saving trip data:', error);
      alert('Failed to save trip data. Please try again.');
  }
};

const displayCity = searchParams?.city || 'City';
const displayNights = searchParams?.nights || searchParams?.totalNights || 0;
const displayCheckInDate = searchParams?.checkInDate ? new Date(searchParams.checkInDate).toLocaleDateString() : '';
const displayCheckOutDate = searchParams?.checkOutDate ? new Date(searchParams.checkOutDate).toLocaleDateString() : '';
useEffect(() => {
  if (hotels.length > 0) {setShowHotelTab(true); }
  if (plannerItems.length > 0) {
    plannerItems.forEach((item: any, index: number) => {
      console.log(`  Day ${index + 1}:`, {hotel: item.hotel?.name || 'None', tours: item.tours?.name || item.itinerary?.title || 'None',});
    });
  }
  if (plannerItems.length > 0) {
    calculateTotal();
  }
}, [plannerItems, hotels, activities]);

return (
    <Box className="trip-planner-page">
    <Container sx={{ paddingLeft: '0rem', paddingRight: '0rem' }}>
        {!showThankYou && (<>
            <Box className="search-info heading">
            <Typography variant="h5" component="h1" sx={{ marginTop: '1rem' }}>
                {displayCity} | {displayNights} NIGHT/S | {displayCheckInDate} - {displayCheckOutDate}
            </Typography>
            </Box>
            <Box sx={{ mb: 0, height: '2rem' }} className='tablist-container'>
            <Tabs className='tablist-btn' value={activeTab} onChange={handleTabChange} sx={{ color: 'black', '& .MuiTabs-indicator': { display: 'none' } }}>
                <Tab className='planner-btn' value="planner" label="Planner" />
                {showHotelTab && <Tab className='hotel-btn' value="hotel" label="Hotel Details" />}
            </Tabs>
            </Box>
        </>
        )}
        {activeTab === 'planner' && !showThankYou && (
        <Paper elevation={3} className="planner-table-container">
            <Box className="planner-table">
            <Box className="table-header">
                <Box className="header-cell date-cell">Date</Box>
                <Box className="header-cell">Hotel</Box>
                <Box className="header-cell">Tours</Box>
            </Box>
            {plannerItems.map((plannerItem: any, index: number) => (
                <Box key={plannerItem.id} className="table-row">
                <Box className="cell date-cell">
                    <Typography className='date-cell-1' variant="body2">{formatDate(plannerItem.date)}</Typography>
                    <Typography className='date-cell-2' variant="body2">{formatYear(plannerItem.date)}</Typography>
                </Box>
                <Box className="cell">
                    {plannerItem.hotel ? (
                <Box className="selected-hotel" sx={{ position: 'relative', padding: '8px' }}>
                  <Typography className='hotel_name' variant="body2" sx={{ fontSize: '0.8rem', textAlign: 'center', paddingRight: plannerItem.hotel.displayInfo?.isFirstDay ? '24px' : '0' }}>{plannerItem.hotel.name}</Typography>
                        {plannerItem.hotel.displayInfo?.isFirstDay && (
                        <IconButton sx={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)' }} className="remove-button" onClick={() => handleRemoveHotel(plannerItem)}size="small">
                        <DeleteOutline sx={{ color: '#777777', fontSize: '1rem' }} /></IconButton> )}
                    </Box>
                    ) : (
                    <Box display="flex" justifyContent="flex-end">
                        <IconButton className="add-button" onClick={() => handleHotelSelection(plannerItem.id)}>
                        <AddCircleOutline className='add-btn' />
                        </IconButton>
                    </Box>
                    )}
                </Box>
                <Box className="cell">
                    {(plannerItem.tours || plannerItem.itinerary) ? (
                    <Box className="selected-tour" sx={{ position: 'relative', padding: '8px' }}>
                        <Typography variant="body2" sx={{ fontSize: '0.8rem', textAlign: 'center', paddingRight: '24px' }}>
                        {plannerItem.tours?.name || plannerItem.itinerary?.title}
                        </Typography>
                        <IconButton  sx={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)' }}onClick={() => handleRemoveTour(plannerItem)}  size="small">
                        <DeleteOutline sx={{ color: '#777777', fontSize: '1rem' }} />
                        </IconButton>
                    </Box>
                    ) : (
                    <Box display="flex" justifyContent="flex-end">
                        <IconButton onClick={() => handleAddTour(plannerItem.id)}><AddCircleOutline className='add-btn' /> </IconButton>
                    </Box>
                    )}
                </Box>
                </Box>
            ))}
            </Box>
            <Box className="total-section" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1, padding: '16px' }}>
            <Box className="total-row">
                <Typography className="label">Net Total:</Typography>
                <Typography className="value">USD {grandTotal.toFixed(2)}</Typography>
            </Box>
            <Box className="total-row">
                <Typography className="label">Add Margin:</Typography>
                <TextField type="number" value={marginTotal} onChange={handleMarginChange} size="small" sx={{ width: '4rem' }} />
            </Box>
            <Box className="total-row">
                <Typography className="label">Final Amt:</Typography>
                <Typography className="value">USD {(grandTotal + (parseFloat(marginTotal) || 0)).toFixed(2)}</Typography>
            </Box>
            </Box>
            <Box className="action-buttons_cont">
            <Button className="proceed-button" onClick={handleDownloadPDF} disabled={loading}>{loading ? <CircularProgress size={24} /> : 'Download Now'}  </Button>
            <Button className="cancel-button" onClick={onCancel}>Cancel</Button>
            </Box>
        </Paper>
        )}
{activeTab === 'hotel' && showHotelTab && !showThankYou && (
  <Box className="hotel-details-container" sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
    {hotels.map((hotel, index) => {const isFirstOccurrence = hotels.findIndex(h => h.uniqueId === hotel.uniqueId) === index;
      if (!isFirstOccurrence) return null;const hotelDays = plannerItems.filter((item: any) => item.hotel?.uniqueId === hotel.uniqueId || item.hotel?.id === hotel.id );
      const actualCheckInDate = hotelDays.length > 0 ? new Date(hotelDays[0].date).toLocaleDateString() : (hotel.checkInDate ? new Date(hotel.checkInDate).toLocaleDateString() : 'N/A');
      const actualCheckOutDate = hotelDays.length > 0 ? (() => {const lastDay = new Date(hotelDays[hotelDays.length - 1].date);lastDay.setDate(lastDay.getDate() + 1);return lastDay.toLocaleDateString(); })() : (hotel.checkOutDate ? new Date(hotel.checkOutDate).toLocaleDateString() : 'N/A');
      const actualNights = hotelDays.length || hotel.nights || 1;
      return (
        <Grid key={`${hotel.uniqueId}-${index}`} className='item-container' item  xs={14}  md={8} sx={{ marginLeft: '0.5rem', maxWidth: '100%', padding: '0.5rem', marginBottom: '1rem' }}>
          <Grid container spacing={2} sx={{ bgcolor: 'white', padding: '0rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <Grid item xs={12} md={4}>
              {hotel.img ? (<img src={hotel.img}  alt={hotel.name} style={{ width: '98%', height: '10rem', objectFit: 'cover', padding: '0.5rem', borderRadius: '8px' }} />
              ) : (
                <Box sx={{ bgcolor: 'white', height: '200px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>
                  <Typography>No Image Available</Typography>
                </Box>
              )}
            </Grid>
            <Grid item xs={12} md={8} className='hotel-details'>
              <Typography variant="h6" sx={{ color: '#2c3e50', fontWeight: 'bold', marginBottom: '8px' }}>{hotel.name} </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'start', marginBottom: '1rem' }}>
                {Array(hotel.rating || 0).fill(0).map((_, i) => (<span key={i} style={{ color: '#FFD700', fontSize: '20px' }}>★</span>))}
              </Box>
              <Grid container spacing={2} className="booking-details">
                <Grid item xs={12} sm={6} md={3} className="booking-column">
                  <Typography component='div' className="details-label"> <strong>Check In:</strong> {actualCheckInDate}</Typography>
                  <Typography component='div' className="details-label"><strong>Check Out:</strong> {actualCheckOutDate} </Typography>
                  <Typography component='div' className="details-label"> <strong>Nights:</strong> {actualNights} </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3} className="booking-column">
                  <Typography component='div' className="details-label"> <strong>Room Type:</strong> {hotel.roomType || 'Standard'}</Typography>
                  <Typography component='div' className="details-label"> <strong>Meal Plan:</strong> {hotel.mealPlan || 'BB'} </Typography>
                  <Typography component='div' className="details-label"><strong>Total Room(s):</strong> {hotel.rooms || 1}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3} className="booking-column">
                  <Typography component='div' className="details-label"><strong>Destination:</strong> {hotel.destination || hotel.city} </Typography>
                  <Typography component='div' className="details-label" sx={{ fontWeight: 'bold', color: '#2c3e50' }}><strong>Total Amount:</strong> USD {hotel.price}</Typography>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      );})}
    {hotels.length === 0 && (
      <Typography variant="body1" align="center" sx={{ padding: '2rem' }}>No hotels selected yet. Please select hotels from the Planner tab. </Typography>)}
  </Box>
)}
      {showThankYou && (
        <Paper elevation={3} className="thank-you-container" sx={{boxShadow:'none',borderRadius:'none',backgroundColor:'transparent'}}>
            <Typography variant="h4">Thank You!</Typography>
            <Typography variant="body1">Thanks For Connecting</Typography>
        </Paper>)}
    </Container>
    </Box>
);
};
export default TripPlannerReadyMade;
