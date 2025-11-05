// Content script for parsing LinkedIn profile data
// This script runs on LinkedIn profile pages and extracts relevant information

// Guard against duplicate injection
if (window.linkedInCustomizerInjected) {
  // Content script already loaded
} else {
  window.linkedInCustomizerInjected = true;
  // LinkedIn Message Customizer: Content script loaded
}

// ============================================================================
// SECURITY - Input Sanitization
// ============================================================================

/**
 * Sanitize text to prevent XSS attacks
 * Removes potentially dangerous characters and HTML tags
 */
function sanitizeText(text) {
  if (!text || typeof text !== 'string') return '';

  // Remove HTML tags
  const div = document.createElement('div');
  div.textContent = text;
  let sanitized = div.innerHTML;

  // Remove script tags and event handlers
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/javascript:/gi, '');

  // Decode HTML entities back to text
  div.innerHTML = sanitized;
  return div.textContent.trim();
}

/**
 * Sanitize URL to prevent javascript: and data: URI attacks
 */
function sanitizeURL(url) {
  if (!url || typeof url !== 'string') return '';

  // Only allow http:// and https:// protocols
  if (!url.match(/^https?:\/\//i)) {
    return '';
  }

  return url.trim();
}

/**
 * Extracts text content from an element, handling null cases
 * Now with built-in sanitization
 */
function extractText(selector, context = document) {
  const element = context.querySelector(selector);
  return element ? sanitizeText(element.textContent) : '';
}

/**
 * Extracts all text content from multiple elements
 * Now with built-in sanitization
 */
function extractAllText(selector, context = document) {
  const elements = context.querySelectorAll(selector);
  return Array.from(elements).map(el => sanitizeText(el.textContent));
}

/**
 * Employment metadata keywords to filter out
 */
const EMPLOYMENT_METADATA = [
  'Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship',
  'Self-employed', 'Apprenticeship', 'Seasonal', 'Temporary',
  'Full time', 'Part time', 'Self employed', // Variations
  'Remote', 'Hybrid', 'On-site', 'Onsite' // Work arrangements
];

/**
 * Job-related keywords that aren't company names
 */
const JOB_KEYWORDS = [
  'Closing', 'Hiring', 'Recruiting', 'Looking', 'Seeking', 'Available',
  'Open to', 'Actively', 'Searching', 'Team', 'Lead', 'Manager',
  'Director', 'Senior', 'Junior', 'Principal', 'Staff', 'Chief'
];

/**
 * Clean company name by removing metadata and validating
 */
function cleanCompanyName(rawCompany) {
  if (!rawCompany || typeof rawCompany !== 'string') return '';

  let cleaned = rawCompany.trim();

  // Remove everything after · (employment type separator)
  cleaned = cleaned.split('·')[0].trim();

  // Remove everything after common separators
  cleaned = cleaned.split('|')[0].trim();
  cleaned = cleaned.split(' - ')[0].trim();
  cleaned = cleaned.split('@')[0].trim(); // Handle "AI@Company" patterns

  // Check if it's employment metadata
  if (EMPLOYMENT_METADATA.some(meta =>
    cleaned.toLowerCase() === meta.toLowerCase() ||
    cleaned.toLowerCase().includes(meta.toLowerCase())
  )) {
    return ''; // Invalid company name
  }

  // Check if it's a job keyword only
  if (JOB_KEYWORDS.some(keyword =>
    cleaned.toLowerCase() === keyword.toLowerCase()
  )) {
    return ''; // Invalid company name
  }

  // Must be at least 2 characters and not just numbers
  if (cleaned.length < 2 || /^\d+$/.test(cleaned)) {
    return '';
  }

  // Reject common 2-letter acronyms that aren't companies
  const commonAcronyms = ['AI', 'IT', 'HR', 'PR', 'QA', 'UI', 'UX', 'ML', 'VP', 'CEO', 'CTO', 'CFO'];
  if (commonAcronyms.includes(cleaned.toUpperCase())) {
    return '';
  }

  return cleaned;
}

/**
 * Extract company from experience item with multiple fallbacks
 */
function extractCompanyFromExperienceItem(item) {
  // Try multiple selectors in order of specificity
  const selectors = [
    'span.t-14.t-normal > span[aria-hidden="true"]:first-child', // Most specific
    '.pvs-entity__caption-wrapper span[aria-hidden="true"]:first-child',
    '.t-14.t-normal span[aria-hidden="true"]:first-child',
    '.t-14 span[aria-hidden="true"]:first-child'
  ];

  for (const selector of selectors) {
    try {
      const elements = item.querySelectorAll(selector);

      // Try each element until we find a valid company name
      for (const element of elements) {
        const text = element.textContent?.trim();
        const cleaned = cleanCompanyName(text);

        if (cleaned && cleaned.length >= 2) {
          return cleaned;
        }
      }
    } catch (e) {
      continue;
    }
  }

  // Fallback: try to get full text and extract first valid part
  try {
    const fullText = item.querySelector('.t-14.t-normal')?.textContent || '';
    const parts = fullText.split('·').map(p => p.trim());

    for (const part of parts) {
      const cleaned = cleanCompanyName(part);
      if (cleaned && cleaned.length >= 2) {
        return cleaned;
      }
    }
  } catch (e) {
    // Ignore
  }

  return '';
}

/**
 * Wait for an element to appear in the DOM
 */
function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }

    const observer = new MutationObserver(() => {
      if (document.querySelector(selector)) {
        observer.disconnect();
        resolve(document.querySelector(selector));
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error('Timeout waiting for element: ' + selector));
    }, timeout);
  });
}

/**
 * Check if we're on a LinkedIn profile page
 */
function isLinkedInProfilePage() {
  const url = window.location.href;
  return url.includes('linkedin.com/in/') && !url.includes('/search/');
}

/**
 * Main function to parse LinkedIn profile
 */
async function parseLinkedInProfile() {
  // Parse LinkedIn profile
  try {
    // Check if we're on a profile page
    if (!isLinkedInProfilePage()) {
      throw new Error('Please navigate to a LinkedIn profile page (URL should contain /in/)');
    }

    // Wait for the main profile section to load - try multiple selectors
    const mainSelectors = [
      'main.scaffold-layout__main',
      '.scaffold-layout__main',
      'section[data-member-id]',
      '.profile-page'
    ];

    let mainElement = null;
    for (const selector of mainSelectors) {
      try {
        mainElement = await waitForElement(selector, 2000);
        if (mainElement) break;
      } catch (e) {
        continue;
      }
    }

    if (!mainElement) {
      throw new Error('Unable to detect LinkedIn profile. Please make sure the page has fully loaded and try again.');
    }

    const profileData = {
      name: '',
      headline: '',
      company: '',
      location: '',
      about: '',
      experience: [],
      education: [],
      skills: [],
      certifications: [],
      projects: [],
      recommendations: [],
      interests: [],
      languages: []
    };

    console.log('🔍 Starting comprehensive LinkedIn profile extraction...');

    // Extract name - updated selectors for current LinkedIn
    profileData.name = extractText('h1.text-heading-xlarge')
      || extractText('h1.inline.t-24')
      || extractText('.pv-text-details__left-panel h1')
      || extractText('[data-generated-suggestion-target] h1');

    // Extract headline - updated selectors
    profileData.headline = extractText('.text-body-medium.break-words')
      || extractText('.pv-text-details__left-panel .text-body-medium')
      || extractText('div.text-body-medium[data-generated-suggestion-target]');

    // ⭐ PRIORITY #1: Extract company from profile badge (most reliable!)
    // This is the company chip/badge shown next to the profile name (e.g., "Fireworks AI")
    const companyBadge = document.querySelector('.pv-text-details__right-panel .hoverable-link-text')
      || document.querySelector('.pv-top-card--list-bullet .hoverable-link-text')
      || document.querySelector('[data-field="experience_company_logo"] + div')
      || document.querySelector('.pv-text-details__right-panel-item-link');

    if (companyBadge) {
      const badgeCompany = cleanCompanyName(companyBadge.textContent || '');
      if (badgeCompany && badgeCompany.length >= 2) {
        profileData.company = badgeCompany;
        console.log(`✅ Extracted company from profile badge (PRIMARY): "${profileData.company}"`);
      }
    }

    // Fallback: Extract current company from headline if badge failed
    if (!profileData.company) {
      const headlineText = profileData.headline.toLowerCase();
      if (headlineText.includes(' at ')) {
        const parts = profileData.headline.split(' at ');
        if (parts.length > 1) {
          const cleaned = cleanCompanyName(parts[parts.length - 1].split('|')[0].trim());
          if (cleaned && cleaned.length >= 2) {
            profileData.company = cleaned;
            console.log(`✅ Extracted company from headline "at" pattern: "${profileData.company}"`);
          }
        }
      } else if (headlineText.includes(' @ ')) {
        const parts = profileData.headline.split(' @ ');
        if (parts.length > 1) {
          const cleaned = cleanCompanyName(parts[parts.length - 1].split('|')[0].trim());
          if (cleaned && cleaned.length >= 2) {
            profileData.company = cleaned;
            console.log(`✅ Extracted company from headline "@" pattern: "${profileData.company}"`);
          }
        }
      }
    }

    // Extract location - updated selectors
    profileData.location = extractText('.text-body-small.inline.t-black--light.break-words')
      || extractText('.pv-text-details__left-panel .text-body-small')
      || extractText('span.text-body-small[data-generated-suggestion-target]');

    // Extract About section - updated for current LinkedIn
    try {
      // Try multiple ways to find About section
      const aboutSection = document.querySelector('#about')?.parentElement?.parentElement
        || document.querySelector('section:has(#about)')
        || Array.from(document.querySelectorAll('section')).find(s =>
          s.querySelector('h2')?.textContent.toLowerCase().includes('about')
        );

      if (aboutSection) {
        // ⚠️ SAFETY: Only click "see more" if it's SPECIFICALLY in the About section
        // Use very specific selector to avoid clicking post "see more" buttons
        const seeMoreButton = aboutSection.querySelector('.inline-show-more-text__button[aria-label*="about"], .inline-show-more-text__button');

        // Extra safety: verify the button is actually within the About section AND not in Recent Activity
        if (seeMoreButton && aboutSection.contains(seeMoreButton)) {
          // Check that we're not accidentally in the Recent Activity section
          const isInRecentActivity = seeMoreButton.closest('section')?.querySelector('h2')?.textContent?.toLowerCase().includes('activity')
            || seeMoreButton.closest('section')?.querySelector('h2')?.textContent?.toLowerCase().includes('post');

          if (!isInRecentActivity) {
            seeMoreButton.click();
            await new Promise(resolve => setTimeout(resolve, 100)); // Wait for expansion
            console.log('✅ Expanded About section "see more"');
          } else {
            console.log('⚠️ Skipped clicking button - detected as Recent Activity');
          }
        }

        // Extract full about text
        profileData.about = extractText('.inline-show-more-text', aboutSection)
          || extractText('.pv-about__summary-text', aboutSection)
          || extractText('.display-flex.ph5.pv3', aboutSection)
          || extractText('.pvs-list__outer-container', aboutSection)
          || extractText('.visually-hidden', aboutSection)
          || extractText('div[class*="about"] span[aria-hidden="true"]', aboutSection);

        console.log(`✅ About section: ${profileData.about.substring(0, 100)}...`);
      }
    } catch (e) {
      console.warn('Could not parse About section:', e);
    }

    // Extract Experience - using proven Stack Overflow approach
    try {
      // Use the exact selector from Stack Overflow that works
      const experienceItems = document.querySelectorAll('section:has(#experience) > div > ul > li');

      console.log(`🔍 DEBUG - Found ${experienceItems.length} experience items using Stack Overflow selector`);

        experienceItems.forEach((item, index) => {
          if (index < 5) { // Limit to top 5 experiences
            try {
              // Use Yale3 proven selectors (most reliable for 2025 LinkedIn)
              const title = extractText('div.t-bold span[aria-hidden="true"]', item)
                || extractText('.t-bold span[aria-hidden="true"]', item)
                || extractText('.t-bold', item);

              // Use improved company extraction with validation
              const company = extractCompanyFromExperienceItem(item);

              // Date selector
              const duration = extractText('.t-14.t-normal.t-black--light span[aria-hidden="true"]', item)
                || extractText('.t-black--light span[aria-hidden="true"]', item);

              // Description selector (with null-safe context check)
              const subComponents = item.querySelector('.pvs-entity__sub-components');
              const description = extractText('.inline-show-more-text', item)
                || (subComponents ? extractText('span[aria-hidden="true"]', subComponents) : '');

              if (title || company) {
                profileData.experience.push({
                  title: title || 'N/A',
                  company: company || 'N/A',
                  duration: duration || 'N/A',
                  description: description || ''
                });

                // If we don't have company yet, use the first valid one from experience
                if (!profileData.company && company && company.length >= 2) {
                  profileData.company = company;
                  console.log(`✅ Extracted company from experience: "${company}"`);
                }
              }
            } catch (expError) {
              console.warn(`Failed to parse experience item ${index}:`, expError);
            }
          }
        });
    } catch (e) {
      console.warn('Could not parse Experience section:', e);
    }

    // Extract Education - updated for current LinkedIn
    try {
      const educationSection = document.querySelector('#education')?.parentElement?.parentElement
        || Array.from(document.querySelectorAll('section')).find(s =>
          s.querySelector('h2')?.textContent.toLowerCase().includes('education')
        );

      if (educationSection) {
        const educationItems = educationSection.querySelectorAll('ul.pvs-list > li.artdeco-list__item')
          || educationSection.querySelectorAll('li.pvs-list__paged-list-item');

        educationItems.forEach((item, index) => {
          if (index < 3) { // Limit to top 3 education entries
            try {
              const school = extractText('.t-bold span[aria-hidden="true"]', item)
                || extractText('.mr1.hoverable-link-text.t-bold span[aria-hidden="true"]', item)
                || extractText('.display-flex .t-bold span', item)
                || extractText('.pvs-entity__path-node', item)
                || extractText('.t-bold', item);

              const degree = extractText('.t-14.t-normal span[aria-hidden="true"]', item)
                || extractText('.t-14.t-normal', item)
                || extractText('.pvs-entity__secondary-title', item);

              const duration = extractText('.t-14.t-normal.t-black--light span[aria-hidden="true"]', item)
                || extractText('.t-black--light.t-14', item)
                || extractText('.pvs-entity__caption-wrapper', item);

              if (school) {
                // Try to parse degree and field
                let degreeText = degree;
                let fieldText = '';

                if (degree.includes(',')) {
                  const parts = degree.split(',');
                  degreeText = parts[0].trim();
                  fieldText = parts[1]?.trim() || '';
                } else if (degree.includes(' in ')) {
                  const parts = degree.split(' in ');
                  degreeText = parts[0].trim();
                  fieldText = parts[1]?.trim() || '';
                }

                profileData.education.push({
                  school: school || 'N/A',
                  degree: degreeText || 'N/A',
                  field: fieldText || '',
                  duration: duration || 'N/A'
                });
              }
            } catch (eduError) {
              console.warn(`Failed to parse education item ${index}:`, eduError);
            }
          }
        });
      }
    } catch (e) {
      console.warn('Could not parse Education section:', e);
    }

    // Extract Skills - updated for current LinkedIn
    try {
      const skillsSection = document.querySelector('#skills')?.parentElement?.parentElement
        || Array.from(document.querySelectorAll('section')).find(s =>
          s.querySelector('h2')?.textContent.toLowerCase().includes('skill')
        );

      if (skillsSection) {
        const skillElements = skillsSection.querySelectorAll('.mr1.hoverable-link-text.t-bold span[aria-hidden="true"]')
          || skillsSection.querySelectorAll('.pvs-entity__path-node')
          || skillsSection.querySelectorAll('.hoverable-link-text.t-bold span');

        profileData.skills = Array.from(skillElements)
          .slice(0, 20) // Limit to top 20 skills
          .map(el => el.textContent.trim())
          .filter(skill => skill.length > 0 && skill.length < 100); // Filter out invalid data
      }
    } catch (e) {
      console.warn('Could not parse Skills section:', e);
    }

    // Extract Certifications - NEW
    try {
      const certificationsSection = document.querySelector('#licenses_and_certifications')?.parentElement?.parentElement
        || Array.from(document.querySelectorAll('section')).find(s =>
          s.querySelector('h2')?.textContent.toLowerCase().includes('licens') ||
          s.querySelector('h2')?.textContent.toLowerCase().includes('certification')
        );

      if (certificationsSection) {
        const certItems = certificationsSection.querySelectorAll('ul.pvs-list > li, li[class*="pvs"]');

        certItems.forEach((item, index) => {
          if (index < 10) {
            const name = extractText('.t-bold span[aria-hidden="true"]', item)
              || extractText('.mr1 span[aria-hidden="true"]', item);
            const issuer = extractText('.t-14 span[aria-hidden="true"]', item)
              || extractText('.t-14.t-normal', item);
            const date = extractText('.t-black--light span[aria-hidden="true"]', item);

            if (name) {
              profileData.certifications.push({
                name: name,
                issuer: issuer || 'N/A',
                date: date || 'N/A'
              });
            }
          }
        });

        console.log(`✅ Certifications: ${profileData.certifications.length} found`);
      }
    } catch (e) {
      console.warn('Could not parse Certifications section:', e);
    }

    // Extract Projects - NEW
    try {
      const projectsSection = document.querySelector('#projects')?.parentElement?.parentElement
        || Array.from(document.querySelectorAll('section')).find(s =>
          s.querySelector('h2')?.textContent.toLowerCase().includes('project')
        );

      if (projectsSection) {
        const projectItems = projectsSection.querySelectorAll('ul.pvs-list > li, li[class*="pvs"]');

        projectItems.forEach((item, index) => {
          if (index < 10) {
            const name = extractText('.t-bold span[aria-hidden="true"]', item);
            const description = extractText('.inline-show-more-text', item)
              || extractText('.pvs-list__outer-container', item);
            const date = extractText('.t-black--light span[aria-hidden="true"]', item);

            if (name) {
              profileData.projects.push({
                name: name,
                description: description || '',
                date: date || 'N/A'
              });
            }
          }
        });

        console.log(`✅ Projects: ${profileData.projects.length} found`);
      }
    } catch (e) {
      console.warn('Could not parse Projects section:', e);
    }

    // Extract Recommendations - NEW
    try {
      const recommendationsSection = document.querySelector('#recommendations')?.parentElement?.parentElement
        || Array.from(document.querySelectorAll('section')).find(s =>
          s.querySelector('h2')?.textContent.toLowerCase().includes('recommendation')
        );

      if (recommendationsSection) {
        const recItems = recommendationsSection.querySelectorAll('ul.pvs-list > li, li[class*="pvs"]');

        recItems.forEach((item, index) => {
          if (index < 5) {
            const text = extractText('.inline-show-more-text', item)
              || extractText('.pvs-list__outer-container', item)
              || extractText('span[aria-hidden="true"]', item);
            const author = extractText('.t-bold', item);

            if (text) {
              profileData.recommendations.push({
                text: text.substring(0, 500), // Limit length
                author: author || 'Unknown'
              });
            }
          }
        });

        console.log(`✅ Recommendations: ${profileData.recommendations.length} found`);
      }
    } catch (e) {
      console.warn('Could not parse Recommendations section:', e);
    }

    // Extract Interests - NEW
    try {
      const interestsSection = document.querySelector('#interests')?.parentElement?.parentElement
        || Array.from(document.querySelectorAll('section')).find(s =>
          s.querySelector('h2')?.textContent.toLowerCase().includes('interest')
        );

      if (interestsSection) {
        const interestItems = interestsSection.querySelectorAll('ul.pvs-list > li, li[class*="pvs"]');

        interestItems.forEach((item, index) => {
          if (index < 20) {
            const interest = extractText('.t-bold span[aria-hidden="true"]', item)
              || extractText('span[aria-hidden="true"]', item);

            if (interest && interest.trim()) {
              // Truncate to 200 characters max to match backend validation
              const truncatedInterest = interest.trim().substring(0, 200);
              profileData.interests.push(truncatedInterest);
            }
          }
        });

        console.log(`✅ Interests: ${profileData.interests.length} found`);
      }
    } catch (e) {
      console.warn('Could not parse Interests section:', e);
    }

    // Extract Languages - NEW
    try {
      const languagesSection = document.querySelector('#languages')?.parentElement?.parentElement
        || Array.from(document.querySelectorAll('section')).find(s =>
          s.querySelector('h2')?.textContent.toLowerCase().includes('language')
        );

      if (languagesSection) {
        const langItems = languagesSection.querySelectorAll('ul.pvs-list > li, li[class*="pvs"]');

        langItems.forEach((item, index) => {
          if (index < 10) {
            const language = extractText('.t-bold span[aria-hidden="true"]', item);
            const proficiency = extractText('.t-14 span[aria-hidden="true"]', item);

            if (language) {
              profileData.languages.push({
                language: language,
                proficiency: proficiency || 'N/A'
              });
            }
          }
        });

        console.log(`✅ Languages: ${profileData.languages.length} found`);
      }
    } catch (e) {
      console.warn('Could not parse Languages section:', e);
    }

    // Validate we got at least some basic info
    if (!profileData.name) {
      throw new Error('Could not extract profile name. The page may not be fully loaded or LinkedIn may have changed its layout. Please refresh and try again.');
    }

    // FINAL FALLBACK: If still no company, try alternative extraction methods
    if (!profileData.company) {
      console.log('⚠️ No company found, trying final fallbacks...');

      // Try profile top section with validation
      const topCompanyRaw = document.querySelector('.pv-text-details__left-panel .text-body-small')?.textContent.trim()
        || document.querySelector('.mt1 .text-body-small')?.textContent.trim();

      if (topCompanyRaw) {
        const cleaned = cleanCompanyName(topCompanyRaw);
        if (cleaned && cleaned.length >= 2) {
          profileData.company = cleaned;
          console.log(`✅ Extracted company from top section: "${profileData.company}"`);
        }
      }

      // Try first experience if available
      if (!profileData.company && profileData.experience.length > 0) {
        const firstExp = profileData.experience[0];
        if (firstExp.company && firstExp.company !== 'N/A') {
          const cleaned = cleanCompanyName(firstExp.company);
          if (cleaned && cleaned.length >= 2) {
            profileData.company = cleaned;
            console.log(`✅ Using company from first experience: "${profileData.company}"`);
          }
        }
      }

      // Last resort: try to extract "at [Company]" pattern from headline
      if (!profileData.company && profileData.headline) {
        // Look for "at Company" or "@ Company" patterns
        const atMatch = profileData.headline.match(/(?:at|@)\s+([A-Z][A-Za-z0-9\s&.,'-]+?)(?:\s*[\|·]|\s*-\s*|$)/);
        if (atMatch && atMatch[1]) {
          const cleaned = cleanCompanyName(atMatch[1].trim());
          if (cleaned && cleaned.length >= 2) {
            profileData.company = cleaned;
            console.log(`✅ Extracted company from headline "at" pattern: "${profileData.company}"`);
          }
        }
      }

      // Final fallback: look for capitalized words (but with strict validation)
      if (!profileData.company && profileData.headline) {
        const words = profileData.headline.split(/\s+/);
        const excludedWords = /^(at|in|the|and|or|for|WE|ARE|Senior|Junior|Lead|Principal|Staff|Manager|Director|Engineer|Developer|Designer|Analyst|Specialist|Consultant|Coordinator|Assistant|Executive|Vice|Chief|Head|Hiring|Recruiting|Closing|Looking|Seeking)$/i;

        for (const word of words) {
          if (word.length > 2 && /^[A-Z]/.test(word) && !excludedWords.test(word)) {
            const cleaned = cleanCompanyName(word);
            if (cleaned && cleaned.length >= 2) {
              profileData.company = cleaned;
              console.log(`⚠️ Inferred company from headline capitalized word: "${profileData.company}"`);
              break;
            }
          }
        }
      }
    }

    // DEBUG: Log what we extracted
    console.log('🔍 DEBUG - Extracted Profile Data:', {
      name: profileData.name,
      company: profileData.company,
      headline: profileData.headline,
      hasAbout: !!profileData.about,
      experienceCount: profileData.experience.length,
      skillsCount: profileData.skills.length
    });

    return profileData;

  } catch (error) {
    console.error('❌ Error parsing LinkedIn profile:', error);

    // Provide more specific error messages
    if (error.message.includes('navigate to a LinkedIn profile')) {
      throw error; // Use the specific error message
    } else if (error.message.includes('Could not extract profile name')) {
      throw error;
    } else {
      throw new Error(`Failed to parse LinkedIn profile: ${error.message}. Please make sure you are on a profile page (URL contains /in/) and the page has fully loaded.`);
    }
  }
}

/**
 * Listen for messages from popup (only if not already registered)
 */
if (!window.linkedInCustomizerListenerRegistered) {
  window.linkedInCustomizerListenerRegistered = true;

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Handle ping to check if content script is loaded
    if (request.action === 'ping') {
      sendResponse({ success: true });
      return true;
    }

    if (request.action === 'parseProfile') {
      // Handle parseProfile request

      parseLinkedInProfile()
        .then(profileData => {
          sendResponse({ success: true, data: profileData });
        })
        .catch(error => {
          sendResponse({ success: false, error: error.message });
        });

      // Return true to indicate we'll send a response asynchronously
      return true;
    }
  });
}
