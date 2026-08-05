/* ============================================
   State Manager - CV Data Management
   Built by 0x9z | MIT License
   ============================================ */

const CVState = (() => {
  // Default empty CV structure
  const defaultCV = {
    // Meta
    field: '',
    template: 'classic',

    // Personal Information
    fullName: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    github: '',
    website: '',

    // Professional Summary
    summary: '',

    // Skills
    skills: [],

    // Experience
    experience: [],

    // Education
    education: [],

    // Certifications
    certifications: [],

    // Languages
    languages: [
      { language: 'Arabic', level: 'Native' }
    ],

    // Field-specific extras
    fieldSpecific: {},

    // Completion tracking
    completedSteps: []
  };

  // Current CV data (in memory)
  let currentCV = JSON.parse(JSON.stringify(defaultCV));

  // Change listeners - functions to call when state changes
  let listeners = [];

  /**
   * Get the entire CV object
   */
  function getCV() {
    return JSON.parse(JSON.stringify(currentCV));
  }

  /**
   * Get a specific field from the CV
   */
  function getField(key) {
    const keys = key.split('.');
    let value = currentCV;
    for (const k of keys) {
      if (value === undefined || value === null) return undefined;
      value = value[k];
    }
    return value;
  }

  /**
   * Update a specific field in the CV
   */
  function updateField(key, value) {
    const keys = key.split('.');
    let obj = currentCV;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!obj[keys[i]]) obj[keys[i]] = {};
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;
    notifyListeners(key, value);
  }

  /**
   * Add item to an array field (experience, education, certifications, skills)
   */
  function addItem(arrayKey, item) {
    if (!Array.isArray(currentCV[arrayKey])) {
      currentCV[arrayKey] = [];
    }
    currentCV[arrayKey].push(item);
    notifyListeners(arrayKey, currentCV[arrayKey]);
  }

  /**
   * Remove item from an array field by index
   */
  function removeItem(arrayKey, index) {
    if (Array.isArray(currentCV[arrayKey])) {
      currentCV[arrayKey].splice(index, 1);
      notifyListeners(arrayKey, currentCV[arrayKey]);
    }
  }

  /**
   * Update an item in an array field by index
   */
  function updateItem(arrayKey, index, updatedItem) {
    if (Array.isArray(currentCV[arrayKey]) && currentCV[arrayKey][index]) {
      currentCV[arrayKey][index] = { ...currentCV[arrayKey][index], ...updatedItem };
      notifyListeners(arrayKey, currentCV[arrayKey]);
    }
  }

  /**
   * Reset the entire CV to defaults
   */
  function resetCV() {
    currentCV = JSON.parse(JSON.stringify(defaultCV));
    notifyListeners('reset', currentCV);
  }

  /**
   * Load a saved CV
   */
  function loadCV(data) {
    currentCV = JSON.parse(JSON.stringify({ ...defaultCV, ...data }));
    notifyListeners('load', currentCV);
  }

  /**
   * Mark a step as completed
   */
  function markStepComplete(stepId) {
    if (!currentCV.completedSteps.includes(stepId)) {
      currentCV.completedSteps.push(stepId);
      notifyListeners('completedSteps', currentCV.completedSteps);
    }
  }

  /**
   * Check if a step is completed
   */
  function isStepComplete(stepId) {
    return currentCV.completedSteps.includes(stepId);
  }

  /**
   * Get completion percentage
   */
  function getCompletionPercentage() {
    const totalSteps = 8;
    return Math.round((currentCV.completedSteps.length / totalSteps) * 100);
  }

  /**
   * Validate required fields for current step
   */
  function validateFields(fields) {
    const errors = [];
    for (const field of fields) {
      const value = getField(field.key);
      if (!value || (typeof value === 'string' && !value.trim())) {
        errors.push({ field: field.key, message: field.message || `${field.label} is required` });
      }
    }
    return errors;
  }

  /**
   * Subscribe to state changes
   */
  function subscribe(callback) {
    listeners.push(callback);
    // Return unsubscribe function
    return () => {
      listeners = listeners.filter(l => l !== callback);
    };
  }

  /**
   * Notify all listeners of a change
   */
  function notifyListeners(key, value) {
    listeners.forEach(callback => {
      try {
        callback(key, value, getCV());
      } catch (e) {
        console.error('State listener error:', e);
      }
    });
  }

  /**
   * Export CV as JSON string
   */
  function exportJSON() {
    return JSON.stringify(currentCV, null, 2);
  }

  /**
   * Import CV from JSON string
   */
  function importJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      loadCV(data);
      return true;
    } catch (e) {
      console.error('Invalid JSON:', e);
      return false;
    }
  }

  // Public API
  return {
    getCV,
    getField,
    updateField,
    addItem,
    removeItem,
    updateItem,
    resetCV,
    loadCV,
    markStepComplete,
    isStepComplete,
    getCompletionPercentage,
    validateFields,
    subscribe,
    exportJSON,
    importJSON,
    defaultCV
  };
})();