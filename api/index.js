const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Simple test route
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Server is running!', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve the main application
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Handle all other routes
app.get('*', (req, res) => {
  res.json({ 
    message: 'Route not found', 
    path: req.path,
    method: req.method 
  });
});

// Export for Vercel
module.exports = app; 