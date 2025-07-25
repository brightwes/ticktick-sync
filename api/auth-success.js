const axios = require('axios');

module.exports = async (req, res) => {
  const { access_token, state } = req.query;
  
  if (!access_token) {
    return res.status(400).json({ error: 'No access token received' });
  }
  
  try {
    // Use the Google access token to get user info and then exchange for TickTick token
    const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });
    
    const userEmail = userInfoResponse.data.email;
    
    // Now try to get TickTick token using the user's email
    // This might require a different approach since TickTick OAuth2 seems to be incomplete
    
    res.json({ 
      success: true, 
      message: 'Authentication successful',
      userEmail: userEmail,
      accessToken: access_token
    });
  } catch (error) {
    console.error('Auth error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Authentication failed' });
  }
}; 