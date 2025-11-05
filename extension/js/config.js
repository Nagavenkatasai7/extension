// Configuration file for the extension
const CONFIG = {
  // ============================================================================
  // BACKEND API URL - IMPORTANT: UPDATE THIS AFTER DEPLOYING TO RENDER
  // ============================================================================
  // For local development: 'http://localhost:3000'
  // For production (Render): 'https://YOUR-APP-NAME.onrender.com'
  //
  // Steps to update:
  // 1. Deploy backend to Render.com (see backend/RENDER_DEPLOYMENT_GUIDE.md)
  // 2. Copy your Render URL (e.g., https://linkedin-extension-backend.onrender.com)
  // 3. Replace the URL below with your production URL
  // 4. Reload the extension in Chrome
  // ============================================================================
  API_BASE_URL: 'http://localhost:3000',  // ⚠️ CHANGE THIS to your Render URL!

  // API Secret Key (optional, must match backend .env)
  API_SECRET_KEY: 'linkedin-ai-extension-2025-secure',

  // Default template - Can be customized by user
  DEFAULT_TEMPLATE: `I came across your profile on LinkedIn and was really interested in the innovative work your team at [COMPANY] is doing, especially in the areas of [AREAS_OF_INTEREST].

I'm currently pursuing my Master's in Computer Science at George Mason University, graduating in May 2025. I have hands-on experience in prompt engineering, multi-modal systems, and developing cutting-edge AI accessibility technologies. Recently, I built a real-time American Sign Language detection system using deep learning and CNNs, and have led several projects involving LLMs, RAG, and intelligent automation. My work has been recognized with awards in research excellence and accessibility innovation.

Given my technical background with Python, TensorFlow, OpenCV, and AWS, and my passion for solving real-world problems with AI, I believe my skills align well with your team's goals. I'd love your guidance on whether there might be any roles a fit for my background at [COMPANY], or what specific skills are most valuable in your organization.

Thank you for your time and insights.

Best regards,
Naga Venkata Sai Chennu`,

  // Settings
  TIMEOUT_MS: 30000, // 30 seconds timeout for API calls
  MAX_RETRIES: 3
};
