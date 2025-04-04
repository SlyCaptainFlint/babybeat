import { PrismaClient, EventType, FeedType, SleepLocation, DiaperType, Prisma } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';
import { parseISO } from 'date-fns/parseISO';

const prisma = new PrismaClient();

interface BottleData {
  amountImperial: number;
  amountMetric: number;
  type: string;
}

interface BreastfeedingData {
  lastUsedBreast?: string;
  left?: { duration: number };
  right?: { duration: number };
  totalDuration?: number;
}

interface DiaperData {
  types: string[];
}

interface CsvEvent {
  type: string;
  data: string;
  note: string;
  startTime: string;
  endTime: string;
}

function mapCsvToEvent(csvEvent: CsvEvent): Prisma.EventCreateInput {
  const timestamp = parseISO(csvEvent.startTime);
  const endTime = csvEvent.endTime ? parseISO(csvEvent.endTime) : null;
  
  switch (csvEvent.type) {
    case 'bottlefeeding': {
      const data = JSON.parse(csvEvent.data) as BottleData;
      return {
        type: 'feed',
        timestamp,
        endTime,
        feedType: 'bottle',
        amount: Math.round(data.amountMetric), // Convert to integer
      };
    }
    
    case 'breastfeeding': {
      const data = JSON.parse(csvEvent.data) as BreastfeedingData;
      return {
        type: 'feed',
        timestamp,
        endTime,
        feedType: 'breastfeeding',
        leftDuration: data.left ? Math.round(data.left.duration / 60) : 0, // Convert seconds to minutes, default to 0 if not present
        rightDuration: data.right ? Math.round(data.right.duration / 60) : 0, // Convert seconds to minutes, default to 0 if not present
      };
    }
    
    case 'diaper': {
      const data = JSON.parse(csvEvent.data) as DiaperData;
      // Map pee/poo to wet/dirty
      const diaperType = data.types.includes('pee') && data.types.includes('poo')
        ? 'dirty' // Default to dirty if both, since we don't have a 'both' type
        : data.types.includes('pee')
          ? 'wet'
          : 'dirty';
      
      return {
        type: 'diaper',
        timestamp,
        endTime,
        diaperType: diaperType as DiaperType,
      };
    }
    
    default:
      throw new Error(`Unknown event type: ${csvEvent.type}`);
  }
}

async function importEvents(csvPath: string, dryRun: boolean = false) {
  try {
    // Read and parse CSV file
    const fileContent = readFileSync(csvPath, 'utf-8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    });

    console.log(`Found ${records.length} events to import`);
    if (dryRun) {
      console.log('DRY RUN - No changes will be made to the database\n');
    }

    // Process each record
    for (const record of records) {
      try {
        const eventData = mapCsvToEvent(record);
        if (dryRun) {
          console.log('Would import event:', {
            type: eventData.type,
            timestamp: eventData.timestamp,
            ...(eventData.type === 'feed' && {
              feedType: eventData.feedType,
              amount: eventData.amount,
              leftDuration: eventData.leftDuration,
              rightDuration: eventData.rightDuration,
            }),
            ...(eventData.type === 'diaper' && {
              diaperType: eventData.diaperType,
            }),
          });
        } else {
          const createdEvent = await prisma.event.create({
            data: eventData,
          });
          console.log(`Imported event: ${createdEvent.type} at ${createdEvent.timestamp}`);
        }
      } catch (error) {
        console.error(`Error processing record:`, record);
        console.error(error);
      }
    }

    if (dryRun) {
      console.log('\nDry run completed. No changes were made to the database.');
    } else {
      console.log('Import completed successfully');
    }
  } catch (error) {
    console.error('Error during import:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get command line arguments
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Please provide the path to the CSV file');
  console.error('Usage: ts-node import-events.ts <csv-file> [--dry-run]');
  process.exit(1);
}

const csvPath = args[0];
const dryRun = args.includes('--dry-run');

importEvents(csvPath, dryRun); 