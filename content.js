// Words we don't want to see
const bannedWords = ["Tottenham", "Spurs", "Hotspur"];
const replacementText = "King of London";
// Full phrase that should be replaced as one unit
const fullPhrase = "Tottenham Hotspur";
const fullPhraseReplacement = "King of London";

// Track processed nodes to avoid re-processing
const processedNodes = new WeakSet();

// Check if we should skip this element/node
function shouldSkip(node) {
  if (!node || !node.parentNode) return true;
  
  // Skip if already processed
  if (processedNodes.has(node)) return true;
  
  // Skip script, style, and other non-content elements
  const skipTags = ['script', 'style', 'noscript', 'meta', 'link', 'title', 'head', 'svg', 'canvas'];
  
  let parent = node.parentNode;
  let depth = 0;
  const maxDepth = 20; // Safety limit
  
  while (parent && parent !== document.body && parent !== document.documentElement && depth < maxDepth) {
    const tagName = parent.tagName?.toLowerCase();
    
    // Skip if in a skip tag
    if (skipTags.includes(tagName)) return true;
    
    // Check for framework markers - be very careful with root elements
    if (parent.hasAttribute) {
      const id = parent.getAttribute('id');
      // If we're inside a React root, be extra careful
      if (id === 'root' || id === '__next' || id === 'app') {
        // Only process if parent is a regular content element
        const parentTag = parent.tagName?.toLowerCase();
        if (!['div', 'main', 'article', 'section'].includes(parentTag)) {
          return true;
        }
      }
      
      // Skip elements with React/Vue internal markers
      if (parent.hasAttribute('data-reactroot') ||
          parent.hasAttribute('__reactInternalInstance') ||
          parent.hasAttribute('data-v-')) {
        // Skip only if it's a direct child
        if (depth <= 2) return true;
      }
    }
    
    parent = parent.parentNode;
    depth++;
  }
  
  return false;
}

// Replace text in a single text node safely
function replaceTextInNode(textNode) {
  if (shouldSkip(textNode)) return false;
  if (processedNodes.has(textNode)) return false;
  
  const originalText = textNode.textContent;
  if (!originalText || originalText.trim().length === 0) return false;
  
  let hasMatch = false;
  let newText = originalText;
  
  // First, replace "6th in premier league" with "1st" (case-insensitive)
  const sixthInPremierRegex = /\b6th\s+in\s+premier\s+league\b/gi;
  const replacedSixth = newText.replace(sixthInPremierRegex, "1st in Premier League");
  if (replacedSixth !== newText) {
    newText = replacedSixth;
    hasMatch = true;
  }
  
  // Then, replace the full phrase "Tottenham Hotspur" as one unit
  // Match "Tottenham Hotspur" (case-insensitive) with word boundaries
  const fullPhraseRegex = new RegExp(`\\b${fullPhrase.replace(/\s+/g, '\\s+')}\\b`, "gi");
  const replacedFullPhrase = newText.replace(fullPhraseRegex, fullPhraseReplacement);
  if (replacedFullPhrase !== newText) {
    newText = replacedFullPhrase;
    hasMatch = true;
  }
  
  // Then replace individual words
  // Since we already replaced "Tottenham Hotspur" with "Kings of London",
  // the individual words won't be found in the replaced text, so we're safe
  bannedWords.forEach(word => {
    let replacedText;
    // For "Tottenham", only replace if not followed by " Hotspur" (using negative lookahead)
    if (word === "Tottenham") {
      const tottenhamRegex = new RegExp(`\\b${word}\\b(?!\\s+Hotspur)`, "gi");
      replacedText = newText.replace(tottenhamRegex, replacementText);
    } else {
      // For other words (Spurs, Hotspur), replace normally
      // Note: "Hotspur" that was part of "Tottenham Hotspur" is already replaced
      const wordRegex = new RegExp(`\\b${word}\\b`, "gi");
      replacedText = newText.replace(wordRegex, replacementText);
    }
    
    if (replacedText !== newText) {
      newText = replacedText;
      hasMatch = true;
    }
  });
  
  if (hasMatch && newText !== originalText) {
    try {
      textNode.textContent = newText;
      processedNodes.add(textNode);
      return true;
    } catch (e) {
      // If modification fails, skip this node
      console.warn('Failed to modify text node:', e);
      return false;
    }
  }
  
  return false;
}

// Replace text in all text nodes, being very conservative
function replaceTottenhamText(root = document.body) {
  if (!root) return;
  
  // Use TreeWalker to find all text nodes, but filter carefully
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        // Skip if we should skip this node
        if (shouldSkip(node)) {
          return NodeFilter.FILTER_REJECT;
        }
        // Skip if already processed
        if (processedNodes.has(node)) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    },
    false
  );

  const textNodes = [];
  let node;
  while (node = walker.nextNode()) {
    textNodes.push(node);
  }

  // Process all collected text nodes
  textNodes.forEach(textNode => {
    replaceTextInNode(textNode);
  });
}

// Debounce function to avoid excessive calls
let timeoutId = null;
function debouncedReplace() {
  if (timeoutId) clearTimeout(timeoutId);
  timeoutId = setTimeout(() => {
    replaceTottenhamText();
  }, 300);
}

// Observe new content (for infinite scroll / live updates)
// Only observe additions, not modifications
const observer = new MutationObserver((mutations) => {
  // Only process if nodes were added (not modified)
  const hasAdditions = mutations.some(m => m.addedNodes.length > 0);
  if (hasAdditions) {
    debouncedReplace();
  }
});

// Start observing after page is stable
function initObserver() {
  if (document.body) {
    observer.observe(document.body, { 
      childList: true, 
      subtree: true,
      characterData: false,
      attributes: false
    });
  }
}

// Wait for DOM to be fully ready and page to be interactive
function init() {
  // Wait for page to be fully loaded and interactive
  function waitForReady() {
    if (document.readyState === 'complete' && document.body) {
      // Wait additional time for React/SPA frameworks to initialize
      setTimeout(() => {
        // Only start if body has meaningful content
        if (document.body.children.length > 0 || document.body.textContent.trim().length > 100) {
          initObserver();
          // Delay first replacement to let page fully render
          setTimeout(replaceTottenhamText, 2000);
        } else {
          // If not ready, try again
          setTimeout(waitForReady, 500);
        }
      }, 1500);
    } else {
      // If not complete, wait and check again
      setTimeout(waitForReady, 100);
    }
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForReady);
    // Also listen for load event
    window.addEventListener('load', waitForReady);
  } else {
    waitForReady();
  }
}

// Check settings before initializing
chrome.storage.local.get(['tottenhamSettings'], (result) => {
  const settings = result.tottenhamSettings || { enabled: true };
  if (settings.enabled !== false) {
    init();
  }
});
