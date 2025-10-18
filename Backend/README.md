# ShareKit - File Sharing Application

A Node.js application for file sharing and user management with JWT authentication.

## Features

- User registration and authentication
- File upload and management
- Profile picture upload
- JWT token-based authentication
- MongoDB database integration
- File storage with organized directories

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (running locally or cloud instance)
- npm or yarn

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   DB_URL=mongodb://localhost:27017/sharekit
   JWT=your_jwt_secret_key_here_change_this_in_production
   PORT=4000
   ```

4. Start the server:
   ```bash
   npm start
   ```

## API Endpoints

### Authentication

- `POST /api/signup` - Register a new user
  - Body: `{ "fullname": "string", "email": "string", "password": "string" }`

- `POST /api/login` - Login user
  - Body: `{ "email": "string", "password": "string" }`

- `POST /api/verifytoken` - Verify JWT token
  - Body: `{ "token": "string" }`

### File Management

- `POST /api/file` - Upload a file (requires authentication)
  - Headers: `Authorization: Bearer <token>`
  - Body: Form data with `files` field

- `GET /api/file` - Get user's files (requires authentication)
  - Headers: `Authorization: Bearer <token>`

- `DELETE /api/file/:id` - Delete a file (requires authentication)
  - Headers: `Authorization: Bearer <token>`

### Profile Management

- `POST /api/upload-Profile-Pic` - Upload profile picture (requires authentication)
  - Headers: `Authorization: Bearer <token>`
  - Body: Form data with `image` field

## Project Structure

```
ShareKit/
├── controller/          # Route controllers
├── middleware/          # Custom middleware
├── model/              # Database models
├── storage/            # File storage
│   ├── Files/         # Uploaded files
│   └── pictures/      # Profile pictures
├── view/              # Frontend files
├── index.js           # Main application file
└── package.json       # Dependencies
```

## Error Handling

The application includes comprehensive error handling for:
- Database connection issues
- File upload errors
- Authentication failures
- Validation errors
- Missing files or resources

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- File size limits (10MB)
- Input validation
- CORS support

## Development

To run in development mode with auto-restart:
```bash
npm run dev
```

## Troubleshooting

1. **MongoDB Connection Error**: Ensure MongoDB is running and the connection string is correct
2. **File Upload Errors**: Check that storage directories exist and have proper permissions
3. **JWT Errors**: Verify the JWT secret is set in the environment variables
4. **Port Already in Use**: Change the PORT in .env file or kill the process using the port 