import { PrismaClient, Event, EventType, FeedType, DiaperType, SleepLocation } from '@prisma/client';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, parseISO } from 'date-fns';

interface BaseFeedTypeStats {
  count: number;
}

interface BottleFeedStats extends BaseFeedTypeStats {
  amount: number;  // ml per feed
}

interface BreastfeedingStats extends BaseFeedTypeStats {
  leftDuration: number;
  rightDuration: number;
  totalDuration: number;
}

interface SolidsFeedStats extends BaseFeedTypeStats {
  amount: number;  // g per feed
}

interface FeedAggregation {
  count: number;
  byType: {
    bottle: BottleFeedStats;
    breastfeeding: BreastfeedingStats;
    solids: SolidsFeedStats;
  };
}

interface SleepAggregation {
  count: number;
  duration: number;
  byLocation: Partial<Record<SleepLocation, { count: number; duration: number }>>;
}

interface DiaperAggregation {
  count: number;
  byType: Record<DiaperType, number>;
}

export interface WeeklyStats {
  weekStart: string;  // ISO date string for Monday
  dailyAverages: {
    feed?: FeedAggregation;
    sleep?: SleepAggregation;
    diaper?: DiaperAggregation;
  };
}

export interface AggregationData {
  startDate: string;
  endDate: string;
  weeklyStats: WeeklyStats[];
}

export class AggregationHelper {
  constructor(private prisma = new PrismaClient()) {}

  async getAggregations(startDate: string, endDate: string): Promise<AggregationData> {
    const events = await this.prisma.event.findMany({
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate
        },
      },
      orderBy: {
        timestamp: 'asc'
      }
    });

    // Group events by week
    const eventsByWeek = events.reduce((acc, event) => {
      const weekStartKey = startOfWeek(event.timestamp, { weekStartsOn: 1 }).toISOString();
      if (!acc[weekStartKey]) {
        acc[weekStartKey] = [];
      }
      acc[weekStartKey].push(event);
      return acc;
    }, {} as Record<string, Event[]>);


    const weeklyStats = Object.entries(eventsByWeek).map(([weekStart, weekEvents]) => {
      const dailyAverages = {
        feed: this.calculateFeedAverages(weekEvents),
        sleep: this.calculateSleepAverages(weekEvents),
        diaper: this.calculateDiaperAverages(weekEvents)
      };

      return {
        weekStart,
        dailyAverages
      };
    });

    return {
      startDate,
      endDate,
      weeklyStats
    };
  }

  private countDaysWithData(events: Event[]): number {
    const uniqueDays = new Set(
      events.map(event => format(new Date(event.timestamp), 'yyyy-MM-dd'))
    );
    return uniqueDays.size;
  }


  private calculateFeedAverages(events: Event[]) {
    const feedEvents = events.filter(e => e.type === EventType.feed);
    const daysWithData = this.countDaysWithData(feedEvents);
    if(daysWithData === 0) return { count: 0, byType: {
      bottle: { count: 0, amount: 0 },
      breastfeeding: { count: 0, leftDuration: 0, rightDuration: 0, totalDuration: 0 },
      solids: { count: 0, amount: 0 }
    } };

    const bottleEvents = feedEvents.filter(e => e.feedType === FeedType.bottle);
    const solidsEvents = feedEvents.filter(e => e.feedType === FeedType.solids);
    const breastfeedingEvents = feedEvents.filter(e => e.feedType === FeedType.breastfeeding);

    return {
      count: feedEvents.length / daysWithData,
      byType: {
        bottle: {
          count: bottleEvents.length / daysWithData,
          amount: bottleEvents.reduce((sum, e) => sum + (e.amount || 0), 0) / daysWithData
        },
        solids: {
          count: solidsEvents.length / daysWithData,
          amount: solidsEvents.reduce((sum, e) => sum + (e.amount || 0), 0) / daysWithData
        },
        breastfeeding: {
          count: breastfeedingEvents.length / daysWithData,
          leftDuration: breastfeedingEvents.reduce((sum, e) => sum + (e.leftDuration || 0), 0) / daysWithData,
          rightDuration: breastfeedingEvents.reduce((sum, e) => sum + (e.rightDuration || 0), 0) / daysWithData,
          totalDuration: breastfeedingEvents.reduce((sum, e) => sum + ((e.leftDuration || 0) + (e.rightDuration || 0)), 0) / daysWithData
        }
      }
    };
  }

  private calculateSleepAverages(events: Event[]) {
    const sleepEvents = events.filter(e => e.type === EventType.sleep);
    const daysWithData = this.countDaysWithData(sleepEvents);
    if(daysWithData === 0) return { count: 0, duration: 0, byLocation: {} };

    let totalDuration = 0;

    const dailyAveragesByLocation = sleepEvents.reduce((acc, event) => {
      if (!event.sleepLocation || !event.endTime) return acc;
      if(acc[event.sleepLocation] === undefined) {
        acc[event.sleepLocation] = { count: 0, duration: 0 };
      }
      
      const duration = new Date(event.endTime).getTime() - new Date(event.timestamp).getTime();
      const durationMinutes = duration / (1000 * 60);
      totalDuration += durationMinutes;

      acc[event.sleepLocation].count += 1 / daysWithData;
      acc[event.sleepLocation].duration += durationMinutes / daysWithData;
      
      return acc;
    }, {} as Record<SleepLocation, { count: number; duration: number }>);

    return {
      count: sleepEvents.length / daysWithData,
      duration: totalDuration / daysWithData,
      byLocation: dailyAveragesByLocation
    };
  }

  private calculateDiaperAverages(events: Event[]) {
    const diaperEvents = events.filter(e => e.type === EventType.diaper);
    const daysWithData = this.countDaysWithData(diaperEvents);
    if(daysWithData === 0) return { count: 0, byType: {[DiaperType.wet]: 0, [DiaperType.dirty]: 0} };

    // Count by type
    const byType = diaperEvents.reduce((acc, event) => {
      if (event.diaperType) {
        acc[event.diaperType]++;
      }
      return acc;
    }, { [DiaperType.wet]: 0, [DiaperType.dirty]: 0 });

    return {
      count: diaperEvents.length / daysWithData,
      byType: {
        wet: byType.wet / daysWithData,
        dirty: byType.dirty / daysWithData
      }
    };
  }
} 