my-Chappy-App – A Chat Application

my-Chappy-App is a chat application featuring public channels, private direct messages (DMs), locked channels, and full user authentication.
Both guests and registered users can interact on the platform, but with different access levels.

This project demonstrates a complete full-stack application using React, TypeScript, Express, DynamoDB, JWT authentication, Zustand, and modern CSS.

Features:-

1.User Authentication
Register new accounts
Login with JWT tokens
Passwords hashed using bcrypt

2.Messaging
Send and read messages in public channels
Direct Messages (DMs) between two users
Locked channels visible only to logged-in users
Guests can read & write in open channels but cannot send DMs

3.Channel Management
Locked or open channels supported

4.Account Management
LocalStorage used for token & username persistence

5.Frontend
React + TypeScript
Zustand for state management
React Router for navigation
Responsive UI with modern styling
Clean message layout with hover effects

6.Backend
Node.js + Express REST API
AWS DynamoDB for storage
Zod for data validation
JWT authentication middleware

7.Separate routes for users, auth, channels, messages, and DMs

**************************************************************************************************************************
Tech Stack

Frontend
React
TypeScript
React Router
Zustand
CSS

Backend
Node.js
Express
AWS DynamoDB
JSON Web Tokens (JWT)
bcrypt
Zod


Environment Variables
PORT=4000
AWS_REGION=YOUR_REGION
AWS_ACCESS_KEY_ID=YOUR_KEY
AWS_SECRET_ACCESS_KEY=YOUR_SECRET
JWT_SECRET=YOUR_SECRET

'*****************************************************************************************************************
Installation & Setup

1. Clone the repository
git clone https://github.com/your-username/my-Chappy-App.git
cd my-chappy-App

2.Install dependencies
npm install

3.Add your .env file

4.Start the backend
npm run start-server

5.Start the frontend
npm run dev


Security
Passwords are hashed with bcrypt
JWT tokens stored in localStorage
Locked channels protected with authentication
Input validation using Zod on backend
