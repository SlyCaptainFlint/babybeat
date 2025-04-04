import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';
import { config as loadEnv } from 'dotenv';

// Load environment variables
loadEnv();

const execAsync = promisify(exec);

interface RestoreConfig {
  // Database connection details
  dbName: string;
  dbUser: string;
  dbHost: string;
  dbPort: string;
  // Whether to drop the existing database if it exists
  dropExisting: boolean;
}

interface ExecError extends Error {
  stderr?: string;
  stdout?: string;
}

const restoreConfig: RestoreConfig = {
  dbName: process.env.DATABASE_NAME || 'baby_tracker',
  dbUser: process.env.DATABASE_USER || 'postgres',
  dbHost: process.env.DATABASE_HOST || 'localhost',
  dbPort: process.env.DATABASE_PORT || '5432',
  dropExisting: false,
};

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
    console.warn('Warning: Could not terminate existing connections:', err.message);
  }
  
  // Drop the database
  try {
    await execAsync(`dropdb -h ${restoreConfig.dbHost} -p ${restoreConfig.dbPort} -U ${restoreConfig.dbUser} ${restoreConfig.dbName}`);
    console.log('Database dropped successfully');
  } catch (error) {
    const err = error as ExecError;
    throw new Error(`Failed to drop database: ${err.message}`);
  }
}

async function createDatabase() {
  console.log(`Creating new database: ${restoreConfig.dbName}`);
  
  try {
    await execAsync(`createdb -h ${restoreConfig.dbHost} -p ${restoreConfig.dbPort} -U ${restoreConfig.dbUser} ${restoreConfig.dbName}`);
    console.log('Database created successfully');
  } catch (error) {
    const err = error as ExecError;
    throw new Error(`Failed to create database: ${err.message}`);
  }
}

async function restoreDatabase(backupFile: string) {
  console.log(`Restoring database from backup: ${backupFile}`);
  
  try {
    // First restore to a temporary database
    const tempDbName = `${restoreConfig.dbName}_temp`;
    console.log(`Creating temporary database: ${tempDbName}`);
    await execAsync(`createdb -h ${restoreConfig.dbHost} -p ${restoreConfig.dbPort} -U ${restoreConfig.dbUser} ${tempDbName}`);
    
    try {
      // Restore to the temporary database
      console.log('Restoring to temporary database...');
      const command = `pg_restore -h ${restoreConfig.dbHost} -p ${restoreConfig.dbPort} -U ${restoreConfig.dbUser} -d ${tempDbName} ${backupFile}`;
      await execAsync(command);
      
      // Drop the target database if it exists
      if (await checkDatabaseExists()) {
        await dropDatabase();
      }
      
      // Rename the temporary database to the target database
      console.log('Moving restored database to final location...');
      await execAsync(`psql -h ${restoreConfig.dbHost} -p ${restoreConfig.dbPort} -U ${restoreConfig.dbUser} -d postgres -c "ALTER DATABASE ${tempDbName} RENAME TO ${restoreConfig.dbName};"`);
      
      console.log('Database restored successfully');
    } catch (error) {
      // Clean up the temporary database if something goes wrong
      try {
        await execAsync(`dropdb -h ${restoreConfig.dbHost} -p ${restoreConfig.dbPort} -U ${restoreConfig.dbUser} ${tempDbName}`);
      } catch (cleanupError) {
        console.warn('Warning: Could not clean up temporary database:', (cleanupError as ExecError).message);
      }
      throw error;
    }
  } catch (error) {
    const err = error as ExecError;
    throw new Error(`Failed to restore database: ${err.message}`);
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

    // Check if database exists
    const dbExists = await checkDatabaseExists();
    
    if (dbExists) {
      if (restoreConfig.dropExisting) {
        await dropDatabase();
      } else {
        console.error(`Database ${restoreConfig.dbName} already exists. Use --drop-existing flag to drop it first.`);
        process.exit(1);
      }
    }

    // Create new database if needed
    if (!dbExists || restoreConfig.dropExisting) {
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