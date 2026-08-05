/* ============================================
   Dynamic Questions Engine
   Built by 0x9z | MIT License
   ============================================ */

const QuestionEngine = (() => {
  /**
   * All steps in order (8 steps total)
   * Each step has an id, title, and list of questions
   */
  const steps = [
    // Step 1: Field Selection (handled separately in app.js)
    {
      id: 'field',
      title: 'Field Selection',
      questions: []
    },
    // Step 2: Personal Information
    {
      id: 'personal',
      title: 'Personal Information',
      questions: [
        {
          id: 'fullName',
          type: 'text',
          label: 'Full Name',
          placeholder: 'e.g. John Doe',
          required: true,
          stateKey: 'fullName'
        },
        {
          id: 'email',
          type: 'email',
          label: 'Email Address',
          placeholder: 'e.g. john@example.com',
          required: true,
          stateKey: 'email'
        },
        {
          id: 'phone',
          type: 'tel',
          label: 'Phone Number',
          placeholder: 'e.g. +1 555-0123',
          required: false,
          stateKey: 'phone'
        },
        {
          id: 'location',
          type: 'text',
          label: 'Location',
          placeholder: 'e.g. New York, USA',
          required: true,
          stateKey: 'location'
        }
      ]
    },
    // Step 3: Professional Links
    {
      id: 'links',
      title: 'Professional Links',
      questions: [
        {
          id: 'linkedin',
          type: 'url',
          label: 'LinkedIn URL',
          placeholder: 'e.g. linkedin.com/in/johndoe',
          required: false,
          stateKey: 'linkedin'
        },
        {
          id: 'github',
          type: 'url',
          label: 'GitHub URL',
          placeholder: 'e.g. github.com/0x9z',
          required: false,
          stateKey: 'github'
        },
        {
          id: 'website',
          type: 'url',
          label: 'Personal Website',
          placeholder: 'e.g. cybernetwork.technology',
          required: false,
          stateKey: 'website'
        }
      ]
    },
    // Step 4: Professional Summary
    {
      id: 'summary',
      title: 'Professional Summary',
      questions: [
        {
          id: 'summary',
          type: 'textarea',
          label: 'Professional Summary',
          placeholder: 'Write a short summary of your professional background, key skills, and career goals (2-3 sentences)...',
          required: true,
          stateKey: 'summary',
          maxLength: 500,
          hint: 'Keep it concise — 2-3 sentences max. Focus on your strongest achievements.'
        }
      ]
    },
    // Step 5: Skills
    {
      id: 'skills',
      title: 'Skills',
      questions: [
        {
          id: 'skills',
          type: 'multiselect',
          label: 'Skills',
          placeholder: 'Type a skill and press Enter to add it',
          required: true,
          stateKey: 'skills'
        }
      ]
    },
    // Step 6: Work Experience
    {
      id: 'experience',
      title: 'Work Experience',
      questions: [] // Handled by repeat section
    },
    // Step 7: Education & Certifications
    {
      id: 'education',
      title: 'Education & Certifications',
      questions: [] // Handled by repeat section
    },
    // Step 8: Languages & Template
    {
      id: 'final',
      title: 'Languages & Template',
      questions: [
        {
          id: 'languages',
          type: 'languages',
          label: 'Languages',
          required: false,
          stateKey: 'languages'
        }
      ]
    }
  ];

  /**
   * Field-specific extra questions (asked after step 3 based on field)
   */
  const fieldQuestions = {
    it: [
      {
        id: 'fieldSpecific.techStack',
        type: 'multiselect',
        label: 'Tech Stack',
        placeholder: 'e.g. Linux, Docker, Python, Bash',
        required: true,
        stateKey: 'fieldSpecific.techStack',
        hint: 'List the technologies and tools you work with'
      },
      {
        id: 'fieldSpecific.operatingSystems',
        type: 'multiselect',
        label: 'Operating Systems',
        placeholder: 'e.g. Linux, Windows Server, macOS',
        required: false,
        stateKey: 'fieldSpecific.operatingSystems'
      },
      {
        id: 'fieldSpecific.cloudPlatforms',
        type: 'multiselect',
        label: 'Cloud Platforms',
        placeholder: 'e.g. AWS, Azure, Google Cloud',
        required: false,
        stateKey: 'fieldSpecific.cloudPlatforms'
      },
      {
        id: 'fieldSpecific.homelab',
        type: 'select',
        label: 'Do you have a homelab or personal projects?',
        required: false,
        stateKey: 'fieldSpecific.homelab',
        options: ['', 'Yes, I run a homelab', 'Yes, I have personal projects', 'Not yet, but planning to', 'No']
      }
    ],
    nursing: [
      {
        id: 'fieldSpecific.registrationNumber',
        type: 'text',
        label: 'Registration/License Number',
        placeholder: 'e.g. NMC123456',
        required: true,
        stateKey: 'fieldSpecific.registrationNumber'
      },
      {
        id: 'fieldSpecific.specializations',
        type: 'multiselect',
        label: 'Specializations',
        placeholder: 'e.g. Emergency, Pediatrics, ICU',
        required: false,
        stateKey: 'fieldSpecific.specializations'
      },
      {
        id: 'fieldSpecific.clinicalHours',
        type: 'number',
        label: 'Clinical Hours Completed',
        placeholder: 'e.g. 2000',
        required: false,
        stateKey: 'fieldSpecific.clinicalHours'
      },
      {
        id: 'fieldSpecific.certifications',
        type: 'multiselect',
        label: 'Clinical Certifications',
        placeholder: 'e.g. BLS, ACLS, PALS',
        required: false,
        stateKey: 'fieldSpecific.certifications'
      }
    ],
    hr: [
      {
        id: 'fieldSpecific.hrisSystems',
        type: 'multiselect',
        label: 'HRIS Systems Used',
        placeholder: 'e.g. Workday, SAP SuccessFactors, BambooHR',
        required: false,
        stateKey: 'fieldSpecific.hrisSystems'
      },
      {
        id: 'fieldSpecific.employeesSupported',
        type: 'text',
        label: 'Number of Employees Supported',
        placeholder: 'e.g. 500+',
        required: false,
        stateKey: 'fieldSpecific.employeesSupported'
      },
      {
        id: 'fieldSpecific.recruitmentMetrics',
        type: 'textarea',
        label: 'Key Recruitment Metrics Achieved',
        placeholder: 'e.g. Reduced time-to-hire by 30%, filled 50+ positions annually',
        required: false,
        stateKey: 'fieldSpecific.recruitmentMetrics'
      }
    ],
    driving: [
      {
        id: 'fieldSpecific.licenseClass',
        type: 'select',
        label: 'License Class',
        required: true,
        stateKey: 'fieldSpecific.licenseClass',
        options: ['', 'Class A (Heavy Vehicle)', 'Class B (Bus)', 'Class C (Light Vehicle)', 'Class D (Motorcycle)', 'Other']
      },
      {
        id: 'fieldSpecific.yearsExperience',
        type: 'number',
        label: 'Years of Driving Experience',
        placeholder: 'e.g. 8',
        required: true,
        stateKey: 'fieldSpecific.yearsExperience'
      },
      {
        id: 'fieldSpecific.vehicleTypes',
        type: 'multiselect',
        label: 'Vehicle Types Operated',
        placeholder: 'e.g. Truck, Bus, Forklift, Crane',
        required: false,
        stateKey: 'fieldSpecific.vehicleTypes'
      },
      {
        id: 'fieldSpecific.cleanRecord',
        type: 'select',
        label: 'Clean Driving Record?',
        required: false,
        stateKey: 'fieldSpecific.cleanRecord',
        options: ['', 'Yes', 'Minor infractions only', 'Prefer not to say']
      }
    ],
    construction: [
      {
        id: 'fieldSpecific.tickets',
        type: 'multiselect',
        label: 'Site Tickets / Cards',
        placeholder: 'e.g. CSCS, White Card, OSHA',
        required: false,
        stateKey: 'fieldSpecific.tickets'
      },
      {
        id: 'fieldSpecific.machinery',
        type: 'multiselect',
        label: 'Machinery Operated',
        placeholder: 'e.g. Excavator, Forklift, Crane',
        required: false,
        stateKey: 'fieldSpecific.machinery'
      },
      {
        id: 'fieldSpecific.siteSize',
        type: 'text',
        label: 'Largest Site Managed',
        placeholder: 'e.g. 200-unit residential complex',
        required: false,
        stateKey: 'fieldSpecific.siteSize'
      }
    ],
    finance: [
      {
        id: 'fieldSpecific.software',
        type: 'multiselect',
        label: 'Accounting Software',
        placeholder: 'e.g. SAP, QuickBooks, Xero, Excel',
        required: false,
        stateKey: 'fieldSpecific.software'
      },
      {
        id: 'fieldSpecific.certifications',
        type: 'multiselect',
        label: 'Financial Certifications',
        placeholder: 'e.g. CPA, CFA, ACCA',
        required: false,
        stateKey: 'fieldSpecific.certifications'
      },
      {
        id: 'fieldSpecific.budgetManaged',
        type: 'text',
        label: 'Budget Managed',
        placeholder: 'e.g. $5M annual budget',
        required: false,
        stateKey: 'fieldSpecific.budgetManaged'
      }
    ],
    education: [
      {
        id: 'fieldSpecific.subjects',
        type: 'multiselect',
        label: 'Subjects Taught',
        placeholder: 'e.g. Mathematics, Physics, English',
        required: false,
        stateKey: 'fieldSpecific.subjects'
      },
      {
        id: 'fieldSpecific.ageGroups',
        type: 'multiselect',
        label: 'Age Groups',
        placeholder: 'e.g. Primary, Secondary, University',
        required: false,
        stateKey: 'fieldSpecific.ageGroups'
      },
      {
        id: 'fieldSpecific.certifications',
        type: 'multiselect',
        label: 'Teaching Certifications',
        placeholder: 'e.g. PGCE, TEFL, CELTA',
        required: false,
        stateKey: 'fieldSpecific.certifications'
      }
    ],
    sales: [
      {
        id: 'fieldSpecific.crmSystems',
        type: 'multiselect',
        label: 'CRM Systems',
        placeholder: 'e.g. Salesforce, HubSpot, Zoho',
        required: false,
        stateKey: 'fieldSpecific.crmSystems'
      },
      {
        id: 'fieldSpecific.quotaAchievement',
        type: 'text',
        label: 'Quota Achievement',
        placeholder: 'e.g. 120% of annual target',
        required: false,
        stateKey: 'fieldSpecific.quotaAchievement'
      },
      {
        id: 'fieldSpecific.dealSize',
        type: 'text',
        label: 'Average Deal Size',
        placeholder: 'e.g. $50K - $200K',
        required: false,
        stateKey: 'fieldSpecific.dealSize'
      }
    ]
  };

  /**
   * Skill suggestions based on field
   */
  const skillSuggestions = {
    it: ['Linux', 'Bash', 'Python', 'Docker', 'Networking', 'Git', 'AWS', 'Cybersecurity', 'Shell Scripting', 'CI/CD', 'Kubernetes', 'Terraform'],
    nursing: ['Patient Care', 'Vital Signs', 'Medication Administration', 'Wound Care', 'IV Therapy', 'EHR Systems', 'Infection Control'],
    hr: ['Recruitment', 'Onboarding', 'Employee Relations', 'HRIS', 'Payroll', 'Performance Management', 'Training & Development'],
    driving: ['Route Planning', 'Vehicle Maintenance', 'GPS Navigation', 'Customer Service', 'Time Management', 'Safety Compliance'],
    construction: ['Blueprint Reading', 'Site Safety', 'Equipment Operation', 'Team Leadership', 'Quality Control', 'Scheduling'],
    finance: ['Financial Analysis', 'Budgeting', 'Forecasting', 'Excel', 'Tax Preparation', 'Auditing', 'Risk Management'],
    education: ['Curriculum Development', 'Classroom Management', 'Lesson Planning', 'Student Assessment', 'E-Learning', 'Mentoring'],
    sales: ['Negotiation', 'Lead Generation', 'Cold Calling', 'Account Management', 'Pipeline Management', 'Presentations']
  };

  /**
   * Experience item template
   */
  function getExperienceTemplate() {
    return {
      title: '',
      company: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      bullets: ['']
    };
  }

  /**
   * Education item template
   */
  function getEducationTemplate() {
    return {
      degree: '',
      field: '',
      school: '',
      startDate: '',
      endDate: ''
    };
  }

  /**
   * Certification item template
   */
  function getCertificationTemplate() {
    return {
      name: '',
      issuer: '',
      date: ''
    };
  }

  /**
   * Language item template
   */
  function getLanguageTemplate() {
    return {
      language: '',
      level: 'Intermediate'
    };
  }

  /**
   * Get all steps
   */
  function getSteps() {
    return steps;
  }

  /**
   * Get a specific step by id
   */
  function getStep(stepId) {
    return steps.find(s => s.id === stepId);
  }

  /**
   * Get field-specific questions for a given field
   */
  function getFieldQuestions(field) {
    return fieldQuestions[field] || [];
  }

  /**
   * Get skill suggestions for a given field
   */
  function getSkillSuggestions(field) {
    return skillSuggestions[field] || [];
  }

  /**
   * Get total number of steps
   */
  function getTotalSteps() {
    return steps.length;
  }

  /**
   * Get step index by id
   */
  function getStepIndex(stepId) {
    return steps.findIndex(s => s.id === stepId);
  }

  // Public API
  return {
    getSteps,
    getStep,
    getFieldQuestions,
    getSkillSuggestions,
    getTotalSteps,
    getStepIndex,
    getExperienceTemplate,
    getEducationTemplate,
    getCertificationTemplate,
    getLanguageTemplate,
    fieldQuestions,
    skillSuggestions
  };
})();