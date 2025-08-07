import { Link, useNavigate, useLocation } from 'react-router-dom';
import './PrimaryNavbar.scss';
import { DASHBOARD_NAV_ITEMS, USER_NAV_ITEMS } from '../../../../constants/routeConstants.ts';
import { Box, IconButton } from '@mui/material';
import { dropdownMenus, userDropdownOptions } from '../../../../model/selectOptions.ts';
import { Menu as MenuIcon } from '@mui/icons-material';
import { AWS_INSTANCE } from '../../../../utils/ApiConstants.ts';
import { useGetUserCompanyInfoQuery } from '../../../../api/TourAPI.tsx';
import CreateUser from '../CreateUser/CreateUser.tsx';
import React, { useEffect, useState } from 'react';

interface PrimaryNavbarProps {
  setShowSearch: (show: boolean) => void;
}

const PrimaryNavbar: React.FC<PrimaryNavbarProps> = ({ setShowSearch }) => {
  const [activeItem, setActiveItem] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('Guest');
  const [userName, setUserName] = useState<string>('User');
  const [companyName, setCompanyName] = useState<string>('');
  const [logoPath, setLogoPath] = useState<string>('');
  const navigate = useNavigate();
  const location = useLocation();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [createUserOpen, setCreateUserOpen] = useState(false);

  const getCurrentUserEmail = (): string => {
    const authData = localStorage.getItem('authData');
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        return parsed.email || '';
      } catch (e) { console.error('Error parsing authData:', e);}
    }
    return localStorage.getItem('userEmail') || localStorage.getItem('email') || '';
  };

  const { data: companyInfoData, error: companyInfoError,isLoading: isCompanyInfoLoading, refetch: refetchCompanyInfo } = useGetUserCompanyInfoQuery(getCurrentUserEmail(), { skip: !getCurrentUserEmail(), refetchOnMountOrArgChange: true });

  const handleUrlParametersAndCleanUrl = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const hasAuthParams = urlParams.has('authToken') || urlParams.has('refreshToken') || 
                          urlParams.has('userEmail') || urlParams.has('companyName') || 
                          urlParams.has('logoPath') || urlParams.has('authenticated');
    
    if (hasAuthParams) {
      const authToken = urlParams.get('authToken');
      const refreshToken = urlParams.get('refreshToken');
      const userEmail = urlParams.get('userEmail');
      const companyName = urlParams.get('companyName');
      const logoPath = urlParams.get('logoPath');
      
      if (authToken) {
        localStorage.setItem('authToken', authToken);
      }
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('authRefreshToken', refreshToken); }
      if (userEmail) {
        localStorage.setItem('userEmail', decodeURIComponent(userEmail));
        localStorage.setItem('email', decodeURIComponent(userEmail));
      }
      if (companyName) {
        localStorage.setItem('companyName', decodeURIComponent(companyName));
      }
      if (logoPath) {
        localStorage.setItem('logoPath', decodeURIComponent(logoPath));
        console.log('Logo path stored from URL parameters:', decodeURIComponent(logoPath));
      }

      const existingAuthData = localStorage.getItem('authData');
      let authDataObj = {};
      if (existingAuthData) {
        try {
          authDataObj = JSON.parse(existingAuthData);
        } catch (e) {
          console.error('Error parsing existing authData:', e);
        }
      }

      const updatedAuthData = {
        ...authDataObj,
        email: userEmail ? decodeURIComponent(userEmail) : authDataObj.email,
        companyName: companyName ? decodeURIComponent(companyName) : authDataObj.companyName,
        logoPath: logoPath ? decodeURIComponent(logoPath) : authDataObj.logoPath,
        authToken: authToken ,
        refreshToken: refreshToken ,
        timestamp: new Date().toISOString()
      };

      localStorage.setItem('authData', JSON.stringify(updatedAuthData));
      console.log('AuthData updated with URL parameters');
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
      console.log('URL cleaned, parameters removed:', cleanUrl);
    }
  };

  useEffect(() => {
    const currentPath = location.pathname;
    const dashboardItem = DASHBOARD_NAV_ITEMS.find(item => currentPath.startsWith(item.path));
    if (dashboardItem) { setActiveItem(dashboardItem.key); return;}
    const userItem = USER_NAV_ITEMS.find(item => item.path === currentPath);
    if (userItem) {setActiveItem(userItem.key);}
  }, [location.pathname]);

  useEffect(() => {
    handleUrlParametersAndCleanUrl();
  }, []);

  useEffect(() => {
    if (companyInfoData && !companyInfoError) {
      console.log('Navbar - Company info received from API:', companyInfoData);
      if (companyInfoData.companyName && companyInfoData.companyName.trim()) {
        const dbCompanyName = companyInfoData.companyName.trim();
        console.log('Setting company name from DB to:', dbCompanyName);
        setCompanyName(dbCompanyName);
        localStorage.setItem('companyName', dbCompanyName); }
      if (companyInfoData.logoPath) {
        setLogoPath(companyInfoData.logoPath);
        localStorage.setItem('logoPath', companyInfoData.logoPath);  }

    } else if (companyInfoError) {
      console.error('Navbar - Company info error, using fallback');
      const storedCompanyName = localStorage.getItem('companyName');
      if (storedCompanyName && storedCompanyName.trim()) {
        console.log('Using stored company name:', storedCompanyName);
        setCompanyName(storedCompanyName);
      } else { setCompanyName('Fly Divine');}
    }
  }, [companyInfoData, companyInfoError]);

  useEffect(() => {
    const updateUserInfo = () => {
      console.log('Navbar - Updating user info...');
      const authData = localStorage.getItem('authData');
      if (authData) {
        try {
          const parsedAuthData = JSON.parse(authData);
          const email = parsedAuthData.email || localStorage.getItem('userEmail') || 'Guest';
          setUserName('User');
          const logo = parsedAuthData.logoPath || localStorage.getItem('logoPath');
          setUserEmail(email);
          if (!companyInfoData && logo) { setLogoPath(logo);}
          return;
        } catch (e) {console.error('Navbar - Error parsing authData:', e); }
      }
      const sessionEmail = localStorage.getItem('userEmail');
      const sessionLogoPath = localStorage.getItem('logoPath');
      if (sessionEmail) {
        const email = sessionEmail || 'Guest';
        setUserEmail(email);
        setUserName('User');
        if (!companyInfoData && sessionLogoPath) { setLogoPath(sessionLogoPath);} return;
      }
      const localEmail = localStorage.getItem('username') || localStorage.getItem('email') || 'Guest';
      console.log('Navbar - Using fallback email:', localEmail);
      setUserEmail(localEmail);
      setUserName('User');
    };

    updateUserInfo();

    const handleAuthUpdate = (event?: CustomEvent) => {
      console.log('Navbar - Auth update event received:', event?.detail);
      setTimeout(() => {
        updateUserInfo();
        if (getCurrentUserEmail()) {
          refetchCompanyInfo();
        }
      }, 100);
    };

    window.addEventListener('authUpdated', handleAuthUpdate as EventListener);
    window.addEventListener('emailUpdated', handleAuthUpdate as EventListener);
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'authData' || e.key === 'userEmail' || e.key === 'userName' || 
          e.key === 'companyName' || e.key === 'logoPath') {
        console.log('Navbar - Storage changed:', e.key, e.newValue);
        updateUserInfo();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('authUpdated', handleAuthUpdate as EventListener);
      window.removeEventListener('emailUpdated', handleAuthUpdate as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [companyInfoData, refetchCompanyInfo]);

  const getJWTTokens = () => {
    return {
      sessionAuthToken: localStorage.getItem('authToken'),
      sessionRefreshToken: localStorage.getItem('authRefreshToken'),
      localAuthToken: localStorage.getItem('authToken'),
      localRefreshToken: localStorage.getItem('refreshToken'),
      sessionAuthData: localStorage.getItem('authData'),
      localAuthData: localStorage.getItem('authData'),
      email: localStorage.getItem('userEmail') || localStorage.getItem('email'),
      userName: localStorage.getItem('userName') || localStorage.getItem('username'),
      companyName: localStorage.getItem('companyName'),
      logoPath: localStorage.getItem('logoPath')
    };
  };

  const buildURLWithJWTTokensForExternal = (baseUrl: string): string => {
    const tokens = getJWTTokens();
    const url = new URL(baseUrl);
    const activeAuthToken = tokens.sessionAuthToken || tokens.localAuthToken;
    const activeRefreshToken = tokens.sessionRefreshToken || tokens.localRefreshToken;
    
    if (activeAuthToken) {
      url.searchParams.append('authToken', activeAuthToken);
      console.log('Adding authToken to external URL:', baseUrl);
    }
    if (activeRefreshToken) {
      url.searchParams.append('refreshToken', activeRefreshToken);
    }
    if (tokens.email) {
      url.searchParams.append('userEmail', tokens.email);
    }
    if (tokens.companyName) {
      url.searchParams.append('companyName', encodeURIComponent(tokens.companyName));
    }
    if (tokens.logoPath) {
      url.searchParams.append('logoPath', encodeURIComponent(tokens.logoPath));
    }
    url.searchParams.append('authenticated', activeAuthToken ? 'true' : 'false');
    
    console.log('Final external URL with JWT tokens:', url.toString());
    return url.toString();
  };

  const isExternalURL = (url: string): boolean => {
    return url.startsWith('http://') || url.startsWith('https://');
  };

  const handleNavigation = (path: string, newTab: boolean = false) => {
    if (isExternalURL(path)) {
      const urlWithTokens = buildURLWithJWTTokensForExternal(path);
      if (newTab) {
        window.open(urlWithTokens, '_blank');
      } else {
        window.location.href = urlWithTokens;
      }
    } else {
      console.log('Navigating to internal path (clean URL):', path);
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

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = `/home`;
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
    setOpenDropdown(null);
  };

  const handleCloseCreateUser = () => {
    setCreateUserOpen(false);
  };

  const handleUserDropdownClick = (option: { label: string; path: string; action?: string }) => {
    setUserDropdownOpen(false);
    
    if (option.action === 'modal') {
      setCreateUserOpen(true);
      return;
    }
    handleNavigation(option.path, true);
  };

  const handleDropdownItemClick = (e: React.MouseEvent, dropdownItem: { path: string; label: string }, parentKey: string) => {
    e.stopPropagation();
    setOpenDropdown(null);
    handleNavigation(dropdownItem.path);
  };

  const getLogoSrc = () => {
    if (logoPath && logoPath.trim()) {
      if (logoPath.startsWith('http')) {
        return logoPath;
      } else {
        return `${AWS_INSTANCE}${logoPath}`;
      }
    }
    return "/fly-divine-1.png";
  };
  
  if (isCompanyInfoLoading) {
    console.log('Navbar - Loading company info...');
  }
  if (companyInfoError) {
    console.error('Navbar - Company info error:', companyInfoError);
  }

  return (
    <>
      <Box className="nav-holder">
        <nav className="primary-navbar">
          <Box className="logo">
            <img  src={getLogoSrc()} alt={`Logo`}  onError={(e) => { const target = e.target as HTMLImageElement;  target.src = "/fly-divine-1.png"; }}  />
            {isCompanyInfoLoading && ( <span style={{ fontSize: '12px', color: '#999', marginLeft: '8px' }}> Loading... </span>)}
          </Box>
          <Box className="nav-items">
          <Box className="trip_details">
          <span>Welcome: {userEmail}</span>
          <Box component="span"> | {companyName || 'Fly Divine'}</Box>
          {USER_NAV_ITEMS.map((item, index) => (
              <React.Fragment key={item.key}>
                {item.key === 'user' ? (
                  <Box sx={{ position: 'relative', display: 'inline-block' }}  onMouseEnter={() => setUserDropdownOpen(true)}    onMouseLeave={() => setUserDropdownOpen(false)} >
                    <Box component="span"  style={{ cursor: 'pointer', color: 'inherit', textDecoration: 'none' }} > | {item.label}
                    </Box>
                    {userDropdownOpen && (
                      <Box   sx={{   position: 'absolute',   top: '100%',  left: '50%',  transform: 'translateX(-50%)', backgroundColor: '#0369a1', color: 'black',   borderRadius: '4px',   zIndex: 1000,  minWidth: '11rem',   padding: '5px 0', }} >
                        {userDropdownOptions.map((option, idx) => (
                          <Box  key={idx}   onClick={(e) => {  e.stopPropagation();  handleUserDropdownClick(option); }}
                            style={{display: 'block',  padding: '8px 1rem',  color: 'white',textDecoration: 'none', fontSize: '14px',  borderBottom: idx < userDropdownOptions.length - 1 ? '1px solid #eee' : 'none', cursor: 'pointer',  }} 
                            onMouseEnter={(e) => {    e.currentTarget.style.backgroundColor = '#0369a1'; }}   onMouseLeave={(e) => {  e.currentTarget.style.backgroundColor = 'transparent'; }} > 
                            {option.label}
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Box  component="span"  onClick={() => handleItemClick(item.key, item.path)}   style={{ cursor: 'pointer', color: 'inherit', textDecoration: 'none' }}> | {item.label}
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
              <li key={item.key} className={`item-list ${activeItem === item.key ? 'active' : ''}`} onClick={() => handleItemClick(item.key)} >
                <a className={activeItem === item.key ? 'active' : ''}   style={{ cursor: 'pointer',  color: 'white' }} >
                  <span className="icon"> <img src={item.icon} alt={item.label} /> </span>
                  {item.label}
                </a>
                {(item.key === 'baku-packages' || item.key === 'bookings') && (
                  <Box className={`dropdown-menu ${openDropdown === item.key ? 'show' : ''}`}>
                    {dropdownMenus[item.key as keyof typeof dropdownMenus].map((dropdownItem, idx) => (
                      <Box  key={idx}  onClick={(e) => handleDropdownItemClick(e, dropdownItem, item.key)}className="dropdown-item"  component="div">{dropdownItem.label}  </Box>
                    ))}
                  </Box>
                )}
              </li>
            ))}
          </Box>

          <IconButton  className={`menu-toggle ${menuOpen ? 'open' : ''}`}  onClick={toggleMenu}  aria-label="Toggle navigation menu">
            <MenuIcon sx={{  color: 'white',  marginLeft: '-1rem',  height: '2rem',  width: '4rem',  marginTop: '0.4rem' }}   />
          </IconButton>
        </Box>
      </Box>
      {createUserOpen && <CreateUser onClose={handleCloseCreateUser} />}
    </>
  );
};

export default PrimaryNavbar;