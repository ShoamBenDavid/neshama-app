const express = require('express');
const cors = require('cors');

const authRoutes = require('../../src/routes/authRoutes');
const journalRoutes = require('../../src/routes/journalRoutes');
const forumRoutes = require('../../src/routes/forumRoutes');
const contentRoutes = require('../../src/routes/contentRoutes');
const chatRoutes = require('../../src/routes/chatRoutes');

function createApp() {
  const app = express();

  app.use(cors({ origin: '*', credentials: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use('/api/auth', authRoutes);
  app.use('/api/journal', journalRoutes);
  app.use('/api/forum', forumRoutes);
  app.use('/api/content', contentRoutes);
  app.use('/api/chat', chatRoutes);

  app.get('/api/health', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Server is running',
      timestamp: new Date().toISOString(),
    });
  });

  app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
  });

  app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  });

  return app;
}

module.exports = createApp;
