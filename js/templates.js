/* ============================================
   Template Switcher
   Built by 0x9z | MIT License
   ============================================ */

const TemplateEngine = (() => {
  const templateCards = document.querySelectorAll('.template-card');
  let currentTemplate = 'classic';

  /**
   * Initialize template selection UI
   */
  function init() {
    if (!templateCards || templateCards.length === 0) return;

    templateCards.forEach(card => {
      card.addEventListener('click', () => {
        const template = card.dataset.template;
        if (template) {
          selectTemplate(template);
        }
      });
    });

    // Set initial active template from state
    const cv = CVState.getCV();
    if (cv.template) {
      selectTemplate(cv.template);
    }
  }

  /**
   * Select a template
   */
  function selectTemplate(templateName) {
    currentTemplate = templateName;

    // Update UI
    templateCards.forEach(card => {
      if (card.dataset.template === templateName) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });

    // Update state
    CVState.updateField('template', templateName);

    // Re-render preview
    const cv = CVState.getCV();
    PreviewEngine.render(cv);
  }

  /**
   * Get current template name
   */
  function getCurrentTemplate() {
    return currentTemplate;
  }

  /**
   * Get template display name
   */
  function getTemplateDisplayName(templateName) {
    const names = {
      classic: 'Classic',
      modern: 'Modern',
      minimal: 'Minimal'
    };
    return names[templateName] || templateName;
  }

  /**
   * Get list of available templates
   */
  function getAvailableTemplates() {
    return [
      {
        id: 'classic',
        name: 'Classic',
        description: 'Traditional layout with serif fonts. Best for corporate, finance, and law.',
        previewClass: 'classic-preview'
      },
      {
        id: 'modern',
        name: 'Modern',
        description: 'Two-column layout with sidebar. Best for IT, design, and marketing.',
        previewClass: 'modern-preview'
      },
      {
        id: 'minimal',
        name: 'Minimal',
        description: 'Clean whitespace with modern fonts. Best for creative fields and freelancers.',
        previewClass: 'minimal-preview'
      }
    ];
  }

  /**
   * Get recommended template for a field
   */
  function getRecommendedTemplate(field) {
    const recommendations = {
      it: 'modern',
      nursing: 'classic',
      hr: 'modern',
      driving: 'classic',
      construction: 'classic',
      finance: 'classic',
      education: 'minimal',
      sales: 'modern'
    };
    return recommendations[field] || 'classic';
  }

  // Public API
  return {
    init,
    selectTemplate,
    getCurrentTemplate,
    getTemplateDisplayName,
    getAvailableTemplates,
    getRecommendedTemplate
  };
})();