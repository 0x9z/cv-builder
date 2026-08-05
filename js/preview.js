/* ============================================
   Live CV Preview Renderer
   Built by 0x9z | MIT License
   ============================================ */

const PreviewEngine = (() => {
  const previewEl = document.getElementById('cv-preview');
  const zoomLevelEl = document.getElementById('zoom-level');
  let currentZoom = 100;

  /**
   * Escape HTML to prevent XSS
   */
  function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Format date to readable string
   */
  function formatDate(dateStr) {
    if (!dateStr) return '';
    const [year, month] = dateStr.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    if (month) {
      return `${months[parseInt(month) - 1]} ${year}`;
    }
    return year;
  }

  /**
   * Build contact row HTML
   */
  function buildContactRow(cv) {
    const items = [];
    if (cv.email) items.push(`<span class="cv-contact-item">📧 ${escapeHTML(cv.email)}</span>`);
    if (cv.phone) items.push(`<span class="cv-contact-item">📞 ${escapeHTML(cv.phone)}</span>`);
    if (cv.location) items.push(`<span class="cv-contact-item">📍 ${escapeHTML(cv.location)}</span>`);
    if (cv.linkedin) items.push(`<span class="cv-contact-item">🔗 ${escapeHTML(cv.linkedin)}</span>`);
    if (cv.github) items.push(`<span class="cv-contact-item">🐙 ${escapeHTML(cv.github)}</span>`);
    if (cv.website) items.push(`<span class="cv-contact-item">🌐 ${escapeHTML(cv.website)}</span>`);
    return items.length > 0 ? `<div class="cv-contact-row">${items.join('')}</div>` : '';
  }

  /**
   * Build skills HTML
   */
  function buildSkills(skills) {
    if (!skills || skills.length === 0) return '';
    const tags = skills.map(s => `<span class="cv-skill-tag">${escapeHTML(s)}</span>`).join('');
    return `<ul class="cv-skills-list">${tags}</ul>`;
  }

  /**
   * Build experience section
   */
  function buildExperience(experience) {
    if (!experience || experience.length === 0) return '';
    return experience.map(exp => {
      const dateRange = exp.current
        ? `${formatDate(exp.startDate)} — Present`
        : `${formatDate(exp.startDate)} — ${formatDate(exp.endDate)}`;
      const bullets = (exp.bullets && exp.bullets.length > 0 && exp.bullets[0] !== '')
        ? `<ul class="cv-entry-bullets">${exp.bullets.filter(b => b.trim()).map(b => `<li>${escapeHTML(b)}</li>`).join('')}</ul>`
        : '';
      return `
        <div class="cv-entry">
          <div class="cv-entry-header">
            <span class="cv-entry-title">${escapeHTML(exp.title)}</span>
            <span class="cv-entry-date">${dateRange}</span>
          </div>
          <div class="cv-entry-subtitle">${escapeHTML(exp.company)}${exp.location ? ` — ${escapeHTML(exp.location)}` : ''}</div>
          ${bullets}
        </div>`;
    }).join('');
  }

  /**
   * Build education section
   */
  function buildEducation(education) {
    if (!education || education.length === 0) return '';
    return education.map(edu => {
      const dateRange = `${formatDate(edu.startDate)} — ${formatDate(edu.endDate)}`;
      return `
        <div class="cv-entry">
          <div class="cv-entry-header">
            <span class="cv-entry-title">${escapeHTML(edu.degree)}</span>
            <span class="cv-entry-date">${dateRange}</span>
          </div>
          <div class="cv-entry-subtitle">${escapeHTML(edu.school)}${edu.field ? ` — ${escapeHTML(edu.field)}` : ''}</div>
        </div>`;
    }).join('');
  }

  /**
   * Build certifications section
   */
  function buildCertifications(certifications) {
    if (!certifications || certifications.length === 0) return '';
    return certifications.map(cert => `
      <div class="cv-cert-item">
        <span class="cv-cert-name">${escapeHTML(cert.name)}</span>
        <span>
          <span class="cv-cert-issuer">${escapeHTML(cert.issuer)}</span>
          ${cert.date ? `<span class="cv-cert-date"> — ${formatDate(cert.date)}</span>` : ''}
        </span>
      </div>
    `).join('');
  }

  /**
   * Build languages section
   */
  function buildLanguages(languages) {
    if (!languages || languages.length === 0) return '';
    return languages.map(lang => `
      <li class="cv-lang-item">
        <span>${escapeHTML(lang.language)}</span>
        <span class="cv-lang-level">(${escapeHTML(lang.level)})</span>
      </li>
    `).join('');
  }

  /**
   * Build field-specific section
   */
  function buildFieldSpecific(cv) {
    if (!cv.fieldSpecific || Object.keys(cv.fieldSpecific).length === 0) return '';
    
    const items = [];
    const fs = cv.fieldSpecific;
    
    // Tech stack (IT)
    if (fs.techStack && fs.techStack.length > 0) {
      items.push(`<div class="cv-entry"><strong>Tech Stack:</strong> ${fs.techStack.map(s => escapeHTML(s)).join(', ')}</div>`);
    }
    if (fs.operatingSystems && fs.operatingSystems.length > 0) {
      items.push(`<div class="cv-entry"><strong>Operating Systems:</strong> ${fs.operatingSystems.map(s => escapeHTML(s)).join(', ')}</div>`);
    }
    if (fs.cloudPlatforms && fs.cloudPlatforms.length > 0) {
      items.push(`<div class="cv-entry"><strong>Cloud Platforms:</strong> ${fs.cloudPlatforms.map(s => escapeHTML(s)).join(', ')}</div>`);
    }
    if (fs.homelab) {
      items.push(`<div class="cv-entry"><strong>Homelab:</strong> ${escapeHTML(fs.homelab)}</div>`);
    }
    
    // Nursing
    if (fs.registrationNumber) {
      items.push(`<div class="cv-entry"><strong>Registration:</strong> ${escapeHTML(fs.registrationNumber)}</div>`);
    }
    if (fs.specializations && fs.specializations.length > 0) {
      items.push(`<div class="cv-entry"><strong>Specializations:</strong> ${fs.specializations.map(s => escapeHTML(s)).join(', ')}</div>`);
    }
    if (fs.clinicalHours) {
      items.push(`<div class="cv-entry"><strong>Clinical Hours:</strong> ${escapeHTML(String(fs.clinicalHours))}</div>`);
    }
    
    // Driving
    if (fs.licenseClass) {
      items.push(`<div class="cv-entry"><strong>License:</strong> ${escapeHTML(fs.licenseClass)}</div>`);
    }
    if (fs.yearsExperience) {
      items.push(`<div class="cv-entry"><strong>Experience:</strong> ${escapeHTML(String(fs.yearsExperience))} years</div>`);
    }
    if (fs.vehicleTypes && fs.vehicleTypes.length > 0) {
      items.push(`<div class="cv-entry"><strong>Vehicles:</strong> ${fs.vehicleTypes.map(s => escapeHTML(s)).join(', ')}</div>`);
    }
    
    // HR
    if (fs.hrisSystems && fs.hrisSystems.length > 0) {
      items.push(`<div class="cv-entry"><strong>HRIS:</strong> ${fs.hrisSystems.map(s => escapeHTML(s)).join(', ')}</div>`);
    }
    if (fs.employeesSupported) {
      items.push(`<div class="cv-entry"><strong>Employees Supported:</strong> ${escapeHTML(fs.employeesSupported)}</div>`);
    }
    
    // Construction
    if (fs.tickets && fs.tickets.length > 0) {
      items.push(`<div class="cv-entry"><strong>Tickets:</strong> ${fs.tickets.map(s => escapeHTML(s)).join(', ')}</div>`);
    }
    if (fs.machinery && fs.machinery.length > 0) {
      items.push(`<div class="cv-entry"><strong>Machinery:</strong> ${fs.machinery.map(s => escapeHTML(s)).join(', ')}</div>`);
    }
    
    // Finance
    if (fs.software && fs.software.length > 0) {
      items.push(`<div class="cv-entry"><strong>Software:</strong> ${fs.software.map(s => escapeHTML(s)).join(', ')}</div>`);
    }
    if (fs.budgetManaged) {
      items.push(`<div class="cv-entry"><strong>Budget Managed:</strong> ${escapeHTML(fs.budgetManaged)}</div>`);
    }
    
    // Education
    if (fs.subjects && fs.subjects.length > 0) {
      items.push(`<div class="cv-entry"><strong>Subjects:</strong> ${fs.subjects.map(s => escapeHTML(s)).join(', ')}</div>`);
    }
    if (fs.ageGroups && fs.ageGroups.length > 0) {
      items.push(`<div class="cv-entry"><strong>Age Groups:</strong> ${fs.ageGroups.map(s => escapeHTML(s)).join(', ')}</div>`);
    }
    
    // Sales
    if (fs.crmSystems && fs.crmSystems.length > 0) {
      items.push(`<div class="cv-entry"><strong>CRM:</strong> ${fs.crmSystems.map(s => escapeHTML(s)).join(', ')}</div>`);
    }
    if (fs.quotaAchievement) {
      items.push(`<div class="cv-entry"><strong>Quota Achievement:</strong> ${escapeHTML(fs.quotaAchievement)}</div>`);
    }
    
    if (items.length === 0) return '';
    return `
      <div class="cv-section">
        <div class="cv-section-title">Field-Specific Details</div>
        ${items.join('')}
      </div>`;
  }

  /**
   * Build the Classic template
   */
  function buildClassicTemplate(cv) {
    return `
      <div class="template-classic">
        <div class="cv-content">
          <div class="cv-header">
            <div class="cv-name">${escapeHTML(cv.fullName) || 'Your Name'}</div>
            <div class="cv-title-line">${escapeHTML(cv.fieldSpecific?.title) || ''}</div>
            ${buildContactRow(cv)}
          </div>
          ${cv.summary ? `<div class="cv-section"><div class="cv-section-title">Professional Summary</div><div class="cv-summary">${escapeHTML(cv.summary)}</div></div>` : ''}
          ${cv.skills && cv.skills.length > 0 ? `<div class="cv-section"><div class="cv-section-title">Skills</div>${buildSkills(cv.skills)}</div>` : ''}
          ${cv.experience && cv.experience.length > 0 ? `<div class="cv-section"><div class="cv-section-title">Work Experience</div>${buildExperience(cv.experience)}</div>` : ''}
          ${cv.education && cv.education.length > 0 ? `<div class="cv-section"><div class="cv-section-title">Education</div>${buildEducation(cv.education)}</div>` : ''}
          ${cv.certifications && cv.certifications.length > 0 ? `<div class="cv-section"><div class="cv-section-title">Certifications</div>${buildCertifications(cv.certifications)}</div>` : ''}
          ${buildFieldSpecific(cv)}
          ${cv.languages && cv.languages.length > 0 ? `<div class="cv-section"><div class="cv-section-title">Languages</div><ul class="cv-lang-list">${buildLanguages(cv.languages)}</ul></div>` : ''}
        </div>
      </div>`;
  }

  /**
   * Build the Modern template
   */
  function buildModernTemplate(cv) {
    return `
      <div class="template-modern">
        <div class="cv-content">
          <div class="cv-sidebar">
            <div class="cv-name">${escapeHTML(cv.fullName) || 'Your Name'}</div>
            <div class="cv-title-line">${escapeHTML(cv.fieldSpecific?.title) || ''}</div>
            ${cv.email || cv.phone || cv.location ? `
              <div class="cv-section">
                <div class="cv-section-title">Contact</div>
                <div class="cv-contact-row">
                  ${cv.email ? `<span class="cv-contact-item">${escapeHTML(cv.email)}</span>` : ''}
                  ${cv.phone ? `<span class="cv-contact-item">${escapeHTML(cv.phone)}</span>` : ''}
                  ${cv.location ? `<span class="cv-contact-item">${escapeHTML(cv.location)}</span>` : ''}
                  ${cv.linkedin ? `<span class="cv-contact-item">${escapeHTML(cv.linkedin)}</span>` : ''}
                  ${cv.github ? `<span class="cv-contact-item">${escapeHTML(cv.github)}</span>` : ''}
                </div>
              </div>` : ''}
            ${cv.skills && cv.skills.length > 0 ? `<div class="cv-section"><div class="cv-section-title">Skills</div>${buildSkills(cv.skills)}</div>` : ''}
            ${cv.languages && cv.languages.length > 0 ? `<div class="cv-section"><div class="cv-section-title">Languages</div><ul class="cv-lang-list">${buildLanguages(cv.languages)}</ul></div>` : ''}
            ${cv.certifications && cv.certifications.length > 0 ? `<div class="cv-section"><div class="cv-section-title">Certifications</div>${buildCertifications(cv.certifications)}</div>` : ''}
          </div>
          <div class="cv-main">
            ${cv.summary ? `<div class="cv-section"><div class="cv-section-title">Professional Summary</div><div class="cv-summary">${escapeHTML(cv.summary)}</div></div>` : ''}
            ${cv.experience && cv.experience.length > 0 ? `<div class="cv-section"><div class="cv-section-title">Work Experience</div>${buildExperience(cv.experience)}</div>` : ''}
            ${cv.education && cv.education.length > 0 ? `<div class="cv-section"><div class="cv-section-title">Education</div>${buildEducation(cv.education)}</div>` : ''}
            ${buildFieldSpecific(cv)}
          </div>
        </div>
      </div>`;
  }

  /**
   * Build the Minimal template
   */
  function buildMinimalTemplate(cv) {
    return `
      <div class="template-minimal">
        <div class="cv-content">
          <div class="cv-header">
            <div class="cv-name">${escapeHTML(cv.fullName) || 'Your Name'}</div>
            <div class="cv-title-line">${escapeHTML(cv.fieldSpecific?.title) || ''}</div>
            ${buildContactRow(cv)}
          </div>
          ${cv.summary ? `<div class="cv-section"><div class="cv-section-title">About</div><div class="cv-summary">${escapeHTML(cv.summary)}</div></div>` : ''}
          ${cv.experience && cv.experience.length > 0 ? `<div class="cv-section"><div class="cv-section-title">Experience</div>${buildExperience(cv.experience)}</div>` : ''}
          ${cv.education && cv.education.length > 0 ? `<div class="cv-section"><div class="cv-section-title">Education</div>${buildEducation(cv.education)}</div>` : ''}
          ${cv.skills && cv.skills.length > 0 ? `<div class="cv-section"><div class="cv-section-title">Skills</div>${buildSkills(cv.skills)}</div>` : ''}
          ${cv.certifications && cv.certifications.length > 0 ? `<div class="cv-section"><div class="cv-section-title">Certifications</div>${buildCertifications(cv.certifications)}</div>` : ''}
          ${buildFieldSpecific(cv)}
          ${cv.languages && cv.languages.length > 0 ? `<div class="cv-section"><div class="cv-section-title">Languages</div><ul class="cv-lang-list">${buildLanguages(cv.languages)}</ul></div>` : ''}
        </div>
      </div>`;
  }

  /**
   * Main render function
   */
  function render(cv) {
    if (!cv || !cv.fullName) {
      // Show placeholder
      previewEl.innerHTML = `
        <div class="cv-placeholder">
          <p>👋 Your CV will appear here</p>
          <p class="cv-placeholder-sub">Start by selecting your field and filling in your information →</p>
        </div>`;
      return;
    }

    // Remove placeholder class, add template class
    previewEl.classList.remove('cv-placeholder');
    previewEl.className = 'preview-page';

    const template = cv.template || 'classic';

    switch (template) {
      case 'modern':
        previewEl.innerHTML = buildModernTemplate(cv);
        break;
      case 'minimal':
        previewEl.innerHTML = buildMinimalTemplate(cv);
        break;
      case 'classic':
      default:
        previewEl.innerHTML = buildClassicTemplate(cv);
        break;
    }
  }

  /**
   * Show placeholder
   */
  function showPlaceholder() {
    previewEl.innerHTML = `
      <div class="cv-placeholder">
        <p>👋 Your CV will appear here</p>
        <p class="cv-placeholder-sub">Start by selecting your field and filling in your information →</p>
      </div>`;
    previewEl.className = 'preview-page';
  }

  /**
   * Zoom controls
   */
  function zoomIn() {
    if (currentZoom < 150) {
      currentZoom += 10;
      applyZoom();
    }
  }

  function zoomOut() {
    if (currentZoom > 50) {
      currentZoom -= 10;
      applyZoom();
    }
  }

  function resetZoom() {
    currentZoom = 100;
    applyZoom();
  }

  function applyZoom() {
    previewEl.style.transform = `scale(${currentZoom / 100})`;
    if (zoomLevelEl) zoomLevelEl.textContent = `${currentZoom}%`;
  }

  /**
   * Get current zoom level
   */
  function getZoom() {
    return currentZoom;
  }

  // Initialize zoom
  applyZoom();

  // Public API
  return {
    render,
    showPlaceholder,
    zoomIn,
    zoomOut,
    resetZoom,
    getZoom
  };
})();