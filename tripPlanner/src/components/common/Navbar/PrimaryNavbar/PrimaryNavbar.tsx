import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './PrimaryNavbar.scss';
import { DASHBOARD_NAV_ITEMS, USER_NAV_ITEMS } from '../../../../constants/routeConstants.ts';
import { Box, IconButton } from '@mui/material';
import { dropdownMenus, userDropdownOptions } from '../../../../model/selectOptions.ts';
import { Menu as MenuIcon } from '@mui/icons-material';
import { AWS_INSTANCE } from '../../../../utils/ApiConstants.ts';
import { useGetUserCompanyInfoQuery } from '../../../../api/TourAPI.tsx';
import CreateUser from '../CreateUser/CreateUser.tsx';
import {  STORES,  initDB, getAuthData, saveAuthData } from '../../../../utils/TripPlannerDB.ts';

interface PrimaryNavbarProps {
  setShowSearch: (show: boolean) => void;
}

interface AuthData {
  email?: string;
  companyName?: string;
  logoPath?: string;
  authToken?: string;
  refreshToken?: string;
  username?: string;
  timestamp?: string;
}

const PrimaryNavbar: React.FC<PrimaryNavbarProps> = ({ setShowSearch }) => {
  const [activeItem, setActiveItem] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('Guest');
  const [companyName, setCompanyName] = useState<string>('');
  const [logoPath, setLogoPath] = useState<string>('');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [createUserOpen, setCreateUserOpen] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  const { data: companyInfoData, error: companyInfoError, isLoading: isCompanyInfoLoading } = useGetUserCompanyInfoQuery(userEmail, { skip: !userEmail || userEmail === 'Guest', refetchOnMountOrArgChange: true });
  const convertIndexedDBObjectToString = (data: any): string => {
    if (!data) return '';
    if (typeof data === 'string') return data;
    
    if (typeof data === 'object' && data !== null) {
      const keys = Object.keys(data).filter(key => !isNaN(Number(key)));
      if (keys.length > 0) {
        const sortedKeys = keys.sort((a, b) => Number(a) - Number(b));
        return sortedKeys.map(key => data[key]).join('');
      }
      if (data.value && typeof data.value === 'string') return data.value;
    }
    
    return String(data);
  };

const handleUrlParametersAndCleanUrl = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const paramKeys = ['authToken', 'refreshToken', 'userEmail', 'companyName', 'logoPath', 'username'];
    const hasAuthParams = paramKeys.some(key => urlParams.has(key));
    
    if (hasAuthParams) {
      console.log('URL Parameters found, processing...');
      const existingAuthData = await getAuthData('authData', {}) as AuthData;
      const urlEmail = urlParams.get('userEmail');
      const urlCompanyName = urlParams.get('companyName');
      const urlLogoPath = urlParams.get('logoPath');
      const urlUsername = urlParams.get('username');
      const urlAuthToken = urlParams.get('authToken');
      const urlRefreshToken = urlParams.get('refreshToken');
      const updatedAuthData: AuthData = {
        ...existingAuthData,
        email: urlEmail ? decodeURIComponent(urlEmail) : existingAuthData.email,
        companyName: urlCompanyName ? decodeURIComponent(urlCompanyName) : existingAuthData.companyName,
        logoPath: urlLogoPath ? decodeURIComponent(urlLogoPath) : existingAuthData.logoPath,
        username: urlUsername ? decodeURIComponent(urlUsername) : existingAuthData.username,
        authToken: urlAuthToken || existingAuthData.authToken,
        refreshToken: urlRefreshToken || existingAuthData.refreshToken,
        timestamp: new Date().toISOString()
      };
      
      console.log('Updated Auth Data to store:', updatedAuthData);
      
      // Store all the data
      await saveAuthData('authData', updatedAuthData);
      
      // Also store individual fields for backward compatibility
      if (updatedAuthData.email) {
        await saveAuthData('userEmail', updatedAuthData.email);
        await saveAuthData('email', updatedAuthData.email);
      }
      if (updatedAuthData.companyName) {
        await saveAuthData('companyName', updatedAuthData.companyName);
      }
      if (updatedAuthData.logoPath) {
        await saveAuthData('logoPath', updatedAuthData.logoPath);
      }
      if (updatedAuthData.username) {
        await saveAuthData('username', updatedAuthData.username);
      }
      if (updatedAuthData.authToken) {
        await saveAuthData('authToken', updatedAuthData.authToken);
        await saveAuthData('jwtToken', updatedAuthData.authToken);
      }
      if (updatedAuthData.refreshToken) {
        await saveAuthData('refreshToken', updatedAuthData.refreshToken);
      }
      
      console.log('All data stored successfully');
      
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
      console.log('URL cleaned');
    }
  };
  
  const getUserDataFromStorage = async () => {
    try {
      console.log('=== Getting User Data From Storage ===');
      let authData = await getAuthData('authData', {}) as AuthData;
      console.log('Retrieved authData:', authData);
      let email = convertIndexedDBObjectToString(authData.email || await getAuthData('userEmail', '') || await getAuthData('email', ''));
      let company = convertIndexedDBObjectToString(authData.companyName || await getAuthData('companyName', ''));
      let logo = convertIndexedDBObjectToString(authData.logoPath || await getAuthData('logoPath', ''));
      let username = convertIndexedDBObjectToString(authData.username || await getAuthData('username', ''));
      let jwtToken = authData.authToken || await getAuthData('authToken', '') || await getAuthData('jwtToken', '');
      let refreshToken = authData.refreshToken || await getAuthData('refreshToken', '');
      
      console.log('Extracted data:', {
        email,
        company,
        logo,
        username,
        hasJWT: !!jwtToken,
        hasRefresh: !!refreshToken
      });
      
      // If we have JWT token but missing username, try to extract it
      if (jwtToken && typeof jwtToken === 'string' && (!username || username.trim() === '')) {
        try {
          const parts = jwtToken.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            const extractedUsername = payload.sub || payload.username || payload.name || payload.preferred_username || payload.given_name || null;
            if (extractedUsername && typeof extractedUsername === 'string') {
              username = extractedUsername;
              console.log('Username extracted from JWT:', username);
              
              // Store the extracted username
              await saveAuthData('username', username);
              
              // Update consolidated auth data
              const updatedAuthData = {
                ...authData,
                username: username,
                timestamp: new Date().toISOString()
              };
              await saveAuthData('authData', updatedAuthData);
            }
          }
        } catch (jwtError) {
          console.error('Error extracting username from JWT:', jwtError);
        }
      }
      
      return { 
        email: email.trim(), 
        company: company.trim(), 
        logo: logo.trim(), 
        username: username.trim(), 
        jwtToken, 
        refreshToken 
      };
      
    } catch (error) {
      console.error('Error getting user data:', error);
      return { email: '', company: '', logo: '', username: '', jwtToken: '', refreshToken: '' };
    }
  };
  
  const updateUserInfo = async () => {
    console.log('=== Updating User Info ===');
    const { email, company, logo, username } = await getUserDataFromStorage();
    
    console.log('Retrieved user info:', { email, company, logo, username });
    
    if (email && email !== 'Guest' && email !== '') {
      setUserEmail(email);
      console.log('Set userEmail to:', email);
    } else if (username && username !== 'Guest' && username !== '') {
      setUserEmail(username);
      console.log('Set userEmail to username:', username);
    }
    
    if (company && company !== '') {
      setCompanyName(company);
      console.log('Set companyName to:', company);
    }
    
    if (logo && logo !== '' && !companyInfoData) {
      setLogoPath(logo);
      console.log('Set logoPath to:', logo);
    }
  };

  useEffect(() => {
    const currentPath = location.pathname;
    const dashboardItem = DASHBOARD_NAV_ITEMS.find(item => currentPath.startsWith(item.path));
    const userItem = USER_NAV_ITEMS.find(item => item.path === currentPath);
    
    setActiveItem(dashboardItem?.key || userItem?.key || '');
  }, [location.pathname]);

  useEffect(() => {
    const initializeData = async () => {
      await handleUrlParametersAndCleanUrl();
      await updateUserInfo();
    };
    
    initializeData();
    
    const handleAuthUpdate = () => setTimeout(updateUserInfo, 100);
    
    ['authUpdated', 'emailUpdated'].forEach(event => {
      window.addEventListener(event, handleAuthUpdate);
    });
    
    return () => {
      ['authUpdated', 'emailUpdated'].forEach(event => {
        window.removeEventListener(event, handleAuthUpdate);
      });
    };
  }, [companyInfoData, location.pathname]);

  const getJWTTokens = async () => {
    const { email, company, logo, jwtToken, refreshToken, username } = await getUserDataFromStorage();
    return { authToken: jwtToken, refreshToken, email, companyName: company, logoPath: logo, username };
  };

  const buildURLWithJWTTokensForExternal = async (baseUrl: string): Promise<string> => {
    const tokens = await getJWTTokens();
    const url = new URL(baseUrl);
    
    const params = {
      authToken: tokens.authToken,
      refreshToken: tokens.refreshToken,
      userEmail: tokens.email,
      companyName: tokens.companyName,
      logoPath: tokens.logoPath,
      username: tokens.username,
      authenticated: tokens.authToken ? 'true' : 'false'
    };

    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        url.searchParams.append(key, key.includes('Name') || key.includes('Path') ? encodeURIComponent(value) : value);
      }
    });
    
    return url.toString();
  };

  const isExternalURL = (url: string): boolean => {
    return url.startsWith('http://') || url.startsWith('https://');
  };

  const handleNavigation = async (path: string, newTab: boolean = false) => {
    if (isExternalURL(path)) {
      const urlWithTokens = await buildURLWithJWTTokensForExternal(path);
      if (newTab) {
        window.open(urlWithTokens, '_blank');
      } else {
        window.location.href = urlWithTokens;
      }
    } else {
      navigate(path);
    }
  };

  const handleItemClick = (item: string, path?: string) => {
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
  };

  const handleLogout = async () => {
    const stores = Object.values(STORES);
    for (const store of stores) {
      try {
        const db = await initDB();
        const transaction = db.transaction([store], 'readwrite');
        const objectStore = transaction.objectStore(store);
        objectStore.clear();
      } catch (e) {
        console.error(`Error clearing ${store}:`, e);
      }
    }
    window.location.href = `/home`;
  };

  const handleUserDropdownClick = (option: { label: string; path: string; action?: string }) => {
    setUserDropdownOpen(false);
    if (option.action === 'modal') {
      setCreateUserOpen(true);
      return;
    }
    handleNavigation(option.path, true);
  };

  const handleDropdownItemClick = (e: React.MouseEvent, dropdownItem: { path: string; label: string }) => {
    e.stopPropagation();
    setOpenDropdown(null);
    handleNavigation(dropdownItem.path);
  };

  const getLogoSrc = () => {
    if (logoPath?.trim()) {
      return logoPath.startsWith('http') ? logoPath : `${AWS_INSTANCE}${logoPath}`;
    }
    return "/fly-divine.png";
  };

  return (
    <>
      <Box className="nav-holder">
        <nav className="primary-navbar">
          <Box className="logo">
            <img 
              src={getLogoSrc()} 
              alt="Logo" 
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/fly-divine.png";
              }} 
            />
            {isCompanyInfoLoading && (
              <span style={{ fontSize: '12px', color: '#999', marginLeft: '8px' }}>
                Loading...
              </span>
            )}
          </Box>
          
          <Box className="nav-items">
            <Box className="trip_details">
              <span>Welcome: {userEmail}</span>
              <Box component="span"> | {companyName}</Box>
              {USER_NAV_ITEMS.map((item) => (
                <React.Fragment key={item.key}>
                  {item.key === 'user' ? (
                    <Box 
                      sx={{ position: 'relative', display: 'inline-block' }}
                      onMouseEnter={() => setUserDropdownOpen(true)}
                      onMouseLeave={() => setUserDropdownOpen(false)}
                    >
                      <Box 
                        component="span" 
                        style={{ cursor: 'pointer', color: 'inherit', textDecoration: 'none' }}
                      >
                        | {item.label}
                      </Box>
                      {userDropdownOpen && (
                        <Box sx={{
                          position: 'absolute',
                          top: '100%',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          backgroundColor: '#0369a1',
                          color: 'black',
                          borderRadius: '4px',
                          zIndex: 1000,
                          minWidth: '11rem',
                          padding: '5px 0'
                        }}>
                          {userDropdownOptions.map((option: { label: string; path: string; action?: string }, idx: number) => (
                            <Box 
                              key={idx} 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUserDropdownClick(option);
                              }}
                              style={{
                                display: 'block',
                                padding: '8px 1rem',
                                color: 'white',
                                textDecoration: 'none',
                                fontSize: '14px',
                                cursor: 'pointer',
                                borderBottom: idx < userDropdownOptions.length - 1 ? '1px solid #eee' : 'none'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0369a1'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              {option.label}
                            </Box>
                          ))}
                        </Box>
                      )}
                    </Box>
                  ) : (
                    <Box 
                      component="span"
                      onClick={() => handleItemClick(item.key, item.path)}
                      style={{ cursor: 'pointer', color: 'inherit', textDecoration: 'none' }}
                    >
                      | {item.label}
                    </Box>
                  )}
                </React.Fragment>
              ))}
            </Box>
          </Box>
        </nav>

        <Box className="secondary-navbar">
          <Box className={`item-container ${menuOpen ? 'open' : ''}`}>
            {DASHBOARD_NAV_ITEMS.map(item => (
              <li 
                key={item.key} 
                className={`item-list ${activeItem === item.key ? 'active' : ''}`}
                onClick={() => handleItemClick(item.key)}
              >
                <a 
                  className={activeItem === item.key ? 'active' : ''}
                  style={{ cursor: 'pointer', color: 'white' }}
                >
                  <span className="icon">
                    <img src={item.icon} alt={item.label} />
                  </span>
                  {item.label}
                </a>
                {(item.key === 'baku-packages' || item.key === 'bookings') && (
                  <Box className={`dropdown-menu ${openDropdown === item.key ? 'show' : ''}`}>
                    {(dropdownMenus[item.key as keyof typeof dropdownMenus] || []).map((dropdownItem: { path: string; label: string }, idx: number) => (
                      <Box 
                        key={idx}
                        onClick={(e) => handleDropdownItemClick(e, dropdownItem)}
                        className="dropdown-item"
                        component="div"
                      >
                        {dropdownItem.label}
                      </Box>
                    ))}
                  </Box>
                )}
              </li>
            ))}
          </Box>

          <IconButton 
            className={`menu-toggle ${menuOpen ? 'open' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation menu"
          >
            <MenuIcon sx={{ 
              color: 'white', 
              marginLeft: '-1rem', 
              height: '2rem', 
              width: '4rem', 
              marginTop: '0.4rem'
            }} />
          </IconButton>
        </Box>
      </Box>
      
      {createUserOpen && <CreateUser onClose={() => setCreateUserOpen(false)} />}
    </>
  );
};

export default PrimaryNavbar;

