export let country = [
{ label: 'Azerbaijan', id: 1 },
{ label:'Georgia', id :2}
];


export let citiesList = [
  { label: 'Baku', id: 1, countryId: 1 },
  { label: 'Gabala', id: 2, countryId: 1 },
  { label: 'Shahdag', id: 3, countryId: 1 },
  { label: 'Sheki', id: 4, countryId: 1 },
  { label: 'Shamakhi', id: 5, countryId: 1 },
  { label: 'Batumi', id: 6, countryId: 2 },
  { label: 'Bakuriani', id: 7, countryId: 2 },
  { label: 'Kazbegi', id: 8, countryId: 2 },
  { label: 'Kutaisi', id: 9, countryId: 2 },
  { label: 'Tbilisi', id: 10, countryId: 2 }
];

  export const dropdownMenus = {
    'baku-packages': [
      { label: 'Readymade + Customized', path: '/readymade-package' },
      { label: 'Customized', path: '/customize-package' },
    ],
    'bookings': [
      { label: 'Quotation List', path: '/my-leads' },
      { label: 'On Request Bookings', path: '/bookings/on-request' },
      { label: 'Confirmed Bookings', path: '/confirmed-booking' },
      { label: 'Cancel Bookings', path: '/cancel-booking' }
    ]
  };
  