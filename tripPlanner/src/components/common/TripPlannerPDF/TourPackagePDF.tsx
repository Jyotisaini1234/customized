// import React, { useEffect, useState } from 'react';
// import { jsPDF } from 'jspdf';
// import html2canvas from 'html2canvas';
// import './TourPackagePDF.scss';
// import { TripPlannerData } from '../../../types/types.ts';
// import { Box } from '@mui/material';

// const TourPackagePDF: React.FC = () => {
//   const [packageData, setPackageData] = useState<TripPlannerData | null>(null);
//   const [isLoading, setIsLoading] = useState<boolean>(true);

//   useEffect(() => {
//     const storedData = sessionStorage.getItem('tripPlannerData');
//     if (storedData) {
//       try {
//         const parsedData = JSON.parse(storedData);
//         console.log("PDF component received data:", parsedData);
//         setPackageData(parsedData);
//       } catch (e) {
//         console.error('Error parsing trip planner data', e);
//       }
//     } else {
//       console.error('No trip planner data found');
//     }
//     setIsLoading(false);
//   }, []);

//   useEffect(() => {
//     if (packageData && !isLoading) {
//       setTimeout(() => {
//         generatePDF();
//       }, 1000);
//     }
//   }, [packageData, isLoading]);

//   const formatDate = (dateString?: string) => {
//     if (!dateString) return '';
//     try {
//       const date = new Date(dateString);
//       if (isNaN(date.getTime())) return dateString;
//       return date.toLocaleDateString('en-GB'); 
//     } catch (e) {
//       return dateString;
//     }
//   };

//   const generatePDF = () => {
//     const content = document.getElementById('tour-package-content');
//     if (!content) {
//       console.error('Content element not found for PDF generation');
//       return;
//     }

//     html2canvas(content, {
//       scale: 2,
//       useCORS: true,
//       logging: false,
//       backgroundColor: '#ffffff'
//     }).then(canvas => {
//       const imgData = canvas.toDataURL('image/png');
//       const pdf = new jsPDF({
//         orientation: 'portrait',
//         unit: 'mm',
//         format: 'a4'
//       });
      
//       const pageWidth = pdf.internal.pageSize.getWidth();
//       const pageHeight = pdf.internal.pageSize.getHeight();
//       const imgWidth = pageWidth - 20;
//       const imgHeight = (canvas.height * imgWidth) / canvas.width;
//       const footerText = "This document provides a summary of your tour package. Please request an official voucher to confirm your reservation.";
//       const totalPages = Math.ceil(imgHeight / (pageHeight - 20));
//       let heightLeft = imgHeight;
//       let position = 10; // Starting position
//       let currentPage = 1;
//       const heightOnFirstPage = Math.min(pageHeight - 20, imgHeight);
//       pdf.addImage(
//         imgData, 
//         'PNG', 
//         10, // x position
//         position, // y position
//         imgWidth, 
//         imgHeight,
//         undefined,
//         'FAST',
//         0 // Rotation
//       );
//       pdf.setFontSize(8);
//       pdf.setTextColor(100, 100, 100);
//       pdf.text(footerText, pageWidth / 2, pageHeight - 20, { align: 'center' });
//       pdf.text(`Page ${currentPage} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      
//       // Set height left after first page
//       heightLeft -= (pageHeight - 20);
      
//       // Add other pages if needed
//       while (heightLeft > 0) {
//         currentPage++;
//         position = -(pageHeight - 10) * (currentPage - 1) + 10;
        
//         pdf.addPage();
        
//         pdf.addImage(
//           imgData, 
//           'PNG', 
//           10, // x position
//           position, // y position
//           imgWidth, 
//           imgHeight,
//           undefined,
//           'FAST',
//           0 // Rotation
//         );
        
//         // Add footer to this page
//         pdf.setFontSize(10);
//         pdf.setTextColor(100, 100, 100);
//         pdf.text(footerText, pageWidth / 2, pageHeight - 20, { align: 'center' });
//         pdf.text(`Page ${currentPage} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        
//         heightLeft -= (pageHeight - 40);
//       }
      
//       const fileName = `Tour_Package_${packageData?.bookingRef || 'Package'}.pdf`;
//       pdf.save(fileName);
//     }).catch(error => {
//       console.error('Error generating PDF:', error);
//     });
//   };

//   if (isLoading) {
//     return (
//       <Box className="loading-container">
//         <p className="loading-text">Loading tour package data...</p>
//       </Box>
//     );
//   }

//   if (!packageData) {
//     return (
//       <Box className="loading-container">
//         <p className="loading-text">No tour package data found. Redirecting back to trip planner...</p>
//       </Box>
//     );
//   }
  
//   const {
//     bookingRef,
//     generateDate,
//     currentSearchParams,
//     hotels = [],
//     plannerItems = [],
//     costs = { finalAmount: 0 },
//     currency = 'USD'
//   } = packageData;

//   const mainHotel = hotels && hotels.length > 0 ? hotels[0] : null;
//   const nights = currentSearchParams?.nights || 
//     (currentSearchParams?.checkInDate && currentSearchParams?.checkOutDate ? 
//       Math.round((new Date(currentSearchParams.checkOutDate).getTime() - new Date(currentSearchParams.checkInDate).getTime()) / (1000 * 60 * 60 * 24)) : 0);
//   const totalPersons = costs.packageDetails?.totalPersons || 
//     currentSearchParams?.rooms?.[0]?.adults || 1;

//   return (
//     <Box className="tour-package-container">
//       <Box id="tour-package-content" className="tour-package-content">
//         {/* Header */}
//         <Box className="tour-package-header">
//           <h1 className="header-title">TOUR PACKAGE</h1>
//           <p className="header-subtitle">Curated by Avola Travel Azerbaijan</p>
//         </Box>
//         <Box className="booking-reference">
//           <Box className="booking-reference-content">
//             <Box className="booking-ref">
//               <span className="bold-text">BOOKING REFERENCE:</span> {bookingRef}
//             </Box>
//             <Box className="generated-date">Generated on: {generateDate}</Box>
//           </Box>
//         </Box>
//         {/* Package Details */}
//         <Box className="package-details-section">
//           <h2 className="section-title">Package Details</h2>
//           <Box className="details-grid">
//             <Box className="detail-label">Main Hotel:</Box>
//             <Box className="detail-value">{mainHotel?.hotel?.hotelName || 'Multiple Hotels (See Daily Itinerary)'}</Box>
//             <Box className="detail-label">Duration:</Box>
//             <Box className="detail-value">{nights} nights</Box>
//             <Box className="detail-label">Meal Plan:</Box>
//             <Box className="detail-value">{mainHotel?.booking?.mealPlan || 'As per itinerary'}</Box>
//             <Box className="detail-label">Room Setup:</Box>
//             <Box className="detail-value">{mainHotel?.booking?.roomType || 'Standard'}</Box>
//             <Box className="detail-label">Total Persons:</Box>
//             <Box className="detail-value">{totalPersons}</Box>
//           </Box>
//         </Box>

//         <Box className="itinerary-section">
//           <h2 className="section-title">Daily Itinerary</h2>
//           {plannerItems.map((item, index) => {
//             const formattedDate = formatDate(item.dateObj ? item.dateObj.toString() : item.date);
//             return (
//               <Box key={item.id} className="day-container">
//                 <Box className="day-header">
//                   <h3 className="day-title">DAY {index + 1} - {formattedDate}</h3>
//                 </Box>
                
//               {item.hotel && (
//                 <Box className="activity-container">
//                   <Box className="activity-title">• Stay at {item.hotel.name}</Box>
//                   <Box className="activity-detail">
//                     Room Type: {item.hotel.details?.booking?.roomType || item.hotel.details?.room?.roomCategory || 'Standard'}
//                   </Box>
//                   <Box className="activity-detail">
//                     Meal Plan: {item.hotel.details?.booking?.mealPlan || item.hotel.details?.room?.mealPlan || 'BB'}
//                   </Box>
//                   {item.hotel.details?.booking?.totalPrice && (
//                     <Box className="activity-detail">
//                       Price: {currency} {item.hotel.details.booking.totalPrice.toFixed(2)}
//                     </Box>
//                   )}
//                 </Box>
//               )}
//               {item.tours && (
//                 <Box className="activity-container">
//                   <Box className="activity-title">• {item.tours.name || item.tours.details?.tour?.tourName || 'Tour Activity'}</Box>
//                   {(item.tours.details?.tour?.eventDuration || item.tours.eventDuration) && (
//                     <Box className="activity-detail">Duration: {item.tours.details?.tour?.eventDuration || item.tours.eventDuration}</Box>
//                   )}
//                   {/* Always attempt to show description, with proper fallback */}
//                   <Box className="activity-detail">
//                     Description: {
//                     (item.tours.description && item.tours.description !== "No description available") ? 
//                     item.tours.description : 
//                     (item.tours.details?.tour?.description && item.tours.details?.tour?.description !== "No description available") ? item.tours.details.tour.description : "No description available"}
//                   </Box>
                  
//                   {item.tours.details?.booking?.totalPrice && (
//                     <Box className="activity-detail">
//                       Price: {currency} {item.tours.details.booking.totalPrice.toFixed(2)}
//                     </Box>
//                   )}
//                 </Box>
//               )}
//                 {item.meals && (
//                   <Box className="activity-container">
//                     <Box className="activity-title">• {item.meals.name || 'Meal Plan'}</Box>
//                     <Box className="activity-detail">
//                       {item.meals.description || item.meals.details || 'Traditional local cuisine experience'}
//                     </Box>
//                     {item.meals.price && (
//                       <Box className="activity-detail">
//                         Price: {currency} {parseFloat(item.meals.price).toFixed(2)}
//                       </Box>
//                     )}
//                   </Box>
//                 )}
                
//                 {!item.hotel && !item.tours && !item.transfer && !item.meals && (
//                   <Box className="activity-container">
//                     <Box className="activity-detail">Free day - No activities planned</Box>
//                   </Box>
//                 )}
//               </Box> );
//           })}
//         </Box>
//         <Box className="cost-summary">
//           <h2 className="cost-summary-title">COST SUMMARY</h2>
//           <Box className="cost-grid">
//             <Box className="cost-label">Cost Per Person:</Box>
//             <Box className="cost-value">{currency} {(costs.finalAmount / totalPersons).toFixed(2)}</Box>
//             <Box className="cost-label">Total Package Cost:</Box>
//             <Box className="cost-value">{currency} {costs.finalAmount.toFixed(2)}</Box>
//           </Box>
//         </Box>
//       </Box>
//     </Box>
//   );
// };

// export default TourPackagePDF;

import React, { useEffect, useState } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import './TourPackagePDF.scss';
import { TripPlannerData } from '../../../types/types.ts';
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

  const generatePDF = () => {
    // Get all day containers to handle them individually
    const content = document.getElementById('tour-package-content');
    const dayContainers = document.querySelectorAll('.day-container');
    
    if (!content || dayContainers.length === 0) {
      console.error('Content elements not found for PDF generation');
      return;
    }

    // Create a PDF document
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const contentWidth = pageWidth - 20; // 10mm margins on each side
    const footerText = "This document provides a summary of your tour package. Please request an official voucher to confirm your reservation.";
    
    // First render the header, booking reference, and package details
    const headerSection = document.querySelector('.tour-package-header');
    const bookingSection = document.querySelector('.booking-reference');
    const detailsSection = document.querySelector('.package-details-section');
    const itineraryTitle = document.querySelector('.itinerary-section .section-title');
    const costSummary = document.querySelector('.cost-summary');
    
    // Function to capture and add an element to the PDF
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
          
          // Return the new Y position
          resolve(yPosition + imgHeight + 3); // 3mm spacing
        });
      });
    };
    
    // Process all sections sequentially
    const processPDF = async () => {
      let yPosition = 10;
      let currentPage = 1;
      
      // Add the header, booking reference, and package details to the first page
      if (headerSection) {
        yPosition = await captureAndAddElement(headerSection, yPosition);
      }
      
      if (bookingSection) {
        yPosition = await captureAndAddElement(bookingSection, yPosition);
      }
      
      if (detailsSection) {
        yPosition = await captureAndAddElement(detailsSection, yPosition);
      }
      
      // Add the itinerary title
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
        
        // Check if this day container fits on the current page
        // Leave 30mm for footer
        if (yPosition + imgHeight > pageHeight - 20) {
          // Add a new page
          pdf.addPage();
          currentPage++;
          yPosition = 10;
        }
        
        // Add the day container to the PDF
        yPosition = await captureAndAddElement(dayContainer, yPosition);
      }
      
      // Add cost summary to the last page
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
      
      // Calculate total pages
      const totalPages = currentPage;
      
      // Add footers to all pages
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
    costs = { finalAmount: 0 },
    currency = 'USD'
  } = packageData;

  const mainHotel = hotels && hotels.length > 0 ? hotels[0] : null;
  const nights = currentSearchParams?.nights || 
    (currentSearchParams?.checkInDate && currentSearchParams?.checkOutDate ? 
      Math.round((new Date(currentSearchParams.checkOutDate).getTime() - new Date(currentSearchParams.checkInDate).getTime()) / (1000 * 60 * 60 * 24)) : 0);
  const totalPersons = costs.packageDetails?.totalPersons || 
    currentSearchParams?.rooms?.[0]?.adults || 1;

  return (
    <Box className="tour-package-container">
      <Box id="tour-package-content" className="tour-package-content">
        {/* Header */}
        <Box className="tour-package-header">
          <h1 className="header-title">TOUR PACKAGE</h1>
          <p className="header-subtitle">Curated by Avola Travel Azerbaijan</p>
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
          <Box className="details-grid">
            <Box className="detail-label">Main Hotel:</Box>
            <Box className="detail-value">{mainHotel?.hotel?.hotelName || 'Multiple Hotels (See Daily Itinerary)'}</Box>
            <Box className="detail-label">Duration:</Box>
            <Box className="detail-value">{nights} nights</Box>
            <Box className="detail-label">Meal Plan:</Box>
            <Box className="detail-value">{mainHotel?.booking?.mealPlan || 'As per itinerary'}</Box>
            <Box className="detail-label">Room Setup:</Box>
            <Box className="detail-value">{mainHotel?.booking?.roomType || 'Standard'}</Box>
            <Box className="detail-label">Total Persons:</Box>
            <Box className="detail-value">{totalPersons}</Box>
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
                
              {item.hotel && (
                <Box className="activity-container">
                  <Box className="activity-title">• Stay at {item.hotel.name}</Box>
                  <Box className="activity-detail">
                    Room Type: {item.hotel.details?.booking?.roomType || item.hotel.details?.room?.roomCategory || 'Standard'}
                  </Box>
                  <Box className="activity-detail">
                    Meal Plan: {item.hotel.details?.booking?.mealPlan || item.hotel.details?.room?.mealPlan || 'BB'}
                  </Box>
                  {item.hotel.details?.booking?.totalPrice && (
                    <Box className="activity-detail">
                      Price: {currency} {item.hotel.details.booking.totalPrice.toFixed(2)}
                    </Box>
                  )}
                </Box>
              )}
              {item.tours && (
                <Box className="activity-container">
                  <Box className="activity-title">• {item.tours.name || item.tours.details?.tour?.tourName || 'Tour Activity'}</Box>
                  {(item.tours.details?.tour?.eventDuration || item.tours.eventDuration) && (
                    <Box className="activity-detail">Duration: {item.tours.details?.tour?.eventDuration || item.tours.eventDuration}</Box>
                  )}
                  {/* Always attempt to show description, with proper fallback */}
                  <Box className="activity-detail">
                    Description: {
                    (item.tours.description && item.tours.description !== "No description available") ? 
                    item.tours.description : 
                    (item.tours.details?.tour?.description && item.tours.details?.tour?.description !== "No description available") ? item.tours.details.tour.description : "No description available"}
                  </Box>
                  
                  {item.tours.details?.booking?.totalPrice && (
                    <Box className="activity-detail">
                      Price: {currency} {item.tours.details.booking.totalPrice.toFixed(2)}
                    </Box>
                  )}
                </Box>
              )}
                {item.meals && (
                  <Box className="activity-container">
                    <Box className="activity-title">• {item.meals.name || 'Meal Plan'}</Box>
                    <Box className="activity-detail">
                      {item.meals.description || item.meals.details || 'Traditional local cuisine experience'}
                    </Box>
                    {item.meals.price && (
                      <Box className="activity-detail">
                        Price: {currency} {parseFloat(item.meals.price).toFixed(2)}
                      </Box>
                    )}
                  </Box>
                )}
                
                {!item.hotel && !item.tours && !item.transfer && !item.meals && (
                  <Box className="activity-container">
                    <Box className="activity-detail">Free day - No activities planned</Box>
                  </Box>
                )}
              </Box> );
          })}
        </Box>
        <Box className="cost-summary">
          <h2 className="cost-summary-title">COST SUMMARY</h2>
          <Box className="cost-grid">
            <Box className="cost-label">Cost Per Person:</Box>
            <Box className="cost-value">{currency} {(costs.finalAmount / totalPersons).toFixed(2)}</Box>
            <Box className="cost-label">Total Package Cost:</Box>
            <Box className="cost-value">{currency} {costs.finalAmount.toFixed(2)}</Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default TourPackagePDF;