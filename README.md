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
- Docker and Docker Compose

### Environment Configuration (.env files)

This project uses Docker Compose and relies on several environment files (`.env`) to configure the services. These files contain sensitive information like database credentials and should **NOT** be committed to version control. Ensure they are added to your `.gitignore` file.

You will need to create the following files with the specified variables:

1.  **`./baby-tracker-service/db.env`**
    *   Used by the `db` service in `docker-compose.yml`.
    ```dotenv
    # Database configuration (for the PostgreSQL container itself)
    POSTGRES_USER=your_db_user       # e.g., postgres
    POSTGRES_PASSWORD=your_db_password # e.g., postgres
    POSTGRES_DB=your_db_name         # e.g., babybeat
    ```

2.  **`./baby-tracker-service/service.env`**
    *   Used by the `service` and `backup` containers via `docker-compose.yml`.
    *   Contains settings for processes running *inside* the Docker network.
    ```dotenv
    # Service configuration (for containers)
    DATABASE_URL=postgresql://your_db_user:your_db_password@db:5432/your_db_name # Connects to db service
    NODE_ENV=production
    BACKUP_DIR=/backups # Internal path for backup container
    ```

3.  **`./baby-tracker-service/.env`**
    *   Used *only* by local development scripts run on the host (e.g., `npm run dev`, `npm test`, `npx prisma migrate dev`).
    *   Loaded automatically by `dotenv` or Prisma CLI when running commands in `baby-tracker-service`.
    *   **Not** used by `docker-compose.yml`.
    ```dotenv
    # Local Development configuration (for host scripts)
    DATABASE_URL=postgresql://your_db_user:your_db_password@localhost:5432/your_db_name # Connects to exposed Docker port
    NODE_ENV=development
    ```

4.  **`./baby-tracker-web/web.env`**
    *   Used by the `web` service in `docker-compose.yml`.
    ```dotenv
    # Web client configuration
    VITE_API_URL=http://localhost:3000 # URL where the frontend can reach the backend service
    ```

**Important:** Replace placeholder values like `your_db_user`, `your_db_password`, and `your_db_name` with your actual desired credentials (matching between `db.env` and the `DATABASE_URL`s).

### Running the Application with Docker Compose

This is the recommended way to run the application locally for development and testing.

1.  **Ensure Docker Desktop is running.**
2.  **Create the required `.env` files** as described in the "Environment Configuration" section above.
3.  **Build and start the containers:**
    ```bash
    docker-compose up --build -d
    ```
    *   The `--build` flag rebuilds images if Dockerfiles have changed.
    *   The `-d` flag runs containers in detached mode (in the background).
4.  **Apply Database Migrations (First Time):** Although `start.sh` applies migrations on container startup, the very first time you might need to create the initial migration if it doesn't exist:
    ```bash
    # Run from the host machine (uses baby-tracker-service/.env)
    cd baby-tracker-service
    npx prisma migrate dev --name init
    cd .. 
    # Then restart the service container to apply it if needed
    docker-compose restart service
    ```
    *Subsequent startups using `docker-compose up` will automatically apply pending migrations defined in `prisma/migrations` via the service container's `start.sh` script.* 

5.  **Access the application:**
    *   Web interface: [http://localhost](http://localhost) (or the port specified for `web` service)
    *   API service: [http://localhost:3000](http://localhost:3000) (or the port specified for `service` service)

### Running Services Individually (Local Development without Docker for Service/Web)

If you prefer to run the database in Docker but the service and web components directly on your host machine:

1.  **Start the Database:**
    ```bash
    docker-compose up -d db
    ```
2.  **Configure Environment:** Ensure `baby-tracker-service/.env` and `baby-tracker-web/web.env` are created and configured correctly (pointing to `localhost:5432` for the database and `localhost:3000` for the API, respectively).
3.  **Backend Setup (baby-tracker-service):**
    ```bash
    cd baby-tracker-service
    npm install
    npx prisma migrate deploy # Apply migrations against Docker DB
    npm run dev             # Start dev server
    ```
4.  **Frontend Setup (baby-tracker-web):**
    ```bash
    cd baby-tracker-web
    npm install
    npm run dev             # Start dev server
    ```

### Other Useful Docker Compose Commands

*   **Stop containers:** `docker-compose down`
*   **View logs:** `docker-compose logs <service_name>` (e.g., `docker-compose logs service`, `docker-compose logs backup`)
*   **Follow logs:** `docker-compose logs -f <service_name>`
*   **Execute a command in a container:** `docker-compose exec <service_name> <command>` (e.g., `docker-compose exec service sh`)

## License

[MIT](LICENSE) 