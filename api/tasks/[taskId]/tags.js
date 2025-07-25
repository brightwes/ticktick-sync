const axios = require('axios');

// TickTick API configuration
const TICKTICK_API_BASE = 'https://api.ticktick.com/api';
let accessToken = null;

// Update task with tags
async function updateTask(taskId, tags) {
  if (!accessToken) {
    throw new Error('No access token available. Please authenticate first.');
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