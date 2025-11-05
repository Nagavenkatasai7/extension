// Popup script for LinkedIn Message Customizer

// State management
let currentState = 'initial';
let profileData = null;
let customizedMessage = null;

// DOM elements
const states = {
  initial: document.getElementById('initialState'),
  loading: document.getElementById('loadingState'),
  success: document.getElementById('successState'),
  error: document.getElementById('errorState'),
  settings: document.getElementById('settingsState')
};

const buttons = {
  generate: document.getElementById('generateBtn'),
  copy: document.getElementById('copyBtn'),
  regenerate: document.getElementById('regenerateBtn'),
  retry: document.getElementById('retryBtn'),
  back: document.getElementById('backBtn'),
  backFromError: document.getElementById('backFromErrorBtn'),
  settings: document.getElementById('settingsBtn'),
  saveSettings: document.getElementById('saveSettingsBtn'),
  backFromSettings: document.getElementById('backFromSettingsBtn')
};

const elements = {
  profileName: document.getElementById('profileName'),
  customizedMessage: document.getElementById('customizedMessage'),
  errorMessage: document.getElementById('errorMessage'),
  apiUrlInput: document.getElementById('apiUrlInput'),
  apiSecretInput: document.getElementById('apiSecretInput'),
  templateInput: document.getElementById('templateInput')
};

/**
 * Show specific state and hide others
 */
function showState(stateName) {
  Object.keys(states).forEach(key => {
    states[key].classList.add('hidden');
  });
  states[stateName].classList.remove('hidden');
  currentState = stateName;
}

/**
 * Show error state with message
 */
function showError(message) {
  elements.errorMessage.textContent = message;
  showState('error');
}

/**
 * Check if current page is LinkedIn profile
 */
async function isLinkedInProfile() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab.url && tab.url.includes('linkedin.com/in/');
  } catch (error) {
    console.error('Error checking LinkedIn profile:', error);
    return false;
  }
}

/**
 * Load settings from storage
 */
async function loadSettings() {
  try {
    const result = await chrome.storage.local.get(['apiUrl', 'apiSecret', 'template']);

    return {
      apiUrl: result.apiUrl || 'http://localhost:3000',
      apiSecret: result.apiSecret || 'your_secret_key_for_additional_security',
      template: result.template || getDefaultTemplate()
    };
  } catch (error) {
    console.error('Error loading settings:', error);
    return {
      apiUrl: 'http://localhost:3000',
      apiSecret: 'your_secret_key_for_additional_security',
      template: getDefaultTemplate()
    };
  }
}

/**
 * Save settings to storage
 */
async function saveSettings(apiUrl, apiSecret, template) {
  try {
    await chrome.storage.local.set({ apiUrl, apiSecret, template });

    // Update background worker config
    chrome.runtime.sendMessage({
      action: 'updateConfig',
      config: {
        API_BASE_URL: apiUrl,
        API_SECRET_KEY: apiSecret
      }
    });

    return true;
  } catch (error) {
    console.error('Error saving settings:', error);
    return false;
  }
}

/**
 * Get default template
 */
function getDefaultTemplate() {
  return `I came across your profile on LinkedIn and was really interested in the innovative work your team at [COMPANY] is doing, especially in the areas of [AREAS_OF_INTEREST].

I'm currently pursuing my Master's in Computer Science at George Mason University, graduating in May 2025. I have hands-on experience in prompt engineering, multi-modal systems, and developing cutting-edge AI accessibility technologies. Recently, I built a real-time American Sign Language detection system using deep learning and CNNs, and have led several projects involving LLMs, RAG, and intelligent automation. My work has been recognized with awards in research excellence and accessibility innovation.

Given my technical background with Python, TensorFlow, OpenCV, and AWS, and my passion for solving real-world problems with AI, I believe my skills align well with your team's goals. I'd love your guidance on whether there might be any roles a fit for my background at [COMPANY], or what specific skills are most valuable in your organization.

Thank you for your time and insights.

Best regards,
Naga Venkata Sai Chennu`;
}

/**
 * Check if content script is loaded
 */
async function isContentScriptLoaded(tabId) {
  try {
    const response = await chrome.tabs.sendMessage(tabId, { action: 'ping' });
    return response && response.success;
  } catch (error) {
    return false;
  }
}

/**
 * Parse LinkedIn profile
 */
async function parseProfile() {
  return new Promise(async (resolve, reject) => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab.url.includes('linkedin.com/in/')) {
        reject(new Error('Please open a LinkedIn profile page first.'));
        return;
      }

      // Check if content script is already loaded
      const isLoaded = await isContentScriptLoaded(tab.id);

      // Only inject if not already loaded
      if (!isLoaded) {
        try {
          // Injecting content script
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['js/content.js']
          });
          // Wait for script to initialize
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error('Failed to inject content script:', error);
          reject(new Error('Failed to inject content script. Please refresh the page and try again.'));
          return;
        }
      }

      // Send message to content script
      try {
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'parseProfile' });

        if (response && response.success) {
          resolve(response.data);
        } else {
          reject(new Error(response?.error || 'Failed to parse profile'));
        }
      } catch (error) {
        console.error('Failed to communicate with content script:', error);
        reject(new Error('Could not connect to LinkedIn page. Please refresh the page and try again.'));
      }
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate customized message
 */
async function generateMessage() {
  try {
    showState('loading');

    // Check if on LinkedIn profile
    const isProfile = await isLinkedInProfile();
    if (!isProfile) {
      showError('Please open a LinkedIn profile page first.');
      return;
    }

    // Parse profile
    profileData = await parseProfile();

    // DEBUG: Log parsed profile data
    console.log('🔍 DEBUG - Profile data received in popup:', {
      name: profileData.name,
      company: profileData.company,
      headline: profileData.headline
    });

    // Load settings
    const settings = await loadSettings();

    // Call background script to customize message
    // Request message customization
    chrome.runtime.sendMessage(
      {
        action: 'customizeMessage',
        profileData: profileData,
        template: settings.template
      },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error('Runtime error:', chrome.runtime.lastError);
          showError('Failed to connect to background script. Please try again.');
          return;
        }

        if (response.success) {
          // Message customized successfully
          customizedMessage = response.data.customizedMessage;

          // DEBUG: Log generated message
          console.log('🔍 DEBUG - Generated message received:', {
            messagePreview: customizedMessage.substring(0, 150),
            hasPlaceholders: customizedMessage.includes('[COMPANY]')
          });
          elements.profileName.textContent = `For: ${profileData.name}`;
          elements.customizedMessage.value = customizedMessage;
          showState('success');
        } else {
          console.error('❌ Error:', response.error);
          showError(response.error || 'Failed to generate message. Please try again.');
        }
      }
    );
  } catch (error) {
    console.error('❌ Error generating message:', error);
    showError(error.message || 'An unexpected error occurred. Please try again.');
  }
}

/**
 * Copy message to clipboard
 */
async function copyToClipboard() {
  try {
    await navigator.clipboard.writeText(customizedMessage);

    // Show success feedback
    const originalText = buttons.copy.innerHTML;
    buttons.copy.innerHTML = `
      <svg class="btn-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
      </svg>
      Copied!
    `;
    buttons.copy.classList.add('btn-success');

    setTimeout(() => {
      buttons.copy.innerHTML = originalText;
      buttons.copy.classList.remove('btn-success');
    }, 2000);

  } catch (error) {
    console.error('Error copying to clipboard:', error);
    showError('Failed to copy to clipboard. Please copy manually.');
  }
}

/**
 * Open settings
 */
async function openSettings() {
  const settings = await loadSettings();
  elements.apiUrlInput.value = settings.apiUrl;
  elements.apiSecretInput.value = settings.apiSecret;
  elements.templateInput.value = settings.template;
  showState('settings');
}

/**
 * Save settings
 */
async function saveSettingsHandler() {
  const apiUrl = elements.apiUrlInput.value.trim();
  const apiSecret = elements.apiSecretInput.value.trim();
  const template = elements.templateInput.value.trim();

  if (!apiUrl) {
    alert('Please enter a valid API URL');
    return;
  }

  if (!template || template.length < 50) {
    alert('Please enter a valid template (at least 50 characters)');
    return;
  }

  const success = await saveSettings(apiUrl, apiSecret, template);

  if (success) {
    // Show success feedback
    const originalText = buttons.saveSettings.innerHTML;
    buttons.saveSettings.innerHTML = `
      <svg class="btn-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
      </svg>
      Saved!
    `;
    buttons.saveSettings.classList.add('btn-success');

    setTimeout(() => {
      buttons.saveSettings.innerHTML = originalText;
      buttons.saveSettings.classList.remove('btn-success');
      showState('initial');
    }, 1500);
  } else {
    alert('Failed to save settings. Please try again.');
  }
}

/**
 * Event listeners
 */
buttons.generate.addEventListener('click', generateMessage);
buttons.copy.addEventListener('click', copyToClipboard);
buttons.regenerate.addEventListener('click', generateMessage);
buttons.retry.addEventListener('click', generateMessage);
buttons.back.addEventListener('click', () => showState('initial'));
buttons.backFromError.addEventListener('click', () => showState('initial'));
buttons.settings.addEventListener('click', openSettings);
buttons.saveSettings.addEventListener('click', saveSettingsHandler);
buttons.backFromSettings.addEventListener('click', () => showState('initial'));

/**
 * Initialize popup
 */
async function init() {
  // Initialize popup

  // Check if on LinkedIn profile page
  const isProfile = await isLinkedInProfile();

  if (!isProfile) {
    buttons.generate.disabled = true;
    buttons.generate.textContent = 'Open a LinkedIn Profile';
    buttons.generate.classList.add('btn-disabled');
  } else {
    buttons.generate.disabled = false;
    buttons.generate.innerHTML = `
      <svg class="btn-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
      </svg>
      Generate Message
    `;
    buttons.generate.classList.remove('btn-disabled');
  }

  // Popup initialized
}

// Initialize on load
init();
