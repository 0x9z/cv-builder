/* ============================================
   AI Bullet Point Enhancer
   Built by 0x9z | MIT License
   ============================================ */

const AIEngine = (() => {
  const modal = document.getElementById('ai-modal');
  const overlay = document.getElementById('modal-overlay');
  const aiOriginal = document.getElementById('ai-original');
  const aiSuggestion = document.getElementById('ai-suggestion');
  const btnAccept = document.getElementById('btn-accept-ai');
  const btnReject = document.getElementById('btn-reject-ai');

  let currentCallback = null; // Callback when user accepts suggestion
  let currentOriginal = '';

  // Default API key (user should replace with their own)
  // In production, this should be stored in localStorage, not hardcoded
  let apiKey = localStorage.getItem('cv_builder_openai_key') || '';

  /**
   * Initialize the AI engine
   */
  function init() {
    if (!modal || !overlay) return;

    // Close modal on overlay click
    overlay.addEventListener('click', closeModal);

    // Reject button
    if (btnReject) {
      btnReject.addEventListener('click', () => {
        closeModal();
        if (currentCallback) currentCallback(null);
      });
    }

    // Accept button
    if (btnAccept) {
      btnAccept.addEventListener('click', () => {
        const suggestion = aiSuggestion.textContent.trim();
        closeModal();
        if (currentCallback && suggestion && suggestion !== 'Loading...') {
          currentCallback(suggestion);
        }
      });
    }

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
        if (currentCallback) currentCallback(null);
      }
    });
  }

  /**
   * Open the AI enhancer modal
   * @param {string} originalText - The original bullet point text
   * @param {string} field - The user's field (for context)
   * @param {function} callback - Called with enhanced text or null if rejected
   */
  function enhance(originalText, field, callback) {
    if (!originalText || !originalText.trim()) {
      alert('⚠️ Please write something first before enhancing.');
      return;
    }

    currentCallback = callback;
    currentOriginal = originalText;

    // Show original text
    if (aiOriginal) aiOriginal.textContent = originalText;
    if (aiSuggestion) aiSuggestion.textContent = 'Loading...';

    // Show modal
    showModal();

    // Try API first, fall back to local enhancement
    if (apiKey) {
      enhanceWithOpenAI(originalText, field);
    } else {
      // No API key - use local enhancement
      setTimeout(() => {
        const enhanced = enhanceLocally(originalText, field);
        if (aiSuggestion) aiSuggestion.textContent = enhanced;
      }, 800);
    }
  }

  /**
   * Enhance using OpenAI API
   */
  async function enhanceWithOpenAI(text, field) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are a professional CV writer helping a ${field || 'professional'} improve their CV bullet points. 
              Make bullet points more impactful using strong action verbs, quantifiable results where possible, and concise language.
              Keep the same core meaning but make it sound more professional and achievement-focused.
              Return ONLY the improved bullet point, no explanations or quotes.`
            },
            {
              role: 'user',
              content: `Improve this CV bullet point for a ${field || 'professional'} position:\n\n"${text}"`
            }
          ],
          max_tokens: 150,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const enhanced = data.choices[0]?.message?.content?.trim();

      if (enhanced && aiSuggestion) {
        aiSuggestion.textContent = enhanced.replace(/^["']|["']$/g, '');
      } else {
        throw new Error('Empty response');
      }
    } catch (e) {
      console.error('OpenAI API error:', e);
      // Fall back to local enhancement
      if (aiSuggestion) {
        aiSuggestion.textContent = enhanceLocally(text, field);
        aiSuggestion.style.opacity = '0.7';
        aiSuggestion.title = 'AI API unavailable — showing local enhancement';
      }
    }
  }

  /**
   * Local enhancement (no API needed)
   * Uses rule-based improvements for common patterns
   */
  function enhanceLocally(text, field) {
    let enhanced = text.trim();

    // Remove trailing period for bullet points
    enhanced = enhanced.replace(/\.$/, '');

    // Common weak starters to replace
    const weakStarters = {
      'i was responsible for': 'Managed',
      'i helped': 'Assisted',
      'i worked on': 'Contributed to',
      'i did': 'Performed',
      'i made': 'Created',
      'i handled': 'Managed',
      'i managed': 'Oversaw',
      'i created': 'Developed',
      'i built': 'Constructed',
      'i fixed': 'Resolved',
      'i wrote': 'Authored',
      'i taught': 'Instructed',
      'i led': 'Directed',
      'was responsible for': 'Managed',
      'helped with': 'Assisted with',
      'worked on': 'Contributed to',
      'responsible for': 'Managed'
    };

    let lowerText = enhanced.toLowerCase();

    // Replace weak starters
    for (const [weak, strong] of Object.entries(weakStarters)) {
      if (lowerText.startsWith(weak)) {
        enhanced = strong + enhanced.substring(weak.length);
        lowerText = enhanced.toLowerCase();
        break;
      }
    }

    // Add action verb if it starts with a non-verb
    const actionVerbs = [
      'Developed', 'Implemented', 'Managed', 'Designed', 'Led',
      'Coordinated', 'Streamlined', 'Optimized', 'Engineered', 'Administered',
      'Configured', 'Deployed', 'Automated', 'Monitored', 'Analyzed'
    ];

    const firstWord = enhanced.split(' ')[0];
    const commonNonVerbs = ['the', 'a', 'an', 'my', 'our', 'their', 'this', 'that'];

    if (commonNonVerbs.includes(firstWord.toLowerCase())) {
      const randomVerb = actionVerbs[Math.floor(Math.random() * actionVerbs.length)];
      enhanced = randomVerb + ' ' + enhanced.charAt(0).toLowerCase() + enhanced.slice(1);
    }

    // Add metrics placeholder suggestion if no numbers present
    const hasNumbers = /\d+/.test(enhanced);
    if (!hasNumbers && enhanced.length > 20) {
      const metricSuggestions = [
        'resulting in improved efficiency',
        'across multiple departments',
        'for a team of colleagues',
        'reducing processing time',
        'increasing productivity'
      ];
      const suggestion = metricSuggestions[Math.floor(Math.random() * metricSuggestions.length)];
      enhanced += `, ${suggestion}`;
    }

    // Capitalize first letter
    enhanced = enhanced.charAt(0).toUpperCase() + enhanced.slice(1);

    // Ensure it doesn't end with a period
    enhanced = enhanced.replace(/\.$/, '');

    return enhanced;
  }

  /**
   * Show the modal
   */
  function showModal() {
    if (modal) modal.classList.add('active');
    if (overlay) overlay.classList.add('active');
  }

  /**
   * Close the modal
   */
  function closeModal() {
    if (modal) modal.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
    currentCallback = null;
    currentOriginal = '';
  }

  /**
   * Set API key
   */
  function setApiKey(key) {
    apiKey = key;
    if (key) {
      localStorage.setItem('cv_builder_openai_key', key);
    } else {
      localStorage.removeItem('cv_builder_openai_key');
    }
  }

  /**
   * Check if API key is set
   */
  function hasApiKey() {
    return !!apiKey;
  }

  /**
   * Get API key (masked)
   */
  function getApiKeyMasked() {
    if (!apiKey) return '';
    return apiKey.substring(0, 8) + '...' + apiKey.substring(apiKey.length - 4);
  }

  /**
   * Add enhance button to a bullet point input
   * @param {HTMLElement} inputElement - The textarea or input element
   * @param {string} field - The user's field
   */
  function attachEnhanceButton(inputElement, field) {
    // Check if button already exists
    const existingBtn = inputElement.parentElement.querySelector('.btn-enhance');
    if (existingBtn) return;

    const btn = document.createElement('button');
    btn.className = 'btn btn-sm btn-enhance';
    btn.innerHTML = '✨ Enhance';
    btn.style.marginTop = '0.3rem';
    btn.style.fontSize = '0.7rem';
    btn.style.padding = '0.25rem 0.6rem';
    btn.style.background = 'rgba(124, 58, 237, 0.2)';
    btn.style.border = '1px solid rgba(124, 58, 237, 0.4)';
    btn.style.color = '#c4b5fd';

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const originalText = inputElement.value;
      enhance(originalText, field, (enhancedText) => {
        if (enhancedText) {
          inputElement.value = enhancedText;
          inputElement.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
    });

    inputElement.parentElement.appendChild(btn);
  }

  // Public API
  return {
    init,
    enhance,
    setApiKey,
    hasApiKey,
    getApiKeyMasked,
    attachEnhanceButton
  };
})();