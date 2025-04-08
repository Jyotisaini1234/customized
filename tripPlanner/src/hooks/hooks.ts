import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store/store';

// Custom hook that provides the typed dispatch
export const useAppDispatch = () => useDispatch<AppDispatch>();
