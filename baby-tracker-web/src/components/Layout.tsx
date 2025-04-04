import { Outlet } from 'react-router-dom';
import { Suspense } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { Navbar } from './Navbar';

const LoadingSpinner = () => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '200px',
    }}
  >
    <CircularProgress />
  </Box>
);

export function Layout() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <Box component="main" sx={{ flex: 1, p: 3 }}>
        <Suspense fallback={<LoadingSpinner />}>
          <Outlet />
        </Suspense>
      </Box>
    </Box>
  );
} 