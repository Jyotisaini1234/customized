export const DB_NAME = 'PlannerDB';
export const DB_VERSION = 2;
export const STORES = {
    deletedItems: 'deletedItems',
    activities: 'activities', 
    hotels: 'hotels',
    tourMapping: 'tourMapping',
    plannerData: 'plannerData',
    authData: 'authData'
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
            request.onsuccess = () => {
                const result = request.result?.data;
                console.log(`Getting ${key} from ${store}:`, result);
                resolve(result || defaultValue);
            };
            request.onerror = () => {
                console.error(`Error getting ${key} from ${store}:`, request.error);
                resolve(defaultValue);
            };
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
        const result = objectStore.put({ id: key, data });
        
        return new Promise((resolve, reject) => {
            result.onsuccess = () => {
                console.log(`Successfully saved ${key} to ${store}:`, data); // Debug log
                resolve(result.result);
            };
            result.onerror = () => {
                console.error(`Error saving ${key} to ${store}:`, result.error);
                reject(result.error);
            };
        });
    } catch (e) {
        console.error(`Error saving ${key} to ${store}:`, e);
        throw e;
    }
};

export const saveAuthData = async (key: string, data: any) => {
    return saveToDB(STORES.authData, key, data);
};

export const getAuthData = async (key: string, defaultValue: any = null) => {
    return getFromDB(STORES.authData, key, defaultValue);
};

export const clearAuthData = async () => {
    try {
        const db = await initDB();
        const transaction = db.transaction([STORES.authData], 'readwrite');
        const objectStore = transaction.objectStore(STORES.authData);
        const clearRequest = objectStore.clear();
        
        return new Promise((resolve, reject) => {
            clearRequest.onsuccess = () => resolve(true);
            clearRequest.onerror = () => reject(clearRequest.error);
        });
    } catch (e) {
        console.error('Error clearing auth data:', e);
        throw e;
    }
};

export const savePackageDetails = async (packageDetails: any) => {
    try {
        console.log('Saving package details:', packageDetails);
        await saveToDB(STORES.plannerData, 'packageDetails', packageDetails);
        return true;
    } catch (e) {
        console.error('Error saving package details:', e);
        return false;
    }
};

export const getPackageDetails = async (defaultValue: any = []) => {
    try {
        const packageDetails = await getFromDB(STORES.plannerData, 'packageDetails', defaultValue);
        console.log('Retrieved package details:', packageDetails);
        return packageDetails;
    } catch (e) {
        console.error('Error getting package details:', e);
        return defaultValue;
    }
};

export const updatePackageDetailsWithNewHotel = async (hotelData: any, existingPackageDetails: any = null) => {
    try {
        // Get existing package details if not provided
        const currentPackageDetails = existingPackageDetails || await getPackageDetails([]);
        
        // If no existing package details, create new structure
        if (!Array.isArray(currentPackageDetails) || currentPackageDetails.length === 0) {
            console.warn('No existing package details found, hotel selection might not preserve table data');
            return currentPackageDetails;
        }
        
        // Update hotel information in package details while preserving other data
        const updatedPackageDetails = currentPackageDetails.map(item => {
            if (item.type === 'hotel' || (hotelData.city && item.city === hotelData.city)) {
                return {
                    ...item,
                    hotelName: hotelData.name || item.hotelName,
                    hotelId: hotelData.id || item.hotelId,
                    roomType: hotelData.roomType || item.roomType,
                    price: hotelData.price || item.price,
                    // Preserve other existing properties
                    ...hotelData
                };
            }
            return item;
        });
        
        console.log('Updated package details with new hotel:', updatedPackageDetails);
        await savePackageDetails(updatedPackageDetails);
        return updatedPackageDetails;
    } catch (e) {
        console.error('Error updating package details with new hotel:', e);
        return getPackageDetails || [];
    }
};

export const setRegistrationSuccess = async (success: boolean) => {
    try {
        await saveToDB(STORES.authData, 'registrationSuccess', success);
        return true;
    } catch (e) {
        console.error('Error saving registration success:', e);
        return false;
    }
};

export const getRegistrationSuccess = async (): Promise<boolean> => {
    try {
        const success = await getFromDB(STORES.authData, 'registrationSuccess', false);
        return success;
    } catch (e) {
        console.error('Error getting registration success:', e);
        return false;
    }
};

export const clearRegistrationSuccess = async () => {
    try {
        const db = await initDB();
        const transaction = db.transaction([STORES.authData], 'readwrite');
        const objectStore = transaction.objectStore(STORES.authData);
        const deleteRequest = objectStore.delete('registrationSuccess');
        
        return new Promise((resolve, reject) => {
            deleteRequest.onsuccess = () => resolve(true);
            deleteRequest.onerror = () => reject(deleteRequest.error);
        });
    } catch (e) {
        console.error('Error clearing registration success:', e);
        return false;
    }
};

export const saveUserRegistrationData = async (userData: any) => {
    try {
        const userDataToSave = {
            username: userData.username,
            email: userData.email,
            mobile: userData.mobile,
            companyName: userData.companyName,
            registrationDate: new Date().toISOString(),
            ...userData
        };
        
        await saveToDB(STORES.authData, 'currentUser', userDataToSave);
        console.log('User registration data saved successfully');
        return true;
    } catch (e) {
        console.error('Error saving user registration data:', e);
        return false;
    }
};

export const getCurrentUser = async () => {
    try {
        const userData = await getFromDB(STORES.authData, 'currentUser', null);
        return userData;
    } catch (e) {
        console.error('Error getting current user:', e);
        return null;
    }
};

export const saveLogoPath = async (logoPath: string) => {
    try {
        await saveToDB(STORES.authData, 'logoPath', logoPath);
        return true;
    } catch (e) {
        console.error('Error saving logo path:', e);
        return false;
    }
};

export const getLogoPath = async (): Promise<string | null> => {
    try {
        const logoPath = await getFromDB(STORES.authData, 'logoPath', null);
        return logoPath;
    } catch (e) {
        console.error('Error getting logo path:', e);
        return null;
    }
};

export const migrateAuthData = async () => {
    try {
        const authKeys = ['authData', 'authToken', 'refreshToken', 'userEmail',  'companyName', 'logoPath'];
        
        for (const key of authKeys) {
            const data = await getFromDB(STORES.plannerData, key, null);
            if (data !== null) {
                await saveAuthData(key, data);
                const db = await initDB();
                const transaction = db.transaction([STORES.plannerData], 'readwrite');
                const objectStore = transaction.objectStore(STORES.plannerData);
                const deleteRequest = objectStore.delete(key);
                
                await new Promise((resolve, reject) => {
                    deleteRequest.onsuccess = () => resolve(true);
                    deleteRequest.onerror = () => reject(deleteRequest.error);
                });
            }
        }
        
        console.log('Auth data migration completed');
    } catch (e) {
        console.error('Error migrating auth data:', e);
    }
};

export const debugPlannerData = async () => {
    try {
        const db = await initDB();
        const transaction = db.transaction([STORES.plannerData], 'readonly');
        const objectStore = transaction.objectStore(STORES.plannerData);
        const getAllRequest = objectStore.getAll();
        
        return new Promise((resolve) => {
            getAllRequest.onsuccess = () => {
                console.log('All planner data:', getAllRequest.result);
                resolve(getAllRequest.result);
            };
            getAllRequest.onerror = () => {
                console.error('Error getting all planner data:', getAllRequest.error);
                resolve([]);
            };
        });
    } catch (e) {
        console.error('Error debugging planner data:', e);
        return [];
    }
};


export const saveUserLoginData = async (loginResponse: any) => {
    try {
      const userData = {
        username: loginResponse.username || loginResponse.user || 'User',
        email: loginResponse.email || '',
        companyName: loginResponse.companyName || loginResponse.company_name || '',
        logoPath: loginResponse.logoPath || loginResponse.logo_path || '',
        authToken: loginResponse.token || loginResponse.authToken || '',
        refreshToken: loginResponse.refreshToken || '',
        loginDate: new Date().toISOString()
      };
      console.log('Saving user login data:', userData);
      await saveAuthData('authData', userData);
      
      await Promise.all([
        saveAuthData('userEmail', userData.email),
        saveAuthData('username', userData.username),
        saveAuthData('companyName', userData.companyName),
        saveAuthData('logoPath', userData.logoPath),
        saveAuthData('authToken', userData.authToken),
        saveAuthData('refreshToken', userData.refreshToken),
        saveAuthData('userRole', 'USER')
      ]);
      
      console.log('User login data saved successfully');
      return true;
    } catch (error) {
      console.error('Error saving user login data:', error);
      return false;
    }
  };
  
  export const updateUserCompanyInfo = async (companyInfo: any) => {
    try {
      const existingAuthData = await getAuthData('authData', {});
      
      const updatedData = {
        ...existingAuthData,
        username: companyInfo.username || existingAuthData.username,
        companyName: companyInfo.companyName || companyInfo.company_name || existingAuthData.companyName,
        logoPath: companyInfo.logoPath || companyInfo.logo_path || existingAuthData.logoPath
      };
      
      console.log('Updating user company info:', updatedData);
      
      await saveAuthData('authData', updatedData);
      
      if (updatedData.username) await saveAuthData('username', updatedData.username);
      if (updatedData.companyName) await saveAuthData('companyName', updatedData.companyName);
      if (updatedData.logoPath) await saveAuthData('logoPath', updatedData.logoPath);
      
      console.log('User company info updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating user company info:', error);
      return false;
    }
  };
  
  export const getUserDisplayData = async () => {
    try {
      const authData = await getAuthData('authData', {});
      
      return {
        email: authData.email || await getAuthData('userEmail', ''),
        username: authData.username || await getAuthData('username', ''),
        companyName: authData.companyName || await getAuthData('companyName', ''),
        logoPath: authData.logoPath || await getAuthData('logoPath', ''),
        authToken: authData.authToken || await getAuthData('authToken', ''),
        refreshToken: authData.refreshToken || await getAuthData('refreshToken', '')
      };
    } catch (error) {
      console.error('Error getting user display data:', error);
      return {
        email: '',
        username: '',
        companyName: '',
        logoPath: '',
        authToken: '',
        refreshToken: ''
      };
    }
  };
  
  export const migrateAuthDataFixed = async () => {
    try {
      console.log('Starting auth data migration...');
      const authKeys = ['authToken', 'refreshToken', 'userEmail', 'username', 'companyName', 'logoPath'];
      const migrationData: any = {};
      
      for (const key of authKeys) {
        const data = await getFromDB(STORES.plannerData, key, null);
        if (data !== null) {
          migrationData[key] = data;
          console.log(`Found ${key}:`, data);
        }
      }
      
      if (Object.keys(migrationData).length > 0) {
        const consolidatedAuthData = {
          email: migrationData.userEmail || '',
          username: migrationData.username || '',
          companyName: migrationData.companyName || '',
          logoPath: migrationData.logoPath || '',
          authToken: migrationData.authToken || '',
          refreshToken: migrationData.refreshToken || '',
          migrationDate: new Date().toISOString()
        };
        
        // Save to authData store
        await saveAuthData('authData', consolidatedAuthData);
        
        // Save individual keys for compatibility
        for (const [key, value] of Object.entries(migrationData)) {
          if (value !== null && value !== undefined) {
            await saveAuthData(key, value);
          }
        }
        
        // Clean up from plannerData store
        const db = await initDB();
        const transaction = db.transaction([STORES.plannerData], 'readwrite');
        const objectStore = transaction.objectStore(STORES.plannerData);
        
        for (const key of authKeys) {
          try {
            await new Promise((resolve, reject) => {
              const deleteRequest = objectStore.delete(key);
              deleteRequest.onsuccess = () => resolve(true);
              deleteRequest.onerror = () => reject(deleteRequest.error);
            });
            console.log(`Deleted ${key} from plannerData store`);
          } catch (error) {
            console.error(`Error deleting ${key}:`, error);
          }
        }
        
        console.log('Auth data migration completed successfully');
      } else {
        console.log('No auth data found to migrate');
      }
    } catch (error) {
      console.error('Error during auth data migration:', error);
    }
  };
