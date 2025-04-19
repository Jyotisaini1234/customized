import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import Customize from '../components/common/packages/Customize/Customize.tsx';
import TripPlanner from '../components/common/packages/TripPlanner/TripPlanner.tsx';
import TripPlannerArea from '../components/common/packages/TripPlannerArea/TripPlannerArea.tsx';
import MainLayout from '../pages/MainLayout/MainLayout.tsx';
import { ROUTE_CONSTANTS } from '../constants/routeConstans.ts';
import TourPackagePDF from '../components/common/TripPlannerPDF/TourPackagePDF.tsx';

const Router: React.FC = () => {

  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route path={ROUTE_CONSTANTS.CUSTOMIZE_PACKAGE} element={<Customize />} />
        <Route path={ROUTE_CONSTANTS.TRIP_PLANNER_AREA} element={<TripPlannerArea />} />
        <Route path={ROUTE_CONSTANTS.TRIP_PLANNER} element={<TripPlanner  location={''} nights={0} 
            checkInDate={''} checkOutDate={''}  onCancel={() => { window.location.href = '/';}}   onProceed={() => {}} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/tour-package-pdf" element={<TourPackagePDF />} />
      </Route>
    </Routes>
  );
};

export default Router;