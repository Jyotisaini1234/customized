import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Box,Container,Typography,Button,Paper, Tabs,Tab, IconButton,TextField,CircularProgress} from "@mui/material";
import { AddCircleOutline, DeleteOutline, ArrowDownward as ArrowDownIcon} from "@mui/icons-material";
import './TripPlannerReadyMade.scss';
import { SearchData, PlannerItem2, PackageHotel, PackageData, TripPlannerDBData, ReadyMadeHotel, Activity, Transfer, Itinerary, PackageItinerary } from "../../../../../../types/types.ts";
import { useSubmitPackageDataMutation } from "../../../../../../api/TourAPI.tsx";

const TripPlannerReadyMade: React.FC = () => {
const location = useLocation();
const navigate = useNavigate();
const [searchData, setSearchData] = useState<SearchData>(location.state as SearchData);
const [selectedHotelFromParams, setSelectedHotelFromParams] = useState<any>(null);
const [hasValidData, setHasValidData] = useState<boolean>(false);
const [activeTab, setActiveTab] = useState<string>('planner');
const [showModifySearch, setShowModifySearch] = useState<boolean>(false);
const [showHotelTab, setShowHotelTab] = useState<boolean>(false);
const [showThankYou, setShowThankYou] = useState<boolean>(false);
const [plannerItems, setPlannerItems] = useState<PlannerItem2[]>([]);
const [hotels, setHotels] = useState<any[]>([]);
const [activities, setActivities] = useState<any[]>([]);
const [transfers, setTransfers] = useState<any[]>([]);
const [grandTotal, setGrandTotal] = useState<number>(0);
const [marginTotal, setMarginTotal] = useState<string>('0');
const [loading, setLoading] = useState<boolean>(false);
const [clientFormOpen, setClientFormOpen] = useState<boolean>(false);
const [packageType, setPackageType] = useState<string>('hotel-land');
const [currency] = useState<string>('USD');
const [originalSearchParams, setOriginalSearchParams] = useState<any>(null);
const isInitialized = useRef(false);
const isDataLoaded = useRef(false);
const [selectedTourData, setSelectedTourData] = useState(null);
const handleMarginChange = (event: React.ChangeEvent<HTMLInputElement>) => {  setMarginTotal(event.target.value);};
const onCancel = () => {  navigate(-1); };
const formatDate = (date: any) => { const d = new Date(date); if (isNaN(d.getTime())) return 'Invalid Date'; return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });};
const formatYear = (date: any) => {const d = new Date(date);if (isNaN(d.getTime())) return 'Invalid Year'; return d.getFullYear().toString();};
const [specificDayIdState, setSpecificDayId] = useState<string | null>(null);
const currentSearchParams = (() => { 
    if (originalSearchParams) {return originalSearchParams;  }
    if (searchData) {
        const nights = searchData?.totalNights || searchData?.nights || 3;
        const checkInDate = searchData?.checkInDate || new Date().toISOString();
        const checkOutDate = searchData?.checkOutDate || new Date(new Date(checkInDate).getTime() + nights * 24 * 60 * 60 * 1000).toISOString();
        return {
            city: searchData?.destinations?.[0] || searchData?.destinations || 'Batumi',
            nights: nights,totalNights: nights, checkInDate: checkInDate, checkOutDate: checkOutDate,
            rooms: searchData?.room?.[0] || searchData?.room || [{ adults: 2, cwb: 0, cnb: 0, infants: 0 }], country: 'Georgia',adults: searchData?.guests?.adults || 2,cwb: searchData?.guests?.cwb || 0,cnb: searchData?.guests?.cnb || 0, infants: searchData?.guests?.infants || 0 }; }
    
    return { city: 'Batumi', nights: 3, totalNights: 3,
        checkInDate: new Date().toISOString(),
        checkOutDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), 
        rooms: [{ adults: 2, cwb: 0, cnb: 0, infants: 0 }],country: 'Georgia',adults: 2, cwb: 0,cnb: 0, infants: 0 };
})();
const [submitPackageData, { isLoading: isSubmitting }] = useSubmitPackageDataMutation();
const displayCity = currentSearchParams.city || 'Batumi';
const displayNights = currentSearchParams.nights;
const displayCheckInDate = new Date(currentSearchParams.checkInDate).toLocaleDateString();
const displayCheckOutDate = new Date(currentSearchParams.checkOutDate).toLocaleDateString();
const savePersistentTableData = (items: PlannerItem2[]) => {
        try {
            const verifiedTotal = calculateTotalWithPackageData(items, searchData?.packageData?.packageDetails); 
            const tableData = { plannerItems: items, hotels: hotels,activities: activities,  transfers: transfers, grandTotal: verifiedTotal,timestamp: new Date().toISOString(),
                breakdown: { totalHotels: hotels.length, totalActivities: activities.length, totalTransfers: transfers.length,
                    itemsWithHotels: items.filter(item => item.hotel).length,
                    itemsWithTours: items.filter(item => item.tours).length,
                    itemsWithTransfers: items.filter(item => item.transfer).length }};
            sessionStorage.setItem('persistentTableData', JSON.stringify(tableData));
        } catch (error) { console.error(' Error saving persistent table data:', error); }
    };
const createPlannerItemsWithPackageData = (hotelList: any[], activityList: any[], transferList: any[], packageData?: PackageData) => {
    const items: PlannerItem2[] = [];
    const startDate = new Date(currentSearchParams.checkInDate);
    let currentDate = new Date(startDate);
    const nights = currentSearchParams.nights || currentSearchParams.totalNights || 3;
    const totalDays = nights + 1;
    console.log(`Creating planner for ${nights} nights = ${totalDays} days`);
    const deletedItineraries = JSON.parse(sessionStorage.getItem('deletedItineraries') || '[]');
    for (let i = 0; i < totalDays; i++) {
        const itineraryId = `itinerary-day-${i + 1}`;
        const plannerItem: PlannerItem2 = {
            id: `day-${i + 1}`, 
            date: new Date(currentDate), 
            hotel: undefined, 
            tours: undefined, 
            transfer: undefined,
            itinerary: (!deletedItineraries.includes(itineraryId) && packageData?.itinerary?.[i]) ? packageData.itinerary[i] : undefined,
            dateObj: new Date(currentDate).toISOString()
        }; 
        items.push(plannerItem);
        currentDate.setDate(currentDate.getDate() + 1); 
    }
    items.forEach(item => { item.hotel = undefined; });
    hotelList.forEach((hotel) => {
        if (hotel.specificDayId) {
            // Handle specific day assignment
            const dayIndex = items.findIndex(item => item.id === hotel.specificDayId);
            if (dayIndex !== -1) { items[dayIndex].hotel = {...hotel, isAdditional: true,displayInfo: { isFirstDay: true,isLastDay: true, dayNumber: 1,totalDays: 1 } };
                // If this is the second-to-last day, also show on last day
                if (dayIndex === totalDays - 2) {
                    const lastDayIndex = totalDays - 1;
                    items[lastDayIndex].hotel = {
                        ...hotel,
                        isAdditional: true,
                        displayInfo: { 
                            isFirstDay: false, 
                            isLastDay: true,
                            dayNumber: 2, 
                            totalDays: 2 
                        }
                    };
                }
                console.log(`Assigned hotel "${hotel.name}" to specific day: ${hotel.specificDayId} with price: $${hotel.price}`); 
            }
        } 
        else if (hotel.checkInDate && hotel.checkOutDate) {
            const checkInDate = new Date(hotel.checkInDate);
            const checkOutDate = new Date(hotel.checkOutDate);
            checkInDate.setHours(0, 0, 0, 0);
            checkOutDate.setHours(0, 0, 0, 0);
            const checkInDayIndex = items.findIndex(item => {
                const itemDate = new Date(item.date);
                itemDate.setHours(0, 0, 0, 0);
                return itemDate.getTime() === checkInDate.getTime();});
            const checkOutDayIndex = items.findIndex(item => {
                const itemDate = new Date(item.date);
                itemDate.setHours(0, 0, 0, 0);
                return itemDate.getTime() === checkOutDate.getTime();});
            if (checkInDayIndex !== -1) {
                const numNights = checkOutDayIndex - checkInDayIndex;
                const isFullItinerary = checkInDayIndex === 0 && checkOutDayIndex === totalDays - 1;
                const isLastDayCheckout = checkOutDayIndex === totalDays - 1;
                let startShowIndex = checkInDayIndex;
                let endShowIndex = checkOutDayIndex;
                if (isFullItinerary) {endShowIndex = totalDays - 1; }
                else if (isLastDayCheckout) {}
                else if (numNights === 2) {endShowIndex = checkInDayIndex + 1; } 
                else if (numNights === 1 && checkOutDayIndex < totalDays - 1) {endShowIndex = checkInDayIndex;  }
                else {endShowIndex = checkOutDayIndex - 1;}
                // Assign hotel to calculated range
                for (let i = startShowIndex; i <= endShowIndex; i++) {
                    items[i].hotel = {
                        ...hotel,
                        displayInfo: {
                            isFirstDay: i === startShowIndex,
                            isLastDay: i === endShowIndex,
                            dayNumber: i - startShowIndex + 1,
                            totalDays: endShowIndex - startShowIndex + 1
                        }
                    };
                }
                console.log(`✅ Assigned hotel "${hotel.name}" from day ${startShowIndex + 1} to day ${endShowIndex + 1}`);
            }
            // Alternative assignment based on date range
            items.forEach((item, index) => {
                const itemDate = new Date(item.date);
                itemDate.setHours(0, 0, 0, 0);
                if (itemDate >= checkInDate && itemDate < checkOutDate) {
                    if (!items[index].hotel) { // Only assign if no hotel already assigned
                        items[index].hotel = {
                            ...hotel,
                            displayInfo: {
                                isFirstDay: itemDate.getTime() === checkInDate.getTime(),
                                isLastDay: itemDate.getTime() === new Date(checkOutDate.getTime() - 24 * 60 * 60 * 1000).getTime(),
                                dayNumber: Math.floor((itemDate.getTime() - checkInDate.getTime()) / (24 * 60 * 60 * 1000)) + 1,
                                totalDays: Math.floor((checkOutDate.getTime() - checkInDate.getTime()) / (24 * 60 * 60 * 1000))
                            }
                        };
                    }
                }
            });
        }
        else {
            // Handle package hotels with nights-based assignment
            const hotelNights = hotel.nights || 1;
            const hotelDays = hotelNights + 1;
            let startDayIndex = 0;
            // Find first available day
            while (startDayIndex < items.length && items[startDayIndex].hotel) {  startDayIndex++; }
            // Assign to consecutive days
            for (let dayOffset = 0; dayOffset < hotelDays && (startDayIndex + dayOffset) < items.length; dayOffset++) {
                const dayIndex = startDayIndex + dayOffset;
                if (!items[dayIndex].hotel) {
                    items[dayIndex].hotel = { 
                        ...hotel, 
                        displayInfo: {  
                            isFirstDay: dayOffset === 0,  
                            isLastDay: dayOffset === hotelDays - 1,  
                            dayNumber: dayOffset + 1,  
                            totalDays: hotelDays 
                        }  
                    }; 
                } 
            }
            console.log(`✅ Assigned package hotel "${hotel.name}" starting from day ${startDayIndex + 1} for ${hotelDays} days`);
        }
    });
    // Handle activities assignment
    const deletedActivities = JSON.parse(sessionStorage.getItem('deletedActivities') || '[]');
    const tourMapping = JSON.parse(sessionStorage.getItem('tourDayMapping') || '{}');
    activityList.forEach((activity) => { 
        if (deletedActivities.includes(activity.id)) return;
        const assignedDayId = activity.assignedDayId || tourMapping[activity.id];
        if (assignedDayId) { 
            const dayIndex = items.findIndex(item => item.id === assignedDayId);
            if (dayIndex !== -1) { 
                items[dayIndex].tours = activity; 
                console.log(`✅ Assigned activity "${activity.name}" to specific day: ${assignedDayId}`);}
        } else {
            const availableDayIndex = items.findIndex(item => !item.tours);
            if (availableDayIndex !== -1) {
                items[availableDayIndex].tours = activity;
                console.log(`✅ Assigned activity "${activity.name}" to first available day: ${items[availableDayIndex].id}`);
            } }
    });
    // Handle transfers
    transferList.forEach((transfer, index) => {if (index < items.length) {   items[index].transfer = transfer;  }});
    setPlannerItems(items);
    calculateTotalWithPackageData(items, packageData);
    savePersistentTableData(items);
};
const createEmptyPlannerItems = () => {
    const items: PlannerItem2[] = [];
    const startDate = new Date(currentSearchParams.checkInDate);
    const nights = currentSearchParams.nights || currentSearchParams.totalNights || 3;
    const totalDays = nights + 1;
    console.log(`Creating empty planner for ${nights} nights = ${totalDays} days`);
    let currentDate = new Date(startDate);
    for (let i = 0; i < totalDays; i++) { items.push({
        id: `day-${i + 1}`, date: new Date(currentDate),
        dateObj: ""
    });   currentDate.setDate(currentDate.getDate() + 1); }
    setPlannerItems(items);
    savePersistentTableData(items);
};
const calculateTotalWithPackageData = (items: PlannerItem2[], packageData?: PackageData) => {
    let total = 0;
    const processedHotels = new Set();
    const processedTours = new Set();
    const processedTransfers = new Set();
    console.log('🔢 Starting total calculation...');
    
    // Get room count properly - handle if it's an array  
    let roomCount = 1;
    if (searchData?.room) {
        if (Array.isArray(searchData.room)) {
            roomCount = searchData.room.length;
        } else {
            roomCount = Number(searchData.room) || 1;
        }
    } else if (currentSearchParams?.rooms) {
        if (Array.isArray(currentSearchParams.rooms)) {
            roomCount = currentSearchParams.rooms.length;
        } else {
            roomCount = Number(currentSearchParams.rooms) || 1;
        }
    }
    console.log('Room count for calculations:', roomCount);
    
    if (currentSearchParams?.pricing) {
        const packagePricing = currentSearchParams.pricing;
        console.log('Package pricing data:', packagePricing);
        total = packagePricing.totalPrice || 0;
        console.log(`Using calculated total price: $${total}`);
    } else {
        if (packageData && searchData?.packageData?.packageDetails?.hotelOption?.[0]?.totalPackageCost) {
            const basePackageTotal = Number(searchData.packageData.packageDetails.hotelOption[0].totalPackageCost);
            total = basePackageTotal;
            console.log(`Using base package total: $${basePackageTotal}`);
        }
    }
    
    // Subtract deleted hotels with proper room calculation
    const deletedHotels = JSON.parse(sessionStorage.getItem('deletedHotels') || '[]');
    deletedHotels.forEach(deletedHotel => {
        if (deletedHotel.originalPrice) {
            total -= deletedHotel.originalPrice;
            console.log(`Subtracted deleted hotel price: $${deletedHotel.originalPrice} (${deletedHotel.name})`);
        }
    });
    
    items.forEach((item, index) => {
        if (item.itinerary?.price) {
            total += item.itinerary.price;
            console.log(`Added itinerary price for day ${index + 1}: $${item.itinerary.price}`);
        }
        
        if (item.tours) {
            const tourKey = `${item.tours.id}-${item.id}`;
            if (!processedTours.has(tourKey)) {
                const tourPrice = Number(item.tours.price) || 0;
                if (tourPrice > 0) {
                    total += tourPrice;
                    processedTours.add(tourKey);
                    console.log(`Added tour price for day ${index + 1}: $${tourPrice} (${item.tours.name})`);
                }
            }
        }
        
        if (item.transfer) {
            const transferKey = `${item.transfer.id}-${item.id}`;
            if (!processedTransfers.has(transferKey)) {
                const transferPrice = Number(item.transfer.price) || 0;
                if (transferPrice > 0) {
                    total += transferPrice;
                    processedTransfers.add(transferKey);
                    console.log(`Added transfer price for day ${index + 1}: $${transferPrice}`);
                }
            }
        }
        
        if (item.hotel) {
            const hotelKey = `${item.hotel.id}-${item.hotel.uniqueId || item.hotel.specificDayId || 'default'}`;
            if (!processedHotels.has(hotelKey)) {
                const baseHotelPrice = Number(item.hotel.price) || 0;
                
                // Calculate actual hotel price based on rooms
                const hotelRoomCount = item.hotel.rooms || roomCount;
                const actualHotelPrice = baseHotelPrice * hotelRoomCount;
                
                if (actualHotelPrice > 0) {
                    if (item.hotel.isAdditional || item.hotel.specificDayId || !item.hotel.isPackageHotel) {
                        total += actualHotelPrice;
                        console.log(`Added individual hotel price: $${baseHotelPrice} x ${hotelRoomCount} rooms = $${actualHotelPrice} for ${item.hotel.name} (Day: ${item.id})`);
                    }
                    processedHotels.add(hotelKey);
                }
            }
        }
    });
    
    console.log(`Final calculated total: $${total}`);
    console.log(`Breakdown: Tours processed: ${processedTours.size}, Hotels processed: ${processedHotels.size}, Transfers processed: ${processedTransfers.size}`);
    setGrandTotal(total);
    return total;
};

useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const addedToPlanner = urlParams.get('addedToPlanner') === 'true';
    const specificDayId = urlParams.get('specificDayId');
    const encodedTourData = urlParams.get('tourData');
    console.log("📥 URL-specificDayId:", specificDayId);
    console.log('🔍 Tour Data Processing - Initial Check:', {  addedToPlanner, specificDayId, hasTourDataInUrl: !!encodedTourData,plannerItemsLength: plannerItems.length });
    if (specificDayId && specificDayId !== specificDayIdState) { console.log("🎯 Setting specificDayId state:", specificDayId); setSpecificDayId(specificDayId); }
    if (addedToPlanner && specificDayId && plannerItems.length > 0) {console.log("🚀 Processing tour assignment for day:", specificDayId);
        let storedTour: any = {};
        if (encodedTourData) {
            try {storedTour = JSON.parse(decodeURIComponent(encodedTourData));console.log('📦 Tour data from URL params:', storedTour);
            } catch (error) {console.error('❌ Error parsing tourData from URL:', error);  }
        }
        if (!storedTour.tourDetails && !storedTour.tour) {
            try {
                const sessionTour = sessionStorage.getItem('selectedTourData');
                if (sessionTour) { storedTour = JSON.parse(sessionTour);  console.log('📦 Tour data from session storage:', storedTour);}
            } catch (error) { console.error('❌ Error parsing sessionStorage tourData:', error); }
        }
        if (storedTour && (storedTour.tourDetails || storedTour.tour)) {
            const tourData = storedTour.tourDetails || storedTour.tour;
            const bookingData = storedTour.booking || {};
            const newActivity = {
                id: tourData.id || `tour-${Date.now()}`,
                name: tourData.name || tourData.tourName || tourData.sightName || 'Unnamed Tour',
                price: bookingData.totalPrice || tourData.price || 0,
                description: tourData.description || '',
                duration: tourData.eventDuration || '',
                city: tourData.city || bookingData.city || '',
                currency: bookingData.currency || tourData.currency || 'USD',
                date: bookingData.date || '',
                assignedDayId: specificDayId };
            setActivities(prevActivities => {
                const filteredActivities = prevActivities.filter(act => act.id !== newActivity.id);
                const updatedActivities = [...filteredActivities, newActivity];
                saveActivitiesToSession(updatedActivities);
                return updatedActivities;
            });
            setPlannerItems(prevItems => {
                const targetItem = prevItems.find(item => item.id === specificDayId);
                if (!targetItem) { return prevItems;}
                const updatedItems = prevItems.map(item => {
                    if (item.id === specificDayId) {
                    return { ...item, tours: newActivity,itinerary: item.itinerary };   }
                    return item;
                });
                const tourMapping = JSON.parse(sessionStorage.getItem('tourDayMapping') || '{}');
                tourMapping[newActivity.id] = specificDayId;
                sessionStorage.setItem('tourDayMapping', JSON.stringify(tourMapping));
                setTimeout(() => {
                    console.log('Recalculating total with new tour...');
                    const newTotal = calculateTotalWithPackageData(updatedItems, searchData?.packageData?.packageDetails);
                    console.log('New total after tour assignment:', newTotal);
                    savePersistentTableData(updatedItems);
                }, 100);
                return updatedItems;
            });
            sessionStorage.removeItem('selectedTourData');
            sessionStorage.removeItem('pendingTourAssignment');  
            const url = new URL(window.location.href); ['addedToPlanner', 'tourAdded', 'preserveData', 'dayId', 'specificDayId', 'timestamp', 'tourData'].forEach(param => { url.searchParams.delete(param); });
            window.history.replaceState({}, '', url.toString());
            console.log('Tour processing completed successfully for day:', specificDayId);
        } else { console.log('No valid tour data found in URL or session storage'); }
    }
}, [plannerItems.length, specificDayIdState]);

useEffect(() => {
    if (searchData && hasValidData && !isDataLoaded.current) {
        console.log('Processing search data:', searchData);
        isDataLoaded.current = true;
        const packageData = searchData.packageData?.packageDetails;
        console.log('Package data:', packageData);
        
        const deletedHotels = JSON.parse(sessionStorage.getItem('deletedHotels') || '[]');
        const deletedPackageHotels = JSON.parse(sessionStorage.getItem('deletedPackageHotels') || '[]');
        const deletedActivities = JSON.parse(sessionStorage.getItem('deletedActivities') || '[]');
        const existingHotels = JSON.parse(sessionStorage.getItem('existingReadymadeHotels') || '[]');
        
        let hotelList: any[] = [];
        
        if (packageData?.hotelOption?.[0]?.hotels) {
            hotelList = packageData.hotelOption[0].hotels.map((hotel: PackageHotel, index: number) => {
                const hotelId = `hotel-package-${index}-${hotel.name.replace(/\s+/g, '-').toLowerCase()}`;
                const uniqueId = `package-${hotel.name.replace(/\s+/g, '-').toLowerCase()}-${hotel.destination.replace(/\s+/g, '-').toLowerCase()}`; 
                
                const isDeleted = deletedHotels.some((deleted: any) => 
                    (deleted.name === hotel.name && deleted.destination === hotel.destination) ||
                    deleted.uniqueId === uniqueId ||
                    deleted.packageIndex === index
                );
                
                if (isDeleted) { 
                    console.log('Skipping deleted hotel:', hotel.name, 'from', hotel.destination);  
                    return null;
                }
                
                return {
                    id: hotelId,
                    name: hotel.name,
                    destination: hotel.destination,
                    city: hotel.destination, // Add city field
                    nights: hotel.nights,
                    price: hotel.price,
                    rating: hotel.star,
                    currency: hotel.currency,
                    mealPlan: hotel.mealPlan,
                    roomType: hotel.roomType,
                    uniqueId: uniqueId,
                    packageIndex: index,
                    isPackageHotel: true
                };
            }).filter(hotel => hotel !== null);
            console.log('Processed hotels from package (after filtering deleted):', hotelList); 
        }
        
        // Process existing hotels with proper mapping
        const filteredExistingHotels = existingHotels.filter((hotel: any) => {
            const isDeleted = deletedHotels.some((deleted: any) => 
                deleted.id === hotel.id && 
                (deleted.specificDayId === hotel.specificDayId || deleted.uniqueId === hotel.uniqueId)
            );
            return !isDeleted;
        }).map((hotel: any) => ({
            ...hotel,
            city: hotel.city || hotel.destination || hotel.hotel?.city || searchData?.city || 'Unknown',
            roomType: hotel.roomType || hotel.room?.roomCategory || hotel.hotel?.roomType || 'Standard Room'
        }));
        
        hotelList = [...filteredExistingHotels, ...hotelList];
        
        // Enhanced hotel from params processing
        if (selectedHotelFromParams && selectedHotelFromParams.hotel) {
            const hotelFromParams = {
                id: selectedHotelFromParams.hotel.id,
                name: selectedHotelFromParams.hotel.hotelName,
                destination: selectedHotelFromParams.hotel.destination || selectedHotelFromParams.city || searchData?.city || 'Unknown',
                city: selectedHotelFromParams.hotel.city || selectedHotelFromParams.city || selectedHotelFromParams.hotel.destination || searchData?.city || 'Unknown',
                nights: selectedHotelFromParams.booking?.nights || 1,
                price: selectedHotelFromParams.booking?.totalPrice || 0,
                rating: selectedHotelFromParams.hotel.starRating,
                checkInDate: selectedHotelFromParams.booking?.checkInDate,
                checkOutDate: selectedHotelFromParams.booking?.checkOutDate,
                specificDayId: selectedHotelFromParams.specificDayId || undefined,
                isAdditional: true,
                cityId: selectedHotelFromParams.hotel.cityId || selectedHotelFromParams.cityId || searchData?.cityId,
                uniqueId: selectedHotelFromParams.uniqueId || `hotel-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                roomType: selectedHotelFromParams.room?.roomCategory || selectedHotelFromParams.hotel?.roomType || 'Standard Room',
                mealPlan: selectedHotelFromParams.room?.mealPlan || selectedHotelFromParams.hotel?.mealPlan || 'BB'
            };
            
            const isParamsHotelDeleted = deletedHotels.some((deleted: any) => 
                deleted.id === hotelFromParams.id && 
                (deleted.specificDayId === hotelFromParams.specificDayId || deleted.uniqueId === hotelFromParams.uniqueId)
            );
            
            if (!isParamsHotelDeleted) {
                const hotelExists = hotelList.some(hotel => 
                    hotel.id === hotelFromParams.id && 
                    hotel.specificDayId === hotelFromParams.specificDayId
                );
                if (!hotelExists) {
                    hotelList = [hotelFromParams, ...hotelList];
                }
            } else { 
                console.log('Skipping deleted hotel from params:', hotelFromParams.name);
            }
        }
        
        setHotels(hotelList);
        saveHotelsToSession(hotelList);
        
        const savedActivities = sessionStorage.getItem('readymadeActivities');
        let activityList: any[] = [];
        
        if (savedActivities) {
            try {
                const parsedActivities = JSON.parse(savedActivities);
                activityList = parsedActivities.filter((activity: any) => 
                    !deletedActivities.includes(activity.id)
                );
                console.log('Using saved activities (after filtering deleted):', activityList.length);
            } catch (e) {
                console.error('Error parsing saved activities:', e);
                if (packageData?.activities) {
                    activityList = packageData.activities.map((activity: any, index: number) => ({
                        id: `activity-${index}-${Date.now()}`,
                        name: activity.name,
                        type: activity.type,
                        vehicle: activity.vehicle,
                        ticketIncluded: activity.ticketIncluded,
                        price: activity.price || 0
                    })).filter((activity: any) => !deletedActivities.includes(activity.id));
                }
            }
        } else {
            if (packageData?.activities) {
                activityList = packageData.activities.map((activity: any, index: number) => ({
                    id: `activity-${index}-${Date.now()}`,
                    name: activity.name,
                    type: activity.type,
                    vehicle: activity.vehicle,
                    ticketIncluded: activity.ticketIncluded,
                    price: activity.price || 0
                })).filter((activity: any) => !deletedActivities.includes(activity.id));
            }
            saveActivitiesToSession(activityList); 
        }
        
        setActivities(activityList);
        
        let transferList: any[] = [];
        if (packageData?.transfers) {
            transferList = packageData.transfers.map((transfer: any, index: number) => ({
                id: `transfer-${index}-${Date.now()}`,
                route: transfer.route,
                vehicle: transfer.vehicle,
                type: transfer.type,
                price: transfer.price || 0
            }));
        }
        
        setTransfers(transferList);
        
        if (hotelList.length > 0 || (packageData?.itinerary && packageData.itinerary.length > 0)) {
            setShowHotelTab(true);
            createPlannerItemsWithPackageData(hotelList, activityList, transferList, packageData);
        } else {
            createEmptyPlannerItems(); 
        }
    }
}, [searchData, hasValidData, selectedHotelFromParams]);
const saveHotelsToSession = (hotelList: any[]) => {
        try {
            sessionStorage.setItem('existingReadymadeHotels', JSON.stringify(hotelList));
            console.log('Hotels saved to session storage:', hotelList.length);
        } catch (error) {console.error('Error saving hotels to session storage:', error);  }
    };
const saveActivitiesToSession = (activityList: any[]) => {
        try {
            sessionStorage.setItem('readymadeActivities', JSON.stringify(activityList));
            console.log('Activities saved to session storage:', activityList.length);
        } catch (error) { console.error('Error saving activities to session storage:', error); }
    };
const loadReadymadePackageData = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const savedSearchData = sessionStorage.getItem('readymadeSearchData');
        const hotelData = urlParams.get('hotelData');
        const preserveData = urlParams.get('preserveData');
        let loadedSearchData: any = {};
        const originalSearchData = sessionStorage.getItem('originalReadymadeSearchData');
        if (preserveData === 'true') {  const preservedData = sessionStorage.getItem('preservedReadymadeData');
            if (preservedData) {
                try {
                    const parsed = JSON.parse(preservedData);
                    if (parsed.searchData) { sessionStorage.setItem('readymadeSearchData', parsed.searchData); }
                    if (parsed.plannerItems) { sessionStorage.setItem('persistentTableData', parsed.plannerItems); }
                    if (parsed.originalSearchParams) { sessionStorage.setItem('tripPlannerParams', parsed.originalSearchParams); }
                    if (parsed.readymadeContext) { sessionStorage.setItem('readymadePackageContext', parsed.readymadeContext);  }
                    sessionStorage.removeItem('preservedReadymadeData');
                    console.log('Restored preserved readymade data');
                } catch (e) {console.error('Error restoring preserved data:', e);}
            }
        }

        if (originalSearchData) {
            try { loadedSearchData = JSON.parse(originalSearchData);} catch (e) { }
        }
        else if (urlParams.has('checkInDate')) {
            loadedSearchData = {
                checkInDate: urlParams.get('checkInDate'),
                checkOutDate: urlParams.get('checkOutDate'),
                city: urlParams.get('city'),
                country: urlParams.get('country'),
                nights: parseInt(urlParams.get('nights') || '1'),
                totalNights: parseInt(urlParams.get('nights') || '1'),
                adults: parseInt(urlParams.get('adults') || '2'),
                cwb: parseInt(urlParams.get('cwb') || '0'),
                cnb: parseInt(urlParams.get('cnb') || '0'),
                infants: parseInt(urlParams.get('infants') || '0'),
                rooms: urlParams.get('rooms') ? JSON.parse(decodeURIComponent(urlParams.get('rooms') || '[]')) : [],
                room: urlParams.get('rooms') ? [JSON.parse(decodeURIComponent(urlParams.get('rooms') || '[]'))] : [],
                destinations: [urlParams.get('city') || 'Georgia'],
                specificDayId: urlParams.get('specificDayId'),
                fromReadymadePackage: true};
            if (!originalSearchData) {sessionStorage.setItem('originalReadymadeSearchData', JSON.stringify(loadedSearchData)); }
        }
        else if (savedSearchData) {
            try {
                const parsed = JSON.parse(savedSearchData);
                if (parsed.preserveOriginalDates && originalSearchData) {
                    const original = JSON.parse(originalSearchData);
                    loadedSearchData = {
                        ...parsed,
                        checkInDate: original.checkInDate,
                        checkOutDate: original.checkOutDate,
                        nights: original.nights,
                        totalNights: original.totalNights
                    };
                } else {
                    loadedSearchData = parsed;
                }} catch (e) { console.error('Error parsing saved search data:', e); }
        }
        else if (location.state) {
            loadedSearchData = location.state;
            sessionStorage.setItem('originalReadymadeSearchData', JSON.stringify(loadedSearchData));
            if (loadedSearchData.destinations && Array.isArray(loadedSearchData.destinations)) {
                loadedSearchData.city = loadedSearchData.destinations[0]; }
            if (loadedSearchData.guests) {
                loadedSearchData.adults = loadedSearchData.guests.adults || 2;
                loadedSearchData.cwb = loadedSearchData.guests.cwb || 0;
                loadedSearchData.cnb = loadedSearchData.guests.cnb || 0;
                loadedSearchData.infants = loadedSearchData.guests.infants || 0;
                loadedSearchData.rooms = [{
                    adults: loadedSearchData.guests.adults || 2,
                    cwb: loadedSearchData.guests.cwb || 0,
                    cnb: loadedSearchData.guests.cnb || 0,
                    infants: loadedSearchData.guests.infants || 0 }];
                loadedSearchData.room = [loadedSearchData.rooms[0]]; }
            if (!loadedSearchData.nights && loadedSearchData.totalNights) {
                loadedSearchData.nights = loadedSearchData.totalNights; }
            if (!loadedSearchData.country) {
                loadedSearchData.country = 'Georgia';} }
        let selectedHotel = null;
        if (hotelData) {
            try {
                selectedHotel = JSON.parse(decodeURIComponent(hotelData));
            } catch (e) { console.error('Error parsing hotel data:', e);}}
        return {
            searchData: loadedSearchData,
            selectedHotel,
            hasValidData: Object.keys(loadedSearchData).length > 0};
    };

useEffect(() => {
        if (!isInitialized.current) {
            const { searchData: loadedSearchData, selectedHotel, hasValidData: dataValid } = loadReadymadePackageData();
            if (dataValid && loadedSearchData) {
                setSearchData(loadedSearchData);
                setSelectedHotelFromParams(selectedHotel);
                setHasValidData(true);
                const processedSearchParams = {
                    ...loadedSearchData,
                    checkInDate: loadedSearchData.checkInDate || new Date().toISOString(),
                    checkOutDate: loadedSearchData.checkOutDate || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
                    city: loadedSearchData.city || loadedSearchData.destinations?.[0] || 'Batumi',
                    country: loadedSearchData.country || 'Georgia',
                    nights: loadedSearchData.nights || loadedSearchData.totalNights || 3,
                    rooms: loadedSearchData.rooms || loadedSearchData.room || [{ adults: 2, cwb: 0, cnb: 0, infants: 0 }]};
                setOriginalSearchParams(processedSearchParams);
                isInitialized.current = true;
            } else { console.error('No valid search data found'); setHasValidData(false);}
        }
}, [location]);

const handleRemoveHotel = (plannerItem: PlannerItem2) => {
        if (!plannerItem.hotel) return;
        const hotelToRemove = plannerItem.hotel;
        console.log('Removing hotel:', hotelToRemove.name);
        const deletedHotels = JSON.parse(sessionStorage.getItem('deletedHotels') || '[]');
        const deletedHotel = {
            id: hotelToRemove.id,
            specificDayId: hotelToRemove.specificDayId,
            uniqueId: hotelToRemove.uniqueId,
            originalPrice: Number(hotelToRemove.price) || 0,
            name: hotelToRemove.name,
            timestamp: new Date().toISOString()
        };
        deletedHotels.push(deletedHotel);
        sessionStorage.setItem('deletedHotels', JSON.stringify(deletedHotels));
        const updatedHotels = hotels.filter(hotel => {
            const hotelKey = `${hotel.id}-${hotel.uniqueId || hotel.specificDayId || 'default'}`;
            const removeKey = `${hotelToRemove.id}-${hotelToRemove.uniqueId || hotelToRemove.specificDayId || 'default'}`;
            return hotelKey !== removeKey;
        });
        setHotels(updatedHotels);
        saveHotelsToSession(updatedHotels);
        const updatedItems = plannerItems.map(item => {
            if (item.hotel) {
                const itemHotelKey = `${item.hotel.id}-${item.hotel.uniqueId || item.hotel.specificDayId || 'default'}`;
                const removeKey = `${hotelToRemove.id}-${hotelToRemove.uniqueId || hotelToRemove.specificDayId || 'default'}`;
                if (itemHotelKey === removeKey) {console.log(`Removing hotel from day: ${item.id}`);
                    return { ...item, hotel: undefined }; }
            }
            return item;
        });
        setPlannerItems(updatedItems);
        calculateTotalWithPackageData(updatedItems, searchData?.packageData?.packageDetails);
        sessionStorage.setItem('tripPlannerItems', JSON.stringify(updatedItems));
        sessionStorage.removeItem('hotelSearchParams');
        sessionStorage.removeItem('lastNightHotelParams');
        sessionStorage.removeItem('selectedHotelArea');
        savePersistentTableData(updatedItems);
    };
const calculateTotal = (items: PlannerItem2[]) => { return calculateTotalWithPackageData(items, searchData?.packageData?.packageDetails);};
const handleTabChange = (event: React.SyntheticEvent, newValue: string) => { setActiveTab(newValue); };
const handleAddItem = (plannerItemId: string, type: string) => {
    const plannerItem = plannerItems.find(item => item.id === plannerItemId);
    if (!plannerItem) return;
    if (type === 'tours') {
        const currentUrl = new URL(window.location.href);
        const fromReadymadePackage = currentUrl.searchParams.get('fromReadymadePackage') === 'true'|| window.location.pathname.includes('readymade-planner');
        if (fromReadymadePackage) {
            const dayNumber = plannerItemId.replace('day-', '');
            const checkInDate = currentUrl.searchParams.get('checkInDate')   || searchData?.checkInDate || new Date().toISOString();
            const city: string = currentUrl.searchParams.get('city') ?? searchData?.destinations?.[0]?? (typeof searchData?.destinations === 'string' ? searchData.destinations : undefined)?? 'Batumi'; 
            const country = currentUrl.searchParams.get('country')  || searchData?.destinations  || 'Georgia';
            const rooms = searchData?.room || searchData?.room  || currentSearchParams.rooms || [{ adults: 2, cwb: 0, cnb: 0, infants: 0 }];
            let adults, cwb, cnb, infants;
            if (searchData?.guests) { adults = searchData.guests.adults || 2; cwb = searchData.guests.cwb || 0; cnb = searchData.guests.cnb || 0; infants = searchData.guests.infants || 0;
            } else if (searchData?.guests?.adults !== undefined) { adults = searchData.guests.adults; cwb = searchData.guests.cwb || 0; cnb = searchData.guests.cnb || 0; infants = searchData.guests.infants || 0;
            } else if (rooms && rooms.length > 0) { const firstRoom = rooms[0];adults = firstRoom.adults || 2;cwb = firstRoom.cwb || 0; cnb = firstRoom.cnb || 0; infants = firstRoom.infants || 0;} else { adults = currentSearchParams.adults || 2;  cwb = currentSearchParams.cwb || 0; cnb = currentSearchParams.cnb || 0; infants = currentSearchParams.infants || 0;  }
            const totalPax = adults + cwb + cnb;
            const tourSelectionUrl = new URL('http://b2b.flydivinetravels.com/hotel/home-page');
            tourSelectionUrl.searchParams.set('city', city);
            tourSelectionUrl.searchParams.set('country', 'Georgia');
            tourSelectionUrl.searchParams.set('pax', totalPax.toString());
            tourSelectionUrl.searchParams.set('adult', adults.toString());
            tourSelectionUrl.searchParams.set('cwb', cwb.toString());
            tourSelectionUrl.searchParams.set('cnb', cnb.toString());
            tourSelectionUrl.searchParams.set('infant', infants.toString());
            tourSelectionUrl.searchParams.set('fromTripPlanner', 'true');
            tourSelectionUrl.searchParams.set('dayId', dayNumber);
            tourSelectionUrl.searchParams.set('checkInDate', checkInDate);
            tourSelectionUrl.searchParams.set('specificDayId', plannerItemId);
            tourSelectionUrl.searchParams.set('fromReadymadePackage', 'true');
            tourSelectionUrl.searchParams.set('rooms', encodeURIComponent(JSON.stringify(rooms)));
            sessionStorage.setItem('tourSelectionDayId', plannerItemId);
            sessionStorage.setItem('expectedDayId', plannerItemId);
            const tourSelectionData = {
                searchData: JSON.stringify({  ...searchData, rooms: rooms, guests: {adults: adults,  cwb: cwb,  cnb: cnb, infants: infants } }),
                plannerItems: JSON.stringify({ plannerItems,hotels,  activities, transfers, grandTotal,timestamp: new Date().toISOString() }),
                originalSearchParams: JSON.stringify({ ...originalSearchParams,  rooms: rooms, adults: adults, cwb: cwb,   cnb: cnb, infants: infants }),
                readymadeContext: JSON.stringify({ plannerItems, originalSearchParams, selectedItemId: plannerItemId })};
            sessionStorage.setItem('preservedReadymadeData', JSON.stringify(tourSelectionData));
            window.location.href = tourSelectionUrl.toString();
            return;  }
        const availableActivity = activities.find(activity =>!plannerItems.some(item => item.tours?.id === activity.id));   
        if (availableActivity) {const updatedItems = plannerItems.map(item => item.id === plannerItemId ? { ...item, tours: availableActivity, itinerary: undefined  } : item );
            setPlannerItems(updatedItems);
            calculateTotal(updatedItems);
            savePersistentTableData(updatedItems);
        } }
    console.log(`Add ${type} for:`, plannerItemId);
};
const handleHotelSelection2 = (itemId: string) => {
    const plannerItem = plannerItems.find(item => item.id === itemId);
    if (!plannerItem) return;
    const itemDate = new Date(plannerItem.date);
    const dayNumber = parseInt(itemId.replace('day-', '')) - 1;
    const deletedHotels = JSON.parse(sessionStorage.getItem('deletedHotels') || '[]');
    const dayHasHotel = plannerItems.find(item => item.id === itemId && item.hotel);
    if (dayHasHotel) { console.log("This day already has a hotel assigned");  return; }
    console.log("Day is available for hotel selection");
    const checkInDate = new Date(itemDate);
    const checkOutDate = new Date(itemDate);
    checkOutDate.setDate(checkOutDate.getDate() + 1);
    checkOutDate.setDate(checkOutDate.getDate() + 1);
    const fallbackSearchParams = {
        checkInDate: searchData?.checkInDate || new Date().toISOString(),
        checkOutDate: searchData?.checkOutDate || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        nights: searchData?.nights || searchData?.totalNights || 1,
        city: searchData?.destinations?.[0] || 'Batumi',
        country: 'Georgia',
        adults: searchData?.guests?.adults || 2,
        cwb: searchData?.guests?.cwb || 0,
        cnb: searchData?.guests?.cnb || 0,
        infants: searchData?.guests?.infants || 0,
        rooms: searchData?.room || [{ adults: 2, cwb: 0, cnb: 0, infants: 0 }],
        room: searchData?.room || [{ adults: 2, cwb: 0, cnb: 0, infants: 0 }]};
    const baseSearchParams = originalSearchParams || fallbackSearchParams;
    const originalCheckInDate = baseSearchParams.checkInDate || fallbackSearchParams.checkInDate;
    const originalCheckOutDate = baseSearchParams.checkOutDate || fallbackSearchParams.checkOutDate;
    const tripCheckOutDate = new Date(originalCheckOutDate);
    const isLastNight = checkOutDate.toDateString() === tripCheckOutDate.toDateString();
    
    const hotelSearchParams = {
        ...baseSearchParams,
        checkInDate: checkInDate.toISOString(),
        checkOutDate: checkOutDate.toISOString(),
        nights: 1,
        specificDayId: itemId,
        applyToAllDays: false,
        isHotelSpecific: true,
        isLastDay: isLastNight,
        country: baseSearchParams.country || 'Georgia',
        originalCheckInDate: originalCheckInDate,
        originalCheckOutDate: originalCheckOutDate,
        fromReadymadePackage: true,
        rooms: baseSearchParams.rooms || fallbackSearchParams.rooms,
        city: baseSearchParams.city || fallbackSearchParams.city,
        plannerItems: plannerItems,
        preservePosition: true,
        dayPosition: dayNumber,
        Description: '',
    };
    if (isLastNight) {
        const extraDay = new Date(checkOutDate);
        const additionalSearchParams = { ...hotelSearchParams,  checkInDate: extraDay.toISOString(),checkOutDate: new Date(extraDay.setDate(extraDay.getDate() + 1)).toISOString()};
        sessionStorage.setItem('lastNightHotelParams', JSON.stringify(additionalSearchParams));}
    sessionStorage.setItem('tripPlannerParams', JSON.stringify(baseSearchParams));
    sessionStorage.setItem('hotelSearchParams', JSON.stringify(hotelSearchParams));
    sessionStorage.setItem('readymadePackageContext', JSON.stringify({ plannerItems: plannerItems,originalSearchParams: baseSearchParams,selectedItemId: itemId, dayPosition: dayNumber }));
    console.log(`Opening hotel selection for day ${itemId} at position ${dayNumber}`);
    navigate('/trip-planner-area', { state: hotelSearchParams });
};
const handleRemoveTour = (plannerItem: PlannerItem2) => {
    const tourToRemove = plannerItem.tours;
    const itineraryToRemove = plannerItem.itinerary;
    if (!tourToRemove && !itineraryToRemove) return;
    console.log('Removing tour/itinerary from day:', plannerItem.id);
    const updatedItems = plannerItems.map(item =>item.id === plannerItem.id ? {  ...item,  tours: undefined,itinerary: tourToRemove ? item.itinerary : undefined  } : item );
    setPlannerItems(updatedItems);
    sessionStorage.setItem('tripPlannerItems', JSON.stringify(updatedItems));
    savePersistentTableData(updatedItems);
    const newTotal = calculateTotalWithPackageData(updatedItems, searchData?.packageData?.packageDetails);
    console.log('New total after removal:', newTotal);
    if (tourToRemove?.id) {
        const updatedActivities = activities.filter(activity => activity.id !== tourToRemove.id);
        setActivities(updatedActivities);
        saveActivitiesToSession(updatedActivities);
        const deletedActivities = JSON.parse(sessionStorage.getItem('deletedActivities') || '[]');
        if (!deletedActivities.includes(tourToRemove.id)) { deletedActivities.push(tourToRemove.id);
            sessionStorage.setItem('deletedActivities', JSON.stringify(deletedActivities)); }
        const tourMapping = JSON.parse(sessionStorage.getItem('tourDayMapping') || '{}');
        delete tourMapping[tourToRemove.id];
        sessionStorage.setItem('tourDayMapping', JSON.stringify(tourMapping));}
    if (itineraryToRemove && searchData?.packageData?.packageDetails?.itinerary) {
        const deletedItineraries = JSON.parse(sessionStorage.getItem('deletedItineraries') || '[]');
        const itineraryId = itineraryToRemove.id || `itinerary-${plannerItem.id}`;
        if (!deletedItineraries.includes(itineraryId)) {
            deletedItineraries.push(itineraryId);
            sessionStorage.setItem('deletedItineraries', JSON.stringify(deletedItineraries));} }
};

useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const encoded = urlParams.get("tourData");
    console.log("tour data from Tour site",encoded)
    if (encoded) {
    try { const parsedData = JSON.parse(decodeURIComponent(encoded)); setSelectedTourData(parsedData); console.log("Tour data received:", parsedData);} 
    catch (err) {  console.error("Invalid tour data", err);} }
}, []);

const prepareTripPlannerDataForDB = (plannerItems: PlannerItem2[], searchData: SearchData, hotels: any[],activities: any[],transfers: any[], grandTotal: number, marginTotal: string,originalSearchParams: any,packageData?: any): TripPlannerDBData => {
    const getAllHotelsFromSources = (): ReadyMadeHotel[] => {
        const allHotels: ReadyMadeHotel[] = [];
        plannerItems.forEach(item => {
        if (item.hotel) { allHotels.push({ ...item.hotel,specificDayId: item.hotel.specificDayId ?? item.id, checkInDate: item.hotel.checkInDate ?? '', checkOutDate: item.hotel.checkOutDate ?? '', isAssigned: true,source: 'planner', cityId: item.hotel.cityId || item.hotel.city || searchData?.destinations || originalSearchParams?.cityId, city: item.hotel.city || item.hotel.destination || searchData?.destinations || originalSearchParams?.city});} });
        const sessionHotels: ReadyMadeHotel[] = JSON.parse(sessionStorage.getItem('existingReadymadeHotels') || '[]');
        sessionHotels.forEach(hotel => {
        if (!allHotels.find(h => h.id === hotel.id || h.uniqueId === hotel.uniqueId)) { allHotels.push({ ...hotel,specificDayId: hotel.specificDayId ?? '', checkInDate: hotel.checkInDate ?? '',checkOutDate: hotel.checkOutDate ?? '', isAssigned: !!hotel.specificDayId,cityId: hotel.cityId || hotel.city || searchData?.destinations || originalSearchParams?.cityId, city: hotel.city || hotel.destination || searchData?.destinations || originalSearchParams?.city });}});
        if (hotels && hotels.length > 0) {hotels.forEach(hotel => {if (!allHotels.find(h => h.id === hotel.id || h.uniqueId === hotel.uniqueId)) {allHotels.push({ ...hotel,  specificDayId: '', checkInDate: '', checkOutDate: '', isAssigned: false }); } });}
        return allHotels;};
    const getAllActivitiesFromSources = () => {
        const allActivities : Activity[]= [];
        plannerItems.forEach(item => { if (item.tours) {allActivities.push({ ...item.tours,  dayId: item.id, isAssigned: true, type: 'tour' });  } }); 
        const sessionActivities = JSON.parse(sessionStorage.getItem('readymadeActivities') || '[]');
        sessionActivities.forEach(activity => {if (!allActivities.find(a => a.id === activity.id)) {allActivities.push({ ...activity,  isAssigned: !!activity.assignedDayId,   type: 'activity' }); } });
        if (activities && activities.length > 0) { activities.forEach(activity => { if (!allActivities.find(a => a.id === activity.id)) {  allActivities.push({ ...activity, isAssigned: false,   type: 'activity' }); }}); }
        return allActivities;
    };
    
    const getAllTransfersFromSources = (): Transfer[] => {
        const allTransfers: Transfer[] = [];
        plannerItems.forEach(item => {if (item.transfer) { allTransfers.push({  ...item.transfer, isAssigned: true, vehicle: item.transfer.vehicle ?? ''});}  });
        if (transfers && transfers.length > 0) { transfers.forEach(transfer => { if (!allTransfers.find(t => t.id === transfer.id)) {allTransfers.push({  ...transfer, isAssigned: false, vehicle: transfer.vehicle ?? '' });   }  }); }
        return allTransfers; };
    const getAllItinerariesFromSources = (): PackageItinerary[] => {
        const allItineraries: PackageItinerary[] = []; plannerItems.forEach(item => {
        if (item.itinerary) {  allItineraries.push({  ...item.itinerary,isAssigned: true,dayId: item.id,  isUpdated: item.itinerary.isUpdated ?? false});}});
        if (packageData?.itinerary && Array.isArray(packageData.itinerary)) {  packageData.itinerary.forEach(itinerary => {
            if (!allItineraries.find(i => i.id === itinerary.id)) { allItineraries.push({ ...itinerary,  isAssigned: false,  dayId: '',   isUpdated: itinerary.isUpdated ?? false,  isPackageItinerary: true});} }); }
        return allItineraries;
    };
    const calculateComprehensiveCostBreakdown = () => {
        let hotelsCost = 0;
        let activitiesCost = 0;
        let transfersCost = 0;
        let itineraryCost = 0;
        const allHotels = getAllHotelsFromSources();
        const allActivities = getAllActivitiesFromSources();
        const allTransfers = getAllTransfersFromSources();
        const allItineraries = getAllItinerariesFromSources();
        allHotels.forEach(hotel => { if (hotel.price && !hotel.isDeleted) { hotelsCost += Number(hotel.price); } });
        allActivities.forEach(activity => {if (activity.price && !activity.isDeleted) {  activitiesCost += Number(activity.price); } });
        allTransfers.forEach(transfer => { if (transfer.price && !transfer.isDeleted) {transfersCost += Number(transfer.price);  }; });
        allItineraries.forEach(itinerary => { if (itinerary.price) {  itineraryCost += Number(itinerary.price);  }});
        return { hotelsCost, activitiesCost, transfersCost, itineraryCost }; };
    const prepareComprehensivePlannerItems = () => {
        return plannerItems.map((item, index) => ({
            dayId: item.id,
            date: item.date.toISOString(),
            dayNumber: index + 1,
            
            hotel: item.hotel ? {
                id: item.hotel.id,
                name: item.hotel.name,
                destination: item.hotel.destination,
                nights: item.hotel.nights || 1,
                price: Number(item.hotel.price) || 0,
                rating: item.hotel.rating || 0,
                checkInDate: item.hotel.checkInDate,
                checkOutDate: item.hotel.checkOutDate,
                roomType: item.hotel.roomType,
                mealPlan: item.hotel.mealPlan,
                isAdditional: item.hotel.isAdditional || false,
                specificDayId: item.hotel.specificDayId,
                cityId: item.hotel.cityId || item.hotel.city || searchData?.destinations || originalSearchParams?.cityId,
                city: item.hotel.city || item.hotel.destination || searchData?.destinations || originalSearchParams?.city,
                
            } : undefined,
            
            tours: item.tours ? {
                id: item.tours.id,
                name: item.tours.name,
                price: Number(item.tours.price) || 0,
                description: item.tours.description || '',
                duration: item.tours.duration || '',
                city: item.tours.city || '',
                assignedDayId: item.tours.assignedDayId || item.id,
                isAdditional: item.tours.isAdditional || false,
                isUpdated: item.tours.isUpdated || false,
                currency: item.tours.currency || 'USD',
                type: item.tours.type || 'tour',
            } : undefined,
            
            transfer: item.transfer ? {
                id: item.transfer.id,
                name: item.transfer.name,
                route: item.transfer.route || `${item.transfer.from} - ${item.transfer.to}`,
                price: Number(item.transfer.price) || 0,
                from: item.transfer.from,
                to: item.transfer.to,
                vehicleType: item.transfer.vehicleType,
                type: item.transfer.type,
                isPackageTransfer: item.transfer.isPackageTransfer || false,
            } : undefined,
            
            itinerary: item.itinerary ? {
                id: item.itinerary.id || `itinerary-${item.id}`,
                title: item.itinerary.title || '',
                description: item.itinerary.description || '',
                details: item.itinerary.details || '',
                price: Number(item.itinerary.price) || 0,
                activities: item.itinerary.activities || [],
                isUpdated: item.itinerary.isUpdated || false,
                isPackageItinerary: item.itinerary.isPackageItinerary || false,
                day: item.itinerary.day || index + 1,
            } : undefined
        }));
    };
    const calculateTotalsFromRooms = (rooms: any[]) => {
        if (!rooms || rooms.length === 0) { return {totalAdults: 2, totalCWB: 0,  totalCNB: 0, totalInfants: 0, totalChildren: 0, totalRooms: 1 };  }
        const totalAdults = rooms.reduce((sum, room) => { const adults = parseInt(room?.adults) || 0;  return sum + adults; }, 0);
        const totalCWB = rooms.reduce((sum, room) => {const cwb = parseInt(room?.cwb) || 0; return sum + cwb; }, 0);
        const totalCNB = rooms.reduce((sum, room) => { const cnb = parseInt(room?.cnb) || 0;return sum + cnb; }, 0);
        const totalInfants = rooms.reduce((sum, room) => { const infants = parseInt(room?.infants) || 0;return sum + infants;}, 0);
        return { totalAdults,totalCWB, totalCNB, totalInfants, totalChildren: totalCWB + totalCNB, totalRooms: rooms.length  };
    };
    const getRoomsData = () => {let rooms = originalSearchParams?.rooms || searchData?.room || [{ adults: 2, cwb: 0, cnb: 0, infants: 0 }];console.log('Rooms data found:', rooms); return rooms;};
    const rooms = getRoomsData();
    const totals = calculateTotalsFromRooms(rooms);
    const costBreakdown = calculateComprehensiveCostBreakdown();
    const comprehensivePlannerItems = prepareComprehensivePlannerItems();
    return {
    tripDetails: {
        destination: originalSearchParams?.city || searchData?.destinations?.[0] || 'Batumi',
        country: originalSearchParams?.country || 'Georgia',
        checkInDate: originalSearchParams?.checkInDate || searchData?.checkInDate,
        checkOutDate: originalSearchParams?.checkOutDate || searchData?.checkOutDate,
        nights: originalSearchParams?.nights || searchData?.nights || searchData?.totalNights || 3,
        totalDays: plannerItems.length,
        adults: totals.totalAdults,
        children: (originalSearchParams?.cwb || 0) + (originalSearchParams?.cnb || 0) + (searchData?.guests?.cwb || 0) + (searchData?.guests?.cnb || 0),
        infants: originalSearchParams?.infants || searchData?.guests?.infants || 0,
        rooms: originalSearchParams?.rooms || searchData?.room || [],
        cityId: searchData?.cityId || originalSearchParams?.cityId

    },
    pricing: {
        grandTotal: grandTotal,
        marginTotal: marginTotal,
        breakdown: costBreakdown
    },
    plannerItems: comprehensivePlannerItems,
    metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
};
};

const handleDownloadPDF = async () => {setLoading(true);
    try {
        const currentHotels = JSON.parse(sessionStorage.getItem('existingReadymadeHotels') || '[]');
        const currentActivities = JSON.parse(sessionStorage.getItem('readymadeActivities') || '[]');
        const currentTransfers = JSON.parse(sessionStorage.getItem('tripTransfers') || '[]');
        const dbData = prepareTripPlannerDataForDB(  plannerItems,searchData,currentHotels, currentActivities,currentTransfers, grandTotal,marginTotal,  originalSearchParams, searchData?.packageData?.packageDetails);
        const result = await submitPackageData(dbData).unwrap();
        console.log('Complete trip data saved successfully:', result);
        setTimeout(() => { setLoading(false);setShowThankYou(true);
            console.log('PDF generated successfully with all trip data');
            const keysToRemove = ['persistentTableData', 'readymadeSearchData', 'originalReadymadeSearchData','existingReadymadeHotels', 'readymadeActivities', 'tripTransfers','deletedHotels', 'deletedActivities','deletedItineraries','deletedTransfers', 'tourDayMapping', 'hotelPositionMapping','tripPlannerItems' ];
            keysToRemove.forEach(key => sessionStorage.removeItem(key));   }, 2000);
    } catch (error) {setLoading(false);
        console.error('Error saving comprehensive trip data:', error);
        alert('Failed to save trip data. Please try again.');}
};
return (
        <Box className="trip-planner-page">
            <Container sx={{ paddingLeft: '0rem', paddingRight: '0rem', maxWidth: '100%' }}>
                {!showThankYou && (
                    <>
                        <Box className="search-info heading">
                        <Typography variant="h5" component="h1">  {displayCity} | {displayNights} NIGHT/S | {displayCheckInDate} - {displayCheckOutDate} </Typography>
                        <Button className="modify-search" onClick={() => setShowModifySearch(!showModifySearch)}>  Modify search <ArrowDownIcon width="16" height="16" fill="#000" /> </Button>
                        </Box>
                        {showModifySearch && ( <div className="modify-search-container"> <Typography>Modify search form will go here</Typography></div> )}
                        <Box sx={{ mb: 0, height: '2rem' }} className='tablist-container'>
                            <Tabs className='tablist-btn' value={activeTab} onChange={handleTabChange} sx={{ color: 'black' }}>
                                <Tab className='planner-btn' value="planner" label="Planner" sx={{ color: activeTab === 'planner' ? 'white' : 'black', bgcolor: activeTab === 'planner' ? 'grey' : 'white', marginLeft: '0rem', width: '10rem' }} />{showHotelTab && (
                                <Tab className='hotel-btn' value="hotel" label="Hotel Details"   sx={{color: activeTab === 'hotel' ? 'white' : 'black', bgcolor: activeTab === 'hotel' ? 'grey' : 'white', marginLeft: '0.5rem', width: '10rem' }} /> )}
                            </Tabs>
                        </Box>
                    </>
                )}
                {activeTab === 'planner' && !showThankYou && (
                    <Paper elevation={3} className="planner-table-container">
                        <Box className="planner-table">
                            <Box className="table-header">
                                <Box className="header-cell date-cell">Date</Box>{packageType === 'hotel-land' && <Box className="header-cell">Hotel</Box>}
                                <Box className="header-cell">Tours</Box>
                            </Box>
                            {plannerItems.map((plannerItem) => (
                                <Box key={plannerItem.id} className="table-row">
                                    <Box className="cell date-cell">
                                        <Typography className='date-cell-1' variant="body2"> {formatDate(plannerItem.date)} </Typography>
                                        <Typography className='date-cell-2' variant="body2"> {formatYear(plannerItem.date)} </Typography>
                                    </Box>
                                    {packageType === 'hotel-land' && (
                                        <Box className="cell">
                                            {plannerItem.hotel ? (
                                                <Box className="selected-hotel" sx={{ position: 'relative', padding: '8px' }}>
                                                    <Typography className='hotel_name' variant="body2"  sx={{ fontSize: '0.8rem', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', textAlign: 'center', maxWidth: '100%', paddingRight: '24px' }}> {plannerItem.hotel.name}
                                                    </Typography>
                                                    <IconButton sx={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)' }}  className="remove-button" onClick={() => handleRemoveHotel(plannerItem)} aria-label="Remove hotel" size="small">
                                                    <DeleteOutline sx={{ color: '#777777', fontSize: '1rem' }} />
                                                    </IconButton>
                                                </Box>
                                            ) : (
                                                <Box display="flex" justifyContent="flex-end">
                                                    <IconButton className="add-button"  onClick={() => handleHotelSelection2(plannerItem.id)}  sx={{ color: '#777777', fontSize: '1rem', '& .MuiSvgIcon-root': { fill: 'grey' } }}>
                                                        <AddCircleOutline className='add-btn'/>
                                                    </IconButton>
                                                </Box>
                                            )}
                                        </Box>
                                    )}
                    <Box className="cell">
                    {(plannerItem.itinerary || plannerItem.tours) ? (
                        <Box className="selected-tour" sx={{ position: 'relative', padding: '8px' }}>
                        <Typography variant="body2" sx={{ fontSize: '0.8rem', textOverflow: 'ellipsis', textAlign: 'center', maxWidth: '100%', paddingRight: '24px' }}> {plannerItem.tours?.name || plannerItem.itinerary?.title || 'No Tour Info'}
                        </Typography>
                        <IconButton sx={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)' }} className="remove-button" onClick={() => handleRemoveTour(plannerItem)} aria-label="Remove tour"size="small" ><DeleteOutline sx={{ color: '#777777', fontSize: '1rem' }} /></IconButton>
                        </Box>) : (
                        <Box display="flex" justifyContent="flex-end">
                        <IconButton className="add-button"onClick={() => handleAddItem(plannerItem.id, 'tours')} aria-label="Add tours"  sx={{ color: '#777777', fontSize: '1rem', "& .MuiSvgIcon-root": { fill: 'grey' } }}> <AddCircleOutline className='add-btn' /></IconButton>
                        </Box>)}
                    </Box>
                    </Box> ))}
                        </Box>
                        <Box className="total-section" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1, padding: '16px' }}>
                            <Box className="total-row" sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                <Typography className="label">Net Total:</Typography>
                                <Typography className="value">USD {grandTotal.toFixed(2)}</Typography>
                            </Box>
                            <Box className="total-row" sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                <Typography className="label">Add Margin:</Typography>
                                <Box className="value" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>USD
                                <TextField type="number" value={marginTotal} onChange={handleMarginChange} size="small"  sx={{ width: '4rem', height: '2rem' }} />
                                </Box>
                            </Box>
                            <Box className="total-row" sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                <Typography className="label">Final Amt:</Typography>
                                <Typography className="value">USD {(grandTotal + (parseFloat(marginTotal) || 0)).toFixed(2)} </Typography>
                            </Box>
                        </Box>
                        
                        <Box className="action-buttons_cont" >
                            <Button className="proceed-button" onClick={handleDownloadPDF} disabled={loading} sx={{ minWidth: '120px' }}>  {loading ? <CircularProgress size={24} /> : 'Download Now'} </Button>
                            <Button className="cancel-button" onClick={onCancel}>   Cancel  </Button>
                        </Box>
                    </Paper>
                )}
                
                {activeTab === 'hotel' && showHotelTab && !showThankYou && (
                    <Paper elevation={3} className="hotel-details-container" sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
                        <Box sx={{ padding: '16px' }}>
                            <Typography variant="h6" sx={{ marginBottom: '16px' }}>Hotel Details</Typography>
                            {hotels.map((hotel, index) => (
                                <Box key={hotel.id || index} sx={{ marginBottom: '16px', padding: '16px', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
                                    <Typography variant="h6">{hotel.name}</Typography>
                                    <Typography variant="body2">Destination: {hotel.destination}</Typography>
                                    <Typography variant="body2">Nights: {hotel.nights}</Typography>
                                    <Typography variant="body2">Price: {currency} {hotel.price}</Typography>
                                    {hotel.rating && <Typography variant="body2">Rating: {hotel.rating}/5</Typography>}
                                </Box>
                            ))}
                        </Box>
                    </Paper>
                )}
                {showThankYou && (
                    <Paper elevation={3} className="thank-you-container" sx={{ padding: '2rem', margin: '2rem 0', textAlign: 'center', bgcolor: '#f8f8f8', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
                        <Typography variant="h4" sx={{ color: '#4CAF50', marginBottom: '1rem' }}>Thank You!</Typography>
                        <Typography variant="body1" sx={{ marginBottom: '1rem', fontSize: '1.3rem' }}> 
                        Thanks Four Connecting
                        </Typography>
                    </Paper>
                )}
            </Container>
        </Box>
    );
};
export default TripPlannerReadyMade;