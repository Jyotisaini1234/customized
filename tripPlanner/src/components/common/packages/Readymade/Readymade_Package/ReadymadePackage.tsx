import { Box, Container, Typography, Button, Alert, Card, CardContent, CardMedia, Chip, CircularProgress, FormControl, Grid, InputLabel, MenuItem, Rating, Select } from "@mui/material";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CustomizeSearchProps, PackageData } from "../../../../../types/types.ts";
import './ReadymadePackage.scss';
import { useGetAllPackagesQuery } from "../../../../../api/TourAPI.tsx";
import { BAKU_REQUIREMENT } from "../../../../../utils/ApiConstants.ts";

const ReadymadePackages: React.FC<{ isModifying?: boolean }> = ({ 
  isModifying = false,
}) => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ destination: 'Azerbaijan',city: 'Baku', nights: '', theme: ''});
  const {  data: allPackagesData, isLoading, error } = useGetAllPackagesQuery();
  const packages: PackageData[] = Array.isArray(allPackagesData) ? allPackagesData : [];
  const handleViewDetails = (packageData: PackageData) => { console.log('Navigating to package details:', packageData);sessionStorage.clear(); navigate(`/package-details/${packageData.id}`, { state: { packageData }}); };
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const refreshToken = params.get("refreshToken");
    const email = params.get("email");
    if (params.has("token") || params.has("refreshToken") || params.has("email")) {
      if (!token || !refreshToken || !email) {
        console.log("Incomplete auth params, redirecting to hotel");
        window.location.href = "http://b2b.flydivinetravels.com/hotel";
        return;
      }
      localStorage.setItem("token", token);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("username", email);
      window.history.replaceState({}, document.title, window.location.pathname);
      window.dispatchEvent(new CustomEvent('emailUpdated'));
    } else {
      const existingToken = localStorage.getItem("token");
      const existingRefreshToken = localStorage.getItem("refreshToken");
      const existingEmail = localStorage.getItem("username");
      if (!existingToken || !existingRefreshToken || !existingEmail) {
        console.log("No existing session found, redirecting to hotel");
        window.location.href = "http://b2b.flydivinetravels.com/hotel";
        return;
      }
    }
  }, []);
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="25rem">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading packages...</Typography>
      </Box>
    );
  }
  const handleBakuRequirement = () => {
    window.open(BAKU_REQUIREMENT, '_blank');
  };
  return (
    <Box className={`readymade-search-page ${isModifying ? 'modify-mode' : ''}`}>
      <Container sx={{ paddingLeft: '0rem', paddingRight: '0rem' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h4">Readymade Packages</Typography>
          <Button className='entry-btn' onClick={handleBakuRequirement} >Baku Entry Requirements</Button>
        </Box>
        <Box className="search-details">
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={2.5}>
              <FormControl fullWidth size="small">
                <InputLabel>Destination</InputLabel>
                <Select value={filters.destination} label="Destination" onChange={(e) => setFilters({...filters, destination: e.target.value})}>
                  <MenuItem value="Azerbaijan">Azerbaijan</MenuItem>
                  <MenuItem value="Georgia">Georgia</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2.5}>
              <FormControl fullWidth size="small">
                <InputLabel>City</InputLabel>
                <Select value={filters.city} label="City"  onChange={(e) => setFilters({...filters, city: e.target.value})} >
                  <MenuItem value="Baku">Baku</MenuItem>
                  <MenuItem value="Tbilisi">Tbilisi</MenuItem>
                  <MenuItem value="Batumi">Batumi</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2.5}>
              <FormControl fullWidth size="small">
                <InputLabel>Nights</InputLabel>
                <Select value={filters.nights}   label="Nights"  onChange={(e) => setFilters({...filters, nights: e.target.value})} >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="3">3 Nights</MenuItem>
                  <MenuItem value="4">4 Nights</MenuItem>
                  <MenuItem value="5">5 Nights</MenuItem>
                  <MenuItem value="6">6 Nights</MenuItem>
                  <MenuItem value="7">7 Nights</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2.5}>
              <FormControl fullWidth size="small">
                <InputLabel>Theme</InputLabel>
                <Select value={filters.theme} label="Theme"  onChange={(e) => setFilters({...filters, theme: e.target.value})} >
                  <MenuItem value="">All Themes</MenuItem>
                  <MenuItem value="Adventure">Adventure</MenuItem>
                  <MenuItem value="Cultural">Cultural</MenuItem>
                  <MenuItem value="Relaxation">Relaxation</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button className="search_btn">Search</Button>
            </Grid>
          </Grid>
        </Box>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error instanceof Error ? error.message : 'Error loading packages. Please try again.'}
            <br />
            <small>Check console for more details</small>
          </Alert>
        )}
        {packages.length > 0 ? (
          <Grid container spacing={3}>
            {packages.map((pkg) => {
              if (!pkg.packageDetails) {
                console.warn('Package missing packageDetails:', pkg);
                return null;
              }
              const { packageDetails } = pkg;
              const firstHotelOption = packageDetails.hotelOption?.[0] || null;
const mainHotel = firstHotelOption?.hotels?.[0] || null;

return (
<Grid item xs={12} sm={6} md={3} key={pkg.id}>
  <Card sx={{height: '100%', display: 'flex',  flexDirection: 'column', position: 'relative',   '&:hover': {  transform: 'translateY(-0.25rem)',  transition: 'transform 0.3s ease',   boxShadow: 3   }   }} >
      <Chip className="best_seller"label="BEST SELLER" sx={{position: 'absolute',  top: 8, right: 8,  zIndex: 1,backgroundColor: '#ff4444', color: 'white' }} />
      <CardMedia className="package_img"  component="img" height="200" image={ packageDetails.img|| '/placeholder-image.jpg'}  alt={packageDetails.packageName || 'Package Image'} />
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', textAlign:'center' }}>
      <Typography component="h3" sx={{   fontWeight: 'bold', mb: 1,  fontSize: '1.1rem'   }} >{packageDetails.packageName || 'Package Title'} </Typography>
      {mainHotel && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{mainHotel.name} </Typography> )}
        <Box sx={{ mt: 'auto' }}>
        <Typography  variant="h5" sx={{fontWeight: 'bold', color: '#1976d2',  mb: 0.5  }} > USD {((
          packageDetails.hotelOption?.[0]?.perPersonCost ?? 0) +(packageDetails.itinerary?.reduce((sum, day) => sum + (day.price ?? 0), 0) ?? 0)).toLocaleString()}

        </Typography>
        <Typography variant="body2"  sx={{color: '#f44336', fontWeight: 'bold', mb: 2  }}  > Regular</Typography>
        <Button className="view" fullWidth  onClick={() => handleViewDetails(pkg)} >  View Details </Button>
        </Box>
      </CardContent>
      </Card>
      </Grid>);
      })}
    </Grid>
    ) : (
    !isLoading && (
      <Box textAlign="center" py={4}>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}> No packages found.</Typography>
          <Typography variant="body2" color="text.secondary"> Please check if the API is working correctly or if there's data in the database.</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}> Debug: Raw data received - {JSON.stringify(allPackagesData)}
          </Typography>
          </Box>
          )
        )}
      </Container>
    </Box>
  );
};

export default ReadymadePackages;

