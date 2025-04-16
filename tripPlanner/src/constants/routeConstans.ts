export const ROUTE_CONSTANTS = {
  // Public routes
  DEFAULT_PAGE: '/',
  ABOUT: '/about',
  CONTACET: '/contact',
  CAREERS: '/careers',
  SUBSCRIBE: '/subscribe',
  LOGIN_HOME_PAGE: '/login',
  LOGIN_HOME_PAGE_2: '/new-user',
  NOT_FOUND: '/404',
  
  // Protected routes (after login)
  DASHBOARD: '/dashboard',
  HOTEL_PAGE: 'http://ec2-13-203-143-204.ap-south-1.compute.amazonaws.com:3002/hotel-search',
  HOME_PAGE: '/home-page',
  BAKU_PACKAGES: '/baku-packages',
  TOURS_TRANSFERS: 'http://ec2-13-203-143-204.ap-south-1.compute.amazonaws.com:3002/transfer-search',
  BOOKINGS: '/bookings',
  CUSTOMIZE:'/customize-search',
  CUSTOMIZE_PACKAGE:'/customize-package',
  TRIP_PLANNER_AREA:'/trip-planner-area',
  TRIP_PLANNER:'/trip-planner',
  // User related routes
  USER_PROFILE: '/user',
  LOGOUT: '/',
  FLY_DIVINE_TRAVELS: '/fly-divin-travels',
  UI_TEAMS: '/u_i_teams'
};

export const PUBLIC_NAV_ITEMS = [
  {
    path: ROUTE_CONSTANTS.DEFAULT_PAGE, 
    label: "Home",
    exact: true
  },
  { 
    path: ROUTE_CONSTANTS.ABOUT, 
    label: "About Us"
  },
  { 
    path: ROUTE_CONSTANTS.CAREERS, 
    label: "Careers"
  },
  { 
    path: ROUTE_CONSTANTS.CONTACET, 
    label: "Contact Us" 
  },
  { 
    path: ROUTE_CONSTANTS.SUBSCRIBE, 
    label: "Subscribe"
  }
];
export const DASHBOARD_NAV_ITEMS = [
  {
    path: ROUTE_CONSTANTS.DASHBOARD,
    label: "Dashboard",
    icon: "https://www.uandiholidays.net/image/m1.png",
    key: 'dashboard'
  },
  {
    path: ROUTE_CONSTANTS.HOTEL_PAGE,
    label: "Hotels / Resorts",
    icon: "https://www.uandiholidays.net/image/m2.png",
    key: 'hotels-resorts'
  },
  {
    path: ROUTE_CONSTANTS.CUSTOMIZE,
    label: "Baku Packages",
    icon: "https://www.uandiholidays.net/image/m3.png",
    key: 'baku-packages'
  },
  {
    path: ROUTE_CONSTANTS.TOURS_TRANSFERS,
    label: "Tours & Transfers",
    icon: "https://www.uandiholidays.net/image/m5.png",
    key: 'tours-transfers'
  },
  {
    path: ROUTE_CONSTANTS.BOOKINGS,
    label: "My Bookings",
    icon: "https://www.uandiholidays.net/image/m6.png",
    key: 'bookings'
  }
];

export const USER_NAV_ITEMS = [
  {
    path: ROUTE_CONSTANTS.FLY_DIVINE_TRAVELS,
    label: "Fly Divine Travels",
    key: 'fly-divin-travels'
  },
  {
    path: ROUTE_CONSTANTS.UI_TEAMS,
    label: "U & I Team",
    key: 'u_i_teams'
  },
  {
    path: ROUTE_CONSTANTS.USER_PROFILE,
    label: "User",
    key: 'user'
  },
  {
    path: ROUTE_CONSTANTS.LOGOUT,
    label: "Logout",
    key: 'logout'
  }
];
export const DEFAULT_AFTER_LOGIN_PAGE = ROUTE_CONSTANTS.HOTEL_PAGE;
