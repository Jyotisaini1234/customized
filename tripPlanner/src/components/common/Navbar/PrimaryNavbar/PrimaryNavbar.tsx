import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './PrimaryNavbar.scss';
import { DASHBOARD_NAV_ITEMS, USER_NAV_ITEMS } from '../../../../constants/routeConstants.ts';
import { Box, IconButton } from '@mui/material';
import { dropdownMenus, userDropdownOptions } from '../../../../model/selectOptions.ts';
import { Menu as MenuIcon } from '@mui/icons-material';
import { AWS_INSTANCE } from '../../../../utils/ApiConstants.ts';
import CreateUser from '../CreateUser/CreateUser.tsx';

interface PrimaryNavbarProps {
  setShowSearch: (show: boolean) => void;
}

const PrimaryNavbar: React.FC<PrimaryNavbarProps> = ({ setShowSearch }) => {
  const [activeItem, setActiveItem] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('Guest');
  const navigate = useNavigate();
  const location = useLocation();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [createUserOpen, setCreateUserOpen] = useState(false);

  useEffect(() => {
    const currentPath = location.pathname;
    const dashboardItem = DASHBOARD_NAV_ITEMS.find(item => currentPath.startsWith(item.path));
    if (dashboardItem) {
      setActiveItem(dashboardItem.key);
      return;
    }
    const userItem = USER_NAV_ITEMS.find(item => item.path === currentPath);
    if (userItem) {
      setActiveItem(userItem.key);
    }
  }, [location.pathname]);

  useEffect(() => {
    const updateEmail = () => {
      const email = localStorage.getItem('username');
      console.log("Updating email from localStorage:", email); 
      setUserEmail(email || 'Guest');
    };
    updateEmail();
    const handleEmailUpdate = () => {
      console.log("Email update event received");
      updateEmail();
    };
  
    window.addEventListener('emailUpdated', handleEmailUpdate);
    
    return () => {
      window.removeEventListener('emailUpdated', handleEmailUpdate);
    };
  }, []);
  const handleItemClick = (item: string, path?: string) => {
    if (item === 'logout') {
      handleLogout();
      return;
    }
    setActiveItem(item);
    setShowSearch(true);
    setMenuOpen(false);
    if (path) {
      navigate(path);
      return;
    }
    
    const navItem = DASHBOARD_NAV_ITEMS.find(navItem => navItem.key === item);
    if (navItem) {
      if (navItem.key === 'baku-packages' || navItem.key === 'bookings') {
        setOpenDropdown(openDropdown === navItem.key ? null : navItem.key);
      } else {
        navigate(navItem.path);
        setOpenDropdown(null);
      }
    } else {
      const userNavItem = USER_NAV_ITEMS.find(navItem => navItem.key === item);
      if (userNavItem) {
        navigate(userNavItem.path);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    window.location.href =  `${AWS_INSTANCE}/hotel`;
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
    window.location.href = option.path;
  };
  return (
    <>
    <Box className="nav-holder">
      <nav className="primary-navbar">
        <Box className="logo">
        <img src="/fly-divine-1.png" alt="U&I Logo" />
        </Box>
        <Box className="nav-items">
          <Box className="trip_details">
            <span>Welcome: {userEmail}</span>
            {USER_NAV_ITEMS.map((item, index) => (
              <React.Fragment key={item.key}>
                {item.key === 'user' ? (
                  <Box   sx={{ position: 'relative', display: 'inline-block' }}  onMouseEnter={() => setUserDropdownOpen(true)}  onMouseLeave={() => setUserDropdownOpen(false)}  >
                    <Link to={item.path} onClick={() => handleItemClick(item.key)}>   {item.label} </Link>
                    {userDropdownOpen && (
                      <Box sx={{position: 'absolute',  top: '100%', left: '50%', transform: 'translateX(-50%)',   backgroundColor: '#0369a1', color:'black', borderRadius: '4px',   zIndex: 1000,  minWidth: '11rem', padding: '5px 0',  }}>
                        {userDropdownOptions.map((option, idx) => (
                          <Box key={idx} onClick={(e) => { e.stopPropagation();  handleUserDropdownClick(option); }}
                            style={{display: 'block',   padding: '8px 1rem',  color: 'white',textDecoration: 'none',  fontSize: '14px',  borderBottom: idx < userDropdownOptions.length - 1 ? '1px solid #eee' : 'none', cursor: 'pointer'  }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#0369a1'; }}
                            onMouseLeave={(e) => {  e.currentTarget.style.backgroundColor = 'transparent'; }} >{option.label} 
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Link to={item.path} onClick={() => handleItemClick(item.key)}>  {item.label}  </Link> )}
                {index < USER_NAV_ITEMS.length - 1 && ' | '}
              </React.Fragment>
        ))}
          </Box>
        </Box>
      </nav>

      <Box className="secondary-navbar">
        <Box className={`item-container ${menuOpen ? 'open' : ''}`}>
          {DASHBOARD_NAV_ITEMS.map(item => (
            <li key={item.key}className={`item-list ${activeItem === item.key ? 'active' : ''}`}onClick={() => handleItemClick(item.key)}>
              <Link to={item.path}  className={activeItem === item.key ? 'active' : ''}>
                <span className="icon">
                  <img src={item.icon} alt={item.label} />
                </span>
                {item.label}
              </Link>
              {(item.key === 'baku-packages' || item.key === 'bookings') && 
                <Box className={`dropdown-menu ${openDropdown === item.key ? 'show' : ''}`}>
                  {dropdownMenus[item.key as keyof typeof dropdownMenus].map((dropdownItem, idx) => (
                    <Link  key={idx}  to={dropdownItem.path}
                      onClick={(e) => { e.stopPropagation();
                        handleItemClick(item.key, dropdownItem.path);}}className="dropdown-item">
                      {dropdownItem.label}
                    </Link>
                  ))}
                </Box>
              }
            </li>
          ))}
        </Box>

        <IconButton className={`menu-toggle ${menuOpen ? 'open' : ''}`} onClick={toggleMenu} aria-label="Toggle navigation menu">
          <MenuIcon  sx={{color:'white',marginLeft:'-1rem',height:'2rem', width:'4rem',marginTop:'0.4rem'}}/>
        </IconButton>
      </Box>
    </Box>
    {createUserOpen && (
        <CreateUser onClose={handleCloseCreateUser} />
      )}
    </>
  );
};
export default PrimaryNavbar;