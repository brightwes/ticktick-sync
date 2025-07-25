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
    
    // Use form-encoded format as specified in the docs
    const tokenData = new URLSearchParams();
    tokenData.append('client_id', process.env.TICKTICK_CLIENT_ID);
    tokenData.append('client_secret', process.env.TICKTICK_CLIENT_SECRET);
    tokenData.append('code', code);
    tokenData.append('grant_type', 'authorization_code');
    tokenData.append('scope', 'tasks:read tasks:write');
    tokenData.append('redirect_uri', process.env.TICKTICK_REDIRECT_URI || 'https://ticktick-sync.vercel.app/api/callback');

    const tokenResponse = await axios.post('https://ticktick.com/oauth/token', tokenData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    console.log('Token response:', tokenResponse.data);
    const { access_token, refresh_token } = tokenResponse.data;

    // Store the access token (in a real app, you'd store this in a database)
    // For now, we'll pass it back to the frontend
    res.redirect('/?auth=success&token=' + access_token);
  } catch (error) {
    console.error('OAuth2 error:', error.response?.data || error.message);
    res.redirect('/?error=auth_failed&details=' + encodeURIComponent(error.response?.data?.error_description || error.message));
  }
}; 