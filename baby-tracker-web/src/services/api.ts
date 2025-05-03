import { Event, SleepLocation, DiaperType } from '../types';
import { errorService } from './errorService';

const API_BASE_URL = 'http://localhost:3000/api';  

export interface EventsResponse {
  events: Event[];
}

export interface AggregationData {
  startDate: string;
  endDate: string;
  weeklyStats: Array<{
    weekStart: string;
    dailyAverages: {
      feed: {
        count: number;
        byType: {
          bottle: { count: number; amount: number };
          breastfeeding: { count: number; leftDuration: number; rightDuration: number; totalDuration: number };
          solids: { count: number; amount: number };
        };
      };
      sleep: {
        count: number;
        duration: number;
        totalDuration: number;
        byLocation: Record<SleepLocation, { count: number; duration: number }>;
      };
      diaper: {
        count: number;
        byType: Record<DiaperType, number>;
      };
    };
  }>;
}

export class ApiService {
  static async getAggregations(startDate: string, endDate: string): Promise<AggregationData> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/aggregations?startDate=${startDate}&endDate=${endDate}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch aggregations');
      }
      errorService.clearError();
      return response.json();
    } catch (error) {
      errorService.setError(error as Error);
      return {
        startDate,
        endDate,
        weeklyStats: []
      };
    }
  }

  static async getEventsByDate(startDate: string, endDate: string): Promise<EventsResponse> {
    try {
      console.log('Fetching events with:', { startDate, endDate });
      const url = `${API_BASE_URL}/events?startDate=${startDate}&endDate=${endDate}`;
      console.log('Request URL:', url);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      const data = await response.json();
      console.log('API response:', data);
      errorService.clearError();
      return data;
    } catch (error) {
      errorService.setError(error as Error);
      return { events: [] };
    }
  }

  static async createEvent(event: Omit<Event, 'id'>): Promise<Event> {
    try {
      console.log('Creating event:', event);
      const response = await fetch(`${API_BASE_URL}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });
      if (!response.ok) {
        throw new Error('Failed to create event');
      }
      const data = await response.json();
      console.log('Create event response:', data);
      errorService.clearError();
      return data;
    } catch (error) {
      errorService.setError(error as Error);
      throw error; // Re-throw to prevent optimistic updates
    }
  }

  static async updateEvent(event: Event): Promise<Event> {
    try {
      const response = await fetch(`${API_BASE_URL}/events/${event.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });
      if (!response.ok) {
        throw new Error('Failed to update event');
      }
      errorService.clearError();
      return response.json();
    } catch (error) {
      errorService.setError(error as Error);
      throw error; // Re-throw to prevent optimistic updates
    }
  }

  static async deleteEvent(eventId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete event');
      }
      errorService.clearError();
    } catch (error) {
      errorService.setError(error as Error);
      throw error; // Re-throw to prevent optimistic updates
    }
  }
} 