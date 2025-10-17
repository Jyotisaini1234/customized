import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './PrimaryNavbar.scss';
import { DASHBOARD_NAV_ITEMS, USER_NAV_ITEMS } from '../../../../constants/routeConstants.ts';
import { Box, IconButton } from '@mui/material';
import { dropdownMenus, userDropdownOptions } from '../../../../model/selectOptions.ts';
import { Menu as MenuIcon } from '@mui/icons-material';
import { AWS_INSTANCE } from '../../../../utils/ApiConstants.ts';
import { useGetUserCompanyInfoQuery } from '../../../../api/TourAPI.tsx';
import CreateUser from '../CreateUser/CreateUser.tsx';
import { useAuth } from '../../../../constants/useAuth.ts';

interface PrimaryNavbarProps {
  setShowSearch: (show: boolean) => void;
}

const PrimaryNavbar: React.FC<PrimaryNavbarProps> = ({ setShowSearch }) => {
  const [activeItem, setActiveItem] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const authData = useAuth();
  const { user, token, refreshToken,loginEmail, companyName,logoPath, userName, isAuthenticated,logout,updateCompanyInfo,handleUrlParams} = authData;
  useEffect(() => {
    const handleAuthUpdate = () => {
      setForceUpdate(prev => prev + 1);
    };
    window.addEventListener('authUpdated', handleAuthUpdate);
    return () => window.removeEventListener('authUpdated', handleAuthUpdate);
  }, []);

  const userEmail = useMemo(() => {
    if (loginEmail && loginEmail.includes('@')) return loginEmail;
    if (user?.email && user.email.includes('@')) return user.email;
    if (userName && userName.includes('@')) return userName;
    if (isAuthenticated && token) {
      try {
        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
        if (tokenPayload.email) return tokenPayload.email;
        if (tokenPayload.sub && tokenPayload.sub.includes('@')) return tokenPayload.sub;
      } catch (error) {
        console.error('Error extracting email from token:', error);
      }
    }
    
    return isAuthenticated ? (loginEmail || user?.email || 'User') : 'Guest';
  }, [loginEmail, user, userName, isAuthenticated, token, forceUpdate]);
  
  const displayValues = useMemo(() => {
    const displayCompanyName = companyName || user?.companyName || (isAuthenticated ? 'Loading...' : 'Company');
    const displayLogoPath = logoPath || '';
    const displayUserName = userName || (userEmail !== 'Guest' && userEmail !== 'User' ? userEmail.split('@')[0] : userEmail);
    return {displayCompanyName,displayLogoPath, displayUserName};
  }, [companyName, user, logoPath, userName, userEmail, isAuthenticated, forceUpdate]);
  const { displayCompanyName, displayLogoPath, displayUserName } = displayValues;
  const {  data: companyInfoData,  isLoading: isCompanyInfoLoading,  error: companyInfoError } = useGetUserCompanyInfoQuery( userEmail && userEmail !== 'Guest' && userEmail !== 'User' ? userEmail : '',  {skip: !userEmail || userEmail === 'Guest' || userEmail === 'User' || !isAuthenticated,   refetchOnMountOrArgChange: true  } );

  const handleUrlParametersAndCleanUrl = useCallback(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paramKeys = ['authToken', 'refreshToken', 'userEmail', 'companyName', 'logoPath', 'username'];
    const hasAuthParams = paramKeys.some(key => urlParams.has(key));
    if (hasAuthParams) {
      const params = {
        email: urlParams.get('userEmail') ? decodeURIComponent(urlParams.get('userEmail')!) : undefined,
        companyName: urlParams.get('companyName') ? decodeURIComponent(urlParams.get('companyName')!) : undefined,
        logoPath: urlParams.get('logoPath') ? decodeURIComponent(urlParams.get('logoPath')!) : undefined,
        userName: urlParams.get('username') ? decodeURIComponent(urlParams.get('username')!) : undefined,
        authToken: urlParams.get('authToken') || undefined,
        refreshToken: urlParams.get('refreshToken') || undefined
      };
      
      handleUrlParams(params);
      const cleanUrl = window.location.pathname + (window.location.hash || '');
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, [handleUrlParams]);

  useEffect(() => {
    const currentPath = location.pathname;
    const dashboardItem = DASHBOARD_NAV_ITEMS.find(item => currentPath.startsWith(item.path));
    const userItem = USER_NAV_ITEMS.find(item => item.path === currentPath);
    setActiveItem(dashboardItem?.key || userItem?.key || '');
  }, [location.pathname]);

  useEffect(() => {
    handleUrlParametersAndCleanUrl();
  }, [handleUrlParametersAndCleanUrl]);

  useEffect(() => {
    if (companyInfoData && !isCompanyInfoLoading && !companyInfoError) {
      const companyInfo = {companyName: companyInfoData.companyName,logoPath: companyInfoData.logoPath,userName: companyInfoData.username};
      updateCompanyInfo(companyInfo);
      setForceUpdate(prev => prev + 1);
    }
  }, [companyInfoData, isCompanyInfoLoading, companyInfoError, updateCompanyInfo]);

  const buildURLWithJWTTokens = useCallback((baseUrl: string): string => {
    if (!isAuthenticated || !token) {
      console.warn('Building URL without authentication');
      return baseUrl;
    }
    const isExternal = baseUrl.startsWith('http://') || baseUrl.startsWith('https://');
    let url: URL;
    try {
      if (isExternal) {
        url = new URL(baseUrl);
      } else {
        const origin = window.location.origin;
        const fullPath = baseUrl.startsWith('/') ? baseUrl : `/${baseUrl}`;
        url = new URL(fullPath, origin);
      }
      const params = {
        authToken: token,
        refreshToken: refreshToken || '',
        userEmail: userEmail && userEmail !== 'Guest' && userEmail !== 'User' ? userEmail : '',
        companyName: displayCompanyName && displayCompanyName !== 'Loading...' ? displayCompanyName : '',
        logoPath: displayLogoPath || '',
        username: displayUserName && displayUserName !== 'Guest' && displayUserName !== 'User' ? displayUserName : '',
        authenticated: 'true'
      };
      Object.entries(params).forEach(([key, value]) => {
        if (value && value !== 'Loading...') {
          const encodedValue = ['companyName', 'logoPath', 'userEmail', 'username'].includes(key) 
            ? encodeURIComponent(value) 
            : value;
          url.searchParams.set(key, encodedValue);
        }
      });
      return url.toString();
    } catch (error) {
      console.error('❌ Error building URL:', error);
      return baseUrl;
    }
  }, [isAuthenticated, token, refreshToken, userEmail, displayCompanyName, displayLogoPath, displayUserName]);

  const isExternalURL = (url: string): boolean => {
    return url.startsWith('http://') || url.startsWith('https://');
  };

  const handleNavigation = useCallback((path: string, newTab: boolean = false) => {
    const urlWithTokens = buildURLWithJWTTokens(path);
    if (isExternalURL(path)) {
      if (newTab) {
        window.open(urlWithTokens, '_blank');
      } else {
        window.location.href = urlWithTokens;
      }
    } else {
      if (newTab) {
        window.open(urlWithTokens, '_blank');
      } else {
        window.location.href = urlWithTokens;
      }
    }
  }, [buildURLWithJWTTokens]);

  const handleItemClick = useCallback((item: string, path?: string) => {
    if (item === 'logout') { 
      handleLogout();
      return;
    }
    setActiveItem(item);
    setShowSearch(true);
    setMenuOpen(false);
    
    if (path) {
      handleNavigation(path);
      return;
    }
    
    const navItem = DASHBOARD_NAV_ITEMS.find(navItem => navItem.key === item);
    if (navItem) {
      if (navItem.key === 'baku-packages' || navItem.key === 'bookings') {
        setOpenDropdown(openDropdown === navItem.key ? null : navItem.key);
      } else {
        handleNavigation(navItem.path);
        setOpenDropdown(null);
      }
    } else {
      const userNavItem = USER_NAV_ITEMS.find(navItem => navItem.key === item);
      if (userNavItem) {
        handleNavigation(userNavItem.path);
      }
    }
  }, [handleNavigation, openDropdown, setShowSearch]);

  const handleLogout = useCallback(() => {
    logout();
    window.location.href = `/home`;
  }, [logout]);

  const handleUserDropdownClick = useCallback((option: { label: string; path: string; action?: string }) => {
    setUserDropdownOpen(false);
    if (option.action === 'modal') {
      setCreateUserOpen(true);
      return;
    }
    handleNavigation(option.path, true);
  }, [handleNavigation]);

  const handleDropdownItemClick = useCallback((e: React.MouseEvent, dropdownItem: { path: string; label: string }) => {
    e.stopPropagation();
    setOpenDropdown(null);
    handleNavigation(dropdownItem.path);
  }, [handleNavigation]);

  const getLogoSrc = useCallback(() => {
    if (displayLogoPath?.trim()) {
      return displayLogoPath.startsWith('http') ? displayLogoPath : `${AWS_INSTANCE}${displayLogoPath}`;
    }
    return "/fly-divine.png";
  }, [displayLogoPath]);

  // console.group('🔍 PrimaryNavbar Debug Info (Updated)');
  // console.groupEnd();

  return (
    <>
      <Box className="nav-holder">
        <nav className="primary-navbar">
          <Box className="logo">
            <img src={getLogoSrc()}  alt="Logo"  onError={(e) => { const target = e.target as HTMLImageElement; target.src = "/fly-divine.png";  }} />
            {isCompanyInfoLoading && ( <span style={{ fontSize: '12px', color: '#999', marginLeft: '8px' }}>  Loading... </span>  )}
          </Box>
          
          <Box className="nav-items">
            <Box className="trip_details">
              <span>Welcome: {userEmail}</span>
              <Box component="span"> | {displayCompanyName}</Box>
              {USER_NAV_ITEMS.map((item) => (
                <React.Fragment key={item.key}>
                  {item.key === 'user' ? (
                    <Box sx={{ position: 'relative', display: 'inline-block' }} onMouseEnter={() => setUserDropdownOpen(true)}  onMouseLeave={() => setUserDropdownOpen(false)} >
                      <Box  component="span" style={{ cursor: 'pointer', color: 'inherit', textDecoration: 'none' }}>  | {item.label} </Box>
                      {userDropdownOpen && (
                        <Box sx={{ position: 'absolute',  top: '100%', left: '50%',transform: 'translateX(-50%)',   backgroundColor: '#0369a1', color: 'black',   borderRadius: '4px',  zIndex: 1000,  minWidth: '11rem',  padding: '5px 0' }} >
                          {userDropdownOptions.map((option: { label: string; path: string; action?: string }, idx: number) => (
                            <Box  key={idx}  onClick={(e) => {  e.stopPropagation(); handleUserDropdownClick(option); }}  style={{ display: 'block',   padding: '8px 1rem',  color: 'white', textDecoration: 'none', fontSize: '14px', cursor: 'pointer',  borderBottom: idx < userDropdownOptions.length - 1 ? '1px solid #eee' : 'none'}} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0369a1'}  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'} >
                              {option.label}
                            </Box>
                          ))}
                        </Box>
                      )}
                    </Box>
                  ) : (
                    <Box  component="span"  onClick={() => handleItemClick(item.key, item.path)}style={{ cursor: 'pointer', color: 'inherit', textDecoration: 'none' }}  >  | {item.label}  </Box>
                  )}
                </React.Fragment>
              ))}
            </Box>
          </Box>
        </nav>

        <Box className="secondary-navbar">
          <Box className={`item-container ${menuOpen ? 'open' : ''}`}>
            {DASHBOARD_NAV_ITEMS.map(item => (
              <li  key={item.key}  className={`item-list ${activeItem === item.key ? 'active' : ''}`}  onClick={() => handleItemClick(item.key)}  >
                <a className={activeItem === item.key ? 'active' : ''} style={{ cursor: 'pointer', color: 'white' }}>
                  <span className="icon">
                    <img src={item.icon} alt={item.label} /> 
                  </span>
                  {item.label}
                </a>
                {(item.key === 'baku-packages' || item.key === 'bookings') && (
                  <Box className={`dropdown-menu ${openDropdown === item.key ? 'show' : ''}`}>
                    {(dropdownMenus[item.key as keyof typeof dropdownMenus] || []).map((dropdownItem: { path: string; label: string }, idx: number) => (
                      <Box key={idx} onClick={(e) => handleDropdownItemClick(e, dropdownItem)} className="dropdown-item" component="div">
                        {dropdownItem.label}
                      </Box>
                    ))}
                  </Box>
                )}
              </li>
            ))}
          </Box>

          <IconButton className={`menu-toggle ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation menu">
            <MenuIcon sx={{ color: 'white',   marginLeft: '-1rem',  height: '2rem',  width: '4rem',   marginTop: '0.4rem'  }} />
          </IconButton>
        </Box>
      </Box>
      {createUserOpen && <CreateUser onClose={() => setCreateUserOpen(false)} />}
    </>
  );
};

export default PrimaryNavbar;
