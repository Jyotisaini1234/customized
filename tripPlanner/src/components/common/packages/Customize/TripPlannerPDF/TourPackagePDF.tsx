import React, { useEffect, useState } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import './TourPackagePDF.scss';
import { TripPlannerData } from '../../../../../types/types.ts';
import { Box } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import { useGetLeadByIdQuery } from '../../../../../api/TourAPI.tsx';
import { getFromDB, STORES } from '../../../../../utils/TripPlannerDB.ts';

const TourPackagePDF: React.FC = () => {
  const [searchParams] = useSearchParams();
  const bookingRef = searchParams.get('bookingRef');
  const [packageData, setPackageData] = useState<TripPlannerData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [companyLogo, setCompanyLogo] = useState<string>('');

  const { data: leadData, error: apiError, isLoading: apiLoading } = useGetLeadByIdQuery( bookingRef || '',  { skip: !bookingRef });
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('en-GB'); 
    } catch (e) {
      return dateString;
    }
  };

  const calculateCheckoutDate = (checkInDateStr: string, nights: number) => {
    if (!checkInDateStr) return '';
    try {
      const checkInDate = new Date(checkInDateStr);
      if (isNaN(checkInDate.getTime())) return '';
      const checkOutDate = new Date(checkInDate);
      checkOutDate.setDate(checkOutDate.getDate() + (nights || 1));
      return formatDate(checkOutDate.toISOString());
    } catch (e) {
      return '';
    }
  };

  useEffect(() => {
    const logoPath = localStorage.getItem('logoPath');
    console.log('Logo path from localStorage:', logoPath);
    
    if (logoPath) {
      setCompanyLogo(logoPath);
      console.log('Logo set to:', logoPath);
    }
  }, []);

  useEffect(() => {
    const companyInfo = localStorage.getItem('companyInfo');
    console.log('Company info from localStorage:', companyInfo);
    if (companyInfo) {
      try {
        const parsedInfo = JSON.parse(companyInfo);
        console.log('Parsed company info:', parsedInfo);
        console.log('Logo path:', parsedInfo.logoPath);
        
        if (parsedInfo.logoPath) {
          setCompanyLogo(parsedInfo.logoPath);
          console.log('Logo set to:', parsedInfo.logoPath);
        }
      } catch (error) {
        console.error('Error parsing company info:', error);
      }
    }
  }, []);
  
  useEffect(() => {
    if (!bookingRef) {
      setError('No booking reference provided');
      setIsLoading(false);
      return;
    }

    if (apiError) {
      console.error('Error fetching lead data:', apiError);
      setError('Failed to fetch booking data');
      setIsLoading(false);
      return;
    }

    if (leadData && !apiLoading) {
      console.log("PDF component received data from API:", leadData);
      const transformedData: TripPlannerData = {
        bookingRef: leadData.referenceId || leadData.bookingNo || bookingRef,
        generateDate: new Date().toLocaleDateString('en-GB'),
        country: leadData.country || leadData.destinations || leadData.destination ,
        currentSearchParams: {
          city: leadData.destinations,
          checkInDate: leadData.travelDate,
          checkOutDate: leadData.hotelDetails?.[0]?.checkOutDate || leadData.travelDate,
          nights: parseInt(leadData.nights) || 1,
          rooms: leadData.totalRooms || [{
            adults: Math.floor(parseInt(leadData.totalPersons) / 2) || 2,
            cwb: 0,
            cnb: parseInt(leadData.totalPersons) - Math.floor(parseInt(leadData.totalPersons) / 2) || 0,
            infants: 0,
            id: 0,
            roomCategory: '',
            mealPlan: ''
          }],
          country: undefined
        },
        hotels: leadData.hotelDetails?.map((hotel: any) => ({
          hotel: {
            hotelName: hotel.hotelName,
            name: hotel.hotelName,
            city: hotel.city || leadData.destinations,
            starRating: hotel.starRating || '4'
          },
          booking: {
            checkInDate: hotel.checkInDate,
            checkOutDate: hotel.checkOutDate,
            nights: hotel.nights || parseInt(leadData.nights) || 1,
            roomType: hotel.roomType || 'Standard',
            mealPlan: hotel.mealPlan || 'BB',
            totalRooms: hotel.totalRooms || leadData.totalRooms?.length
          }
        })) || [],
        plannerItems: leadData.plannerItems?.map((item: any, index: number) => {
          const getDescription = (tourItem: any) => {
            const possibleDescriptions = [
              tourItem.tours?.description,
              tourItem.tours?.details?.tour?.description,
              tourItem.description,
              tourItem.tours?.bookingDetails?.description,
              tourItem.tours?.details?.description
            ];
            
            for (const desc of possibleDescriptions) {
              if (desc && desc.trim().length > 0) {
                return desc;
              }
            }
            
            return 'No description available';
          };
        
          const getDuration = (tourItem: any) => {
            const possibleDurations = [
              tourItem.tours?.duration,
              tourItem.tours?.details?.tour?.eventDuration,
              tourItem.tours?.eventDuration,
              tourItem.duration
            ];
            
            for (const duration of possibleDurations) {
              if (duration && duration.trim().length > 0) {
                return duration;
              }
            }
            
            return 'Duration not specified';
          };
        
          return {
            id: `day-${index}`,
            date: item.date,
            dateObj: new Date(item.date),
            tours: item.tours ? {
              name: item.tours.name || item.tours.details?.tour?.tourName || 'Tour Activity',
              description: getDescription(item),
              activities: item.tours.activities || [],
              eventDuration: getDuration(item),
              details: {
                tour: {
                  tourName: item.tours.name || item.tours.details?.tour?.tourName || 'Tour Activity',
                  description: getDescription(item),
                  eventDuration: getDuration(item)
                }
              }
            } : null,
            transfer: null,
            meals: null
          };
        }) || [],
        costs: {
          finalAmount: leadData.totalAmount || 0,
          packageDetails: {
            totalPersons: parseInt(leadData.totalPersons) || 2
          }
        },
        currency: leadData.hotelDetails?.[0]?.currency,
        totalRooms: leadData.totalRooms || []
      };

      setPackageData(transformedData);
      setIsLoading(false);
    }
  }, [leadData, apiError, apiLoading, bookingRef]);

  useEffect(() => {
    if (packageData && !isLoading) {
      setTimeout(() => {
        generatePDF();
      }, 1000);
    }
  }, [packageData, isLoading]);

  const generatePDF = () => {
    const content = document.getElementById('tour-package-content');
    if (!content) {
      console.error('Content element not found for PDF generation');
      return;
    }
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });
    
    pdf.setFont('helvetica');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const contentWidth = pageWidth - 20;
    const footerText = "This document provides a summary of your tour package. Please request an official voucher to confirm your reservation.";
    
    const sections = [
      document.querySelector('.tour-package-header'),
      document.querySelector('.booking-reference'),
      document.querySelector('.client-details-section'),
      document.querySelector('.package-details-section')
    ];
    
    const itinerarySectionTitle = document.querySelector('.itinerary-section .section-title');
    const dayContainers = document.querySelectorAll('.day-container');
    const costSummary = document.querySelector('.cost-summary');
    
    const captureAndAddElement = async (element: Element, yPosition: number) => {
      return new Promise<number>((resolve) => {
        html2canvas(element as HTMLElement, {
          scale: 2, // Increased scale for better quality
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          imageTimeout: 3000,
          allowTaint: false,
          removeContainer: true,
          foreignObjectRendering: false
        }).then(canvas => {
          const imgData = canvas.toDataURL('image/png', 0.9); // Using PNG for better text quality
          const imgWidth = contentWidth;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          pdf.addImage(
            imgData, 
            'PNG', 
            10, // x position
            yPosition, // y position
            imgWidth, 
            imgHeight
          );
          
          // Reduced spacing between sections for better layout
          resolve(yPosition + imgHeight + 1); // Only 1mm spacing
        }).catch(error => {
          console.error('Error capturing element:', error);
          resolve(yPosition + 10); // Fallback spacing
        });
      });
    };
    
    const processPDF = async () => {
      let yPosition = 10;
      let currentPage = 1;
      
      // Process main sections first
      for (const section of sections) {
        if (section) {
          yPosition = await captureAndAddElement(section, yPosition);
        }
      }
      
      // Add itinerary title with minimal spacing
      if (itinerarySectionTitle) {
        // Check if we need a new page
        const tempCanvas = await html2canvas(itinerarySectionTitle as HTMLElement, {
          scale: 2,
          logging: false,
          backgroundColor: '#ffffff'
        });
        const imgWidth = contentWidth;
        const imgHeight = (tempCanvas.height * imgWidth) / tempCanvas.width;
        
        if (yPosition + imgHeight > pageHeight - 25) {
          pdf.addPage();
          currentPage++;
          yPosition = 10;
        }
        
        yPosition = await captureAndAddElement(itinerarySectionTitle, yPosition);
      }
      
      // Process day containers with minimal spacing
      for (let i = 0; i < dayContainers.length; i++) {
        const dayContainer = dayContainers[i];
        
        const tempCanvas = await html2canvas(dayContainer as HTMLElement, {
          scale: 2,
          logging: false,
          backgroundColor: '#ffffff'
        });
        const imgWidth = contentWidth;
        const imgHeight = (tempCanvas.height * imgWidth) / tempCanvas.width;
        
        // Check if we need a new page
        if (yPosition + imgHeight > pageHeight - 25) {
          pdf.addPage();
          currentPage++;
          yPosition = 10;
        }
        
        yPosition = await captureAndAddElement(dayContainer, yPosition);
      }
      
      // Add cost summary
      if (costSummary) {
        const tempCanvas = await html2canvas(costSummary as HTMLElement, {
          scale: 2,
          logging: false,
          backgroundColor: '#ffffff'
        });
        const imgWidth = contentWidth;
        const imgHeight = (tempCanvas.height * imgWidth) / tempCanvas.width;
        
        if (yPosition + imgHeight > pageHeight - 25) {
          pdf.addPage();
          currentPage++;
          yPosition = 10;
        }
        
        yPosition = await captureAndAddElement(costSummary, yPosition);
      }
      
      const totalPages = currentPage;
      
      // Add footer to all pages
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        pdf.text(footerText, pageWidth / 2, pageHeight - 15, { align: 'center' });
        pdf.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      }
      
      const fileName = `Tour_Package_${packageData?.bookingRef || 'Package'}.pdf`;
      pdf.save(fileName);
    };
    
    processPDF().catch(error => {
      console.error('Error generating PDF:', error);
    });
  };

  if (isLoading) {
    return (
      <Box className="loading-container">
        <p className="loading-text">Loading tour package data...</p>
      </Box>
    );
  }

  if (!packageData) {
    return (
      <Box className="loading-container">
        <p className="loading-text">No tour package data found. Redirecting back to trip planner...</p>
      </Box>
    );
  }

  const { bookingRef: refId, generateDate, currentSearchParams, hotels = [], plannerItems = [],
    costs = { finalAmount: 0, packageDetails: { totalPersons: 0 } }, currency, country, totalRooms = [] } = packageData;
  
  const calculateRoomInfo = () => {
    if (totalRooms && totalRooms.length > 0) {
      return totalRooms.reduce((info, room) => {
        const adults = room.adults || 0;
        const cwb = room.cwb || 0;    
        const cnb = room.cnb || 0;    
        const infants = room.infants || 0;
        
        return {
          totalRooms: info.totalRooms + 1,
          totalAdults: info.totalAdults + adults,
          totalChildren: info.totalChildren + cwb + cnb,
          totalCWB: info.totalCWB + cwb,
          totalCNB: info.totalCNB + cnb,
          totalInfants: info.totalInfants + infants
        };
      }, {
        totalRooms: 0,
        totalAdults: 0,
        totalChildren: 0,
        totalCWB: 0,
        totalCNB: 0,
        totalInfants: 0
      });
    }
    
    // Fallback to currentSearchParams.rooms
    if (!currentSearchParams?.rooms || !Array.isArray(currentSearchParams.rooms)) {
      return {
        totalRooms: 1,
        totalAdults: 2,
        totalChildren: 0,
        totalCWB: 0,
        totalCNB: 0,
        totalInfants: 0
      };
    }
    
    return currentSearchParams.rooms.reduce((info, room) => {
      const adults = room.adults || 0;
      const cwb = room.cwb || 0;    
      const cnb = room.cnb || 0;    
      const infants = room.infants || 0;
      
      return {
        totalRooms: info.totalRooms + 1,
        totalAdults: info.totalAdults + adults,
        totalChildren: info.totalChildren + cwb + cnb,
        totalCWB: info.totalCWB + cwb,
        totalCNB: info.totalCNB + cnb,
        totalInfants: info.totalInfants + infants
      };
    }, {
      totalRooms: 0,
      totalAdults: 0,
      totalChildren: 0,
      totalCWB: 0,
      totalCNB: 0,
      totalInfants: 0
    });
  };

  const calculateTotalPersons = () => {
    if (costs.packageDetails && costs.packageDetails.totalPersons) {
      return costs.packageDetails.totalPersons;
    }
    
    if (totalRooms && totalRooms.length > 0) {
      return totalRooms.reduce((total, room) => {
        const adults = room.adults || 0;
        const cwb = room.cwb || 0;
        const cnb = room.cnb || 0;
        const infants = room.infants || 0;
        return total + adults + cwb + cnb + infants;
      }, 0);
    }
    
    if (!currentSearchParams?.rooms || !Array.isArray(currentSearchParams.rooms)) {
      return 2;
    }
    
    return currentSearchParams.rooms.reduce((total, room) => {
      const adults = room.adults || 0;
      const cwb = room.cwb || 0;
      const cnb = room.cnb || 0;
      const infants = room.infants || 0;
      return total + adults + cwb + cnb + infants;
    }, 0);
  };
  
  const roomInfo = calculateRoomInfo();
  const totalPersons = calculateTotalPersons();
  
  const getHotelData = () => {
    if (leadData && leadData.hotelDetails && leadData.hotelDetails.length > 0) {
      return leadData.hotelDetails.map((hotel: any) => ({
        name: hotel.hotelName || 'Unknown Hotel',
        checkInDate: formatDate(hotel.checkInDate),
        checkOutDate: formatDate(hotel.checkOutDate),
        roomType: hotel.roomType || 'Standard',
        mealPlan: hotel.mealPlan || 'BB',
        nights: hotel.nights || 1,
        starRating: hotel.starRating || 'N/A',
        city: hotel.city || currentSearchParams?.city,
        totalRooms: hotel.totalRooms
      }));
    }
    
    // Fallback to hotels array
    const hotelEntries = hotels.map(hotel => ({
      name: hotel.hotel?.hotelName || hotel.hotel?.name || 'Unknown Hotel',
      checkInDate: formatDate(hotel.booking?.checkInDate),
      checkOutDate: formatDate(hotel.booking?.checkOutDate || currentSearchParams?.checkOutDate),
      roomType: hotel.booking?.roomType || 'Standard',
      mealPlan: hotel.booking?.mealPlan || 'BB',
      nights: hotel.booking?.nights || 1,
      starRating: hotel.hotel?.starRating || 'N/A',
      city: hotel.hotel?.city || currentSearchParams?.city,
      totalRooms: hotel.booking?.totalRooms || roomInfo.totalRooms
    }));
    
    return hotelEntries.map(hotel => ({
      name: hotel.name,
      checkInDate: hotel.checkInDate,
      checkOutDate: hotel.checkOutDate || calculateCheckoutDate(hotel.checkInDate, hotel.nights),
      nights: hotel.nights,
      roomType: hotel.roomType,
      mealPlan: hotel.mealPlan,
      starRating: hotel.starRating,
      city: hotel.city,
      totalRooms: hotel.totalRooms
    }));
  }
  
  const hotelData = getHotelData();

  const formatDescription = (description) => {
    if (!description) return "No description available";
    let formattedDesc = description
      .replace(/\*\*/g, '\n**')
      .replace(/\*/g, '\n*')
      .trim();
    formattedDesc = formattedDesc
      .split('\n')
      .filter(line => line.trim() !== '')
      .join('\n');
    
    return formattedDesc;
  };

  return (
    <Box className="tour-package-container">
      <Box id="tour-package-content" className="tour-package-content">
        <Box className="tour-package-header">
          <h1 className="header-title">{(country || 'AZERBAIJAN').toUpperCase()} TOUR PACKAGE</h1>
          {companyLogo && (
            <Box className="company-logo" style={{ textAlign: 'center', marginTop: '10px' }}>
              <img src={`${companyLogo}`} alt="Company Logo" style={{ maxHeight: '60px', maxWidth: '200px', objectFit: 'contain' }} />
            </Box>
          )}
        </Box>
        
        <Box className="booking-reference">
          <Box className="booking-reference-content">
            <Box className="booking-ref">
              <span className="bold-text">BOOKING REFERENCE:</span> {bookingRef}
            </Box>
            <Box className="generated-date">Generated on: {generateDate}</Box>
          </Box>
        </Box>
        
        <Box className="package-details-section">
          <h2 className="section-title">Package Details</h2>
          <Box className="hotels-table-container">
            <h3 className="table-title">Hotel Details</h3>
            <table className="hotels-table">
              <thead>
                <tr>
                  <th>Hotel Name</th>
                  <th>Check-in</th>
                  <th>Check-out</th>
                  <th>Nights</th>
                  <th>Room Type</th>
                  <th>Meal Plan</th>
                  <th>Rooms</th>
                  <th>City</th>
                  <th>Total Person</th>
                  <th>Rating</th>
                </tr>
              </thead>
              <tbody>
                {hotelData.map((hotel, index) => (
                  <tr key={index}>
                    <td>{hotel.name}</td>
                    <td>{hotel.checkInDate}</td>
                    <td>{hotel.checkOutDate}</td>
                    <td>{hotel.nights}</td>
                    <td>{hotel.roomType}</td>
                    <td>{hotel.mealPlan}</td>
                    <td>{hotel.totalRooms}</td>
                    <td>{hotel.city}</td>
                    <td>{totalPersons}</td>
                    <td>{hotel.starRating}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        </Box>
        
        {/* Itinerary Section */}
        <Box className="itinerary-section">
          <h2 className="section-title">Daily Itinerary</h2>
          {plannerItems.map((item, index) => {
            const formattedDate = formatDate(item.dateObj ? item.dateObj.toString() : item.date);
            return (
              <Box key={item.id} className="day-container">
                <Box className="day-header">
                  <h3 className="day-title">DAY {index + 1} - {formattedDate}</h3>
                </Box>
                {/* Tour Details with Activities */}
                {item.tours && (
                  <Box className="activity-container">
                    <Box className="activity-title">• {item.tours.name || item.tours.details?.tour?.tourName || 'Tour Activity'}</Box>
                    {(item.tours.details?.tour?.eventDuration || item.tours.eventDuration) && (
                      <Box className="activity-detail" sx={{color:'black'}}>
                        <span className="detail-label">Duration:</span> {item.tours.details?.tour?.eventDuration || item.tours.eventDuration}
                      </Box>
                    )}
                    <Box className="activity-detail">
                      <span className="detail-label">Description:</span> 
                      {formatDescription(item.tours.details?.tour?.description || item.tours.description || "No description available")
                        .split('\n').map((line, index) => {
                          if (line.trim().startsWith('*')) {
                            const [bullet, ...rest] = line.split(/\*\s+(.*)/);
                            const textContent = rest.join('');
                            return (
                              <Box key={index} className="description-line bullet-point">
                                <span className="bullet">* </span>
                                <span className="bullet-content">{textContent}</span>
                              </Box>
                            );
                          } else {
                            return <div key={index} className="description-line">{line}</div>;
                          }
                        })}
                    </Box>
                    {/* Selected Activities Section */}
                    {item.tours.activities && item.tours.activities.length > 0 && (
                      <Box className="selected-activities" sx={{fontWeight:'800'}}>
                        <Box sx={{fontSize:"1rem"}}>Activities</Box>
                        <ul className="activities-list">
                          {item.tours.activities.map((activity, actIndex) => ( 
                            <li key={actIndex} className="activity-item"> {activity.name} </li> 
                          ))}
                        </ul>
                      </Box>
                    )}
                  </Box>
                )}
                {/* Day at Leisure */}
                {!item.tours && !item.transfer && !item.meals && (
                  <Box className="activity-container">
                    <Box className="activity-detail">Day at Leisure</Box>
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
        
        {/* Cost Summary */}
        <Box className="cost-summary">
          <h2 className="cost-summary-title">COST SUMMARY</h2>
          <Box className="cost-grid">
            <Box className="cost-label">Total Package Cost:</Box>
            <Box className="cost-value">{currency} {(costs.finalAmount ?? 0).toFixed(2)}</Box>
            <Box className="cost-label">Cost Per Person:</Box>
            <Box className="cost-value">{currency} {((costs.finalAmount ?? 0) / totalPersons).toFixed(2)}</Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default TourPackagePDF;

