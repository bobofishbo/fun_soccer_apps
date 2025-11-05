// Function to make Tottenham first place in Premier League standings table
// This works with Google search results tables and similar standings tables

(function() {
'use strict';

function makeTottenhamFirst() {
  // Find Tottenham row - use aria-label as it's more reliable than text
  // (the text might have been replaced by "Everything's fine 👍")
  const tottenhamRow = Array.from(document.querySelectorAll('tr')).find(row => {
    const ariaLabel = row.getAttribute('aria-label');
    return ariaLabel && ariaLabel.toLowerCase().includes('tottenham');
  });

  if (!tottenhamRow) {
    console.log('[makeTottenhamFirst] ❌ Tottenham row not found');
    return false;
  }
  
  console.log('[makeTottenhamFirst] ✅ Found Tottenham row');

  // Find the table containing Tottenham
  const table = tottenhamRow.closest('table');
  if (!table) {
    console.log('[makeTottenhamFirst] ❌ Table not found');
    return false;
  }

  // Get all team rows (excluding header rows)
  const allRows = Array.from(table.querySelectorAll('tr')).filter(row => {
    // Skip header rows and rows without aria-label
    const ariaLabel = row.getAttribute('aria-label');
    return ariaLabel && !row.querySelector('th');
  });

  if (allRows.length === 0) {
    console.log('[makeTottenhamFirst] ❌ No team rows found');
    return false;
  }

  // Find first place row (first row in the standings, or row with rank "1")
  const firstPlaceRow = allRows[0];
  
  // Add the Champions League banner (blue div with UEFA text) to Tottenham's row (from Arsenal's row)
  const addBlueIndicatorDiv = () => {
    // Find Arsenal's row
    const arsenalRow = allRows.find(row => {
      const ariaLabel = row.getAttribute('aria-label');
      return ariaLabel && ariaLabel.toLowerCase().includes('arsenal');
    });
    
    if (!arsenalRow) {
      console.log('[makeTottenhamFirst] ⚠️ Arsenal row not found, cannot clone Champions League banner');
      return;
    }
    
    // Find the Champions League banner: div.Xne9qe with blue background and span.YCyuEf with "UEFA Champions League" text
    const championsLeagueBanner = Array.from(arsenalRow.querySelectorAll('div.Xne9qe')).find(div => {
      const style = div.getAttribute('style') || '';
      const hasBlueBackground = style.includes('background-color:#4285F4') || 
                                style.includes('background-color: #4285F4') ||
                                style.includes('background-color: rgb(66, 133, 244)');
      const hasChampionsLeagueText = div.querySelector('span.YCyuEf') && 
                                     div.textContent.includes('UEFA Champions League');
      return hasBlueBackground && hasChampionsLeagueText;
    });
    
    if (!championsLeagueBanner) {
      console.log('[makeTottenhamFirst] ⚠️ Champions League banner not found in Arsenal row');
      return;
    }
    
    // Check if Tottenham already has this banner
    const tottenhamHasBanner = Array.from(tottenhamRow.querySelectorAll('div.Xne9qe')).some(div => {
      const style = div.getAttribute('style') || '';
      return (style.includes('background-color:#4285F4') || style.includes('background-color: #4285F4')) &&
             div.querySelector('span.YCyuEf') && div.textContent.includes('UEFA Champions League');
    });
    
    if (tottenhamHasBanner) {
      console.log('[makeTottenhamFirst] ✅ Tottenham already has Champions League banner');
      return;
    }
    
    // Find the parent container (div.Rqwdve) that contains the Champions League banner
    const parentContainer = championsLeagueBanner.closest('div.Rqwdve');
    
    if (!parentContainer) {
      console.log('[makeTottenhamFirst] ⚠️ Parent container (div.Rqwdve) not found');
      return;
    }
    
    // Find the cell where it should be inserted
    const arsenalCell = parentContainer.closest('td');
    if (!arsenalCell) return;
    
    const tottenhamCells = tottenhamRow.querySelectorAll('td, th');
    const arsenalCells = arsenalRow.querySelectorAll('td, th');
    const cellIndex = Array.from(arsenalCells).indexOf(arsenalCell);
    
    if (cellIndex < 0 || cellIndex >= tottenhamCells.length) return;
    
    const tottenhamCell = tottenhamCells[cellIndex];
    
    // Check if Tottenham's cell already has a div.Rqwdve container
    let tottenhamOuterDiv = tottenhamCell.querySelector('div.Rqwdve');
    
    // Clone ONLY the blue indicator (div.Xne9qe), not the entire container
    const clonedBanner = championsLeagueBanner.cloneNode(true);
    
    if (tottenhamOuterDiv) {
      // Clear ALL content from the container to ensure it only has the blue indicator
      tottenhamOuterDiv.innerHTML = '';
      
      // Make sure the container has the same styling as Arsenal's
      tottenhamOuterDiv.className = parentContainer.className;
      tottenhamOuterDiv.setAttribute('style', parentContainer.getAttribute('style') || '');
      
      // Add ONLY the cloned blue indicator
      tottenhamOuterDiv.appendChild(clonedBanner);
      console.log('[makeTottenhamFirst] ✅ Cleared and added Champions League banner to existing container in Tottenham row');
    } else {
      // Create a new div.Rqwdve container matching Arsenal's structure
      const newContainer = document.createElement('div');
      newContainer.className = parentContainer.className;
      newContainer.setAttribute('style', parentContainer.getAttribute('style') || '');
      
      // Add the cloned banner to the new container
      newContainer.appendChild(clonedBanner);
      
      // Find where parentContainer is in Arsenal's cell
      const arsenalChildren = Array.from(arsenalCell.children);
      const containerIndex = arsenalChildren.indexOf(parentContainer);
      
      // Insert at the exact same position in Tottenham's cell
      const tottenhamChildren = Array.from(tottenhamCell.children);
      if (containerIndex === 0) {
        // Insert at the very beginning
        tottenhamCell.insertBefore(newContainer, tottenhamCell.firstChild);
      } else if (containerIndex > 0 && tottenhamChildren.length >= containerIndex) {
        // Insert at the same index - insert before the element at that index
        tottenhamCell.insertBefore(newContainer, tottenhamChildren[containerIndex]);
      } else {
        // If index doesn't match, insert at beginning
        tottenhamCell.insertBefore(newContainer, tottenhamCell.firstChild);
      }
      
      console.log('[makeTottenhamFirst] ✅ Created new Champions League banner container in Tottenham row');
    }
  };
  
  addBlueIndicatorDiv();
  
  // Helper function to find and update rank in a row
  const findAndUpdateRank = (row, newRank) => {
    const allCells = row.querySelectorAll('td, th');
    
    for (let i = 0; i < allCells.length; i++) {
      const cell = allCells[i];
      
      // First, try to find the specific div structure used for rank numbers (class "iU5t0d")
      const rankDiv = cell.querySelector('div.iU5t0d');
      if (rankDiv) {
        const text = rankDiv.textContent.trim();
        if (/^\d+$/.test(text)) {
          // Update only the text node to preserve structure
          const walker = document.createTreeWalker(
            rankDiv,
            NodeFilter.SHOW_TEXT,
            null,
            false
          );
          let textNode = walker.nextNode();
          if (textNode) {
            textNode.textContent = newRank.toString();
            return true;
          }
        }
      }
      
      // Fallback: try to find any div/span that contains just a number (the rank)
      const childElements = cell.querySelectorAll('div, span');
      for (const elem of childElements) {
        const text = elem.textContent.trim();
        if (/^\d+$/.test(text)) {
          // Update only the text node to preserve structure and classes
          const walker = document.createTreeWalker(
            elem,
            NodeFilter.SHOW_TEXT,
            null,
            false
          );
          let textNode = walker.nextNode();
          if (textNode) {
            textNode.textContent = newRank.toString();
            return true;
          } else {
            // Fallback: if no text node found, use textContent but this should preserve structure
            elem.textContent = newRank.toString();
            return true;
          }
        }
      }
      
      // If no nested element found, check if cell itself has just a number
      const cellText = cell.textContent.trim();
      if (/^\d+$/.test(cellText)) {
        // If cell has just a number, try to update the first text node
        const walker = document.createTreeWalker(
          cell,
          NodeFilter.SHOW_TEXT,
          null,
          false
        );
        let textNode = walker.nextNode();
        if (textNode) {
          textNode.textContent = newRank.toString();
          return true;
        }
      }
    }
    
    return false;
  };

  // Get the parent container (tbody, thead, or table itself)
  const parentContainer = tottenhamRow.parentNode;
  
  // Remove Tottenham from its current position
  tottenhamRow.remove();
  
  // Insert Tottenham before the first place row
  parentContainer.insertBefore(tottenhamRow, firstPlaceRow);

  // After insertion, get updated list of team rows in new order
  const updatedRows = Array.from(table.querySelectorAll('tr')).filter(row => {
    const ariaLabel = row.getAttribute('aria-label');
    return ariaLabel && !row.querySelector('th');
  });

  // Update all ranks: Tottenham gets 1, everyone else gets 2, 3, 4, etc.
  updatedRows.forEach((row, index) => {
    if (row === tottenhamRow) {
      // Tottenham is always rank 1
      findAndUpdateRank(row, 1);
    } else {
      // All other teams get rank based on their position (starting from 2)
      findAndUpdateRank(row, index + 1);
    }
  });

  console.log('[makeTottenhamFirst] ✅ Tottenham moved to first place and all teams re-ranked!');
  return true;
}

// Initialize when page is ready
function initMakeTottenhamFirst() {
  function attemptMove() {
    if (document.readyState === 'complete' && document.body) {
      // Wait a bit for the table to render
      setTimeout(() => {
        const success = makeTottenhamFirst();
        if (!success) {
          // Retry if not found immediately
          setTimeout(attemptMove, 500);
        }
      }, 1000);
    } else {
      setTimeout(attemptMove, 100);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attemptMove);
    window.addEventListener('load', attemptMove);
  } else {
    attemptMove();
  }
}

// Make functions available globally for widget
window.makeTottenhamFirst = makeTottenhamFirst;
window.initMakeTottenhamFirst = initMakeTottenhamFirst;

// Auto-run if this script is loaded directly
if (typeof window !== 'undefined') {
  // Check settings before initializing
  chrome.storage.local.get(['tottenhamSettings'], (result) => {
    const settings = result.tottenhamSettings || { enabled: true };
    if (settings.enabled !== false) {
      initMakeTottenhamFirst();
    }
  });
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { makeTottenhamFirst, initMakeTottenhamFirst };
}

})();
