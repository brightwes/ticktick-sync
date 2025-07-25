module.exports = (req, res) => {
  res.json({ 
    message: 'Server is running!', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    hasTickTick: !!(process.env.TICKTICK_CLIENT_ID && process.env.TICKTICK_CLIENT_SECRET),
    version: '1.0.3'
  });
}; 