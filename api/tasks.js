const axios = require('axios');

// TickTick API configuration
const TICKTICK_API_BASE = 'https://api.ticktick.com/api';
let accessToken = null;

// OAuth2 Configuration
const OAUTH_CONFIG = {
  client_id: process.env.TICKTICK_CLIENT_ID,
  client_secret: process.env.TICKTICK_CLIENT_SECRET,
  redirect_uri: process.env.TICKTICK_REDIRECT_URI || 'https://ticktick-sync.vercel.app/api/callback',
  auth_url: 'https://ticktick.com/oauth/authorize',
  token_url: 'https://api.ticktick.com/oauth/token'
};

// Get tasks from TickTick
async function getTasks() {
  if (!accessToken) {
    throw new Error('No access token available. Please authenticate first.');
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

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Check if TickTick credentials are configured
    if (!process.env.TICKTICK_CLIENT_ID || !process.env.TICKTICK_CLIENT_SECRET) {
      return res.status(401).json({ 
        error: 'TickTick credentials not configured',
        requiresAuth: true 
      });
    }

    // Try to get real tasks from TickTick
    try {
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
    } catch (authError) {
      console.error('Authentication error:', authError.message);
      // Return OAuth2 auth URL for frontend to handle
      const authUrl = `${OAUTH_CONFIG.auth_url}?` +
        `client_id=${OAUTH_CONFIG.client_id}&` +
        `redirect_uri=${encodeURIComponent(OAUTH_CONFIG.redirect_uri)}&` +
        `response_type=code&` +
        `scope=tasks:read tasks:write&` +
        `state=${Math.random().toString(36).substring(7)}&` +
        `_cb=${Date.now()}`;
      
      console.log('OAuth2 redirect URI:', OAUTH_CONFIG.redirect_uri);
      console.log('Environment variable:', process.env.TICKTICK_REDIRECT_URI);
      
      res.status(401).json({ 
        error: 'OAuth2 authentication required',
        requiresAuth: true,
        authUrl: authUrl
      });
    }
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
}; 