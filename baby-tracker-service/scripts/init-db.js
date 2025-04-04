const { execSync } = require('child_process');
const { parse } = require('pg-connection-string');
require('dotenv').config();

function runCommand(command, ignoreError = false) {
  try {
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    if (!ignoreError) {
      console.error(`Command failed: ${command}`);
      console.error(error.message);
    }
    return false;
  }
}

async function main() {
  console.log('🔍 Checking PostgreSQL status...');
  
  // Check if PostgreSQL service is running
  const pgStatus = runCommand('pg_isready -q');
  if (!pgStatus) {
    console.log('🚀 Starting PostgreSQL service...');
    // Try different commands based on common PostgreSQL installations
    const started = 
      runCommand('brew services start postgresql@14', true) ||
      runCommand('brew services start postgresql', true) ||
      runCommand('pg_ctl -D /usr/local/var/postgres start', true) ||
      runCommand('sudo service postgresql start', true);
    
    if (!started) {
      console.error('❌ Failed to start PostgreSQL. Please start it manually.');
      process.exit(1);
    }
    
    // Wait for PostgreSQL to be ready
    console.log('⏳ Waiting for PostgreSQL to be ready...');
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  // Parse DATABASE_URL to get database name and credentials
  const dbConfig = parse(process.env.DATABASE_URL);
  const dbName = dbConfig.database;
  const dbUser = dbConfig.user;
  const dbPass = dbConfig.password;

  // Create user if it doesn't exist
  console.log(`🔑 Ensuring database user "${dbUser}" exists...`);
  runCommand(`psql -d postgres -c "SELECT 1 FROM pg_roles WHERE rolname='${dbUser}'" | grep -q 1 || psql -d postgres -c "CREATE USER ${dbUser} WITH PASSWORD '${dbPass}'"`, true);

  // Check if database exists
  console.log(`🔍 Checking if database "${dbName}" exists...`);
  const dbExists = runCommand(`psql -lqt | cut -d \\| -f 1 | grep -qw ${dbName}`, true);
  
  if (!dbExists) {
    console.log(`📦 Creating database "${dbName}"...`);
    runCommand(`createdb ${dbName}`);
  }

  // Grant privileges to user
  console.log(`🔑 Granting privileges to "${dbUser}"...`);
  runCommand(`psql -d ${dbName} -c "GRANT ALL PRIVILEGES ON DATABASE ${dbName} TO ${dbUser}"`);
  runCommand(`psql -d ${dbName} -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${dbUser}"`);
  runCommand(`psql -d ${dbName} -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ${dbUser}"`);
  runCommand(`psql -d ${dbName} -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${dbUser}"`);
  runCommand(`psql -d ${dbName} -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${dbUser}"`);

  // Apply Prisma schema
  console.log('🔄 Applying database schema...');
  runCommand('npx prisma db push');
  
  console.log('✅ Database initialization complete!');
}

main().catch(error => {
  console.error('❌ Database initialization failed:', error);
  process.exit(1);
}); 