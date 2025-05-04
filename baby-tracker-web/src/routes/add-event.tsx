import { useState } from 'react';
import { useNavigate, useParams, useLocation, Form, useNavigation } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  TextField,
} from '@mui/material';
import { Event, EventType, FeedType, DiaperType, SleepLocation } from '../types';
import { format } from 'date-fns';
import { getEventIcon, getEventColor } from '../theme/eventStyles';

const SelectableButton = ({ 
  selected, 
  onClick, 
  children, 
  color,
  disabled,
}: { 
  selected: boolean, 
  onClick: () => void, 
  children: React.ReactNode,
  color: string,
  disabled?: boolean,
}) => (
  <Button
    variant={selected ? "contained" : "outlined"}
    onClick={onClick}
    disabled={disabled}
    sx={{
      borderRadius: '20px',
      borderColor: color,
      color: selected ? 'white' : color,
      bgcolor: selected ? color : 'transparent',
      '&:hover': {
        bgcolor: selected ? color : 'rgba(0, 0, 0, 0.04)',
        borderColor: color,
        opacity: 0.9,
      },
    }}
  >
    {children}
  </Button>
);

export function Component() {
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const { eventType } = useParams<{ eventType: string }>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';
  const existingEvent = routerLocation.state?.event as Event | undefined;
  const selectedDate = routerLocation.state?.selectedDate;

  // Determine the date context for the redirect
  const dateForRedirect = selectedDate || format(new Date(), 'yyyy-MM-dd');
  
  // Validate that type is a valid event type
  if (!eventType || !Object.values(EventType).includes(eventType as EventType)) {
    navigate('/');
    return null;
  }

  const type = eventType as EventType;

  // Helper functions for date/time conversion
  const utcToLocal = (isoString: string) => {
    const date = new Date(isoString);
    return {
      date: format(date, 'yyyy-MM-dd'),
      time: format(date, 'HH:mm')
    };
  };

  const localToUTC = (dateStr: string, timeStr: string) => {
    const localDate = new Date(`${dateStr}T${timeStr}`);
    return localDate.toISOString();
  };

  // Initialize form state with proper timezone conversion
  const [date, setDate] = useState(
    existingEvent 
      ? utcToLocal(existingEvent.timestamp).date
      : selectedDate || format(new Date(), 'yyyy-MM-dd')
  );
  const [time, setTime] = useState(
    existingEvent 
      ? utcToLocal(existingEvent.timestamp).time
      : format(new Date(), 'HH:mm')
  );
  const [endDate, setEndDate] = useState(
    existingEvent?.type === EventType.SLEEP && existingEvent.endTime
      ? utcToLocal(existingEvent.endTime).date
      : selectedDate || format(new Date(), 'yyyy-MM-dd')
  );
  const [endTime, setEndTime] = useState(
    existingEvent?.type === EventType.SLEEP && existingEvent.endTime
      ? utcToLocal(existingEvent.endTime).time
      : format(new Date(), 'HH:mm')
  );
  const [feedType, setFeedType] = useState<FeedType>(
    existingEvent?.type === EventType.FEED
      ? existingEvent.feedType
      : FeedType.BOTTLE
  );
  const [amount, setAmount] = useState(
    existingEvent?.type === EventType.FEED && 'amount' in existingEvent
      ? existingEvent.amount.toString()
      : ''
  );
  const [leftDuration, setLeftDuration] = useState(
    existingEvent?.type === EventType.FEED && 'leftDuration' in existingEvent
      ? existingEvent.leftDuration.toString()
      : ''
  );
  const [rightDuration, setRightDuration] = useState(
    existingEvent?.type === EventType.FEED && 'rightDuration' in existingEvent
      ? existingEvent.rightDuration.toString()
      : ''
  );
  const [sleepLocation, setSleepLocation] = useState<SleepLocation>(
    existingEvent?.type === EventType.SLEEP
      ? existingEvent.sleepLocation
      : SleepLocation.CRIB
  );
  const [diaperType, setDiaperType] = useState<DiaperType>(
    existingEvent?.type === EventType.DIAPER
      ? existingEvent.diaperType
      : DiaperType.WET
  );

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDate(event.target.value);
  };

  const handleTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTime(event.target.value);
  };

  const handleEndDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(event.target.value);
  };

  const handleEndTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEndTime(event.target.value);
  };

  const timestamp = localToUTC(date, time);
  const endTimeISO = type === EventType.SLEEP ? localToUTC(endDate, endTime) : undefined;

  const EventIcon = getEventIcon(type, feedType);
  const color = getEventColor(type, feedType);

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Form method={existingEvent ? 'put' : 'post'}>
        {/* Add hidden input for the date context */}
        <input type="hidden" name="date" value={dateForRedirect} />

        {existingEvent && (
          <input type="hidden" name="id" value={existingEvent.id} />
        )}
        <input type="hidden" name="type" value={type} />
        <input type="hidden" name="timestamp" value={timestamp} />
        {endTimeISO && (
          <input type="hidden" name="endTime" value={endTimeISO} />
        )}

        <Stack spacing={3}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box>
              <EventIcon sx={{ fontSize: 40, color }} />
            </Box>
            <Typography variant="h5" component="h1">
              {existingEvent ? 'Edit' : 'Add'} {type.charAt(0).toUpperCase()}{type.slice(1)} Event
            </Typography>
          </Stack>

          <Stack spacing={3}>
            {type === EventType.SLEEP ? (
              <Stack spacing={2}>
                <Typography variant="subtitle1">Start Time</Typography>
                <Stack direction="row" spacing={2}>
                  <TextField
                    type="date"
                    value={date}
                    onChange={handleDateChange}
                    sx={{ flex: 2 }}
                    inputProps={{
                      'aria-label': 'Start date',
                    }}
                    disabled={isSubmitting}
                  />
                  <TextField
                    type="time"
                    value={time}
                    onChange={handleTimeChange}
                    sx={{ flex: 1 }}
                    inputProps={{
                      'aria-label': 'Start time',
                    }}
                    disabled={isSubmitting}
                  />
                </Stack>
                <Typography variant="subtitle1">End Time</Typography>
                <Stack direction="row" spacing={2}>
                  <TextField
                    type="date"
                    value={endDate}
                    onChange={handleEndDateChange}
                    sx={{ flex: 2 }}
                    inputProps={{
                      'aria-label': 'End date',
                    }}
                    disabled={isSubmitting}
                  />
                  <TextField
                    type="time"
                    value={endTime}
                    onChange={handleEndTimeChange}
                    sx={{ flex: 1 }}
                    inputProps={{
                      'aria-label': 'End time',
                    }}
                    disabled={isSubmitting}
                  />
                </Stack>
              </Stack>
            ) : (
              <Stack direction="row" spacing={2}>
                <TextField
                  type="date"
                  value={date}
                  onChange={handleDateChange}
                  sx={{ flex: 2 }}
                  inputProps={{
                    'aria-label': 'Event date',
                  }}
                  disabled={isSubmitting}
                />
                <TextField
                  type="time"
                  value={time}
                  onChange={handleTimeChange}
                  sx={{ flex: 1 }}
                  inputProps={{
                    'aria-label': 'Event time',
                  }}
                  disabled={isSubmitting}
                />
              </Stack>
            )}

            {type === EventType.FEED && (
              <>
                <input type="hidden" name="feedType" value={feedType} />
                <Stack spacing={2}>
                  <Typography variant="subtitle1">Feed Type</Typography>
                  <Stack direction="row" spacing={1}>
                    <SelectableButton
                      selected={feedType === FeedType.BOTTLE}
                      onClick={() => setFeedType(FeedType.BOTTLE)}
                      color={color}
                      disabled={isSubmitting}
                    >
                      Bottle
                    </SelectableButton>
                    <SelectableButton
                      selected={feedType === FeedType.BREASTFEEDING}
                      onClick={() => setFeedType(FeedType.BREASTFEEDING)}
                      color={color}
                      disabled={isSubmitting}
                    >
                      Breastfeeding
                    </SelectableButton>
                    <SelectableButton
                      selected={feedType === FeedType.SOLIDS}
                      onClick={() => setFeedType(FeedType.SOLIDS)}
                      color={color}
                      disabled={isSubmitting}
                    >
                      Solids
                    </SelectableButton>
                  </Stack>
                </Stack>

                {feedType === FeedType.BREASTFEEDING ? (
                  <Stack spacing={2}>
                    <Typography variant="subtitle1">Duration (minutes)</Typography>
                    <Stack direction="row" spacing={2}>
                      <TextField
                        type="number"
                        name="leftDuration"
                        label="Left Breast"
                        value={leftDuration}
                        onChange={(e) => setLeftDuration(e.target.value)}
                        inputProps={{ min: 0 }}
                        disabled={isSubmitting}
                      />
                      <TextField
                        type="number"
                        name="rightDuration"
                        label="Right Breast"
                        value={rightDuration}
                        onChange={(e) => setRightDuration(e.target.value)}
                        inputProps={{ min: 0 }}
                        disabled={isSubmitting}
                      />
                    </Stack>
                  </Stack>
                ) : (
                  <Stack spacing={2}>
                    <Typography variant="subtitle1">Amount</Typography>
                    <TextField
                      type="number"
                      name="amount"
                      label={feedType === FeedType.BOTTLE ? 'Milliliters (ml)' : 'Grams (g)'}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      inputProps={{ min: 0 }}
                      disabled={isSubmitting}
                    />
                  </Stack>
                )}
              </>
            )}

            {type === EventType.SLEEP && (
              <>
                <input type="hidden" name="sleepLocation" value={sleepLocation} />
                <Stack spacing={2}>
                  <Typography variant="subtitle1">Location</Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {Object.values(SleepLocation).map((location: SleepLocation) => (
                      <SelectableButton
                        key={location}
                        selected={sleepLocation === location}
                        onClick={() => setSleepLocation(location)}
                        color={color}
                        disabled={isSubmitting}
                      >
                        {location.charAt(0).toUpperCase() + location.slice(1)}
                      </SelectableButton>
                    ))}
                  </Stack>
                </Stack>
              </>
            )}

            {type === EventType.DIAPER && (
              <>
                <input type="hidden" name="diaperType" value={diaperType} />
                <Stack spacing={2}>
                  <Typography variant="subtitle1">Diaper Type</Typography>
                  <Stack direction="row" spacing={1}>
                    {Object.values(DiaperType).map((type: DiaperType) => (
                      <SelectableButton
                        key={type}
                        selected={diaperType === type}
                        onClick={() => setDiaperType(type)}
                        color={color}
                        disabled={isSubmitting}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectableButton>
                    ))}
                  </Stack>
                </Stack>
              </>
            )}
          </Stack>

          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button
              variant="outlined"
              onClick={() => navigate(-1)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{
                bgcolor: color,
                '&:hover': {
                  bgcolor: color,
                  opacity: 0.9,
                },
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : (existingEvent ? 'Save' : 'Add')}
            </Button>
          </Stack>
        </Stack>
      </Form>
    </Paper>
  );
} 