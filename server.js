const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Optional Clerk middleware
let clerk = null;
if (process.env.CLERK_SECRET_KEY && process.env.CLERK_PUBLISHABLE_KEY) {
  try {
    const { ClerkExpressWithAuth } = require('@clerk/clerk-sdk-node');
    clerk = ClerkExpressWithAuth({
      secretKey: process.env.CLERK_SECRET_KEY,
      publishableKey: process.env.CLERK_PUBLISHABLE_KEY
    });
    app.use(clerk);
  } catch (error) {
    console.log('Clerk not available:', error.message);
  }
}

// TickTick API configuration
const TICKTICK_API_BASE = 'https://api.ticktick.com/api/v2';
let accessToken = null;

// Authentication function for TickTick
async function authenticateTickTick() {
  try {
    const response = await axios.post(`${TICKTICK_API_BASE}/oauth/token`, {
      client_id: process.env.TICKTICK_CLIENT_ID,
      client_secret: process.env.TICKTICK_CLIENT_SECRET,
      grant_type: 'password',
      username: process.env.TICKTICK_USERNAME,
      password: process.env.TICKTICK_PASSWORD
    });
    
    accessToken = response.data.access_token;
    return accessToken;
  } catch (error) {
    console.error('Authentication failed:', error.message);
    throw error;
  }
}

// Get tasks from TickTick
async function getTasks() {
  if (!accessToken) {
    await authenticateTickTick();
  }
  
  try {
    const response = await axios.get(`${TICKTICK_API_BASE}/task/all`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to fetch tasks:', error.message);
    throw error;
  }
}

// Update task with tags
async function updateTask(taskId, tags) {
  if (!accessToken) {
    await authenticateTickTick();
  }
  
  try {
    // Add "processed" tag to mark this task as completed
    const tagsWithProcessed = [...tags, 'processed'];
    
    const response = await axios.put(`${TICKTICK_API_BASE}/task/${taskId}`, {
      tags: tagsWithProcessed
    }, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to update task:', error.message);
    throw error;
  }
}

// Tag suggestion logic
function suggestTags(taskTitle, taskContent = '') {
  const text = (taskTitle + ' ' + taskContent).toLowerCase();
  const suggestions = [];
  
  // Define tag categories and keywords
  const tagCategories = {
    'work': ['meeting', 'project', 'deadline', 'report', 'presentation', 'client', 'email', 'call'],
    'personal': ['family', 'home', 'health', 'exercise', 'diet', 'hobby', 'travel', 'shopping'],
    'urgent': ['asap', 'urgent', 'emergency', 'critical', 'deadline', 'due'],
    'important': ['important', 'priority', 'key', 'essential', 'critical'],
    'low-priority': ['low', 'minor', 'optional', 'nice-to-have', 'when-time'],
    'creative': ['design', 'creative', 'art', 'writing', 'content', 'marketing', 'brand']
  };
  
  // Check each category
  Object.entries(tagCategories).forEach(([tag, keywords]) => {
    const matches = keywords.filter(keyword => text.includes(keyword));
    if (matches.length > 0) {
      suggestions.push(tag);
    }
  });
  
  // Add default tags based on content length and complexity
  if (text.length > 100) {
    suggestions.push('detailed');
  }
  
  if (text.includes('review') || text.includes('check')) {
    suggestions.push('review');
  }
  
  return suggestions;
}

// Helper function to check authentication
function isAuthenticated(req) {
  if (clerk && req.auth) {
    return !!req.auth.userId;
  }
  // If Clerk is not configured, allow access (for testing)
  return true;
}

// API Routes
app.get('/api/tasks', async (req, res) => {
  try {
    // Check if user is authenticated (if Clerk is configured)
    if (!isAuthenticated(req)) {
      return res.status(401).json({ 
        error: 'Not authenticated',
        requiresAuth: true 
      });
    }

    // Check if TickTick credentials are configured
    if (!process.env.TICKTICK_CLIENT_ID || !process.env.TICKTICK_CLIENT_SECRET) {
      return res.status(401).json({ 
        error: 'TickTick credentials not configured',
        requiresAuth: true 
      });
    }

    const tasks = await getTasks();
    // Filter for unprocessed tasks (no "processed" tag)
    const unprocessedTasks = tasks.filter(task => 
      !task.tags || !task.tags.includes('processed')
    );
    
    // Add tag suggestions to each task
    const tasksWithSuggestions = unprocessedTasks.map(task => ({
      ...task,
      suggestedTags: suggestTags(task.title, task.content)
    }));
    
    res.json(tasksWithSuggestions);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

app.post('/api/tasks/:taskId/tags', async (req, res) => {
  try {
    // Check if user is authenticated (if Clerk is configured)
    if (!isAuthenticated(req)) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { taskId } = req.params;
    const { tags } = req.body;
    
    await updateTask(taskId, tags);
    res.json({ success: true, message: 'Task updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Simple test route
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Server is running!', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    hasClerk: !!clerk,
    hasTickTick: !!(process.env.TICKTICK_CLIENT_ID && process.env.TICKTICK_CLIENT_SECRET)
  });
});

// Serve the main application
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} to access the application`);
}); 