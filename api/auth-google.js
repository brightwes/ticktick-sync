const axios = require('axios');

module.exports = async (req, res) => {
  const { access_token } = req.query;
  
  if (!access_token) {
    return res.status(400).json({ error: 'No Google access token provided' });
  }
  
  try {
    // First, get user info from Google
    const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });
    
    const userEmail = userInfoResponse.data.email;
    console.log('Google user email:', userEmail);
    
    // Now try to authenticate with TickTick using the Google token
    // This might require a different approach since TickTick OAuth2 seems incomplete
    
    res.json({ 
      success: true, 
      message: 'Google authentication successful',
      userEmail: userEmail,
      googleToken: access_token
    });
  } catch (error) {
    console.error('Google auth error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Google authentication failed' });
  }
}; 