// Floating sidebar widget for Tottenham Blocker extension (like Simplify)
(function() {
'use strict';

// Default settings
const defaultSettings = {
  enabled: true
};

// Get settings from storage
function getSettings(callback) {
  chrome.storage.local.get(['tottenhamSettings'], (result) => {
    const settings = result.tottenhamSettings || defaultSettings;
    callback(settings);
  });
}

// Save settings to storage
function saveSettings(settings) {
  chrome.storage.local.set({ tottenhamSettings: settings });
}

// Create the sidebar widget
function createWidget() {
  // Check if widget already exists
  if (document.getElementById('tottenham-sidebar-widget')) {
    return;
  }

  const widget = document.createElement('div');
  widget.id = 'tottenham-sidebar-widget';
  widget.classList.add('collapsed');
  
  getSettings((settings) => {
    const isEnabled = settings.enabled !== false;
    widget.innerHTML = `
      <div class="tottenham-sidebar-toggle" id="tottenham-sidebar-toggle">
        <div class="tottenham-sidebar-icon">⚽</div>
      </div>
      <div class="tottenham-sidebar-content" id="tottenham-sidebar-content">
        <div class="tottenham-sidebar-header">
          <div class="tottenham-sidebar-title">Tottenham Blocker</div>
          <button class="tottenham-sidebar-close" id="tottenham-sidebar-close">✕</button>
        </div>
        <div class="tottenham-sidebar-body">
          <div class="tottenham-sidebar-section">
            <div class="tottenham-sidebar-feature">
              <label class="tottenham-sidebar-label">
                <span>Enable Extension</span>
                <input type="checkbox" id="toggle-master" ${isEnabled ? 'checked' : ''}>
                <span class="tottenham-sidebar-switch"></span>
              </label>
              <div class="tottenham-sidebar-desc">Toggle all features on/off</div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      #tottenham-sidebar-widget {
        position: fixed;
        right: 0;
        top: 50%;
        transform: translateY(-50%);
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        display: flex;
        align-items: center;
        flex-direction: row-reverse;
      }
      
      #tottenham-sidebar-widget.collapsed .tottenham-sidebar-content {
        transform: translateX(100%);
        opacity: 0;
        pointer-events: none;
        width: 0;
        overflow: hidden;
      }
      
      .tottenham-sidebar-toggle {
        width: 50px;
        height: 50px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 12px 0 0 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: -4px 0 12px rgba(0, 0, 0, 0.15);
        transition: all 0.3s ease;
        flex-shrink: 0;
        margin-right: 0;
      }
      
      .tottenham-sidebar-toggle:hover {
        background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
        box-shadow: -4px 0 16px rgba(0, 0, 0, 0.25);
      }
      
      .tottenham-sidebar-icon {
        font-size: 24px;
        color: white;
      }
      
      .tottenham-sidebar-content {
        width: 280px;
        background: white;
        border-radius: 12px 0 0 12px;
        box-shadow: -4px 0 20px rgba(0, 0, 0, 0.2);
        transition: transform 0.3s ease, opacity 0.3s ease, width 0.3s ease;
        transform: translateX(0);
        opacity: 1;
        margin-right: 0;
        overflow: hidden;
      }
      
      .tottenham-sidebar-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 16px;
        border-radius: 12px 0 0 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .tottenham-sidebar-title {
        color: white;
        font-weight: bold;
        font-size: 16px;
      }
      
      .tottenham-sidebar-close {
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
      
      .tottenham-sidebar-close:hover {
        background: rgba(255, 255, 255, 0.3);
      }
      
      .tottenham-sidebar-body {
        padding: 20px;
        max-height: 400px;
        overflow-y: auto;
      }
      
      .tottenham-sidebar-section {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }
      
      .tottenham-sidebar-feature {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      
      .tottenham-sidebar-label {
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
        font-weight: 500;
        color: #333;
      }
      
      .tottenham-sidebar-label input[type="checkbox"] {
        display: none;
      }
      
      .tottenham-sidebar-switch {
        position: relative;
        width: 44px;
        height: 24px;
        background: #ccc;
        border-radius: 12px;
        transition: background 0.3s;
      }
      
      .tottenham-sidebar-switch::after {
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
      
      .tottenham-sidebar-label input[type="checkbox"]:checked + .tottenham-sidebar-switch {
        background: #667eea;
      }
      
      .tottenham-sidebar-label input[type="checkbox"]:checked + .tottenham-sidebar-switch::after {
        left: 22px;
      }
      
      .tottenham-sidebar-desc {
        font-size: 12px;
        color: #666;
        margin-left: 0;
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(widget);

    // Add event listeners
    const toggleBtn = document.getElementById('tottenham-sidebar-toggle');
    const closeBtn = document.getElementById('tottenham-sidebar-close');
    const masterToggle = document.getElementById('toggle-master');

    // Toggle sidebar
    toggleBtn.addEventListener('click', () => {
      widget.classList.toggle('collapsed');
    });

    // Close sidebar
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
    if (!document.getElementById('tottenham-sidebar-widget')) {
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
    if (document.body && !document.getElementById('tottenham-sidebar-widget')) {
      setTimeout(createWidget, 300);
    }
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
}

})();
