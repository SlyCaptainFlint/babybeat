import { Event, EventType, FeedType, DiaperType, SleepLocation, BreastfeedingEvent, BottleFeedEvent, SolidsFeedEvent, SleepEvent, DiaperEvent } from '../types';
import { ApiService } from '../services/api';
import { addMinutes, subDays } from 'date-fns';

function generateRandomEvent(date: Date): Omit<Event, 'id'> {
  const types: EventType[] = ['feed', 'sleep', 'diaper'];
  const type = types[Math.floor(Math.random() * types.length)];
  const baseEvent = {
    timestamp: date.toISOString(),
  };

  switch (type) {
    case 'feed': {
      const feedTypes: FeedType[] = ['bottle', 'breastfeeding', 'solids'];
      const feedType = feedTypes[Math.floor(Math.random() * feedTypes.length)];
      
      switch (feedType) {
        case 'breastfeeding': {
          const event: Omit<BreastfeedingEvent, 'id'> = {
            ...baseEvent,
            type: 'feed',
            feedType: 'breastfeeding',
            leftDuration: Math.floor(Math.random() * 15) + 5,
            rightDuration: Math.floor(Math.random() * 15) + 5,
          };
          return event;
        }
        case 'bottle': {
          const event: Omit<BottleFeedEvent, 'id'> = {
            ...baseEvent,
            type: 'feed',
            feedType: 'bottle',
            amount: Math.floor(Math.random() * 100) + 50,
          };
          return event;
        }
        case 'solids': {
          const event: Omit<SolidsFeedEvent, 'id'> = {
            ...baseEvent,
            type: 'feed',
            feedType: 'solids',
            amount: Math.floor(Math.random() * 100) + 50,
          };
          return event;
        }
      }
    }
    case 'sleep': {
      const locations: SleepLocation[] = ['crib', 'stroller', 'car', 'carrier', 'bed', 'arms'];
      const sleepLocation = locations[Math.floor(Math.random() * locations.length)];
      const duration = Math.floor(Math.random() * 180) + 30; // 30-210 minutes
      
      const event: Omit<SleepEvent, 'id'> = {
        ...baseEvent,
        type: 'sleep',
        sleepLocation,
        endTime: addMinutes(date, duration).toISOString(),
      };
      return event;
    }
    case 'diaper': {
      const diaperTypes: DiaperType[] = ['wet', 'dirty'];
      const diaperType = diaperTypes[Math.floor(Math.random() * diaperTypes.length)];
      
      const event: Omit<DiaperEvent, 'id'> = {
        ...baseEvent,
        type: 'diaper',
        diaperType,
      };
      return event;
    }
    default: {
      // This should never happen due to the type system, but we'll handle it anyway
      throw new Error(`Invalid event type: ${type satisfies never}`);
    }
  }
}

export async function generateTestData() {
  // Generate events for the last 30 days
  const now = new Date();
  const events: Array<Promise<Event>> = [];
  
  for (let i = 0; i < 30; i++) {
    const date = subDays(now, i);
    const numEvents = Math.floor(Math.random() * 8) + 8; // 8-15 events per day
    
    for (let j = 0; j < numEvents; j++) {
      const hour = Math.floor(Math.random() * 24);
      const minute = Math.floor(Math.random() * 60);
      const eventDate = new Date(date);
      eventDate.setHours(hour, minute, 0, 0);
      
      const event = generateRandomEvent(eventDate);
      events.push(ApiService.createEvent(event).catch(error => {
        console.error('Failed to create test event:', error);
        throw error;
      }));
    }
  }

  // Wait for all events to be created
  try {
    await Promise.all(events);
    console.log('Successfully generated test data');
  } catch (error) {
    console.error('Failed to generate some test data:', error);
  }
} 