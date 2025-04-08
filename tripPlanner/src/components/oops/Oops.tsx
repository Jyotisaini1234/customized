import { Box, Typography } from '@mui/material';

const Oops = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        height: '100vh', // Full viewport height
        backgroundColor: '#f8d7da', // Light red background
        padding: 2,
        borderRadius: 2,
        boxShadow: 2,
        width:'100%',
      }}
    >
      <Typography variant="h4" color="error">
        Oops!
      </Typography>
      <Typography variant="body1" color="textSecondary">
        Something went wrong. Please try again later.
      </Typography>
    </Box>
  );
};

  export  {Oops};
