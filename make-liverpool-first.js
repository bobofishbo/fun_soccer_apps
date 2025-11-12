// Function to make Liverpool first place in Premier League standings table
// This works with Google search results tables and similar standings tables

(function() {
'use strict';

function makeLiverpoolFirst() {
  // First, find the Premier League standings table (not match result tables)
  // Standings tables have many rows (10-20 teams) and stats columns
  const allTables = Array.from(document.querySelectorAll('table'));
  let standingsTable = null;
  
  console.log('[makeLiverpoolFirst] Searching', allTables.length, 'tables for standings table...');
  
  for (const table of allTables) {
    const allTableRows = table.querySelectorAll('tr');
    const rowCount = allTableRows.length;
    const tableText = table.textContent || '';
    // Stats can be concatenated (e.g., "MPMatches", "WWins") or separate, so check for both patterns
    const hasStatsColumns = tableText.match(/\b(MP|W|D|L|GF|GA|GD|Pts)\b/i) || 
                           tableText.match(/(MP|W|D|L|GF|GA|GD|Pts)(Matches|Wins|Draws|Losses|Goals|Points)/i) ||
                           tableText.match(/Rank.*Club.*MP/i); // Alternative: check for "Rank" and "Club" and "MP" pattern
    
    console.log('[makeLiverpoolFirst] Table check: rows=', rowCount, ', hasStats=', !!hasStatsColumns, ', text preview:', tableText.substring(0, 100));
    
    if (rowCount >= 8 && hasStatsColumns) {
      standingsTable = table;
      console.log('[makeLiverpoolFirst] ✅ Found standings table with', rowCount, 'rows');
      break;
    }
  }
  
  if (!standingsTable) {
    console.log('[makeLiverpoolFirst] ❌ Premier League standings table not found (checked', allTables.length, 'tables)');
    return false;
  }
  
  console.log('[makeLiverpoolFirst] ✅ Found standings table');

  // Now find Liverpool row within the standings table
  // Use aria-label as it's more reliable than text
  // Also check for "King of Merseyside" since content.js replaces Liverpool text
  const liverpoolRow = Array.from(standingsTable.querySelectorAll('tr')).find(row => {
    // Check aria-label first
    const ariaLabel = row.getAttribute('aria-label');
    if (ariaLabel) {
      const labelLower = ariaLabel.toLowerCase();
      if (labelLower.includes('liverpool') || labelLower.includes('king of merseyside')) {
        return true;
      }
    }
    
    // Fallback: check text content of the row
    const rowText = row.textContent || '';
    const rowTextLower = rowText.toLowerCase();
    return rowTextLower.includes('liverpool') || rowTextLower.includes('king of merseyside');
  });

  if (!liverpoolRow) {
    console.log('[makeLiverpoolFirst] ❌ Liverpool row not found in standings table');
    return false;
  }
  
  console.log('[makeLiverpoolFirst] ✅ Found Liverpool row in standings table');
  
  const table = standingsTable;

  // Get all team rows (excluding header rows)
  const allRows = Array.from(table.querySelectorAll('tr')).filter(row => {
    // Skip header rows and rows without aria-label
    const ariaLabel = row.getAttribute('aria-label');
    return ariaLabel && !row.querySelector('th');
  });

  if (allRows.length === 0) {
    console.log('[makeLiverpoolFirst] ❌ No team rows found');
    return false;
  }

  // Add the Champions League banner (blue div with UEFA text) to Liverpool's row (from Arsenal's row)
  const addBlueIndicatorDiv = () => {
    // Find Arsenal's row
    const arsenalRow = allRows.find(row => {
      const ariaLabel = row.getAttribute('aria-label');
      return ariaLabel && ariaLabel.toLowerCase().includes('arsenal');
    });
    
    if (!arsenalRow) {
      console.log('[makeLiverpoolFirst] ⚠️ Arsenal row not found, cannot clone Champions League banner');
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
      console.log('[makeLiverpoolFirst] ⚠️ Champions League banner not found in Arsenal row');
      return;
    }
    
    // Check if Liverpool already has this banner
    const liverpoolHasBanner = Array.from(liverpoolRow.querySelectorAll('div.Xne9qe')).some(div => {
      const style = div.getAttribute('style') || '';
      return (style.includes('background-color:#4285F4') || style.includes('background-color: #4285F4')) &&
             div.querySelector('span.YCyuEf') && div.textContent.includes('UEFA Champions League');
    });
    
    if (liverpoolHasBanner) {
      console.log('[makeLiverpoolFirst] ✅ Liverpool already has Champions League banner');
      return;
    }
    
    // Find the parent container (div.Rqwdve) that contains the Champions League banner
    const parentContainer = championsLeagueBanner.closest('div.Rqwdve');
    
    if (!parentContainer) {
      console.log('[makeLiverpoolFirst] ⚠️ Parent container (div.Rqwdve) not found');
      return;
    }
    
    // Find the cell where it should be inserted
    const arsenalCell = parentContainer.closest('td');
    if (!arsenalCell) return;
    
    const liverpoolCells = liverpoolRow.querySelectorAll('td, th');
    const arsenalCells = arsenalRow.querySelectorAll('td, th');
    const cellIndex = Array.from(arsenalCells).indexOf(arsenalCell);
    
    if (cellIndex < 0 || cellIndex >= liverpoolCells.length) return;
    
    const liverpoolCell = liverpoolCells[cellIndex];
    
    // Check if Liverpool's cell already has a div.Rqwdve container
    let liverpoolOuterDiv = liverpoolCell.querySelector('div.Rqwdve');
    
    // Clone ONLY the blue indicator (div.Xne9qe), not the entire container
    const clonedBanner = championsLeagueBanner.cloneNode(true);
    
    if (liverpoolOuterDiv) {
      // Clear ALL content from the container to ensure it only has the blue indicator
      liverpoolOuterDiv.innerHTML = '';
      
      // Make sure the container has the same styling as Arsenal's
      liverpoolOuterDiv.className = parentContainer.className;
      liverpoolOuterDiv.setAttribute('style', parentContainer.getAttribute('style') || '');
      
      // Add ONLY the cloned blue indicator
      liverpoolOuterDiv.appendChild(clonedBanner);
      console.log('[makeLiverpoolFirst] ✅ Cleared and added Champions League banner to existing container in Liverpool row');
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
      
      // Insert at the exact same position in Liverpool's cell
      const liverpoolChildren = Array.from(liverpoolCell.children);
      if (containerIndex === 0) {
        // Insert at the very beginning
        liverpoolCell.insertBefore(newContainer, liverpoolCell.firstChild);
      } else if (containerIndex > 0 && liverpoolChildren.length >= containerIndex) {
        // Insert at the same index - insert before the element at that index
        liverpoolCell.insertBefore(newContainer, liverpoolChildren[containerIndex]);
      } else {
        // If index doesn't match, insert at beginning
        liverpoolCell.insertBefore(newContainer, liverpoolCell.firstChild);
      }
      
      console.log('[makeLiverpoolFirst] ✅ Created new Champions League banner container in Liverpool row');
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

  // Check if Liverpool is already first
  if (allRows[0] === liverpoolRow) {
    console.log('[makeLiverpoolFirst] ✅ Liverpool is already first place');
    // Still update ranks to ensure consistency
  } else {
    // Find first place row (first row in the standings, or row with rank "1")
    const firstPlaceRow = allRows[0];
    
    // Get the parent container (tbody, thead, or table itself)
    const parentContainer = liverpoolRow.parentNode;
    
    // Verify firstPlaceRow is still a child of parentContainer
    if (!parentContainer.contains(firstPlaceRow)) {
      console.log('[makeLiverpoolFirst] ⚠️ First place row is not in the same container, using first row of parent');
      const parentRows = Array.from(parentContainer.querySelectorAll('tr'));
      if (parentRows.length > 0) {
        // Remove Liverpool from its current position
        liverpoolRow.remove();
        parentContainer.insertBefore(liverpoolRow, parentRows[0]);
      } else {
        // Remove Liverpool from its current position
        liverpoolRow.remove();
        parentContainer.appendChild(liverpoolRow);
      }
    } else {
      // Remove Liverpool from its current position
      liverpoolRow.remove();
      
      // Insert Liverpool before the first place row
      parentContainer.insertBefore(liverpoolRow, firstPlaceRow);
    }
  }

  // After insertion, get updated list of team rows in new order
  const updatedRows = Array.from(table.querySelectorAll('tr')).filter(row => {
    const ariaLabel = row.getAttribute('aria-label');
    return ariaLabel && !row.querySelector('th');
  });

  // Update all ranks: Liverpool gets 1, everyone else gets 2, 3, 4, etc.
  updatedRows.forEach((row, index) => {
    if (row === liverpoolRow) {
      // Liverpool is always rank 1
      findAndUpdateRank(row, 1);
    } else {
      // All other teams get rank based on their position (starting from 2)
      findAndUpdateRank(row, index + 1);
    }
  });

  console.log('[makeLiverpoolFirst] ✅ Liverpool moved to first place and all teams re-ranked!');
  return true;
}

// Initialize when page is ready
function initMakeLiverpoolFirst() {
  function attemptMove() {
    if (document.readyState === 'complete' && document.body) {
      // Wait a bit for the table to render
      setTimeout(() => {
        const success = makeLiverpoolFirst();
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
window.makeLiverpoolFirst = makeLiverpoolFirst;
window.initMakeLiverpoolFirst = initMakeLiverpoolFirst;

// Auto-run if this script is loaded directly
if (typeof window !== 'undefined') {
  // Check settings before initializing
  chrome.storage.local.get(['liverpoolSettings'], (result) => {
    const settings = result.liverpoolSettings || { enabled: true };
    if (settings.enabled !== false) {
      initMakeLiverpoolFirst();
    }
  });
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { makeLiverpoolFirst, initMakeLiverpoolFirst };
}

})();

