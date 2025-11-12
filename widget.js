// Floating sidebar widget for Liverpool Blocker extension (like Simplify)
(function() {
'use strict';

// Default settings
const defaultSettings = {
  enabled: true,
  widgetTop: null, // Store vertical position
  widgetVisible: true // Store visibility state
};

// Get settings from storage
function getSettings(callback) {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['liverpoolSettings'], (result) => {
        try {
          const settings = result.liverpoolSettings || defaultSettings;
          callback(settings);
        } catch (error) {
          console.error('[Liverpool Widget] Error processing settings:', error);
          callback(defaultSettings);
        }
      });
    } else {
      // Fallback if chrome.storage is not available
      console.warn('[Liverpool Widget] chrome.storage not available, using default settings');
      callback(defaultSettings);
    }
  } catch (error) {
    console.error('[Liverpool Widget] Error accessing chrome.storage:', error);
    callback(defaultSettings);
  }
}

// Save settings to storage
function saveSettings(settings) {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ liverpoolSettings: settings }, () => {
        if (chrome.runtime.lastError) {
          console.error('[Liverpool Widget] Error saving settings:', chrome.runtime.lastError);
        }
      });
    } else {
      console.warn('[Liverpool Widget] chrome.storage not available, cannot save settings');
    }
  } catch (error) {
    console.error('[Liverpool Widget] Error saving settings:', error);
  }
}

// Create the sidebar widget
function createWidget() {
  // Check if widget already exists
  if (document.getElementById('liverpool-sidebar-widget')) {
    return;
  }

  const widget = document.createElement('div');
  widget.id = 'liverpool-sidebar-widget';
  widget.classList.add('collapsed');
  
  getSettings((settings) => {
    const isEnabled = settings.enabled !== false;
    
    widget.innerHTML = `
      <div class="liverpool-sidebar-toggle" id="liverpool-sidebar-toggle">
        <img src="${chrome.runtime.getURL('icon.png')}" class="liverpool-sidebar-icon" alt="Liverpool Blocker">
      </div>
      <div class="liverpool-sidebar-content" id="liverpool-sidebar-content">
        <div class="liverpool-sidebar-header">
          <div class="liverpool-sidebar-title">Liverpool Blocker</div>
          <button class="liverpool-sidebar-close" id="liverpool-sidebar-close">✕</button>
        </div>
        <div class="liverpool-sidebar-body">
          <div class="liverpool-sidebar-section">
            <div class="liverpool-sidebar-feature">
              <label class="liverpool-sidebar-label">
                <span>Enable Extension</span>
                <input type="checkbox" id="toggle-master" ${isEnabled ? 'checked' : ''}>
                <span class="liverpool-sidebar-switch"></span>
              </label>
              <div class="liverpool-sidebar-desc">Toggle all features on/off</div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      #liverpool-sidebar-widget {
        position: fixed !important;
        right: 0 !important;
        top: 50% !important;
        transform: translateY(-50%) !important;
        z-index: 2147483647 !important; /* Maximum z-index value */
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        display: flex !important;
        align-items: center;
        flex-direction: row-reverse;
        user-select: none;
        pointer-events: auto !important;
        visibility: visible !important;
        opacity: 1 !important;
      }
      
      
      #liverpool-sidebar-widget.collapsed .liverpool-sidebar-content {
        transform: translateX(100%);
        width: 0;
        overflow: hidden;
      }
      
      .liverpool-sidebar-toggle {
        width: 50px;
        height: 50px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 12px 0 0 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        flex-shrink: 0;
      }
      
      .liverpool-sidebar-icon {
        width: 32px;
        height: 32px;
        object-fit: contain;
      }
      
      .liverpool-sidebar-content {
        width: 280px;
        background: white;
        border-radius: 12px 0 0 12px;
        transition: transform 0.3s ease;
        transform: translateX(0);
        margin-right: 0;
        overflow: hidden;
      }
      
      .liverpool-sidebar-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 16px;
        border-radius: 12px 0 0 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .liverpool-sidebar-title {
        color: white;
        font-weight: bold;
        font-size: 16px;
      }
      
      .liverpool-sidebar-close {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        color: white;
        cursor: pointer;
        font-size: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
      }
      
      .liverpool-sidebar-close:hover {
        background: rgba(255, 255, 255, 0.3);
      }
      
      .liverpool-sidebar-body {
        padding: 20px;
        max-height: 400px;
        overflow-y: auto;
      }
      
      .liverpool-sidebar-section {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }
      
      .liverpool-sidebar-feature {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      
      .liverpool-sidebar-label {
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
        font-weight: 500;
        color: #333;
      }
      
      .liverpool-sidebar-label input[type="checkbox"] {
        display: none;
      }
      
      .liverpool-sidebar-switch {
        position: relative;
        width: 44px;
        height: 24px;
        background: #ccc;
        border-radius: 12px;
        transition: background 0.3s;
      }
      
      .liverpool-sidebar-switch::after {
        content: '';
        position: absolute;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: white;
        top: 2px;
        left: 2px;
        transition: left 0.3s;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }
      
      .liverpool-sidebar-label input[type="checkbox"]:checked + .liverpool-sidebar-switch {
        background: #667eea;
      }
      
      .liverpool-sidebar-label input[type="checkbox"]:checked + .liverpool-sidebar-switch::after {
        left: 22px;
      }
      
      .liverpool-sidebar-desc {
        font-size: 12px;
        color: #666;
        margin-left: 0;
      }
    `;

    document.head.appendChild(style);
    
    // Ensure body exists and append widget
    if (!document.body) {
      console.error('[Liverpool Widget] document.body not available');
      return;
    }
    
    // Try to append to body, with fallback to document.documentElement
    try {
      document.body.appendChild(widget);
    } catch (error) {
      console.error('[Liverpool Widget] Error appending to body:', error);
      // Fallback: try appending to documentElement
      try {
        document.documentElement.appendChild(widget);
      } catch (e) {
        console.error('[Liverpool Widget] Error appending to documentElement:', e);
      }
    }
    
    // Add event listeners
    const toggleBtn = document.getElementById('liverpool-sidebar-toggle');
    const closeBtn = document.getElementById('liverpool-sidebar-close');
    const masterToggle = document.getElementById('toggle-master');

    // Click to toggle open/close
    toggleBtn.addEventListener('click', () => {
      widget.classList.toggle('collapsed');
    });

    // Close sidebar (collapse)
    closeBtn.addEventListener('click', () => {
      widget.classList.add('collapsed');
    });

    // Master toggle - enable/disable all features
    masterToggle.addEventListener('change', (e) => {
      const isEnabled = e.target.checked;
      getSettings((settings) => {
        settings.enabled = isEnabled;
        saveSettings(settings);
        // Reload page to apply changes
        window.location.reload();
      });
    });
  });
}

// Initialize widget when page loads
function initWidget() {
  // Wait for body to be ready
  if (!document.body) {
    setTimeout(initWidget, 100);
    return;
  }

  // Create widget after a short delay to ensure page is ready
  setTimeout(() => {
    if (!document.getElementById('liverpool-sidebar-widget')) {
      createWidget();
    }
  }, 500);
}

// Initialize based on document state
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWidget);
} else {
  initWidget();
}

// Also watch for dynamically loaded content
if (document.body) {
  const observer = new MutationObserver(() => {
    if (document.body && !document.getElementById('liverpool-sidebar-widget')) {
      setTimeout(createWidget, 300);
    }
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
}

})();
