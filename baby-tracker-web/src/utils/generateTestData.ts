import { Event, EventType, FeedType, DiaperType, SleepLocation, BreastfeedingEvent, BottleFeedEvent, SolidsFeedEvent, SleepEvent, DiaperEvent } from '../types';
import { ApiService } from '../services/api';
import { addMinutes, subDays } from 'date-fns';

function generateRandomEvent(date: Date): Omit<Event, 'id'> {
  const types = [EventType.FEED, EventType.SLEEP, EventType.DIAPER];
  const type = types[Math.floor(Math.random() * types.length)];
  const baseEvent = {
    timestamp: date.toISOString(),
  };

  switch (type) {
    case EventType.FEED: {
      const feedTypes = [FeedType.BOTTLE, FeedType.BREASTFEEDING, FeedType.SOLIDS];
      const feedType = feedTypes[Math.floor(Math.random() * feedTypes.length)];
      
      switch (feedType) {
        case FeedType.BREASTFEEDING: {
          const event: Omit<BreastfeedingEvent, 'id'> = {
            ...baseEvent,
            type: EventType.FEED,
            feedType: FeedType.BREASTFEEDING,
            leftDuration: Math.floor(Math.random() * 15) + 5,
            rightDuration: Math.floor(Math.random() * 15) + 5,
          };
          return event;
        }
        case FeedType.BOTTLE: {
          const event: Omit<BottleFeedEvent, 'id'> = {
            ...baseEvent,
            type: EventType.FEED,
            feedType: FeedType.BOTTLE,
            amount: Math.floor(Math.random() * 100) + 50,
          };
          return event;
        }
        case FeedType.SOLIDS: {
          const event: Omit<SolidsFeedEvent, 'id'> = {
            ...baseEvent,
            type: EventType.FEED,
            feedType: FeedType.SOLIDS,
            amount: Math.floor(Math.random() * 100) + 50,
          };
          return event;
        }
      }
    }
    case EventType.SLEEP: {
      const locations = [
        SleepLocation.CRIB,
        SleepLocation.STROLLER,
        SleepLocation.CAR,
        SleepLocation.CARRIER,
        SleepLocation.BED,
        SleepLocation.ARMS,
      ];
      const sleepLocation = locations[Math.floor(Math.random() * locations.length)];
      const duration = Math.floor(Math.random() * 180) + 30; // 30-210 minutes
      
      const event: Omit<SleepEvent, 'id'> = {
        ...baseEvent,
        type: EventType.SLEEP,
        sleepLocation,
        endTime: addMinutes(date, duration).toISOString(),
      };
      return event;
    }
    case EventType.DIAPER: {
      const diaperTypes = [DiaperType.WET, DiaperType.DIRTY];
      const diaperType = diaperTypes[Math.floor(Math.random() * diaperTypes.length)];
      
      const event: Omit<DiaperEvent, 'id'> = {
        ...baseEvent,
        type: EventType.DIAPER,
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