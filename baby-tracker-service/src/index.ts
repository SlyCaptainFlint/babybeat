import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { EventService } from './services/eventService';
import { AggregationHelper } from './services/aggregationHelper';
import http from 'http';
import { parseISO } from 'date-fns';
import { validate as validateUUID } from 'uuid';
import { ValidationError } from './errors/ValidationError';

dotenv.config();

export const app = express();
const port = process.env.PORT || 3001;
const eventService = new EventService();
const aggregationHelper = new AggregationHelper();

app.use(cors());
app.use(express.json());

// Helper function to validate date range
const validateDateRange = (startDate: string, endDate: string): boolean => {
  try {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    return end >= start;
  } catch (error) {
    return false;
  }
};

// Helper function to validate event ID
const validateEventId = (id: string): boolean => {
  return validateUUID(id);
};

// Read events
app.get('/api/events', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, limit } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    if (!validateDateRange(startDate as string, endDate as string)) {
      return res.status(400).json({ error: 'endDate must be after or equal to startDate' });
    }

    const response = await eventService.readEvents({
      startDate: startDate as string,
      endDate: endDate as string,
      limit: limit ? parseInt(limit as string) : undefined
    });

    res.json(response);
  } catch (error) {
    console.error('Error reading events:', error);
    res.status(500).json({ error: 'Failed to read events' });
  }
});

// Create event
app.post('/api/events', async (req: Request, res: Response) => {
  try {
    const event = await eventService.createEvent(req.body);
    res.status(201).json(event);
  } catch (error: unknown) {
    console.error('Error creating event:', error);
    if (error instanceof ValidationError) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// Update event
app.put('/api/events/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!validateEventId(id)) {
      return res.status(400).json({ error: 'Invalid event ID format' });
    }

    const event = await eventService.updateEvent(id, req.body);
    res.json(event);
  } catch (error: unknown) {
    console.error('Error updating event:', error);
    if (error instanceof ValidationError) {
      return res.status(400).json({ error: error.message });
    }
    if (error instanceof Error && error.message === 'Event not found') {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// Delete event
app.delete('/api/events/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!validateEventId(id)) {
      return res.status(400).json({ error: 'Invalid event ID format' });
    }

    await eventService.deleteEvent(id);
    res.status(204).send();
  } catch (error: unknown) {
    console.error('Error deleting event:', error);
    if (error instanceof ValidationError) {
      return res.status(400).json({ error: error.message });
    }
    if (error instanceof Error && error.message.includes('does not exist')) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// Read aggregate event data
app.get('/api/aggregations', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: 'startDate, endDate are required' 
      });
    }

    if (!validateDateRange(startDate as string, endDate as string)) {
      return res.status(400).json({ error: 'endDate must be after or equal to startDate' });
    }

    const aggregations = await eventService.readAggregateEventData({
      startDate: startDate as string,
      endDate: endDate as string
    });

    res.json(aggregations);
  } catch (error) {
    console.error('Error reading aggregations:', error);
    res.status(500).json({ error: 'Failed to read aggregations' });
  }
});

export const server = http.createServer(app);

if (process.env.NODE_ENV !== 'test') {
  server.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}