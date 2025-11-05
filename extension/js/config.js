// Configuration file for the extension
const CONFIG = {
  // ============================================================================
  // BACKEND API URL - PRODUCTION
  // ============================================================================
  // ✅ Updated with Render production URL
  // Deployed: 2025-11-05
  // Status: Live and running
  // ============================================================================
  API_BASE_URL: 'https://extension-1-3zrr.onrender.com',  // ✅ Production URL

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
