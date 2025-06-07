import React, { useState, useRef } from 'react';
import {Button,Box,Typography,CircularProgress, } from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { PackagePDFGeneratorProps } from '../../../../../types/types.ts';
import './PackagePDFGenerator.scss';

const PackagePDFGenerator: React.FC<PackagePDFGeneratorProps> = ({packageData,selectedHotelOption, selectedOptionIndex = 0,}) => {
const [isGenerating, setIsGenerating] = useState<boolean>(false);
const pdfRef = useRef<HTMLDivElement>(null);
if (!packageData?.packageDetails) {
return ( <Button disabled className="pdf-generator__button">Package data not available</Button>
);
}
const { packageDetails } = packageData;
const formatDate = (dateString: string): string => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {day: '2-digit',month: '2-digit', year: 'numeric' });};
    
const generateQuotationNumber = (): string => {
const timestamp = Date.now().toString().slice(-6);
const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
return `QT${timestamp}${random}`;};
const truncateText = (text: string, maxLength: number = 25): string => {
        if (!text) return '';
        return text.length > maxLength ? `${text.substring(0, maxLength - 3)}...` : text;};
const getValidityText = (): string => {
        if (packageDetails.validity?.startDate && packageDetails.validity?.endDate) {
        return `${formatDate(packageDetails.validity.startDate)} till ${formatDate(packageDetails.validity.endDate)}`;}
        return 'Validity dates not available';
    };
const getVehicleCount = (type: string, vehicle: string): string => {
        if (type === 'Ticket Only' || type === 'SIC' || vehicle === 'Train') {return '';}
        return '1';};
const packageTitle = packageDetails.packageName || 'Tour Package';
const firstHotel = selectedHotelOption?.hotels?.[0];
const totalNights = firstHotel?.nights || 0;
const quotationNo = generateQuotationNumber();
const startDate = packageDetails.travelDates?.start || '';
const endDate = packageDetails.travelDates?.end || '';
const destinations = packageDetails.destinations || [];
const primaryDestination = destinations[0] || firstHotel?.destination || '';
const passengerCounts = {
        adult: packageDetails.passengers?.adult || 0,
        child: packageDetails.passengers?.child || 0,
        infant: packageDetails.passengers?.infant || 0};
const totalPackageCost = selectedHotelOption?.totalPackageCost ||
        (selectedHotelOption?.perPersonCost || 0) * passengerCounts.adult;
const activities = packageDetails.activities || [];
const transfers = packageDetails.transfers || [];
const inclusions = packageDetails.inclusions || [];
const exclusions = packageDetails.exclusions || [];
const notes = packageDetails.importantNotes || [];
const itineraryData = packageDetails.itinerary || [];
const generatePDF = async (): Promise<void> => {
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
pdfRef.current.style.minHeight = '297mm';
pdfRef.current.style.zIndex = '-1000';
await new Promise(resolve => setTimeout(resolve, 200));
const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;
const canvas = await html2canvas(pdfRef.current, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#ffffff',
width: A4_WIDTH_PX, height: Math.max(pdfRef.current.scrollHeight, A4_HEIGHT_PX), logging: false,  imageTimeout: 0,  removeContainer: true,});
pdfRef.current.style.position = 'absolute';
pdfRef.current.style.top = '-10000px';
pdfRef.current.style.left = '-10000px';
pdfRef.current.style.visibility = 'hidden';
pdfRef.current.style.opacity = '0';
pdfRef.current.style.zIndex = '-9999';
const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm',format: 'a4'});
const pdfWidth = 200;
const pdfHeight = 297;
const margin = 10;
const contentWidth = pdfWidth - (margin * 2);
const contentHeight = pdfHeight - (margin * 2);
const imgData = canvas.toDataURL('image/jpeg', 0.8);
const imgWidth = canvas.width;
const imgHeight = canvas.height;
const ratio = contentWidth / (imgWidth * 0.264583);
const scaledHeight = imgHeight * 0.264583 * ratio;
if (scaledHeight <= contentHeight) { pdf.addImage(imgData, 'JPEG', margin, margin, contentWidth, scaledHeight);
} else {  const pageHeight = contentHeight;
            let yOffset = 0;
            let pageNum = 0;
            while (yOffset < scaledHeight) {
            if (pageNum > 0) {
                pdf.addPage();}
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
pdf.addImage(pageImgData, 'JPEG', margin, margin, contentWidth, actualHeight); }
yOffset += pageHeight; pageNum++;} }
const filename = `${packageTitle.replace(/[^a-zA-Z0-9]/g, '_')}_Quotation.pdf`; pdf.save(filename);} catch (error) {
console.error('PDF generation failed:', error);
alert('PDF generation failed. Please try again.');
} finally {setIsGenerating(false); } };
    
return (
        <Box className="pdf-generator">
        <Button startIcon={isGenerating ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />} onClick={generatePDF} disabled={isGenerating} className="pdf-generator__button"> {isGenerating ? 'Generating PDF...' : 'Download PDF'} </Button>
    
        <Box ref={pdfRef} className="pdf-content">
            {/* Header Section */}
            <Box className="pdf-header">
            <Box className="quotation-title">QUOTATION</Box>
            <Box className="package-title">{packageTitle}</Box>
            
            <Box className="company-info">
                <Box className="company-name">FLY DIVINE</Box>
                <Box className="company-type">TRAVELS</Box>
            </Box>
    
            <Box className="quotation-info">
                <Box className="left-info">
                <Box><strong>Quotation No:</strong> #{quotationNo}</Box>
                <Box><strong>Date:</strong> {packageDetails.quotationDate ? formatDate(packageDetails.quotationDate) : formatDate(new Date().toISOString())}</Box>
                </Box>
                <Box className="right-info">
                <Box><strong>Destination:</strong> {destinations.join(', ') || primaryDestination}</Box>
                <Box><strong>Validity:</strong> {getValidityText()}</Box>
                </Box>
            </Box>
    
            <Box className="customer-info">   <div><strong>To:</strong> Test 1</div> </Box>
    
            <Box className="travel-details">
                <Box className="travel-grid-header">
                <Box>Travel Date</Box>
                <Box>No. of Adult</Box>
                <Box>No. of Child</Box>
                <Box>No. of Infant</Box>
                </Box>
                <Box className="travel-grid-content">
                <Box> {startDate && endDate ? `${formatDate(startDate)} To ${formatDate(endDate)}` : 'Travel dates not specified'}</Box>
            <Box>{passengerCounts.adult}</Box>
            <Box>{passengerCounts.child}</Box>
            <Box>{passengerCounts.infant}</Box>
                </Box>
            </Box>
    
            <Box className="currency-notice">
                QUOTATION COSTS ARE PROVIDED IN [INR]
            </Box>
            </Box>
    
            {/* Hotel Tables Section */}
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
                    <th>STAY1</th>
                    </tr>
                </thead>
                <tbody>
                    {selectedHotelOption.hotels.map((hotel, index) => (
                    <tr key={index}>
                        <td>
                        {hotel.name || 'Hotel name not available'}
                        <div className="hotel-rating">4 Star</div>
                        </td>
                        <td>{hotel.destination || ''} - {hotel.nights || 0} Night</td>
                        <td>{hotel.roomType || 'Standard Room'}</td>
                        <td>{hotel.mealPlan || 'BB'}</td>
                        <td>DBL 1</td>
                        <td>
                        {hotel.stayDates && hotel.stayDates.length >= 2
                            ? `${formatDate(hotel.stayDates[0])} To ${formatDate(hotel.stayDates[hotel.stayDates.length - 1])}`
                            : startDate && endDate
                            ? `${formatDate(startDate)} To ${formatDate(endDate)}`
                            : 'Stay dates not available' }
                        </td>
                    </tr>
                    ))}
                    <tr className="total-row">
                    <td colSpan={5}>{selectedHotelOption.hotels.length} DBL Room :</td>
                    <td>Per Person INR {selectedHotelOption.perPersonCost || 0}/-</td>
                    </tr>
                </tbody>
                </table>
                
                <div className="package-cost-banner">TOTAL PACKAGE COST FOR HOTEL OPTION {selectedOptionIndex + 1} : INR {totalPackageCost}.00 /-
                </div>
            </Box>
            )}
    
            {/* Activities Section */}
            {activities.length > 0 && (
            <Box className="activities-section">
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
                    {activities.map((activity, index) => (
                    <tr key={index}>
                        <td>{truncateText(activity.name || '')}</td>
                        <td>{activity.type || ''}</td>
                        <td>{activity.vehicle || ''}</td>
                        <td>{getVehicleCount(activity.type || '', activity.vehicle || '')}</td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </Box>
            )}
    
            {/* Transfers Section */}
            {transfers.length > 0 && (
            <Box className="transfers-section">
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
                    {transfers.map((transfer, index) => (
                    <tr key={index}>
                        <td>{truncateText(transfer.route || '')}</td>
                        <td>{transfer.type || ''}</td>
                        <td>{transfer.vehicle || ''}</td>
                        <td>{getVehicleCount(transfer.type || '', transfer.vehicle || '')}</td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </Box>
            )}
    
            {/* Itinerary Section */}
            {itineraryData.length > 0 && (
            <Box className="itinerary-section">
                <Box className="section-title">DAY WISE ITINERARY DETAILS</Box>
                {itineraryData.map((dayData, index) => (
                <Box key={index} className="day-item">
                    <Box className="day-header">Day {dayData.day} {dayData.date ? `(${formatDate(dayData.date)})` : ''} : {dayData.title}</Box>
                    <Box className="day-details">{dayData.details} </Box>
                </Box>
                ))}
            </Box>
            )}
    
            {/* Inclusions Section */}
            {inclusions.length > 0 && (
            <Box className="inclusions-section">
                <Box className="section-header">Inclusion</Box>
                <ul>{inclusions.map((inclusion, index) => ( <li key={index}>{inclusion}</li> ))} </ul>
            </Box>
            )}
    
            {/* Exclusions Section */}
            {exclusions.length > 0 && (
            <Box className="exclusions-section">
                <Box className="section-header">Exclusion</Box>
                <ul>{exclusions.map((exclusion, index) => (
                    <li key={index}>{exclusion}</li>))}
                </ul>
            </Box>
            )}
    
            {/* Important Notes Section */}
            {notes.length > 0 && (
            <Box className="notes-section">
                <Box className="section-header">Important Notes</Box>
                <ul>{notes.map((note, index) => (
                    <li key={index}>{note}</li> ))}
                </ul></Box>
            )}
    
            {packageDetails.cancellationPolicy && (
            <Box className="cancellation-section">
                <Box className="section-header">Cancellation Policy</Box>
                <ul>
                <li><strong>Cancellations received 30 days prior to arrival date:</strong> {packageDetails.cancellationPolicy.before30Days || '10% of the total package amount'}</li>
                <li><strong>Cancellations received less than 30 days from arrival date:</strong> {packageDetails.cancellationPolicy.before21Days || '25% of the total package amount'}</li>
                <li><strong>Cancellations received less than 21 days from arrival date:</strong> {packageDetails.cancellationPolicy.before15Days || '50% of the total package amount'}</li>
                <li><strong>Cancellations received less than 15 days from arrival date:</strong> 100% of the total package amount</li>
                {packageDetails.cancellationPolicy.notes && (
                    <li className="policy-notes">{packageDetails.cancellationPolicy.notes}</li> )}
                </ul>
            </Box>
            )}
        </Box>
        </Box>
);
};

export default PackagePDFGenerator;

