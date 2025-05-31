import { useState } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Box, Container, Grid, Typography, Table, TableHead, TableBody, TableRow, TableCell } from '@mui/material';
import { Lead, LeadDetail, LeadInvoiceData, SearchParams } from '../../../../types/types';
import './LeadInvoicePDF.scss';

// Hook for handling invoice download
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
        currentSearchParams: lead.currentSearchParams || { nights: lead.nights },
        hotels: lead.hotels || [],
        hotelDetails: lead.hotelDetails || [],
        plannerItems: lead.plannerItems || [],
        costs: lead.costs || { finalAmount: lead.totalAmount, packageDetails: { totalPersons: Number(lead.totalPersons) || 1 } },
        currency: lead.currency || 'USD',
        totalPersons: lead.totalPersons || 1
      };

      // Generate PDF
      await generatePDF(invoiceData);
    } catch (error) {
      console.error('Error generating invoice PDF:', error);
      alert('Failed to generate invoice. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const generatePDF = async (invoiceData: LeadInvoiceData) => {
    // Create a temporary div to render the invoice content
    const tempDiv = document.createElement('div');
    tempDiv.id = 'temp-invoice-content';
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.width = '49.625rem'; // A4 width in rems (794px ≈ 49.625rem)
    tempDiv.innerHTML = renderInvoiceContent(invoiceData);
    
    document.body.appendChild(tempDiv);

    try {
      // Create a PDF with compression settings
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      // Set font
      pdf.setFont('helvetica');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const contentWidth = pageWidth - 20; // 10mm margins on each side
      const footerText = "This invoice is generated for your reference. Please contact us for any queries.";

      // Get all the sections to render
      const sections = [
        document.querySelector('#temp-invoice-content .invoice-header'),
        document.querySelector('#temp-invoice-content .invoice-reference'),
        document.querySelector('#temp-invoice-content .client-details-section'),
        document.querySelector('#temp-invoice-content .hotel-details-section'),
        document.querySelector('#temp-invoice-content .activities-section'),
        document.querySelector('#temp-invoice-content .cost-summary')
      ].filter(Boolean) as HTMLElement[];

      // Function to capture and add elements to PDF
      const captureAndAddElement = async (element: HTMLElement, yPosition: number): Promise<number> => {
        if (!element) return yPosition;
        
        return new Promise((resolve) => {
          html2canvas(element, {
            scale: 1.25, // Reduced scale for smaller file size
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            imageTimeout: 2000,
            allowTaint: false
          }).then(canvas => {
            // Optimize the canvas with higher compression for size reduction
            const imgData = canvas.toDataURL('image/jpeg', 0.75); // Higher compression
            const imgWidth = contentWidth;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            pdf.addImage(
              imgData, 
              'JPEG', 
              10, // x position
              yPosition, // y position
              imgWidth, 
              imgHeight
            );
            // Reduced spacing between sections
            resolve(yPosition + imgHeight + 1); // Reduced from +2 to +1
          });
        });
      };
      
      let yPosition = 10;
      let currentPage = 1;

      // Add each section to the PDF with minimal spacing
      for (const section of sections) {
        if (section) {
          // Check if content fits on current page
          const tempCanvas = await html2canvas(section, {
            scale: 1.25,
            logging: false,
            backgroundColor: '#ffffff'
          });
          const imgWidth = contentWidth;
          const imgHeight = (tempCanvas.height * imgWidth) / tempCanvas.width;
          
          // Reduced page break threshold to maximize space usage
          if (yPosition + imgHeight > pageHeight - 15) { // Reduced from -20 to -15
            pdf.addPage();
            currentPage++;
            yPosition = 10;
          }
          
          yPosition = await captureAndAddElement(section, yPosition);
        }
      }

      // Add page numbers and footer
      const totalPages = currentPage;
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        pdf.text(footerText, pageWidth / 2, pageHeight - 15, { align: 'center' });
        pdf.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      }

      // Save the PDF with compression
      const fileName = `Invoice_${invoiceData.bookingRef}.pdf`;
      pdf.save(fileName);
    } finally {
      // Clean up the temporary div
      document.body.removeChild(tempDiv);
    }
  };

  // Render invoice content using React-style JSX
  const renderInvoiceContent = (invoiceData: LeadInvoiceData): string => {
    const { 
      bookingRef, 
      generateDate, 
      clientDetails, 
      currentSearchParams,
      hotels = [], 
      hotelDetails = [],
      plannerItems = [],
      costs = { finalAmount: 0, packageDetails: { totalPersons: 0 } },
      currency = 'USD',
      totalPersons = 1
    } = invoiceData;

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
    
    return `
      <div class="invoice-container" style="margin: 0; padding: 0;">
        <div class="invoice-header">
          <h1 class="invoice-header-title">AZERBAIJAN TOUR PACKAGE</h1>
        </div>
        
        <div class="invoice-reference" style="margin-bottom: 0.5rem;">
          <div class="invoice-reference-content">
            <div class="booking-ref">
              <span class="bold-text">INVOICE NO:</span> ${bookingRef}
              <div class="generated-date">Generated on: ${generateDate}</div>
            </div>
          </div>
        </div>
        
        <div class="hotel-details-section" style="margin-bottom: 0.5rem;">
          <h2 class="invoice-section-title" style="margin: 0.5rem 0;">Hotel Details</h2>
          <table class="invoice-table" style="margin-bottom: 0.5rem;">
            <thead>
              <tr>
                <th>Hotel Name</th>
                <th>City</th>
                <th>Total Rooms</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Nights</th>
                <th>Room Type</th>
                <th>Meal Plan</th>
                <th>Price</th>
                ${hotelDetails.length > 0 && hotelDetails[0].starRating ? '<th>Rating</th>' : ''}
              </tr>
            </thead>
            <tbody>
              ${hotelDetails.length > 0 ? 
                hotelDetails.map((hotel) => `
                  <tr>
                    <td>${hotel.hotelName || 'N/A'}</td>
                    <td>${hotel.city || 'N/A'}</td>
                    <td>${hotel.totalRooms || 'N/A'}</td>
                    <td>${formatDate(hotel.checkInDate || '')}</td>
                    <td>${formatDate(hotel.checkOutDate || '')}</td>
                    <td>${hotel.nights || currentSearchParams?.nights || 1}</td>
                    <td>${hotel.roomType || 'Standard'}</td>
                    <td>${hotel.mealPlan || 'BB'}</td>
                    <td>${hotel.currency || currency} ${hotel.totalPrice || 0}</td>
                    ${hotel.starRating ? `<td>${hotel.starRating}</td>` : ''}
                  </tr>
                `).join('') : 
                hotels.map((hotel) => `
                  <tr>
                    <td>${hotel.hotel?.hotel?.hotelName || 'N/A'}</td>
                    <td>${hotel.hotel?.city || 'N/A'}</td>
                      <td>${hotel.hotel?.booking?.totalRooms || 'N/A'}</td>
                    <td>${formatDate(hotel.booking?.checkInDate || '')}</td>
                    <td>${formatDate(hotel.booking?.checkOutDate || '')}</td>
                    <td>${hotel.booking?.nights || currentSearchParams?.nights || 1}</td>
                    <td>${hotel.booking?.roomType || hotel.room?.roomCategory || 'Standard'}</td>
                    <td>${hotel.booking?.mealPlan || hotel.room?.mealPlan || 'BB'}</td>
                    <td>${currency} ${hotel.booking?.totalPrice || 0}</td>
                  </tr>
                `).join('')
              }
            </tbody>
          </table>
        </div>
        
        ${plannerItems && plannerItems.length > 0 && plannerItems.some(item => item.tours) ? `
          <div class="activities-section" style="margin-bottom: 0.5rem;">
            <h2 class="section-title" style="margin: 0.5rem 0;">Activities</h2>
            
            ${plannerItems.filter(item => item.tours).map((item, index) => {
              const formattedDate = formatDate(item.dateObj ? item.dateObj.toString() : item.date);
              return `
              <div class="day-container" style="margin-bottom: 0.5rem;">
                <div class="day-header" style="background-color: #1976d2; color: white; padding: 0.25rem 0.5rem; border-radius: 4px;">
                  <h3 class="day-title" style="margin: 0.25rem 0; color: white;">DAY ${index + 1} - ${formattedDate}</h3>
                </div>
                
                <div class="activity-container" style="padding: 0.5rem; margin-top: 0.25rem;">
                  <div class="activity-title" style="font-weight: bold; margin-bottom: 0.25rem;">• ${item.tours?.name || item.tours?.details?.tour?.tourName || 'Tour Activity'}</div>
                  
                  ${(item.tours?.details?.tour?.eventDuration || item.tours?.eventDuration) ? `
                  <div class="activity-detail" style="color: black; margin-bottom: 0.25rem;">
                    <span class="detail-label" style="font-weight: bold;">Duration:</span> ${item.tours?.details?.tour?.eventDuration || item.tours?.eventDuration}
                  </div>` : ''}
                  
                  <div class="activity-detail" style="margin-bottom: 0.25rem;">
                    <span class="detail-label" style="font-weight: bold;">City:</span> 
                    ${item.tours?.city || 'N/A'}
                  </div>
                  
                  <div class="activity-detail" style="margin-bottom: 0.25rem;">
                    <span class="detail-label" style="font-weight: bold;">Description:</span> 
                    ${item.tours?.description ? 
                      formatDescription(item.tours.description)
                        .split('\n')
                        .map((line, i) => {
                          if (line.trim().startsWith('*')) {
                            const textContent = line.replace(/^\*\s+/, '');
                            return `
                            <div class="description-line bullet-point" style="margin: 0.125rem 0;">
                              <span class="bullet">* </span>
                              <span class="bullet-content">${textContent}</span>
                            </div>`;
                          } else {
                            return `<div class="description-line" style="margin: 0.125rem 0;">${line}</div>`;
                          }
                        }).join('') 
                      : 'No description available'}
                  </div>
                  
                  ${item.tours?.activities && item.tours.activities.length > 0 ? `
                  <div class="selected-activities" style="font-weight: 800; margin-top: 0.25rem;">
                    <div style="font-size: 1rem; margin-bottom: 0.25rem;">Activities</div>
                    <ul class="activities-list" style="margin: 0; padding-left: 1.5rem;">
                      ${item.tours.activities.map((activity, actIndex) => `
                      <li class="activity-item" style="margin: 0.125rem 0;">${activity.name}</li>
                      `).join('')}
                    </ul>
                  </div>` : ''}
                </div>
              </div>
              `;
              
            }).join('')}
          </div>
        ` : ''}
        
        <div class="cost-summary" style="margin-top: 0.5rem;">
          <h2 class="cost-summary-title" style="margin: 0.5rem 0;">Cost Summary</h2>
          <div class="cost-summary-grid">
            <div class="cost-label">Total Package Cost:</div>
            <div class="cost-value">${currency} ${costs.finalAmount.toFixed(2)}</div>
            
            <div class="cost-label">Cost Per Person:</div>
            <div class="cost-value">
              ${currency} ${((Number(costs.packageDetails?.totalPersons || totalPersons) > 0) ? 
                (costs.finalAmount / Number(costs.packageDetails?.totalPersons || totalPersons)).toFixed(2) : 
                costs.finalAmount.toFixed(2))}
            </div>
          </div>
        </div>
      </div>
    `;
  };

  return handleInvoiceDownload;
};
