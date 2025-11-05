# LinkedIn Message Customizer - Chrome Extension

An AI-powered Chrome extension that analyzes LinkedIn profiles and generates personalized outreach messages using OpenAI's GPT models.

## Features

- **One-Click Profile Analysis**: Automatically extracts name, headline, company, experience, education, and skills from LinkedIn profiles
- **AI-Powered Customization**: Uses OpenAI GPT to personalize your message template based on the profile
- **Copy to Clipboard**: Instantly copy the generated message to paste into LinkedIn messages
- **Secure Backend**: API keys stored securely in backend server, never exposed in the extension
- **Customizable Template**: Edit your message template to match your style
- **Professional UI**: Modern, LinkedIn-themed interface with loading states and error handling

## Architecture

```
┌─────────────────────────────────────┐
│  Chrome Extension (Frontend)        │
│  - Content Script (Profile Parser)  │
│  - Popup UI (User Interface)        │
│  - Background Worker                │
└────────────┬────────────────────────┘
             │
             │ HTTPS Request
             ↓
┌─────────────────────────────────────┐
│  Node.js Backend (Secure)           │
│  - Express Server                   │
│  - OpenAI API Integration           │
│  - .env (API Keys)                  │
│  - Security Middleware              │
└─────────────────────────────────────┘
```

## Security Features

- ✅ API keys stored securely in backend `.env` file
- ✅ CORS protection (only Chrome extension can access)
- ✅ Rate limiting to prevent abuse
- ✅ Helmet.js security headers
- ✅ Input validation with Joi
- ✅ Request timeouts
- ✅ Error handling without exposing sensitive data

## Installation

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))
- Google Chrome browser

### Step 1: Clone/Download the Project

```bash
cd ~/Desktop/linkedin/linkedin-extension
```

### Step 2: Setup Backend Server

1. Navigate to the backend folder:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
# Edit the .env file
nano .env
```

Update the following values:
```env
OPENAI_API_KEY=sk-your-actual-openai-api-key-here
API_SECRET_KEY=your-random-secret-key-here
```

To generate a secure random secret key, run:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

4. Start the server:
```bash
npm start
```

You should see:
```
🚀 LinkedIn Extension Backend Server
📡 Server running on: http://localhost:3000
🌍 Environment: development
✅ OpenAI API: Connected
🔒 Security: Enabled (Helmet, CORS, Rate Limiting)
```

### Step 3: Install Chrome Extension

1. Open Chrome and navigate to `chrome://extensions/`

2. Enable **Developer mode** (toggle in top-right corner)

3. Click **Load unpacked**

4. Select the `extension` folder:
```
~/Desktop/linkedin/linkedin-extension/extension
```

5. The extension icon should appear in your Chrome toolbar

### Step 4: Configure Extension

1. Click the extension icon
2. Click **Settings**
3. Configure:
   - **Backend API URL**: `http://localhost:3000` (default)
   - **API Secret Key**: The same secret you set in `.env`
   - **Message Template**: Customize your template (optional)
4. Click **Save Settings**

## Usage

1. **Navigate to a LinkedIn profile**
   - Go to `https://www.linkedin.com/in/[username]`

2. **Click the extension icon**
   - The popup will open

3. **Click "Generate Message"**
   - The extension will:
     - Parse the LinkedIn profile
     - Send data to your backend
     - Use OpenAI to customize your template
     - Display the personalized message

4. **Copy and use**
   - Click "Copy to Clipboard"
   - Paste into LinkedIn messages or emails

## Customizing Your Template

The default template includes placeholders like `[COMPANY]` and `[AREAS_OF_INTEREST]`. The AI will:

1. Analyze the profile data
2. Replace placeholders with relevant information
3. Adjust the tone and content to match the recipient
4. Ensure the message is personalized and professional

### Template Tips

- Include your background and skills
- Mention what you're looking for (job, advice, etc.)
- Keep it between 150-300 words
- Be genuine and professional
- Include your full name at the end

## File Structure

```
linkedin-extension/
├── backend/
│   ├── server.js           # Express server with security
│   ├── package.json        # Node dependencies
│   ├── .env                # Environment variables (API keys)
│   ├── .env.example        # Example environment file
│   └── .gitignore          # Git ignore rules
│
├── extension/
│   ├── manifest.json       # Extension configuration
│   ├── popup.html          # Popup UI
│   ├── css/
│   │   └── popup.css       # Popup styles
│   ├── js/
│   │   ├── popup.js        # Popup logic
│   │   ├── content.js      # LinkedIn profile parser
│   │   ├── background.js   # Background service worker
│   │   └── config.js       # Configuration
│   └── icons/
│       ├── icon16.png
│       ├── icon48.png
│       └── icon128.png
│
└── README.md               # This file
```

## API Endpoints

### `POST /api/customize-message`

Customizes a message template based on LinkedIn profile data.

**Headers:**
- `Content-Type: application/json`
- `X-API-Secret: your-secret-key`

**Request Body:**
```json
{
  "profileData": {
    "name": "John Doe",
    "headline": "Software Engineer at Google",
    "company": "Google",
    "location": "San Francisco, CA",
    "about": "...",
    "experience": [...],
    "education": [...],
    "skills": [...]
  },
  "template": "Your message template..."
}
```

**Response:**
```json
{
  "success": true,
  "customizedMessage": "Personalized message...",
  "profileName": "John Doe",
  "timestamp": "2025-11-04T..."
}
```

## Troubleshooting

### Extension doesn't appear in Chrome
- Make sure you loaded the `extension` folder, not the root folder
- Check that `manifest.json` is in the loaded folder
- Look for errors in `chrome://extensions/`

### "Cannot connect to backend server" error
- Ensure the backend server is running (`npm start` in `backend/`)
- Check that the API URL in settings is correct (`http://localhost:3000`)
- Verify no firewall is blocking port 3000

### "OpenAI API authentication failed"
- Check that your OpenAI API key is correct in `backend/.env`
- Ensure you have credits in your OpenAI account
- Verify the key starts with `sk-`

### "Failed to parse profile" error
- Make sure you're on a LinkedIn profile page (`/in/` in URL)
- Try refreshing the LinkedIn page
- Check browser console for errors (F12 > Console)

### Profile data is incomplete
- LinkedIn's DOM structure changes frequently
- Some profiles may have privacy settings limiting data
- Try scrolling down on the profile to load more sections

## Development

### Running in Development Mode

**Backend:**
```bash
cd backend
npm run dev  # Uses nodemon for auto-restart
```

**Extension:**
- Make changes to files in `extension/`
- Go to `chrome://extensions/`
- Click the refresh icon on your extension

### Debugging

**Backend:**
- Check terminal output for logs
- Errors are logged with `console.error()`

**Extension:**
- Right-click extension icon → Inspect popup
- Check Console for errors
- Use `console.log()` statements

### Testing

Test the extension on various LinkedIn profiles:
- Engineers at different companies
- Different experience levels
- Profiles with/without detailed information
- International profiles

## Security Best Practices

### For Personal Use

1. **Never commit `.env` file** - It's in `.gitignore` by default
2. **Use strong API secret** - Generate with crypto.randomBytes()
3. **Keep backend local** - Only run when needed
4. **Monitor API usage** - Check OpenAI dashboard for costs
5. **Rotate keys periodically** - Change API keys every few months

### For Deployment (Optional)

If you want to deploy the backend:

1. **Use HTTPS** - Deploy with SSL certificate
2. **Use environment variables** - Not `.env` files
3. **Add authentication** - Implement user auth
4. **Set up monitoring** - Track errors and usage
5. **Use rate limiting** - Already implemented
6. **Deploy to**: Heroku, Railway, Render, or AWS

## Cost Estimation

### OpenAI API Costs (GPT-4o-mini)

- **Input**: ~$0.15 per 1M tokens
- **Output**: ~$0.60 per 1M tokens
- **Average message**: ~1,000 input + 300 output tokens
- **Cost per message**: ~$0.0003 (less than 1 cent)

**100 messages ≈ $0.03**

For cost savings, you can switch to `gpt-3.5-turbo` in `server.js` (line 165).

## Limitations

- Only works on LinkedIn profile pages
- Requires active internet connection
- Limited by OpenAI API rate limits
- LinkedIn's DOM may change (requiring updates)
- Profile must be public or visible to you

## Roadmap

- [ ] Add support for LinkedIn company pages
- [ ] Batch processing for multiple profiles
- [ ] Template library with multiple styles
- [ ] Export history of generated messages
- [ ] Support for other AI providers (Anthropic, etc.)
- [ ] Chrome Web Store publication

## Contributing

This is a personal project, but suggestions are welcome:

1. Test the extension and report bugs
2. Suggest new features
3. Improve the message templates
4. Enhance the UI/UX

## License

MIT License - Feel free to modify and use for personal purposes.

## Disclaimer

- This extension is for personal, ethical outreach only
- Respect LinkedIn's Terms of Service
- Do not spam or send unsolicited bulk messages
- Use rate limiting and be respectful
- The author is not responsible for misuse

## Credits

Created by **Naga Venkata Sai Chennu**

- Uses OpenAI GPT for AI customization
- Built with vanilla JavaScript (no frameworks)
- Follows Chrome Extension Manifest V3 standards

---

**Questions or Issues?**

Check the troubleshooting section or review the code comments for guidance.

**Happy Networking! 🚀**
