# Backend Server - LinkedIn Message Customizer

## Overview

This is a secure Node.js/Express backend that interfaces between the Chrome extension and OpenAI's API.

## Features

- ✅ **OpenAI Integration**: Uses GPT-4o-mini for message customization
- ✅ **Security**: Helmet, CORS, rate limiting, input validation
- ✅ **Error Handling**: Comprehensive error responses
- ✅ **Environment Variables**: Secure API key storage
- ✅ **Request Validation**: Joi schema validation

## Installation

```bash
npm install
```

## Configuration

Edit `.env` file:

```env
OPENAI_API_KEY=sk-your-openai-api-key
PORT=3000
NODE_ENV=development
API_SECRET_KEY=your-random-secret-key
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Running

**Development mode (with auto-restart):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

## API Endpoints

### Health Check
```
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "message": "LinkedIn Extension Backend Server is running",
  "timestamp": "2025-11-04T..."
}
```

### Customize Message
```
POST /api/customize-message
```

**Headers:**
- `Content-Type: application/json`
- `X-API-Secret: your-secret-key`

**Request:**
```json
{
  "profileData": {
    "name": "John Doe",
    "headline": "Software Engineer at Google",
    "company": "Google",
    "location": "San Francisco, CA",
    "about": "Passionate about AI...",
    "experience": [{
      "title": "Senior Engineer",
      "company": "Google",
      "duration": "2020 - Present",
      "description": "Working on ML infrastructure"
    }],
    "education": [{
      "school": "Stanford University",
      "degree": "BS",
      "field": "Computer Science",
      "duration": "2016 - 2020"
    }],
    "skills": ["Python", "TensorFlow", "AWS"]
  },
  "template": "Your message template..."
}
```

**Response:**
```json
{
  "success": true,
  "customizedMessage": "Personalized message based on profile...",
  "profileName": "John Doe",
  "timestamp": "2025-11-04T..."
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message here"
}
```

## Security Features

### 1. CORS Protection
Only allows requests from Chrome extensions:
```javascript
origin.startsWith('chrome-extension://')
```

### 2. Rate Limiting
- 100 requests per 15 minutes per IP
- Prevents API abuse
- Returns 429 if exceeded

### 3. Helmet.js
Sets secure HTTP headers:
- Content Security Policy
- XSS Protection
- No Sniff
- Frame Guard

### 4. Input Validation (Joi)
Validates all input fields:
- Max string lengths
- Required fields
- Array size limits
- Data types

### 5. API Secret (Optional)
Additional layer of security:
- Set `API_SECRET_KEY` in `.env`
- Include in request header: `X-API-Secret`

### 6. Error Handling
- No sensitive data in error messages
- Specific error codes
- Logging for debugging

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | Yes | - | Your OpenAI API key |
| `PORT` | No | 3000 | Server port |
| `NODE_ENV` | No | development | Environment |
| `API_SECRET_KEY` | No | - | Optional API secret |
| `RATE_LIMIT_WINDOW_MS` | No | 900000 | Rate limit window (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | No | 100 | Max requests per window |

## Deployment

### Local (Personal Use)
Just run `npm start` when you need to use the extension.

### Production Deployment

#### Option 1: Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway up
```

#### Option 2: Heroku
```bash
# Install Heroku CLI
# Create app
heroku create linkedin-extension-backend

# Set environment variables
heroku config:set OPENAI_API_KEY=sk-your-key

# Deploy
git push heroku main
```

#### Option 3: Render
1. Connect your GitHub repo
2. Set environment variables in dashboard
3. Deploy automatically

**Important for deployment:**
- Update `ALLOWED_ORIGINS` in `.env`
- Use HTTPS
- Set `NODE_ENV=production`
- Monitor costs and usage

## Development

### Adding New Endpoints

```javascript
app.post('/api/new-endpoint', validateApiSecret, async (req, res) => {
  try {
    // Your logic here
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### Testing

```bash
# Test health endpoint
curl http://localhost:3000/health

# Test customize endpoint
curl -X POST http://localhost:3000/api/customize-message \
  -H "Content-Type: application/json" \
  -H "X-API-Secret: your-secret-key" \
  -d '{"profileData": {...}, "template": "..."}'
```

## Monitoring

### Logs
The server logs all requests:
- ✅ Success: `Message customized successfully`
- ❌ Errors: `Error customizing message`
- 📊 Info: Profile names, timestamps

### OpenAI Usage
Monitor your OpenAI usage at:
https://platform.openai.com/usage

## Troubleshooting

**Server won't start**
- Check if port 3000 is already in use
- Verify Node.js version (>= 16)

**OpenAI API errors**
- Check API key is valid
- Verify you have credits
- Check rate limits on OpenAI dashboard

**CORS errors**
- Extension must be loaded in Chrome
- Check origin is chrome-extension://

## Cost Optimization

### Use GPT-3.5-Turbo
Change in `server.js` line 165:
```javascript
model: 'gpt-3.5-turbo', // Cheaper than GPT-4
```

### Reduce Token Usage
- Limit profile data sent
- Use shorter templates
- Reduce max_tokens parameter

### Cache Results
Implement caching for similar profiles (not included by default).

## License

MIT
