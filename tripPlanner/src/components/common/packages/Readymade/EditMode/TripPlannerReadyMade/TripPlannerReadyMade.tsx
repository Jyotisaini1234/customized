import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Box,Container,Typography,Button,Paper, Tabs,Tab, IconButton,TextField,CircularProgress} from "@mui/material";
import { AddCircleOutline, DeleteOutline, ArrowDownward as ArrowDownIcon} from "@mui/icons-material";
import './TripPlannerReadyMade.scss';
import { SearchData, PlannerItem2, PackageHotel, PackageData } from "../../../../../../types/types";

const TripPlannerReadyMade: React.FC = () => {
const location = useLocation();
const navigate = useNavigate();
const [searchData, setSearchData] = useState<SearchData | null>(location.state as SearchData);
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
const handleDownloadPDF = () => { setLoading(true);   setTimeout(() => {setLoading(false);  setShowThankYou(true);  console.log('PDF generated successfully'); }, 2000);};
const onCancel = () => {  navigate(-1); };
const formatDate = (date: any) => { const d = new Date(date); if (isNaN(d.getTime())) return 'Invalid Date'; return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });};
const formatYear = (date: any) => {const d = new Date(date);if (isNaN(d.getTime())) return 'Invalid Year'; return d.getFullYear().toString();};
const [specificDayIdState, setSpecificDayId] = useState<string | null>(null);
    const currentSearchParams = (() => { if (originalSearchParams) {return originalSearchParams;  }
        if (searchData) {
            return {
                city: searchData?.destinations?.[0] || searchData?.destinations || 'Batumi',
                nights: searchData?.totalNights || searchData?.nights || 3,
                checkInDate: searchData?.checkInDate || new Date().toISOString(),
                checkOutDate: searchData?.checkOutDate || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
                rooms: searchData?.room?.[0] || searchData?.room || [{ adults: 2, cwb: 0, cnb: 0, infants: 0 }],
                country: 'Georgia',
                adults: searchData?.guests?.adults || 2,
                cwb: searchData?.guests?.cwb || 0,
                cnb: searchData?.guests?.cnb || 0,
                infants: searchData?.guests?.infants || 0
            }; }
        return { city: 'Batumi',nights: 3, checkInDate: new Date().toISOString(),checkOutDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), rooms: [{ adults: 2, cwb: 0, cnb: 0, infants: 0 }],country: 'Georgia', adults: 2, cwb: 0,cnb: 0, infants: 0 };
    })();
    
    const displayCity = currentSearchParams.city || 'Batumi';
    const displayNights = currentSearchParams.nights;
    const displayCheckInDate = new Date(currentSearchParams.checkInDate).toLocaleDateString();
    const displayCheckOutDate = new Date(currentSearchParams.checkOutDate).toLocaleDateString();
    const savePersistentTableData = (items: PlannerItem2[]) => {
        try {
            const verifiedTotal = calculateTotalWithPackageData(items, searchData?.packageData?.packageDetails);
            
            const tableData = {
                plannerItems: items,
                hotels: hotels,
                activities: activities,
                transfers: transfers,
                grandTotal: verifiedTotal,
                timestamp: new Date().toISOString(),
                breakdown: {
                    totalHotels: hotels.length,
                    totalActivities: activities.length,
                    totalTransfers: transfers.length,
                    itemsWithHotels: items.filter(item => item.hotel).length,
                    itemsWithTours: items.filter(item => item.tours).length,
                    itemsWithTransfers: items.filter(item => item.transfer).length
                }
            };
            
            sessionStorage.setItem('persistentTableData', JSON.stringify(tableData));
            console.log('Persistent table data saved with verified total:', {
                itemsCount: items.length,
                verifiedTotal: verifiedTotal,
                breakdown: tableData.breakdown
            });
        } catch (error) {
            console.error(' Error saving persistent table data:', error);
        }
    };
    const saveHotelsToSession = (hotelList: any[]) => {
        try {
            sessionStorage.setItem('existingReadymadeHotels', JSON.stringify(hotelList));
            console.log('Hotels saved to session storage:', hotelList.length);
        } catch (error) {
            console.error('Error saving hotels to session storage:', error);
        }
    };
    const saveActivitiesToSession = (activityList: any[]) => {
        try {
            sessionStorage.setItem('readymadeActivities', JSON.stringify(activityList));
            console.log('Activities saved to session storage:', activityList.length);
        } catch (error) {
            console.error('Error saving activities to session storage:', error);
        }
    };
    const loadReadymadePackageData = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const savedSearchData = sessionStorage.getItem('readymadeSearchData');
        const hotelData = urlParams.get('hotelData');
        const preserveData = urlParams.get('preserveData');
        let loadedSearchData: any = {};
        const originalSearchData = sessionStorage.getItem('originalReadymadeSearchData');
        
        if (preserveData === 'true') {
            const preservedData = sessionStorage.getItem('preservedReadymadeData');
            if (preservedData) {
                try {
                    const parsed = JSON.parse(preservedData);
                    if (parsed.searchData) {
                        sessionStorage.setItem('readymadeSearchData', parsed.searchData);
                    }
                    if (parsed.plannerItems) {
                        sessionStorage.setItem('persistentTableData', parsed.plannerItems);
                    }
                    if (parsed.originalSearchParams) {
                        sessionStorage.setItem('tripPlannerParams', parsed.originalSearchParams);
                    }
                    if (parsed.readymadeContext) {
                        sessionStorage.setItem('readymadePackageContext', parsed.readymadeContext);
                    }
                    sessionStorage.removeItem('preservedReadymadeData');
                    console.log('Restored preserved readymade data');
                } catch (e) {
                    console.error('Error restoring preserved data:', e);
                }
            }
        }

        if (originalSearchData) {
            try {
                loadedSearchData = JSON.parse(originalSearchData);
                console.log('Using original search data to preserve dates');
            } catch (e) {
                console.error('Error parsing original search data:', e);
            }
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
                fromReadymadePackage: true
            };
            if (!originalSearchData) {
                sessionStorage.setItem('originalReadymadeSearchData', JSON.stringify(loadedSearchData));
            }
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
                }
            } catch (e) {
                console.error('Error parsing saved search data:', e);
            }
        }
        else if (location.state) {
            loadedSearchData = location.state;
            sessionStorage.setItem('originalReadymadeSearchData', JSON.stringify(loadedSearchData));
            
            if (loadedSearchData.destinations && Array.isArray(loadedSearchData.destinations)) {
                loadedSearchData.city = loadedSearchData.destinations[0];
            }
            
            if (loadedSearchData.guests) {
                loadedSearchData.adults = loadedSearchData.guests.adults || 2;
                loadedSearchData.cwb = loadedSearchData.guests.cwb || 0;
                loadedSearchData.cnb = loadedSearchData.guests.cnb || 0;
                loadedSearchData.infants = loadedSearchData.guests.infants || 0;
                
                loadedSearchData.rooms = [{
                    adults: loadedSearchData.guests.adults || 2,
                    cwb: loadedSearchData.guests.cwb || 0,
                    cnb: loadedSearchData.guests.cnb || 0,
                    infants: loadedSearchData.guests.infants || 0
                }];
                loadedSearchData.room = [loadedSearchData.rooms[0]];
            }
            
            if (!loadedSearchData.nights && loadedSearchData.totalNights) {
                loadedSearchData.nights = loadedSearchData.totalNights;
            }
            
            if (!loadedSearchData.country) {
                loadedSearchData.country = 'Georgia';
            }
        }
        
        let selectedHotel = null;
        if (hotelData) {
            try {
                selectedHotel = JSON.parse(decodeURIComponent(hotelData));
            } catch (e) {
                console.error('Error parsing hotel data:', e);
            }
        }
        return {
            searchData: loadedSearchData,
            selectedHotel,
            hasValidData: Object.keys(loadedSearchData).length > 0
        };
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
                    rooms: loadedSearchData.rooms || loadedSearchData.room || [{ adults: 2, cwb: 0, cnb: 0, infants: 0 }]
                };
                setOriginalSearchParams(processedSearchParams);
                isInitialized.current = true;
            } else {
                console.error('No valid search data found');
                setHasValidData(false);
            }
        }
    }, [location]);
    const createPlannerItemsWithPackageData = (hotelList: any[], activityList: any[], transferList: any[], packageData?: PackageData) => {
        const items: PlannerItem2[] = [];
        const startDate = new Date(currentSearchParams.checkInDate);
        let currentDate = new Date(startDate);
        const totalDays = packageData?.itinerary?.length || Math.ceil((new Date(currentSearchParams.checkOutDate).getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const deletedItineraries = JSON.parse(sessionStorage.getItem('deletedItineraries') || '[]');
        
        for (let i = 0; i < totalDays; i++) {
            const itineraryId = `itinerary-day-${i + 1}`;
            const plannerItem: PlannerItem2 = {
                id: `day-${i + 1}`,
                date: new Date(currentDate),
                hotel: undefined,
                tours: undefined,
                transfer: undefined,
                itinerary: (!deletedItineraries.includes(itineraryId) && packageData?.itinerary?.[i]) 
                    ? packageData.itinerary[i] 
                    : undefined
            };
            items.push(plannerItem);
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        let currentDayIndex = 0;
        hotelList.forEach((hotel, hotelIndex) => {
            const hotelNights = hotel.nights || 1;
            const hotelDays = hotelNights + 1;
            
            for (let dayOffset = 0; dayOffset < hotelDays && (currentDayIndex + dayOffset) < items.length; dayOffset++) {
                const dayIndex = currentDayIndex + dayOffset;
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
            currentDayIndex += hotelNights;
        });
        const deletedActivities = JSON.parse(sessionStorage.getItem('deletedActivities') || '[]');
        const availableActivities = activityList.filter(activity => !deletedActivities.includes(activity.id));
        
        availableActivities.forEach((activity, index) => {
            if (index < items.length) { 
                items[index].tours = activity; 
            }
        });
        
        transferList.forEach((transfer, index) => {
            if (index < items.length) { 
                items[index].transfer = transfer;
            }
        });
        
        setPlannerItems(items);
        calculateTotalWithPackageData(items, packageData);
        savePersistentTableData(items);
    };

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
            const filteredExistingHotels = existingHotels.filter((hotel: any) => {
                const isDeleted = deletedHotels.some((deleted: any) => 
                    deleted.id === hotel.id && 
                    (deleted.specificDayId === hotel.specificDayId || deleted.uniqueId === hotel.uniqueId)
                );
                return !isDeleted;
            });
            
            hotelList = [...filteredExistingHotels, ...hotelList];
            
            if (selectedHotelFromParams && selectedHotelFromParams.hotel) {
                const hotelFromParams = {
                    id: selectedHotelFromParams.hotel.id,
                    name: selectedHotelFromParams.hotel.hotelName,
                    destination: selectedHotelFromParams.hotel.destination || selectedHotelFromParams.city,
                    nights: selectedHotelFromParams.booking?.nights || 1,
                    price: selectedHotelFromParams.booking?.totalPrice || 0,
                    rating: selectedHotelFromParams.hotel.starRating,
                    checkInDate: selectedHotelFromParams.booking?.checkInDate,
                    checkOutDate: selectedHotelFromParams.booking?.checkOutDate,
                    specificDayId: selectedHotelFromParams.specificDayId || undefined,
                    uniqueId: selectedHotelFromParams.uniqueId || `hotel-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
                };
                const isParamsHotelDeleted = deletedHotels.some((deleted: any) => 
                    deleted.id === hotelFromParams.id && 
                    (deleted.specificDayId === hotelFromParams.specificDayId || deleted.uniqueId === hotelFromParams.uniqueId)
                );
                
                if (!isParamsHotelDeleted) {
                    const hotelExists = hotelList.some(hotel => 
                        hotel.id === hotelFromParams.id && hotel.specificDayId === hotelFromParams.specificDayId
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

    const handleRemoveHotel = (plannerItem: PlannerItem2) => {
    if (!plannerItem.hotel) return;
        
        const hotelToRemove = plannerItem.hotel;
        console.log('🗑️ Removing hotel:', hotelToRemove.name);
        const deletedHotels = JSON.parse(sessionStorage.getItem('deletedHotels') || '[]');
        const deletedHotel = {
            id: hotelToRemove.id,
            specificDayId: hotelToRemove.specificDayId,
            uniqueId: hotelToRemove.uniqueId,
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
                
                if (itemHotelKey === removeKey) {
                    console.log(`✅ Removing hotel from day: ${item.id}`);
                    return { ...item, hotel: undefined };
                }
            }
            return item;
        });
        
        setPlannerItems(updatedItems);
        
        const newTotal = calculateTotalWithPackageData(updatedItems, searchData?.packageData?.packageDetails);
        console.log('💰 New total after hotel removal:', newTotal);
        sessionStorage.removeItem('hotelSearchParams');
        sessionStorage.removeItem('lastNightHotelParams');
        sessionStorage.removeItem('selectedHotelArea');
        sessionStorage.setItem('tripPlannerItems', JSON.stringify(updatedItems));
        savePersistentTableData(updatedItems);
    };
    const createEmptyPlannerItems = () => {
        const items: PlannerItem2[] = [];
        const startDate = new Date(currentSearchParams.checkInDate);
        const endDate = new Date(currentSearchParams.checkOutDate);
        const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        let currentDate = new Date(startDate);
        for (let i = 0; i < totalDays; i++) {
        items.push({id: `day-${i + 1}`, date: new Date(currentDate),}); 
        currentDate.setDate(currentDate.getDate() + 1); }
        setPlannerItems(items);
        savePersistentTableData(items);
    };
    const calculateTotalWithPackageData = (items: PlannerItem2[], packageData?: PackageData) => {
        let total = 0;
        const processedHotels = new Set();
        const processedTours = new Set();
        const processedTransfers = new Set();
        console.log('Starting fresh total calculation');
        console.log('Items to process:', items.length);
        items.forEach((item, index) => {
        if (item.itinerary?.price) {total += item.itinerary.price; console.log(`Added itinerary price for day ${index + 1}: $${item.itinerary.price}`);}
        });
        items.forEach((item) => {
            if (item.hotel) {
                const hotelKey = `${item.hotel.id}-${item.hotel.uniqueId || item.hotel.specificDayId || 'default'}`;
                if (!processedHotels.has(hotelKey)) {
                    const hotelPrice = Number(item.hotel.price) || 0;
                    total += hotelPrice;
                    processedHotels.add(hotelKey);
                    console.log(`Added hotel price: $${hotelPrice} for ${item.hotel.name} (Key: ${hotelKey})`);
                } else { console.log(`Skipped duplicate hotel: ${item.hotel.name} (Key: ${hotelKey})`);
                }
            }
        });
    
        items.forEach((item) => {
            if (item.tours) {
                const tourKey = `${item.tours.id}-${item.id}`;
                if (!processedTours.has(tourKey)) {
                    const tourPrice = Number(item.tours.price) || 0;
                    total += tourPrice;
                    processedTours.add(tourKey);
                    console.log(`Added tour price: $${tourPrice} for ${item.tours.name} (Key: ${tourKey})`);
                } else {
                    console.log(`Skipped duplicate tour: ${item.tours.name} (Key: ${tourKey})`);
                }
            }
        });
    
        items.forEach((item) => {
            if (item.transfer) {
                const transferKey = item.transfer.id;
                if (!processedTransfers.has(transferKey)) {
                const transferPrice = Number(item.transfer.price) || 0; total += transferPrice; processedTransfers.add(transferKey);} 
                else { }}
        });
        if (packageData && searchData?.packageData?.packageDetails?.hotelOption?.[0]?.totalPackageCost) {
            const packageTotal = Number(searchData.packageData.packageDetails.hotelOption[0].totalPackageCost);
            console.log(`Package total from data: $${packageTotal}`);
            console.log(`Calculated total: $${total}`);
            if (packageTotal > total * 1.1) {
                total = packageTotal;
            }
        }
        console.log('Final calculated total:', total);
        console.log('Unique hotels processed:', processedHotels.size);
        console.log('Unique tours processed:', processedTours.size);
        console.log('Unique transfers processed:', processedTransfers.size);
        setGrandTotal(total);
        return total;
    };
    const calculateTotal = (items: PlannerItem2[]) => { return calculateTotalWithPackageData(items, searchData?.packageData?.packageDetails);};
    const handleTabChange = (event: React.SyntheticEvent, newValue: string) => { setActiveTab(newValue); };

    const handleAddItem = (plannerItemId: string, type: string) => {
    const plannerItem = plannerItems.find(item => item.id === plannerItemId);
    if (!plannerItem) return;
    if (type === 'tours') {
        const currentUrl = new URL(window.location.href);
        const fromReadymadePackage = currentUrl.searchParams.get('fromReadymadePackage') === 'true'
            || window.location.pathname.includes('readymade-planner');
            
        if (fromReadymadePackage) {
            const dayNumber = plannerItemId.replace('day-', '');
            const checkInDate = currentUrl.searchParams.get('checkInDate')
                || searchData?.checkInDate
                || new Date().toISOString();
            const city = currentUrl.searchParams.get('city')
                || searchData?.destinations?.[0]
                || 'Batumi';
            const country = currentUrl.searchParams.get('country') || 'Georgia';
            const rooms = searchData?.room || [{ adults: 2, cwb: 0, cnb: 0, infants: 0 }];
            const adult = searchData?.guests?.adults || 2;
            const infant = searchData?.guests?.infants || 0;
            
            const tourSelectionUrl = new URL('http://localhost:3002/hotel/home-page');
            tourSelectionUrl.searchParams.set('city', city);
            tourSelectionUrl.searchParams.set('country', country);
            tourSelectionUrl.searchParams.set('pax', adult.toString());
            tourSelectionUrl.searchParams.set('adult', adult.toString());
            tourSelectionUrl.searchParams.set('infant', infant.toString());
            tourSelectionUrl.searchParams.set('fromTripPlanner', 'true');
            tourSelectionUrl.searchParams.set('dayId', dayNumber);
            tourSelectionUrl.searchParams.set('checkInDate', checkInDate);
            tourSelectionUrl.searchParams.set('specificDayId', plannerItemId);
            tourSelectionUrl.searchParams.set('fromReadymadePackage', 'true');
            
            sessionStorage.setItem('tourSelectionDayId', plannerItemId);
            sessionStorage.setItem('expectedDayId', plannerItemId);
            
            sessionStorage.setItem('preservedReadymadeData', JSON.stringify({
                searchData: JSON.stringify(searchData),
                plannerItems: JSON.stringify({
                    plannerItems,
                    hotels,
                    // activities,
                    transfers,
                    grandTotal,
                    timestamp: new Date().toISOString()
                }),
                originalSearchParams: JSON.stringify(originalSearchParams),
                readymadeContext: JSON.stringify({
                    plannerItems,
                    originalSearchParams,
                    selectedItemId: plannerItemId
                })
            }));
            
            console.log('🚀 Redirecting to tour selection for day:', plannerItemId);
            window.location.href = tourSelectionUrl.toString();
            return;
        }
        const availableActivity = activities.find(activity =>
            !plannerItems.some(item => item.tours?.id === activity.id));
            
        if (availableActivity) {
            const updatedItems = plannerItems.map(item =>
                item.id === plannerItemId ? {
                    ...item,
                    tours: availableActivity,
                    itinerary: undefined
                } : item
            );
            setPlannerItems(updatedItems);
            calculateTotal(updatedItems);
            savePersistentTableData(updatedItems);
        }
    }
    
    console.log(` Add ${type} for:`, plannerItemId);
};

const handleRemoveTour = (plannerItem: PlannerItem2) => {
    const tourToRemove = plannerItem.tours;
    const itineraryToRemove = plannerItem.itinerary;
    
    if (!tourToRemove && !itineraryToRemove) return;
    
    console.log('🗑️ Removing tour/itinerary from day:', plannerItem.id);
    const updatedItems = plannerItems.map(item =>
        item.id === plannerItem.id ? { 
            ...item, 
            tours: undefined, 
            itinerary: tourToRemove ? item.itinerary : undefined 
        } : item
    );
    
    setPlannerItems(updatedItems);
    sessionStorage.setItem('tripPlannerItems', JSON.stringify(updatedItems));
    savePersistentTableData(updatedItems);
    const newTotal = calculateTotalWithPackageData(updatedItems, searchData?.packageData?.packageDetails);
    console.log('💰 New total after removal:', newTotal);
    if (tourToRemove?.id) {
        const updatedActivities = activities.filter(activity => activity.id !== tourToRemove.id);
        setActivities(updatedActivities);
        saveActivitiesToSession(updatedActivities);
        const deletedActivities = JSON.parse(sessionStorage.getItem('deletedActivities') || '[]');
        if (!deletedActivities.includes(tourToRemove.id)) {
            deletedActivities.push(tourToRemove.id);
            sessionStorage.setItem('deletedActivities', JSON.stringify(deletedActivities));
        }
        const tourMapping = JSON.parse(sessionStorage.getItem('tourDayMapping') || '{}');
        delete tourMapping[tourToRemove.id];
        sessionStorage.setItem('tourDayMapping', JSON.stringify(tourMapping));
    }
    if (itineraryToRemove && searchData?.packageData?.packageDetails?.itinerary) {
        const deletedItineraries = JSON.parse(sessionStorage.getItem('deletedItineraries') || '[]');
        const itineraryId = itineraryToRemove.id || `itinerary-${plannerItem.id}`;
        if (!deletedItineraries.includes(itineraryId)) {
            deletedItineraries.push(itineraryId);
            sessionStorage.setItem('deletedItineraries', JSON.stringify(deletedItineraries));
        }
    }
};
useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const addedToPlanner = urlParams.get('addedToPlanner') === 'true';
    const tourAdded = urlParams.get('tourAdded') === 'true';
    const specificDayId = urlParams.get('specificDayId');
    const encodedTourData = urlParams.get('tourData');

    console.log("📥 URL-specificDayId:", specificDayId);
    console.log('🔍 Tour Data Processing - Initial Check:', {
        addedToPlanner,
        specificDayId,
        hasTourDataInUrl: !!encodedTourData,
        plannerItemsLength: plannerItems.length
    });
    if (specificDayId && specificDayId !== specificDayIdState) {
        console.log("🎯 Setting specificDayId state:", specificDayId);
        setSpecificDayId(specificDayId);
    }
    if (addedToPlanner && specificDayId && plannerItems.length > 0) {
        console.log("🚀 Processing tour assignment for day:", specificDayId);
        let storedTour: any = {};
        if (encodedTourData) {
            try {
                storedTour = JSON.parse(decodeURIComponent(encodedTourData));
                console.log('📦 Tour data from URL params:', storedTour);
            } catch (error) {
                console.error('❌ Error parsing tourData from URL:', error);
            }
        }
        if (!storedTour.tourDetails && !storedTour.tour) {
            try {
                const sessionTour = sessionStorage.getItem('selectedTourData');
                if (sessionTour) {
                    storedTour = JSON.parse(sessionTour);
                    console.log('📦 Tour data from session storage:', storedTour);
                }
            } catch (error) {
                console.error('❌ Error parsing sessionStorage tourData:', error);
            }
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
                assignedDayId: specificDayId
            };
            console.log(`🎯 Creating tour activity for day ${specificDayId}:`, newActivity);
            setActivities(prevActivities => {
                const updatedActivities = [
                    ...prevActivities.filter(act => act.id !== newActivity.id),
                    newActivity
                ];
                saveActivitiesToSession(updatedActivities);
                console.log('✅ Activities updated, count:', updatedActivities.length);
                return updatedActivities;
            });
            setPlannerItems(prevItems => {
                console.log(`🔍 Looking for planner item with id: ${specificDayId}`);
                console.log('Available planner item IDs:', prevItems.map(item => item.id));
                const targetItem = prevItems.find(item => item.id === specificDayId);
                if (!targetItem) {
                    console.error(`❌ No planner item found with id: ${specificDayId}`);
                    return prevItems;
                }
                const updatedItems = prevItems.map(item => {
                    if (item.id === specificDayId) {
                        console.log(`✅ Assigning tour "${newActivity.name}" to day ${specificDayId}`);
                        return {
                            ...item,
                            tours: newActivity,
                            itinerary: undefined
                        };
                    }
                    return item;
                });
                const tourMapping = JSON.parse(sessionStorage.getItem('tourDayMapping') || '{}');
                tourMapping[newActivity.id] = specificDayId;
                sessionStorage.setItem('tourDayMapping', JSON.stringify(tourMapping));
                setTimeout(() => {
                    const newTotal = calculateTotalWithPackageData(updatedItems, searchData?.packageData?.packageDetails);
                    console.log('💰 New total after tour assignment:', newTotal);
                    savePersistentTableData(updatedItems);
                }, 100);

                return updatedItems;
            });
            sessionStorage.removeItem('selectedTourData');
            sessionStorage.removeItem('pendingTourAssignment');
            const url = new URL(window.location.href);
            ['addedToPlanner', 'tourAdded', 'preserveData', 'dayId', 'specificDayId', 'timestamp', 'tourData'].forEach(param => {
                url.searchParams.delete(param);
            });
            window.history.replaceState({}, '', url.toString());
            console.log('✅ Tour processing completed successfully for day:', specificDayId);
        } else {
            console.log('❌ No valid tour data found in URL or session storage');
        }
    } else if (addedToPlanner && specificDayId && plannerItems.length === 0) {
        console.log('🕗 Planner items not loaded yet, storing tour data for later');
        if (encodedTourData) {
            try {
                const tourData = JSON.parse(decodeURIComponent(encodedTourData));
                sessionStorage.setItem('pendingTourAssignment', JSON.stringify({
                    dayId: specificDayId,
                    tourData: tourData
                }));
            } catch (error) {
                console.error('❌ Error storing pending tour assignment:', error);
            }
        }
    }
    if (plannerItems.length > 0) {
        const pendingAssignment = sessionStorage.getItem('pendingTourAssignment');
        if (pendingAssignment) {
            try {
                const { dayId, tourData } = JSON.parse(pendingAssignment);
                console.log('🔄 Processing pending tour assignment for day:', dayId);
                sessionStorage.removeItem('pendingTourAssignment');
            } catch (error) {
                console.error('❌ Error processing pending tour assignment:', error);
            }
        }
    }

}, [plannerItems.length, specificDayIdState]);

useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const encoded = urlParams.get("tourData");
    console.log("tour data from Tour site",encoded)
    if (encoded) {
    try { const parsedData = JSON.parse(decodeURIComponent(encoded)); setSelectedTourData(parsedData); console.log("Tour data received:", parsedData);} 
    catch (err) {  console.error("Invalid tour data", err);} }
    }, []);
const handleHotelSelection2 = (itemId: string) => {
    const plannerItem = plannerItems.find(item => item.id === itemId);
    if (!plannerItem) return;
    const itemDate = new Date(plannerItem.date);
    const dayHasHotel = plannerItems.find(item => item.id === itemId && item.hotel);
    if (dayHasHotel) {console.log("This day already has a hotel assigned");return;}
    const checkInDate = new Date(itemDate);
    const checkOutDate = new Date(itemDate);
    checkOutDate.setDate(checkOutDate.getDate() + 1);
    const fallbackSearchParams = {
        checkInDate: searchData?.checkInDate || new Date().toISOString(),
        checkOutDate: searchData?.checkOutDate || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        nights: searchData?.nights || searchData?.totalNights || 1,
        city:  searchData?.destinations?.[0] || 'Batumi',
        country: 'Georgia',
        adults:searchData?.guests?.adults || 2,
        cwb: searchData?.guests?.cwb || 0,
        cnb:  searchData?.guests?.cnb || 0,
        infants:  searchData?.guests?.infants || 0,
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
        Description: '',
    };
    if (isLastNight) {
        const extraDay = new Date(checkOutDate);
        const additionalSearchParams = {
            ...hotelSearchParams,
            checkInDate: extraDay.toISOString(),
            checkOutDate: new Date(extraDay.setDate(extraDay.getDate() + 1)).toISOString()};
    sessionStorage.setItem('lastNightHotelParams', JSON.stringify(additionalSearchParams));}
    sessionStorage.setItem('tripPlannerParams', JSON.stringify(baseSearchParams));
    sessionStorage.setItem('hotelSearchParams', JSON.stringify(hotelSearchParams));
    sessionStorage.setItem('readymadePackageContext', JSON.stringify({
    plannerItems: plannerItems, originalSearchParams: baseSearchParams, selectedItemId: itemId
})); navigate('/trip-planner-area', {state: hotelSearchParams });
};
useEffect(() => { console.log('Current state values:', { searchData: searchData, originalSearchParams: originalSearchParams,hasValidData: hasValidData, plannerItemsLength: plannerItems.length});
}, [searchData, originalSearchParams, hasValidData, plannerItems.length]);

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
                                <Tab className='hotel-btn' value="hotel" label="Hotel Details"   sx={{color: activeTab === 'hotel' ? 'white' : 'black', bgcolor: activeTab === 'hotel' ? 'grey' : 'white', marginLeft: '0.5rem', width: '10rem' }} />
                                )}
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
                        
                        <Box className="action-buttons" sx={{ display: 'flex', gap: 2, padding: '16px', justifyContent: 'flex-end' }}>
                            <Button className="proceed-button" onClick={handleDownloadPDF} disabled={loading} sx={{ minWidth: '120px' }}>  {loading ? <CircularProgress size={24} /> : 'Download Now'} </Button>
                            <Button className="cancel-button" onClick={onCancel} variant="outlined">   Cancel  </Button>
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
