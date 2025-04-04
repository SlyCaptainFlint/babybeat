import { createBrowserRouter, RouterProvider, ActionFunctionArgs, redirect } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Layout } from './components/Layout';
import { ApiService } from './services/api';
import { format, subMonths, endOfDay, startOfDay, parseISO } from 'date-fns';
import Home from './routes/home';
import { OnlineProvider } from './contexts/OnlineContext';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#FF6B6B', // A warm, playful red
      light: '#FF8E8E',
      dark: '#E64C4C',
      contrastText: '#FFFFFF', // Ensure white text on primary colors
    },
    secondary: {
      main: '#4ECDC4', // A fresh, calming teal
      light: '#7EDCD6',
      dark: '#3DBEB6',
      contrastText: '#FFFFFF', // Ensure white text on secondary colors
    },
    background: {
      default: '#F7F9FC',
      paper: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: '"Inter", "system-ui", "sans-serif"',
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          borderRadius: 0,
        },
      },
    },
  },
});

// Loader for the home page
async function homeLoader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const date = url.searchParams.get('date') || format(new Date(), 'yyyy-MM-dd');
  console.log('Loading events for date:', date);
  
  // Convert local date to UTC range
  const localDate = parseISO(date);
  const utcStartDate = startOfDay(localDate).toISOString();
  const utcEndDate = endOfDay(localDate).toISOString();
  
  console.log('Date range:', { 
    localDate: format(localDate, 'yyyy-MM-dd'),
    utcStartDate,
    utcEndDate
  });
  
  const apiResponse = ApiService.getEventsByDate(utcStartDate, utcEndDate)
    .catch(error => {
      console.error('Failed to fetch events:', error);
      return { events: [] };
    });

  return { apiResponse, date };
}

// Loader for the data graphs page
async function dataGraphsLoader() {
  const endDate = new Date().toISOString();
  const startDate = subMonths(new Date(), 12).toISOString(); 
  const aggregationsPromise = ApiService.getAggregations(startDate, endDate);
  return { aggregationsPromise, startDate, endDate };
}

// Action for creating/updating events
async function eventAction({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const rawEvent = Object.fromEntries(formData);
  console.log('Raw form data:', rawEvent);
  
  // Convert numeric fields to numbers
  const event = {
    ...rawEvent,
    ...(rawEvent.amount && { amount: parseInt(rawEvent.amount as string, 10) }),
    ...(rawEvent.leftDuration && { leftDuration: parseInt(rawEvent.leftDuration as string, 10) }),
    ...(rawEvent.rightDuration && { rightDuration: parseInt(rawEvent.rightDuration as string, 10) }),
  } as Record<string, any>;
  
  console.log('Processed event data:', event);
  
  if (event.id) {
    console.log('Updating event:', event.id);
    return ApiService.updateEvent(event as any);
  } else {
    console.log('Creating new event');
    return ApiService.createEvent(event as any);
  }
}

// Action for deleting events
async function deleteEventAction({ params, request }: ActionFunctionArgs) {
  if (!params.id) throw new Error('Event ID is required');
  await ApiService.deleteEvent(params.id);
  
  // Try to get the date from the referrer
  try {
    const referer = request.headers.get('Referer');
    if (referer) {
      const refererUrl = new URL(referer);
      const date = refererUrl.searchParams.get('date');
      if (date) {
        return redirect(`/?date=${date}`);
      }
    }
  } catch (error) {
    console.error('Error processing referrer:', error);
  }
  
  // Default fallback
  return redirect('/');
}

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      {
        path: '/',
        element: <Home />,
        loader: homeLoader,
      },
      {
        path: '/add/:eventType',
        lazy: () => import('./routes/add-event.tsx'),
        action: eventAction,
      },
      {
        path: '/data-graphs',
        lazy: () => import('./routes/data-graphs.tsx'),
        loader: dataGraphsLoader,
      },
      {
        path: '/events/:id/delete',
        action: deleteEventAction,
      },
    ],
  },
]);

export default function App() {
  return (
    <OnlineProvider>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <RouterProvider router={router} />
        </LocalizationProvider>
      </ThemeProvider>
    </OnlineProvider>
  );
}
