import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';
import { config as loadEnv } from 'dotenv';
import { parse } from 'pg-connection-string';

// Load environment variables
loadEnv();

const execAsync = promisify(exec);

interface RestoreConfig {
  // Database connection details
  dbName: string;
  dbUser: string;
  dbHost: string;
  dbPort: string;
  dbPassword?: string;
  // Whether to drop the existing database if it exists
  dropExisting: boolean;
}

interface ExecError extends Error {
  stderr?: string;
  stdout?: string;
}

// Function to initialize config from DATABASE_URL or defaults
function initializeConfig(): RestoreConfig {
  const dbUrl = process.env.DATABASE_URL;
  let config: Partial<RestoreConfig> = {};

  if (dbUrl) {
    try {
      const parsedUrl = parse(dbUrl);
      config.dbHost = parsedUrl.host || 'localhost';
      config.dbPort = parsedUrl.port || '5432';
      config.dbUser = parsedUrl.user || 'postgres';
      config.dbName = parsedUrl.database || 'babybeat';
      config.dbPassword = parsedUrl.password || undefined;
    } catch (e) {
      console.error("Error parsing DATABASE_URL, using defaults:", e);
    }
  }

  // Apply defaults if not parsed from URL
  return {
    dbHost: config.dbHost || 'localhost',
    dbPort: config.dbPort || '5432',
    dbUser: config.dbUser || 'postgres',
    dbName: config.dbName || 'babybeat',
    dbPassword: config.dbPassword,
    dropExisting: false,
  };
}

const restoreConfig = initializeConfig();

// Add PGPASSWORD to environment for psql commands if password exists
if (restoreConfig.dbPassword) {
  process.env.PGPASSWORD = restoreConfig.dbPassword;
}

async function checkBackupFile(backupFile: string) {
  if (!existsSync(backupFile)) {
    throw new Error(`Backup file not found: ${backupFile}`);
  }
  
  // Verify the backup file is a valid PostgreSQL backup
  try {
    await execAsync(`pg_restore -l ${backupFile}`);
    console.log('Backup file verification successful');
  } catch (error) {
    const err = error as ExecError;
    throw new Error(`Invalid backup file: ${err.message}`);
  }
}

async function checkDatabaseExists(): Promise<boolean> {
  try {
    await execAsync(`psql -h ${restoreConfig.dbHost} -p ${restoreConfig.dbPort} -U ${restoreConfig.dbUser} -d ${restoreConfig.dbName} -c "SELECT 1"`);
    return true;
  } catch {
    return false;
  }
}

async function dropDatabase() {
  console.log(`Dropping existing database: ${restoreConfig.dbName}`);
  
  // First, terminate all connections to the database
  try {
    await execAsync(`psql -h ${restoreConfig.dbHost} -p ${restoreConfig.dbPort} -U ${restoreConfig.dbUser} -d postgres -c "SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = '${restoreConfig.dbName}' AND pid <> pg_backend_pid();"`);
  } catch (error) {
    const err = error as ExecError;
    console.warn('Warning: Could not terminate existing connections (this might be okay):', err.stderr || err.message);
  }
  
  // Drop the database
  try {
    await execAsync(`dropdb -h ${restoreConfig.dbHost} -p ${restoreConfig.dbPort} -U ${restoreConfig.dbUser} ${restoreConfig.dbName}`);
    console.log('Database dropped successfully');
  } catch (error) {
    const err = error as ExecError;
    throw new Error(`Failed to drop database: ${err.stderr || err.message}`);
  }
}

async function createDatabase() {
  console.log(`Creating new database: ${restoreConfig.dbName}`);
  
  try {
    await execAsync(`createdb -h ${restoreConfig.dbHost} -p ${restoreConfig.dbPort} -U ${restoreConfig.dbUser} ${restoreConfig.dbName}`);
    console.log('Database created successfully');
  } catch (error) {
    const err = error as ExecError;
    throw new Error(`Failed to create database: ${err.stderr || err.message}`);
  }
}

async function restoreDatabase(backupFile: string) {
  console.log(`Restoring database ${restoreConfig.dbName} from backup: ${backupFile}`);
  
  try {
    const command = `pg_restore -h ${restoreConfig.dbHost} -p ${restoreConfig.dbPort} -U ${restoreConfig.dbUser} --clean --if-exists -d ${restoreConfig.dbName} ${backupFile}`;
    await execAsync(command);
    console.log('Database restored successfully');

  } catch (error) {
    const err = error as ExecError;
    throw new Error(`Failed to restore database: ${err.stderr || err.message}`);
  }
}

async function main() {
  try {
    // Get backup file path from command line arguments
    const backupFile = process.argv[2];
    if (!backupFile) {
      console.error('Please provide the path to the backup file');
      console.error('Usage: ts-node restore-database.ts <backup-file> [--drop-existing]');
      process.exit(1);
    }

    // Check if --drop-existing flag is present
    restoreConfig.dropExisting = process.argv.includes('--drop-existing');

    // Verify backup file
    await checkBackupFile(backupFile);

    // Check if target database exists
    const dbExists = await checkDatabaseExists();
    
    if (dbExists && restoreConfig.dropExisting) {
        await dropDatabase();
        await createDatabase();
    } else if (!dbExists) {
        await createDatabase();
    }

    // Restore the database
    await restoreDatabase(backupFile);
    
    console.log('Database restoration completed successfully');
  } catch (error) {
    const err = error as ExecError;
    console.error('Restoration failed:', err.message);
    process.exit(1);
  }
}

main(); 