import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import {  BASE_URL, GENERATEUID } from '../../utils/ApiConstants.ts';
import NotFoundSvg from './NotFoundSvg.tsx'; // Make sure this component exists
import React from 'react';

const NotFound = () => {
  // Function to handle login redirect
  const openLogin = () => {
    const redirectUrl = window.location.href;
    const loginRequiredUrl = `${BASE_URL}${GENERATEUID}?channel=crp&returnUrl=${redirectUrl}`;
    window.location.href = loginRequiredUrl;
  };

  return (
    <div style={{ textAlign: 'center', padding: '40px' }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="center"
        spacing={2}
        style={{ minHeight: '80vh' }}
      >
        <Grid item xs={12} md={5}>
          <Stack spacing={2}>
            <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '16px' }}>SORRY!!!</h1>
            <h2 style={{ fontSize: '2rem', marginBottom: '16px' }}>PAGE NOT FOUND</h2>
            <p style={{ fontSize: '1rem', color: '#555' }}>
              We couldn't find the page you're looking for. Try visiting the{' '}
              <a href="http://localhost:8080/authentication/login" style={{ color: '#007bff', textDecoration: 'none' }}>
               Login.com
              </a>{' '}
              Home Page.
            </p>
            <Button
              variant="contained"
              color="primary"
              onClick={openLogin}
              style={{ marginTop: '16px', padding: '10px 20px', fontSize: '1rem' }}
            >
              Log In
            </Button>
          </Stack>
        </Grid>
        <Grid item xs={12} md={7}>
          {/* Illustration or Image component */}
          <NotFoundSvg /> {/* Ensure this component is available */}
        </Grid>
      </Stack>
    </div>
  );
};

export default NotFound;
