import React from 'react';
import { CircularProgress, Box, Typography } from '@mui/material';

// Define the expected props type for the Loader component
interface LoaderProps {
  oMessage?: string;  // Optional message prop
}

const Loader: React.FC<LoaderProps> = ({ oMessage }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh', // Full viewport height
        flexDirection: 'column',  // Stack the message and spinner vertically
      }}
    >
      <CircularProgress /> {/* Material-UI spinner */}
      {oMessage && <Typography variant="h6" sx={{ marginTop: 2 }}>{oMessage}</Typography>}
    </Box>
  );
};

export default Loader;
