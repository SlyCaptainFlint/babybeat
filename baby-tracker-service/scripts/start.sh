#!/bin/sh

# Wait for database to be ready
echo "Waiting for database to be ready..."
/app/node_modules/.bin/wait-on tcp:db:5432 -t 60000

# Run migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Start the application
echo "Starting the application..."
npm start 