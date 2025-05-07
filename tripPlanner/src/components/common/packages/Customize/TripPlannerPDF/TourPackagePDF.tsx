import React, { useEffect, useState } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import './TourPackagePDF.scss';
import { TripPlannerData } from '../../../../../types/types.ts';
import { Box } from '@mui/material';


const TourPackagePDF: React.FC = () => {
  const [packageData, setPackageData] = useState<TripPlannerData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const storedData = sessionStorage.getItem('tripPlannerData');
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        console.log("PDF component received data:", parsedData);
        setPackageData(parsedData);
      } catch (e) {
        console.error('Error parsing trip planner data', e);
      }
    } else {
      console.error('No trip planner data found');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (packageData && !isLoading) {
      setTimeout(() => {
        generatePDF();
      }, 1000);
    }
  }, [packageData, isLoading]);

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
  
  const calculateCheckoutDate = (checkInDateStr, nights) => {
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
  
  const generatePDF = () => {
    const content = document.getElementById('tour-package-content');
    const dayContainers = document.querySelectorAll('.day-container');
    
    if (!content || dayContainers.length === 0) {
      console.error('Content elements not found for PDF generation');
      return;
    }
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const contentWidth = pageWidth - 20; // 10mm margins on each side
    const footerText = "This document provides a summary of your tour package. Please request an official voucher to confirm your reservation.";
    const headerSection = document.querySelector('.tour-package-header');
    const bookingSection = document.querySelector('.booking-reference');
    const clientDetailsSection = document.querySelector('.client-details-section');
    const detailsSection = document.querySelector('.package-details-section');
    const itineraryTitle = document.querySelector('.itinerary-section .section-title');
    const costSummary = document.querySelector('.cost-summary');
    const captureAndAddElement = async (element: Element, yPosition: number) => {
      return new Promise<number>((resolve) => {
        html2canvas(element as HTMLElement, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        }).then(canvas => {
          const imgData = canvas.toDataURL('image/png');
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
          resolve(yPosition + imgHeight + 3); // 3mm spacing
        });
      });
    };
    const processPDF = async () => {
      let yPosition = 10;
      let currentPage = 1;
      if (headerSection) {
        yPosition = await captureAndAddElement(headerSection, yPosition);
      }
      
      if (bookingSection) {
        yPosition = await captureAndAddElement(bookingSection, yPosition);
      }
      
      if (clientDetailsSection) {
        yPosition = await captureAndAddElement(clientDetailsSection, yPosition);
      }

      if (detailsSection) {
        yPosition = await captureAndAddElement(detailsSection, yPosition);
      }
      if (itineraryTitle) {
        yPosition = await captureAndAddElement(itineraryTitle, yPosition);
      }
      
      // Process each day container
      for (let i = 0; i < dayContainers.length; i++) {
        const dayContainer = dayContainers[i];
        
        // Calculate height of the day container
        const tempCanvas = await html2canvas(dayContainer as HTMLElement, {
          scale: 2,
          logging: false,
          backgroundColor: '#ffffff'
        });
        
        const imgWidth = contentWidth;
        const imgHeight = (tempCanvas.height * imgWidth) / tempCanvas.width;
        if (yPosition + imgHeight > pageHeight - 20) {
          // Add a new page
          pdf.addPage();
          currentPage++;
          yPosition = 10;
        }
        // Add the day container to the PDF
        yPosition = await captureAndAddElement(dayContainer, yPosition);
      }
      if (costSummary) {
        // Check if cost summary fits on the current page
        const tempCanvas = await html2canvas(costSummary as HTMLElement, {
          scale: 1,
          logging: false
        });
        const imgWidth = contentWidth;
        const imgHeight = (tempCanvas.height * imgWidth) / tempCanvas.width;
        if (yPosition + imgHeight > pageHeight - 20) {
          pdf.addPage();
          currentPage++;
          yPosition = 10;
        }
        yPosition = await captureAndAddElement(costSummary, yPosition);
      }
      const totalPages = currentPage;
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
  const {
    bookingRef,
    generateDate,
    currentSearchParams,
    hotels = [],
    plannerItems = [],
    costs = { finalAmount: 0, packageDetails: { totalPersons: 0 } },
    currency = 'USD'
  } = packageData;
  
  // Calculate room-related information
  const calculateRoomInfo = () => {
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
      const cwb = room.cwb || 0;    // Child with bed
      const cnb = room.cnb || 0;    // Child no bed
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

  // Calculate total persons including adults, children (CWB and CNB), and infants
  const calculateTotalPersons = () => {
    if (costs.packageDetails && costs.packageDetails.totalPersons) {
      return costs.packageDetails.totalPersons;
    }
    
    if (!currentSearchParams?.rooms || !Array.isArray(currentSearchParams.rooms)) {
      return 2; // Default to 2 persons if no room data
    }
    
    return currentSearchParams.rooms.reduce((total, room) => {
      const adults = room.adults || 0;
      const cwb = room.cwb || 0;    // Child with bed
      const cnb = room.cnb || 0;    // Child no bed
      const infants = room.infants || 0;
      return total + adults + cwb + cnb + infants;
    }, 0);
  };
  
  const roomInfo = calculateRoomInfo();
  const totalPersons = calculateTotalPersons();
  // const destination = currentSearchParams?.city || 'Baku';
  const destination = hotels && hotels.length > 0 && hotels[0].hotel?.city 
  ? hotels[0].hotel.city 
  : currentSearchParams?.city || 'Baku';


  const getHotelData = () => {
    // First get all hotel entries from hotels array directly
    const hotelEntries = hotels.map(hotel => ({
      name: hotel.hotel?.hotelName || hotel.hotel?.name || 'Unknown Hotel',
      checkInDate: formatDate(hotel.booking?.checkInDate),
      checkOutDate: formatDate(hotel.booking?.checkOutDate || currentSearchParams?.checkOutDate),
      roomType: hotel.booking?.roomType || 
                hotel.room?.roomCategory || 
                'Standard',
      mealPlan: hotel.booking?.mealPlan || 
                hotel.room?.mealPlan || 
                'BB',
      nights: hotel.booking?.nights || 1,
      starRating: hotel.hotel?.starRating || 
                'N/A',
      city: hotel.hotel?.city || currentSearchParams?.city || 'Baku'
    }));
    
    // Process each hotel to ensure correct checkout date calculation
    return hotelEntries.map(hotel => ({
      name: hotel.name,
      checkInDate: hotel.checkInDate,
      checkOutDate: hotel.checkOutDate || calculateCheckoutDate(hotel.checkInDate, hotel.nights),
      nights: hotel.nights,
      roomType: hotel.roomType,
      mealPlan: hotel.mealPlan,
      starRating: hotel.starRating,
       city: hotel.city
    }));
  }
  const hotelData = getHotelData();
  const mainHotel = hotels && hotels.length > 0 ? hotels[0] : null;
  const nights = currentSearchParams?.nights ||
    (currentSearchParams?.checkInDate && currentSearchParams?.checkOutDate ? 
      Math.round((new Date(currentSearchParams.checkOutDate).getTime() - new Date(currentSearchParams.checkInDate).getTime()) / (1000 * 60 * 60 * 24)) : 0);

  return (
    <Box className="tour-package-container">
      <Box id="tour-package-content" className="tour-package-content">
        {/* Header */}
        <Box className="tour-package-header">
          <h1 className="header-title">TOUR PACKAGE</h1>
        </Box>
        <Box className="booking-reference">
          <Box className="booking-reference-content">
            <Box className="booking-ref">
              <span className="bold-text">BOOKING REFERENCE:</span> {bookingRef}
            </Box>
            <Box className="generated-date">Generated on: {generateDate}</Box>
          </Box>
        </Box>
        {/* Package Details */}
        <Box className="package-details-section">
          <h2 className="section-title">Package Details</h2>
          {/* Hotel Table */}
          <Box className="hotels-table-container">
            <h3 className="table-title">Hotel Details</h3>
            <table className="hotels-table">
              <thead>
                <tr>
                  <th>Hotel Name</th>
                  <th>Check-in Date</th>
                  <th>Check-out Date</th>
                  <th>Nights</th>
                  <th>Room Type</th>
                  <th>Meal Plan</th>
                  <th>Rooms</th>
                  <th>Area</th>
                  <th>Total Person</th>
                  <th>Stars Rating</th>
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
                    <td>{roomInfo.totalRooms}</td>
                    <td>{hotel.city}</td>
                    <td>{totalPersons}</td>
                    <td>{hotel.starRating}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        </Box>

        <Box className="itinerary-section">
          <h2 className="section-title">Daily Itinerary</h2>
          {plannerItems.map((item, index) => {
            const formattedDate = formatDate(item.dateObj ? item.dateObj.toString() : item.date);
            return (
              <Box key={item.id} className="day-container">
                <Box className="day-header">
                  <h3 className="day-title">DAY {index + 1} - {formattedDate}</h3>
                </Box>
                
                {item.tours && (
                  <Box className="activity-container">
                    <Box className="activity-title">• {item.tours.name || item.tours.details?.tour?.tourName || 'Tour Activity'}</Box>
                    {(item.tours.details?.tour?.eventDuration || item.tours.eventDuration) && (
                      <Box className="activity-detail">Duration: {item.tours.details?.tour?.eventDuration || item.tours.eventDuration}</Box>
                    )}
                    <Box className="activity-detail">
                      Description: {
                      (item.tours.description && item.tours.description !== "No description available") ? 
                      item.tours.description : 
                      (item.tours.details?.tour?.description && item.tours.details?.tour?.description !== "No description available") ? item.tours.details.tour.description : "No description available"}
                    </Box>
                  </Box>
                )}
   
                {item.transfer && (
                  <Box className="activity-container">
                    <Box className="activity-title">• Transfer: {item.transfer.type || 'Transportation'}</Box>
                    {item.transfer.description && (
                      <Box className="activity-detail">Details: {item.transfer.description}</Box>
                    )}
                  </Box>
                )}
                {!item.tours && !item.transfer && !item.meals && (
                  <Box className="activity-container">
                    <Box className="activity-detail">Day at Leisure</Box>
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
        <Box className="cost-summary">
          <h2 className="cost-summary-title">COST SUMMARY</h2>
          <Box className="cost-grid">
            <Box className="cost-label">Total Package Cost:</Box>
            <Box className="cost-value">{currency} {costs.finalAmount.toFixed(2)}</Box>
            
            <Box className="cost-label">Cost Per Person:</Box>
            <Box className="cost-value">{currency} {(costs.finalAmount / totalPersons).toFixed(2)}</Box>
            </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default TourPackagePDF;