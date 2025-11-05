require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const OpenAI = require('openai');
const Joi = require('joi');
const crypto = require('crypto');
const xss = require('xss');
const validator = require('validator');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================================
// TRUST PROXY - Required for Render.com and other cloud platforms
// ============================================================================
// Render.com uses a reverse proxy, so we need to trust the X-Forwarded-* headers
// This enables proper rate limiting and IP detection
app.set('trust proxy', 1);

// ============================================================================
// CACHING LAYER - Performance Optimization
// ============================================================================

const messageCache = new Map();
const pendingRequests = new Map(); // For request deduplication
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds
const MAX_CACHE_SIZE = 100; // Maximum cached items

/**
 * Generate cache key from profile and template
 */
function generateCacheKey(targetProfile, template) {
  const data = JSON.stringify({ name: targetProfile.name, company: targetProfile.company, template: template.substring(0, 100) });
  return crypto.createHash('md5').update(data).digest('hex');
}

/**
 * Get cached message if available and not expired
 */
function getCachedMessage(cacheKey) {
  const cached = messageCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.message;
  }
  if (cached) {
    messageCache.delete(cacheKey); // Remove expired entry
  }
  return null;
}

/**
 * Cache a generated message
 */
function cacheMessage(cacheKey, message) {
  // Implement LRU-style eviction if cache is full
  if (messageCache.size >= MAX_CACHE_SIZE) {
    const firstKey = messageCache.keys().next().value;
    messageCache.delete(firstKey);
  }
  messageCache.set(cacheKey, { message, timestamp: Date.now() });
}

// ============================================================================
// XSS SANITIZATION - Security Enhancement
// ============================================================================

/**
 * Recursively sanitize object to prevent XSS attacks
 * Removes potentially malicious HTML/JavaScript from all string values
 */
function sanitizeObject(obj) {
  if (typeof obj === 'string') {
    // Strip HTML tags and escape special characters
    return xss(obj, {
      whiteList: {}, // No HTML tags allowed
      stripIgnoreTag: true,
      stripIgnoreTagBody: ['script', 'style']
    });
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  if (obj !== null && typeof obj === 'object') {
    const sanitized = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }

  return obj;
}

/**
 * Validate and sanitize email addresses
 */
function sanitizeEmail(email) {
  if (!email) return '';
  return validator.isEmail(email) ? validator.normalizeEmail(email) : '';
}

/**
 * Validate and sanitize URLs
 */
function sanitizeURL(url) {
  if (!url) return '';
  return validator.isURL(url, { protocols: ['http', 'https'], require_protocol: true }) ? url : '';
}

// ============================================================================
// SECURITY MIDDLEWARE
// ============================================================================

// Helmet for security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration - Only allow Chrome extension
const corsOptions = {
  origin: function (origin, callback) {
    // Allow Chrome extension origins and localhost for development
    if (!origin ||
        origin.startsWith('chrome-extension://') ||
        origin === 'http://localhost:3000' ||
        origin === 'http://127.0.0.1:3000') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['POST', 'GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Secret']
};

app.use(cors(corsOptions));

// Rate limiting - Prevent abuse
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));

// ============================================================================
// OPENROUTER CONFIGURATION
// ============================================================================

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': 'https://github.com/Nagavenkatasai7/extension',
    'X-Title': 'LinkedIn Message Customizer',
  },
  // Explicitly set dangerouslyAllowBrowser to true for OpenRouter compatibility
  dangerouslyAllowBrowser: true
});

// Validate API key on startup
if (!process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY === 'your_openai_api_key_here') {
  console.error('❌ ERROR: OPENROUTER_API_KEY is not set in .env file');
  console.error('Please add your OpenRouter API key to the .env file');
  process.exit(1);
}

// Model configuration
const MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-4-turbo';

// ============================================================================
// INPUT VALIDATION SCHEMAS
// ============================================================================

const profileDataSchema = Joi.object({
  name: Joi.string().required().max(200),
  headline: Joi.string().allow('').max(500),
  company: Joi.string().allow('').max(200),
  location: Joi.string().allow('').max(200),
  about: Joi.string().allow('').max(5000),
  experience: Joi.array().items(Joi.object({
    title: Joi.string().allow('').max(200),
    company: Joi.string().allow('').max(200),
    duration: Joi.string().allow('').max(200),
    description: Joi.string().allow('').max(2000)
  })).max(20),
  education: Joi.array().items(Joi.object({
    school: Joi.string().allow('').max(200),
    degree: Joi.string().allow('').max(200),
    field: Joi.string().allow('').max(200),
    duration: Joi.string().allow('').max(200)
  })).max(10),
  skills: Joi.array().items(Joi.string().max(100)).max(50).optional(),
  // New comprehensive fields (all optional for backward compatibility)
  certifications: Joi.array().items(Joi.object({
    name: Joi.string().allow('').max(200),
    issuer: Joi.string().allow('').max(200),
    date: Joi.string().allow('').max(100)
  })).max(20).optional(),
  projects: Joi.array().items(Joi.object({
    name: Joi.string().allow('').max(200),
    description: Joi.string().allow('').max(2000),
    date: Joi.string().allow('').max(100)
  })).max(20).optional(),
  recommendations: Joi.array().items(Joi.object({
    text: Joi.string().allow('').max(1000),
    author: Joi.string().allow('').max(200)
  })).max(10).optional(),
  interests: Joi.array().items(Joi.string().max(200)).max(30).optional(),
  languages: Joi.array().items(Joi.object({
    language: Joi.string().allow('').max(100),
    proficiency: Joi.string().allow('').max(100)
  })).max(15).optional()
});

const userProfileSchema = Joi.object({
  name: Joi.string().required().max(200),
  email: Joi.string().email().max(200),
  currentRole: Joi.string().allow('').max(300),
  status: Joi.string().allow('').max(200),
  graduationDate: Joi.string().allow('').max(50),
  lookingFor: Joi.string().allow('').max(500),
  topSkills: Joi.array().items(Joi.string().max(100)).max(20),
  keyProjects: Joi.array().items(Joi.string().max(500)).max(10),
  recentExperience: Joi.array().items(Joi.string().max(300)).max(10),
  education: Joi.string().allow('').max(300),
  valueProps: Joi.array().items(Joi.string().max(500)).max(10)
}).allow(null);

const customizeRequestSchema = Joi.object({
  targetProfile: profileDataSchema.required(),  // The person you're contacting
  userProfile: userProfileSchema.allow(null),    // Your profile (optional for backward compatibility)
  template: Joi.string().required().min(50).max(5000)
});

// ============================================================================
// API SECRET VALIDATION MIDDLEWARE
// ============================================================================

const validateApiSecret = (req, res, next) => {
  const apiSecret = req.headers['x-api-secret'];

  if (process.env.API_SECRET_KEY && process.env.API_SECRET_KEY !== 'your_secret_key_for_additional_security') {
    if (!apiSecret || apiSecret !== process.env.API_SECRET_KEY) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Invalid API secret'
      });
    }
  }

  next();
};

// ============================================================================
// ROUTES
// ============================================================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'LinkedIn Extension Backend Server is running',
    timestamp: new Date().toISOString()
  });
});

// Debug endpoint to check environment variables and test OpenRouter (REMOVE IN PRODUCTION!)
app.get('/debug/env', async (req, res) => {
  const envInfo = {
    hasOpenRouterKey: !!process.env.OPENROUTER_API_KEY,
    openRouterKeyLength: process.env.OPENROUTER_API_KEY ? process.env.OPENROUTER_API_KEY.length : 0,
    openRouterKeyPrefix: process.env.OPENROUTER_API_KEY ? process.env.OPENROUTER_API_KEY.substring(0, 15) + '...' : 'NOT SET',
    hasApiSecretKey: !!process.env.API_SECRET_KEY,
    apiSecretKey: process.env.API_SECRET_KEY || 'NOT SET',
    nodeEnv: process.env.NODE_ENV,
    model: MODEL,
    openRouterTest: null
  };

  // Test OpenRouter API if testApi query parameter is present
  if (req.query.testApi === 'true') {
    try {
      console.log('🧪 Testing OpenRouter API...');
      const completion = await openai.chat.completions.create({
        model: 'openai/gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Say "test successful"' }],
        max_tokens: 20
      });

      envInfo.openRouterTest = {
        success: true,
        message: 'OpenRouter API is working!',
        response: completion.choices[0].message.content
      };
    } catch (error) {
      console.error('❌ OpenRouter API test failed:', error);
      envInfo.openRouterTest = {
        success: false,
        error: error.message,
        status: error.status,
        type: error.type,
        code: error.code
      };
    }
  }

  res.json(envInfo);
});

// Test endpoint to check OpenRouter API directly
app.get('/debug/test-openrouter', async (req, res) => {
  try {
    console.log('🧪 Testing OpenRouter API...');
    const completion = await openai.chat.completions.create({
      model: 'openai/gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Say "test successful" if you can read this.' }],
      max_tokens: 50
    });

    res.json({
      success: true,
      message: 'OpenRouter API is working!',
      response: completion.choices[0].message.content
    });
  } catch (error) {
    console.error('❌ OpenRouter API test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      status: error.status,
      type: error.type,
      code: error.code,
      fullError: JSON.stringify(error, null, 2)
    });
  }
});

// Main endpoint: Customize LinkedIn message template
app.post('/api/customize-message', validateApiSecret, async (req, res) => {
  try {
    // Validate request body
    const { error, value } = customizeRequestSchema.validate(req.body);

    if (error) {
      console.error('❌ Validation error:', error.details);
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.details.map(d => d.message)
      });
    }

    let { targetProfile, userProfile, template } = value;

    // ✅ XSS SANITIZATION - Prevent malicious scripts in profile data
    targetProfile = sanitizeObject(targetProfile);
    if (userProfile) {
      userProfile = sanitizeObject(userProfile);
    }
    template = xss(template, {
      whiteList: {}, // No HTML allowed in template
      stripIgnoreTag: true
    });

    console.log(`📝 Customizing message for: ${targetProfile.name}${userProfile ? ` (with profile matching)` : ''}`);

    // Check cache first
    const cacheKey = generateCacheKey(targetProfile, template);
    const cachedMessage = getCachedMessage(cacheKey);

    if (cachedMessage) {
      console.log('⚡ Cache hit - returning cached message');
      return res.json({
        success: true,
        customizedMessage: cachedMessage,
        profileName: targetProfile.name,
        cached: true,
        timestamp: new Date().toISOString()
      });
    }

    // Check if there's already a pending request for this profile
    if (pendingRequests.has(cacheKey)) {
      console.log('⏳ Duplicate request detected - waiting for existing request');
      try {
        const result = await pendingRequests.get(cacheKey);
        return res.json({
          success: true,
          customizedMessage: result,
          profileName: targetProfile.name,
          cached: true,
          deduplicated: true,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        // If the pending request failed, continue with new request
        console.log('⚠️ Pending request failed, proceeding with new request');
      }
    }

    // Create enhanced prompt that uses both profiles
    const systemPrompt = userProfile
      ? `You are a template filling assistant. Your ONLY job is to replace text inside [BRACKETS] with real information.

CRITICAL RULES - FOLLOW EXACTLY:
1. ONLY replace text that is inside [BRACKETS] like [COMPANY] or [AREAS_OF_INTEREST]
2. Keep EVERYTHING else EXACTLY as written - word for word, character for character
3. Do NOT add any new sentences, paragraphs, or content
4. Do NOT remove any sentences, paragraphs, or content
5. Do NOT rewrite or paraphrase ANY text outside of [BRACKETS]
6. Do NOT change the greeting, closing, line breaks, or formatting
7. Keep "Best regards, Naga Venkata Sai Chennu" EXACTLY as written

EXAMPLE:
Template: "Hi, I saw your work at [COMPANY] in [AREAS_OF_INTEREST].\n\nBest regards,\nNaga"
Target: Works at Google, interested in AI
CORRECT OUTPUT: "Hi, I saw your work at Google in AI.\n\nBest regards,\nNaga"
WRONG OUTPUT: "Hello! I was impressed by your work at Google in AI and ML...[adding extra text]"

You will receive:
- TARGET person's profile (their company, interests, etc.)
- YOUR profile (for context only - do not add info from here unless template asks)
- TEMPLATE (the exact format to preserve)

Output ONLY the template with [BRACKETS] filled in. Nothing more, nothing less.`
      : `You are a template filling assistant. Your ONLY job is to replace text inside [BRACKETS] with real information.

CRITICAL RULES - FOLLOW EXACTLY:
1. ONLY replace text that is inside [BRACKETS] like [COMPANY] or [AREAS_OF_INTEREST]
2. Keep EVERYTHING else EXACTLY as written - word for word, character for character
3. Do NOT add any new sentences, paragraphs, or content
4. Do NOT remove any sentences, paragraphs, or content
5. Do NOT rewrite or paraphrase ANY text outside of [BRACKETS]
6. Do NOT change the greeting, closing, line breaks, or formatting

Output ONLY the template with [BRACKETS] filled in. Nothing more, nothing less.`;

    const userPrompt = userProfile
      ? `=== TARGET PERSON'S PROFILE (who you're contacting) ===

Name: ${targetProfile.name}
Headline: ${targetProfile.headline || 'Not provided'}
Company: ${targetProfile.company || 'Not provided'}
Location: ${targetProfile.location || 'Not provided'}

About:
${targetProfile.about || 'Not provided'}

Experience:
${targetProfile.experience && targetProfile.experience.length > 0
  ? targetProfile.experience.map(exp => `- ${exp.title} at ${exp.company} (${exp.duration})\n  ${exp.description || ''}`).join('\n')
  : 'Not provided'}

Education:
${targetProfile.education && targetProfile.education.length > 0
  ? targetProfile.education.map(edu => `- ${edu.degree} ${edu.field ? 'in ' + edu.field : ''} from ${edu.school} (${edu.duration})`).join('\n')
  : 'Not provided'}

Skills:
${targetProfile.skills && targetProfile.skills.length > 0 ? targetProfile.skills.join(', ') : 'Not provided'}

=== YOUR PROFILE (the sender) ===

Name: ${userProfile.name}
Current Role: ${userProfile.currentRole}
Status: ${userProfile.status}
Looking For: ${userProfile.lookingFor}

Education: ${userProfile.education}

Top Skills: ${userProfile.topSkills ? userProfile.topSkills.join(', ') : 'Not provided'}

Key Projects:
${userProfile.keyProjects ? userProfile.keyProjects.map(p => `- ${p}`).join('\n') : 'Not provided'}

Recent Experience:
${userProfile.recentExperience ? userProfile.recentExperience.map(e => `- ${e}`).join('\n') : 'Not provided'}

What You Bring:
${userProfile.valueProps ? userProfile.valueProps.map(v => `- ${v}`).join('\n') : 'Not provided'}

=== TEMPLATE TO FILL IN (KEEP EXACT STRUCTURE) ===

${template}

=== YOUR TASK ===

Replace ONLY the text inside [BRACKETS] in the template above:
- [COMPANY] → Replace with their actual company name from TARGET's profile
- [AREAS_OF_INTEREST] → Replace with specific areas from TARGET's profile (e.g., "AI and machine learning", "product development")
- Any other [PLACEHOLDER] → Fill with relevant info from TARGET's profile

CRITICAL RULES:
- Do NOT change ANY text outside of [BRACKETS]
- Do NOT add new sentences or paragraphs
- Do NOT remove any sentences or paragraphs
- Do NOT rewrite or paraphrase anything
- Keep "Best regards, Naga Venkata Sai Chennu" exactly as is
- Keep all line breaks, punctuation, and formatting exactly as provided

Output the template with ONLY [BRACKETS] replaced. Everything else must remain identical.`
      : `Here is the LinkedIn profile data:

Name: ${targetProfile.name}
Headline: ${targetProfile.headline || 'Not provided'}
Company: ${targetProfile.company || 'Not provided'}
Location: ${targetProfile.location || 'Not provided'}

About:
${targetProfile.about || 'Not provided'}

Experience:
${targetProfile.experience && targetProfile.experience.length > 0
  ? targetProfile.experience.map(exp => `- ${exp.title} at ${exp.company} (${exp.duration})\n  ${exp.description || ''}`).join('\n')
  : 'Not provided'}

Education:
${targetProfile.education && targetProfile.education.length > 0
  ? targetProfile.education.map(edu => `- ${edu.degree} ${edu.field ? 'in ' + edu.field : ''} from ${edu.school} (${edu.duration})`).join('\n')
  : 'Not provided'}

Skills:
${targetProfile.skills && targetProfile.skills.length > 0 ? targetProfile.skills.join(', ') : 'Not provided'}

---

Here is the template to customize:

${template}

---

Now, fill in ONLY the [BRACKETS] in the template above using information from the profile data. Keep everything else EXACTLY the same.`;

    // Create a promise for this request to enable deduplication
    const requestPromise = (async () => {
      try {
        // Call OpenRouter API (GPT-4 Turbo for best results)
        const completion = await openai.chat.completions.create({
          model: MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.3,  // Lower temperature for more consistent template preservation
          max_tokens: 1000,
        });

        const customizedMessage = completion.choices[0].message.content.trim();

        console.log('✅ Message customized successfully');

        // Cache the generated message
        cacheMessage(cacheKey, customizedMessage);

        return customizedMessage;
      } finally {
        // Clean up pending request
        pendingRequests.delete(cacheKey);
      }
    })();

    // Store the pending request
    pendingRequests.set(cacheKey, requestPromise);

    // Wait for result
    const customizedMessage = await requestPromise;

    // Return the customized message
    res.json({
      success: true,
      customizedMessage,
      profileName: targetProfile.name,
      cached: false,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error customizing message:', error);

    // Handle specific OpenRouter/AI errors
    if (error.status === 401) {
      return res.status(500).json({
        success: false,
        error: 'OpenRouter API authentication failed. Please check your API key.'
      });
    }

    if (error.status === 429) {
      return res.status(429).json({
        success: false,
        error: 'API rate limit exceeded. Please try again later.'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to customize message',
      details: error.message
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// ============================================================================
// START SERVER
// ============================================================================

// Bind to 0.0.0.0 for Render.com deployment (required for production)
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log('='.repeat(60));
  console.log('🚀 LinkedIn Extension Backend Server');
  console.log('='.repeat(60));
  console.log(`📡 Server running on: http://${HOST}:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🤖 AI Model: ${MODEL}`);
  console.log(`✅ OpenRouter API: Connected`);
  console.log(`🔒 Security: Enabled (Helmet, CORS, Rate Limiting)`);
  console.log('='.repeat(60));
});
