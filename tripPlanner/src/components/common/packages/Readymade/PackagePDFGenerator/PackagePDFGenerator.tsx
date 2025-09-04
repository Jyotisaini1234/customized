import React, { useState, useRef } from 'react';
import { Button, Box, CircularProgress, IconButton } from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './PackagePDFGenerator.scss';
import { HotelOption} from '../../../../../types/types.ts';
import { useGetLogoAsDataUrlQuery, useGetUserCompanyInfoQuery } from '../../../../../api/TourAPI.tsx';

const PackagePDFGenerator = ({ packageData}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);
  const userEmail = packageData?.tripDetails?.createdByEmail || packageData?.trip_details?.createdByEmail || localStorage.getItem('userEmail') ||  sessionStorage.getItem('userEmail') || '';
  const {data: companyInfo, isLoading: isLoadingCompany,  error: companyError  } = useGetUserCompanyInfoQuery(userEmail, { skip: !userEmail, });
  const filename = companyInfo?.logoPath?.split('/').pop();
  const { data: logoDataUrl } = useGetLogoAsDataUrlQuery(filename, { skip: !filename });
  if (!packageData) {return (<Button disabled className="pdf-generator__button"> Trip data not available  </Button> );}
  const getPackageDestination = (packageData) => {
    if (packageData.packageData?.originalPackageData?.destinations && Array.isArray(packageData.packageData.originalPackageData.destinations)) {return packageData.packageData.originalPackageData.destinations.join(', '); }
    return 'Destination Not Found';
  };

  const getPackageCountry = (packageData) => {
    if (packageData.tripDetails?.country) {return packageData.tripDetails.country;  }
    return 'Country Not Found';
  };

  const getPackageTotalAmount = (packageData) => { 
    if (packageData.pricing?.grandTotal) {return packageData.pricing.grandTotal;}
    return 0;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {  day: '2-digit', month: '2-digit',   year: 'numeric'}); 
  };

  const generateQuotationNumber = () => {
    const timestamp = Date.now().toString().slice(-6); 
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `QT${timestamp}${random}`;
  };

  const getPackageName = (packageData) => {
    const hotelNights: string[] = [];
    if (packageData.planner_items && Array.isArray(packageData.planner_items)) {
      const processedHotels = new Set();
      packageData.planner_items.forEach(item => {
        if (item.hotel) {
          const hotelKey = `${item.hotel.name}-${item.hotel.destination}`;
          if (!processedHotels.has(hotelKey)) {
            const nights = item.hotel.nights || 0;
            const destination = item.hotel.destination;
            if (nights > 0) {
              hotelNights.push(`${nights}N ${destination}`);
            }
            processedHotels.add(hotelKey);
          }
        }
      });
    }
    if (hotelNights.length === 0) {
      const totalNights = packageData.tripDetails?.nights || 0;
      const destination = packageData.tripDetails?.destination || 'Unknown';
      return `${totalNights}N ${destination}`;
    }
    return hotelNights.join(' + ');
  };

  const getRoomDetails = (packageData) => {
    let rooms = packageData.packageData?.originalPackageData?.tripDetails?.rooms;
    if (!Array.isArray(rooms)) {
      return [];
    }
    return rooms.map((room, index) => ({
      roomNumber: index + 1,
      adults: parseInt(room.adults) || 0,
      cwb: parseInt(room.cwb) || 0,
      cnb: parseInt(room.cnb) || 0,
      infants: parseInt(room.infants) || 0
    }));
  };

  const roomDetails = getRoomDetails(packageData);
  const calculateTotals = (roomDetails) => {
    return roomDetails.reduce((totals, room) => {
        totals.adult += room.adults;
        totals.child += (room.cwb + room.cnb);
        totals.infant += room.infants;
        return totals;
    }, { adult: 0, child: 0, infant: 0 });
  };
  const passengerCounts = calculateTotals(roomDetails);
  const transformData = () => {
    const { tripDetails, planner_items } = packageData;
    const hotelOptions: HotelOption[] = [];
    const hotelMap = new Map();
    if (planner_items && Array.isArray(planner_items)) {
      planner_items.forEach(item => {
        if (item.hotel) {
          const hotelKey = `${item.hotel.name}-${item.hotel.destination}`;
          if (!hotelMap.has(hotelKey)) {
            hotelMap.set(hotelKey, {
              name: item.hotel.name,
              destination: item.hotel.destination,
              nights: item.hotel.nights,
              price: item.hotel.price,
              rating: item.hotel.rating,
              roomType: item.hotel.roomType,
              mealPlan: item.hotel.mealPlan,
              checkInDate: item.hotel.checkInDate,
              checkOutDate: item.hotel.checkOutDate,
            });
          }
        }
      });
    }
    
    const hotels = Array.from(hotelMap.values());
    const grandTotal = getPackageTotalAmount(packageData);
    const perPersonCost = passengerCounts.adult > 0 ? grandTotal / passengerCounts.adult : 0;
    hotelOptions.push({hotels: hotels,totalPackageCost: grandTotal, perPersonCost: perPersonCost, cnbCost: 0,cwbCost: 0});
    let activities: any[] = [];
    if (packageData.activities && Array.isArray(packageData.activities)) {
      activities = [...packageData.activities];
    }
    if (packageData.packageData?.originalPackageData?.activities && Array.isArray(packageData.packageData.originalPackageData.activities)) {
      activities = [...activities, ...packageData.packageData.originalPackageData.activities];
    }
    if (planner_items && Array.isArray(planner_items)) {
      planner_items.forEach(item => {
        if (item.tours && item.tours.activities && Array.isArray(item.tours.activities)) {
          item.tours.activities.forEach(activity => {
            activities.push({
              name: activity.name || '',
              type: 'Activity',
              vehicle: activity.vehicle || '',
              description: activity.description || '',
              price: activity.price || 0,
              currency: activity.currency || 'USD'
            });
          });
        }
        if (item.activities && Array.isArray(item.activities)) {
          item.activities.forEach(activity => {
            activities.push({
              name: activity.name || '',
              type: activity.type || 'Activity',
              vehicle: activity.vehicle || '',
              description: activity.description || '',
              price: activity.price || 0,
              currency: activity.currency || 'USD'
            });
          });
        }
      });
    }
    const filteredActivities = activities.filter(activity => {
      const type = (activity.type || '').toLowerCase();
      const name = (activity.name || '').toLowerCase();
      return type === 'activity' || type === 'sightseeing' ||  type.includes('activity') ||  type.includes('sightseeing') || name.includes('activity') || name.includes('sightseeing') ||(type !== 'tour' && type !== 'tours');
    });
    const uniqueActivities = filteredActivities;
    
    let transfers: any[] = [];
    if (packageData.transfers && Array.isArray(packageData.transfers)) {
      transfers = [...packageData.transfers];
    }
    if (packageData.packageData?.originalPackageData?.transfers && Array.isArray(packageData.packageData.originalPackageData.transfers)) {
      transfers = [...transfers, ...packageData.packageData.originalPackageData.transfers];
    }
    if (planner_items && Array.isArray(planner_items)) {
      planner_items.forEach(item => {
        if (item.transfer) {
          transfers.push({
            route: item.transfer.route || '',
            type: item.transfer.type || '',
            vehicle: item.transfer.vehicle || '',
            description: item.transfer.description || '',
            price: item.transfer.price || 0
          });
        }
      });
    }
    const uniqueTransfers = transfers.filter((transfer, index, self) => 
      index === self.findIndex(t => t.route === transfer.route)
    );
    
    const itinerary = planner_items && Array.isArray(planner_items) ? planner_items.map(item => {
        let title = item.itinerary?.title || item.tours?.name || 'Untitled Day';
        let details = item.itinerary?.details || '';
        if (item.tours?.description) {details += item.tours.description;}
        return { day: item.dayNumber, date: item.date, title: title, details: details};
      }) : [];
      
    return {
      packageDetails: {
        packageName: getPackageName(packageData),
        destinations: [getPackageDestination(packageData)],
        country: getPackageCountry(packageData),
        totalNights: tripDetails?.nights,
        validity: packageData?.packageData?.originalPackageData?.validity || {
          startDate: '2025-01-01',  
          endDate: '2025-12-31' 
        },
        activities: uniqueActivities,
        transfers: uniqueTransfers,
        itinerary: itinerary,
        inclusions: packageData?.packageData?.originalPackageData?.inclusions || [
          'Breakfast included on all days in the hotel',
          'Accommodation, tours, and tickets as mentioned in the package'
        ],
        exclusions: packageData?.packageData?.originalPackageData?.exclusions || [
          ' GST (5%) & TCS (5%) excluded.',
          'Passport fees, immunization costs, city taxes, and local departure taxes.',
          'Optional enhancements like room/flight upgrades, local camera/video fees.',
          'Additional sightseeing, activities, or experiences outside the itinerary.',
          'Early check-in or late check-out (unless specified).',
          'Flights, excess baggage charges, tips, and other personal expenses (Unless mentioned)',
        ],
        importantNotes: packageData?.packageData?.originalPackageData?.importantNotes || [
          'This is just a quote and no reservations have been held yet or booking has not proceeded yet.',
          'The rooms & rates are subject to availability at the time of booking / confirmation.',
          'Hotel, sightseeing, meals, and transfer rates might change without prior notice until & unless the tour has been booked',
          'or confirmed from your end.',
          'The Change In Dates Will Attract Re-quote.',
          'Normal Hotel Check-In Time Is From 14.00 hours Onwards. & Check-Out Time Is At 12.00 Hrs.',
          'The Above Cost Does Not Include Any Kind Of surcharge, If applicable, During The Given Travel Period.',
          'Quotation Might Change Due To Currencies RoE Fluctuation During Confirmation & Booking Process. (For',
          'INternational Tours)',
          'We Are Not Responsible For Any Loss Of Your Valuables Like Mobiles, Bags, Jewellery & Money.',
        ],
        cancellationPolicy: packageData?.packageData?.originalPackageData?.cancellationPolicy
      },
      hotelOptions: hotelOptions,
      grandTotal: grandTotal
    };
  };

  const getVehicleCount = (type: string, vehicle: string) => {
    if (type === 'Ticket Only' || type === 'SIC' || vehicle === 'Train') {return '';}
    return '1';
  };
  const transformedData = transformData();
  const { packageDetails } = transformedData;
  const selectedHotelOption = transformedData.hotelOptions[0];
  const quotationNo = generateQuotationNumber();
  const packageTitle = packageDetails.packageName;
  const destinations = packageDetails.destinations;
  const country = packageDetails.country;
  const grandTotal = transformedData.grandTotal;
  
  const getValidityText = () => {
    if (packageDetails.validity?.startDate && packageDetails.validity?.endDate) { 
      return `${formatDate(packageDetails.validity.startDate)} till ${formatDate(packageDetails.validity.endDate)}`; 
    } 
    return 'Validity dates not available'; 
  };
  
  const generatePDF = async () => {
    if (!pdfRef.current) return; 
    setIsGenerating(true); 
    try {
      pdfRef.current.style.position = 'absolute';
      pdfRef.current.style.top = '-10000px';
      pdfRef.current.style.left = '-10000px';
      pdfRef.current.style.visibility = 'visible';
      pdfRef.current.style.opacity = '1';
      pdfRef.current.style.height = 'auto';
      pdfRef.current.style.overflow = 'visible';
      pdfRef.current.style.width = '200mm';
      pdfRef.current.style.minHeight = '300mm';
      pdfRef.current.style.zIndex = '-1000';
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const A4_WIDTH_PX = 794;
      const A4_HEIGHT_PX = 1123;
      const canvas = await html2canvas(pdfRef.current, { 
        scale: 2, 
        useCORS: true, 
        allowTaint: true,
        backgroundColor: '#ffffff', 
        width: A4_WIDTH_PX, 
        height: Math.max(pdfRef.current.scrollHeight, A4_HEIGHT_PX),  
        logging: false, 
        imageTimeout: 15000,
        removeContainer: true,
        ignoreElements: (element) => {
          if (element.tagName === 'IMG' && !element.complete) {
            return true;
          }
          return false;
        },
      });
      
      pdfRef.current.style.position = 'absolute';
      pdfRef.current.style.top = '-10000px';
      pdfRef.current.style.left = '-10000px';
      pdfRef.current.style.visibility = 'hidden';
      pdfRef.current.style.opacity = '0';
      pdfRef.current.style.zIndex = '-9999';
      const pdf = new jsPDF({orientation: 'portrait',unit: 'mm',  format: 'a4' });
      const pdfWidth = 200;
      const pdfHeight = 300;
      const margin = 10;
      const contentWidth = pdfWidth - (margin * 2);
      const contentHeight = pdfHeight - (margin * 2);
      const imgData = canvas.toDataURL('image/jpeg', 0.8);
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = contentWidth / (imgWidth * 0.264583);
      const scaledHeight = imgHeight * 0.264583 * ratio;
      if (scaledHeight <= contentHeight) {
        pdf.addImage(imgData, 'JPEG', margin, margin, contentWidth, scaledHeight);
      } else {
        const pageHeight = contentHeight;
        let yOffset = 0;
        let pageNum = 0;
        while (yOffset < scaledHeight) {
          if (pageNum > 0) {  pdf.addPage(); }
          const sourceY = (yOffset / scaledHeight) * imgHeight;
          const sourceHeight = Math.min((pageHeight / scaledHeight) * imgHeight, imgHeight - sourceY);
          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = imgWidth;
          pageCanvas.height = sourceHeight;
          const pageCtx = pageCanvas.getContext('2d');
          if (pageCtx) {
            pageCtx.drawImage(canvas, 0, sourceY, imgWidth, sourceHeight, 0, 0, imgWidth, sourceHeight);
            const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.8);
            const actualHeight = Math.min(pageHeight, scaledHeight - yOffset);
            pdf.addImage(pageImgData, 'JPEG', margin, margin, contentWidth, actualHeight);
          }
          yOffset += pageHeight;
          pageNum++;
        }
      }
      const filename = `${packageTitle.replace(/[^a-zA-Z0-9]/g, '_')}_Quotation.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('PDF generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Box className="pdf-generator">
      <IconButton sx={{ color:'black'}}  onClick={generatePDF} disabled={isGenerating}className="pdf-generator__button" title={isGenerating ? 'Generating PDF...' : 'Download PDF'}>{isGenerating ? <CircularProgress size={20}  /> : <DownloadIcon />} </IconButton>
      <Box ref={pdfRef} className="pdf-content">
        <Box className="pdf-header">
          <Box className="quotation-title">QUOTATION</Box>
          <Box className="package-title">{packageTitle}</Box>
          <Box className="company-info">
          {logoDataUrl && ( <img src={logoDataUrl} alt="Company Logo"  style={{ maxWidth: '120px', maxHeight: '80px', objectFit: 'contain' }} />)}
            <Box className="company-name"> {companyInfo?.companyName}</Box>
            <Box className="company-type">TRAVELS</Box>
          </Box>
          <Box className="quotation-info">
            <Box className="left-info">
              <Box><strong>Quotation No:</strong> #{quotationNo}</Box>
              <Box><strong>Date:</strong> {formatDate(new Date().toISOString())}</Box>
            </Box>
            <Box className="right-info">
              <Box><strong>Destination:</strong> {destinations.join(', ')}</Box>
              <Box><strong>Country:</strong> {country}</Box>
              <Box><strong>Validity:</strong> {getValidityText()}</Box>
            </Box>
          </Box>
          
          <Box className="customer-info"> 
            <div><strong>To:</strong> Test 1</div>
          </Box>
          
          <Box className="travel-details">
            <Box className="travel-grid-header">
              <Box>No. of Adult</Box>
              <Box>No. of Child</Box>
              <Box>No. of Infant</Box>
            </Box>
            <Box className="travel-grid-content">
              <Box>{passengerCounts.adult || 0}</Box>
              <Box>{passengerCounts.child || 0}</Box>
              <Box>{passengerCounts.infant || 0}</Box>
            </Box>
          </Box>
          
          <Box className="currency-notice">  
            QUOTATION COSTS ARE PROVIDED [USD]
          </Box>
        </Box>
        
        {selectedHotelOption?.hotels && selectedHotelOption.hotels.length > 0 && (
          <Box className="hotel-section">
            <table className="hotel-table">
              <thead>
                <tr>
                  <th>HOTEL NAME</th>
                  <th>DESTINATION</th>
                  <th>ROOM TYPE</th>
                  <th>MEAL PLAN</th>
                  <th>ROOMS</th>
                  <th>CHECK-IN</th>
                  <th>CHECK-OUT</th>
                  <th>Night</th>
                </tr>
              </thead>
              <tbody>
                {selectedHotelOption.hotels.map((hotel: any, index: number) => (
                  <tr key={index}>
                    <td> 
                      {hotel.name }
                      <div className="hotel-rating">{hotel.rating} Star</div> 
                    </td>
                    <td> {hotel.destination }</td>
                    <td>{hotel.roomType}</td>
                    <td>{hotel.mealPlan}</td>
                    <td>DBL 1</td>
                    <td>{formatDate(hotel.checkInDate)}</td>
                    <td>{formatDate(hotel.checkOutDate)}</td>
                    <td>{hotel.nights || 0}N</td>
                  </tr>
                ))}
                <tr className="total-row">
                  <td colSpan={7}>1 DBL Room :</td>
                  <td>Per Person USD {(selectedHotelOption.perPersonCost || 0).toFixed(2)}/-</td>
                </tr>
              </tbody>
            </table>
            <div className="package-cost-banner"> 
              TOTAL PACKAGE COST FOR HOTEL OPTION 1 : USD {(grandTotal || 0).toFixed(2)} 
            </div>
          </Box>
        )}
        
        {packageDetails.activities && packageDetails.activities.length > 0 && (
          <Box className="activities-section">
            <Box className="section-title">SIGHTSEEING / ACTIVITIES</Box>
            <table className="activities-table">
              <thead>
                <tr>
                  <th>SIGHTSEEING / ACTIVITY</th>
                  <th>TYPE</th>
                  <th>VEHICLE</th>
                  <th>NO. OF VEHICLE</th>
                </tr>
              </thead>
              <tbody>
                {packageDetails.activities.map((activity: any, index: number) => (
                  <tr key={index}>
                    <td>{activity.name || ''}</td>
                    <td>{activity.type || ''}</td>
                    <td>{activity.vehicle || ''}</td>
                    <td>{getVehicleCount(activity.type || '', activity.vehicle || '')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        )}
        
        {packageDetails.transfers && packageDetails.transfers.length > 0 && (
          <Box className="transfers-section">
            <Box className="section-title">TRANSFERS</Box>
            <table className="transfers-table">
              <thead>
                <tr>
                  <th>TRANSFER</th>
                  <th>TYPE</th>
                  <th>VEHICLE</th>
                  <th>NO. OF VEHICLE</th>
                </tr>
              </thead>
              <tbody>
                {packageDetails.transfers.map((transfer: any, index: number) => (
                  <tr key={index}>
                    <td>{transfer.route || ''}</td>
                    <td>{transfer.type || ''}</td>
                    <td>{transfer.vehicle || ''}</td>
                    <td>{getVehicleCount(transfer.type || '', transfer.vehicle || '')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        )}

        {packageDetails.itinerary && packageDetails.itinerary.length > 0 && (
          <Box className="itinerary-section">
            <Box className="section-title">DAY WISE ITINERARY DETAILS</Box>
            {packageDetails.itinerary.map((dayData: any, index: number) => (
              <Box key={index} className="day-item" sx={{textAlign: 'left', alignItems: 'flex-start'}}>
                <Box className="day-header" sx={{textAlign: 'left', marginLeft: '0'}}> 
                  Day {dayData.day} {dayData.date ? `(${formatDate(dayData.date)})` : ''} : {dayData.title}
                </Box>
                <Box className="day-details" sx={{textAlign: 'left', marginLeft: '0'}}>
                  {dayData.details}
                </Box>
              </Box>
            ))}
          </Box>
        )}

        {packageDetails.inclusions && packageDetails.inclusions.length > 0 && (
          <Box className="inclusions-section">
            <Box className="section-header">Inclusion</Box>
            <ul>
              {packageDetails.inclusions.map((inclusion: string, index: number) => (
                <li key={index}>{inclusion}</li>
              ))}
            </ul>
          </Box>
        )}

        {packageDetails.exclusions && packageDetails.exclusions.length > 0 && (
          <Box className="exclusions-section">
            <Box className="section-header">Exclusion</Box>
            <ul> 
              {packageDetails.exclusions.map((exclusion: string, index: number) => ( 
                <li key={index}>{exclusion}</li> 
              ))} 
            </ul>
          </Box>
        )}

        {packageDetails.importantNotes && packageDetails.importantNotes.length > 0 && (
          <Box className="notes-section">
            <Box className="section-header">Important Notes</Box>
            <ul> 
              {packageDetails.importantNotes.map((note: string, index: number) => ( 
                <li key={index}>{note}</li> 
              ))}
            </ul>
          </Box>
        )}

        {packageDetails.cancellationPolicy && (
          <Box className="cancellation-section">
            <Box className="section-header">Cancellation Policy</Box>
            <ul>
              <li>
                <strong>Cancellations received 30 days prior to arrival date:</strong> {packageDetails.cancellationPolicy.before30Days || '10%'} of the total package amount
              </li>
              <li>
                <strong>Cancellations received less than 21 days from arrival date:</strong> {packageDetails.cancellationPolicy.before21Days || '50%'} of the total package amount
              </li>
              <li>
                <strong>Cancellations received less than 15 days from arrival date:</strong> {packageDetails.cancellationPolicy.before15Days || '100%'} of the total package amount
              </li>
              {packageDetails.cancellationPolicy.nonRefundablePeriods && (
                <li>
                  <strong>Non-refundable periods:</strong> {packageDetails.cancellationPolicy.nonRefundablePeriods}
                </li>
              )}
              {packageDetails.cancellationPolicy.notes && ( 
                <li className="policy-notes">
                  <strong>Note:</strong> {packageDetails.cancellationPolicy.notes}
                </li> 
              )}
            </ul>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default PackagePDFGenerator;
