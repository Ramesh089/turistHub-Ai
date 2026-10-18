const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');

dotenv.config();

const app = express();
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Tourist Hub AI API is running"
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is healthy"
  });
});
const PORT = process.env.PORT || 3001;

// CORS configuration supporting credentials and cookies
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  process.env.CLIENT_URL
].filter(Boolean);


const cors = require("cors");

const allowedOrigins = [
  "https://turisthub-ai.onrender.com",
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    if (
      allowedOrigins.includes(origin) ||
      process.env.NODE_ENV !== "production"
    ) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With"
  ]
}));

// Cookie & Body Parsers
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    platform: 'Tourist AI Hub API',
    tagline: 'Discover Incredible India – Travel Beyond Destinations',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/states', require('./routes/states'));
app.use('/api/destinations', require('./routes/destinations'));
app.use('/api/packages', require('./routes/packages'));
app.use('/api/hotels', require('./routes/hotels'));
app.use('/api/transport', require('./routes/transport'));
app.use('/api/guides', require('./routes/guides'));
app.use('/api/emergency', require('./routes/emergency'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/stats', require('./routes/stats'));

// 404 Route handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `API route not found: ${req.method} ${req.url}` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error occurred.'
  });
});

app.listen(PORT, () => {
  console.log(`Tourist Hub API is listening on http://localhost:${PORT}`);
});
