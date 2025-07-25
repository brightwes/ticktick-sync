# TickTick Task Tagger

An automated task tagging system for TickTick that helps you efficiently organize your tasks with intelligent tag suggestions.

## Features

- **Smart Tag Suggestions**: Automatically suggests relevant tags based on task content
- **Batch Processing**: Process multiple unprocessed tasks in sequence
- **Pre-selected Recommendations**: Suggested tags are automatically checked for quick approval
- **Modern Interface**: Clean, responsive design with intuitive controls
- **Real-time Statistics**: Track your progress with live counters
- **Easy Tag Management**: Simple checkbox interface for selecting tags

## Supported Tags

The system suggests tags from these categories:

- **Work**: meeting, project, deadline, report, presentation, client, email, call
- **Personal**: family, home, health, exercise, diet, hobby, travel, shopping
- **Priority**: urgent, important, low-priority
- **Type**: creative, detailed, review
- **Specific**: health, family, shopping, travel, exercise

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file and update it with your TickTick credentials:

```bash
cp env.example .env
```

Edit `.env` and add your TickTick API credentials:

```env
TICKTICK_CLIENT_ID=your_client_id_here
TICKTICK_CLIENT_SECRET=your_client_secret_here
TICKTICK_USERNAME=your_username_here
TICKTICK_PASSWORD=your_password_here
PORT=3001
```

### 3. Get TickTick API Credentials

To use this application, you'll need to:

1. Create a TickTick developer account
2. Register your application to get API credentials
3. Obtain your client ID and client secret from TickTick's developer portal

### 4. Start the Application

```bash
npm start
```

The application will be available at `http://localhost:3001`

## Usage

1. **Load Tasks**: The application automatically loads unprocessed tasks from TickTick
2. **Review Suggestions**: Each task shows pre-selected suggested tags based on content analysis
3. **Customize Tags**: Check or uncheck tags as needed
4. **Save & Continue**: Click "Save & Continue" to apply tags and move to the next task
5. **Track Progress**: Monitor your progress with the statistics bar

## How It Works

### Task Processing Flow

1. **Fetch Unprocessed Tasks**: Retrieves tasks that don't have a "processed" tag
2. **Analyze Content**: Analyzes task title and content for relevant keywords
3. **Suggest Tags**: Uses keyword matching to suggest appropriate tags
4. **User Review**: Presents the task with pre-selected suggested tags
5. **Apply Tags**: Updates the task in TickTick with selected tags + "processed" tag
6. **Continue**: Moves to the next unprocessed task

### Task Tracking System

The system automatically adds a "processed" tag to tasks after you tag them. This ensures:
- **No Duplicate Processing**: Tasks won't appear again once tagged
- **Progress Tracking**: You can see which tasks have been completed
- **Easy Reset**: Use the "Reset All Tasks" button to start over (for testing)

### Tag Suggestion Algorithm

The system uses keyword matching to suggest tags:

- **Work-related**: Detects words like "meeting", "project", "deadline", "client"
- **Personal**: Identifies "family", "home", "health", "exercise", "travel"
- **Priority**: Recognizes "urgent", "important", "asap", "critical"
- **Content-based**: Suggests "detailed" for long tasks, "review" for review tasks

## API Endpoints

- `GET /api/tasks` - Fetch unprocessed tasks with tag suggestions
- `POST /api/tasks/:taskId/tags` - Update task with selected tags
- `GET /api/health` - Health check endpoint

## Development

### Running in Development Mode

```bash
npm run dev
```

This will start the server with nodemon for automatic restarts.

### Project Structure

```
ticktick-sync/
├── server.js          # Main server file
├── package.json       # Dependencies and scripts
├── public/           # Frontend files
│   ├── index.html    # Main HTML file
│   ├── styles.css    # CSS styles
│   └── script.js     # Frontend JavaScript
├── env.example       # Environment variables template
└── README.md         # This file
```

## Troubleshooting

### Common Issues

1. **Authentication Failed**: Check your TickTick credentials in the `.env` file
2. **No Tasks Found**: Ensure you have tasks without tags or marked as "unprocessed"
3. **API Errors**: Verify your TickTick API credentials and permissions

### Debug Mode

Enable debug logging by setting:

```env
NODE_ENV=development
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions, please create an issue in the repository. 