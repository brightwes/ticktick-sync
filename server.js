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

// TickTick API configuration
const TICKTICK_API_BASE = 'https://api.ticktick.com/api/v2';
let accessToken = null;
let refreshToken = null;

// OAuth2 Configuration
const OAUTH_CONFIG = {
  client_id: process.env.TICKTICK_CLIENT_ID,
  client_secret: process.env.TICKTICK_CLIENT_SECRET,
  redirect_uri: process.env.TICKTICK_REDIRECT_URI || 'https://your-app.vercel.app/auth/callback',
  auth_url: 'https://ticktick.com/oauth/authorize',
  token_url: 'https://api.ticktick.com/oauth/token'
};

// OAuth2 Routes
app.get('/auth/login', (req, res) => {
  const authUrl = `${OAUTH_CONFIG.auth_url}?` +
    `client_id=${OAUTH_CONFIG.client_id}&` +
    `redirect_uri=${encodeURIComponent(OAUTH_CONFIG.redirect_uri)}&` +
    `response_type=code&` +
    `scope=read write&` +
    `state=${Math.random().toString(36).substring(7)}`;
  
  res.redirect(authUrl);
});

app.get('/auth/callback', async (req, res) => {
  const { code, state } = req.query;
  
  if (!code) {
    return res.redirect('/?error=no_code');
  }
  
  try {
    const tokenResponse = await axios.post(OAUTH_CONFIG.token_url, {
      client_id: OAUTH_CONFIG.client_id,
      client_secret: OAUTH_CONFIG.client_secret,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: OAUTH_CONFIG.redirect_uri
    });
    
    accessToken = tokenResponse.data.access_token;
    refreshToken = tokenResponse.data.refresh_token;
    
    // Store tokens securely (in production, use a database)
    console.log('OAuth2 authentication successful');
    
    res.redirect('/?auth=success');
  } catch (error) {
    console.error('OAuth2 error:', error.response?.data || error.message);
    res.redirect('/?error=auth_failed');
  }
});

// Authentication function (fallback for username/password)
async function authenticateTickTick() {
  if (accessToken) {
    return accessToken;
  }
  
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

// Refresh token function
async function refreshAccessToken() {
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }
  
  try {
    const response = await axios.post(OAUTH_CONFIG.token_url, {
      client_id: OAUTH_CONFIG.client_id,
      client_secret: OAUTH_CONFIG.client_secret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    });
    
    accessToken = response.data.access_token;
    refreshToken = response.data.refresh_token;
    return accessToken;
  } catch (error) {
    console.error('Token refresh failed:', error.message);
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
    if (error.response?.status === 401) {
      // Token expired, try to refresh
      await refreshAccessToken();
      return getTasks(); // Retry with new token
    }
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
    if (error.response?.status === 401) {
      // Token expired, try to refresh
      await refreshAccessToken();
      return updateTask(taskId, tags); // Retry with new token
    }
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

// API Routes
app.get('/api/tasks', async (req, res) => {
  console.log('API /api/tasks called');
  console.log('Environment variables:', {
    hasClientId: !!process.env.TICKTICK_CLIENT_ID,
    hasClientSecret: !!process.env.TICKTICK_CLIENT_SECRET,
    hasAccessToken: !!accessToken
  });
  
  try {
    // Check if we have OAuth2 credentials
    if (!process.env.TICKTICK_CLIENT_ID || !process.env.TICKTICK_CLIENT_SECRET) {
      console.log('No OAuth2 credentials configured');
      return res.status(401).json({ 
        error: 'OAuth2 credentials not configured',
        requiresAuth: true 
      });
    }

    // Check if we have an access token
    if (!accessToken) {
      console.log('No access token available');
      return res.status(401).json({ 
        error: 'Not authenticated',
        requiresAuth: true 
      });
    }

    console.log('Fetching tasks from TickTick...');
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
    
    console.log(`Found ${tasksWithSuggestions.length} unprocessed tasks`);
    res.json(tasksWithSuggestions);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

app.post('/api/tasks/:taskId/tags', async (req, res) => {
  try {
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
    env: process.env.NODE_ENV || 'development'
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