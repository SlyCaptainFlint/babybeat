import { EventType, FeedType } from '../types';
import {
  LocalDrink,
  Restaurant,
  ChildCare,
  Bed,
} from '@mui/icons-material';

export const eventColors = {
  feed: {
    main: '#1976d2',
    light: '#e3f2fd',
    icon: Restaurant,
    variants: {
      breastfeeding: {
        main: '#1976d2',
        light: '#e3f2fd',
        icon: ChildCare,
      },
      bottle: {
        main: '#1976d2',
        light: '#e3f2fd',
        icon: LocalDrink,
      },
      solids: {
        main: '#1976d2',
        light: '#e3f2fd',
        icon: Restaurant,
      },
    },
  },
  sleep: {
    main: '#7b1fa2',
    light: '#f3e5f5',
    icon: Bed,
  },
  diaper: {
    main: '#2e7d32',
    light: '#e8f5e9',
    icon: ChildCare,
  },
} as const;

export const getEventIcon = (type: EventType, feedType?: FeedType) => {
  switch (type) {
    case EventType.FEED:
      switch (feedType) {
        case FeedType.BOTTLE:
          return LocalDrink;
        case FeedType.SOLIDS:
          return Restaurant;
        case FeedType.BREASTFEEDING:
          return ChildCare;
      }
    case EventType.SLEEP:
      return Bed;
    case EventType.DIAPER:
      return ChildCare;
  }
};

export const getEventColor = (type: EventType, feedType?: string) => {
  if (type === EventType.FEED && feedType) {
    return eventColors.feed.variants[feedType as keyof typeof eventColors.feed.variants].main;
  }
  return eventColors[type].main;
};

export const getEventLightColor = (type: EventType, feedType?: string) => {
  if (type === EventType.FEED && feedType) {
    return eventColors.feed.variants[feedType as keyof typeof eventColors.feed.variants].light;
  }
  return eventColors[type].light;
}; 