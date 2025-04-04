# BabyBeat

A comprehensive baby tracking application that helps parents monitor their baby's daily activities including feeding, sleeping, and diaper changes.

This application was created with support from Cursor AI. My goal was to implement all features and fix all bugs using natural language. In cases where the AI was unable to fix issues after multiple attempts, I fixed the code myself. Overall, the app features roughly 90% AI-generated/modified code. I found AI to be particularly effective in implementing new features, especially if they were relatively isolated from existing functionality. The AI struggled with aligning web service APIs and request/response types across the client and server, as well as in the server unit tests. It also had difficulty correctly using ReactRouter's APIs together with React 19 APIs (in particular, Suspense).

## Project Structure

The project consists of two main components:

- **baby-tracker-web**: A React web application for tracking baby activities with BabyBeat
- **baby-tracker-service**: A Node.js backend service that provides the API for the BabyBeat web application

## Features

- Track feeding times and amounts
- Monitor sleep patterns
- Log diaper changes
- Record growth milestones
- View daily summaries and trends
- Multiple baby profiles support
- Responsive design for mobile and desktop

## Tech Stack

### Frontend
- React with TypeScript
- Vite for build tooling
- Material-UI
- React Router for navigation, data loading
- Chart.js for data visualization

### Backend
- Node.js with TypeScript
- Express.js
- PostgreSQL
- Prisma ORM
- Jest

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL database

### Backend Setup (baby-tracker-service)

1. Navigate to the service directory:
```bash
cd baby-tracker-service
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```
Edit the `.env` file with your database credentials and other configuration.

4. Run database migrations:
```bash
npx prisma migrate dev
```

5. Start the development server:
```bash
npm run dev
```

### Frontend Setup (baby-tracker-web)

1. Navigate to the web directory:
```bash
cd baby-tracker-web
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```
Edit the `.env` file with your backend API URL.

4. Start the development server:
```bash
npm run dev
```

## License

[MIT](LICENSE) 