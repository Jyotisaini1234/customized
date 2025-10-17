import { Box, Container, Typography, Button, Card, CardContent, CardMedia, Chip, CircularProgress, FormControl, Grid, InputLabel, MenuItem, Select } from "@mui/material";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PackageData } from "../../../../../types/types.ts";
import './ReadymadePackage.scss';
import { useGetAllPackagesQuery, useGetFilteredPackagesQuery } from "../../../../../api/TourAPI.tsx";
import BakuEntryDropdown from "../../../BakuEntryDropdown/BakuEntryDropdown.tsx";

declare global {
  interface Window {
    Tawk_API: any;
    Tawk_LoadStart: Date;
  }
}

const ReadymadePackages: React.FC<{ isModifying?: boolean }> = ({ isModifying = false }) => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ destination: 'Azerbaijan', city: 'Baku', nights: '', theme: '' });
  const [isSearchTriggered, setIsSearchTriggered] = useState(false);

  useEffect(() => {
    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();

    const script = document.createElement("script");
    script.async = true;
    script.src = 'https://embed.tawk.to/68a18985b25b86192ad77f5b/1j2rg2cum';
    script.charset = 'UTF-8';
    script.setAttribute('crossorigin', '*');
    
    const firstScript = document.getElementsByTagName("script")[0];
    firstScript.parentNode?.insertBefore(script, firstScript);
  }, []);

  const { data: filteredData, isLoading: isFilteredLoading, error: filteredError } = useGetFilteredPackagesQuery({ 
      country: filters.destination,
      city: filters.city, 
      nights: filters.nights ? parseInt(filters.nights) : undefined, 
      theme: filters.theme || undefined 
    },
    { skip: !isSearchTriggered }
  );

  const { data: allData, isLoading: isAllLoading, error: allError } = useGetAllPackagesQuery();
  
  const packagesData = isSearchTriggered ? filteredData : allData;
  const isLoading = isSearchTriggered ? isFilteredLoading : isAllLoading;
  const packages: PackageData[] = Array.isArray(packagesData) ? packagesData : [];

  const handleViewDetails = (pkg: PackageData) => {
    sessionStorage.clear();
    navigate(`/package-details/${pkg.id}`, { state: { packageData: pkg } });
  };

  const handleSearch = () => setIsSearchTriggered(true);
  const handleClearFilters = () => {
    setFilters({ destination: 'Azerbaijan', city: 'Baku', nights: '', theme: '' });
    setIsSearchTriggered(false);
  };

  const handleFilterChange = (filterName: string, value: string) => {
    if (filterName === 'destination') {
      const city = value === 'Azerbaijan' ? 'Baku' : 'Tbilisi';
      setFilters(prev => ({ ...prev, destination: value, city }));
    } else {
      setFilters(prev => ({ ...prev, [filterName]: value }));
    }
    console.log('package Details',packages)
  };

  const getCities = (destination: string) => {
    const cityMap = {
      Azerbaijan: [{ value: 'Baku', label: 'Baku' }],
      Georgia: [{ value: 'Tbilisi', label: 'Tbilisi' }, { value: 'Batumi', label: 'Batumi' }]
    };
    return cityMap[destination as keyof typeof cityMap] || [];
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="25rem">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>
          {isSearchTriggered ? 'Searching packages...' : 'Loading packages...'}
        </Typography>
      </Box>
    );
  }

  const filterOptions = [
    { name: 'destination', label: 'Destination', options: [
      { value: 'Azerbaijan', label: 'Azerbaijan' },
      { value: 'Georgia', label: 'Georgia' }
    ]},
    { name: 'city', label: 'City', options: getCities(filters.destination) },
    { name: 'nights', label: 'Nights', options: [
      { value: '', label: 'All' },
      { value: '3', label: '3 Nights' },
      { value: '4', label: '4 Nights' },
      { value: '5', label: '5 Nights' },
      { value: '6', label: '6 Nights' },
      { value: '7', label: '7 Nights' }
    ]},
    { name: 'theme', label: 'Theme', options: [
      { value: '', label: 'All Themes' },
      { value: 'Adventure', label: 'Adventure' },
      { value: 'Cultural', label: 'Cultural' },
      { value: 'Relaxation', label: 'Relaxation' },
      { value: 'Family', label: 'Family' },
      { value: 'Luxury', label: 'Luxury' },
      { value: 'Beach', label: 'Beach' }
    ]}
  ];

  return (
    <Box className={`readymade-search-page ${isModifying ? 'modify-mode' : ''}`}>
      <Container sx={{ paddingLeft: '0rem', paddingRight: '0rem' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h4">Readymade Packages</Typography>
          <BakuEntryDropdown className="entry-btn" />
        </Box>

        <Box className="search-details">
          <Grid container spacing={2} alignItems="center">
            {filterOptions.map((filter, idx) => (
              <Grid item xs={12} sm={2.5} key={filter.name}>
                <FormControl fullWidth size="small">
                  <InputLabel>{filter.label}</InputLabel>
                  <Select value={filters[filter.name as keyof typeof filters]} label={filter.label} onChange={(e) => handleFilterChange(filter.name, e.target.value)}>
                    {filter.options.map((option) => (<MenuItem key={option.value} value={option.value}>{option.label} </MenuItem>))}
                  </Select>
                </FormControl>
              </Grid>
            ))}
            
            <Grid item xs={12} sm={2}>
              <Box display="flex" gap={1}>
                <Button className="search_btn" onClick={handleSearch} disabled={isLoading}> {isLoading ? 'Searching...' : 'Search'} </Button>
                {isSearchTriggered && (<Button  size="small" onClick={handleClearFilters}> Clear</Button>  )}
              </Box>
            </Grid>
          </Grid>
        </Box>

        {packages.length > 0 ? (
          <Grid container spacing={3}>
            {packages.map((pkg) => {
              if (!pkg.packageDetails) return null;
              const { packageDetails } = pkg;
              const firstHotel = packageDetails.hotelOption?.[0];
              const mainHotel = firstHotel?.hotels?.[0];
              return (
                <Grid item xs={12} sm={6} md={3} key={pkg.id}>
                  <Card className="package-card-main">
                    <Chip className="chip-bestseller" label="BEST SELLER" />
                    <CardMedia className="package_img" component="img"  height="200"  image={packageDetails.img} alt={packageDetails.packageName}/>
                    <CardContent className="package-content-main">
                      <Typography component="h3" className="package-title-main"> {packageDetails.packageName} </Typography>
                      {mainHotel && (<Typography variant="body2" color="text.secondary" className="package-hotel"> {mainHotel.name} </Typography>)}
                      <Box className="package-price-section">
                        <Typography variant="h5" className="package-price-main"> USD {(firstHotel?.totalPackageCost ?? 0).toLocaleString()}</Typography>
                        <Typography variant="body2" className="package-regular"> Regular</Typography>
                        <Button className="view" fullWidth onClick={() => handleViewDetails(pkg)}> View Details</Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        ) : (
          !isLoading && (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                {isSearchTriggered ? 'No packages found matching your search criteria.' : 'No packages found.'}
              </Typography>
            </Box>
          )
        )}
      </Container>
    </Box>
  );
};

export default ReadymadePackages;