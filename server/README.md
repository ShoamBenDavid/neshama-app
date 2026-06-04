# Neshama Server

Node.js backend server with MongoDB for the Neshama app.

## Features

- User authentication (Register/Login)
- JWT token-based authorization
- MongoDB database
- Express.js REST API

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (local installation or MongoDB Atlas)

## Installation

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables in `src/config/config.js`:
   - `MONGODB_URI` - Your MongoDB connection string
   - `JWT_SECRET` - A secret key for JWT signing (change in production!)
   - `PORT` - Server port (default: 5000)

4. Make sure MongoDB is running locally, or update the connection string for MongoDB Atlas.

## Running the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register a new user | No |
| POST | `/api/auth/login` | Login user | No |
| GET | `/api/auth/me` | Get current user | Yes |
| PUT | `/api/auth/profile` | Update user profile | Yes |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health check |

## Request/Response Examples

### Register
```json
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "0501234567"
}
```

### Login
```json
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Response (Success)
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "0501234567",
      "createdAt": "..."
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

## Project Structure

```
server/
├── src/
│   ├── config/
│   │   ├── config.js      # Environment configuration
│   │   └── db.js          # MongoDB connection
│   ├── controllers/
│   │   └── authController.js
│   ├── middleware/
│   │   └── auth.js        # JWT verification middleware
│   ├── models/
│   │   └── User.js        # User mongoose model
│   ├── routes/
│   │   └── authRoutes.js
│   └── index.js           # Entry point
├── package.json
└── README.md
```

