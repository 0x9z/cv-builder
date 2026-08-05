/* ============================================
   Main Application Controller
   Built by 0x9z | MIT License
   ============================================ */

const App = (() => {
  // DOM Elements
  const fieldSelect = document.getElementById('field-select');
  const btnStart = document.getElementById('btn-start');
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');
  const btnSkip = document.getElementById('btn-skip');
  const btnFinish = document.getElementById('btn-finish');
  const btnDownload = document.getElementById('btn-download');
  const btnSave = document.getElementById('btn-save');
  const btnLoad = document.getElementById('btn-load');
  const btnNew = document.getElementById('btn-new');
  const btnZoomIn = document.getElementById('btn-zoom-in');
  const btnZoomOut = document.getElementById('btn-zoom-out');
  const stepIndicator = document.getElementById('step-indicator');
  const progressFill = document.getElementById('progress-fill');
  const progressText = document.getElementById('progress-text');
  const questionTitle = document.getElementById('question-title');
  const questionContent = document.getElementById('question-content');
  const formContainer = document.getElementById('form-container');
  const stepField = document.getElementById('step-field');
  const stepQuestions = document.getElementById('step-questions');
  const stepTemplate = document.getElementById('step-template');

  // State
  let currentStepIndex = 0;
  let currentQuestionIndex = 0;
  let allQuestions = [];
  let isFieldSpecificPhase = false;

  /**
   * Initialize the application
   */
  function init() {
    // Check for saved CV
    checkForSavedCV();

    // Initialize sub-modules
    TemplateEngine.init();
    AIEngine.init();

    // Event listeners
    bindEvents();

    // Subscribe to state changes for live preview
    CVState.subscribe((key, value, cv) => {
      if (key !== 'template' && key !== 'completedSteps') {
        PreviewEngine.render(cv);
      }
    });

    // Start auto-save
    StorageEngine.startAutoSave();

    // Show initial placeholder
    PreviewEngine.showPlaceholder();

    console.log('🚀 CV Builder initialized');
    console.log('📁 Field:', CVState.getField('field') || 'Not selected');
    console.log('💾 Auto-save:', 'Enabled (every 30s)');
  }

  /**
   * Check if a saved CV exists and offer to restore
   */
  function checkForSavedCV() {
    if (StorageEngine.hasSavedCV()) {
      const saveInfo = StorageEngine.getSaveInfo();
      if (saveInfo) {
        const savedDate = new Date(saveInfo.savedAt);
        const dateStr = savedDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        const shouldRestore = confirm(
          `📂 Found a saved CV from ${dateStr}${saveInfo.name ? ` (${saveInfo.name})` : ''}\n\nWould you like to continue where you left off?`
        );

        if (shouldRestore) {
          const data = StorageEngine.loadCV();
          if (data && data.cv) {
            CVState.loadCV(data.cv);
            PreviewEngine.render(CVState.getCV());

            // If field was already selected, jump to questions
            if (data.cv.field) {
              startQuestions();
            }
            return;
          }
        }
      }
    }
  }

  /**
   * Bind all event listeners
   */
  function bindEvents() {
    // Field selection
    if (fieldSelect) {
      fieldSelect.addEventListener('change', () => {
        if (btnStart) btnStart.disabled = !fieldSelect.value;
      });
    }

    // Start button
    if (btnStart) {
      btnStart.addEventListener('click', startQuestions);
    }

    // Navigation buttons
    if (btnPrev) btnPrev.addEventListener('click', prevQuestion);
    if (btnNext) btnNext.addEventListener('click', nextQuestion);
    if (btnSkip) btnSkip.addEventListener('click', skipQuestion);
    if (btnFinish) btnFinish.addEventListener('click', finishAndDownload);

    // Download button
    if (btnDownload) {
      btnDownload.addEventListener('click', () => PDFEngine.exportWithValidation());
    }

    // Save/Load/New buttons
    if (btnSave) btnSave.addEventListener('click', handleSave);
    if (btnLoad) btnLoad.addEventListener('click', handleLoad);
    if (btnNew) btnNew.addEventListener('click', handleNew);

    // Zoom buttons
    if (btnZoomIn) btnZoomIn.addEventListener('click', () => PreviewEngine.zoomIn());
    if (btnZoomOut) btnZoomOut.addEventListener('click', () => PreviewEngine.zoomOut());

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboard);

    // Before unload - remind to save
    window.addEventListener('beforeunload', (e) => {
      const cv = CVState.getCV();
      if (cv.fullName || cv.field) {
        StorageEngine.saveCV();
      }
    });
  }

  /**
   * Handle keyboard shortcuts
   */
  function handleKeyboard(e) {
    // Ctrl+S = Save
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
    // Ctrl+P = Download PDF
    if (e.ctrlKey && e.key === 'p') {
      e.preventDefault();
      PDFEngine.exportWithValidation();
    }
    // Arrow keys for navigation when in questions
    if (stepQuestions.classList.contains('active')) {
      if (e.key === 'ArrowRight' && !e.ctrlKey) {
        e.preventDefault();
        nextQuestion();
      }
      if (e.key === 'ArrowLeft' && !e.ctrlKey) {
        e.preventDefault();
        prevQuestion();
      }
    }
  }

  /**
   * Start the question flow after field selection
   */
  function startQuestions() {
    const field = fieldSelect.value;
    if (!field) {
      alert('⚠️ Please select a field first.');
      return;
    }

    // Save field to state
    CVState.updateField('field', field);
    CVState.markStepComplete('field');

    // Build question list: core questions + field-specific questions
    buildQuestionList(field);

    // Show questions step
    stepField.classList.remove('active');
    stepQuestions.classList.add('active');
    stepTemplate.classList.remove('active');

    // Reset question index
    currentQuestionIndex = 0;
    isFieldSpecificPhase = false;

    // Update progress
    updateProgress();

    // Render first question
    renderQuestion();

    // Update step indicator
    updateStepIndicator('questions');
  }

  /**
   * Build the full question list
   */
  function buildQuestionList(field) {
    allQuestions = [];

    // Core questions from QuestionEngine
    const steps = QuestionEngine.getSteps();
    for (const step of steps) {
      if (step.id === 'field') continue; // Skip field selection

      // Add step header as a "section" marker
      allQuestions.push({
        type: 'section',
        title: step.title,
        stepId: step.id
      });

      // Add step questions
      if (step.questions && step.questions.length > 0) {
        allQuestions.push(...step.questions.map(q => ({ ...q, stepId: step.id })));
      }

      // Add special handling for experience, education, certifications
      if (step.id === 'experience') {
        allQuestions.push({
          type: 'experience',
          label: 'Work Experience',
          stepId: 'experience',
          required: false
        });
      }

      if (step.id === 'education') {
        allQuestions.push({
          type: 'education',
          label: 'Education',
          stepId: 'education',
          required: false
        });
        allQuestions.push({
          type: 'certifications',
          label: 'Certifications',
          stepId: 'education',
          required: false
        });
      }
    }

    // Insert field-specific questions after the links step
    const fieldQuestions = QuestionEngine.getFieldQuestions(field);
    if (fieldQuestions.length > 0) {
      const linksIndex = allQuestions.findIndex(q => q.stepId === 'links');
      const insertIndex = linksIndex + 1;

      // Add field-specific section header
      allQuestions.splice(insertIndex, 0, {
        type: 'section',
        title: `${getFieldDisplayName(field)} Specifics`,
        stepId: 'fieldSpecific'
      });

      // Add field-specific questions
      const fieldQs = fieldQuestions.map(q => ({ ...q, stepId: 'fieldSpecific' }));
      allQuestions.splice(insertIndex + 1, 0, ...fieldQs);
    }

    // Filter out any remaining section headers without questions after them
    allQuestions = allQuestions.filter((q, index) => {
      if (q.type === 'section') {
        const next = allQuestions[index + 1];
        return next && next.type !== 'section';
      }
      return true;
    });
  }

  /**
   * Render the current question
   */
  function renderQuestion() {
    if (!questionContent || !questionTitle) return;

    // Find the current non-section question
    let question = allQuestions[currentQuestionIndex];

    // Skip section headers
    while (question && question.type === 'section') {
      currentQuestionIndex++;
      question = allQuestions[currentQuestionIndex];
    }

    if (!question) {
      // No more questions - show template selection
      showTemplateStep();
      return;
    }

    // Update title
    questionTitle.textContent = question.label || question.title || '';

    // Render based on question type
    switch (question.type) {
      case 'text':
      case 'email':
      case 'tel':
      case 'url':
        renderTextInput(question);
        break;
      case 'textarea':
        renderTextArea(question);
        break;
      case 'select':
        renderSelect(question);
        break;
      case 'multiselect':
        renderMultiSelect(question);
        break;
      case 'experience':
        renderExperienceSection();
        break;
      case 'education':
        renderEducationSection();
        break;
      case 'certifications':
        renderCertificationsSection();
        break;
      case 'languages':
        renderLanguagesSection();
        break;
      default:
        questionContent.innerHTML = '';
    }

    // Update navigation buttons
    updateNavButtons();
    updateProgress();
  }

  /**
   * Render text input
   */
  function renderTextInput(question) {
    const value = CVState.getField(question.stateKey) || '';
    questionContent.innerHTML = `
      <div class="form-group">
        <label class="form-label">${question.label}${question.required ? ' <span style="color:#ff5252;">*</span>' : ''}</label>
        ${question.hint ? `<span class="form-hint">${question.hint}</span>` : ''}
        <input type="${question.type}" class="form-input" id="input-${question.id}" 
               placeholder="${question.placeholder || ''}" value="${escapeAttr(value)}"
               ${question.maxLength ? `maxlength="${question.maxLength}"` : ''}>
        ${question.maxLength ? `<span class="form-hint" style="text-align:right;">${value.length}/${question.maxLength}</span>` : ''}
      </div>`;

    // Add event listener
    const input = document.getElementById(`input-${question.id}`);
    if (input) {
      input.addEventListener('input', () => {
        CVState.updateField(question.stateKey, input.value);
      });
      input.focus();
    }
  }

  /**
   * Render textarea
   */
  function renderTextArea(question) {
    const value = CVState.getField(question.stateKey) || '';
    questionContent.innerHTML = `
      <div class="form-group">
        <label class="form-label">${question.label}${question.required ? ' <span style="color:#ff5252;">*</span>' : ''}</label>
        ${question.hint ? `<span class="form-hint">${question.hint}</span>` : ''}
        <textarea class="form-textarea" id="input-${question.id}" 
                  placeholder="${question.placeholder || ''}" rows="5"
                  ${question.maxLength ? `maxlength="${question.maxLength}"` : ''}>${escapeHTML(value)}</textarea>
        ${question.maxLength ? `<span class="form-hint" style="text-align:right;">${value.length}/${question.maxLength}</span>` : ''}
        <button class="btn btn-sm btn-enhance" id="btn-enhance-${question.id}" style="margin-top:0.5rem;background:rgba(124,58,237,0.2);border:1px solid rgba(124,58,237,0.4);color:#c4b5fd;font-size:0.75rem;padding:0.3rem 0.7rem;border-radius:0.5rem;cursor:pointer;">✨ Enhance with AI</button>
      </div>`;

    const textarea = document.getElementById(`input-${question.id}`);
    const enhanceBtn = document.getElementById(`btn-enhance-${question.id}`);

    if (textarea) {
      textarea.addEventListener('input', () => {
        CVState.updateField(question.stateKey, textarea.value);
      });
      textarea.focus();
    }

    if (enhanceBtn) {
      enhanceBtn.addEventListener('click', () => {
        const field = CVState.getField('field');
        AIEngine.enhance(textarea.value, field, (enhancedText) => {
          if (enhancedText) {
            textarea.value = enhancedText;
            CVState.updateField(question.stateKey, enhancedText);
          }
        });
      });
    }
  }

  /**
   * Render select dropdown
   */
  function renderSelect(question) {
    const value = CVState.getField(question.stateKey) || '';
    const options = question.options || [];
    questionContent.innerHTML = `
      <div class="form-group">
        <label class="form-label">${question.label}${question.required ? ' <span style="color:#ff5252;">*</span>' : ''}</label>
        <select class="form-select" id="input-${question.id}">
          ${options.map(opt => `<option value="${escapeAttr(opt)}" ${value === opt ? 'selected' : ''}>${opt || '-- Select --'}</option>`).join('')}
        </select>
      </div>`;

    const select = document.getElementById(`input-${question.id}`);
    if (select) {
      select.addEventListener('change', () => {
        CVState.updateField(question.stateKey, select.value);
      });
      select.focus();
    }
  }

  /**
   * Render multi-select (tags input)
   */
  function renderMultiSelect(question) {
    const values = CVState.getField(question.stateKey) || [];
    const suggestions = QuestionEngine.getSkillSuggestions(CVState.getField('field'));

    questionContent.innerHTML = `
      <div class="form-group">
        <label class="form-label">${question.label}${question.required ? ' <span style="color:#ff5252;">*</span>' : ''}</label>
        ${question.hint ? `<span class="form-hint">${question.hint}</span>` : ''}
        <div class="multiselect-container" id="multiselect-${question.id}">
          <div class="tags-display" id="tags-${question.id}">
            ${values.map((v, i) => `
              <span class="badge-sm" style="display:inline-flex;align-items:center;gap:0.3rem;cursor:default;">
                ${escapeHTML(v)}
                <span style="cursor:pointer;color:#ff5252;" data-index="${i}">×</span>
              </span>
            `).join('')}
          </div>
          <input type="text" class="form-input" id="input-${question.id}" 
                 placeholder="${question.placeholder || 'Type and press Enter to add'}"
                 style="margin-top:0.5rem;">
        </div>
        ${suggestions.length > 0 ? `
          <div style="margin-top:0.5rem;">
            <span class="form-hint" style="margin-bottom:0.3rem;">Suggestions (click to add):</span>
            <div style="display:flex;flex-wrap:wrap;gap:0.3rem;">
              ${suggestions.filter(s => !values.includes(s)).slice(0, 10).map(s => `
                <span class="badge-sm suggestion-tag" data-value="${escapeAttr(s)}" style="cursor:pointer;opacity:0.6;">${escapeHTML(s)} +</span>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>`;

    const input = document.getElementById(`input-${question.id}`);

    // Add tag on Enter or comma
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ',') {
          e.preventDefault();
          const newValue = input.value.trim().replace(/,/g, '');
          if (newValue && !values.includes(newValue)) {
            values.push(newValue);
            CVState.updateField(question.stateKey, values);
            renderQuestion(); // Re-render
          }
          input.value = '';
        }
        // Remove last tag on Backspace when input is empty
        if (e.key === 'Backspace' && !input.value && values.length > 0) {
          values.pop();
          CVState.updateField(question.stateKey, values);
          renderQuestion();
        }
      });
      input.focus();
    }

    // Remove tag clicks
    const tagsDisplay = document.getElementById(`tags-${question.id}`);
    if (tagsDisplay) {
      tagsDisplay.addEventListener('click', (e) => {
        if (e.target.dataset.index !== undefined) {
          const index = parseInt(e.target.dataset.index);
          values.splice(index, 1);
          CVState.updateField(question.stateKey, values);
          renderQuestion();
        }
      });
    }

    // Suggestion clicks
    document.querySelectorAll('.suggestion-tag').forEach(tag => {
      tag.addEventListener('click', () => {
        const val = tag.dataset.value;
        if (val && !values.includes(val)) {
          values.push(val);
          CVState.updateField(question.stateKey, values);
          renderQuestion();
        }
      });
    });
  }

  /**
   * Render experience repeat section
   */
  function renderExperienceSection() {
    const experiences = CVState.getField('experience') || [];

    questionContent.innerHTML = `
      <div class="form-group">
        <label class="form-label">Work Experience</label>
        <div id="experience-list">
          ${experiences.map((exp, index) => `
            <div class="repeat-item" data-index="${index}">
              <div class="repeat-item-header">
                <span class="repeat-item-title">${exp.title || 'New Position'}</span>
                <button class="btn-remove" data-index="${index}">✕ Remove</button>
              </div>
              <input type="text" class="form-input exp-title" placeholder="Job Title" value="${escapeAttr(exp.title)}" data-index="${index}" data-field="title">
              <input type="text" class="form-input exp-company" placeholder="Company" value="${escapeAttr(exp.company)}" data-index="${index}" data-field="company">
              <input type="text" class="form-input exp-location" placeholder="Location" value="${escapeAttr(exp.location)}" data-index="${index}" data-field="location">
              <div style="display:flex;gap:0.5rem;">
                <input type="month" class="form-input exp-start" value="${exp.startDate || ''}" data-index="${index}" data-field="startDate" style="flex:1;">
                <input type="month" class="form-input exp-end" value="${exp.endDate || ''}" data-index="${index}" data-field="endDate" style="flex:1;" ${exp.current ? 'disabled' : ''}>
              </div>
              <label style="font-size:0.8rem;color:var(--text-dim);display:flex;align-items:center;gap:0.3rem;margin-top:0.3rem;">
                <input type="checkbox" class="exp-current" data-index="${index}" ${exp.current ? 'checked' : ''}> Currently working here
              </label>
              <div class="exp-bullets" data-index="${index}" style="margin-top:0.5rem;">
                ${(exp.bullets || ['']).map((b, bi) => `
                  <div style="display:flex;gap:0.3rem;margin-bottom:0.3rem;">
                    <input type="text" class="form-input exp-bullet" placeholder="Bullet point..." value="${escapeAttr(b)}" data-index="${index}" data-bullet="${bi}" style="flex:1;">
                    <button class="btn-remove btn-remove-bullet" data-index="${index}" data-bullet="${bi}" style="flex-shrink:0;">✕</button>
                  </div>
                `).join('')}
                <button class="btn-add btn-add-bullet" data-index="${index}" style="margin-top:0.3rem;font-size:0.75rem;">+ Add Bullet Point</button>
              </div>
            </div>
          `).join('')}
        </div>
        <button class="btn-add" id="btn-add-experience" style="margin-top:0.8rem;">+ Add Another Position</button>
      </div>`;

    // Bind experience events
    bindExperienceEvents(experiences);
  }

  /**
   * Bind experience section events
   */
  function bindExperienceEvents(experiences) {
    // Add experience
    const btnAdd = document.getElementById('btn-add-experience');
    if (btnAdd) {
      btnAdd.addEventListener('click', () => {
        const newExp = QuestionEngine.getExperienceTemplate();
        experiences.push(newExp);
        CVState.updateField('experience', experiences);
        renderQuestion();
      });
    }

    // Remove experience
    document.querySelectorAll('.btn-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index);
        if (index >= 0 && index < experiences.length) {
          experiences.splice(index, 1);
          CVState.updateField('experience', experiences);
          renderQuestion();
        }
      });
    });

    // Update fields
    document.querySelectorAll('.exp-title, .exp-company, .exp-location, .exp-start, .exp-end').forEach(input => {
      input.addEventListener('input', () => {
        const index = parseInt(input.dataset.index);
        const field = input.dataset.field;
        if (index >= 0 && index < experiences.length) {
          experiences[index][field] = input.value;
          CVState.updateField('experience', experiences);
        }
      });
    });

    // Current job checkbox
    document.querySelectorAll('.exp-current').forEach(cb => {
      cb.addEventListener('change', () => {
        const index = parseInt(cb.dataset.index);
        if (index >= 0 && index < experiences.length) {
          experiences[index].current = cb.checked;
          if (cb.checked) {
            experiences[index].endDate = '';
          }
          CVState.updateField('experience', experiences);
          renderQuestion();
        }
      });
    });

    // Bullet points
    document.querySelectorAll('.exp-bullet').forEach(input => {
      input.addEventListener('input', () => {
        const index = parseInt(input.dataset.index);
        const bulletIndex = parseInt(input.dataset.bullet);
        if (index >= 0 && index < experiences.length && experiences[index].bullets) {
          experiences[index].bullets[bulletIndex] = input.value;
          CVState.updateField('experience', experiences);
        }
      });
    });

    // Remove bullet
    document.querySelectorAll('.btn-remove-bullet').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index);
        const bulletIndex = parseInt(btn.dataset.bullet);
        if (index >= 0 && index < experiences.length && experiences[index].bullets) {
          experiences[index].bullets.splice(bulletIndex, 1);
          if (experiences[index].bullets.length === 0) {
            experiences[index].bullets = [''];
          }
          CVState.updateField('experience', experiences);
          renderQuestion();
        }
      });
    });

    // Add bullet
    document.querySelectorAll('.btn-add-bullet').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index);
        if (index >= 0 && index < experiences.length) {
          if (!experiences[index].bullets) experiences[index].bullets = [];
          experiences[index].bullets.push('');
          CVState.updateField('experience', experiences);
          renderQuestion();
        }
      });
    });
  }

  /**
   * Render education repeat section
   */
  function renderEducationSection() {
    const education = CVState.getField('education') || [];

    questionContent.innerHTML = `
      <div class="form-group">
        <label class="form-label">Education</label>
        <div id="education-list">
          ${education.map((edu, index) => `
            <div class="repeat-item" data-index="${index}">
              <div class="repeat-item-header">
                <span class="repeat-item-title">${edu.degree || 'New Education'}</span>
                <button class="btn-remove-edu" data-index="${index}" style="background:transparent;border:1px solid var(--border);color:#ff5252;cursor:pointer;font-size:0.75rem;padding:0.25rem 0.6rem;border-radius:0.5rem;">✕ Remove</button>
              </div>
              <input type="text" class="form-input edu-degree" placeholder="Degree / Diploma" value="${escapeAttr(edu.degree)}" data-index="${index}" data-field="degree">
              <input type="text" class="form-input edu-field" placeholder="Field of Study" value="${escapeAttr(edu.field)}" data-index="${index}" data-field="field">
              <input type="text" class="form-input edu-school" placeholder="School / Institution" value="${escapeAttr(edu.school)}" data-index="${index}" data-field="school">
              <div style="display:flex;gap:0.5rem;">
                <input type="month" class="form-input edu-start" value="${edu.startDate || ''}" data-index="${index}" data-field="startDate" style="flex:1;" placeholder="Start Date">
                <input type="month" class="form-input edu-end" value="${edu.endDate || ''}" data-index="${index}" data-field="endDate" style="flex:1;" placeholder="End Date">
              </div>
            </div>
          `).join('')}
        </div>
        <button class="btn-add" id="btn-add-education" style="margin-top:0.8rem;">+ Add Another Education</button>
      </div>`;

    bindEducationEvents(education);
  }

  /**
   * Bind education section events
   */
  function bindEducationEvents(education) {
    document.getElementById('btn-add-education')?.addEventListener('click', () => {
      education.push(QuestionEngine.getEducationTemplate());
      CVState.updateField('education', education);
      renderQuestion();
    });

    document.querySelectorAll('.btn-remove-edu').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index);
        education.splice(index, 1);
        CVState.updateField('education', education);
        renderQuestion();
      });
    });

    document.querySelectorAll('.edu-degree, .edu-field, .edu-school, .edu-start, .edu-end').forEach(input => {
      input.addEventListener('input', () => {
        const index = parseInt(input.dataset.index);
        const field = input.dataset.field;
        if (index >= 0 && index < education.length) {
          education[index][field] = input.value;
          CVState.updateField('education', education);
        }
      });
    });
  }

  /**
   * Render certifications repeat section
   */
  function renderCertificationsSection() {
    const certifications = CVState.getField('certifications') || [];

    questionContent.innerHTML = `
      <div class="form-group">
        <label class="form-label">Certifications</label>
        <div id="certifications-list">
          ${certifications.map((cert, index) => `
            <div class="repeat-item" data-index="${index}">
              <div class="repeat-item-header">
                <span class="repeat-item-title">${cert.name || 'New Certification'}</span>
                <button class="btn-remove-cert" data-index="${index}" style="background:transparent;border:1px solid var(--border);color:#ff5252;cursor:pointer;font-size:0.75rem;padding:0.25rem 0.6rem;border-radius:0.5rem;">✕ Remove</button>
              </div>
              <input type="text" class="form-input cert-name" placeholder="Certification Name" value="${escapeAttr(cert.name)}" data-index="${index}" data-field="name">
              <input type="text" class="form-input cert-issuer" placeholder="Issuing Organization" value="${escapeAttr(cert.issuer)}" data-index="${index}" data-field="issuer">
              <input type="month" class="form-input cert-date" value="${cert.date || ''}" data-index="${index}" data-field="date" placeholder="Date Issued">
            </div>
          `).join('')}
        </div>
        <button class="btn-add" id="btn-add-certification" style="margin-top:0.8rem;">+ Add Certification</button>
      </div>`;

    bindCertificationsEvents(certifications);
  }

  /**
   * Bind certifications section events
   */
  function bindCertificationsEvents(certifications) {
    document.getElementById('btn-add-certification')?.addEventListener('click', () => {
      certifications.push(QuestionEngine.getCertificationTemplate());
      CVState.updateField('certifications', certifications);
      renderQuestion();
    });

    document.querySelectorAll('.btn-remove-cert').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index);
        certifications.splice(index, 1);
        CVState.updateField('certifications', certifications);
        renderQuestion();
      });
    });

    document.querySelectorAll('.cert-name, .cert-issuer, .cert-date').forEach(input => {
      input.addEventListener('input', () => {
        const index = parseInt(input.dataset.index);
        const field = input.dataset.field;
        if (index >= 0 && index < certifications.length) {
          certifications[index][field] = input.value;
          CVState.updateField('certifications', certifications);
        }
      });
    });
  }

  /**
   * Render languages section
   */
  function renderLanguagesSection() {
    const languages = CVState.getField('languages') || [];
    const levels = ['Native', 'Fluent', 'Advanced', 'Intermediate', 'Basic'];

    questionContent.innerHTML = `
      <div class="form-group">
        <label class="form-label">Languages</label>
        <div id="languages-list">
          ${languages.map((lang, index) => `
            <div class="repeat-item" data-index="${index}">
              <div style="display:flex;gap:0.5rem;align-items:center;">
                <input type="text" class="form-input lang-name" placeholder="Language" value="${escapeAttr(lang.language)}" data-index="${index}" style="flex:1;">
                <select class="form-select lang-level" data-index="${index}" style="flex:1;">
                  ${levels.map(l => `<option value="${l}" ${lang.level === l ? 'selected' : ''}>${l}</option>`).join('')}
                </select>
                <button class="btn-remove-lang" data-index="${index}" style="background:transparent;border:1px solid var(--border);color:#ff5252;cursor:pointer;font-size:0.75rem;padding:0.4rem 0.6rem;border-radius:0.5rem;flex-shrink:0;">✕</button>
              </div>
            </div>
          `).join('')}
        </div>
        <button class="btn-add" id="btn-add-language" style="margin-top:0.8rem;">+ Add Language</button>
      </div>`;

    bindLanguagesEvents(languages);
  }

  /**
   * Bind languages section events
   */
  function bindLanguagesEvents(languages) {
    document.getElementById('btn-add-language')?.addEventListener('click', () => {
      languages.push(QuestionEngine.getLanguageTemplate());
      CVState.updateField('languages', languages);
      renderQuestion();
    });

    document.querySelectorAll('.btn-remove-lang').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index);
        languages.splice(index, 1);
        CVState.updateField('languages', languages);
        renderQuestion();
      });
    });

    document.querySelectorAll('.lang-name').forEach(input => {
      input.addEventListener('input', () => {
        const index = parseInt(input.dataset.index);
        if (index >= 0 && index < languages.length) {
          languages[index].language = input.value;
          CVState.updateField('languages', languages);
        }
      });
    });

    document.querySelectorAll('.lang-level').forEach(select => {
      select.addEventListener('change', () => {
        const index = parseInt(select.dataset.index);
        if (index >= 0 && index < languages.length) {
          languages[index].level = select.value;
          CVState.updateField('languages', languages);
        }
      });
    });
  }

  /**
   * Show template selection step
   */
  function showTemplateStep() {
    stepQuestions.classList.remove('active');
    stepTemplate.classList.add('active');

    // Auto-select recommended template
    const field = CVState.getField('field');
    const recommended = TemplateEngine.getRecommendedTemplate(field);
    TemplateEngine.selectTemplate(recommended);

    updateStepIndicator('template');
  }

  /**
   * Finish and download
   */
  function finishAndDownload() {
    CVState.markStepComplete('template');
    PDFEngine.exportWithValidation();
  }

  /**
   * Next question
   */
  function nextQuestion() {
    // Validate current question if it's required
    const question = allQuestions[currentQuestionIndex];
    if (question && question.required && question.stateKey) {
      const value = CVState.getField(question.stateKey);
      if (!value || (typeof value === 'string' && !value.trim()) || (Array.isArray(value) && value.length === 0)) {
        alert(`⚠️ Please fill in "${question.label}" before continuing.`);
        return;
      }
    }

    // Mark current step as complete
    if (question && question.stepId) {
      CVState.markStepComplete(question.stepId);
    }

    currentQuestionIndex++;

    // Skip section headers
    while (allQuestions[currentQuestionIndex] && allQuestions[currentQuestionIndex].type === 'section') {
      currentQuestionIndex++;
    }

    if (currentQuestionIndex >= allQuestions.length) {
      showTemplateStep();
    } else {
      renderQuestion();
    }
  }

  /**
   * Previous question
   */
  function prevQuestion() {
    currentQuestionIndex--;

    // Skip section headers going backwards
    while (currentQuestionIndex >= 0 && allQuestions[currentQuestionIndex]?.type === 'section') {
      currentQuestionIndex--;
    }

    if (currentQuestionIndex < 0) {
      currentQuestionIndex = 0;
    }

    renderQuestion();
  }

  /**
   * Skip current question
   */
  function skipQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex >= allQuestions.length) {
      showTemplateStep();
    } else {
      renderQuestion();
    }
  }

  /**
   * Update navigation buttons visibility
   */
  function updateNavButtons() {
    if (btnPrev) btnPrev.style.display = currentQuestionIndex > 0 ? 'inline-flex' : 'none';
    if (btnNext) btnNext.style.display = 'inline-flex';
    if (btnSkip) btnSkip.style.display = 'inline-flex';
  }

  /**
   * Update progress bar
   */
  function updateProgress() {
    const total = allQuestions.filter(q => q.type !== 'section').length;
    if (total === 0) return;

    const progress = Math.round((currentQuestionIndex / total) * 100);
    if (progressFill) progressFill.style.width = `${Math.min(progress, 100)}%`;
    if (progressText) progressText.textContent = `Question ${currentQuestionIndex + 1} of ${total}`;
  }

  /**
   * Update step indicator in header
   */
  function updateStepIndicator(phase) {
    const labels = {
      'field': 'Step 1 of 3',
      'questions': 'Step 2 of 3 — Building CV',
      'template': 'Step 3 of 3 — Choose Template'
    };
    if (stepIndicator) stepIndicator.textContent = labels[phase] || '';
  }

  /**
   * Handle save button
   */
  function handleSave() {
    const success = StorageEngine.saveCV();
    if (success) {
      // Brief visual feedback
      if (btnSave) {
        const originalText = btnSave.innerHTML;
        btnSave.innerHTML = '✅ Saved!';
        btnSave.style.color = '#00e676';
        setTimeout(() => {
          btnSave.innerHTML = originalText;
          btnSave.style.color = '';
        }, 2000);
      }
    } else {
      alert('⚠️ Failed to save. Please try again.');
    }
  }

  /**
   * Handle load button
   */
  function handleLoad() {
    if (!StorageEngine.hasSavedCV()) {
      alert('📂 No saved CV found.');
      return;
    }

    const saveInfo = StorageEngine.getSaveInfo();
    const confirmLoad = confirm(
      `📂 Load saved CV?\n\nSaved: ${saveInfo ? new Date(saveInfo.savedAt).toLocaleString() : 'Unknown'}\nName: ${saveInfo?.name || 'Unnamed'}\n\nThis will replace your current progress.`
    );

    if (confirmLoad) {
      const data = StorageEngine.loadCV();
      if (data && data.cv) {
        CVState.loadCV(data.cv);
        PreviewEngine.render(CVState.getCV());

        if (data.cv.field) {
          buildQuestionList(data.cv.field);
          stepField.classList.remove('active');
          stepQuestions.classList.add('active');
          stepTemplate.classList.remove('active');
          currentQuestionIndex = 0;
          renderQuestion();
          updateStepIndicator('questions');
        }
        alert('✅ CV loaded successfully!');
      }
    }
  }

  /**
   * Handle new CV button
   */
  function handleNew() {
    const cv = CVState.getCV();
    if (cv.fullName || cv.field) {
      const confirmNew = confirm('⚠️ Start a new CV? Any unsaved progress will be lost.\n\nWe recommend saving your current CV first.');
      if (!confirmNew) return;
    }

    CVState.resetCV();
    PreviewEngine.showPlaceholder();
    stepField.classList.add('active');
    stepQuestions.classList.remove('active');
    stepTemplate.classList.remove('active');
    currentQuestionIndex = 0;
    allQuestions = [];
    if (fieldSelect) fieldSelect.value = '';
    if (btnStart) btnStart.disabled = true;
    updateStepIndicator('field');
  }

  /**
   * Helper: Escape HTML
   */
  function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Helper: Escape attribute value
   */
  function escapeAttr(str) {
    if (!str) return '';
    return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /**
   * Helper: Get display name for field
   */
  function getFieldDisplayName(field) {
    const names = {
      it: 'IT & Technology',
      nursing: 'Nursing & Healthcare',
      hr: 'Human Resources',
      driving: 'Driving & Transport',
      construction: 'Construction & Trades',
      finance: 'Finance & Accounting',
      education: 'Education & Teaching',
      sales: 'Sales & Marketing'
    };
    return names[field] || field;
  }

  // Public API
  return {
    init
  };
})();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});