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
  chrome.storage.local.get(['liverpoolSettings'], (result) => {
    const settings = result.liverpoolSettings || defaultSettings;
    callback(settings);
  });
}

// Save settings to storage
function saveSettings(settings) {
  chrome.storage.local.set({ liverpoolSettings: settings });
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
  
  // Ensure widget is positioned on the right side by default
  widget.style.right = '0';
  
  getSettings((settings) => {
    const isEnabled = settings.enabled !== false;
    const widgetVisible = settings.widgetVisible !== false;
    
    // Restore position if saved
    if (settings.widgetTop !== null && settings.widgetTop !== undefined) {
      widget.style.top = settings.widgetTop + 'px';
      widget.style.transform = 'none';
    } else {
      // Default to centered vertically on the right side
      widget.style.top = '50%';
      widget.style.transform = 'translateY(-50%)';
    }
    
    // Hide widget if it was closed
    if (!widgetVisible) {
      widget.style.display = 'none';
    }
    
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
        position: fixed;
        right: 0;
        top: 50%;
        transform: translateY(-50%);
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        display: flex;
        align-items: center;
        flex-direction: row-reverse;
        user-select: none;
      }
      
      #liverpool-sidebar-widget.dragging {
        transition: none !important;
      }
      
      #liverpool-sidebar-widget.collapsed .liverpool-sidebar-content {
        transform: translateX(100%);
        opacity: 0;
        pointer-events: none;
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
        cursor: move;
        box-shadow: -4px 0 12px rgba(0, 0, 0, 0.15);
        transition: all 0.3s ease;
        flex-shrink: 0;
        margin-right: 0;
      }
      
      .liverpool-sidebar-toggle:hover {
        background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
        box-shadow: -4px 0 16px rgba(0, 0, 0, 0.25);
      }
      
      .liverpool-sidebar-toggle:active {
        cursor: grabbing;
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
        box-shadow: -4px 0 20px rgba(0, 0, 0, 0.2);
        transition: transform 0.3s ease, opacity 0.3s ease, width 0.3s ease;
        transform: translateX(0);
        opacity: 1;
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
    document.body.appendChild(widget);

    // Add event listeners
    const toggleBtn = document.getElementById('liverpool-sidebar-toggle');
    const closeBtn = document.getElementById('liverpool-sidebar-close');
    const masterToggle = document.getElementById('toggle-master');

    // Drag functionality
    let isDragging = false;
    let hasDragged = false;
    let dragStartY = 0;
    let widgetStartTop = 0;
    let justDragged = false; // Track if we just finished a drag

    function getWidgetTop() {
      const currentTop = widget.style.top;
      if (currentTop && currentTop !== 'auto') {
        return parseInt(currentTop);
      }
      // If no explicit top, calculate from current position
      const rect = widget.getBoundingClientRect();
      return rect.top;
    }

    toggleBtn.addEventListener('mousedown', (e) => {
      isDragging = false;
      hasDragged = false;
      dragStartY = e.clientY;
      widgetStartTop = getWidgetTop();
    });

    document.addEventListener('mousemove', (e) => {
      if (dragStartY === 0) return; // Not in potential drag state
      
      const deltaY = Math.abs(e.clientY - dragStartY);
      
      // Start dragging if mouse moved more than 5px
      if (deltaY > 5 && !isDragging) {
        isDragging = true;
        hasDragged = true;
        widget.classList.add('dragging');
        document.body.style.userSelect = 'none';
      }
      
      if (isDragging) {
        const currentDeltaY = e.clientY - dragStartY;
        let newTop = widgetStartTop + currentDeltaY;
        
        // Constrain to viewport bounds
        const widgetHeight = widget.offsetHeight;
        const maxTop = window.innerHeight - widgetHeight;
        newTop = Math.max(0, Math.min(newTop, maxTop));
        
        widget.style.top = newTop + 'px';
        widget.style.transform = 'none';
      }
    });

    document.addEventListener('mouseup', (e) => {
      if (isDragging) {
        // Save position after drag
        const currentTop = getWidgetTop();
        getSettings((settings) => {
          settings.widgetTop = currentTop;
          saveSettings(settings);
        });
        justDragged = true;
        // Reset justDragged after a short delay
        setTimeout(() => {
          justDragged = false;
        }, 200);
      }
      
      // Reset drag state
      isDragging = false;
      hasDragged = false;
      dragStartY = 0;
      widget.classList.remove('dragging');
      document.body.style.userSelect = '';
    });
    
    // Click handler for toggling
    toggleBtn.addEventListener('click', (e) => {
      // Only toggle if we didn't just drag
      if (!justDragged && !hasDragged) {
        widget.classList.toggle('collapsed');
      }
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
