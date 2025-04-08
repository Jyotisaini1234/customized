// import React from 'react';
// import { Route, Routes, Navigate } from 'react-router-dom';
// import Customize from '../components/common/packages/Customize/Customize.tsx';
// import TripPlanner from '../components/common/packages/TripPlanner/TripPlanner.tsx';
// import TripPlannerArea from '../components/common/packages/TripPlannerArea/TripPlannerArea.tsx';
// import MainLayout from '../pages/MainLayout/MainLayout.tsx';
// import { ROUTE_CONSTANTS } from '../constants/routeConstans.ts';

// const Router: React.FC = () => {

//   return (
//     <Routes>
//     <Route path="/" element={<MainLayout />}>
//     <Route  path={ROUTE_CONSTANTS.CUSTOMIZE_PACKAGE} element={<Customize />} />
//     <Route path={ROUTE_CONSTANTS.TRIP_PLANNER_AREA} element={<TripPlannerArea />} />
//     <Route path={ROUTE_CONSTANTS.TRIP_PLANNER} 
//       element={<TripPlanner 
//         location={''} 
//         nights={0} 
//         checkInDate={''} 
//         checkOutDate={''} 
//         onCancel={() => navigate('/')} 
//         onProceed={() => {/* Handle proceed logic */}} 
//       />} 
//     /></Route>
//   </Routes>
//   );
// };

// export default Router;


import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import Customize from '../components/common/packages/Customize/Customize.tsx';
import TripPlanner from '../components/common/packages/TripPlanner/TripPlanner.tsx';
import TripPlannerArea from '../components/common/packages/TripPlannerArea/TripPlannerArea.tsx';
import MainLayout from '../pages/MainLayout/MainLayout.tsx';
import { ROUTE_CONSTANTS } from '../constants/routeConstans.ts';

const Router: React.FC = () => {
  // You can't use useNavigate() here as it's a route definition component

  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route path={ROUTE_CONSTANTS.CUSTOMIZE_PACKAGE} element={<Customize />} />
        <Route path={ROUTE_CONSTANTS.TRIP_PLANNER_AREA} element={<TripPlannerArea />} />
        <Route path={ROUTE_CONSTANTS.TRIP_PLANNER} element={
          <TripPlanner  location={''} nights={0} 
            checkInDate={''} checkOutDate={''}  onCancel={() => { window.location.href = '/';}}   onProceed={() => {
            }} 
          />
        } />
        {/* Add a catch-all redirect for API paths or unsupported routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

export default Router;