import React from 'react';
import { Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, Chip, Link } from '@mui/material';
import { useGetLeadsQuery } from '../../../../api/TourAPI.tsx';



const MyLeads: React.FC = () => {
  const { data: leads = [], isLoading, isError } = useGetLeadsQuery();

  const getStatusChip = (status: string) => {
    if (status === 'Lead Converted') {
      return <Chip label="Lead Converted" color="success" />;
    } else {
      return <Chip label="Quote Created" color="warning" />;
    }
  };

  if (isLoading) return <Typography>Loading leads...</Typography>;
  if (isError) return <Typography>Error loading leads.</Typography>;

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h5" gutterBottom>My Leads</Typography>

      {leads.length === 0 ? (
        <Typography>No leads available.</Typography>
      ) : (
        <Table sx={{ bgcolor: 'white' }}>
          <TableHead sx={{ bgcolor: 'lightgrey' }}>
            <TableRow>
              <TableCell><strong>Customer Name</strong></TableCell>
              <TableCell><strong>Phone</strong></TableCell>
              <TableCell><strong>Creation Time</strong></TableCell>
              <TableCell><strong>Destinations</strong></TableCell>
              <TableCell><strong>From</strong></TableCell>
              <TableCell><strong>Travel Date</strong></TableCell>
              <TableCell><strong>Nights</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Latest Quotes</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {leads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell>
                  <Link href="#" underline="hover">{lead.clientName}</Link>
                </TableCell>
                <TableCell>{lead.phone}</TableCell>
                <TableCell>{new Date(lead.creationDate).toLocaleString()}</TableCell>
                <TableCell>{lead.destinations}</TableCell>
                <TableCell>{lead.from}</TableCell>
                <TableCell>{new Date(lead.travelDate).toLocaleDateString()}</TableCell>
                <TableCell>{lead.nights}</TableCell>
                <TableCell>
                  {getStatusChip(lead.status)}
                  {lead.referenceId && (
                    <Typography variant="body2" sx={{ color: 'blue' }}>
                      {lead.referenceId}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  {lead.quotes?.map((q) => (
                    <Typography variant="body2" key={q.id}>
                      (<strong>{q.id}</strong>) {q.label} - ₹ {q.price.toLocaleString()}
                    </Typography>
                  ))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Box>
  );
};

export default MyLeads;
