const DB_NAME = 'tripPlannerDB';
const DB_VERSION = 1;

export const STORES = {
PARAMS: 'tripPlannerParams',
HOTELS: 'tripPlannerHotels',
ITEMS: 'tripPlannerItems',
BOOKINGS: 'myBookings',
PLANNER_DATA: 'tripPlannerData',
HOTEL_SEARCH_PARAMS: 'hotelSearchParams',
HOTEL_AREA: 'selectedHotelArea',
LAST_NIGHT_PARAMS: 'lastNightHotelParams'
};

export interface DBStore {
name: string;
keyPath?: string;
indexes?: { name: string; keyPath: string; options?: IDBIndexParameters }[];
}

const initDB = (): Promise<IDBDatabase> => {
return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
    const db = (event.target as IDBOpenDBRequest).result;
    
      // Define stores
    const stores: DBStore[] = [
        { name: STORES.PARAMS },
        { name: STORES.HOTELS },
        { name: STORES.ITEMS },
        { name: STORES.BOOKINGS, keyPath: 'id' },
        { name: STORES.PLANNER_DATA },
        { name: STORES.HOTEL_SEARCH_PARAMS },
        { name: STORES.HOTEL_AREA },
        { name: STORES.LAST_NIGHT_PARAMS }
    ];

    // Create stores if they don't exist
    stores.forEach(store => {
        if (!db.objectStoreNames.contains(store.name)) {
        const objectStore = db.createObjectStore(store.name, { keyPath: store.keyPath });
        
          // Add indexes if specified
        if (store.indexes) {
            store.indexes.forEach(index => {
            objectStore.createIndex(index.name, index.keyPath, index.options);
            });
        }
        }
    });
    };

    request.onsuccess = (event) => {
    resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
    reject((event.target as IDBOpenDBRequest).error);
    };
});
};

// Generic set item function
export const setItem = async (storeName: string, value: any, key: string = 'default'): Promise<void> => {
try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    
    let request;
    if (store.keyPath) {
        // If store has a keyPath, assume value already has the key
        request = store.put(value);
    } else {
        // Otherwise use the provided key
        request = store.put(value, key);
    }

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    
    transaction.oncomplete = () => db.close();
    });
} catch (error) {
    console.error(`Error setting item in ${storeName}:`, error);
    throw error;
}
};

// Generic get item function
export const getItem = async (storeName: string, key: string = 'default'): Promise<any> => {
try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    
    transaction.oncomplete = () => db.close();
    });
} catch (error) {
    console.error(`Error getting item from ${storeName}:`, error);
    return null;
}
};

// Generic delete item function
export const removeItem = async (storeName: string, key: string = 'default'): Promise<void> => {
try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    
    transaction.oncomplete = () => db.close();
    });
} catch (error) {
    console.error(`Error removing item from ${storeName}:`, error);
    throw error;
}
};

// Helper functions for specific stores
export const setTripPlannerParams = (params: any) => setItem(STORES.PARAMS, params);
export const getTripPlannerParams = () => getItem(STORES.PARAMS);

export const setTripPlannerHotels = (hotels: any[]) => setItem(STORES.HOTELS, hotels);
export const getTripPlannerHotels = () => getItem(STORES.HOTELS);

export const setTripPlannerItems = (items: any[]) => setItem(STORES.ITEMS, items);
export const getTripPlannerItems = () => getItem(STORES.ITEMS);

export const setMyBookings = (bookings: any[]) => setItem(STORES.BOOKINGS, bookings);
export const getMyBookings = () => getItem(STORES.BOOKINGS);

export const setTripPlannerData = (data: any) => setItem(STORES.PLANNER_DATA, data);
export const getTripPlannerData = () => getItem(STORES.PLANNER_DATA);

export const setHotelSearchParams = (params: any) => setItem(STORES.HOTEL_SEARCH_PARAMS, params);
export const getHotelSearchParams = () => getItem(STORES.HOTEL_SEARCH_PARAMS);

export const setSelectedHotelArea = (area: string) => setItem(STORES.HOTEL_AREA, area);
export const getSelectedHotelArea = () => getItem(STORES.HOTEL_AREA);

export const setLastNightHotelParams = (params: any) => setItem(STORES.LAST_NIGHT_PARAMS, params);
export const getLastNightHotelParams = () => getItem(STORES.LAST_NIGHT_PARAMS);