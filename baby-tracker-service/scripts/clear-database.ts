import { PrismaClient } from '@prisma/client';
import * as readline from 'node:readline';

const prisma = new PrismaClient();

async function confirmDeletion(): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(
      'WARNING: This will delete ALL events from the database. This action cannot be undone.\n' +
      'Are you sure you want to continue? (yes/no): ',
      (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'yes');
      }
    );
  });
}

async function clearDatabase() {
  try {
    // Get count of events before deletion
    const count = await prisma.event.count();
    console.log(`Found ${count} events in the database`);

    if (count === 0) {
      console.log('Database is already empty');
      return;
    }

    // Ask for confirmation
    const confirmed = await confirmDeletion();
    if (!confirmed) {
      console.log('Operation cancelled');
      return;
    }

    // Delete all events
    await prisma.event.deleteMany();
    console.log('All events have been deleted successfully');
  } catch (error) {
    console.error('Error clearing database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
clearDatabase(); 