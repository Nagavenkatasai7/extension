# Quick Setup Guide

## 🚀 5-Minute Setup

### 1. Get OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy the key (starts with `sk-`)

### 2. Setup Backend
```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Edit .env file
nano .env

# Replace with your actual OpenAI API key:
# OPENAI_API_KEY=sk-your-actual-key-here

# Start the server
npm start
```

You should see: ✅ **Server running on: http://localhost:3000**

### 3. Install Extension
1. Open Chrome → `chrome://extensions/`
2. Enable **Developer mode** (top-right)
3. Click **Load unpacked**
4. Select the `extension` folder
5. Done! The extension icon appears in your toolbar

### 4. Configure Extension
1. Click extension icon
2. Click **Settings**
3. Enter API Secret (same as in `.env` file)
4. Click **Save**

### 5. Test It!
1. Go to any LinkedIn profile (e.g., https://www.linkedin.com/in/williamhgates/)
2. Click extension icon
3. Click **Generate Message**
4. Wait 10-20 seconds
5. Click **Copy to Clipboard**
6. Done! 🎉

## ⚠️ Important Notes

- **Keep backend running**: The server must be running for the extension to work
- **API costs**: Each message costs ~$0.0003 (less than 1 cent)
- **LinkedIn login**: You must be logged into LinkedIn
- **Public profiles**: Works best with public/visible profiles

## 🔒 Security Checklist

- ✅ API key is in `.env` file (not in code)
- ✅ `.env` is in `.gitignore`
- ✅ Backend uses CORS protection
- ✅ Rate limiting enabled (100 requests per 15 min)
- ✅ Input validation enabled

## 🐛 Quick Troubleshooting

**"Cannot connect to backend"**
→ Make sure backend is running (`npm start` in `backend/`)

**"OpenAI API authentication failed"**
→ Check API key in `backend/.env` file

**"Please open a LinkedIn profile"**
→ Navigate to a profile page (URL should contain `/in/`)

**Profile data incomplete**
→ Scroll down on the profile to load all sections

## 📖 Full Documentation

See `README.md` for complete documentation.
