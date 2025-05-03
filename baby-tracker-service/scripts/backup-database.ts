import { exec } from 'child_process';
import { promisify } from 'util';
import { format } from 'date-fns';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { config as loadEnv } from 'dotenv';
import os from 'os';

// Load environment variables
loadEnv();

const execAsync = promisify(exec);

interface BackupConfig {
  // Directory to store backups
  backupDir: string;
  // Number of daily backups to keep
  dailyBackupsToKeep: number;
  // Number of weekly backups to keep
  weeklyBackupsToKeep: number;
  // Database connection details
  dbName: string;
  dbUser: string;
  dbHost: string;
  dbPort: string;
}

// On macOS with Homebrew PostgreSQL, use the system username as default
const defaultUser = os.platform() === 'darwin' ? os.userInfo().username : 'postgres';

const config: BackupConfig = {
  backupDir: process.env.BACKUP_DIR || './babybeat_backups',
  dailyBackupsToKeep: 7,
  weeklyBackupsToKeep: 4,
  dbName: process.env.DATABASE_NAME || 'babybeat',
  dbUser: process.env.DATABASE_USER || defaultUser,
  dbHost: process.env.DATABASE_HOST || 'localhost',
  dbPort: process.env.DATABASE_PORT || '5432',
};

interface ExecError extends Error {
  stderr?: string;
  stdout?: string;
}

async function checkPostgresConnection() {
  try {
    // Try to connect to postgres database first
    await execAsync(`psql -h ${config.dbHost} -p ${config.dbPort} -U ${config.dbUser} -d postgres -c "SELECT 1"`);
    console.log('Successfully connected to PostgreSQL server');
    return true;
  } catch (error) {
    const err = error as ExecError;
    if (err.message.includes('role') && err.message.includes('does not exist')) {
      console.error('\nError: Database user not found. On macOS with Homebrew PostgreSQL:');
      console.error('1. The default superuser is your system username, not "postgres"');
      console.error('2. Set DATABASE_USER in your .env file to your system username');
      console.error('3. Or create the postgres user: createuser -s postgres\n');
    } else if (err.message.includes('GSSAPI')) {
      console.error('\nError: Authentication failed. Try these solutions:');
      console.error('1. Set DATABASE_USER in your .env file to your system username');
      console.error('2. Or add this line to your pg_hba.conf:');
      console.error('   host all all 127.0.0.1/32 trust\n');
    } else {
      console.error('\nError connecting to PostgreSQL:');
      console.error(err.message);
      console.error('\nPlease check your database connection settings in .env\n');
    }
    return false;
  }
}

async function ensureBackupDirectory() {
  if (!existsSync(config.backupDir)) {
    mkdirSync(config.backupDir, { recursive: true });
  }
}

async function createBackup() {
  const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm');
  const backupFile = join(config.backupDir, `backup_${timestamp}.sql`);
  
  // Create backup using pg_dump with compression
  const command = `pg_dump -h ${config.dbHost} -p ${config.dbPort} -U ${config.dbUser} -d ${config.dbName} -F c -f ${backupFile}`;
  
  try {
    console.log(`Creating backup: ${backupFile}`);
    await execAsync(command);
    console.log('Backup created successfully');
    return backupFile;
  } catch (error) {
    const err = error as ExecError;
    console.error('Error creating backup:', err.message);
    throw error;
  }
}

async function verifyBackup(backupFile: string) {
  // Verify backup using pg_restore in list mode
  const command = `pg_restore -l ${backupFile}`;
  
  try {
    await execAsync(command);
    console.log('Backup verification successful');
  } catch (error) {
    const err = error as ExecError;
    console.error('Backup verification failed:', err.message);
    throw error;
  }
}

async function rotateBackups() {
  const files = await execAsync(`ls -t ${config.backupDir}/backup_*.sql`);
  const backupFiles = files.stdout.trim().split('\n');
  
  // Group backups by week
  const weeklyBackups = new Map<string, string[]>();
  backupFiles.forEach(file => {
    const date = file.match(/backup_(\d{4}-\d{2}-\d{2})/)?.[1];
    if (date) {
      const week = format(new Date(date), "yyyy-'W'ww");
      if (!weeklyBackups.has(week)) {
        weeklyBackups.set(week, []);
      }
      weeklyBackups.get(week)?.push(file);
    }
  });
  
  // Keep only the most recent backup from each week
  const weeksToKeep = Array.from(weeklyBackups.keys())
    .sort()
    .slice(-config.weeklyBackupsToKeep);
  
  // Delete old backups
  for (const [week, files] of weeklyBackups.entries()) {
    if (!weeksToKeep.includes(week)) {
      // Delete all backups from this week
      for (const file of files) {
        await execAsync(`rm ${file}`);
        console.log(`Deleted old backup: ${file}`);
      }
    } else {
      // Keep only the most recent backup from this week
      const filesToDelete = files.slice(1);
      for (const file of filesToDelete) {
        await execAsync(`rm ${file}`);
        console.log(`Deleted old backup: ${file}`);
      }
    }
  }
}

async function main() {
  try {
    // Check PostgreSQL connection first
    const isConnected = await checkPostgresConnection();
    if (!isConnected) {
      process.exit(1);
    }

    await ensureBackupDirectory();
    const backupFile = await createBackup();
    await verifyBackup(backupFile);
    await rotateBackups();
    console.log('Backup process completed successfully');
  } catch (error) {
    const err = error as ExecError;
    console.error('Backup process failed:', err.message);
    process.exit(1);
  }
}

main(); 