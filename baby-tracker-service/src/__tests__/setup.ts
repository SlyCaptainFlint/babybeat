import { PrismaClient } from '@prisma/client';
import { app, server } from '../index';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

const prisma = new PrismaClient();

// Clean up the database before each test
beforeEach(async () => {
  try {
    await prisma.event.deleteMany();
  } catch (error) {
    console.error('Error cleaning up database before test:', error);
    throw error;
  }
});

// Clean up the database and close connections after all tests
afterAll(async () => {
  try {
    await prisma.event.deleteMany();
    await prisma.$disconnect();
    server.close();
  } catch (error) {
    console.error('Error during test cleanup:', error);
    throw error;
  }
});

// Export the app for testing
export { app }; 