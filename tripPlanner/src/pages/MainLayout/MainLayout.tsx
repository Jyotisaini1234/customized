import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import PrimaryNavbar from '../../components/common/Navbar/PrimaryNavbar/PrimaryNavbar.tsx';
import './MainLayout.scss';
const MainLayout: React.FC = () => {
  const [showSearch, setShowSearch] = useState(true);
  
  return (
    <div className="app-container">
      <PrimaryNavbar setShowSearch={setShowSearch} />
      <Outlet /> 
    </div>
  );
};

export default MainLayout;