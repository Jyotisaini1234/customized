// store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from '@reduxjs/toolkit';
import hotelSlice from './slices/hotelSlice.ts';

const persistConfig = {
  key: 'tripPlanner',
  storage,
  whitelist: ['hotel'], // Only persist hotel slice
  version: 1,
  migrate: (state: any) => {
    // Handle migration if needed
    return Promise.resolve(state);
  }
};

const rootReducer = combineReducers({
  hotel: hotelSlice,
  // other reducers...
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;