import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, TextField } from '@mui/material';
import './ConfirmedBooking.scss';
import { useGetAllPackageDataQuery } from '../../../../api/TourAPI.tsx';
import PackagePDFGenerator from '../../packages/Readymade/PackagePDFGenerator/PackagePDFGenerator.tsx';

const ConfirmedBooking: React.FC = () => {
const [packages, setPackages] = useState<any[]>([]);
const [filteredPackages, setFilteredPackages] = useState<any[]>([]);
const [searchParams, setSearchParams] = useState({ refNo: '',  packageName: '', destination: '',  country: '',totalAmount: '',createdDate: ''});
const { data: apiPackages = [], error: packagesError, isLoading: packagesLoading } = useGetAllPackageDataQuery();

useEffect(() => {
    if (apiPackages && apiPackages.length > 0) {
        setPackages(apiPackages);
        setFilteredPackages(apiPackages);
    } else {
        setPackages([]);
        setFilteredPackages([]);
    }
}, [apiPackages]);

useEffect(() => {
    filterPackages();
}, [searchParams, packages]);

const filterPackages = () => {
    let filtered = [...packages];
    if (searchParams.refNo) {
        filtered = filtered.filter(item => {
            const refNumber = item._id || item.packageId || '';
            return refNumber.toLowerCase().includes(searchParams.refNo.toLowerCase());
        });
    }
    if (searchParams.packageName) {
        filtered = filtered.filter(item => {
            const packageName = getPackageName(item);
            return packageName.toLowerCase().includes(searchParams.packageName.toLowerCase());
        });
    }
    if (searchParams.destination) {
        filtered = filtered.filter(item => {
            const destination = getPackageDestination(item);
            return destination.toLowerCase().includes(searchParams.destination.toLowerCase());
        });
    }

    if (searchParams.country) {
        filtered = filtered.filter(item => {
            const country = getPackageCountry(item);
            return country.toLowerCase().includes(searchParams.country.toLowerCase());
        });
    }

    if (searchParams.totalAmount) {
        filtered = filtered.filter(item => {
            const totalAmount = getPackageTotalAmount(item);
            return totalAmount.includes(searchParams.totalAmount);
        });
    }

    if (searchParams.createdDate) {
        filtered = filtered.filter(item => {
            const createdDate = getPackageCreatedDate(item);
            return createdDate.includes(searchParams.createdDate);
        });
    }
    setFilteredPackages(filtered);
};



const getPackageName = (packageData: any) => {
    const uniqueHotels = new Map();
    if (packageData.plannerItems && Array.isArray(packageData.plannerItems)) {
        packageData.plannerItems.forEach((item, index) => {
            if (item.hotel && item.hotel.destination && item.hotel.nights) {
                const city = item.hotel.destination;
                const nights = item.hotel.nights;
                const hotelKey = `${item.hotel.name}-${city}`;
                if (!uniqueHotels.has(hotelKey)) {  uniqueHotels.set(hotelKey, { city: city,  nights: nights, hotelName: item.hotel.name}); }
            }
        });
    }
    const hotelData = Array.from(uniqueHotels.values());
    if (hotelData.length > 0) {
        const packageParts = hotelData.map(hotel => `${hotel.nights}N ${hotel.city}`);
        const result = packageParts.join(' + ');
        return result;
    }
    return "No Package";
};

const getPackageDestination = (packageData: any) => {
    const uniqueDestinations = new Set();
    if (packageData.plannerItems && Array.isArray(packageData.plannerItems)) {
        packageData.plannerItems.forEach((item) => {
        if (item.hotel && item.hotel.destination) { uniqueDestinations.add(item.hotel.destination); }
        });
    }
    const destinationsArray = Array.from(uniqueDestinations);
    if (destinationsArray.length > 0) { return destinationsArray.join(', '); }
    return 'Destination Not Found';
};

const getPackageCountry = (packageData: any) => {
    if (packageData.tripDetails?.country) { return packageData.tripDetails.country; }
    return 'Country Not Found';
};

const getPackageTotalAmount = (packageData: any) => {
    if (packageData.pricing?.grandTotal) {return packageData.pricing.grandTotal.toString();}
    return "0";
};

const getPackageCreatedDate = (packageData: any) => {
    if (packageData.metadata?.createdAt) { return formatDate(packageData.metadata.createdAt); }
    return 'Date Not Found';
};

const formatDate = (dateTime: any) => {
    if (!dateTime) return "-";
    let date;
    if (typeof dateTime === 'string') {date = new Date(dateTime); } 
    else {  date = dateTime; } 
    if (isNaN(date.getTime())) { return "-";}
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
};

const renderPackageRow = (packageItem: any, index: number) => {
    return (
        <TableRow key={index} className="package-row">
            <TableCell sx={{ border: '1px solid rgba(224, 224, 224, 1)' }}>
                {packageItem ? (
                    <PackagePDFGenerator
                        packageData={{
                            trip_details: {
                                destination: packageItem.destination || getPackageDestination(packageItem),
                                checkInDate: packageItem.startDate || packageItem.checkIn,
                                checkOutDate: packageItem.endDate || packageItem.checkOut,
                                adults: packageItem.adults || packageItem.trip_details?.adults || 1,
                                children: packageItem.children || packageItem.trip_details?.children || 0,
                                infants: packageItem.infants || packageItem.trip_details?.infants || 0,
                                country: packageItem.country || getPackageCountry(packageItem),
                                nights: packageItem.nights || packageItem.trip_details?.nights || 0,
                                totalDays: packageItem.totalDays || packageItem.trip_details?.totalDays || 0,
                                rooms: packageItem.rooms || [],
                                packageType: packageItem.packageType || '',
                                currency: packageItem.currency || 'USD',
                                status: packageItem.status || ''
                            },
                            packageData: {
                                packageName: packageItem.packageName || packageItem.name || getPackageName(packageItem),
                                originalPackageData: {
                                    destinations: packageItem.destinations || [packageItem.destination || getPackageDestination(packageItem)],
                                    ...packageItem
                                }
                            },
                            planner_items: packageItem.itinerary || packageItem.plannerItems || packageItem.planner_items || [],
                            pricing: {
                                grandTotal: packageItem.totalCost || packageItem.price || packageItem.pricing?.grandTotal || packageItem.totalAmount || 0,
                                marginTotal: packageItem.marginTotal || '',
                                breakdown: {
                                    hotelsCost: packageItem.hotelsCost || 0,
                                    activitiesCost: packageItem.activitiesCost || 0,
                                    transfersCost: packageItem.transfersCost || 0,
                                    itineraryCost: packageItem.itineraryCost || 0
                                }
                            },
                            totalAmount: packageItem.totalCost || packageItem.price || packageItem.pricing?.grandTotal || packageItem.totalAmount || 0,
                            price: packageItem.totalCost || packageItem.price || packageItem.pricing?.grandTotal || packageItem.totalAmount || 0,
                            tripDetails: {country: packageItem.country || getPackageCountry(packageItem) }
                        }}
                    />
                ) : (<span>No data available</span>
                )}
            </TableCell>
            <TableCell sx={{ border: '1px solid rgba(224, 224, 224, 1)' }}> {getPackageName(packageItem)} </TableCell>
            <TableCell sx={{ border: '1px solid rgba(224, 224, 224, 1)' }}> {getPackageDestination(packageItem)} </TableCell>
            <TableCell sx={{ border: '1px solid rgba(224, 224, 224, 1)' }}> {getPackageCountry(packageItem)} </TableCell>
            <TableCell sx={{ border: '1px solid rgba(224, 224, 224, 1)' }}> USD {getPackageTotalAmount(packageItem)} </TableCell>
            <TableCell sx={{ border: '1px solid rgba(224, 224, 224, 1)' }}>{getPackageCreatedDate(packageItem)}</TableCell>
        </TableRow>
    );
};

return (
    <Box className="confirmed-booking-container">
        <Box className='payment_confirm'><Typography variant="h4" className="page-title"> All Packages </Typography> </Box>
        <Paper className="search-container">
            <TableContainer className="bookings-table-container">
                <Table stickyHeader className="bookings-table" sx={{ border: '1px solid rgba(224, 224, 224, 1)' }}>
                    <TableHead>
                        <TableRow>
                            <TableCell className="table-header">Download Package</TableCell>
                            <TableCell className="table-header">Package Name</TableCell>
                            <TableCell className="table-header">Destination</TableCell>
                            <TableCell className="table-header">Country</TableCell>
                            <TableCell className="table-header">Total Amount</TableCell>
                            <TableCell className="table-header">Created Date</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredPackages.length > 0 ? (filteredPackages.map((packageItem: any, index: number) =>  renderPackageRow(packageItem, index)  )
                        ) : (
                        <TableRow><TableCell colSpan={6} align="center" sx={{border: '1px solid rgba(224, 224, 224, 1)' }}>  No packages available </TableCell>   </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    </Box>
);
};

export default ConfirmedBooking;