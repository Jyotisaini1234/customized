import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store.tsx';
import { initializeAuth, checkTokenValidity } from '../store/slices/authSlice.ts';

export const useAuthGuard = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isAuthenticated) {
        dispatch(checkTokenValidity());
      }
    }, 600000);

    return () => clearInterval(interval);
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = 'http://b2b.flydivinetravels.com/hotel';
    }
  }, [isAuthenticated, isLoading]);

  return { isAuthenticated, isLoading };
};