const axios = require('axios');

const TICKTICK_API_BASE = 'https://api.ticktick.com/api';

async function updateTask(taskId, tags, accessToken) {
  if (!accessToken) {
    throw new Error('No access token provided');
  }

  try {
    const response = await axios.put(`${TICKTICK_API_BASE}/v2/task/${taskId}`, {
      tags: tags
    }, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error updating task:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { taskId } = req.query;
    const { tags } = req.body;
    const accessToken = req.headers.authorization?.replace('Bearer ', '');

    if (!taskId || !tags) {
      return res.status(400).json({ error: 'Missing taskId or tags' });
    }

    const updatedTask = await updateTask(taskId, tags, accessToken);
    res.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
}; 