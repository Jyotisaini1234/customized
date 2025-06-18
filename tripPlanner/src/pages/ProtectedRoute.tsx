// import React from 'react';
// import AuthGuard from '../constants/AuthGuard.tsx';

// interface PrivateRouteProps {
//   children: React.ReactNode;
// }

// const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
//   return (
//     <AuthGuard>
//       {children}
//     </AuthGuard>
//   );
// };

// export default PrivateRoute;


// Port 3000: src/components/ProtectedRoute.tsx
import React, { useEffect, useState } from 'react';
import { CircularProgress, Box, Typography } from '@mui/material';
import MainAppTokenService from '../pages/tokenService.ts';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const urlTokens = MainAppTokenService.extractTokensFromUrl();
        if (urlTokens.success) {
          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        }
        if (!MainAppTokenService.isAuthenticated()) {
          MainAppTokenService.clearTokensAndRedirect();
          return;
        }
        if (MainAppTokenService.isSessionExpired()) {
          console.log('Session expired, redirecting to login');
          MainAppTokenService.clearTokensAndRedirect();
          return;
        }
        const isValid = await MainAppTokenService.validateToken();
        if (isValid) {
          setIsAuthenticated(true);
        } else {
          MainAppTokenService.clearTokensAndRedirect();
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
        MainAppTokenService.clearTokensAndRedirect();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthentication();
  }, []);
return <>{children}</>;
};

export default ProtectedRoute;