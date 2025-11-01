# Expense Splitter App

A full-stack expense splitting application similar to Splitwise, built with React (Vite), Express, and MongoDB. Track shared expenses, split bills with friends, manage groups, and settle up easily.

## Features

- **User Authentication**: Sign up, login, and secure JWT-based authentication
- **Friends Management**: Add friends, send/accept friend requests
- **Groups**: Create groups for shared expenses (trips, households, etc.)
- **Expense Tracking**: Add expenses, split equally or custom amounts
- **Transaction Management**: Track who owes whom, settle up with one click
- **Balance Summary**: View your balances with all friends and groups
- **Modern UI**: Beautiful, responsive design with Tailwind CSS

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, React Router
- **Backend**: Express 5, Node.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Deployment**: Vercel

## Project Structure

```
ExpenseSplitter/
├── Client/                 # React frontend (Vite)
│   ├── src/
│   │   ├── Components/    # React components
│   │   │   ├── Layout/    # Layout components
│   │   │   └── Pages/     # Page components
│   │   ├── lib/           # API client and utilities
│   │   └── App.jsx        # Main app component
│   └── package.json
├── Server/                 # Express backend
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── middleware/        # Auth middleware
│   └── server.js          # Server entry point
├── api/                    # Vercel serverless wrapper
└── vercel.json            # Vercel configuration
```

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- MongoDB database (local or MongoDB Atlas)

### Backend Setup

1. Navigate to the Server directory:

```bash
cd Server
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key_here
PORT=5000
```

4. Start the server:

```bash
npm start
```

The server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the Client directory:

```bash
cd Client
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file (optional):

```env
VITE_API_URL=http://localhost:5000/api
```

4. Start the development server:

```bash
npm run dev
```

The app will run on `http://localhost:5173`

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Friends

- `GET /api/friends` - Get all friends
- `POST /api/friends/request` - Send friend request
- `PUT /api/friends/accept/:id` - Accept friend request
- `GET /api/friends/pending` - Get pending requests

### Groups

- `GET /api/groups` - Get all groups
- `GET /api/groups/:id` - Get single group
- `POST /api/groups` - Create group
- `POST /api/groups/:id/members` - Add member to group
- `DELETE /api/groups/:id/members/:userId` - Remove member

### Expenses

- `GET /api/expenses` - Get all expenses
- `GET /api/expenses/:id` - Get single expense
- `POST /api/expenses` - Create expense
- `DELETE /api/expenses/:id` - Delete expense

### Transactions

- `GET /api/transactions` - Get all transactions
- `GET /api/transactions/summary` - Get balance summary
- `PUT /api/transactions/:id/settle` - Settle transaction

## Deployment to Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Configure environment variables in Vercel:

   - `MONGODB_URI`
   - `JWT_SECRET`
   - `NODE_ENV=production`

4. Vercel will automatically build and deploy:
   - Client: Static build
   - API: Serverless functions

The `vercel.json` file is already configured for this setup.

## Environment Variables

### Backend (.env)

```
MONGODB_URI=mongodb://localhost:27017/expense-splitter
JWT_SECRET=your-secret-key-here
PORT=5000
NODE_ENV=development
```

### Frontend (.env)

```
VITE_API_URL=/api
```

For production on Vercel, the API URL should be `/api` to use the same domain.

## Usage

1. **Sign Up/Login**: Create an account or login
2. **Add Friends**: Send friend requests by email
3. **Create Groups**: Create groups for shared expenses (e.g., "Weekend Trip", "House Rent")
4. **Add Expenses**: Add expenses in groups or individually, split with friends
5. **Settle Up**: View balances and settle transactions when someone pays

## Features in Detail

### Expense Splitting

- Equal split: Automatically divides amount equally among selected people
- Category tracking: Categorize expenses (Food, Travel, Entertainment, etc.)
- Group expenses: Expenses tied to specific groups
- Individual expenses: Track expenses between two friends

### Balance Calculation

- Automatic calculation: System calculates who owes whom based on expenses
- Group balances: Track balances within groups
- Friend balances: Overall balance with each friend across all groups

## License

MIT
