export const DB_NAME = 'PlannerDB';
export const DB_VERSION = 1;
export const STORES = {
    deletedItems: 'deletedItems',
    activities: 'activities', 
    hotels: 'hotels',
    tourMapping: 'tourMapping',
    plannerData: 'plannerData'
};

export const initDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (e) => {
            const db = (e.target as IDBOpenDBRequest).result;
            Object.values(STORES).forEach(store => {
                if (!db.objectStoreNames.contains(store)) {
                    db.createObjectStore(store, { keyPath: 'id' });
                }
            });
        };
    });
};

export const getFromDB = async (store: string, key: string, defaultValue: any = []) => {
    try {
        const db = await initDB();
        const transaction = db.transaction([store], 'readonly');
        const objectStore = transaction.objectStore(store);
        const request = objectStore.get(key);
        
        return new Promise((resolve) => {
            request.onsuccess = () => resolve(request.result?.data || defaultValue);
            request.onerror = () => resolve(defaultValue);
        });
    } catch (e) {
        console.error(`Error getting ${key} from ${store}:`, e);
        return defaultValue;
    }
};

export const saveToDB = async (store: string, key: string, data: any) => {
    try {
        const db = await initDB();
        const transaction = db.transaction([store], 'readwrite');
        const objectStore = transaction.objectStore(store);
        objectStore.put({ id: key, data });
    } catch (e) {
        console.error(`Error saving ${key} to ${store}:`, e);
    }
};
