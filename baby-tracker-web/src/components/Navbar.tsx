import { useLocation, useNavigate, useRevalidator } from 'react-router-dom';
import { AppBar, Toolbar, IconButton, Box, CircularProgress, Tooltip, Typography } from '@mui/material';
import { 
  Home as HomeIcon, 
  BarChart as BarChartIcon,
  Refresh as RefreshIcon,
  WifiOff as WifiOffIcon,
} from '@mui/icons-material';
import { useOnline } from '../contexts/OnlineContext';

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { revalidate, state } = useRevalidator();
  const { isOnline } = useOnline();

  return (
    <AppBar position="static">
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Typography variant="h6" sx={{ mr: 2, fontWeight: 'bold' }}>
            BabyBeat
          </Typography>
          <IconButton
            color={location.pathname === '/' ? 'inherit' : 'default'}
            onClick={() => navigate('/')}
            sx={{
              bgcolor: location.pathname === '/' ? 'primary.dark' : 'transparent',
              '&:hover': {
                bgcolor: location.pathname === '/' ? 'primary.dark' : 'primary.dark',
              },
            }}
            size="large"
            aria-label="Home"
          >
            <HomeIcon />
          </IconButton>
          <IconButton
            color={location.pathname === '/data-graphs' ? 'inherit' : 'default'}
            onClick={() => navigate('/data-graphs')}
            sx={{
              bgcolor: location.pathname === '/data-graphs' ? 'primary.dark' : 'transparent',
              '&:hover': {
                bgcolor: location.pathname === '/data-graphs' ? 'primary.dark' : 'primary.dark',
              },
            }}
            size="large"
            aria-label="Data Graphs"
          >
            <BarChartIcon />
          </IconButton>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {!isOnline && (
            <Tooltip title="Service is unreachable. Data may be outdated.">
              <IconButton color="inherit" size="large">
                <WifiOffIcon />
              </IconButton>
            </Tooltip>
          )}
          {state === 'loading' && (
            <CircularProgress size={24} color="inherit" />
          )}
          <IconButton
            color="inherit"
            onClick={() => revalidate()}
            disabled={state === 'loading'}
            size="large"
            aria-label="Refresh data"
          >
            <RefreshIcon />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
} 