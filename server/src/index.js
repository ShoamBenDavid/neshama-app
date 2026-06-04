require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const config = require('./config/config');

// Route imports
const authRoutes = require('./routes/authRoutes');
const journalRoutes = require('./routes/journalRoutes');
const forumRoutes = require('./routes/forumRoutes');
const contentRoutes = require('./routes/contentRoutes');
const chatRoutes = require('./routes/chatRoutes');

// Initialize express app
const app = express();

// Connect to database (non-blocking)
console.log('Attempting to connect to MongoDB...');
connectDB().catch(err => {
  // Error already logged in connectDB
});

// Middleware
app.use(
  cors({
    origin: '*', // Allow all origins for development
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/chat', chatRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
});

// Start server
const PORT = config.PORT;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
  console.log(`🌐 Server listening on all network interfaces (0.0.0.0)`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Please use a different port or stop the other process.`);
  } else {
    console.error('❌ Server error:', err);
  }
  process.exit(1);
});
