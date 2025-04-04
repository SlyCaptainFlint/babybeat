import request from 'supertest';
import { app } from './setup';
import { PrismaClient, EventType, FeedType, DiaperType, SleepLocation } from '@prisma/client';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Helper function to generate valid UUIDs for testing
const generateTestId = () => uuidv4();

describe('API Endpoints', () => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Helper function to create test events
  const createTestEvent = async (eventData: any) => {
    return prisma.event.create({
      data: eventData,
    });
  };

  describe('POST /api/events', () => {
    it('should create a bottle feed event', async () => {
      const eventData = {
        type: EventType.feed,
        feedType: FeedType.bottle,
        timestamp: today.toISOString(),
        amount: 120,
      };

      const response = await request(app)
        .post('/api/events')
        .send(eventData)
        .expect(201);

      expect(response.body).toMatchObject({
        type: EventType.feed,
        feedType: FeedType.bottle,
        amount: 120,
      });
    });

    it('should create a breastfeeding event', async () => {
      const eventData = {
        type: EventType.feed,
        feedType: FeedType.breastfeeding,
        timestamp: today.toISOString(),
        leftDuration: 300,
        rightDuration: 240,
      };

      const response = await request(app)
        .post('/api/events')
        .send(eventData)
        .expect(201);

      expect(response.body).toMatchObject({
        type: EventType.feed,
        feedType: FeedType.breastfeeding,
        leftDuration: 300,
        rightDuration: 240,
      });
    });

    it('should create a diaper event', async () => {
      const eventData = {
        type: EventType.diaper,
        timestamp: today.toISOString(),
        diaperType: DiaperType.wet,
      };

      const response = await request(app)
        .post('/api/events')
        .send(eventData)
        .expect(201);

      expect(response.body).toMatchObject({
        type: EventType.diaper,
        diaperType: DiaperType.wet,
      });
    });

    it('should create a sleep event', async () => {
      const eventData = {
        type: EventType.sleep,
        timestamp: today.toISOString(),
        endTime: new Date(today.getTime() + 3600000).toISOString(),
        sleepLocation: SleepLocation.crib,
      };

      const response = await request(app)
        .post('/api/events')
        .send(eventData)
        .expect(201);

      expect(response.body).toMatchObject({
        type: EventType.sleep,
        sleepLocation: SleepLocation.crib,
      });
    });

    // Edge cases for POST /api/events
    it('should reject invalid event type', async () => {
      const eventData = {
        type: 'invalid_type',
        timestamp: today.toISOString(),
      };

      await request(app)
        .post('/api/events')
        .send(eventData)
        .expect(400);
    });

    it('should reject end time before start time', async () => {
      const eventData = {
        type: EventType.sleep,
        timestamp: today.toISOString(),
        endTime: new Date(today.getTime() - 1000).toISOString(),
        sleepLocation: SleepLocation.crib,
      };

      await request(app)
        .post('/api/events')
        .send(eventData)
        .expect(400);
    });

    it('should reject missing required fields', async () => {
      const eventData = {
        type: EventType.feed,
        feedType: FeedType.bottle,
        timestamp: today.toISOString(),
        // Missing amount field
      };

      await request(app)
        .post('/api/events')
        .send(eventData)
        .expect(400);
    });
  });

  describe('GET /api/events', () => {
    beforeEach(async () => {
      // Create test events for different types
      await createTestEvent({
        type: EventType.feed,
        feedType: FeedType.bottle,
        timestamp: today.toISOString(),
        amount: 120,
      });

      await createTestEvent({
        type: EventType.feed,
        feedType: FeedType.breastfeeding,
        timestamp: today.toISOString(),
        leftDuration: 300,
        rightDuration: 240,
      });

      await createTestEvent({
        type: EventType.diaper,
        timestamp: today.toISOString(),
        diaperType: DiaperType.wet,
      });

      await createTestEvent({
        type: EventType.sleep,
        timestamp: today.toISOString(),
        endTime: new Date(today.getTime() + 3600000).toISOString(),
        sleepLocation: SleepLocation.crib,
      });
    });

    it('should retrieve all events within date range', async () => {
      const response = await request(app)
        .get('/api/events')
        .query({
          startDate: format(today, 'yyyy-MM-dd'),
          endDate: format(tomorrow, 'yyyy-MM-dd'),
        })
        .expect(200);

      expect(response.body.events).toHaveLength(4);
      expect(response.body.events).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: EventType.feed, feedType: FeedType.bottle }),
          expect.objectContaining({ type: EventType.feed, feedType: FeedType.breastfeeding }),
          expect.objectContaining({ type: EventType.diaper }),
          expect.objectContaining({ type: EventType.sleep }),
        ])
      );
    });

    // Edge cases for GET /api/events
    it('should handle missing date parameters', async () => {
      await request(app)
        .get('/api/events')
        .expect(400);
    });

    it('should handle invalid date format', async () => {
      await request(app)
        .get('/api/events')
        .query({
          startDate: 'invalid-date',
          endDate: format(tomorrow, 'yyyy-MM-dd'),
        })
        .expect(400);
    });

    it('should handle end date before start date', async () => {
      await request(app)
        .get('/api/events')
        .query({
          startDate: format(tomorrow, 'yyyy-MM-dd'),
          endDate: format(today, 'yyyy-MM-dd'),
        })
        .expect(400);
    });
  });

  describe('PUT /api/events/:id', () => {
    let eventId: string;

    beforeEach(async () => {
      const event = await createTestEvent({
        type: EventType.feed,
        feedType: FeedType.bottle,
        timestamp: today.toISOString(),
        amount: 120,
      });
      eventId = event.id;
    });

    it('should update an existing event', async () => {
      const updateData = {
        amount: 150,
      };

      const response = await request(app)
        .put(`/api/events/${eventId}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        id: eventId,
        amount: 150,
      });
    });

    // Edge cases for PUT /api/events/:id
    it('should reject updates to non-existent event', async () => {
      const updateData = {
        amount: 150,
      };
      const nonExistentId = generateTestId();

      await request(app)
        .put(`/api/events/${nonExistentId}`)
        .send(updateData)
        .expect(404);
    });

    it('should reject invalid update data', async () => {
      const updateData = {
        type: 'invalid_type',
      };

      await request(app)
        .put(`/api/events/${eventId}`)
        .send(updateData)
        .expect(400);
    });

    it('should reject updates that would make end time before start time', async () => {
      const updateData = {
        endTime: new Date(today.getTime() - 1000).toISOString(),
      };

      await request(app)
        .put(`/api/events/${eventId}`)
        .send(updateData)
        .expect(400);
    });

    it('should reject malformed event ID', async () => {
      const updateData = {
        amount: 150,
      };

      await request(app)
        .put('/api/events/invalid-id-format')
        .send(updateData)
        .expect(400);
    });
  });

  describe('DELETE /api/events/:id', () => {
    let eventId: string;

    beforeEach(async () => {
      const event = await createTestEvent({
        type: EventType.feed,
        feedType: FeedType.bottle,
        timestamp: today.toISOString(),
        amount: 120,
      });
      eventId = event.id;
    });

    it('should delete an existing event', async () => {
      await request(app)
        .delete(`/api/events/${eventId}`)
        .expect(204);

      const deletedEvent = await prisma.event.findUnique({
        where: { id: eventId },
      });
      expect(deletedEvent).toBeNull();
    });

    // Edge cases for DELETE /api/events/:id
    it('should handle deletion of non-existent event', async () => {
      const nonExistentId = generateTestId();

      await request(app)
        .delete(`/api/events/${nonExistentId}`)
        .expect(404);
    });

    it('should handle malformed event ID', async () => {
      await request(app)
        .delete('/api/events/invalid-id-format')
        .expect(400);
    });
  });

  describe('GET /api/aggregations', () => {
    beforeEach(async () => {
      // Create test events for aggregations
      await createTestEvent({
        type: EventType.feed,
        feedType: FeedType.bottle,
        timestamp: today.toISOString(),
        amount: 120,
      });

      await createTestEvent({
        type: EventType.feed,
        feedType: FeedType.breastfeeding,
        timestamp: today.toISOString(),
        leftDuration: 300,
        rightDuration: 240,
      });

      await createTestEvent({
        type: EventType.diaper,
        timestamp: today.toISOString(),
        diaperType: DiaperType.wet,
      });

      await createTestEvent({
        type: EventType.sleep,
        timestamp: today.toISOString(),
        endTime: new Date(today.getTime() + 3600000).toISOString(),
        sleepLocation: SleepLocation.crib,
      });
    });

    it('should return correct aggregations for all event types', async () => {
      const response = await request(app)
        .get('/api/aggregations')
        .query({
          startDate: today.toISOString(),
          endDate: tomorrow.toISOString(),
        })
        .expect(200);

      expect(response.body).toEqual({
        startDate: today.toISOString(),
        endDate: tomorrow.toISOString(),
        weeklyStats: expect.arrayContaining([
          expect.objectContaining({
            weekStart: expect.any(String),
            dailyAverages: expect.objectContaining({
              feed: expect.objectContaining({
                count: 2,
                byType: expect.objectContaining({
                  bottle: expect.objectContaining({
                    count: 1,
                    amount: 120
                  }),
                  breastfeeding: expect.objectContaining({
                    count: 1,
                    leftDuration: 300,
                    rightDuration: 240,
                    totalDuration: 540
                  }),
                  solids: expect.objectContaining({
                    count: 0,
                    amount: 0
                  })
                })
              }),
              sleep: expect.objectContaining({
                count: 1,
                duration: 60,
                byLocation: expect.objectContaining({
                  [SleepLocation.crib]: expect.objectContaining({
                    count: 1,
                    duration: 60
                  })
                })
              }),
              diaper: expect.objectContaining({
                count: 1,
                byType: expect.objectContaining({
                  [DiaperType.wet]: 1,
                  [DiaperType.dirty]: 0
                })
              })
            })
          })
        ])
      });
    });

    // Edge cases for GET /api/aggregations
    it('should handle missing date parameters', async () => {
      await request(app)
        .get('/api/aggregations')
        .expect(400);
    });

    it('should handle invalid date format', async () => {
      await request(app)
        .get('/api/aggregations')
        .query({
          startDate: 'invalid-date',
          endDate: tomorrow.toISOString(),
        })
        .expect(400);
    });

    it('should handle end date before start date', async () => {
      await request(app)
        .get('/api/aggregations')
        .query({
          startDate: tomorrow.toISOString(),
          endDate: today.toISOString(),
        })
        .expect(400);
    });

    it('should return empty aggregation for date range with no events', async () => {
      const response = await request(app)
        .get('/api/aggregations')
        .query({
          startDate: '2024-01-01T00:00:00.000Z',
          endDate: '2024-01-31T23:59:59.999Z',
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-01-31T23:59:59.999Z',
        weeklyStats: []
      });
    });
  });
}); 