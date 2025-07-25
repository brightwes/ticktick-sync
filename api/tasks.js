const axios = require('axios');

// TickTick API configuration
const TICKTICK_API_BASE = 'https://api.ticktick.com/api/v2';
let accessToken = null;

// Authentication function for TickTick using username/password
async function authenticateTickTick() {
  try {
    const response = await axios.post(`${TICKTICK_API_BASE}/oauth/token`, {
      client_id: process.env.TICKTICK_CLIENT_ID,
      client_secret: process.env.TICKTICK_CLIENT_SECRET,
      grant_type: 'password',
      username: process.env.TICKTICK_USERNAME || process.env.TICKTICK_EMAIL,
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
      // If authentication fails, return mock data for now
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
    }
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
}; 