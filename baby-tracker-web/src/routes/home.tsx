import { useLoaderData, useNavigate, useSubmit, Await } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  Stack,
  IconButton,
  Grid,
  Chip,
  Container,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon,
  Edit as EditIcon,
  Restaurant as FoodIcon,
  Hotel as SleepIcon,
  BabyChangingStation as DiaperIcon,
  AccessTime as TimeIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { Event, EventType, FeedType, DiaperType } from '../types';
import { format, parseISO, differenceInMinutes, formatDistanceToNow, isSameDay } from 'date-fns';
import { eventColors, getEventIcon, getEventColor } from '../theme/eventStyles';

const SummaryCard = ({ 
  icon: Icon, 
  title, 
  color,
  children,
  onAdd,
}: { 
  icon: React.ElementType, 
  title: string,
  color: string,
  children: React.ReactNode,
  onAdd: () => void,
}) => (
  <Paper elevation={2} sx={{ p: '16px', height: 'calc(100% - 35px)', display: 'flex' }}>
    <Stack spacing={1} sx={{ width: '100%' }}>
      <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Icon sx={{ color }} />
          <Typography variant="subtitle1">{title}</Typography>
        </Box>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={onAdd}
          sx={{
            bgcolor: color,
            '&:hover': {
              bgcolor: color,
              opacity: 0.9,
            },
          }}
        >
          Add
        </Button>
      </Stack>
      {children}
    </Stack>
  </Paper>
);

const TimeSinceLastEvent = ({ type, timestamp, endTime }: { type: 'feed' | 'sleep' | 'diaper', timestamp: string, endTime?: string }) => {
  const [timeSince, setTimeSince] = useState('');

  useEffect(() => {
    const updateTimeSince = () => {
      const referenceTime = endTime ? parseISO(endTime) : parseISO(timestamp);
      setTimeSince(formatDistanceToNow(referenceTime, { addSuffix: true }));
    };

    updateTimeSince();
    const interval = setInterval(updateTimeSince, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [timestamp, endTime]);

  const getLabel = () => {
    switch (type) {
      case 'feed':
        return 'Last feed:';
      case 'sleep':
        return 'Last sleep:';
      case 'diaper':
        return 'Last diaper:';
    }
  };

  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <TimeIcon fontSize="small" />
      <Typography variant="body2" sx={{ display: 'flex', gap: 0.5 }}>
        <span style={{ color: 'text.secondary' }}>{getLabel()}</span>
        <span>{timeSince}</span>
      </Typography>
    </Stack>
  );
};

const DailySummary = ({ events = [], onAddEvent }: { events?: Event[], onAddEvent: (type: string) => void }) => {
  // Find last events
  const lastFeedEvent = events
    .filter(e => e.type === 'feed')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

  const lastDiaperEvent = events
    .filter(e => e.type === 'diaper')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

  const lastSleepEvent = events
    .filter(e => e.type === 'sleep')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

  // Calculate feed summary
  const feedSummary = events
    .filter(e => e.type === 'feed')
    .reduce((acc, event: any) => {
      if (event.feedType === 'breastfeeding') {
        acc.totalBreastfeedingDuration += (event.leftDuration + event.rightDuration);
      } else if (event.feedType === 'solids') {
        acc.totalSolids += event.amount;
      } else if (event.feedType === 'bottle') {
        acc.totalBottle += event.amount;
      }
      return acc;
    }, { totalBreastfeedingDuration: 0, totalSolids: 0, totalBottle: 0 });

  // Calculate sleep summary
  const sleepSummary = events
    .filter(e => e.type === 'sleep')
    .reduce((acc, event: any) => {
      const duration = differenceInMinutes(parseISO(event.endTime), parseISO(event.timestamp));
      return {
        count: acc.count + 1,
        totalDuration: acc.totalDuration + duration,
      };
    }, { count: 0, totalDuration: 0 });

  const sleepHours = Math.floor(sleepSummary.totalDuration / 60);
  const sleepMinutes = sleepSummary.totalDuration % 60;

  // Calculate diaper summary
  const diaperSummary = events
    .filter(e => e.type === EventType.DIAPER)
    .reduce((acc, event) => {
      if (event.diaperType === DiaperType.WET) acc.wet++;
      else if (event.diaperType === DiaperType.DIRTY) acc.dirty++;
      return acc;
    }, { wet: 0, dirty: 0 });

  return (
    <Grid container spacing={3} sx={{ mb: 2 }}>
      <Grid item xs={12} md={4}>
        <SummaryCard 
          icon={FoodIcon} 
          title="Feeding" 
          color={eventColors.feed.main}
          onAdd={() => onAddEvent('feed')}
        >
          <Stack spacing={1}>
            {lastFeedEvent && (
              <TimeSinceLastEvent type="feed" timestamp={lastFeedEvent.timestamp} />
            )}
            {feedSummary.totalBreastfeedingDuration > 0 && (
              <Chip 
                label={`Breastfeeding: ${feedSummary.totalBreastfeedingDuration} min`}
                size="small"
              />
            )}
            {feedSummary.totalBottle > 0 && (
              <Chip 
                label={`Bottle: ${feedSummary.totalBottle} ml`}
                size="small"
              />
            )}
            {feedSummary.totalSolids > 0 && (
              <Chip 
                label={`Solids: ${feedSummary.totalSolids} g`}
                size="small"
              />
            )}
          </Stack>
        </SummaryCard>
      </Grid>
      <Grid item xs={12} md={4}>
        <SummaryCard 
          icon={SleepIcon} 
          title="Sleep" 
          color={eventColors.sleep.main}
          onAdd={() => onAddEvent('sleep')}
        >
          <Stack spacing={1}>
            {lastSleepEvent && (
              <TimeSinceLastEvent 
                type="sleep"
                timestamp={lastSleepEvent.timestamp} 
                endTime={lastSleepEvent.endTime} 
              />
            )}
            {sleepSummary.count > 0 && (
              <Chip 
                label={`${sleepSummary.count} naps, ${sleepHours}h ${sleepMinutes}m total`}
                size="small"
              />
            )}
          </Stack>
        </SummaryCard>
      </Grid>
      <Grid item xs={12} md={4}>
        <SummaryCard 
          icon={DiaperIcon} 
          title="Diapers" 
          color={eventColors.diaper.main}
          onAdd={() => onAddEvent('diaper')}
        >
          <Stack spacing={1}>
            {lastDiaperEvent && (
              <TimeSinceLastEvent type="diaper" timestamp={lastDiaperEvent.timestamp} />
            )}
            <Stack direction="row" spacing={1}>
              <Chip 
                label={`${diaperSummary.wet} wet`}
                size="small"
              />
              <Chip 
                label={`${diaperSummary.dirty} dirty`}
                size="small"
              />
            </Stack>
          </Stack>
        </SummaryCard>
      </Grid>
    </Grid>
  );
};

const EventCard = ({ event, onEdit, onDelete }: { event: Event, onEdit: (event: Event) => void, onDelete: (eventId: string) => void }) => {
  const getEventIconComponent = () => {
    return getEventIcon(event.type, event.type === EventType.FEED ? event.feedType : undefined);
  };

  const getEventColorValue = () => {
    return getEventColor(event.type, event.type === EventType.FEED ? event.feedType : undefined);
  };

  const getEventDetails = () => {
    switch (event.type) {
      case EventType.FEED:
        if (event.feedType === FeedType.BREASTFEEDING) {
          return `${event.leftDuration + event.rightDuration}min`;
        } else if (event.feedType === FeedType.BOTTLE) {
          return `${event.amount}ml`;
        } else {
          return `${event.amount}g`;
        }
      case EventType.SLEEP:
        const duration = differenceInMinutes(parseISO(event.endTime), parseISO(event.timestamp));
        const hours = Math.floor(duration / 60);
        const minutes = duration % 60;
        return `${hours}h ${minutes}m`;
      case EventType.DIAPER:
        return null;
    }
  };

  const EventIcon = getEventIconComponent();
  const color = getEventColorValue();
  const details = getEventDetails();

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        mb: 2,
        display: 'flex',
        overflow: 'hidden',
        '&:hover': {
          boxShadow: 4,
        }
      }}
    >
      <Box 
        sx={{ 
          width: '4px',
          bgcolor: color,
          flexShrink: 0
        }} 
      />
      <Box sx={{ p: 2, flexGrow: 1 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <EventIcon sx={{ color }} />
          <Stack spacing={1} sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                {event.type === 'sleep' 
                  ? `${format(parseISO(event.timestamp), 'HH:mm')} - ${format(parseISO(event.endTime), 'HH:mm')}`
                  : format(parseISO(event.timestamp), 'HH:mm')
                }
              </Typography>
            <Typography variant="body2" color="text.secondary">
              {event.type === 'feed' && `${event.feedType.charAt(0).toUpperCase() + event.feedType.slice(1)} - ${details}`}
              {event.type === 'sleep' && `${event.sleepLocation.charAt(0).toUpperCase() + event.sleepLocation.slice(1)} - ${details}`}
              {event.type === 'diaper' && `Diaper - ${event.diaperType}`}
            </Typography>
          </Stack>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={1}>
              <IconButton size="small" onClick={() => onEdit(event)} aria-label="Edit event">
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => onDelete(event.id)} aria-label="Delete event">
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Stack>
        </Stack>
      </Box>
    </Paper>
  );
};

export default function Home() {
  const { apiResponse, date: selectedDate } = useLoaderData() as { apiResponse: Promise<any>, date: string };
  const navigate = useNavigate();
  const submit = useSubmit();
  const [currentDate, setCurrentDate] = useState(parseISO(selectedDate)); // Manage date state

  const handleDateChange = (newDate: Date | null) => {
    if (newDate) {
      setCurrentDate(newDate);
      const dateString = format(newDate, 'yyyy-MM-dd');
      navigate(`/?date=${dateString}`);
    }
  };

  const handleAddEvent = (type: string) => {
    navigate(`/add/${type}`, { state: { selectedDate: format(currentDate, 'yyyy-MM-dd') } });
  };

  const handleEditEvent = (event: Event) => {
    navigate(`/add/${event.type}`, { state: { event, selectedDate: format(currentDate, 'yyyy-MM-dd') } });
  };

  const handleDeleteEvent = (eventId: string) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      // Format the date to include in the URL
      const formattedDate = format(currentDate, 'yyyy-MM-dd');
      // Submit to the action URL with the date as a query parameter
      submit(null, { 
        method: 'post', 
        action: `/events/${eventId}/delete?date=${formattedDate}` 
      });
    }
  };

  const isToday = isSameDay(currentDate, new Date());

  return (
    <Await resolve={apiResponse}>
      {(response) => (
        <Container maxWidth="lg">
          <Box sx={{ my: 4 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Box
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  gap={2}
                >
                  <IconButton
                    onClick={() => {
                      const prevDay = new Date(currentDate);
                      prevDay.setDate(prevDay.getDate() - 1);
                      handleDateChange(prevDay);
                    }}
                    size="large"
                  >
                    <ChevronLeftIcon />
                  </IconButton>
                  <DatePicker
                    value={currentDate}
                    onChange={handleDateChange}
                    maxDate={new Date()}
                    slotProps={{
                      textField: {
                        size: "small",
                        sx: { width: 150 }
                      }
                    }}
                  />
                  <IconButton
                    onClick={() => {
                      const nextDay = new Date(currentDate);
                      nextDay.setDate(nextDay.getDate() + 1);
                      handleDateChange(nextDay);
                    }}
                    disabled={isToday}
                    size="large"
                  >
                    <ChevronRightIcon />
                  </IconButton>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <DailySummary events={response.events} onAddEvent={handleAddEvent} />
              </Grid>
              <Grid item xs={12}>
                <Stack spacing={2}>
                  {response.events.map((event: Event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onEdit={handleEditEvent}
                      onDelete={handleDeleteEvent}
                    />
                  ))}
                </Stack>
              </Grid>
            </Grid>
          </Box>
        </Container>
      )}
    </Await>
  );
} 