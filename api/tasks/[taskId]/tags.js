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

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { taskId } = req.query;
    const { tags } = req.body;
    
    if (!taskId) {
      return res.status(400).json({ error: 'Task ID is required' });
    }
    
    if (!tags || !Array.isArray(tags)) {
      return res.status(400).json({ error: 'Tags array is required' });
    }
    
    await updateTask(taskId, tags);
    res.json({ success: true, message: 'Task updated successfully' });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
}; 