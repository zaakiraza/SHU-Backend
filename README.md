# Hackthon Project

A Node.js and Express-based backend service for managing universities, societies, announcements, reviews, categories, and user authentication. The project exposes REST APIs for student, society, and admin workflows and is designed to support a university review platform.

## Features

- User registration, login, OTP verification, and resend OTP flow
- University and society management with approval workflows
- Announcement and comment handling
- Category-based organization for content
- JWT-based authentication and role-based access control
- MongoDB integration with Mongoose
- Security middleware including Helmet, CORS, and input sanitization

## Project Structure

```bash
hackthon/
├── app.js
├── package.json
├── controllers/
├── middleware/
├── models/
├── routes/
├── utils/
└── postman/
```

## Tech Stack

- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- Nodemailer for OTP emails
- Helmet, CORS, express-rate-limit, express-mongo-sanitize

## Prerequisites

Make sure you have the following installed:

- Node.js (v18 or higher recommended)
- MongoDB running locally or a reachable MongoDB Atlas URI

## Installation

1. Clone the repository
2. Navigate to the backend folder

```bash
cd hackthon
```

3. Install dependencies

```bash
npm install
```

## Environment Variables

Create a `.env` file in the `hackthon` folder with the following variables:

```env
PORT=8080
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/SHU
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
```

## Running the Project

Start the development server:

```bash
npm start
```

The server will run on the port defined in your `.env` file or `8080` by default.

## Seed Data

To populate sample data:

```bash
npm run seed
```

## API Overview

Common endpoints include:

- Auth
  - `POST /api/auth/register`
  - `POST /api/auth/verify-otp`
  - `POST /api/auth/resend-otp`
  - `POST /api/auth/login`

- Universities
  - `GET /api/universities`
  - `GET /api/universities/:id`
  - `POST /api/universities`

- Societies
  - `GET /api/societies`
  - `GET /api/societies/:id`
  - `POST /api/societies`

- Health Check
  - `GET /health`

## Notes

- The app uses MongoDB connection logic from `utils/DB.js`.
- Some features such as cron jobs are available in the utilities folder and can be enabled as needed.
- A Postman collection is included in the `postman` folder for API testing.

## License

This project is licensed under the ISC license.
