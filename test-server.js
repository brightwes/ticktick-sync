const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3010;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Mock TickTick tasks for testing
const mockTasks = [
    {
        id: '1',
        title: 'Review quarterly sales report',
        content: 'Need to analyze Q3 sales data and prepare presentation for management meeting',
        dueDate: '2024-01-15',
        projectName: 'Sales',
        priority: 'High',
        tags: [],
        suggestedTags: ['work', 'review', 'important', 'detailed']
    },
    {
        id: '2',
        title: 'Call mom about weekend plans',
        content: 'Discuss family dinner and travel arrangements',
        dueDate: '2024-01-10',
        projectName: 'Personal',
        priority: 'Normal',
        tags: [],
        suggestedTags: ['personal', 'family']
    },
    {
        id: '3',
        title: 'Urgent: Fix critical bug in production',
        content: 'Users reporting login issues. Need immediate attention.',
        dueDate: '2024-01-08',
        projectName: 'Development',
        priority: 'High',
        tags: [],
        suggestedTags: ['work', 'urgent', 'important']
    },
    {
        id: '4',
        title: 'Go to gym for cardio workout',
        content: '30 minutes cardio, 15 minutes strength training',
        dueDate: '2024-01-09',
        projectName: 'Health',
        priority: 'Normal',
        tags: [],
        suggestedTags: ['personal', 'health', 'exercise']
    },
    {
        id: '5',
        title: 'Design new marketing campaign',
        content: 'Create creative assets for social media campaign. Focus on brand consistency and engagement metrics.',
        dueDate: '2024-01-20',
        projectName: 'Marketing',
        priority: 'Normal',
        tags: [],
        suggestedTags: ['work', 'creative', 'detailed']
    }
];

// API Routes
app.get('/api/tasks', (req, res) => {
    // Filter for unprocessed tasks (no "processed" tag)
    const unprocessedTasks = mockTasks.filter(task => 
        !task.tags || !task.tags.includes('processed')
    );
    
    res.json(unprocessedTasks);
});

app.post('/api/tasks/:taskId/tags', (req, res) => {
    const { taskId } = req.params;
    const { tags } = req.body;
    
    // Find and update the task
    const taskIndex = mockTasks.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
        // Add "processed" tag to mark this task as completed
        const tagsWithProcessed = [...tags, 'processed'];
        mockTasks[taskIndex].tags = tagsWithProcessed;
        console.log(`Updated task ${taskId} with tags:`, tagsWithProcessed);
    }
    
    res.json({ success: true, message: 'Task updated successfully' });
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Reset processed tasks (for testing)
app.post('/api/reset-processed', (req, res) => {
    // Remove "processed" tag from all tasks
    mockTasks.forEach(task => {
        if (task.tags && task.tags.includes('processed')) {
            task.tags = task.tags.filter(tag => tag !== 'processed');
        }
    });
    
    console.log('Reset all processed tasks');
    res.json({ success: true, message: 'All tasks reset' });
});

// Serve the main application
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.listen(PORT, () => {
    console.log(`Test server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} to access the application`);
    console.log('This is a test server with mock data - no TickTick credentials required');
}); 