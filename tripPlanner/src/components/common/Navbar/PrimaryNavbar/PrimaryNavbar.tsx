import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './PrimaryNavbar.scss';
import { DASHBOARD_NAV_ITEMS, USER_NAV_ITEMS } from '../../../../constants/routeConstans.ts';

interface PrimaryNavbarProps {
  setShowSearch: (show: boolean) => void;
}

const PrimaryNavbar: React.FC<PrimaryNavbarProps> = ({ setShowSearch }) => {
  const [activeItem, setActiveItem] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Dropdown menus configuration
  const dropdownMenus = {
    'bali-packages': [
      { label: 'Readymade + Customized', path: '/bali-packages/readymade-customized' },
      { label: 'Customized', path: '/customize-package' }
    ],
    'bookings': [
      { label: 'Quotation List', path: '/bookings/quotation-list' },
      { label: 'On Request Bookings', path: '/bookings/on-request' },
      { label: 'Confirmed Bookings', path: '/bookings/confirmed' },
      { label: 'Cancel Bookings', path: '/bookings/cancel' }
    ]
  };
  
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
      if (navItem.key === 'bali-packages' || navItem.key === 'bookings') {
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
    // Remove JWT token from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Remove any session cookies
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    
    navigate('/');
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
    setOpenDropdown(null);
  };

  return (
    <div className="nav-holder">
      <nav className="primary-navbar">
        <div className="logo">
          <img src="https://www.uandiholidays.net/image/nelo1.png" alt="U&I Logo" />
        </div>
        <div className="nav-items">
          <div className="trip_details">
            <span>Welcome :</span>
            {USER_NAV_ITEMS.map((item, index) => (
              <React.Fragment key={item.key}>
                <Link 
                  to={item.path} 
                  onClick={() => handleItemClick(item.key)}
                >
                  {item.label}
                </Link>
                {index < USER_NAV_ITEMS.length - 1 && ' | '}
              </React.Fragment>
            ))}
          </div>
        </div>
      </nav>

      <div className="secondary-navbar">
        <div className={`iteam-container ${menuOpen ? 'open' : ''}`}>
          {DASHBOARD_NAV_ITEMS.map(item => (
            <li 
              key={item.key}
              className={`iteam-list ${activeItem === item.key ? 'active' : ''}`}
              onClick={() => handleItemClick(item.key)}
            >
              <Link 
                to={item.path} 
                className={activeItem === item.key ? 'active' : ''}
              >
                <span className="icon">
                  <img src={item.icon} alt={item.label} />
                </span>
                {item.label}
              </Link>
              
              {/* Dropdown menu for Bali Packages and My Bookings */}
              {(item.key === 'bali-packages' || item.key === 'bookings') && 
                <div className={`dropdown-menu ${openDropdown === item.key ? 'show' : ''}`}>
                  {dropdownMenus[item.key as keyof typeof dropdownMenus].map((dropdownItem, idx) => (
                    <Link 
                      key={idx} 
                      to={dropdownItem.path}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleItemClick(item.key, dropdownItem.path);
                      }}
                      className="dropdown-item"
                    >
                      {dropdownItem.label}
                    </Link>
                  ))}
                </div>
              }
            </li>
          ))}
        </div>
        
        <button 
          className={`menu-toggle ${menuOpen ? 'open' : ''}`} 
          onClick={toggleMenu}
          aria-label="Toggle navigation menu"
        >
        </button>
      </div>
    </div>
  );
};

export default PrimaryNavbar;