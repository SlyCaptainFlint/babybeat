const { execSync } = require('child_process');
const dotenv = require('dotenv');

// Load test environment variables
dotenv.config({ path: '.env.test' });

console.log('Starting test database setup...');
console.log('Current working directory:', process.cwd());
console.log('Database URL:', process.env.DATABASE_URL);

try {
  // Drop existing test database if it exists
  try {
    console.log('Attempting to drop existing test database...');
    execSync('dropdb baby_tracker_test', { stdio: 'inherit' });
    console.log('Successfully dropped existing test database');
  } catch (error) {
    // Ignore error if database doesn't exist
    if (!error.message.includes('does not exist')) {
      console.error('Error dropping database:', error);
      throw error;
    }
    console.log('No existing database to drop');
  }
  
  // Create fresh test database
  try {
    console.log('Creating new test database...');
    execSync('createdb baby_tracker_test', { stdio: 'inherit' });
    console.log('Successfully created new test database');
  } catch (error) {
    console.error('Error creating database:', error);
    throw error;
  }
  
  // Run migrations on test database
  try {
    console.log('Running database migrations...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    console.log('Successfully applied database migrations');
  } catch (error) {
    console.error('Error running migrations:', error);
    throw error;
  }
  
  console.log('Test database setup completed successfully');
} catch (error) {
  console.error('Error during test database setup:', error);
  process.exit(1);
} 