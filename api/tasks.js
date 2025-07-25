const axios = require('axios');

// TickTick API configuration
const TICKTICK_API_BASE = 'https://api.ticktick.com/api/v2';
let accessToken = null;

// OAuth2 Configuration
const OAUTH_CONFIG = {
  client_id: process.env.TICKTICK_CLIENT_ID,
  client_secret: process.env.TICKTICK_CLIENT_SECRET,
  redirect_uri: process.env.TICKTICK_REDIRECT_URI || 'https://ticktick-sync.vercel.app/auth/callback',
  auth_url: 'https://ticktick.com/oauth/authorize',
  token_url: 'https://api.ticktick.com/oauth/token'
};

// Authentication function for TickTick using OAuth2
async function authenticateTickTick() {
  try {
    // For OAuth2, we need to redirect the user to TickTick for authorization
    // Since this is an API endpoint, we'll return an auth URL for the frontend
    const authUrl = `${OAUTH_CONFIG.auth_url}?` +
      `client_id=${OAUTH_CONFIG.client_id}&` +
      `redirect_uri=${encodeURIComponent(OAUTH_CONFIG.redirect_uri)}&` +
      `response_type=code&` +
      `scope=read write&` +
      `state=${Math.random().toString(36).substring(7)}`;
    
    throw new Error('OAuth2 authentication required');
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

    // For now, return mock data since OAuth2 requires user interaction
    const mockTasks = [
      {
        id: '1',
        title: 'Complete project proposal',
        content: 'Finish the quarterly project proposal for the marketing team',
        dueDate: '2025-07-30',
        projectName: 'Work',
        priority: 'High',
        tags: [],
        suggestedTags: ['work', 'important', 'project']
      },
      {
        id: '2',
        title: 'Buy groceries',
        content: 'Get milk, bread, eggs, and vegetables for the week',
        dueDate: '2025-07-26',
        projectName: 'Personal',
        priority: 'Normal',
        tags: [],
        suggestedTags: ['personal', 'shopping']
      },
      {
        id: '3',
        title: 'Review code changes',
        content: 'Review the latest pull request for the authentication module',
        dueDate: '2025-07-28',
        projectName: 'Work',
        priority: 'High',
        tags: [],
        suggestedTags: ['work', 'review', 'important']
      }
    ];
    
    res.json(mockTasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
}; 