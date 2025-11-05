# 🚀 RENDER.COM DEPLOYMENT GUIDE

**Complete Step-by-Step Guide to Deploy Your LinkedIn Extension Backend to Render.com**

---

## 📋 TABLE OF CONTENTS

1. [Prerequisites](#prerequisites)
2. [Quick Start (5 Minutes)](#quick-start)
3. [Detailed Step-by-Step Instructions](#detailed-step-by-step-instructions)
4. [Update Extension with Production URL](#update-extension-with-production-url)
5. [Testing Your Deployment](#testing-your-deployment)
6. [Troubleshooting](#troubleshooting)
7. [Monitoring & Maintenance](#monitoring--maintenance)

---

## ✅ PREREQUISITES

Before deploying to Render, make sure you have:

- [x] Render.com account created (free tier) - **✅ YOU HAVE THIS**
- [ ] Backend code pushed to GitHub repository
- [ ] OpenRouter API key (get from https://openrouter.ai/keys)
- [ ] API secret key (generate using: `openssl rand -hex 32`)

### Environment Variables You'll Need:

| Variable | Example | Where to Get |
|----------|---------|--------------|
| `OPENROUTER_API_KEY` | `sk-or-v1-abc123...` | https://openrouter.ai/keys |
| `API_SECRET` | `a1b2c3d4e5f6...` | Generate with `openssl rand -hex 32` |
| `NODE_ENV` | `production` | Set manually |

---

## 🚀 QUICK START (5 MINUTES)

### Option 1: Deploy from GitHub (RECOMMENDED)

1. **Push your code to GitHub**:
   ```bash
   cd /Users/nagavenkatasaichennu/Desktop/linkedin/linkedin-extension
   git init
   git add .
   git commit -m "Initial commit - LinkedIn Extension Backend"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```

2. **Deploy to Render**:
   - Go to https://render.com/dashboard
   - Click **"New +"** → **"Web Service"**
   - Connect your GitHub repository
   - Select the repository with your backend code
   - Render will auto-detect it's a Node.js app

3. **Configure the service**:
   - **Name**: `linkedin-extension-backend`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

4. **Add Environment Variables**:
   - Click **"Environment"** tab
   - Add:
     - `OPENROUTER_API_KEY` = your OpenRouter API key
     - `API_SECRET` = your secret key (generate with `openssl rand -hex 32`)
     - `NODE_ENV` = `production`

5. **Click "Create Web Service"** and wait 2-3 minutes for deployment

6. **Copy your production URL**:
   - Will be: `https://linkedin-extension-backend.onrender.com`
   - Or: `https://YOUR-CUSTOM-NAME.onrender.com`

---

## 📚 DETAILED STEP-BY-STEP INSTRUCTIONS

### STEP 1: Prepare Your Repository

#### 1.1 Initialize Git Repository (if not already done)

```bash
cd /Users/nagavenkatasaichennu/Desktop/linkedin/linkedin-extension
git init
```

#### 1.2 Ensure .gitignore is properly configured

Your backend already has a `.gitignore` file that protects sensitive data:
```
.env           # ✅ Protected
node_modules/  # ✅ Protected
*.log          # ✅ Protected
```

#### 1.3 Verify your environment variables

Check that you have `.env.example` (✅ already created):
```bash
ls backend/.env.example
```

**⚠️ IMPORTANT**: DO NOT commit your `.env` file! Only commit `.env.example`.

#### 1.4 Commit and push to GitHub

```bash
# Stage all files
git add .

# Commit
git commit -m "Prepare backend for Render deployment

- Updated server to bind to 0.0.0.0 (required for Render)
- Added .env.example for documentation
- Added render.yaml configuration
- Added .gitignore for security
"

# Create main branch
git branch -M main

# Add your GitHub repository
git remote add origin https://github.com/YOUR_USERNAME/linkedin-extension.git

# Push to GitHub
git push -u origin main
```

---

### STEP 2: Deploy to Render.com

#### 2.1 Log in to Render

Go to https://render.com/dashboard

#### 2.2 Create New Web Service

1. Click **"New +"** button (top right)
2. Select **"Web Service"**

#### 2.3 Connect GitHub Repository

1. Click **"Connect account"** next to GitHub
2. Authorize Render to access your repositories
3. Select your `linkedin-extension` repository
4. Click **"Connect"**

#### 2.4 Configure Your Service

Render will show a configuration form. Fill in:

| Field | Value |
|-------|-------|
| **Name** | `linkedin-extension-backend` |
| **Region** | Choose closest to you (e.g., Oregon, Ohio, Frankfurt) |
| **Branch** | `main` |
| **Root Directory** | `backend` (important!) |
| **Runtime** | Node |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | Free |

**Screenshot guide**:
- Name: Will be part of your URL
- Root Directory: Set to `backend` because your server.js is in backend folder
- Runtime: Auto-detected as Node
- Instance Type: Select "Free" for free tier

#### 2.5 Add Environment Variables

**CRITICAL STEP**: Add your secret keys

1. Scroll down to **"Environment Variables"** section
2. Click **"Add Environment Variable"**
3. Add each variable:

**Variable 1**:
- Key: `OPENROUTER_API_KEY`
- Value: `your_actual_openrouter_api_key_here`
- Click "Add"

**Variable 2**:
- Key: `API_SECRET`
- Value: (generate a secure key - see below)
- Click "Add"

**Variable 3**:
- Key: `NODE_ENV`
- Value: `production`
- Click "Add"

**How to generate API_SECRET**:
```bash
# Run this command in your terminal:
openssl rand -hex 32

# Example output:
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0

# Copy this entire string and paste it as API_SECRET value
```

#### 2.6 Optional: Auto-Deploy Settings

- **Auto-Deploy**: YES (recommended - deploys automatically on git push)
- **Health Check Path**: `/api/health` (optional but recommended)

#### 2.7 Create Web Service

1. Review all settings
2. Click **"Create Web Service"** button at the bottom
3. Wait for deployment (2-5 minutes)

**What happens now**:
- Render clones your GitHub repository
- Runs `npm install` to install dependencies
- Runs `npm start` to start your server
- Assigns you a public URL

---

### STEP 3: Wait for Deployment

You'll see a build log in real-time:

```
==> Cloning from https://github.com/YOUR_USERNAME/linkedin-extension...
==> Checking out commit abc123 in branch main
==> Running build command 'npm install'...
npm install
added 150 packages in 30s
==> Build successful!
==> Starting service with 'npm start'...
🚀 LinkedIn Extension Backend Server
📡 Server running on: http://0.0.0.0:10000
🌍 Environment: production
✅ OpenRouter API: Connected
🔒 Security: Enabled
==> Your service is live at https://linkedin-extension-backend.onrender.com
```

**Deployment Status**:
- 🟡 **Building**: Installing dependencies
- 🟢 **Live**: Server is running successfully
- 🔴 **Failed**: Check logs for errors

---

### STEP 4: Test Your Deployment

#### 4.1 Copy Your Production URL

Your URL will be: `https://YOUR-SERVICE-NAME.onrender.com`

Example: `https://linkedin-extension-backend.onrender.com`

#### 4.2 Test the Health Check Endpoint

Open in browser or use curl:

```bash
# Test health endpoint
curl https://YOUR-SERVICE-NAME.onrender.com/api/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-11-05T12:34:56.789Z"
}
```

✅ If you see this response, your backend is live!

#### 4.3 Test with Sample Profile Data

```bash
curl -X POST https://YOUR-SERVICE-NAME.onrender.com/api/customize \
  -H "Content-Type: application/json" \
  -H "X-API-Secret: YOUR_API_SECRET_HERE" \
  -d '{
    "targetProfile": {
      "name": "John Doe",
      "company": "Google",
      "headline": "Software Engineer at Google"
    },
    "template": "Hi, I saw your work at [COMPANY]."
  }'

# Expected response:
{
  "success": true,
  "customizedMessage": "Hi, I saw your work at Google.",
  "profileName": "John Doe"
}
```

✅ If you see a customized message, your API is working!

---

## 🔧 UPDATE EXTENSION WITH PRODUCTION URL

### STEP 5: Update Extension Configuration

#### 5.1 Edit config.js

Open: `extension/js/config.js`

**Find** (line 15):
```javascript
API_BASE_URL: 'http://localhost:3000',  // ⚠️ CHANGE THIS to your Render URL!
```

**Replace with**:
```javascript
API_BASE_URL: 'https://YOUR-SERVICE-NAME.onrender.com',
```

**Example**:
```javascript
API_BASE_URL: 'https://linkedin-extension-backend.onrender.com',
```

#### 5.2 Reload Extension in Chrome

1. Go to `chrome://extensions/`
2. Find "LinkedIn Message Customizer"
3. Click the **reload icon** (🔄)

#### 5.3 Test the Extension

1. Go to any LinkedIn profile (e.g., https://www.linkedin.com/in/satyanadella/)
2. Click the extension icon
3. Click "Generate Custom Message"
4. Should work! ✅

---

## 🧪 TESTING YOUR DEPLOYMENT

### Test Checklist:

- [ ] Health endpoint returns `{"status": "healthy"}` ✅
- [ ] API customize endpoint works with test data ✅
- [ ] Extension connects to production backend ✅
- [ ] Extension generates custom messages ✅
- [ ] No console errors in extension ✅
- [ ] API secret authentication works ✅

### Common Issues:

**Issue 1**: Extension shows "Backend offline"
- **Solution**: Check Render dashboard - is service "Live"?
- Check logs in Render dashboard for errors

**Issue 2**: "Authentication failed"
- **Solution**: Ensure `API_SECRET` in Render matches `API_SECRET_KEY` in extension config.js

**Issue 3**: "CORS error"
- **Solution**: Check backend CORS configuration allows your extension origin

---

## 🔍 TROUBLESHOOTING

### Problem: Build Failed on Render

**Symptoms**: Red "Deploy failed" status

**Solutions**:
1. Check build logs in Render dashboard
2. Ensure `package.json` exists in backend folder
3. Ensure `npm install` runs successfully locally
4. Check Node version compatibility

**Common causes**:
- Missing dependencies in package.json
- Wrong root directory (should be `backend`)
- Syntax errors in server.js

---

### Problem: Service Crashes After Deploy

**Symptoms**: Service starts then goes to "Crashed" status

**Solutions**:
1. Check logs in Render dashboard
2. Verify environment variables are set correctly
3. Test server locally: `npm start`
4. Check if `OPENROUTER_API_KEY` is valid

**Common causes**:
- Missing `OPENROUTER_API_KEY`
- Invalid API key
- PORT not using `process.env.PORT`

---

### Problem: Extension Can't Connect

**Symptoms**: "Failed to fetch" or "Backend offline"

**Solutions**:
1. Verify production URL in `extension/js/config.js`
2. Check URL format: `https://` not `http://`
3. Test health endpoint in browser
4. Check CORS headers in backend

**Common causes**:
- Wrong URL in config.js
- Using `http://` instead of `https://`
- Backend crashed (check Render dashboard)

---

### Problem: API Returns 401 Unauthorized

**Symptoms**: Error "Authentication failed"

**Solutions**:
1. Check `API_SECRET` in Render environment variables
2. Check `API_SECRET_KEY` in extension config.js
3. Ensure they match exactly (case-sensitive!)

**Debug**:
```javascript
// In extension config.js
console.log('API_SECRET_KEY:', CONFIG.API_SECRET_KEY);

// Should match Render environment variable API_SECRET
```

---

## 📊 MONITORING & MAINTENANCE

### Render Dashboard Features:

1. **Logs**: Real-time server logs
   - Go to your service → "Logs" tab
   - See all console.log output
   - Debug errors

2. **Metrics**: Performance monitoring
   - Go to "Metrics" tab
   - See CPU, memory, request count
   - Free tier: Limited metrics

3. **Events**: Deployment history
   - See all deployments
   - Build success/failure
   - Manual deploys

### Free Tier Limitations:

- **Sleep after 15 minutes of inactivity**: Server stops when not used
- **Cold start**: First request after sleep takes 30-60 seconds
- **750 hours/month**: Free tier limit (enough for testing/development)

### Keeping Service Active:

**Option 1**: Upgrade to paid plan ($7/month)
- No sleep
- Always on
- Better performance

**Option 2**: External ping service (free)
- Use https://cron-job.org
- Ping your health endpoint every 10 minutes
- Keeps service warm

**Setup external ping**:
1. Go to https://cron-job.org
2. Create free account
3. Add new cron job:
   - URL: `https://YOUR-SERVICE.onrender.com/api/health`
   - Interval: Every 10 minutes
   - Enabled: Yes

---

## 🎯 UPDATING YOUR APP

### When you make code changes:

#### Option 1: Auto-Deploy (Recommended)
```bash
# Make changes to your code
# Commit and push to GitHub
git add .
git commit -m "Updated feature X"
git push

# Render automatically deploys! ✅
```

#### Option 2: Manual Deploy
1. Go to Render dashboard
2. Click your service
3. Click "Manual Deploy" → "Deploy latest commit"

### Rolling Back:

If something breaks:
1. Go to "Events" tab
2. Find previous successful deployment
3. Click "Redeploy"

---

## 📝 IMPORTANT NOTES

### Security Best Practices:

✅ **DO**:
- Keep `.env` file secret (never commit to git)
- Use strong `API_SECRET` (32+ characters)
- Rotate API keys periodically
- Monitor logs for suspicious activity

❌ **DON'T**:
- Commit `.env` to GitHub
- Share API keys publicly
- Use weak/simple API secrets
- Disable CORS in production

### Cost Management:

**Free Tier**:
- 750 hours/month (enough for 1 service running 24/7)
- Sleeps after 15 min inactivity
- 100 GB bandwidth/month

**Paid Plans**:
- Starter: $7/month (always on, better performance)
- Standard: $25/month (more resources)

---

## 🎉 SUCCESS CHECKLIST

Deployment is complete when:

- [x] ✅ Code pushed to GitHub
- [x] ✅ Service deployed to Render
- [x] ✅ Environment variables configured
- [x] ✅ Service status: "Live" (green)
- [x] ✅ Health endpoint returns healthy
- [x] ✅ API customize endpoint works
- [x] ✅ Extension config.js updated with production URL
- [x] ✅ Extension tested on LinkedIn profile
- [x] ✅ Custom messages generated successfully

**Congratulations! Your backend is live in production! 🚀**

---

## 📞 SUPPORT & RESOURCES

### Official Documentation:
- Render Docs: https://render.com/docs
- Node.js on Render: https://render.com/docs/deploy-node-express-app
- Environment Variables: https://render.com/docs/environment-variables

### Getting Help:
- Render Community: https://community.render.com
- Render Status: https://status.render.com
- Support: support@render.com

### Your Project Resources:
- Backend Code: `/Users/nagavenkatasaichennu/Desktop/linkedin/linkedin-extension/backend`
- Extension Code: `/Users/nagavenkatasaichennu/Desktop/linkedin/linkedin-extension/extension`
- Environment Example: `backend/.env.example`
- This Guide: `backend/RENDER_DEPLOYMENT_GUIDE.md`

---

**Last Updated**: 2025-11-05
**Status**: ✅ Ready for Deployment
**Difficulty**: Easy (5 minutes for experienced users, 15 minutes for beginners)

**Good luck with your deployment! 🎉**
