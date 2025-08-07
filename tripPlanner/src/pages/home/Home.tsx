import React from 'react';
import LoginForm from '../LoginForm/LoginForm.tsx';
import "./Home.scss";
const Home: React.FC = () => {
  return (
    <div className="container" id="Container">
      <div className='logo'></div>
      <LoginForm />
      <div className="message">
      </div>
    </div>
  );
};
export default Home;