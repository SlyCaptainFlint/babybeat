import { PrismaClient, SleepLocation } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';
import { parseISO } from 'date-fns/parseISO';
import { addMinutes } from 'date-fns';

const prisma = new PrismaClient();

interface SnooEvent {
  _id: string;
  sessionId: string;
  UTCTime: string;
  level: string;
  event: string;
  active: string;
  hold: string;
  sinceSessionStart: string;
}

interface SleepSession {
  startTime: Date;
  endTime: Date;
  location: SleepLocation;
}

function parseDuration(durationStr: string): number {
  // Handle empty or invalid duration strings
  if (!durationStr || durationStr === '0') return 0;

  let totalMinutes = 0;
  
  // Parse hours
  const hoursMatch = durationStr.match(/(\d+)h/);
  if (hoursMatch) {
    totalMinutes += parseInt(hoursMatch[1]) * 60;
  }
  
  // Parse minutes
  const minutesMatch = durationStr.match(/(\d+)m/);
  if (minutesMatch) {
    totalMinutes += parseInt(minutesMatch[1]);
  }

  return totalMinutes;
}

async function importSleepEvents(csvPath: string, dryRun: boolean = false) {
  try {
    // Read and parse CSV file
    const fileContent = readFileSync(csvPath, 'utf-8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    }) as SnooEvent[];

    // Filter out rows without sessionId and group by sessionId
    const sessions = records
      .filter(record => record.sessionId && record.sessionId !== '')
      .reduce((acc, record) => {
        if (!acc[record.sessionId]) {
          acc[record.sessionId] = {
            timestamps: [],
            level: record.level,
            sinceSessionStart: record.sinceSessionStart,
          };
        }
        acc[record.sessionId].timestamps.push(parseISO(record.UTCTime));
        return acc;
      }, {} as Record<string, { timestamps: Date[], level: string, sinceSessionStart: string }>);

    console.log(`Found ${Object.keys(sessions).length} sleep sessions to import`);
    if (dryRun) {
      console.log('DRY RUN - No changes will be made to the database\n');
    }

    // Process each session
    for (const [sessionId, data] of Object.entries(sessions)) {
      try {
        const timestamps = data.timestamps.sort((a, b) => a.getTime() - b.getTime());
        const startTime = timestamps[0];
        
        // Determine location based on level
        const location: SleepLocation = (data.level.toLowerCase() === 'manual') ? 'crib' : 'bassinet';
        
        // Calculate end time based on event type
        let endTime: Date;
        if (location === 'crib') {
          // For manual events, use the duration from sinceSessionStart
          const durationMinutes = parseDuration(data.sinceSessionStart);
          endTime = addMinutes(startTime, durationMinutes);
        } else {
          // For non-manual events, use the last timestamp
          endTime = timestamps[timestamps.length - 1];
        }

        if (dryRun) {
          console.log('Would import sleep event:', {
            sessionId,
            startTime,
            endTime,
            location,
            duration: `${Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60))} minutes`,
            isManual: data.level === 'manual',
          });
        } else {
          const createdEvent = await prisma.event.create({
            data: {
              type: 'sleep',
              timestamp: startTime,
              endTime: endTime,
              sleepLocation: location,
            },
          });
          console.log(`Imported sleep event: ${createdEvent.id} (${location}) from ${startTime.toISOString()} to ${endTime.toISOString()}`);
        }
      } catch (error) {
        console.error(`Error processing session ${sessionId}:`, error);
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
  console.error('Usage: ts-node import-sleep-events.ts <csv-file> [--dry-run]');
  process.exit(1);
}

const csvPath = args[0];
const dryRun = args.includes('--dry-run');

importSleepEvents(csvPath, dryRun); 