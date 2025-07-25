const axios = require('axios');

module.exports = async (req, res) => {
  const { code, state } = req.query;
  
  if (!code) {
    return res.status(400).json({ error: 'No authorization code received' });
  }
  
  try {
    const tokenResponse = await axios.post('https://api.ticktick.com/oauth/token', {
      client_id: process.env.TICKTICK_CLIENT_ID,
      client_secret: process.env.TICKTICK_CLIENT_SECRET,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: process.env.TICKTICK_REDIRECT_URI || 'https://ticktick-sync.vercel.app/auth/callback'
    });
    
    const { access_token, refresh_token } = tokenResponse.data;
    
    // Store tokens securely (in production, use a database)
    // For now, we'll return them to the frontend
    res.json({ 
      success: true, 
      access_token,
      refresh_token,
      message: 'OAuth2 authentication successful'
    });
  } catch (error) {
    console.error('OAuth2 error:', error.response?.data || error.message);
    res.status(500).json({ error: 'OAuth2 authentication failed' });
  }
}; 