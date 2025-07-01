import React, { useEffect, useState } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import Customize from '../components/common/packages/Customize/Customize.tsx';
import TripPlanner from '../components/common/packages/TripPlanner/TripPlanner.tsx';
import TripPlannerArea from '../components/common/packages/TripPlannerArea/TripPlannerArea.tsx';
import MainLayout from '../pages/MainLayout/MainLayout.tsx';
import { ROUTE_CONSTANTS } from '../constants/routeConstants.ts';
import TourPackagePDF from '../components/common/packages/Customize/TripPlannerPDF/TourPackagePDF.tsx';
import MyLeads from '../components/common/BookingSection/MyLeads/MyLeads.tsx';
import ReadymadePackage from '../components/common/packages/Readymade/Readymade_Package/ReadymadePackage.tsx';
import PackageDetails from '../components/common/packages/Readymade/PackageDetails/PackageDetails.tsx';
import ReadyMadeSearch from '../components/common/packages/Readymade/EditMode/ReadymadePackageSearch/ReadyMadeSearch.tsx';
import TripPlannerReadyMade from '../components/common/packages/Readymade/EditMode/TripPlannerReadyMade/TripPlannerReadyMade.tsx';
import ConfirmedBooking from '../components/common/BookingSection/ConfirmedBooking/ConfirmedBooking.tsx';


const Router: React.FC = () => {
  return (
    <Routes>
        <Route path="/" element={<MainLayout />}>
        <Route path={ROUTE_CONSTANTS.READYMADE_PACKAGE} element={<ReadymadePackage />} />
        <Route path={ROUTE_CONSTANTS.CUSTOMIZE_PACKAGE} element={<Customize />} />
        <Route path={ROUTE_CONSTANTS.PACKAGE_DETAILS} element={<PackageDetails />} />
        <Route path={ROUTE_CONSTANTS.BOOKINGS} element={<ConfirmedBooking />} />
        <Route path={ROUTE_CONSTANTS.READYMADE_SEARCH_PLANNER} element={<TripPlannerReadyMade />} />
        <Route path={ROUTE_CONSTANTS.READYMADE_SEARCH} element={<ReadyMadeSearch />} />
        <Route path={ROUTE_CONSTANTS.TRIP_PLANNER_AREA} element={<TripPlannerArea />} />
        <Route path={ROUTE_CONSTANTS.TRIP_PLANNER} element={<TripPlanner  location={''} nights={0} checkInDate={''} checkOutDate={''} onCancel={() => { window.location.href = '/'; } } onProceed={() => { } } city={''} rooms={[]} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path={ROUTE_CONSTANTS.MY_LEADS} element={<MyLeads/>} />

      </Route>
        <Route path="/tour-package-pdf" element={<TourPackagePDF />} />
    </Routes>

  );
};

export default Router;