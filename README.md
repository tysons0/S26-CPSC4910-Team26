# Good Driver Incentive Program

A full-stack web application designed to incentivize safe driving habits through a rewards program. The application allows drivers to track their performance, earn points, and redeem rewards from sponsoring organizations.

## Team Members

- Armando Sallas
- David Misyuk
- Derek Smith
- Ross Nebitt
- Tyson Small

## Tech Stack

### Backend
- **.NET 10** - REST API built with ASP.NET Core
- **C#** - Primary backend language
- **SQL Server** - Database management
- **Xunit** - Testing Framework
- **JWT Authentication** - Secure token-based authentication
- **SendGrid** - Email service integration
- **eBay API** - External marketplace integration

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **JavaScript/JSX** - Frontend scripting
- **CSS** - Styling
- **AWS Amplify** - Deployment and hosting

## Project Structure

```
├── Class4910Api/                 # Backend .NET API
│   ├── Class4910Api/
│   │   ├── Controllers/          # API endpoints
│   │   ├── Models/               # Data models
│   │   ├── Services/             # Business logic
│   │   ├── Configuration/        # App configuration
│   │   └── Program.cs            # Application entry point
│   └── Class4910Tests/           # Backend unit tests
│
└── CPSC4910-Team26-GoodDriverIncentiveProgram/  # Frontend React app
    ├── src/
    │   ├── components/           # React components
    │   ├── pages/                # Page components
    │   ├── services/             # API service calls
    │   ├── hooks/                # Custom React hooks
    │   ├── context/              # React context providers
    │   ├── css/                  # Stylesheets
    │   └── App.jsx               # Root component
    ├── public/                   # Static assets
    └── amplify/                  # AWS Amplify configuration
```

## Features

- **Driver Management** - Register and manage driver profiles
- **Points System** - Earn points for safe driving
- **Wishlist System** - Track desired rewards
- **Order Management** - Purchase and track reward orders
- **Notifications** - Real-time alerts and updates
- **Admin Dashboard** - Manage drivers, sponsors, and reports
- **eBay Integration** - Browse and purchase items as rewards
- **Email Notifications** - Automated email communications
- **User Authentication** - Secure login with JWT tokens
- **Organization Management** - Multiple organization support

## Setup and Installation

### Prerequisites
- .NET 10 SDK or later
- Node.js (v16 or later) and npm
- MySql Database
- Docker (For testing)

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd Class4910Api/Class4910Api
   ```

2. Install dependencies (NuGet packages are restored automatically):
   ```bash
   dotnet restore
   ```

3. Configure the database connection in `appsettings.Development.json`:
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "your_connection_string"
     }
   }
   ```

4. Apply database migrations:
   ```bash
   dotnet ef database update
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd CPSC4910-Team26-GoodDriverIncentiveProgram
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables in `.env` (if needed):
   ```
   VITE_API_URL=http://localhost:5000
   ```

## Running the Application

### Backend
```bash
cd Class4910Api/Class4910Api
dotnet run
```
The API will be available at `http://localhost:7177`

### Frontend
```bash
cd CPSC4910-Team26-GoodDriverIncentiveProgram
npm run dev
```
The frontend will be available at `http://localhost:5173`

## Building for Production

### Backend
```bash
cd Class4910Api/Class4910Api
dotnet run
```

### Frontend
```bash
cd CPSC4910-Team26-GoodDriverIncentiveProgram
npm run build
```

## API Documentation

The backend provides REST API endpoints for:

- **Authentication** - `POST /api/auth/login`, `POST /api/auth/register`
- **Users** - `GET/POST/PUT/DELETE /api/users`
- **Drivers** - `GET/POST/PUT /api/drivers`
- **Orders** - `GET/POST /api/orders`
- **Catalog** - `GET /api/catalog`
- **Organizations** - `GET/POST /api/organizations`
- **Notifications** - `GET /api/notifications`
- **Reports** - `GET /api/reports`
- **eBay Integration** - `GET /api/ebay/search`

Full API documentation is available through Scalar at `http://localhost:5000/scaler` when running in development mode.

## Deployment

The application is configured for deployment on AWS using Amplify:

1. Backend deployment is handled through github actions.
2. Frontend is automatically built and deployed via Amplify

## Database

MySQL Server is used for persistent data storage. Key tables include:
- Users
- Drivers
- Orders
- Organizations
- Notifications
- Points History

## Testing

Run backend tests:
```bash
cd Class4910Api
dotnet test
```

## Troubleshooting

- **Backend won't start**: Check database connection string in `appsettings.Development.json`
- **Frontend errors**: Ensure Node.js version is compatible and run `npm install` again
- **API connection issues**: Verify the backend is running and the `VITE_API_URL` is correctly configured
- **Database errors**: Verify SQL Server is running and accessible

## License

This project is created for CPSC 4910.
