/* ============================================
   Save & Load - LocalStorage Manager
   Built by 0x9z | MIT License
   ============================================ */

const StorageEngine = (() => {
  const STORAGE_KEY = 'cv_builder_data';
  const BACKUP_KEY = 'cv_builder_backup';
  const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

  let autoSaveTimer = null;

  /**
   * Save CV to localStorage
   */
  function saveCV() {
    try {
      const cv = CVState.getCV();
      const data = {
        cv: cv,
        savedAt: new Date().toISOString(),
        version: '1.0'
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Failed to save CV:', e);
      // localStorage might be full
      if (e.name === 'QuotaExceededError') {
        alert('⚠️ Storage is full. Please clear some old CVs or free up browser storage.');
      }
      return false;
    }
  }

  /**
   * Load CV from localStorage
   * @returns {object|null} The saved CV data or null if nothing saved
   */
  function loadCV() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;

      const data = JSON.parse(raw);
      if (!data.cv) return null;

      return data;
    } catch (e) {
      console.error('Failed to load CV:', e);
      return null;
    }
  }

  /**
   * Check if a saved CV exists
   */
  function hasSavedCV() {
    return localStorage.getItem(STORAGE_KEY) !== null;
  }

  /**
   * Get save info (when it was saved)
   */
  function getSaveInfo() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      return {
        savedAt: data.savedAt,
        name: data.cv?.fullName || 'Unnamed CV'
      };
    } catch (e) {
      return null;
    }
  }

  /**
   * Delete saved CV
   */
  function deleteCV() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(BACKUP_KEY);
    stopAutoSave();
    return true;
  }

  /**
   * Create a backup of current CV before major changes
   */
  function createBackup() {
    try {
      const cv = CVState.getCV();
      const data = {
        cv: cv,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(BACKUP_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Failed to create backup:', e);
      return false;
    }
  }

  /**
   * Restore from backup
   */
  function restoreBackup() {
    try {
      const raw = localStorage.getItem(BACKUP_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      return data.cv;
    } catch (e) {
      console.error('Failed to restore backup:', e);
      return null;
    }
  }

  /**
   * Start auto-save (saves every 30 seconds)
   */
  function startAutoSave() {
    stopAutoSave(); // Clear existing timer
    autoSaveTimer = setInterval(() => {
      const success = saveCV();
      if (success) {
        console.log('💾 Auto-saved at', new Date().toLocaleTimeString());
      }
    }, AUTO_SAVE_INTERVAL);
  }

  /**
   * Stop auto-save
   */
  function stopAutoSave() {
    if (autoSaveTimer) {
      clearInterval(autoSaveTimer);
      autoSaveTimer = null;
    }
  }

  /**
   * Export CV as downloadable JSON file
   */
  function exportToFile() {
    try {
      const cv = CVState.getCV();
      const data = {
        cv: cv,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };

      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const filename = cv.fullName
        ? `${cv.fullName.replace(/\s+/g, '_')}_CV_Backup.json`
        : 'CV_Backup.json';

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return true;
    } catch (e) {
      console.error('Failed to export CV:', e);
      alert('⚠️ Failed to export CV. Please try again.');
      return false;
    }
  }

  /**
   * Import CV from JSON file
   * @param {File} file - The JSON file to import
   * @returns {Promise<boolean>}
   */
  function importFromFile(file) {
    return new Promise((resolve) => {
      if (!file) {
        resolve(false);
        return;
      }

      const reader = new FileReader();

      reader.onload = function(e) {
        try {
          const data = JSON.parse(e.target.result);

          if (!data.cv) {
            alert('⚠️ Invalid CV file. The file does not contain CV data.');
            resolve(false);
            return;
          }

          // Create backup before importing
          createBackup();

          // Load the imported CV
          CVState.loadCV(data.cv);
          PreviewEngine.render(CVState.getCV());
          saveCV();

          alert('✅ CV imported successfully!');
          resolve(true);
        } catch (err) {
          console.error('Import error:', err);
          alert('⚠️ Invalid file format. Please select a valid JSON file.');
          resolve(false);
        }
      };

      reader.onerror = function() {
        alert('⚠️ Failed to read the file. Please try again.');
        resolve(false);
      };

      reader.readAsText(file);
    });
  }

  /**
   * Get storage usage info
   */
  function getStorageInfo() {
    try {
      let used = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += localStorage[key].length * 2; // UTF-16 characters = 2 bytes each
        }
      }
      const usedKB = (used / 1024).toFixed(1);
      const maxKB = (5120).toFixed(0); // Most browsers allow ~5MB
      return {
        used: usedKB,
        max: maxKB,
        percentage: ((used / 1024 / 5120) * 100).toFixed(1)
      };
    } catch (e) {
      return null;
    }
  }

  /**
   * Clear all CV Builder data from localStorage
   */
  function clearAll() {
    const keys = [];
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key) && key.startsWith('cv_builder')) {
        keys.push(key);
      }
    }
    keys.forEach(key => localStorage.removeItem(key));
    stopAutoSave();
    return keys.length;
  }

  // Public API
  return {
    saveCV,
    loadCV,
    hasSavedCV,
    getSaveInfo,
    deleteCV,
    createBackup,
    restoreBackup,
    startAutoSave,
    stopAutoSave,
    exportToFile,
    importFromFile,
    getStorageInfo,
    clearAll
  };
})();