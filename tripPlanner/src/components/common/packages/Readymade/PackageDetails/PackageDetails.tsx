import React, { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {Button, Typography, IconButton, Tabs, Tab, FormControl, RadioGroup, FormControlLabel, Radio, TableContainer, Paper, Table, TableHead, TableRow, TableCell, TableBody, Rating, Card, CardContent, Grid, Alert, Box, CircularProgress, Container } from "@mui/material";
import { useGetPackageByIdQuery } from "../../../../../api/TourAPI.tsx";
import './PackageDetails.scss';
import PackagePDFGenerator from "../PackagePDFGenerator/PackagePDFGenerator.tsx";
import { TabPanelPropsLocal } from "../../../../../types/package.types.ts";
import { ItineraryItem } from "../../../../../types/tour.types.ts";

function TabPanel(props: TabPanelPropsLocal) {
  const { children, value, index, ...other } = props;
  return (
    <Box role="tabpanel" hidden={value !== index} id={`package-tabpanel-${index}`} aria-labelledby={`package-tab-${index}`} {...other}> {value === index && <Box className="tab-panel-content">{children}</Box>}</Box>
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
  const { data: packageFromApi, isLoading, error } = useGetPackageByIdQuery(id!, { skip: !!packageDataFromState || !id });
  const packageData = packageDataFromState || (packageFromApi?.status === 'success' ? packageFromApi.data : null);
  const [generatePdf, setGeneratePdf] = useState(false);
  const [showPDFGenerator, setShowPDFGenerator] = useState(false);
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => { setSelectedTab(newValue);};
  const handleSeasonChange = (event: React.ChangeEvent<HTMLInputElement>) => { setSelectedSeason(event.target.value);};
  const handleBack = () => { navigate(-1); };

  const getValidityText = (): string => { return `01-Mar-2025 till 30-Jun-2025 | 16-Sep-2025 till 19-Dec-2025 | 06-Jan-2026 till 31-Mar-2026`;};
const transformPackageDataForPDF = (includeAllOptions: boolean = false) => {
    if (!packageData || !packageData.packageDetails) return null;
    const { packageDetails } = packageData;
    
    if (includeAllOptions) {
      return packageDetails.hotelOption?.map((option, optionIndex) => {
        const selectedHotels = option.hotels || [];
        return {
          optionIndex: optionIndex,
          optionName: `Hotel Option ${optionIndex + 1}`,
          tripDetails: {
            country: packageDetails.country,
            nights: selectedHotels.reduce((total, hotel) => total + (hotel.nights || 0), 0),
            destination: packageDetails.destinations?.join(', ') || 'Unknown'
          },
          planner_items: packageDetails.itinerary?.map((item, index) => {
            const dayHotel = selectedHotels.find(hotel => 
              item.title?.toLowerCase().includes(hotel.destination?.toLowerCase())
            ) || selectedHotels[Math.min(index, selectedHotels.length - 1)];
            
            return {
              dayNumber: item.day,
              date: item.date,
              itinerary: {
                title: item.title,
                details: item.details
              },
              hotel: dayHotel
            };
          }) || [],
          hotels: selectedHotels,
          transfers: packageDetails.transfers || [],
          activities: packageDetails.activity || [],
          pricing: {
            grandTotal: option.totalPackageCost || 0,
            perPersonCost: option.perPersonCost || 0,
            cwbCost: option.cwbCost || 0,
            cnbCost: option.cnbCost || 0
          },
          packageData: {
            originalPackageData: {
              destinations: packageDetails.destinations,
              tripDetails: {
                rooms: [{
                  adults: packageDetails.passengers?.adult || 2,
                  cwb: packageDetails.passengers?.child || 0,
                  cnb: 0,
                  infants: packageDetails.passengers?.infant || 0
                }]
              },
              validity: packageDetails.validity,
              inclusions: packageDetails.inclusions,
              exclusions: packageDetails.exclusions,
              importantNotes: packageDetails.importantNotes,
              cancellationPolicy: packageDetails.cancellationPolicy,
              selectedHotelOption: option,
              allHotelsInOption: selectedHotels,
              transfers: packageDetails.transfers || [],
              activities: packageDetails.activity || []
            }
          }
        };
      }) || [];
    }
    
    const selectedOptionIndex = selectedHotel ? parseInt(selectedHotel) : 0;
    const selectedHotelOption = packageDetails.hotelOption?.[selectedOptionIndex];
    if (!selectedHotelOption) return null;
    const allHotelsInSelectedOption = selectedHotelOption.hotels || [];
    
    const transformedData = {
      tripDetails: {
        country: packageDetails.country,
        nights: allHotelsInSelectedOption.reduce((total, hotel) => total + (hotel.nights || 0), 0),
        destination: packageDetails.destinations?.join(', ') || 'Unknown'
      },
      planner_items: packageDetails.itinerary?.map((item, index) => {
        const dayHotel = allHotelsInSelectedOption.find(hotel => 
          item.title?.toLowerCase().includes(hotel.destination?.toLowerCase())
        ) || allHotelsInSelectedOption[Math.min(index, allHotelsInSelectedOption.length - 1)];
        
        return {
          dayNumber: item.day,
          date: item.date,
          itinerary: {
            title: item.title,
            details: item.details
          },
          hotel: dayHotel
        };
      }) || [],
      hotels: allHotelsInSelectedOption,
      transfers: packageDetails.transfers || [],
      activities: packageDetails.activity || [],
      pricing: {
        grandTotal: selectedHotelOption.totalPackageCost || 0,
        perPersonCost: selectedHotelOption.perPersonCost || 0,
        cwbCost: selectedHotelOption.cwbCost || 0,
        cnbCost: selectedHotelOption.cnbCost || 0
      },
      packageData: {
        originalPackageData: {
          destinations: packageDetails.destinations,
          tripDetails: {
            rooms: [{
              adults: packageDetails.passengers?.adult || 2,
              cwb: packageDetails.passengers?.child || 0,
              cnb: 0,
              infants: packageDetails.passengers?.infant || 0
            }]
          },
          validity: packageDetails.validity,
          inclusions: packageDetails.inclusions,
          exclusions: packageDetails.exclusions,
          importantNotes: packageDetails.importantNotes,
          cancellationPolicy: packageDetails.cancellationPolicy,
          selectedHotelOption: selectedHotelOption,
          allHotelsInOption: allHotelsInSelectedOption,
          transfers: packageDetails.transfers || [],
          activities: packageDetails.activity || []
        }
      }
    };
    
    return transformedData;
  };

  const getItineraryData = (): ItineraryItem[] => {
    if (packageData?.packageDetails?.itinerary && packageData.packageDetails.itinerary.length > 0) {
      return packageData.packageDetails.itinerary.map((item: any): ItineraryItem => ({
        day: item.day,
        title: item.title,
        details: item.details,
        description: item.description || item.title,
        date: item.date
      }));
    }
    
    const firstHotel = packageData?.packageDetails?.hotelOption?.[0]?.hotels?.[0];
    const totalNights = firstHotel?.nights || 3;
    const destination = firstHotel?.destination || packageData?.packageDetails?.destination || 'destination';
    
    const itineraryDays: ItineraryItem[] = [];
  
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
        details = `City tour and sightseeing in ${destination}. Visit popular attractions and landmarks.`;
      }
    
      itineraryDays.push({
        day: i,
        title: title,
        details: details,
        description: title
      });
    }
    
    return itineraryDays;
  };

  const handleProceedToSearch = () => {
  if (!selectedHotel || !packageData) {
    alert("Please select a hotel option first!");
    return;
  }

  navigate('/readymade-search', {
    state: {
      packageData: packageData,
      packageId: id,
      selectedHotelOption: selectedHotel,
      selectedSeason: selectedSeason
    }
  });
};

  if (isLoading) {
    return (
      <Box className="loading-container"> <CircularProgress /></Box>
    );
  }

  if (error) {
    return (
      <Container className="error-container">
        <Alert severity="error" className="error-alert"> Error loading package details. Please try again.</Alert>
        <Button onClick={handleBack} startIcon={<ArrowBackIcon />} className="back-button-error">  Go Back</Button>
      </Container>
    );
  }

  if (!packageData || !packageData.packageDetails) {
    return (
      <Container className="error-container">
        <Alert severity="warning" className="warning-alert">  Package data not found. Please go back and try again.  </Alert>
        <Button onClick={handleBack} startIcon={<ArrowBackIcon />} className="back-button-error"> Go Back   </Button>
      </Container>
    );
  }
  const getSortedHotelOptions = () => {
    if (!packageDetails?.hotelOption) return [];
    
    const hotelOptions = [...packageDetails.hotelOption];
    
    hotelOptions.sort((a, b) => {
      const priceA = a.perPersonCost || 0;
      const priceB = b.perPersonCost || 0;
      
      if (selectedSeason === 'low') {
        return priceA - priceB;
      } else {
        return priceB - priceA;
      }
    });
    
    return hotelOptions;
  };
  const { packageDetails } = packageData;
  const itineraryData = getItineraryData();
  const packageTitle = packageDetails.packageName || packageDetails.title || 'Package Details';
  const firstHotel = packageDetails.hotelOption?.[0]?.hotels?.[0];
  const totalNights = firstHotel?.nights || packageDetails.nights || 3;
  const selectedOptionIndex = selectedHotel ? parseInt(selectedHotel) : -1;
  const selectedOption = selectedOptionIndex >= 0 ? packageDetails.hotelOption?.[selectedOptionIndex] : null;
  const transformedPDFData = transformPackageDataForPDF();

  return (
    <Box className="package-details">
      <Box className="package-container">
        <Box className='header-section'>
          <Box className="package-header">
            <Button onClick={handleBack} startIcon={<ArrowBackIcon />} className="back-button">Back</Button>
            <Box className="header-content">
              <Box className="header-left">
                <Typography variant="h4" className="package-title"> {packageTitle} </Typography>
                <Typography variant="subtitle1" className="package-duration"> {totalNights} Nights / {totalNights + 1} Days  </Typography>
              </Box>
              <Box className="header-icons"> 
                {/* <IconButton className="header-icon-button">  <EmailIcon /> </IconButton> */}
                {/* PDF Download Button */}
                {transformedPDFData && ( <IconButton className="header-icon-button"> <PackagePDFGenerator packageData={transformedPDFData} /> </IconButton> )}
              </Box>
            </Box>
          </Box>
          <Box className="tabs-section">
            <Tabs value={selectedTab} onChange={handleTabChange} className="package-tabs" variant="fullWidth">
              <Tab label="Package" className="package-tab" />
              <Tab label="Cost Includes" className="package-tab" />
              <Tab label="Itinerary" className="package-tab" />
              <Tab label="Other Info" className="package-tab" />
            </Tabs>
          </Box>
          <Box className="season-section">
            <FormControl component="fieldset">
              <RadioGroup row value={selectedSeason} onChange={handleSeasonChange} className="season-radio-group">
                <FormControlLabel value="low" control={<Radio className="season-radio" />} label="Low Season" className="season-option" />
                <FormControlLabel value="high" control={<Radio className="season-radio" />} label="High Season" className="season-option"/>
              </RadioGroup>
            </FormControl>
            <Box className="package-tab-content">
              <Typography variant="body1" className="note-text">*Note: The below rates are based on per Adult/Child & are quoted in USD</Typography>
              <Typography variant="body1" className="modify-text"> Get final cost or modify you preferred readymade option by{' '} <Button variant="text" className="modify-link">clicking here →</Button></Typography>
            </Box>
            <Typography variant="body2" className="validity-text"><strong>Validity:</strong> {getValidityText()} </Typography>
          </Box>
        </Box>

        <TabPanel value={selectedTab} index={0}>
          <Box className="content-area">
            <Box className="proceed-section">
              {selectedOption ? (
                <Button onClick={handleProceedToSearch} className="proceed-button" sx={{ ml: 2 }}>  Proceed to Search </Button>
              ) : (
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button onClick={handleProceedToSearch} disabled={!selectedHotel} className="proceed-button">
                    Proceed to Search
                  </Button>
                </Box>
              )}
            </Box>
          
          {getSortedHotelOptions().map((option: any, optionIndex: number) => {
            const originalIndex = packageDetails.hotelOption?.findIndex(orig => orig === option) || 0;
            return (
              <Box key={originalIndex} className="hotel-option-set" sx={{ mb: 4 }}>
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
                        <TableCell className="table-header-cell" sx={{ width: '100px' }}>Adult 1</TableCell>
                        <TableCell className="table-header-cell" sx={{ width: '100px' }}>CWB 1</TableCell>
                        <TableCell className="table-header-cell" sx={{ width: '100px' }}>CNB</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {option.hotels?.map((hotel: any, hotelIndex: number) => (
                        <TableRow key={hotelIndex} className={`table-row ${selectedHotel === originalIndex.toString() ? 'selected-row' : ''}`}>
                          {hotelIndex === 0 && (
                            <TableCell className="table-cell" rowSpan={option.hotels.length}>
                              <Radio 
                                checked={selectedHotel === originalIndex.toString()}   
                                onChange={() => setSelectedHotel(originalIndex.toString())} 
                                value={originalIndex.toString()} 
                                className="hotel-radio"  
                                size="small"  
                              />
                            </TableCell>
                          )}
                          <TableCell className="table-cell">{hotel.name}</TableCell>
                          <TableCell className="table-cell">{hotel.destination}</TableCell>
                          <TableCell className="table-cell">
                            <Rating value={hotel.star || 0} readOnly size="small" className="hotel-rating" />
                          </TableCell>
                          <TableCell className="table-cell">{hotel.nights}</TableCell>
                          <TableCell className="table-cell">{hotel.roomType}</TableCell>
                          {hotelIndex === 0 && (
                            <>
                              <TableCell className="table-cell" rowSpan={option.hotels.length}>
                                {`USD ${option.perPersonCost}`}
                              </TableCell>
                              <TableCell className="table-cell" rowSpan={option.hotels.length}>
                                {`USD ${option.cwbCost}`}
                              </TableCell>
                              <TableCell className="table-cell" rowSpan={option.hotels.length}>
                                {`USD ${option.cnbCost}`}
                              </TableCell>
                            </>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            );
          })}
          </Box>
        </TabPanel>
        <TabPanel value={selectedTab} index={1}>
          <Box className="includes-tab-content">
            <Typography variant="h6" className="section-title">Package Includes:</Typography>
            <ul className="includes-list">
              {packageDetails.inclusions ? 
                packageDetails.inclusions.map((inclusion: string, index: number) => (
                  <li key={index}>{inclusion}</li>)) :
                <>
                  <li>{totalNights} nights accommodation in selected hotel</li>
                  <li>Daily breakfast</li>
                  <li>Airport transfers</li>
                  <li>City tour as per itinerary</li>
                  <li>All taxes and service charges</li>
                </>
              }
            </ul>
            
            <Typography variant="h6" className="section-title excludes-title">Package Excludes:</Typography>
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
            <Typography variant="h6" className="section-title"> {totalNights + 1} Days Itinerary </Typography>
            {itineraryData.map((dayData: any, index: number) => (
              <Card key={index} className="itinerary-card">
                <CardContent>
                  <Typography variant="h6" className="day-title"> Day {dayData.day} : {dayData.title || dayData.description} </Typography>
                  <Typography variant="body1" className="day-description">  {dayData.details || dayData.description || 'Details not available'} </Typography>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabPanel>

        <TabPanel value={selectedTab} index={3}>
          <div className="info-tab-content">
            <Typography variant="h6" className="section-title">Important Information:</Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card className="info-card">
                  <CardContent>
                    <Typography variant="subtitle1" className="info-card-title">Booking Terms:</Typography>
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
                    <Typography variant="subtitle1" className="info-card-title">Travel Requirements:</Typography>
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