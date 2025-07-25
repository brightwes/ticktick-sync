const axios = require('axios');

module.exports = async (req, res) => {
  console.log('Callback received:', req.query);
  console.log('Headers:', req.headers);
  
  const { code, state, error, error_description } = req.query;
  
  if (error) {
    console.error('OAuth2 error:', error, error_description);
    return res.redirect('/?error=' + encodeURIComponent(error_description || error));
  }
  
  if (!code) {
    console.error('No authorization code received');
    return res.redirect('/?error=no_code');
  }
  
  try {
    console.log('Exchanging code for token...');
    const tokenResponse = await axios.post('https://api.ticktick.com/oauth/token', {
      client_id: process.env.TICKTICK_CLIENT_ID,
      client_secret: process.env.TICKTICK_CLIENT_SECRET,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: process.env.TICKTICK_REDIRECT_URI || 'https://ticktick-sync.vercel.app/api/callback'
    });
    
    console.log('Token response:', tokenResponse.data);
    const { access_token, refresh_token } = tokenResponse.data;
    
    // Store tokens securely (in production, use a database)
    // For now, we'll redirect back to the main app with success
    res.redirect('/?auth=success&token=' + access_token);
  } catch (error) {
    console.error('OAuth2 error:', error.response?.data || error.message);
    res.redirect('/?error=auth_failed&details=' + encodeURIComponent(error.response?.data?.error_description || error.message));
  }
}; 