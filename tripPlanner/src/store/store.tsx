// src/store/store.ts
import { configureStore } from '@reduxjs/toolkit';
import rootReducer from './rootReducer.ts';
import { tourApi } from '../api/TourAPI.tsx';
import { useDispatch, useSelector } from 'react-redux';
import { TypedUseSelectorHook } from 'react-redux';


const initStore = (preloadedState?: Partial<RootState>) =>
  configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }).concat(tourApi.middleware), // Add API middleware
    preloadedState,
    devTools: process.env.NODE_ENV !== 'production', // Enable devtools only in non-production
  });

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = ReturnType<typeof initStore>['dispatch']; // Correctly typed dispatch
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
export default initStore;