import React, { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EmailIcon from '@mui/icons-material/Email';
import DownloadIcon from '@mui/icons-material/Download';
import { useGetPackageByIdQuery } from "../../../../../api/TourAPI.tsx";
import { TabPanelPropsLocal } from "../../../../../types/types.ts";
import './PackageDetails.scss';
import { Box, CircularProgress, Container, Alert, Button, Typography, IconButton, Tabs, Tab, FormControl, RadioGroup, FormControlLabel, Radio, TableContainer, Paper, Table, TableHead, TableRow, TableCell, TableBody, Rating, Card, CardContent, Grid } from "@mui/material";

function TabPanel(props: TabPanelPropsLocal) {
  const { children, value, index, ...other } = props;
  return (
    <Box role="tabpanel" hidden={value !== index}id={`package-tabpanel-${index}`}aria-labelledby={`package-tab-${index}`} {...other}>
      {value === index && <Box className="tab-panel-content">{children}</Box>}
    </Box>
  );
}

const PackageDetails: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [selectedTab, setSelectedTab] = useState<number>(0);
  const [selectedSeason, setSelectedSeason] = useState<string>('low');
  const [selectedHotel, setSelectedHotel] = useState<string>('');
  const packageDataFromState = location.state?.packageData;
  const { data: packageFromApi,  isLoading,error } = useGetPackageByIdQuery(id!, { skip: !!packageDataFromState || !id});
  const packageData = packageDataFromState || (packageFromApi?.status === 'success' ? packageFromApi.data : null);
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };
  const handleSeasonChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedSeason(event.target.value);
  };
  const handleBack = () => {
    navigate(-1);
  };

  const handleSelectAndProceed = () => {
    if (!selectedHotel) {
      alert('Please select a hotel option first');
      return;
    }
    
    const selectedOptionIndex = parseInt(selectedHotel);
    const selectedOption = packageData?.packageDetails?.hotelOption?.[selectedOptionIndex];
    
    console.log('Selected hotel option:', selectedOption);
    navigate('/booking-form', {
      state: { 
        packageData,
        selectedHotelOption: selectedOption,
        selectedOptionIndex: selectedOptionIndex
      }
    });
  };

  const getValidityText = (): string => {
    return `01-Mar-2025 till 30-Jun-2025 | 16-Sep-2025 till 19-Dec-2025 | 06-Jan-2026 till 31-Mar-2026`;
  };
  const getItineraryData = () => {
    if (!packageData?.packageDetails?.itinerary) {
      const firstHotel = packageData?.packageDetails?.hotelOption?.[0]?.hotels?.[0];
      const totalNights = firstHotel?.nights || 3;
      const destination = firstHotel?.destination || 'destination';
      
      const itineraryDays = [];

      for (let i = 1; i <= totalNights + 1; i++) {
        let title = '';
        let details = '';
      
        if (i === 1) {
          title = `Arrival in ${destination}`;
          details = `Arrive at ${destination} International Airport. Meet and greet by our local representative. Transfer to the hotel and check in. Free time to relax or explore the nearby city area on your own.`;
        } else if (i === totalNights + 1) {
          title = `Departure from ${destination}`;
          details = `Check out from the hotel and transfer to the airport for your onward journey.`;
        } else {
          title = `Explore ${destination}`;
          details = `City tour and sightseeing in ${destination}`;
        }
      
        itineraryDays.push({
          day: i,
          title: title,
          details: details
        });
      }
      
      return itineraryDays;
      
    }
    
    return packageData.packageDetails.itinerary.map((item: any, index: number) => ({
      day: index + 1,
      description: item.description || item.title || `Day ${index + 1} activities`
    }));
  };

  if (isLoading) {
    return (
      <Box className="loading-container">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container className="error-container">
        <Alert severity="error" className="error-alert">
          Error loading package details. Please try again.
        </Alert>
        <Button onClick={handleBack} startIcon={<ArrowBackIcon />} className="back-button-error">
          Go Back
        </Button>
      </Container>
    );
  }

  if (!packageData || !packageData.packageDetails) {
    return (
      <Container className="error-container">
        <Alert severity="warning" className="warning-alert"> 
          Package data not found. Please go back and try again. 
        </Alert>
        <Button onClick={handleBack} startIcon={<ArrowBackIcon />} className="back-button-error"> 
          Go Back 
        </Button>
      </Container>
    );
  }

  // Use packageDetails instead of hotelDetails
  const { packageDetails } = packageData;
  const itineraryData = getItineraryData();
  
  // Get basic package info
  const packageTitle = packageDetails.packageName || packageDetails.title || 'Package Details';
  const firstHotel = packageDetails.hotelOption?.[0]?.hotels?.[0];
  const totalNights = firstHotel?.nights || packageDetails.nights || 3;

  return (
    <Box className="package-details">
      <Box className="package-container">
        <Box className='header-section'>
        <Box className="package-header">
        <Button onClick={handleBack}  startIcon={<ArrowBackIcon />} className="back-button">  Back </Button>
          <Box className="header-content">
            <Box className="header-left">
              <Typography variant="h4" className="package-title">
                {packageTitle}
              </Typography>
              <Typography variant="subtitle1" className="package-duration">
                {totalNights} Nights / {totalNights + 1} Days
              </Typography>
            </Box>
            <Box className="header-icons">
              <IconButton className="header-icon-button">
                <EmailIcon />
              </IconButton>
              <IconButton className="header-icon-button">
                <DownloadIcon />
              </IconButton>
            </Box>
          </Box>
        </Box>
        <Box className="tabs-section">
          <Tabs value={selectedTab}  onChange={handleTabChange} className="package-tabs" variant="fullWidth"     >
            <Tab label="Package" className="package-tab" />
            <Tab label="Cost Includes" className="package-tab" />
            <Tab label="Itinerary" className="package-tab" />
            <Tab label="Other Info" className="package-tab" />
          </Tabs>
        </Box>
        <Box className="season-section">
            <FormControl component="fieldset">
              <RadioGroup row value={selectedSeason}  onChange={handleSeasonChange} className="season-radio-group" >
                <FormControlLabel value="low" control={<Radio className="season-radio" />}   label="Low Season"  className="season-option" />
                <FormControlLabel value="high"  control={<Radio className="season-radio" />}  label="High Season"  className="season-option"/>
              </RadioGroup>
            </FormControl>
            <Box className="package-tab-content">
              <Typography variant="body1" className="note-text">*Note: The below rates are based on per Adult/Child & are quoted in USD  </Typography>
              
              <Typography variant="body1" className="modify-text"> Get final cost or modify you preferred readymade option by{' '}
                <Button variant="text" className="modify-link"> clicking here →</Button>
              </Typography>
              </Box>

            <Typography variant="body2" className="validity-text"> <strong>Validity:</strong> {getValidityText()}</Typography>
          </Box>
          </Box>

        <TabPanel value={selectedTab} index={0}>
          <Box className="content-area">
            <Box className="proceed-section">
              <Button onClick={handleSelectAndProceed}  disabled={!selectedHotel}  className="proceed-button"> 
                Select Option & Proceed
              </Button>
            </Box>
            
            {packageDetails?.hotelOption?.map((option: any, optionIndex: number) => (
              <Box key={optionIndex} className="hotel-option-set" sx={{ mb: 4 }}>
                <TableContainer component={Paper} className="hotel-table-container">
                  <Table className="hotel-table">
                    <TableHead className="table-header">
                      <TableRow>
                        <TableCell className="table-header-cell" sx={{ width: '60px', textAlign: 'center' }}>Select</TableCell>
                        <TableCell className="table-header-cell" sx={{ width: '200px' }}>Hotel</TableCell>
                        <TableCell className="table-header-cell" sx={{ width: '100px' }}>Area</TableCell>
                        <TableCell className="table-header-cell" sx={{ width: '80px' }}>Star</TableCell>
                        <TableCell className="table-header-cell" sx={{ width: '80px' }}>Nights</TableCell>
                        <TableCell className="table-header-cell" sx={{ width: '120px' }}>Room</TableCell>
                        <TableCell className="table-header-cell" sx={{ width: '100px' }}>Adult</TableCell>
                        <TableCell className="table-header-cell" sx={{ width: '100px' }}>CWB</TableCell>
                        <TableCell className="table-header-cell" sx={{ width: '100px' }}>CNB</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {option.hotels?.map((hotel: any, hotelIndex: number) => (
                        <TableRow key={hotelIndex} className="table-row">
                          <TableCell className="table-cell" sx={{ textAlign: 'center', verticalAlign: 'middle' }}>
                            {hotelIndex === 0 && (
                              <Radio 
                                checked={selectedHotel === optionIndex.toString()} 
                                onChange={() => setSelectedHotel(optionIndex.toString())}
                                value={optionIndex.toString()} 
                                className="hotel-radio" 
                                size="small"
                              />
                            )}
                          </TableCell>
                          <TableCell className="table-cell" sx={{ 
                            maxWidth: '200px', 
                            wordWrap: 'break-word',
                            whiteSpace: 'normal',
                            lineHeight: '1.4'
                          }}>
                            {hotel.name}
                          </TableCell>
                          <TableCell className="table-cell">{hotel.destination}</TableCell>
                          <TableCell className="table-cell">
                            <Rating value={hotel.star || 0} readOnly size="small" className="hotel-rating"/>
                          </TableCell>
                          <TableCell className="table-cell">{hotel.nights}</TableCell>
                          <TableCell className="table-cell" sx={{ 
                            maxWidth: '120px', 
                            wordWrap: 'break-word',
                            whiteSpace: 'normal',
                            lineHeight: '1.4'
                          }}>
                            {hotel.roomType}
                          </TableCell>
                          <TableCell className="table-cell" sx={{ textAlign: 'center' }}>
                            {hotelIndex === 0 ? `USD ${option.perPersonCost}` : ''}
                          </TableCell>
                          <TableCell className="table-cell" sx={{ textAlign: 'center' }}>
                            {hotelIndex === 0 ? `USD ${option.cwbCost}` : ''}
                          </TableCell>
                          <TableCell className="table-cell" sx={{ textAlign: 'center' }}>
                            {hotelIndex === 0 ? `USD ${option.cnbCost}` : ''}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            ))}
          </Box>
        </TabPanel>

          <TabPanel value={selectedTab} index={1}>
            <Box className="includes-tab-content">
              <Typography variant="h6" className="section-title"> Package Includes: </Typography>
              <ul className="includes-list">
                {packageDetails.inclusions ? 
                  packageDetails.inclusions.map((inclusion: string, index: number) => (
                    <li key={index}>{inclusion}</li>
                  )) :
                  <>
                    <li>{totalNights} nights accommodation in selected hotel</li>
                    <li>Daily breakfast</li>
                    <li>Airport transfers</li>
                    <li>City tour as per itinerary</li>
                    <li>All taxes and service charges</li>
                  </>
                }
              </ul>
              
              <Typography variant="h6" className="section-title excludes-title"> Package Excludes: </Typography>
              <ul className="includes-list">
                {packageDetails.exclusions ? 
                  packageDetails.exclusions.map((exclusion: string, index: number) => (
                    <li key={index}>{exclusion}</li>
                  )) :
                  <>
                    <li>International flights</li>
                    <li>Visa fees</li>
                    <li>Personal expenses</li>
                    <li>Travel insurance</li>
                  </>
                }
              </ul>
            </Box>
          </TabPanel>

          <TabPanel value={selectedTab} index={2}>
            <div className="itinerary-tab-content">
              <Typography variant="h6" className="section-title"> 
                {totalNights + 1} Days Itinerary
              </Typography>
              
              {itineraryData.map((dayData: any, index: number) => (
                <Card key={index} className="itinerary-card">
                  <CardContent>
                    <Typography variant="h6" className="day-title"> 
                      Day {dayData.day} : {dayData.description}
                    </Typography>
                    <Typography variant="body1" className="day-description">
                      {itineraryData.details}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabPanel>

          <TabPanel value={selectedTab} index={3}>
            <div className="info-tab-content">
              <Typography variant="h6" className="section-title">  Important Information: </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card className="info-card">
                    <CardContent>
                      <Typography variant="subtitle1" className="info-card-title"> Booking Terms: </Typography>
                      <ul className="info-list">
                        <li>Advance booking required</li>
                        <li>Subject to availability</li>
                        <li>Cancellation charges apply</li>
                      </ul>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card className="info-card">
                    <CardContent>
                      <Typography variant="subtitle1" className="info-card-title">  Travel Requirements:  </Typography>
                      <ul className="info-list">
                        <li>Valid passport required</li>
                        <li>Visa may be required</li>
                        <li>Travel insurance recommended</li>
                      </ul>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </div>
          </TabPanel>
        </Box>
      </Box>
  );
};

export default PackageDetails;


