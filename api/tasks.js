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
  token_url: 'https://ticktick.com/oauth/token'
};

// Get tasks from TickTick
async function getTasks() {
  if (!accessToken) {
    throw new Error('No access token available');
  }
  
  try {
    const response = await axios.get(`${TICKTICK_API_BASE}/v2/project/all`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    // Get all tasks from all projects
    const allTasks = [];
    for (const project of response.data) {
      if (project.inAll) {
        const tasksResponse = await axios.get(`${TICKTICK_API_BASE}/v2/project/${project.id}/tasks`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        allTasks.push(...tasksResponse.data);
      }
    }

    // Filter for unprocessed tasks (no tags or specific tag)
    return allTasks.filter(task => 
      !task.tags || 
      task.tags.length === 0 || 
      !task.tags.includes('processed')
    );
  } catch (error) {
    console.error('Error fetching tasks:', error.response?.data || error.message);
    throw error;
  }
}

// Tag suggestion logic
function suggestTags(taskTitle, taskContent = '') {
  const text = `${taskTitle} ${taskContent}`.toLowerCase();
  const suggestions = [];
  
  // Simple keyword-based suggestions
  const keywordMap = {
    'work': ['work', 'job', 'office', 'meeting', 'project'],
    'personal': ['personal', 'home', 'family', 'life'],
    'urgent': ['urgent', 'asap', 'important', 'critical', 'deadline'],
    'shopping': ['buy', 'purchase', 'shopping', 'store', 'grocery'],
    'health': ['exercise', 'workout', 'gym', 'health', 'medical', 'doctor'],
    'learning': ['study', 'learn', 'course', 'training', 'education'],
    'travel': ['travel', 'trip', 'vacation', 'flight', 'hotel'],
    'finance': ['money', 'bill', 'payment', 'budget', 'finance', 'bank']
  };

  for (const [tag, keywords] of Object.entries(keywordMap)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      suggestions.push(tag);
    }
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

    // Check if we have an access token
    if (!accessToken) {
      const authUrl = `${OAUTH_CONFIG.auth_url}?` +
        `client_id=${OAUTH_CONFIG.client_id}&` +
        `redirect_uri=${encodeURIComponent(OAUTH_CONFIG.redirect_uri)}&` +
        `response_type=code&` +
        `scope=tasks:read tasks:write&` +
        `state=${Math.random().toString(36).substring(7)}`;

      console.log('OAuth2 redirect URI:', OAUTH_CONFIG.redirect_uri);
      console.log('Environment variable:', process.env.TICKTICK_REDIRECT_URI);

      return res.status(401).json({ 
        error: 'OAuth2 authentication required', 
        requiresAuth: true, 
        authUrl: authUrl 
      });
    }

    const tasks = await getTasks();
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
}; 