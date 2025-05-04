import { PrismaClient, Event, EventType, FeedType, DiaperType, SleepLocation } from '@prisma/client';
import { AggregationHelper, AggregationData } from './aggregationHelper';
import { ValidationError } from '../errors/ValidationError';

const prisma = new PrismaClient();
const aggregationHelper = new AggregationHelper();

export interface GetEventsRequest {
  startDate: string;
  endDate: string;
  limit?: number;
}

export interface GetEventsResponse {
  events: Event[];
  hasMore: boolean;
}

export interface GetAggregateDataRequest {
  startDate: string;
  endDate: string;
}

export class EventService {
  // Read events within a date range
  async readEvents(request: GetEventsRequest): Promise<GetEventsResponse> {
    const { startDate, endDate, limit = 100 } = request;
    
    // Parse the incoming ISO strings directly into Date objects
    // The client already calculated the correct start/end in local time and sent as UTC
    const startDateTime = new Date(startDate);
    const endDateTime = new Date(endDate);
    
    console.log('Querying events between:', { 
      startDateTime: startDateTime.toISOString(),
      endDateTime: endDateTime.toISOString()
    });
    
    // Get events within the date range
    const events = await prisma.event.findMany({
      where: {
        timestamp: {
          gte: startDateTime,
          lte: endDateTime
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: limit
    });

    console.log('Found events:', events.length);

    // Check if there are more events before startDate
    const hasMore = await prisma.event.count({
      where: {
        timestamp: {
          lt: startDateTime
        }
      }
    }) > 0;

    return {
      events,
      hasMore
    };
  }

  // Create a new event
  async createEvent(event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<Event> {
    this.validateEvent(event);
    
    const createdEvent = await prisma.event.create({
      data: event
    });

    return createdEvent;
  }

  // Update an existing event
  async updateEvent(id: string, event: Partial<Event>): Promise<Event> {
    const existingEvent = await prisma.event.findUnique({
      where: { id }
    });

    if (!existingEvent) {
      throw new Error('Event not found');
    }

    // Merge existing event with updates for validation
    const mergedEvent = { ...existingEvent, ...event };
    this.validateEvent(mergedEvent);

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: event
    });

    return updatedEvent;
  }

  // Delete an event
  async deleteEvent(id: string): Promise<void> {
    await prisma.event.delete({
      where: { id }
    });
  }

  // Read aggregate event data
  async readAggregateEventData(request: GetAggregateDataRequest): Promise<AggregationData> {
    const { startDate, endDate } = request;
    
    return aggregationHelper.getAggregations(startDate, endDate);
  }

  private validateEvent(event: Partial<Event> & { type: EventType }): void {
    // Validate common fields
    if (!event.timestamp) {
      throw new ValidationError('Timestamp is required');
    }

    // Validate end time if present
    if (event.endTime) {
      const timestamp = new Date(event.timestamp);
      const endTime = new Date(event.endTime);
      if (endTime <= timestamp) {
        throw new ValidationError('End time must be after start time');
      }
    }

    // Validate type-specific fields
    switch (event.type) {
      case EventType.feed:
        this.validateFeedEvent(event);
        break;
      case EventType.sleep:
        this.validateSleepEvent(event);
        break;
      case EventType.diaper:
        this.validateDiaperEvent(event);
        break;
      default:
        throw new ValidationError('Invalid event type');
    }
  }

  private validateFeedEvent(event: Partial<Event>): void {
    if (!event.feedType) {
      throw new ValidationError('Feed type is required for feed events');
    }

    switch (event.feedType) {
      case FeedType.bottle:
      case FeedType.solids:
        if (event.amount === undefined || event.amount === null) {
          throw new ValidationError(`Amount is required for ${event.feedType} feeds`);
        }
        if (event.amount <= 0) {
          throw new ValidationError(`Amount must be positive for ${event.feedType} feeds`);
        }
        if (event.leftDuration || event.rightDuration) {
          throw new ValidationError(`Duration fields are not allowed for ${event.feedType} feeds`);
        }
        // Clear duration fields for bottle/solids
        delete event.leftDuration;
        delete event.rightDuration;
        break;
      case FeedType.breastfeeding:
        if (event.amount !== undefined && event.amount !== null) {
          throw new ValidationError('Amount is not allowed for breastfeeding');
        }
        if (!event.leftDuration && !event.rightDuration) {
          throw new ValidationError('At least one breast duration is required for breastfeeding');
        }
        if ((event.leftDuration && event.leftDuration < 0) || 
            (event.rightDuration && event.rightDuration < 0)) {
          throw new ValidationError('Duration must be non-negative');
        }
        // Clear amount for breastfeeding
        delete event.amount;
        break;
      default:
        throw new ValidationError('Invalid feed type');
    }

    // Clear any sleep or diaper specific fields
    delete event.sleepLocation;
    delete event.endTime;
    delete event.diaperType;
  }

  private validateSleepEvent(event: Partial<Event>): void {
    if (!event.sleepLocation) {
      throw new ValidationError('Sleep location is required for sleep events');
    }

    // Clear any feed or diaper specific fields
    delete event.feedType;
    delete event.amount;
    delete event.leftDuration;
    delete event.rightDuration;
    delete event.diaperType;
  }

  private validateDiaperEvent(event: Partial<Event>): void {
    if (!event.diaperType) {
      throw new ValidationError('Diaper type is required for diaper events');
    }

    // Clear any feed or sleep specific fields
    delete event.feedType;
    delete event.amount;
    delete event.leftDuration;
    delete event.rightDuration;
    delete event.sleepLocation;
    delete event.endTime;
  }
} 