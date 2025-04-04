# Baby Tracker

A comprehensive baby tracking application that helps parents monitor their baby's daily activities including feeding, sleeping, and diaper changes.

This application was created with support from Cursor AI. My goal was to implement all features and fix all bugs using natural language. In cases where the AI was unable to fix issues after multiple attempts, I fixed the code myself. Overall, the app features roughly 90% AI-generated/modified code. I found AI to be particularly effective in implementing new features, especially if they were relatively isolated from existing functionality. The AI struggled with aligning web service APIs and request/response types across the client and server, as well as in the server unit tests. It also had difficulty correctly using ReactRouter's APIs together with React 19 APIs (in particular, Suspense).

## Project Structure

This repository contains two main components:

- **baby-tracker-web**: A React web application for tracking baby activities
- **baby-tracker-service**: A Node.js backend service that provides the API for the web application

## Features

- Track feeding events (bottle, breastfeeding, solids)
- Monitor sleep patterns
- Record diaper changes
- View data visualizations and trends
- Responsive design for mobile and desktop

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- PostgreSQL database

### Backend Setup (baby-tracker-service)

1. Navigate to the service directory:
   ```
   cd baby-tracker-service
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/baby_tracker
   PORT=3001
   ```

4. Run database migrations:
   ```
   npx prisma migrate dev
   ```

5. Start the server:
   ```
   npm run dev
   ```

### Frontend Setup (baby-tracker-web)

1. Navigate to the web directory:
   ```
   cd baby-tracker-web
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## Offline Support

The application is designed to work offline:
- The home page will load with cached data when offline
- An offline indicator appears in the navbar when the service is unreachable
- The refresh icon can be used to attempt to reconnect to the server
- Event submissions are properly handled to prevent optimistic updates when offline

## License

[MIT](LICENSE) 