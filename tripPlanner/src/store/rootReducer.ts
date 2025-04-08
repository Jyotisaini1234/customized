import { combineReducers } from '@reduxjs/toolkit';
import { alertReducer } from './Alert/alertSlice.ts';
import { loaderReducer } from './Loader/LoaderSlice.ts';
import { errorReducer } from './Error/ErrorSlice.ts';
import { notFoundReducer } from './NotFound/NotFoundSlice.ts';
import authReducer from './slices/authSlice.ts';
import { tourApi } from '../api/TourAPI.tsx';

const rootReducer = combineReducers({
  alert: alertReducer,
  loader: loaderReducer,
  error: errorReducer,
  notFound: notFoundReducer,
  auth: authReducer,
  [tourApi.reducerPath]: tourApi.reducer,
});

export default rootReducer;

export type RootState = ReturnType<typeof rootReducer>;
