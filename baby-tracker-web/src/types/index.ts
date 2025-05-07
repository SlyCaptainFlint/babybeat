export enum EventType {
  FEED = 'feed',
  SLEEP = 'sleep',
  DIAPER = 'diaper'
}

export enum FeedType {
  BOTTLE = 'bottle',
  BREASTFEEDING = 'breastfeeding',
  SOLIDS = 'solids'
}

export enum DiaperType {
  WET = 'wet',
  DIRTY = 'dirty',
}

export enum SleepLocation {
  CRIB = 'crib',
  BASSINET = 'bassinet',
  STROLLER = 'stroller',
  CAR = 'car',
  CARRIER = 'carrier',
  BED = 'bed',
  ARMS = 'arms'
}

interface BaseEvent {
  id: string;
  timestamp: string;
  type: EventType;
}

export interface BreastfeedingEvent extends BaseEvent {
  type: EventType.FEED;
  feedType: FeedType.BREASTFEEDING;
  leftDuration: number;
  rightDuration: number;
}

export interface BottleFeedEvent extends BaseEvent {
  type: EventType.FEED;
  feedType: FeedType.BOTTLE;
  amount: number;
}

export interface SolidsFeedEvent extends BaseEvent {
  type: EventType.FEED;
  feedType: FeedType.SOLIDS;
  amount: number;
}

export interface SleepEvent extends BaseEvent {
  type: EventType.SLEEP;
  sleepLocation: SleepLocation;
  endTime: string;
}

export interface DiaperEvent extends BaseEvent {
  type: EventType.DIAPER;
  diaperType: DiaperType;
}

export type Event = BreastfeedingEvent | BottleFeedEvent | SolidsFeedEvent | SleepEvent | DiaperEvent; 