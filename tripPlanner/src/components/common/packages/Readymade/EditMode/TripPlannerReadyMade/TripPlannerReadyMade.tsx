import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Box,Container,Typography,Button,Paper, Tabs,Tab, IconButton,TextField,CircularProgress, Grid} from "@mui/material";
import { AddCircleOutline, DeleteOutline} from "@mui/icons-material";
import './TripPlannerReadyMade.scss';
import { useSubmitPackageDataMutation } from "../../../../../../api/TourAPI.tsx";
import { SearchData, PlannerItem2, PackageHotel, PackageData, TripPlannerDBData } from "../../../../../../types/types.ts";
import { TRIP_PLANNER } from "../../../../../../utils/ApiConstants.ts";
import { initDB, STORES, saveToDB, getFromDB } from "../../../../../../utils/TripPlannerDB.ts";

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
const [packageType, setPackageType] = useState<string>('hotel-land');
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
        return {city: searchData?.destinations?.[0] || searchData?.destinations || 'Batumi',
            nights: nights,totalNights: nights, checkInDate: checkInDate, checkOutDate: checkOutDate,
            rooms: searchData?.room?.[0] || searchData?.room || [{ adults: 2, cwb: 0, cnb: 0, infants: 0 }],
            country: searchData?.country   ,adults: searchData?.guests?.adults || 2,cwb: searchData?.guests?.cwb || 0,cnb: searchData?.guests?.cnb || 0, infants: searchData?.guests?.infants || 0 }; }
    return { city: 'Batumi', nights: 3, totalNights: 3,
        checkInDate: new Date().toISOString(),
        checkOutDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), 
        rooms: [{ adults: 2, cwb: 0, cnb: 0, infants: 0 }] ,adults: 2, cwb: 0,cnb: 0, infants: 0 };
})();
const [submitPackageData, { isLoading: isSubmitting }] = useSubmitPackageDataMutation();
const displayCity = currentSearchParams.city;
const displayNights = currentSearchParams.nights;
const displayCheckInDate = new Date(currentSearchParams.checkInDate).toLocaleDateString();
const displayCheckOutDate = new Date(currentSearchParams.checkOutDate).toLocaleDateString();

const savePersistentTableData = async (items: PlannerItem2[]) => {
    try {
        const verifiedTotal = await calculateTotalWithPackageData(items, searchData?.packageData?.packageDetails);
        const tableData = {plannerItems: items, hotels, activities, transfers, grandTotal: verifiedTotal,
            timestamp: new Date().toISOString(),
            breakdown: {totalHotels: hotels.length, totalActivities: activities.length, totalTransfers: transfers.length,itemsWithHotels: items.filter(item => item.hotel).length,itemsWithTours: items.filter(item => item.tours).length,itemsWithTransfers: items.filter(item => item.transfer).length}};
        const db = await initDB();
        const transaction = db.transaction([STORES.plannerData], 'readwrite');
        const objectStore = transaction.objectStore(STORES.plannerData);
        await new Promise((resolve, reject) => {
            const deleteRequest = objectStore.delete('persistentTableData');
            deleteRequest.onsuccess = () => resolve(true);
            deleteRequest.onerror = () => reject(deleteRequest.error);
        });
        await new Promise((resolve, reject) => {
            const putRequest = objectStore.put({ id: 'persistentTableData', data: tableData });
            putRequest.onsuccess = () => resolve(true);
            putRequest.onerror = () => reject(putRequest.error);
        });
        console.log('Table data forcefully updated in IndexedDB');
    } catch (error) {
        console.error('Error saving persistent table data:', error);
    }
};

const createPlannerItemsWithPackageData = async (hotelList: any[], activityList: any[], transferList: any[], packageData?: PackageData) => {
    const items: PlannerItem2[] = [];
    const startDate = new Date(currentSearchParams.checkInDate);
    const nights = currentSearchParams.nights || currentSearchParams.totalNights || 3;
    const totalDays = nights + 1;
    const getStorage = async (store: string, key: string, def: any = []) => {try { return await getFromDB(store, key, def); } catch (e) { return def; }};
    const deletedItineraries = await getStorage(STORES.deletedItems, 'itineraries', []);
    const deletedHotels = await getStorage(STORES.deletedItems, 'hotels', []);
    const deletedActivities = await getStorage(STORES.deletedItems, 'activities', []);
    const tourMapping = await getStorage(STORES.tourMapping, 'tourDayMapping', {});
    let currentDate = new Date(startDate);
    for (let i = 0; i < totalDays; i++) {
        const itineraryId = `itinerary-day-${i + 1}`;
        items.push({id: `day-${i + 1}`, date: new Date(currentDate), hotel: undefined, tours: undefined, transfer: undefined,itinerary: (!deletedItineraries.includes(itineraryId) && packageData?.itinerary?.[i]) ? packageData.itinerary[i] : undefined, dateObj: new Date(currentDate).toISOString()});
        currentDate.setDate(currentDate.getDate() + 1);
    }
    const packageHotels = hotelList.filter(h => h.isPackageHotel && typeof h.packageIndex === 'number').sort((a, b) => (a.packageIndex || 0) - (b.packageIndex || 0));
    const additionalHotels = hotelList.filter(h => !h.isPackageHotel || h.isAdditional || h.specificDayId);
    const originalHotelMapping = new Map();
    let currentDayIndex = 0;
    if (packageData?.hotelOption?.[0]?.hotels) {
        packageData.hotelOption[0].hotels.forEach((originalHotel, index) => {
            const hotelNights = originalHotel.nights || 1;
            const isDeleted = deletedHotels.some((deleted: any) => (deleted.name === originalHotel.name && deleted.destination === originalHotel.destination) || deleted.packageIndex === index);
            originalHotelMapping.set(index, {
                startDay: currentDayIndex, endDay: Math.min(currentDayIndex + hotelNights - 1, totalDays - 2),
                nights: hotelNights, isDeleted, hotelData: originalHotel});
            currentDayIndex += hotelNights;
            if (index === packageData.hotelOption[0].hotels.length - 1 && !isDeleted) { originalHotelMapping.get(index).endDay = totalDays - 1; }
        });
    }
    packageHotels.forEach((hotel) => {
        const isDeleted = deletedHotels.some((deleted: any) => (deleted.name === hotel.name && deleted.destination === hotel.destination) || deleted.uniqueId === hotel.uniqueId || deleted.packageIndex === hotel.packageIndex);
        if (isDeleted) return;
        const originalMapping = originalHotelMapping.get(hotel.packageIndex);
        if (!originalMapping) return;
        const { startDay, endDay } = originalMapping;
        const checkInDate = new Date(items[startDay].date);
        const checkOutDate = new Date(items[startDay].date);
        const hotelNights = originalMapping.nights || (endDay - startDay + 1);
        const isLastHotel = hotel.packageIndex === Math.max(...packageHotels.map(h => h.packageIndex || 0));
        checkOutDate.setDate(checkOutDate.getDate() + (isLastHotel ? hotelNights : hotelNights - 1));
        for (let dayIndex = startDay; dayIndex <= endDay && dayIndex < items.length; dayIndex++) {
            items[dayIndex].hotel = { ...hotel, checkInDate: checkInDate.toISOString(), checkOutDate: checkOutDate.toISOString(),displayInfo: {isFirstDay: dayIndex === startDay, isLastDay: dayIndex === endDay, dayNumber: dayIndex - startDay + 1, totalDays: endDay - startDay + 1}
            };
        }
    });
    additionalHotels.forEach((hotel) => {
        if (hotel.specificDayId) {
            const dayIndex = items.findIndex(item => item.id === hotel.specificDayId);
            if (dayIndex === -1) return;

            const checkInDate = new Date(items[dayIndex].date);
            const checkOutDate = new Date(checkInDate);
            checkOutDate.setDate(checkOutDate.getDate() + 1);

            const hotelData = {
                ...hotel, isAdditional: true, checkInDate: checkInDate.toISOString(), checkOutDate: checkOutDate.toISOString(),
                img: hotel.img || hotel.hotel?.imageUrl,
                displayInfo: { isFirstDay: true, isLastDay: true, dayNumber: 1, totalDays: 1 }
            };
            items[dayIndex].hotel = hotelData;

            if (dayIndex === totalDays - 2) {
                const lastDayIndex = totalDays - 1;
                const extendedCheckOut = new Date(checkInDate);
                extendedCheckOut.setDate(extendedCheckOut.getDate() + 2);
                items[lastDayIndex].hotel = {
                    ...hotelData, checkOutDate: extendedCheckOut.toISOString(),
                    displayInfo: { isFirstDay: false, dayNumber: 2, totalDays: 2 }
                };
            }
        } else if (hotel.checkInDate && hotel.checkOutDate) {
            const checkInDate = new Date(hotel.checkInDate);
            const checkOutDate = new Date(hotel.checkOutDate);
            checkInDate.setHours(0, 0, 0, 0);
            checkOutDate.setHours(0, 0, 0, 0);

            const findDayIndex = (date: Date) => items.findIndex(item => {
                const itemDate = new Date(item.date);
                itemDate.setHours(0, 0, 0, 0);
                return itemDate.getTime() === date.getTime();
            });

            const checkInDayIndex = findDayIndex(checkInDate);
            const checkOutDayIndex = findDayIndex(checkOutDate);

            if (checkInDayIndex !== -1) {
                const numNights = checkOutDayIndex - checkInDayIndex;
                const isFullItinerary = checkInDayIndex === 0 && checkOutDayIndex === totalDays - 1;
                const isLastDayCheckout = checkOutDayIndex === totalDays - 1;

                let startShowIndex = checkInDayIndex;
                let endShowIndex = isFullItinerary ? totalDays - 1 : isLastDayCheckout ? checkOutDayIndex : numNights === 2 ? checkInDayIndex + 1 : numNights === 1 && checkOutDayIndex < totalDays - 1 ? checkInDayIndex : checkOutDayIndex - 1;

                for (let i = startShowIndex; i <= endShowIndex; i++) {
                    items[i].hotel = {
                        ...hotel, checkInDate: hotel.checkInDate, checkOutDate: hotel.checkOutDate,
                        displayInfo: {
                            isFirstDay: i === startShowIndex, isLastDay: i === endShowIndex,
                            dayNumber: i - startShowIndex + 1, totalDays: endShowIndex - startShowIndex + 1
                        }
                    };
                }
            }
        }
    });

    // Assign activities
    activityList.forEach((activity) => {
        if (deletedActivities.includes(activity.id)) return;
        const assignedDayId = activity.assignedDayId || tourMapping[activity.id];
        if (assignedDayId) {
            const dayIndex = items.findIndex(item => item.id === assignedDayId);
            if (dayIndex !== -1) items[dayIndex].tours = activity;
        } else {
            const availableDayIndex = items.findIndex(item => !item.tours);
            if (availableDayIndex !== -1) items[availableDayIndex].tours = activity;
        }
    });

    transferList.forEach((transfer, index) => {
        if (index < items.length) items[index].transfer = transfer;
    });

    setPlannerItems(items);
    await calculateTotalWithPackageData(items, packageData);
    await savePersistentTableData(items);
    await saveToDB(STORES.plannerData, 'items', items);
};

const clearAllPlannerData = async () => {
    const db = await initDB();
    const stores = [STORES.plannerData, STORES.hotels, STORES.activities, STORES.tourMapping, STORES.deletedItems];
    const transaction = db.transaction(stores, 'readwrite');
    stores.forEach(store => transaction.objectStore(store).clear());
    await new Promise(resolve => transaction.oncomplete = () => resolve(true));
};

const createEmptyPlannerItems = () => {
    const items: PlannerItem2[] = [];
    const startDate = new Date(currentSearchParams.checkInDate);
    const nights = currentSearchParams.nights || currentSearchParams.totalNights || 3;
    const totalDays = nights + 1;
    let currentDate = new Date(startDate);
    for (let i = 0; i < totalDays; i++) {items.push({ id: `day-${i + 1}`, date: new Date(currentDate), dateObj: "" });currentDate.setDate(currentDate.getDate() + 1);}
    setPlannerItems(items);
    saveToDB(STORES.plannerData, 'items', items);
};

const calculateTotalWithPackageData = async (items: PlannerItem2[], packageData?: PackageData) => {
    let total = 0;
    const processedHotels = new Set();
    const processedTours = new Set();
    const processedTransfers = new Set();
    let roomCount = 1;
    if (searchData?.room) { roomCount = Array.isArray(searchData.room) ? searchData.room.length : Number(searchData.room) || 1;
    } else if (currentSearchParams?.rooms) {roomCount = Array.isArray(currentSearchParams.rooms) ? currentSearchParams.rooms.length : Number(currentSearchParams.rooms) || 1;
    } else if (originalSearchParams?.rooms) {roomCount = Array.isArray(originalSearchParams.rooms) ? originalSearchParams.rooms.length : Number(originalSearchParams.rooms) || 1;}
    if (currentSearchParams?.pricing) {total = currentSearchParams.pricing.totalPrice || 0;
    } else if (packageData && searchData?.packageData?.packageDetails?.hotelOption?.[0]?.totalPackageCost) { total = Number(searchData.packageData.packageDetails.hotelOption[0].totalPackageCost);}
    const deletedHotels = await getFromDB(STORES.deletedItems, 'hotels', []);
    deletedHotels.forEach((deletedHotel: { originalPrice: number; }) => {
        if (deletedHotel.originalPrice) total -= deletedHotel.originalPrice;
    });
    items.forEach((item) => {
        if (item.itinerary?.price) total += item.itinerary.price;
        if (item.tours) {
            const tourKey = `${item.tours.id}-${item.id}`;
            if (!processedTours.has(tourKey)) {
                const tourPrice = Number(item.tours.price) || 0;
                if (tourPrice > 0) { total += tourPrice;processedTours.add(tourKey);}
            }
        }
        if (item.transfer) {
            const transferKey = `${item.transfer.id}-${item.id}`;
            if (!processedTransfers.has(transferKey)) {
                const transferPrice = Number(item.transfer.price) || 0;
                if (transferPrice > 0) {total += transferPrice;processedTransfers.add(transferKey);}
            }
        }

        if (item.hotel) {
            const hotelKey = `${item.hotel.id}-${item.hotel.uniqueId || item.hotel.specificDayId || 'default'}`;
            if (!processedHotels.has(hotelKey)) {
                const baseHotelPrice = Number(item.hotel.price);
                const hotelRoomCount = item.hotel.rooms || roomCount;
                const actualHotelPrice = baseHotelPrice * hotelRoomCount;
                if (actualHotelPrice > 0) {if (item.hotel.isAdditional || item.hotel.specificDayId || !item.hotel.isPackageHotel) {total += actualHotelPrice; }processedHotels.add(hotelKey);}
            }
        }
    });
    setGrandTotal(total);
    return total;
};

useEffect(() => {
    const handleUrlTourData = async () => {
        const urlParams = new URLSearchParams(window.location.search);
        const addedToPlanner = urlParams.get('addedToPlanner') === 'true';
        const specificDayId = urlParams.get('specificDayId');
        const encodedTourData = urlParams.get('tourData');
        if (addedToPlanner && specificDayId && searchData) {
            await new Promise(resolve => setTimeout(resolve, 100));
            let storedTour: any = {};
            if (encodedTourData) {
                try { storedTour = JSON.parse(decodeURIComponent(encodedTourData)); } 
                catch (error) { console.error('Error parsing tourData from URL:', error); }}
            if (!storedTour.tourDetails && !storedTour.tour) {storedTour = await getFromDB(STORES.activities, 'selectedTourData', {});}
            if (storedTour && (storedTour.tourDetails || storedTour.tour)) {
                const tourData = storedTour.tourDetails || storedTour.tour;
                const bookingData = storedTour.booking || {};
                const newActivity = {
                    id: tourData.id || `tour-${Date.now()}`,
                    name: tourData.name || tourData.tourName || tourData.sightName,
                    price: bookingData.totalPrice || tourData.price || 0,
                    description: tourData.description || '', duration: tourData.eventDuration || '',
                    city: tourData.city || bookingData.city || '', currency: bookingData.currency || tourData.currency || 'USD',
                    date: bookingData.date || '', assignedDayId: specificDayId, type: 'tour'
                };
                setActivities(prevActivities => {
                    const existingTour = prevActivities.find(activity =>activity.id === newActivity.id || (activity.name === newActivity.name && activity.assignedDayId === specificDayId));
                    if (existingTour) return prevActivities;
                    const updatedActivities = [...prevActivities, newActivity];
                    saveToDB(STORES.activities, 'readymadeActivities', updatedActivities);
                    return updatedActivities;
                });
                const updatePlannerWithRetry = () => {
                    setPlannerItems(prevItems => {if (prevItems.length === 0) {setTimeout(updatePlannerWithRetry, 500);return prevItems;}
                        const updatedItems = prevItems.map(item =>item.id === specificDayId ? { ...item, tours: newActivity } : item );
                        (async () => {
                            const tourMapping = await getFromDB(STORES.tourMapping, 'tourDayMapping', {});
                            tourMapping[newActivity.id] = specificDayId;
                            await saveToDB(STORES.tourMapping, 'tourDayMapping', tourMapping);
                        })();
                        saveToDB(STORES.plannerData, 'items', updatedItems);
                        calculateTotalWithPackageData(updatedItems, searchData?.packageData?.packageDetails);
                        return updatedItems;
                    });
                };
                updatePlannerWithRetry();
                const url = new URL(window.location.href);
                ['addedToPlanner', 'tourAdded', 'preserveData', 'dayId', 'specificDayId', 'timestamp', 'tourData'].forEach(param => url.searchParams.delete(param));
                window.history.replaceState({}, '', url.toString());
            }
        }
    };
    handleUrlTourData();
}, [plannerItems.length, specificDayIdState, activities.length, searchData]);


useEffect(() => {
    if (!searchData || !hasValidData || isDataLoaded.current) return;
    isDataLoaded.current = true;
    const loadPlannerData = async () => {
        const packageData = searchData.packageData?.packageDetails;
        const deletedHotels = await getFromDB(STORES.deletedItems, 'hotels', []);
        const deletedActivities = await getFromDB(STORES.deletedItems, 'activities', []);
        const existingHotels = await getFromDB(STORES.hotels, 'existingReadymadeHotels', []);
        const isHotelDeleted = (hotel: any, uniqueId?: string) =>deletedHotels.some((deleted: any) =>deleted.id === hotel.id || deleted.uniqueId === uniqueId ||(deleted.name === hotel.name && deleted.destination === hotel.destination));
        let hotelList: any[] = [];
        if (packageData?.hotelOption?.[0]?.hotels) {
            hotelList = packageData.hotelOption[0].hotels.map((hotel: PackageHotel, index: number) => {
                const uniqueId = `package-${hotel.name.replace(/\s+/g, '-').toLowerCase()}-${hotel.destination.replace(/\s+/g, '-').toLowerCase()}`;
                if (isHotelDeleted(hotel, uniqueId)) return null;
                return {
                    id: `hotel-package-${index}-${hotel.name.replace(/\s+/g, '-').toLowerCase()}`,
                    name: hotel.name, destination: hotel.destination, city: hotel.destination, nights: hotel.nights,
                    price: hotel.price, rating: hotel.star, currency: hotel.currency, mealPlan: hotel.mealPlan,
                    roomType: hotel.roomType, img: hotel.img, uniqueId, packageIndex: index, isPackageHotel: true
                };
            }).filter(Boolean);
        }
        const filteredExistingHotels = existingHotels
            .filter((hotel: any) => !isHotelDeleted(hotel, hotel.uniqueId))
            .map((hotel: any) => ({
                ...hotel, city: hotel.city || hotel.destination || searchData?.city,
                roomType: hotel.roomType || hotel.room?.roomCategory || 'Standard Room'
            }));
        hotelList = [...filteredExistingHotels, ...hotelList];
        if (selectedHotelFromParams?.hotel) {
            const hotelFromParams = {
                id: selectedHotelFromParams.hotel.id, name: selectedHotelFromParams.hotel.hotelName,
                destination: selectedHotelFromParams.hotel.destination || selectedHotelFromParams.city || searchData?.city,
                nights: selectedHotelFromParams.booking?.nights || 1, price: selectedHotelFromParams.booking?.totalPrice || 0,
                rating: selectedHotelFromParams.hotel.starRating, checkInDate: selectedHotelFromParams.booking?.checkInDate,
                checkOutDate: selectedHotelFromParams.booking?.checkOutDate, specificDayId: selectedHotelFromParams.specificDayId,
                isAdditional: true, cityId: selectedHotelFromParams.hotel.cityId || searchData?.cityId,
                uniqueId: selectedHotelFromParams.uniqueId || `hotel-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                roomType: selectedHotelFromParams.room?.roomCategory, mealPlan: selectedHotelFromParams.room?.mealPlan,
                img: selectedHotelFromParams.hotel?.imageUrl || selectedHotelFromParams.hotel?.img || ''
            };
            if (!isHotelDeleted(hotelFromParams, hotelFromParams.uniqueId)) {
                const hotelExists = hotelList.some(hotel =>
                    hotel.id === hotelFromParams.id && hotel.specificDayId === hotelFromParams.specificDayId);
                if (!hotelExists) hotelList = [hotelFromParams, ...hotelList];
            }
        }
        setHotels(hotelList);
        saveToDB(STORES.hotels, 'existingReadymadeHotels', hotelList);
        let activityList: any[] = [];
        const savedActivities = await getFromDB(STORES.activities, 'readymadeActivities', []);
        if (savedActivities.length > 0) {
            activityList = savedActivities.filter((activity: any) => !deletedActivities.includes(activity.id));
        } else if (packageData?.activities) {
            activityList = packageData.activities.map((activity: any, index: number) => ({
                id: `activity-${index}-${Date.now()}`, name: activity.name, type: activity.type,
                vehicle: activity.vehicle, ticketIncluded: activity.ticketIncluded, price: activity.price || 0
            })).filter((activity: any) => !deletedActivities.includes(activity.id));
            saveToDB(STORES.activities, 'readymadeActivities', activityList);
        }
        setActivities(activityList);
        let transferList: any[] = [];
        if (packageData?.transfers) {
            transferList = packageData.transfers.map((transfer: any, index: number) => ({
                id: `transfer-${index}-${Date.now()}`, route: transfer.route, vehicle: transfer.vehicle,
                type: transfer.type, price: transfer.price || 0
            }));
        }
        setTransfers(transferList);

        if (hotelList.length > 0 || (packageData?.itinerary && packageData.itinerary.length > 0)) {
            setShowHotelTab(true);
            createPlannerItemsWithPackageData(hotelList, activityList, transferList, packageData);
        } else {
            createEmptyPlannerItems();
        }
    };

    loadPlannerData();
}, [searchData, hasValidData, selectedHotelFromParams]);

const saveHotelsToIndexedDB = async (hotelList: any[]) => {
    try { await saveToDB(STORES.hotels, 'existingReadymadeHotels', hotelList); } 
    catch (error) { console.error('Error saving hotels to IndexedDB:', error); }
};

const saveActivitiesToIndexedDB = async (activityList: any[]) => {
    try { await saveToDB(STORES.activities, 'readymadeActivities', activityList); } 
    catch (error) { console.error('Error saving activities to IndexedDB:', error); }
};

const loadReadymadePackageData = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const savedSearchData = await getFromDB(STORES.plannerData, 'readymadeSearchData', null);
    const hotelData = urlParams.get('hotelData');
    const preserveData = urlParams.get('preserveData');
    let loadedSearchData: any = {};
    const originalSearchData = await getFromDB(STORES.plannerData, 'originalReadymadeSearchData', null);
    if (preserveData === 'true') {
        const preservedData = await getFromDB(STORES.plannerData, 'preservedReadymadeData', null);
        if (preservedData) {
            try {
                const parsed: any = preservedData;
                if (parsed.searchData) await saveToDB(STORES.plannerData, 'readymadeSearchData', parsed.searchData);
                if (parsed.plannerItems) await saveToDB(STORES.plannerData, 'persistentTableData', parsed.plannerItems);
                if (parsed.originalSearchParams) await saveToDB(STORES.plannerData, 'tripPlannerParams', parsed.originalSearchParams);
                if (parsed.readymadeContext) await saveToDB(STORES.plannerData, 'readymadePackageContext', parsed.readymadeContext);
                const db = await initDB();
                const transaction = db.transaction([STORES.plannerData], 'readwrite');
                transaction.objectStore(STORES.plannerData).delete('preservedReadymadeData');
                console.log('Restored preserved readymade data');
            } catch (e) { console.error('Error restoring preserved data:', e); }
        }
    }
    if (originalSearchData) {
        try { loadedSearchData = originalSearchData; } catch (e) { }
    } else if (urlParams.has('checkInDate')) {
        loadedSearchData = {
            checkInDate: urlParams.get('checkInDate'), checkOutDate: urlParams.get('checkOutDate'),
            city: urlParams.get('city'), country: urlParams.get('country'),
            nights: parseInt(urlParams.get('nights') || '1'), totalNights: parseInt(urlParams.get('nights') || '1'),
            adults: parseInt(urlParams.get('adults') || '2'), cwb: parseInt(urlParams.get('cwb') || '0'),
            cnb: parseInt(urlParams.get('cnb') || '0'), infants: parseInt(urlParams.get('infants') || '0'),
            rooms: urlParams.get('rooms') ? JSON.parse(decodeURIComponent(urlParams.get('rooms') || '[]')) : [],
            room: urlParams.get('rooms') ? [JSON.parse(decodeURIComponent(urlParams.get('rooms') || '[]'))] : [],
            destinations: [urlParams.get('city')], specificDayId: urlParams.get('specificDayId'), fromReadymadePackage: true
        };
        if (!originalSearchData) await saveToDB(STORES.plannerData, 'originalReadymadeSearchData', loadedSearchData);
    } else if (savedSearchData) {
        try {
            const parsed: any = savedSearchData;
            if (parsed.preserveOriginalDates && originalSearchData) {const original: any = originalSearchData;
                loadedSearchData = { ...parsed, checkInDate: original.checkInDate, checkOutDate: original.checkOutDate, nights: original.nights, totalNights: original.totalNights };
            } else { loadedSearchData = parsed; }
        } catch (e) { console.error('Error parsing saved search data:', e); }
    } else if (location.state) {
        loadedSearchData = location.state;
        await saveToDB(STORES.plannerData, 'originalReadymadeSearchData', loadedSearchData);
        if (loadedSearchData.destinations && Array.isArray(loadedSearchData.destinations)) {
            loadedSearchData.city = loadedSearchData.destinations[0];}
        if (loadedSearchData.guests) {
            loadedSearchData.adults = loadedSearchData.guests.adults || 2;
            loadedSearchData.cwb = loadedSearchData.guests.cwb || 0;
            loadedSearchData.cnb = loadedSearchData.guests.cnb || 0;
            loadedSearchData.infants = loadedSearchData.guests.infants || 0;
            loadedSearchData.rooms = [{ adults: loadedSearchData.guests.adults || 2, cwb: loadedSearchData.guests.cwb || 0, cnb: loadedSearchData.guests.cnb || 0, infants: loadedSearchData.guests.infants || 0 }];
            loadedSearchData.room = [loadedSearchData.rooms[0]];}
        if (!loadedSearchData.nights && loadedSearchData.totalNights) {
            loadedSearchData.nights = loadedSearchData.totalNights;
        }
        if (!loadedSearchData.country) {
            loadedSearchData.country = loadedSearchData.destinations_country;
        }
    }
    let selectedHotel = null;
    if (hotelData) {try { selectedHotel = JSON.parse(decodeURIComponent(hotelData)); } 
        catch (e) { console.error('Error parsing hotel data:', e); }
    }
    return { searchData: loadedSearchData, selectedHotel, hasValidData: Object.keys(loadedSearchData).length > 0 };
};

const handleUrlDataUpdates = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const hotelAdded = urlParams.get('hotelAdded') === 'true';
    const tourAdded = urlParams.get('tourAdded') === 'true';
    const hotelData = urlParams.get('hotelData');
    const tourData = urlParams.get('tourData');
    const specificDayId = urlParams.get('specificDayId');
    let updated = false;
    if (hotelAdded && hotelData && specificDayId) {
        try {
            const newHotel = JSON.parse(decodeURIComponent(hotelData));
            const currentHotels = await getFromDB(STORES.hotels, 'existingReadymadeHotels', []);
            const hotelExists = currentHotels.some(h => h.uniqueId === newHotel.uniqueId);
            if (!hotelExists) {
                const updatedHotels = [...currentHotels, newHotel];
                setHotels(updatedHotels);
                await saveToDB(STORES.hotels, 'existingReadymadeHotels', updatedHotels);
                const updatedItems = plannerItems.map(item => item.id === specificDayId ? { ...item, hotel: newHotel } : item);
                setPlannerItems(updatedItems);
                await saveToDB(STORES.plannerData, 'items', updatedItems);
                await savePersistentTableData(updatedItems);
                updated = true;
            }
        } catch (error) { console.error('Error adding hotel from URL:', error); }
    }
    if (tourAdded && tourData && specificDayId) {
        try {
            const newTour = JSON.parse(decodeURIComponent(tourData));
            const currentActivities = await getFromDB(STORES.activities, 'readymadeActivities', []);
            const tourExists = currentActivities.some(a => a.id === newTour.id);
            if (!tourExists) {
                const updatedActivities = [...currentActivities, newTour];
                setActivities(updatedActivities);
                await saveToDB(STORES.activities, 'readymadeActivities', updatedActivities);
                const updatedItems = plannerItems.map(item => item.id === specificDayId ? { ...item, tours: newTour } : item);
                setPlannerItems(updatedItems);
                await saveToDB(STORES.plannerData, 'items', updatedItems);
                await savePersistentTableData(updatedItems);
                updated = true;
            }
        } catch (error) { console.error('Error adding tour from URL:', error); }
    }
    if (updated) {
        const url = new URL(window.location.href);
        ['hotelAdded', 'tourAdded', 'hotelData', 'tourData', 'specificDayId'].forEach(param => url.searchParams.delete(param));
        window.history.replaceState({}, '', url.toString());
    }
};

useEffect(() => {
    const handleUrlTourData = async () => {
        const urlParams = new URLSearchParams(window.location.search);
        const addedToPlanner = urlParams.get('addedToPlanner') === 'true';
        const specificDayId = urlParams.get('specificDayId');
        const encodedTourData = urlParams.get('tourData');
        if (addedToPlanner && specificDayId && encodedTourData) {
            let storedTour: any = {};
            try {  storedTour = JSON.parse(decodeURIComponent(encodedTourData)); } 
            catch (error) {console.error('Error parsing tourData from URL:', error);return;}
            if (!storedTour.tourDetails && !storedTour.tour) {storedTour = await getFromDB(STORES.activities, 'selectedTourData', {}); }
            console.log('Processing tour data:', storedTour);
            if (storedTour && (storedTour.tourDetails || storedTour.tour)) {
                const tourData = storedTour.tourDetails || storedTour.tour;
                const bookingData = storedTour.booking || {};
                const newActivity = {
                    id: tourData.id || `tour-${Date.now()}`,
                    name: tourData.name || tourData.tourName || tourData.sightName,
                    price: bookingData.totalPrice || tourData.price || 0,
                    description: tourData.description || '',
                    duration: tourData.eventDuration || '',
                    city: tourData.city || bookingData.city || '',
                    currency: bookingData.currency || tourData.currency || 'USD',
                    date: bookingData.date || '',
                    assignedDayId: specificDayId,
                    type: 'tour'
                };
                console.log('Creating new activity:', newActivity);
                setActivities(prevActivities => {
                    const existingTour = prevActivities.find(activity => activity.id === newActivity.id || (activity.name === newActivity.name && activity.assignedDayId === specificDayId));
                    if (existingTour) {console.log('Tour already exists, skipping');
                        return prevActivities;
                    }
                    const updatedActivities = [...prevActivities, newActivity];
                    saveToDB(STORES.activities, 'readymadeActivities', updatedActivities);
                    return updatedActivities;
                });
                const updatePlannerItems = () => {
                    setPlannerItems(prevItems => {
                        if (prevItems.length === 0) {
                            setTimeout(() => {
                                setPlannerItems(currentItems => {
                                    if (currentItems.length > 0) {console.log('Retrying planner items update with tour:', newActivity.name);
                                        const updatedItems = currentItems.map(item => item.id === specificDayId ? { ...item, tours: newActivity } : item);
                                        const saveTourMapping = async () => {
                                            const tourMapping = await getFromDB(STORES.tourMapping, 'tourDayMapping', {});
                                            tourMapping[newActivity.id] = specificDayId;
                                            await saveToDB(STORES.tourMapping, 'tourDayMapping', tourMapping);};
                                        saveTourMapping();
                                        saveToDB(STORES.plannerData, 'items', updatedItems);
                                        if (searchData?.packageData?.packageDetails) {calculateTotalWithPackageData(updatedItems, searchData.packageData.packageDetails);
                                        }
                                        return updatedItems;
                                    }
                                    return currentItems;
                                });
                            }, 500);
                            return prevItems;
                        }
                        console.log('Updating planner items with tour:', newActivity.name);
                        const updatedItems = prevItems.map(item => 
                            item.id === specificDayId ? { ...item, tours: newActivity } : item
                        );
                        const saveTourMapping = async () => {
                            const tourMapping = await getFromDB(STORES.tourMapping, 'tourDayMapping', {});
                            tourMapping[newActivity.id] = specificDayId;
                            await saveToDB(STORES.tourMapping, 'tourDayMapping', tourMapping);
                        };
                        saveTourMapping();
                        saveToDB(STORES.plannerData, 'items', updatedItems);
                        if (searchData?.packageData?.packageDetails) {calculateTotalWithPackageData(updatedItems, searchData.packageData.packageDetails);
                        }
                        return updatedItems;
                    });
                };
                updatePlannerItems();
                const url = new URL(window.location.href);['addedToPlanner', 'tourAdded', 'preserveData', 'dayId', 'specificDayId', 'timestamp', 'tourData'] .forEach(param => url.searchParams.delete(param));
                window.history.replaceState({}, '', url.toString());
            }
        }
    };
    
    const autoAssignActivities = () => {
        if (plannerItems.length > 0 && activities.length > 0) {
            const tourMapping = getFromDB(STORES.tourMapping, 'tourDayMapping', {}).then(mapping => {
                let needsUpdate = false;
                const updatedItems = plannerItems.map(item => {
                    const dayActivities = activities.filter(activity => activity.assignedDayId === item.id || mapping[activity.id] === item.id);
                    if (dayActivities.length > 0 && !item.tours) {needsUpdate = true;
                        return { ...item, tours: dayActivities[0] }; }
                    return item;
                });
                if (needsUpdate) {
                    console.log('Auto-assigning activities to planner items');
                    setPlannerItems(updatedItems);
                    saveToDB(STORES.plannerData, 'items', updatedItems);
                    if (searchData?.packageData?.packageDetails) {calculateTotalWithPackageData(updatedItems, searchData.packageData.packageDetails);
                    }
                }
            });
        }
    };
    const initializeData = async () => {
        if (!isInitialized.current) {
            await handleUrlDataUpdates();
            const urlParams = new URLSearchParams(window.location.search);
            const newPackage = urlParams.get('newPackage') === 'true' || location.pathname.includes('readymade-planner') && location.state;
            if (newPackage) {
                console.log('New package detected - clearing all data');
                await clearAllPlannerData();
                setPlannerItems([]); setHotels([]); setActivities([]); setTransfers([]); setGrandTotal(0);
                isDataLoaded.current = false;
                urlParams.delete('newPackage');
                window.history.replaceState({}, '', `${window.location.pathname}?${urlParams.toString()}`);
            }
            const { searchData: loadedSearchData, selectedHotel, hasValidData: dataValid } = await loadReadymadePackageData();
            if (dataValid && loadedSearchData) {
                setSearchData(loadedSearchData);
                setSelectedHotelFromParams(selectedHotel);
                setHasValidData(true);
                const processedSearchParams = {
                    ...loadedSearchData,
                    checkInDate: loadedSearchData.checkInDate || new Date().toISOString(),
                    checkOutDate: loadedSearchData.checkOutDate || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
                    city: loadedSearchData.city || loadedSearchData.destinations?.[0],
                    country: loadedSearchData.country || loadedSearchData.destinations_country,
                    nights: loadedSearchData.nights || loadedSearchData.totalNights || 3,
                    rooms: loadedSearchData.rooms || loadedSearchData.room || [{ adults: 2, cwb: 0, cnb: 0, infants: 0 }]
                };
                setOriginalSearchParams(processedSearchParams);
                isInitialized.current = true;
            }
        }
    };
    initializeData();
    handleUrlTourData();
    autoAssignActivities();
}, [location, searchData, plannerItems.length, activities.length]);

const handleRemoveHotel = async (plannerItem: PlannerItem2) => {
    if (!plannerItem.hotel) return;
    const hotelToRemove = plannerItem.hotel;
    const deletedHotels = await getFromDB(STORES.deletedItems, 'hotels', []);
    const deletedHotel = {
        id: hotelToRemove.id, specificDayId: hotelToRemove.specificDayId, uniqueId: hotelToRemove.uniqueId,
        packageIndex: hotelToRemove.packageIndex, originalPrice: Number(hotelToRemove.price) || 0,
        name: hotelToRemove.name, destination: hotelToRemove.destination, timestamp: new Date().toISOString()
    };
    deletedHotels.push(deletedHotel);
    await saveToDB(STORES.deletedItems, 'hotels', deletedHotels);
    const updatedHotels = hotels.filter(hotel => {
        const hotelKey = `${hotel.id}-${hotel.uniqueId || hotel.specificDayId || 'default'}`;
        const removeKey = `${hotelToRemove.id}-${hotelToRemove.uniqueId || hotelToRemove.specificDayId || 'default'}`;
        return hotelKey !== removeKey;
    });
    setHotels(updatedHotels);
    await saveHotelsToIndexedDB(updatedHotels);
    const updatedItems = plannerItems.map(item => {
        if (item.hotel) {
            const itemHotelKey = `${item.hotel.id}-${item.hotel.uniqueId || item.hotel.specificDayId || 'default'}`;
            const removeKey = `${hotelToRemove.id}-${hotelToRemove.uniqueId || hotelToRemove.specificDayId || 'default'}`;
            if (itemHotelKey === removeKey) return { ...item, hotel: undefined };
        }
        return item;
    });
    setPlannerItems(updatedItems);
    await calculateTotalWithPackageData(updatedItems, searchData?.packageData?.packageDetails);
    await saveToDB(STORES.plannerData, 'items', updatedItems);
    await saveToDB(STORES.plannerData, 'persistentTableData', updatedItems);
    const db = await initDB();
    const transaction = db.transaction([STORES.plannerData], 'readwrite');
    const objectStore = transaction.objectStore(STORES.plannerData);
    objectStore.delete('hotelSearchParams');
    objectStore.delete('lastNightHotelParams');
    objectStore.delete('selectedHotelArea');
};

const calculateTotal = (items: PlannerItem2[]) => calculateTotalWithPackageData(items, searchData?.packageData?.packageDetails);
const handleTabChange = (event: React.SyntheticEvent, newValue: string) => { setActiveTab(newValue); };

const handleAddItem = async (plannerItemId: string, type: string) => {
    const plannerItem = plannerItems.find(item => item.id === plannerItemId);
    if (!plannerItem) return;
    if (type === 'tours') {
        const currentUrl = new URL(window.location.href);
        const fromReadymadePackage = currentUrl.searchParams.get('fromReadymadePackage') === 'true' || window.location.pathname.includes('readymade-planner');
        if (fromReadymadePackage) {
            const dayNumber = plannerItemId.replace('day-', '');
            const checkInDate = currentUrl.searchParams.get('checkInDate') || searchData?.checkInDate || new Date().toISOString();
            const city: string = currentUrl.searchParams.get('city') ?? searchData?.destinations?.[0] ?? (typeof searchData?.destinations === 'string' ? searchData.destinations : undefined) ?? 'Batumi';
            const country: string = currentUrl.searchParams.get('country') ?? searchData?.country ?? searchData?.selectedCountry;
            const rooms = searchData?.room || searchData?.room || currentSearchParams.rooms || [{ adults: 2, cwb: 0, cnb: 0, infants: 0 }];
            let adults, cwb, cnb, infants;
            if (searchData?.guests) {
                adults = searchData.guests.adults || 2; cwb = searchData.guests.cwb || 0;
                cnb = searchData.guests.cnb || 0; infants = searchData.guests.infants || 0;
            } else if (searchData?.guests?.adults !== undefined) {
                adults = searchData.guests.adults; cwb = searchData.guests.cwb || 0;
                cnb = searchData.guests.cnb || 0; infants = searchData.guests.infants || 0;
            } else if (rooms && rooms.length > 0) {
                const firstRoom = rooms[0];
                adults = firstRoom.adults || 2; cwb = firstRoom.cwb || 0; cnb = firstRoom.cnb || 0; infants = firstRoom.infants || 0;
            } else {
                adults = currentSearchParams.adults || 2; cwb = currentSearchParams.cwb || 0;
                cnb = currentSearchParams.cnb || 0; infants = currentSearchParams.infants || 0;
            }
            const totalPax = adults + cwb + cnb;
            const tourSelectionUrl = new URL(TRIP_PLANNER);
            tourSelectionUrl.searchParams.set('city', city);
            tourSelectionUrl.searchParams.set('country', country);
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
            await saveToDB(STORES.activities, 'tourSelectionDayId', plannerItemId);
            await saveToDB(STORES.activities, 'expectedDayId', plannerItemId);
            const tourSelectionData = {
                searchData: JSON.stringify({ ...searchData, rooms, guests: { adults, cwb, cnb, infants } }),
                plannerItems: JSON.stringify({ plannerItems, hotels, activities, transfers, grandTotal, timestamp: new Date().toISOString() }),
                originalSearchParams: JSON.stringify({ ...originalSearchParams, rooms, adults, cwb, cnb, infants }),
                readymadeContext: JSON.stringify({ plannerItems, originalSearchParams, selectedItemId: plannerItemId })
            };
            await saveToDB(STORES.plannerData, 'preservedReadymadeData', tourSelectionData);
            window.location.href = tourSelectionUrl.toString();
            return;}
        const availableActivity = activities.find(activity => !plannerItems.some(item => item.tours?.id === activity.id));
        if (availableActivity) {
            const updatedItems = plannerItems.map(item => item.id === plannerItemId ? { ...item, tours: availableActivity, itinerary: undefined } : item);
            setPlannerItems(updatedItems);
            calculateTotal(updatedItems);
            savePersistentTableData(updatedItems);}
    }
    console.log(`Add ${type} for:`, plannerItemId);
};

const handleHotelSelection2 = async (itemId: string) => {
    const plannerItem = plannerItems.find(item => item.id === itemId);
    if (!plannerItem) return;
    const itemDate = new Date(plannerItem.date);
    const dayNumber = parseInt(itemId.replace('day-', '')) - 1;
    const dayHasHotel = plannerItems.find(item => item.id === itemId && item.hotel);
    if (dayHasHotel) { return;}
    const checkInDate = new Date(itemDate);
    const checkOutDate = new Date(itemDate);
    checkOutDate.setDate(checkOutDate.getDate() + 2);
    const fallbackSearchParams = {
        checkInDate: searchData?.checkInDate || new Date().toISOString(),
        checkOutDate: searchData?.checkOutDate || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        nights: searchData?.nights || searchData?.totalNights || 1,
        city: searchData?.destinations?.[0], country: searchData?.country ?? searchData?.selectedCountry,
        adults: searchData?.guests?.adults || 2, cwb: searchData?.guests?.cwb || 0,
        cnb: searchData?.guests?.cnb || 0, infants: searchData?.guests?.infants || 0,
        rooms: searchData?.room || [{ adults: 2, cwb: 0, cnb: 0, infants: 0 }],
        room: searchData?.room || [{ adults: 2, cwb: 0, cnb: 0, infants: 0 }]
    };
    const baseSearchParams = originalSearchParams || fallbackSearchParams;
    const originalCheckInDate = baseSearchParams.checkInDate || fallbackSearchParams.checkInDate;
    const originalCheckOutDate = baseSearchParams.checkOutDate || fallbackSearchParams.checkOutDate;
    const tripCheckOutDate = new Date(originalCheckOutDate);
    const isLastNight = checkOutDate.toDateString() === tripCheckOutDate.toDateString();
    const hotelSearchParams = {...baseSearchParams, checkInDate: checkInDate.toISOString(), checkOutDate: checkOutDate.toISOString(),
        nights: 1, specificDayId: itemId, applyToAllDays: false, isHotelSpecific: true, isLastDay: isLastNight,
        country: baseSearchParams.country, originalCheckInDate, originalCheckOutDate, fromReadymadePackage: true,
        rooms: baseSearchParams.rooms || fallbackSearchParams.rooms, city: baseSearchParams.city || fallbackSearchParams.city,
        plannerItems, preservePosition: true, dayPosition: dayNumber, Description: ''
    };
    if (isLastNight) {
        const extraDay = new Date(checkOutDate);
        const additionalSearchParams = {...hotelSearchParams, checkInDate: extraDay.toISOString(),
            checkOutDate: new Date(extraDay.setDate(extraDay.getDate() + 1)).toISOString()};
        await saveToDB(STORES.hotels, 'lastNightHotelParams', additionalSearchParams);
    }
    await saveToDB(STORES.plannerData, 'tripPlannerParams', baseSearchParams);
    await saveToDB(STORES.hotels, 'hotelSearchParams', hotelSearchParams);
    await saveToDB(STORES.plannerData, 'readymadePackageContext', {
        plannerItems, originalSearchParams: baseSearchParams, selectedItemId: itemId, dayPosition: dayNumber
    });
    console.log(`Opening hotel selection for day ${itemId} at position ${dayNumber}`);
    navigate('/trip-planner-area', { state: hotelSearchParams });
};

const handleRemoveTour = async (plannerItem: PlannerItem2) => {
    const tourToRemove = plannerItem.tours;
    const itineraryToRemove = plannerItem.itinerary;
    if (!tourToRemove && !itineraryToRemove) return;
    console.log('Removing tour/itinerary from day:', plannerItem.id);
    const updatedItems = plannerItems.map(item => item.id === plannerItem.id ?  { ...item, tours: undefined, itinerary: tourToRemove ? item.itinerary : undefined } : item);
    setPlannerItems(updatedItems);
    await saveToDB(STORES.plannerData, 'items', updatedItems);
    savePersistentTableData(updatedItems);
    calculateTotalWithPackageData(updatedItems, searchData?.packageData?.packageDetails);
    if (tourToRemove?.id) {
        const updatedActivities = activities.filter(activity => activity.id !== tourToRemove.id);
        setActivities(updatedActivities);
        await saveActivitiesToIndexedDB(updatedActivities);
        const deletedActivities = await getFromDB(STORES.deletedItems, 'activities', []);
        if (!deletedActivities.includes(tourToRemove.id)) {
            deletedActivities.push(tourToRemove.id);
            await saveToDB(STORES.deletedItems, 'activities', deletedActivities);
        }
        const tourMapping = await getFromDB(STORES.tourMapping, 'tourDayMapping', {});
        delete tourMapping[tourToRemove.id];
        await saveToDB(STORES.tourMapping, 'tourDayMapping', tourMapping);
    }
    if (itineraryToRemove && searchData?.packageData?.packageDetails?.itinerary) {
        const deletedItineraries = await getFromDB(STORES.deletedItems, 'itineraries', []);
        const itineraryId = itineraryToRemove.id || `itinerary-${plannerItem.id}`;
        if (!deletedItineraries.includes(itineraryId)) {
            deletedItineraries.push(itineraryId);
            await saveToDB(STORES.deletedItems, 'itineraries', deletedItineraries);
        }
    }
};

useEffect(() => {
    const handleTourData = async () => {
        const urlParams = new URLSearchParams(window.location.search);
        const encoded = urlParams.get("tourData");
        if (encoded) {
            try {const parsedData = JSON.parse(decodeURIComponent(encoded));
                setSelectedTourData(parsedData);
                console.log("Tour data received:", parsedData);
            } catch (err) { console.error("Invalid tour data", err); }
        }
    };
    handleTourData();
}, []);

const handleDownloadPDF = async () => {
    setLoading(true);
    try {
        const userEmail = await getFromDB(STORES.plannerData, 'username', 'guest@example.com');
        const rooms = originalSearchParams?.rooms || searchData?.room || [{ adults: 2, cwb: 0, cnb: 0, infants: 0 }];
        let hotelsCost = 0, activitiesCost = 0, transfersCost = 0, itineraryCost = 0;
        plannerItems.forEach(item => {
            if (item.hotel?.price) hotelsCost += Number(item.hotel.price);
            if (item.tours?.price) activitiesCost += Number(item.tours.price);
            if (item.transfer?.price) transfersCost += Number(item.transfer.price);
            if (item.itinerary?.price) itineraryCost += Number(item.itinerary.price);
        });
        const dbData: TripPlannerDBData = {
            tripDetails: {
                destination: originalSearchParams?.city || searchData?.destinations?.[0],
                country: originalSearchParams?.selectedCountry || searchData?.country,
                checkInDate: originalSearchParams?.checkInDate || searchData?.checkInDate,
                checkOutDate: originalSearchParams?.checkOutDate || searchData?.checkOutDate,
                nights: originalSearchParams?.nights || searchData?.nights || 3, rooms,
                cityId: searchData?.cityId || originalSearchParams?.cityId, createdByEmail: userEmail,
                totalRooms: rooms?.length.toString() || '1'
            },
            pricing: {
                grandTotal, marginTotal,
                breakdown: { hotelsCost, activitiesCost, transfersCost, itineraryCost }
            },
            plannerItems: plannerItems.map((item, index) => ({
                dayId: item.id, date: item.date.toISOString(), dayNumber: index + 1,
                hotel: item.hotel ? {
                    id: item.hotel.id, name: item.hotel.name, destination: item.hotel.destination,
                    nights: item.hotel.nights || 1, price: Number(item.hotel.price) || 0, rating: item.hotel.rating || 0,
                    checkInDate: item.hotel.checkInDate || item.date.toISOString(),
                    checkOutDate: item.hotel.checkOutDate || new Date(new Date(item.date).setDate(new Date(item.date).getDate() + (item.hotel.nights || 1))).toISOString(),
                    roomType: item.hotel.roomType, mealPlan: item.hotel.mealPlan,
                    isAdditional: item.hotel.isAdditional || false, specificDayId: item.hotel.specificDayId
                } : undefined,
                tours: item.tours ? {
                    id: item.tours.id, name: item.tours.name, price: Number(item.tours.price) || 0,
                    description: item.tours.description || '', duration: item.tours.duration || '',
                    city: item.tours.city || '', assignedDayId: item.tours.assignedDayId || item.id,
                    checkInDate: item.tours.assignedDate || item.date.toISOString(), tourDate: item.date.toISOString(),
                    isAdditional: item.tours.isAdditional || false, isUpdated: item.tours.isUpdated || false,
                    currency: item.tours.currency || 'USD', type: item.tours.type || 'tour',
                    activities: item.tours.activities || [], selectedActivities: item.tours.selectedActivities || {},
                    activityDetails: item.tours.activityDetails || []
                } : undefined,
                transfer: item.transfer ? {
                    id: item.transfer.id, name: item.transfer.name,
                    route: item.transfer.route || `${item.transfer.from} - ${item.transfer.to}`,
                    price: Number(item.transfer.price) || 0, from: item.transfer.from, to: item.transfer.to,
                    vehicleType: item.transfer.vehicleType, type: item.transfer.type,
                    transferDate: item.date.toISOString(), isPackageTransfer: item.transfer.isPackageTransfer || false
                } : undefined,
                itinerary: item.itinerary ? {
                    id: item.itinerary.id || `itinerary-${item.id}`, title: item.itinerary.title || '',
                    description: item.itinerary.description || '', details: item.itinerary.details || '',
                    price: Number(item.itinerary.price) || 0, activities: item.itinerary.activities || [],
                    itineraryDate: item.date.toISOString(), isUpdated: item.itinerary.isUpdated || false,
                    isPackageItinerary: item.itinerary.isPackageItinerary || false, day: item.itinerary.day || index + 1
                } : undefined
            })),
            metadata: { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
        };
        const result = await submitPackageData(dbData).unwrap();
        console.log('Trip data saved:', result);
        setTimeout(async () => {
            setLoading(false);
            setShowThankYou(true);
            const keysToRemove = ['persistentTableData', 'readymadeSearchData', 'originalReadymadeSearchData', 'existingReadymadeHotels', 'readymadeActivities', 'tripTransfers', 'tourDayMapping', 'hotelPositionMapping', 'items'];
            const db = await initDB();
            const transaction = db.transaction([STORES.plannerData, STORES.hotels, STORES.activities, STORES.tourMapping, STORES.deletedItems], 'readwrite');
            keysToRemove.forEach(key => {
                if (['existingReadymadeHotels', 'hotelSearchParams', 'lastNightHotelParams'].includes(key)) {transaction.objectStore(STORES.hotels).delete(key);
                } else if (['readymadeActivities', 'tourSelectionDayId', 'expectedDayId'].includes(key)) {transaction.objectStore(STORES.activities).delete(key);
                } else if (key === 'tourDayMapping') { transaction.objectStore(STORES.tourMapping).delete(key);
                } else if (['hotels', 'activities', 'itineraries'].includes(key)) { transaction.objectStore(STORES.deletedItems).delete(key);
                } else {transaction.objectStore(STORES.plannerData).delete(key);}
            });
        }, 2000);
    } catch (error) {
        setLoading(false);
        console.error('Error saving trip data:', error);
        alert('Failed to save trip data. Please try again.');
    }
};

return (
        <Box className="trip-planner-page">
            <Container sx={{ paddingLeft: '0rem', paddingRight: '0rem', maxWidth: '100%' }}>
                {!showThankYou && (<>
                        <Box className="search-info heading"> <Typography variant="h5" component="h1" sx={{marginTop:'1rem'}}>  {displayCity} | {displayNights} NIGHT/S | {displayCheckInDate} - {displayCheckOutDate} </Typography> </Box>
                        <Box sx={{ mb: 0, height: '2rem' }} className='tablist-container'>
                            <Tabs className='tablist-btn' value={activeTab} onChange={handleTabChange} sx={{ color: 'black' ,'& .MuiTabs-indicator': { display: 'none' }}}>
                                <Tab className='planner-btn' value="planner" label="Planner" sx={{  color: activeTab === 'planner' ? 'white !important' : 'black !important', bgcolor: activeTab === 'planner' ? 'grey' : 'white', marginLeft: '0rem', width: '10rem','&.Mui-selected': {color: 'white !important',bgcolor: 'grey !important' },'&:hover': {bgcolor: activeTab === 'planner' ? 'grey' : '#f5f5f5' }}} />{showHotelTab && (
                                <Tab className='hotel-btn' value="hotel" label="Hotel Details"   sx={{ color: activeTab === 'hotel' ? 'white !important' : 'black !important',  bgcolor: activeTab === 'hotel' ? 'grey' : 'white',  marginLeft: '0.5rem', width: '10rem','&.Mui-selected': { color: 'white !important',bgcolor: 'grey !important'}, '&:hover': { bgcolor: activeTab === 'hotel' ? 'grey' : '#f5f5f5' }}}  /> )}
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
                                        <Box className="cell">{plannerItem.hotel ? (
                                                <Box className="selected-hotel" sx={{ position: 'relative', padding: '8px' }}>
                                                    <Typography className='hotel_name' variant="body2"  sx={{ fontSize: '0.8rem', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', textAlign: 'center', maxWidth: '100%', paddingRight: '24px' }}> {plannerItem.hotel.name}</Typography>
                                                    <IconButton sx={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)' }}  className="remove-button" onClick={() => handleRemoveHotel(plannerItem)} aria-label="Remove hotel" size="small">
                                                    <DeleteOutline sx={{ color: '#777777', fontSize: '1rem' }} /> </IconButton>
                                                </Box> ) : (
                                                <Box display="flex" justifyContent="flex-end">
                                                    <IconButton className="add-button"  onClick={() => handleHotelSelection2(plannerItem.id)}  sx={{ color: '#777777', fontSize: '1rem', '& .MuiSvgIcon-root': { fill: 'grey' } }}> <AddCircleOutline className='add-btn'/> </IconButton>
                                                </Box> )}
                                        </Box> )}
                    <Box className="cell">{(plannerItem.itinerary || plannerItem.tours) ? (
                        <Box className="selected-tour" sx={{ position: 'relative', padding: '8px' }}>
                        <Typography variant="body2" sx={{ fontSize: '0.8rem', textOverflow: 'ellipsis', textAlign: 'center', maxWidth: '100%', paddingRight: '24px' }}> {plannerItem.tours?.name || plannerItem.itinerary?.title} </Typography>
                        <IconButton sx={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)' }} className="remove-button" onClick={() => handleRemoveTour(plannerItem)} aria-label="Remove tour"size="small" ><DeleteOutline sx={{ color: '#777777', fontSize: '1rem' }} /></IconButton> </Box>) : (
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
                    </Paper>)}
                {activeTab === 'hotel' && showHotelTab && !showThankYou && (
                    <Box className="hotel-details-container" sx={{ bgcolor: 'transparent', boxShadow: 'none' }}> 
                        {(() => {const uniqueHotels = new Map();let totalRooms = 1;
                            if (originalSearchParams?.rooms && Array.isArray(originalSearchParams.rooms)) { totalRooms = originalSearchParams.rooms.length;
                            } else if (searchData?.room && Array.isArray(searchData.room)) {totalRooms = searchData.room.length;
                            } else if (currentSearchParams?.rooms && Array.isArray(currentSearchParams.rooms)) {totalRooms = currentSearchParams.rooms.length;}
                            plannerItems.forEach(item => {if (item.hotel) {
                                    const hotelKey = `${item.hotel.id}-${item.hotel.uniqueId || item.hotel.specificDayId || 'default'}`;
                                    if (!uniqueHotels.has(hotelKey)) {
                                        const hotelDays = plannerItems.filter(plannerItem =>  plannerItem.hotel &&  `${plannerItem.hotel.id}-${plannerItem.hotel.uniqueId || plannerItem.hotel.specificDayId || 'default'}` === hotelKey);
                                        const actualNights = item.hotel.nights || (item.hotel.booking?.nights) || Math.max(1, hotelDays.length - 1);
                                        const checkInDate = hotelDays[0]?.hotel?.checkInDate || hotelDays[0]?.date?.toISOString();
                                        const checkOutDate = hotelDays[hotelDays.length - 1]?.hotel?.checkOutDate || new Date(hotelDays[hotelDays.length - 1]?.date?.getTime() + 24 * 60 * 60 * 1000).toISOString();
                                        const hotelRoomCount = item.hotel.rooms || totalRooms;
                                        const basePrice = Number(item.hotel.price) || 0;
                                        const totalPrice = basePrice * hotelRoomCount;
                                        uniqueHotels.set(hotelKey, {...item.hotel,
                                            actualNights: actualNights,
                                            checkInDate: checkInDate,
                                            checkOutDate: checkOutDate,
                                            totalRooms: hotelRoomCount,
                                            totalPrice: totalPrice,
                                            basePrice: basePrice,
                                            booking: { checkInDate: checkInDate,
                                                checkOutDate: checkOutDate,
                                                nights: actualNights,
                                                totalPrice: totalPrice,
                                                roomType: item.hotel.roomType,
                                                mealPlan: item.hotel.mealPlan,
                                                totalRooms: hotelRoomCount,
                                                adults: originalSearchParams?.adults || currentSearchParams?.adults || 2,
                                                cwb: originalSearchParams?.cwb || currentSearchParams?.cwb || 0,
                                                cnb: originalSearchParams?.cnb || currentSearchParams?.cnb || 0,
                                            },
                                            room: {
                                                roomCategory: item.hotel.roomType,
                                                mealPlan: item.hotel.mealPlan, }
                                        });
                                    }
                                }
                            });
                            const uniqueHotelsArray = Array.from(uniqueHotels.values()); return uniqueHotelsArray.length > 0 ? ( uniqueHotelsArray.map((hotel, index) => (
                                    <Grid key={`${hotel.id || 'hotel'}-${hotel.uniqueId || index}-${index}`} className='item-container' item xs={14} md={8} sx={{ marginLeft: '0.5rem', maxWidth: '100%', padding: '0.5rem', marginBottom: '1rem' }}>
                                        <Grid container spacing={2} sx={{ bgcolor: 'white', padding: '0rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                            <Grid item xs={12} md={4} sx={{ '& .MuiGrid-root': { maxWidth: '21%' } }}> {hotel.img ? ( <img src={hotel.img} alt={hotel.name}  style={{ width: '98%', height: '10rem', objectFit: 'cover', padding: '0.5rem', borderRadius: '8px' }} onError={(e) => {const target = e.currentTarget; const parent = target.parentElement;   if (parent) {target.style.display = 'none'; const fallbackDiv = document.createElement('div'); fallbackDiv.style.cssText = 'background: white; height: 200px; width: 100%; display: flex; align-items: center; justify-content: center; border-radius: 8px; color: #999;'; fallbackDiv.textContent = 'No Image Available';  parent.appendChild(fallbackDiv);  } }} />
                                                ) : (<Box sx={{bgcolor: 'white',  height: '200px', width: '100%',  display: 'flex',alignItems: 'center',justifyContent: 'center', borderRadius: '8px'}}><Typography>No Image Available</Typography></Box>)}
                                            </Grid>
                                            <Grid item xs={12} md={8} className='hotel-details'>
                                                <Typography variant="h6" sx={{ color: '#2c3e50', fontWeight: 'bold', marginBottom: '8px' }}>{hotel.name}</Typography>
                                                <Box sx={{ display: 'flex', justifyContent: 'start', marginBottom: '1rem' }}>{Array(hotel.rating || hotel.star || 0).fill(0).map((_, i) => (<span key={i} style={{ color: '#FFD700', fontSize: '20px' }}>★</span>))}
                                                </Box>
                                                <Grid container spacing={2} className="booking-details">
                                                    <Grid item xs={12} sm={6} md={3} className="booking-column">
                                                        <Typography component='div' className="details-label"><strong>Check In:</strong> {hotel.checkInDate ? new Date(hotel.checkInDate).toLocaleDateString() : 'N/A'}</Typography>
                                                        <Typography component='div' className="details-label"><strong>Check Out:</strong> {hotel.checkOutDate ? new Date(hotel.checkOutDate).toLocaleDateString() : 'N/A'} </Typography>
                                                        <Typography component='div' className="details-label"><strong>Nights:</strong> {hotel.actualNights || hotel.nights} </Typography>
                                                    </Grid>
                                                    <Grid item xs={12} sm={6} md={3} className="booking-column">
                                                        <Typography component='div' className="details-label"><strong>Room Type:</strong> {hotel.roomType || hotel.room?.roomCategory || 'Standard'}</Typography>
                                                        <Typography component='div' className="details-label"><strong>Meal Plan:</strong> {hotel.mealPlan || hotel.room?.mealPlan || 'BB'}</Typography>
                                                        <Typography component='div' className="details-label"> <strong>Total Room(s):</strong> {hotel.totalRooms || hotel.rooms || 1} </Typography>
                                                    </Grid>
                                                    <Grid item xs={12} sm={6} md={3} className="booking-column">
                                                        <Typography component='div' className="details-label"><strong>Destination:</strong> {hotel.destination || hotel.city}</Typography>
                                                        <Typography component='div' className="details-label"><strong>Currency:</strong> {hotel.currency || 'USD'}</Typography>
                                                        <Typography component='div' className="details-label" sx={{ fontWeight: 'bold', color: '#2c3e50' }}><strong>Total Amount:</strong> USD {hotel.totalPrice || (hotel.price * (hotel.totalRooms || 1))} </Typography>
                                                    </Grid>
                                                </Grid>
                                            </Grid>
                                        </Grid>
                                    </Grid>
                                ))) : (
                                <Typography variant="body1" align="center" sx={{ padding: '2rem' }}>
                                    No hotels selected yet. Please select hotels from the Planner tab.
                                </Typography>);
                        })()}
                    </Box>
                )}
                {showThankYou && (
                    <Paper elevation={3} className="thank-you-container" sx={{ padding: '2rem', margin: '2rem 0', textAlign: 'center', bgcolor: '#f8f8f8', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
                        <Typography variant="h4" sx={{ color: '#4CAF50', marginBottom: '1rem' }}>Thank You!</Typography>
                        <Typography variant="body1" sx={{ marginBottom: '1rem', fontSize: '1.3rem' }}>  Thanks Four Connecting</Typography>
                    </Paper>
                )}
            </Container>
        </Box>
    );
};
export default TripPlannerReadyMade;