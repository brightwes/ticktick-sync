# Deployment Guide

## 🚀 Deploy to Vercel

### 1. Prepare Your Repository

1. Push your code to GitHub
2. Make sure all files are committed

### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign up/Login with GitHub
3. Click "New Project"
4. Import your repository
5. Configure the project:
   - **Framework Preset**: Node.js
   - **Root Directory**: `./`
   - **Build Command**: `npm install`
   - **Output Directory**: `public`
   - **Install Command**: `npm install`

### 3. Set Environment Variables

In your Vercel project dashboard:

1. Go to **Settings** → **Environment Variables**
2. Add these variables:

```env
TICKTICK_CLIENT_ID=your_client_id_here
TICKTICK_CLIENT_SECRET=your_client_secret_here
TICKTICK_REDIRECT_URI=https://your-app-name.vercel.app/auth/callback
NODE_ENV=production
```

### 4. Get TickTick OAuth2 Credentials

1. **Register Your App**:
   - Go to TickTick Developer Portal
   - Create a new application
   - Set the redirect URI to: `https://your-app-name.vercel.app/auth/callback`
   - Get your Client ID and Client Secret

2. **Update Environment Variables**:
   - Replace `your_client_id_here` with your actual Client ID
   - Replace `your_client_secret_here` with your actual Client Secret
   - Update the redirect URI to match your Vercel domain

### 5. Deploy

1. Click **Deploy** in Vercel
2. Wait for deployment to complete
3. Your app will be available at: `https://your-app-name.vercel.app`

## 🔐 OAuth2 Flow

### How It Works:

1. **User clicks "Login with TickTick"**
2. **Redirected to TickTick OAuth page**
3. **User authorizes your app**
4. **TickTick redirects back with authorization code**
5. **Your app exchanges code for access token**
6. **User can now access their tasks**

### Security Features:

- ✅ **Secure token storage** (in production, use a database)
- ✅ **Automatic token refresh**
- ✅ **HTTPS required** (Vercel provides this)
- ✅ **State parameter** for CSRF protection

## 🛠️ Alternative Deployment Options

### Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### Render
1. Connect your GitHub repo
2. Set environment variables
3. Deploy automatically

## 🔧 Local Development

For local testing with OAuth2:

1. **Use ngrok** for HTTPS tunnel:
```bash
npm install -g ngrok
ngrok http 3003
```

2. **Update redirect URI** to your ngrok URL:
```env
TICKTICK_REDIRECT_URI=https://your-ngrok-url.ngrok.io/auth/callback
```

## 📝 Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `TICKTICK_CLIENT_ID` | Your OAuth2 client ID | ✅ |
| `TICKTICK_CLIENT_SECRET` | Your OAuth2 client secret | ✅ |
| `TICKTICK_REDIRECT_URI` | OAuth2 callback URL | ✅ |
| `NODE_ENV` | Environment (production/development) | ❌ |
| `PORT` | Server port (auto-set by Vercel) | ❌ |

## 🚨 Important Notes

1. **HTTPS Required**: OAuth2 requires HTTPS in production
2. **Redirect URI**: Must match exactly what you set in TickTick
3. **Environment Variables**: Set these in Vercel dashboard
4. **Token Storage**: In production, store tokens in a database
5. **Error Handling**: Check Vercel logs for debugging

## 🔍 Troubleshooting

### Common Issues:

1. **"Invalid redirect URI"**
   - Check that redirect URI matches exactly in TickTick settings

2. **"Client ID not found"**
   - Verify your environment variables are set correctly

3. **"Token expired"**
   - The app automatically refreshes tokens

4. **"CORS errors"**
   - Vercel handles CORS automatically

### Debug Steps:

1. Check Vercel function logs
2. Verify environment variables
3. Test OAuth2 flow locally first
4. Check TickTick API documentation

## 📞 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Verify TickTick OAuth2 setup
3. Test with the local test server first 