import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Box, Typography, Table, TableHead, TableBody, TableRow, TableCell, Paper, Divider } from '@mui/material';
import { Lead, LeadDetail, LeadInvoiceData, SearchParams } from '../../../../types/types';
import './LeadInvoicePDF.scss';

export const useLeadInvoiceDownload = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('en-GB'); 
    } catch (e) {
      return dateString;
    }
  };

  const handleInvoiceDownload = async (lead: LeadDetail) => {
    if (isGenerating) return;
    setIsGenerating(true);

    try {
      const invoiceData: LeadInvoiceData = {
        bookingRef: lead.referenceId || lead.bookingNo || '',
        generateDate: new Date().toLocaleDateString('en-GB'),
        clientDetails: {
          name: lead.clientName || lead.clientDetails?.name || '',
          options: lead.type || lead.clientDetails?.type || ''
        },
        hotels: lead.hotels || [],
        hotelDetails: lead.hotelDetails || [],
        plannerItems: lead.plannerItems || [],
        costs: lead.costs || { finalAmount: lead.totalAmount, packageDetails: { totalPersons: Number(lead.totalPersons) || 1 } },
        currency: lead.currency || 'USD',
        totalPersons: lead.totalPersons || 1,
        country: lead.country || lead.currentSearchParams?.country || '',
        destination: lead.destinations || lead.clientDetails?.destinations || '',
     

      };
      await generatePDF(invoiceData);
    } catch (error) {
      console.error('Error generating invoice PDF:', error);
      alert('Failed to generate invoice. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };


  const generatePDF = async (invoiceData: LeadInvoiceData) => {
    const tempDiv = document.createElement('div');
    tempDiv.id = 'temp-invoice-content';
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.width = '794px'; // A4 width
    tempDiv.style.backgroundColor = '#ffffff';
    tempDiv.style.padding = '20px';
    tempDiv.style.boxSizing = 'border-box';
    document.body.appendChild(tempDiv);
    const root = createRoot(tempDiv);
    const InvoiceComponent = renderInvoiceComponent(invoiceData);
    root.render(InvoiceComponent);
    // Wait for rendering to complete
    await new Promise(resolve => setTimeout(resolve, 1200));
  
    try {
      const pdf = new jsPDF({ orientation: 'portrait',unit: 'mm', format: 'a4', compress: true });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const contentWidth = pageWidth - (margin * 2);
      const maxContentHeight = pageHeight - (margin * 2) - 20;
      const footerText = "This invoice is generated for your reference. Please contact us for any queries.";
      let yPosition = margin;
      let currentPage = 1;
      // Function to add new page
      const addNewPage = (): void => {pdf.addPage(); currentPage++; yPosition = margin;};
      // Function to create cropped canvas
      const createCroppedCanvas = (sourceCanvas: HTMLCanvasElement, sx: number, sy: number, sw: number, sh: number): HTMLCanvasElement => {
        const croppedCanvas = document.createElement('canvas');
        croppedCanvas.width = sw;
        croppedCanvas.height = sh;
        const ctx = croppedCanvas.getContext('2d');
        if (ctx) {ctx.drawImage(sourceCanvas, sx, sy, sw, sh, 0, 0, sw, sh); }
        return croppedCanvas;
      };
      // Function to capture and add element to PDF with content splitting
      const captureAndAddElementWithSplit = async (element: HTMLElement, spacing: number = 5): Promise<void> => {
        if (!element) return;
        const fullCanvas = await html2canvas(element, { scale: 1.5, useCORS: true, logging: false, backgroundColor: '#ffffff',  width: 754, allowTaint: false });
        const imgWidth = contentWidth;
        const fullImgHeight = (fullCanvas.height * imgWidth) / fullCanvas.width;
        // If element fits completely on current page
        if (yPosition + fullImgHeight + spacing <= maxContentHeight) {
          const imgData = fullCanvas.toDataURL('image/jpeg', 0.8);
          pdf.addImage(imgData, 'JPEG', margin, yPosition, imgWidth, fullImgHeight);
          yPosition += fullImgHeight + spacing;
          return;
        }
        // Calculate how much space is available on current page
        const availableHeight = maxContentHeight - yPosition;
        // If very little space left, start fresh on new page
        if (availableHeight < 20) {
          addNewPage();
          const imgData = fullCanvas.toDataURL('image/jpeg', 0.8);
          pdf.addImage(imgData, 'JPEG', margin, yPosition, imgWidth, fullImgHeight);
          yPosition += fullImgHeight + spacing; return; }
        // Split the content across pages
        const pixelsPerMM = fullCanvas.height / fullImgHeight;
        const firstPartHeightMM = availableHeight - spacing;
        const firstPartHeightPx = firstPartHeightMM * pixelsPerMM;
        const firstPartCanvas = createCroppedCanvas( fullCanvas, 0,0, fullCanvas.width,  Math.floor(firstPartHeightPx) );
        const firstPartImgData = firstPartCanvas.toDataURL('image/jpeg', 0.8);
        pdf.addImage(firstPartImgData, 'JPEG', margin, yPosition, imgWidth, firstPartHeightMM);
        addNewPage();
        const remainingHeightPx = fullCanvas.height - Math.floor(firstPartHeightPx);
        const remainingPartCanvas = createCroppedCanvas( fullCanvas,  0, Math.floor(firstPartHeightPx), fullCanvas.width, remainingHeightPx );
        const remainingPartImgData = remainingPartCanvas.toDataURL('image/jpeg', 0.8);
        const remainingHeightMM = fullImgHeight - firstPartHeightMM;
        pdf.addImage(remainingPartImgData, 'JPEG', margin, yPosition, imgWidth, remainingHeightMM);
        yPosition += remainingHeightMM + spacing;
      };
  
      const captureAndAddElementNoSplit = async (element: HTMLElement, spacing: number = 5): Promise<void> => {
        if (!element) return;
        const canvas = await html2canvas(element, {scale: 1.5,useCORS: true, logging: false, backgroundColor: '#ffffff',width: 754,allowTaint: false});
        const imgData = canvas.toDataURL('image/jpeg', 0.8);
        const imgWidth = contentWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        if (yPosition + imgHeight + spacing > maxContentHeight) { addNewPage(); }
        pdf.addImage(imgData, 'JPEG', margin, yPosition, imgWidth, imgHeight);
        yPosition += imgHeight + spacing;
      };
      const headerSection = tempDiv.querySelector('.invoice-header') as HTMLElement;
      const referenceSection = tempDiv.querySelector('.invoice-reference') as HTMLElement;
      const hotelSection = tempDiv.querySelector('.hotel-details-section') as HTMLElement;
      const toursSection = tempDiv.querySelector('.tours-section') as HTMLElement;
      const costSection = tempDiv.querySelector('.cost-summary') as HTMLElement;
      const tourContainers = Array.from(tempDiv.querySelectorAll('.day-container')) as HTMLElement[];
      if (headerSection) {await captureAndAddElementNoSplit(headerSection, 3); }
      if (referenceSection) { await captureAndAddElementNoSplit(referenceSection, 5);}
      if (hotelSection) {await captureAndAddElementWithSplit(hotelSection, 8); }
      if (toursSection && tourContainers.length > 0) { const tourTitle = toursSection.querySelector('.tours-section-title') as HTMLElement; if (tourTitle) { await captureAndAddElementNoSplit(tourTitle, 5);}
      for (let i = 0; i < tourContainers.length; i++) { const tourContainer = tourContainers[i]; await captureAndAddElementWithSplit(tourContainer, 8);} }
      if (costSection) {const costCanvas = await html2canvas(costSection, { scale: 1.5, logging: false, backgroundColor: '#ffffff',  width: 754});
      const costHeight = (costCanvas.height * contentWidth) / costCanvas.width;
      if (yPosition + costHeight + 10 > maxContentHeight) { addNewPage();} await captureAndAddElementNoSplit(costSection, 0); }
      const totalPages = currentPage;
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        pdf.text(footerText, pageWidth / 2, pageHeight - 15, { align: 'center' });
        pdf.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      }
      const fileName = `Invoice_${invoiceData.bookingRef}.pdf`;
      pdf.save(fileName);
  
    } finally {
      root.unmount();
      document.body.removeChild(tempDiv);
    }
  };
  const renderInvoiceComponent = (invoiceData: LeadInvoiceData) => {
  const { bookingRef,  generateDate, clientDetails,  currentSearchParams, hotels = [],  hotelDetails = [], plannerItems = [],costs = { finalAmount: 0, packageDetails: { totalPersons: 0 } }, currency = 'USD', totalPersons = 1,country='',destination='' } = invoiceData;
    const formatDescription = (description: string) => {
      if (!description) return "No description available";
      return description
        .replace(/\*\*/g, '\n**')
        .replace(/\*/g, '\n*')
        .trim()
        .split('\n')
        .filter(line => line.trim() !== '')
        .join('\n');
    };

    const renderDescriptionLines = (description: string) => {
      return formatDescription(description)
        .split('\n')
        .map((line, i) => {
          if (line.trim().startsWith('*')) {
            const textContent = line.replace(/^\*\s+/, '');
            return (
              <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', mb: 0.5 }}>
                <Typography component="span" sx={{ mr: 0.5 }}>•</Typography>
                <Typography component="span" sx={{ fontSize: '0.9rem' }}>{textContent}</Typography>
              </Box>
            );
          }
          return (
            <Typography key={i} sx={{ fontSize: '0.9rem', mb: 0.5 }}>
              {line}
            </Typography>
          );
        });
    };
   
    const getCountryForTitle = () => {
      if (country && country.trim()) {
        return country.trim();
      }
      
      if (destination && destination.trim()) {
        return destination.trim();
      }
      
      if (currentSearchParams?.country && currentSearchParams.country.trim()) {
        return currentSearchParams.country.trim();
      }
      
    }
    const getInvoiceTitle = () => {
      const countryName = getCountryForTitle();
    
      if (countryName) {
        return `${countryName.toUpperCase()} TOUR PACKAGE`;
      }
      return hasHotels ? 'TOUR PACKAGE' : 'TOURS AND TRANSFERS';
    };
    const hasHotels = (hotelDetails && hotelDetails.length > 0) || (hotels && hotels.length > 0);
    const invoiceTitle = getInvoiceTitle();

    return (
      <Box sx={{ width: '100%', bgcolor: '#ffffff', p: 0 }}>
        <Box className="invoice-header" sx={{ mb: 2 }}>
          <Typography  variant="h4"   component="h1" sx={{  fontWeight: 'bold',  fontSize: '1.5rem',textAlign: 'center', color: 'white', mb: 1 }}
           > {invoiceTitle}  </Typography>
        </Box>

        {/* Reference */}
        <Paper className="invoice-reference" sx={{ p: 2, mb: 2, bgcolor: '#f5f5f5' ,display:'flex'}}>
          <Typography sx={{ fontSize: '0.9rem' }}>
            <Typography component="span" sx={{ fontWeight: 'bold' }}>INVOICE NO:</Typography> {bookingRef}
            <Typography component="span" sx={{ ml: 2 }}>Generated on: {generateDate}</Typography>
          </Typography>
        </Paper>

        {/* Hotel Details */}
        {hasHotels && (
          <Box className="hotel-details-section" sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>  Hotel Details </Typography>
            <Table sx={{ width: '100%', border: '1px solid #ddd' }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ border: '1px solid #ddd', fontWeight: 'bold', fontSize: '0.85rem' }}>Hotel Name</TableCell>
                  <TableCell sx={{ border: '1px solid #ddd', fontWeight: 'bold', fontSize: '0.85rem' }}>City</TableCell>
                  <TableCell sx={{ border: '1px solid #ddd', fontWeight: 'bold', fontSize: '0.85rem' }}>Rooms</TableCell>
                  <TableCell sx={{ border: '1px solid #ddd', fontWeight: 'bold', fontSize: '0.85rem' }}>Check-in</TableCell>
                  <TableCell sx={{ border: '1px solid #ddd', fontWeight: 'bold', fontSize: '0.85rem' }}>Check-out</TableCell>
                  <TableCell sx={{ border: '1px solid #ddd', fontWeight: 'bold', fontSize: '0.85rem' }}>Nights</TableCell>
                  <TableCell sx={{ border: '1px solid #ddd', fontWeight: 'bold', fontSize: '0.85rem' }}>Room Type</TableCell>
                  </TableRow>
              </TableHead>
              <TableBody>
                {hotelDetails.length > 0 ? 
                  hotelDetails.map((hotel, index) => (
                    <TableRow key={index}>
                      <TableCell sx={{ border: '1px solid #ddd', fontSize: '0.8rem' }}>{hotel.hotelName || 'N/A'}</TableCell>
                      <TableCell sx={{ border: '1px solid #ddd', fontSize: '0.8rem' }}>{hotel.city || 'N/A'}</TableCell>
                      <TableCell sx={{ border: '1px solid #ddd', fontSize: '0.8rem' }}>{hotel.totalRooms || 'N/A'}</TableCell>
                      <TableCell sx={{ border: '1px solid #ddd', fontSize: '0.8rem' }}>{formatDate(hotel.checkInDate || '')}</TableCell>
                      <TableCell sx={{ border: '1px solid #ddd', fontSize: '0.8rem' }}>{formatDate(hotel.checkOutDate || '')}</TableCell>
                      <TableCell sx={{ border: '1px solid #ddd', fontSize: '0.8rem' }}>{hotel.nights || currentSearchParams?.nights || 1}</TableCell>
                      <TableCell sx={{ border: '1px solid #ddd', fontSize: '0.8rem' }}>{hotel.roomType || 'Standard'}</TableCell>
                    </TableRow>
                  )) : 
                  hotels.map((hotel, index) => (
                    <TableRow key={index}>
                      <TableCell sx={{ border: '1px solid #ddd', fontSize: '0.8rem' }}>{hotel.hotel?.hotel?.hotelName || 'N/A'}</TableCell>
                      <TableCell sx={{ border: '1px solid #ddd', fontSize: '0.8rem' }}>{hotel.hotel?.city || 'N/A'}</TableCell>
                      <TableCell sx={{ border: '1px solid #ddd', fontSize: '0.8rem' }}>{hotel.hotel?.booking?.totalRooms || 'N/A'}</TableCell>
                      <TableCell sx={{ border: '1px solid #ddd', fontSize: '0.8rem' }}>{formatDate(hotel.booking?.checkInDate || '')}</TableCell>
                      <TableCell sx={{ border: '1px solid #ddd', fontSize: '0.8rem' }}>{formatDate(hotel.booking?.checkOutDate || '')}</TableCell>
                      <TableCell sx={{ border: '1px solid #ddd', fontSize: '0.8rem' }}>{hotel.booking?.nights || currentSearchParams?.nights || 1}</TableCell>
                      <TableCell sx={{ border: '1px solid #ddd', fontSize: '0.8rem' }}>{hotel.booking?.roomType || hotel.room?.roomCategory || 'Standard'}</TableCell>
                    </TableRow>
                  ))
                }
              </TableBody>
            </Table>
          </Box>
        )}

        {/* Tours Section */}
        {plannerItems && plannerItems.length > 0 && plannerItems.some(item => item.tours) && (
          <Box className="tours-section" sx={{ mb: 3 }}>
            <Typography variant="h6" className="tours-section-title" sx={{ fontWeight: 'bold', mb: 2 }}> {hasHotels ? 'Activities' : 'Tours and Transfers'}</Typography>
            {plannerItems.filter(item => item.tours).map((item, index) => {
              const formattedDate = formatDate(item.dateObj ? item.dateObj.toString() : item.date);
              
              return (
                <Paper  key={index} className="day-container"  sx={{ mb: 2, overflow: 'hidden', border: '1px solid #e0e0e0',  borderRadius: 2,  pageBreakInside: 'avoid'}}  >
                  <Box sx={{  bgcolor: '#1976d2',   color: 'white',  p: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1.1rem', m: 0,marginLeft:'2rem' }}> DAY {index + 1} - {formattedDate} </Typography>
                  </Box>
                  
                  <Box sx={{ p: 2 }}>
                    <Typography sx={{  fontWeight: 'bold',  mb: 1.5, fontSize: '1rem', color: '#333'}}> • {item.tours?.name || item.tours?.details?.tour?.tourName || 'Tour Activity'}  </Typography>
                    
                    {(item.tours?.details?.tour?.eventDuration || item.tours?.eventDuration) && (
                      <Typography sx={{ mb: 1, fontSize: '0.9rem' }}>
                        <Typography component="span" sx={{ fontWeight: 'bold' }}>Duration:</Typography> {item.tours?.details?.tour?.eventDuration || item.tours?.eventDuration}
                      </Typography>
                    )}
                    <Box sx={{ mb: 1.5 }}>
                      <Typography sx={{ fontWeight: 'bold', fontSize: '0.9rem', mb: 0.5 }}>  Description: </Typography>
                      <Box>
                        {item.tours?.description ? renderDescriptionLines(item.tours.description) : 'No description available'}
                      </Box>
                    </Box>
                    
                    {/* {item.tours?.activities && item.tours.activities.length > 0 && (
                      <Box sx={{ mt: 1.5 }}>
                        <Typography sx={{ fontWeight: 'bold', fontSize: '1rem', mb: 1 }}> Activities </Typography>
                        <Box component="ul" sx={{ m: 0, pl: 3 }}>
                          {item.tours.activities.map((activity, actIndex) => (<Typography key={actIndex} component="li" sx={{ fontSize: '0.9rem', mb: 0.5 }}> {activity.name}  </Typography>  ))}
                        </Box>
                      </Box>
                    )} */}
                    {((item.tours?.selectedActivities && Object.keys(item.tours.selectedActivities).length > 0) || 
  (item.tours?.activities && item.tours.activities.length > 0)) && (
  <Box sx={{ mt: 1.5 }}>
    <Typography sx={{ fontWeight: 'bold', fontSize: '1rem', mb: 1 }}>
      Activities
    </Typography>
    <Box component="ul" sx={{ m: 0, pl: 3 }}>
      {/* Handle selectedActivities object format */}
      {item.tours?.selectedActivities && 
        Object.entries(item.tours.selectedActivities)
          .filter(([key, value]) => value === true)
          .map(([activityName, selected], actIndex) => (
            <Typography key={`selected-${actIndex}`} component="li" sx={{ fontSize: '0.9rem', mb: 0.5 }}>
              {activityName.trim()}
            </Typography>
          ))}
      
      {/* Handle activities array format */}
      {item.tours?.activities && 
        item.tours.activities.map((activity, actIndex) => (
          <Typography key={`activity-${actIndex}`} component="li" sx={{ fontSize: '0.9rem', mb: 0.5 }}>
            {activity.name || activity}
          </Typography>
        ))}
    </Box>
  </Box>
)}

                  </Box>
                </Paper>
              );
            })}
          </Box>
        )}

        {/* Cost Summary */}
        <Paper className="cost-summary" sx={{bgcolor:'#2c3e50',color:'white'}}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 ,bgcolor:'#2c3e50',color:'white'}}> Cost Summary </Typography>
          <Box sx={{  display: 'grid', gridTemplateColumns: '1fr 1fr',  gap: 1,  fontSize: '0.9rem' }}>
            <Typography sx={{ fontWeight: 'bold' }}>Total Package Cost:</Typography>
            <Typography sx={{ textAlign: 'right', fontWeight: 'bold' }}>  {currency} {costs.finalAmount.toFixed(2)} </Typography>
            <Typography sx={{ fontWeight: 'bold' }}>Cost Per Person:</Typography>
            <Typography sx={{ textAlign: 'right', fontWeight: 'bold' }}> {currency} {((Number(costs.packageDetails?.totalPersons || totalPersons) > 0) ? (costs.finalAmount / Number(costs.packageDetails?.totalPersons || totalPersons)).toFixed(2) : costs.finalAmount.toFixed(2))}</Typography>
          </Box>
        </Paper>
      </Box>
    );
  };

  return handleInvoiceDownload;
};
