import { AggregationHelper } from '../services/aggregationHelper';
import { EventType, FeedType, DiaperType, SleepLocation, PrismaClient } from '@prisma/client';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, addDays } from 'date-fns';
import { mockDeep } from 'jest-mock-extended';

// Create a deep mock of PrismaClient
const prismaMock = mockDeep<PrismaClient>();

// Mock the Prisma client
// jest.mock('@prisma/client', () => ({
//   PrismaClient: jest.fn().mockImplementation(() => prismaMock),
// }));

describe('AggregationHelper', () => {
  let aggregationHelper: AggregationHelper;

  beforeEach(() => {
    jest.clearAllMocks();
    aggregationHelper = new AggregationHelper(prismaMock);
  });

  describe('getAggregations', () => {
    it('should correctly aggregate bottle feed data', async () => {
      const today = new Date();
      const tomorrow = addDays(today, 1);
      const startDate = startOfDay(today).toISOString();
      const endDate = endOfDay(tomorrow).toISOString();

      // Mock database response
      prismaMock.event.findMany.mockResolvedValue([
        {
          id: '1',
          type: EventType.feed,
          feedType: FeedType.bottle,
          amount: 120,
          timestamp: today,
          endTime: null,
          leftDuration: null,
          rightDuration: null,
          sleepLocation: null,
          diaperType: null,
          createdAt: today,
          updatedAt: today,
        },
        {
          id: '2',
          type: EventType.feed,
          feedType: FeedType.bottle,
          amount: 180,
          timestamp: tomorrow,
          endTime: null,
          leftDuration: null,
          rightDuration: null,
          sleepLocation: null,
          diaperType: null,
          createdAt: tomorrow,
          updatedAt: tomorrow,
        },
      ]);

      const result = await aggregationHelper.getAggregations(startDate, endDate);

      expect(result).toEqual({
        startDate,
        endDate,
        weeklyStats: [{
          weekStart: startOfWeek(today, { weekStartsOn: 1 }).toISOString(),
          dailyAverages: {
            feed: {
              count: 1,
              byType: {
                bottle: { count: 1, amount: 150 }, 
                breastfeeding: { count: 0, leftDuration: 0, rightDuration: 0, totalDuration: 0 },
                solids: { count: 0, amount: 0 }
              }
            },
            sleep: {
              count: 0,
              duration: 0,
              byLocation: {}
            },
            diaper: {
              count: 0,
              byType: {
                [DiaperType.wet]: 0,
                [DiaperType.dirty]: 0
              }
            }
          }
        }]
      });
    });

    it('should correctly aggregate breastfeeding data', async () => {
      const today = new Date();
      const startDate = startOfDay(today).toISOString();
      const tomorrow = addDays(today, 1);
      const endDate = endOfDay(tomorrow).toISOString();

      // Mock database response
      prismaMock.event.findMany.mockResolvedValue([
        {
          id: '1',
          type: EventType.feed,
          feedType: FeedType.breastfeeding,
          amount: null,
          timestamp: today,
          endTime: null,
          leftDuration: 300,
          rightDuration: 240,
          sleepLocation: null,
          diaperType: null,
          createdAt: today,
          updatedAt: today,
        },
        {
          id: '2',
          type: EventType.feed,
          feedType: FeedType.breastfeeding,
          amount: null,
          timestamp: tomorrow,
          endTime: null,
          leftDuration: 360,
          rightDuration: 300,
          sleepLocation: null,
          diaperType: null,
          createdAt: today,
          updatedAt: today,
        },
      ]);

      const result = await aggregationHelper.getAggregations(startDate, endDate);

      expect(result).toEqual({
        startDate,
        endDate,
        weeklyStats: [{
          weekStart: startOfWeek(today, { weekStartsOn: 1 }).toISOString(),
          dailyAverages: {
            feed: {
              count: 1,
              byType: {
                bottle: { count: 0, amount: 0 },
                breastfeeding: { 
                  count: 1, 
                  leftDuration: 330, 
                  rightDuration: 270, 
                  totalDuration: 600 
                },
                solids: { count: 0, amount: 0 }
              }
            },
            sleep: {
              count: 0,
              duration: 0,
              byLocation: {}
            },
            diaper: {
              count: 0,
              byType: {
                [DiaperType.wet]: 0,
                [DiaperType.dirty]: 0
              }
            }
          }
        }]
      });
    });

    it('should handle mixed feed types', async () => {
      const today = new Date();
      const tomorrow = addDays(today, 1);
      const startDate = startOfDay(today).toISOString();
      const endDate = endOfDay(tomorrow).toISOString();

      // Mock database response
      prismaMock.event.findMany.mockResolvedValue([
        {
          id: '1',
          type: EventType.feed,
          feedType: FeedType.bottle,
          amount: 120,
          timestamp: today,
          endTime: null,
          leftDuration: null,
          rightDuration: null,
          sleepLocation: null,
          diaperType: null,
          createdAt: today,
          updatedAt: today,
        },
        {
          id: '2',
          type: EventType.feed,
          feedType: FeedType.breastfeeding,
          amount: null,
          timestamp: tomorrow,
          endTime: null,
          leftDuration: 300,
          rightDuration: 240,
          sleepLocation: null,
          diaperType: null,
          createdAt: tomorrow,
          updatedAt: tomorrow,
        },
      ]);

      const result = await aggregationHelper.getAggregations(startDate, endDate);

      expect(result).toEqual({
        endDate,
        startDate,
        weeklyStats: [{
          weekStart: startOfWeek(today, { weekStartsOn: 1 }).toISOString(),
          dailyAverages: {
            feed: {
              count: 1,
              byType: {
                bottle: { count: 0.5, amount: 60 },
                breastfeeding: { 
                  count: 0.5, 
                  leftDuration: 150, 
                  rightDuration: 120, 
                  totalDuration: 270 
                },
                solids: { count: 0, amount: 0 }
              }
            },
            sleep: {
              count: 0,
              duration: 0,
              byLocation: {}
            },
            diaper: {
              count: 0,
              byType: {
                [DiaperType.wet]: 0,
                [DiaperType.dirty]: 0
              }
            }
          }
        }]
      });
    });

    it('should correctly aggregate sleep data by location', async () => {
      const today = new Date();
      const startDate = startOfDay(today).toISOString();
      const endDate = endOfDay(today).toISOString();

      // Mock database response
      prismaMock.event.findMany.mockResolvedValue([
        {
          id: '1',
          type: EventType.sleep,
          feedType: null,
          amount: null,
          timestamp: today,
          endTime: new Date(today.getTime() + 1 * 60 * 60 * 1000),
          leftDuration: null,
          rightDuration: null,
          sleepLocation: SleepLocation.crib,
          diaperType: null,
          createdAt: today,
          updatedAt: today,
        },
        {
          id: '2',
          type: EventType.sleep,
          feedType: null,
          amount: null,
          timestamp: today,
          endTime: new Date(today.getTime() + 2 * 60 * 60 * 1000),
          leftDuration: null,
          rightDuration: null,
          sleepLocation: SleepLocation.crib,
          diaperType: null,
          createdAt: today,
          updatedAt: today,
        },
      ]);

      const result = await aggregationHelper.getAggregations(startDate, endDate);

      // Create expected byLocation with all SleepLocation values initialized to 0
      const expectedByLocation = {
        [SleepLocation.crib]: { count: 2, duration: 180 },
      };    

      expect(result).toEqual({
        startDate,
        endDate,
        weeklyStats: [{
          weekStart: startOfWeek(today, { weekStartsOn: 1 }).toISOString(),
          dailyAverages: {
            feed: {
              count: 0,
              byType: {
                bottle: { count: 0, amount: 0 },
                breastfeeding: { count: 0, leftDuration: 0, rightDuration: 0, totalDuration: 0 },
                solids: { count: 0, amount: 0 }
              }
            },
            sleep: {
              count: 2,
              duration: 180,
              byLocation: expectedByLocation
            },
            diaper: {
              count: 0,
              byType: {
                [DiaperType.wet]: 0,
                [DiaperType.dirty]: 0
              }
            }
          }
        }]
      });
    });

    it('should correctly aggregate diaper data by type', async () => {
      const today = new Date();
      const startDate = startOfDay(today).toISOString();
      const endDate = endOfDay(today).toISOString();

      // Mock database response
      prismaMock.event.findMany.mockResolvedValue([
        {
          id: '1',
          type: EventType.diaper,
          feedType: null,
          amount: null,
          timestamp: today,
          endTime: null,
          leftDuration: null,
          rightDuration: null,
          sleepLocation: null,
          diaperType: DiaperType.wet,
          createdAt: today,
          updatedAt: today,
        },
        {
          id: '2',
          type: EventType.diaper,
          feedType: null,
          amount: null,
          timestamp: today,
          endTime: null,
          leftDuration: null,
          rightDuration: null,
          sleepLocation: null,
          diaperType: DiaperType.dirty,
          createdAt: today,
          updatedAt: today,
        },
      ]);

      const result = await aggregationHelper.getAggregations(startDate, endDate);

      expect(result).toEqual({
        startDate,
        endDate,
        weeklyStats: [{
          weekStart: startOfWeek(today, { weekStartsOn: 1 }).toISOString(),
          dailyAverages: {
            feed: {
              count: 0,
              byType: {
                bottle: { count: 0, amount: 0 },
                breastfeeding: { count: 0, leftDuration: 0, rightDuration: 0, totalDuration: 0 },
                solids: { count: 0, amount: 0 }
              }
            },
            sleep: {
              count: 0,
              duration: 0,
              byLocation: {}
            },
            diaper: {
              count: 2,
              byType: {
                [DiaperType.wet]: 1,
                [DiaperType.dirty]: 1
              }
            }
          }
        }]
      });
    });
  });
}); 