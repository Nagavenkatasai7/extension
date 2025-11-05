// Background service worker for the LinkedIn Message Customizer extension
// Handles communication between content script, popup, and backend API

/**
 * Load configuration
 */
let CONFIG = {
  API_BASE_URL: 'http://localhost:3000',
  API_SECRET_KEY: 'linkedin-ai-extension-2025-secure',
  TIMEOUT_MS: 30000,
  MAX_RETRIES: 3
};

/**
 * Get user profile from storage or use default
 */
async function getUserProfile() {
  try {
    const result = await chrome.storage.local.get(['userProfile']);
    return result.userProfile || null;
  } catch (error) {
    console.error('Error loading user profile:', error);
    return null;
  }
}

/**
 * Call backend API to customize message
 */
async function customizeMessage(profileData, template) {
  // Call backend API to customize message

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT_MS);

  try {
    // Get user profile for matching
    const userProfile = await getUserProfile();

    // DEBUG: Log what we're sending to backend (summary)
    console.log('🔍 DEBUG - Sending to backend (summary):', {
      targetName: profileData.name,
      targetCompany: profileData.company,
      hasUserProfile: !!userProfile,
      templatePreview: template.substring(0, 100)
    });

    // DEBUG: Log FULL payload for debugging
    console.log('📤 DEBUG - Full payload:', JSON.stringify({
      targetProfile: profileData,
      userProfile: userProfile,
      template: template
    }, null, 2));

    const response = await fetch(`${CONFIG.API_BASE_URL}/api/customize-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Secret': CONFIG.API_SECRET_KEY
      },
      body: JSON.stringify({
        targetProfile: profileData,  // Renamed for clarity
        userProfile: userProfile,     // Your profile
        template
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    clearTimeout(timeoutId);
    console.error('❌ Error calling backend API:', error);

    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }

    if (error.message.includes('Failed to fetch')) {
      throw new Error('Cannot connect to backend server. Make sure the server is running on ' + CONFIG.API_BASE_URL);
    }

    throw error;
  }
}

/**
 * Listen for messages from popup
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'customizeMessage') {
    // Handle customizeMessage request

    customizeMessage(request.profileData, request.template)
      .then(result => {
        sendResponse({ success: true, data: result });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });

    // Return true to indicate we'll send a response asynchronously
    return true;
  }

  if (request.action === 'updateConfig') {
    // Update configuration
    CONFIG = { ...CONFIG, ...request.config };
    sendResponse({ success: true });
    return true;
  }
});

/**
 * Handle extension installation
 */
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Extension installed - set defaults

    // Set default configuration in storage
    chrome.storage.local.set({
      template: `I came across your profile on LinkedIn and was really interested in the innovative work your team at [COMPANY] is doing, especially in the areas of [AREAS_OF_INTEREST].

I'm currently pursuing my Master's in Computer Science at George Mason University, graduating in May 2025. I have hands-on experience in prompt engineering, multi-modal systems, and developing cutting-edge AI accessibility technologies. Recently, I built a real-time American Sign Language detection system using deep learning and CNNs, and have led several projects involving LLMs, RAG, and intelligent automation. My work has been recognized with awards in research excellence and accessibility innovation.

Given my technical background with Python, TensorFlow, OpenCV, and AWS, and my passion for solving real-world problems with AI, I believe my skills align well with your team's goals. I'd love your guidance on whether there might be any roles a fit for my background at [COMPANY], or what specific skills are most valuable in your organization.

Thank you for your time and insights.

Best regards,
Naga Venkata Sai Chennu`,
      apiUrl: 'http://localhost:3000',
      apiSecret: 'linkedin-ai-extension-2025-secure',

      // Store user profile permanently
      userProfile: {
        name: "Naga Venkata Sai Chennu",
        email: "nchennu@gmu.edu",
        currentRole: "Graduate Research Assistant at George Mason University",
        status: "MS CS @ GMU, graduating May 2025",
        graduationDate: "May 2025",
        lookingFor: "Full-time AI Engineering or Machine Learning roles",

        topSkills: ["Prompt Engineering", "LangChain", "Python", "RAG", "Conversational AI", "Multi-Modal Systems"],

        keyProjects: [
          "Real-time ASL detection system (92% accuracy)",
          "Conversational AI chatbot (1000+ queries daily, 95% satisfaction)",
          "Incident triage system (200+ incidents weekly, 78% automation)",
          "AI market research platform (3,700+ word reports in <5s)"
        ],

        recentExperience: [
          "Graduate Research Assistant at GMU (LLM research)",
          "Computer Vision & Multi-Modal Prompt Engineer",
          "Conversational AI Engineer & RAG Systems Specialist",
          "Intelligent Automation & Prompt Engineering Specialist"
        ],

        education: "MS Computer Science @ George Mason University (2024-2026)",

        valueProps: [
          "Strong technical skills in prompt engineering and LLM applications",
          "Proven track record building production-ready AI systems",
          "Experience with high-volume systems (1000+ queries daily)",
          "Published research in AI and machine learning",
          "Commitment to accessibility and inclusive technology"
        ]
      }
    });
  }
});
