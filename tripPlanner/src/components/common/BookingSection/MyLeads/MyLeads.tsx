import React, { useState } from 'react';
import { Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, Chip, Link, Button } from '@mui/material';
import { useGetLeadsQuery } from '../../../../api/TourAPI.tsx';
import './MyLeads.scss';
import LeadDetailsDialog from '../OnRequestBooking/LeadDetailsDialog.tsx';
import { useNavigate } from 'react-router-dom';
import { useLeadInvoiceDownload } from '../LeadInvoicePDF/LeadInvoicePDF.tsx';

const MyLeads: React.FC = () => {
  const { data: leads = [], isLoading, isError } = useGetLeadsQuery();
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState<boolean>(false);
  const navigate = useNavigate();
  const handleInvoiceDownload = useLeadInvoiceDownload();
  
  const getStatusChip = (status: string) => {
    if (status === 'confirmed') {
      return <Chip label="confirmed" color="success" />;
    } else {
      return <Chip label="confirm" color="warning" />;
    }
  };

  const handleLeadDetails = (lead: any) => {
    setSelectedLead(lead);
    setDetailsOpen(true);
  };
  
  const handleCloseDetails = () => {
    setDetailsOpen(false);
  };

  const getCorrectDestination = (lead) => {
    if (lead.currentSearchParams && lead.currentSearchParams.city) {
      return lead.currentSearchParams.city;
    }
    if (lead.clientDetails && lead.clientDetails.destinations) {
      return lead.clientDetails.destinations;
    }
    return lead.destinations || "N/A";
  };

  if (isLoading) return <Typography>Loading leads...</Typography>;
  if (isError) return <Typography>Error loading leads.</Typography>;

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h5" gutterBottom>My Leads</Typography>

      {isLoading ? (
        <Typography>Loading leads...</Typography>
      ) : isError ? (
        <Typography>Error loading leads.</Typography>
      ) : (
        <Table sx={{ bgcolor: 'white' }}>
          <TableHead sx={{ bgcolor: 'lightgrey' }}>
            <TableRow>
              <TableCell><strong>Reference No.</strong></TableCell>
              <TableCell><strong>Type</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Name</strong></TableCell>
              <TableCell><strong>Phone</strong></TableCell>
              <TableCell><strong>Creation Time</strong></TableCell>
              <TableCell><strong>Destinations</strong></TableCell>
              <TableCell><strong>From</strong></TableCell>
              <TableCell><strong>Travel Date</strong></TableCell>
              <TableCell><strong>Invoice</strong></TableCell>
              <TableCell><strong>Total Amount</strong></TableCell>
              <TableCell><strong>Pending Amount</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {leads && leads.length > 0 ? (
              leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>
                    <Button
                      sx={{ textTransform: 'none', fontWeight: 'bold', padding: 0, minWidth: 'auto', textAlign: 'left', color: '#0275d8'}} 
                      onClick={() => handleLeadDetails(lead)}>
                      {lead.referenceId}
                    </Button>
                  </TableCell>
                  <TableCell>{lead.options}</TableCell>
                  <TableCell className='status'>{getStatusChip(lead.status)}</TableCell>
                  <TableCell>{lead.clientName}</TableCell>
                  <TableCell>{lead.phone}</TableCell>
                  <TableCell>{new Date(lead.creationDate).toLocaleString()}</TableCell>
                  <TableCell>{getCorrectDestination(lead)}</TableCell>
                  <TableCell>{lead.from}</TableCell>
                  <TableCell>{new Date(lead.travelDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Link
                      component="button"
                      variant="body2"
                      onClick={() => handleInvoiceDownload(lead)}
                      sx={{ cursor: 'pointer', color: '#0275d8', textDecoration: 'none' }}
                    >
                      Invoice
                    </Link>
                  </TableCell>
                  <TableCell>{lead.totalAmount}</TableCell>
                  <TableCell>{lead.pendingAmount || '0'}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={12} align="center">
                  No leads available.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
      
      <LeadDetailsDialog
        open={detailsOpen}
        onClose={handleCloseDetails}
        selectedLead={selectedLead}
      />
    </Box>
  );
};

export default MyLeads;

