// Replace Liverpool's match scores with 10
(function() {
'use strict';

// Track processed match blocks to avoid re-processing
const processedMatches = new WeakSet();
// Track processed score elements to avoid re-processing
const processedScores = new WeakSet();

// Liverpool team name variations (after content.js replacement)
const liverpoolNames = ['King of Merseyside', 'Liverpool', 'Liverpool F.C.', 'Liverpool FC'];

// Check if a text node contains a Liverpool team name
function isLiverpoolTeam(text) {
  if (!text) return false;
  const normalizedText = text.trim();
  return liverpoolNames.some(name => 
    normalizedText.toLowerCase().includes(name.toLowerCase())
  );
}

// Find the parent match container for a given element
function findMatchContainer(element) {
  let current = element;
  let depth = 0;
  const maxDepth = 15;
  
  while (current && depth < maxDepth) {
    // Look for common match container patterns
    const classList = current.className || '';
    const classStr = typeof classList === 'string' ? classList : Array.from(classList).join(' ');
    
    // Common patterns for match containers in Google search results
    if (classStr.includes('match') || 
        classStr.includes('fixture') ||
        classStr.includes('imspo_mt') ||
        current.getAttribute('data-ved') ||
        (current.tagName === 'DIV' && current.querySelector('[class*="score"]'))) {
      return current;
    }
    
    current = current.parentElement;
    depth++;
  }
  
  return null;
}

// Find all score elements in a match container
function findScoreElements(matchContainer) {
  const scores = [];
  
  // First, check if this is a standings table - if so, don't look for scores
  const table = matchContainer.closest('table');
  if (table) {
    const allTableRows = table.querySelectorAll('tr');
    const tableText = table.textContent || '';
    const hasStatsColumns = tableText.match(/\b(MP|W|D|L|GF|GA|GD|Pts)\b/i) || 
                           tableText.match(/(MP|W|D|L|GF|GA|GD|Pts)(Matches|Wins|Draws|Losses|Goals|Points)/i) ||
                           tableText.match(/Rank.*Club.*MP/i);
    if (allTableRows.length >= 8 && hasStatsColumns) {
      // This is a standings table, return empty array
      return [];
    }
  }
  
  // Look for score elements with class "imspo_mt_tt-w" (Google's match score class)
  // This is the most reliable selector based on the DOM structure
  const scoreSelectors = [
    'div.imspo_mt_tt-w',  // Primary: Google's match score class
    '[class*="imspo_mt_tt-w"]',  // Fallback with contains
    '[class*="score"]',
    '[class*="imspo_mt"]',
    '[class*="tt-w"]',
    'div[class*="result"]',
    'span[class*="score"]'
  ];
  
  for (const selector of scoreSelectors) {
    try {
      const elements = matchContainer.querySelectorAll(selector);
      elements.forEach(el => {
        const text = el.textContent.trim();
        // Check if it's a numeric score (1-2 digits typically)
        // Exclude values that are too high (like MP values which can be 11, 12, etc.)
        // Match scores are typically 0-10
        if (/^\d{1,2}$/.test(text)) {
          const num = parseInt(text, 10);
          // Only include if it's a reasonable match score (0-10)
          // This helps exclude MP values and other stats
          if (num >= 0 && num <= 10) {
            // Avoid duplicates
            if (!scores.includes(el)) {
              scores.push(el);
            }
          }
        }
      });
    } catch (e) {
      // Invalid selector, skip
    }
  }
  
  // Fallback: find any element with just a number that's near team names
  if (scores.length === 0) {
    const allElements = matchContainer.querySelectorAll('div, span, td');
    allElements.forEach(el => {
      const text = el.textContent.trim();
      if (/^\d{1,2}$/.test(text)) {
        const num = parseInt(text, 10);
        // Only include if it's a reasonable match score (0-10)
        // This helps exclude MP values and other stats
        if (num >= 0 && num <= 10) {
          // Check if it's positioned near team names (heuristic)
          const parent = el.parentElement;
          if (parent) {
            const parentText = parent.textContent || '';
            if (parentText.match(/vs|v\.|v /i) || parentText.includes('King of Merseyside') || parentText.includes('Liverpool')) {
              if (!scores.includes(el)) {
                scores.push(el);
              }
            }
          }
        }
      }
    });
  }
  
  return scores;
}

// Find team name elements in a match container
function findTeamElements(matchContainer) {
  const teams = [];
  
  // First, try to find teams in table cells (td) - most reliable for match results
  const tableCells = matchContainer.querySelectorAll('td');
  tableCells.forEach(cell => {
    const text = cell.textContent.trim();
    if (text.length > 0 && text.length < 50) {
      // Check if it looks like a team name
      if (isLiverpoolTeam(text) || 
          text.match(/^[A-Z][a-z]+(\s+[A-Z][a-z]+)*$/) || // Capitalized words
          text.match(/^[A-Z][a-z]+\s+(F\.?C\.?|United|City|FC)$/i)) { // Team name patterns
        // Find the actual text node or element containing the team name
        const walker = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT, null, false);
        let textNode = walker.nextNode();
        while (textNode) {
          const nodeText = textNode.textContent.trim();
          if (nodeText === text || isLiverpoolTeam(nodeText) || 
              (text.length > 3 && nodeText.length > 3 && text.includes(nodeText))) {
            teams.push({ element: textNode.parentElement || cell, text: text });
            break;
          }
          textNode = walker.nextNode();
        }
        if (!teams.some(t => t.text === text)) {
          teams.push({ element: cell, text: text });
        }
      }
    }
  });
  
  // Fallback: search all elements
  if (teams.length < 2) {
    const allElements = matchContainer.querySelectorAll('div, span, a, td');
    allElements.forEach(el => {
      const text = el.textContent.trim();
      if (text.length > 0 && text.length < 50) {
        // Check if it contains team name indicators or is near "vs"
        const parentText = (el.parentElement?.textContent || '').toLowerCase();
        if (parentText.includes('vs') || parentText.includes('v.') || 
            isLiverpoolTeam(text) || 
            text.match(/^[A-Z][a-z]+(\s+[A-Z][a-z]+)*$/)) {
          // Avoid duplicates
          if (!teams.some(t => t.text === text)) {
            teams.push({ element: el, text: text });
          }
        }
      }
    });
  }
  
  return teams;
}

// Process a single match container
function processMatchContainer(matchContainer) {
  if (processedMatches.has(matchContainer)) {
    return false;
  }
  
  // CRITICAL: Skip if this is a Premier League standings table
  // Check if container is inside or is a standings table
  const table = matchContainer.closest('table');
  if (table) {
    const allTableRows = table.querySelectorAll('tr');
    const rowCount = allTableRows.length;
    const tableText = table.textContent || '';
    // Check for standings table indicators: many rows + stats columns
    const hasStatsColumns = tableText.match(/\b(MP|W|D|L|GF|GA|GD|Pts)\b/i) || 
                           tableText.match(/(MP|W|D|L|GF|GA|GD|Pts)(Matches|Wins|Draws|Losses|Goals|Points)/i) ||
                           tableText.match(/Rank.*Club.*MP/i);
    
    if (rowCount >= 8 && hasStatsColumns) {
      // This is a standings table, skip it
      return false;
    }
  }
  
  // Also check the container itself
  const containerRows = matchContainer.querySelectorAll('tr');
  if (containerRows.length >= 8) {
    const containerText = matchContainer.textContent || '';
    const hasStatsColumns = containerText.match(/\b(MP|W|D|L|GF|GA|GD|Pts)\b/i) || 
                           containerText.match(/(MP|W|D|L|GF|GA|GD|Pts)(Matches|Wins|Draws|Losses|Goals|Points)/i) ||
                           containerText.match(/Rank.*Club.*MP/i);
    if (hasStatsColumns) {
      // This is a standings table, skip it
      return false;
    }
  }
  
  const containerText = matchContainer.textContent || '';
  
  // Check if this match involves Liverpool
  if (!isLiverpoolTeam(containerText)) {
    return false;
  }
  
  // Find team elements and score elements
  const teams = findTeamElements(matchContainer);
  let scores = findScoreElements(matchContainer);
  
  if (scores.length === 0) {
    return false;
  }
  
  // Sort scores by vertical position (top to bottom) to ensure consistent indexing
  // scores[0] = top score, scores[1] = bottom score
  if (scores.length >= 2) {
    scores = scores.sort((a, b) => {
      const rectA = a.getBoundingClientRect();
      const rectB = b.getBoundingClientRect();
      return rectA.top - rectB.top; // Sort by top Y coordinate
    });
  }
  
  // Try to match teams with scores
  // Common pattern: Team1 vs Team2, Score1 - Score2
  // Or: Team1 Score1, Team2 Score2
  
  let liverpoolScoreIndex = -1;
  let liverpoolTeamIndex = -1;
  
  // First, find which team is Liverpool
  for (let i = 0; i < teams.length; i++) {
    if (isLiverpoolTeam(teams[i].text)) {
      liverpoolTeamIndex = i;
      break;
    }
  }
  
  if (liverpoolTeamIndex === -1) {
    return false; // Liverpool team not found in teams list
  }
  
  const liverpoolTeamElement = teams[liverpoolTeamIndex].element;
  const liverpoolTeamRect = liverpoolTeamElement.getBoundingClientRect();
  
  // Strategy 1: Match each score to its corresponding team by DOM structure and position
  // This handles both top and bottom row structures correctly
  if (scores.length >= 2) {
    // Find opponent team for comparison
    let opponentTeamElement = null;
    let opponentTeamRect = null;
    for (let i = 0; i < teams.length; i++) {
      if (!isLiverpoolTeam(teams[i].text)) {
        opponentTeamElement = teams[i].element;
        opponentTeamRect = opponentTeamElement.getBoundingClientRect();
        break;
      }
    }
    
    if (opponentTeamElement && opponentTeamRect) {
      // For each score, determine which team it's paired with
      // Check DOM structure: find the closest common ancestor that contains a team
      const scoreTeamPairs = scores.map((scoreEl, scoreIdx) => {
        const scoreRect = scoreEl.getBoundingClientRect();
        
        // Find the closest common ancestor that contains either team
        let ancestor = scoreEl.parentElement;
        let depth = 0;
        let liverpoolAncestor = null;
        let opponentAncestor = null;
        
        while (ancestor && depth < 10) {
          if (ancestor.contains(liverpoolTeamElement) && !liverpoolAncestor) {
            liverpoolAncestor = ancestor;
          }
          if (ancestor.contains(opponentTeamElement) && !opponentAncestor) {
            opponentAncestor = ancestor;
          }
          if (liverpoolAncestor && opponentAncestor) break;
          ancestor = ancestor.parentElement;
          depth++;
        }
        
        // Calculate distances to both teams
        const distanceToLiverpool = Math.abs(scoreRect.left - liverpoolTeamRect.left) + 
                                    Math.abs(scoreRect.top - liverpoolTeamRect.top);
        const distanceToOpponent = Math.abs(scoreRect.left - opponentTeamRect.left) + 
                                  Math.abs(scoreRect.top - opponentTeamRect.top);
        
        // Check if score is in the same row/container as a team
        // Find the row container for each element - prioritize table rows (tr)
        const getRowContainer = (el) => {
          let current = el;
          let depth = 0;
          while (current && depth < 10) {
            const tag = current.tagName?.toLowerCase();
            const className = current.className || '';
            const classStr = typeof className === 'string' ? className : Array.from(className).join(' ');
            
            // First priority: table rows (tr) - this is the most reliable for match results
            if (tag === 'tr') {
              return current;
            }
            
            // Second priority: divs with match/row indicators
            if (tag === 'div' && (
                classStr.includes('L5Kkcd') ||  // Google's match row class
                classStr.includes('row') || 
                classStr.includes('match') ||
                classStr.includes('imspo_mt'))) {
              return current;
            }
            
            current = current.parentElement;
            depth++;
          }
          return null;
        };
        
        const scoreRow = getRowContainer(scoreEl);
        const liverpoolRow = getRowContainer(liverpoolTeamElement);
        const opponentRow = getRowContainer(opponentTeamElement);
        
        // Check if in same row container
        let inLiverpoolRow = scoreRow && liverpoolRow && scoreRow === liverpoolRow;
        let inOpponentRow = scoreRow && opponentRow && scoreRow === opponentRow;
        
        // Also check if score and team are in the same table cell (td) or same table row
        if (!inLiverpoolRow && !inOpponentRow) {
          const scoreCell = scoreEl.closest('td, th');
          const liverpoolCell = liverpoolTeamElement.closest('td, th');
          const opponentCell = opponentTeamElement.closest('td, th');
          
          // Check if score is in the same cell as a team
          if (scoreCell && liverpoolCell && scoreCell === liverpoolCell) {
            inLiverpoolRow = true;
          } else if (scoreCell && opponentCell && scoreCell === opponentCell) {
            inOpponentRow = true;
          } else if (scoreCell && liverpoolCell) {
            // Check if they're in the same table row (tr)
            const scoreRowEl = scoreCell.closest('tr');
            const liverpoolRowEl = liverpoolCell.closest('tr');
            if (scoreRowEl && liverpoolRowEl && scoreRowEl === liverpoolRowEl) {
              // Same table row - check cell positions
              const scoreCellIndex = Array.from(scoreRowEl.children).indexOf(scoreCell);
              const liverpoolCellIndex = Array.from(liverpoolRowEl.children).indexOf(liverpoolCell);
              const opponentCellIndex = opponentCell ? Array.from(scoreRowEl.children).indexOf(opponentCell) : -1;
              
              // If score cell is closer to Liverpool's cell than opponent's cell, it's Liverpool's score
              if (opponentCellIndex === -1 || 
                  Math.abs(scoreCellIndex - liverpoolCellIndex) < Math.abs(scoreCellIndex - opponentCellIndex)) {
                inLiverpoolRow = true;
              } else if (opponentCellIndex !== -1) {
                inOpponentRow = true;
              }
            }
          }
          
          // Also check if score and team share a common parent that's a table row
          // This handles cases where they're in different cells but same row structure
          if (!inLiverpoolRow && !inOpponentRow) {
            let scoreParent = scoreEl.parentElement;
            let liverpoolParent = liverpoolTeamElement.parentElement;
            let depth = 0;
            while (scoreParent && liverpoolParent && depth < 5) {
              if (scoreParent === liverpoolParent && scoreParent.tagName?.toLowerCase() === 'tr') {
                inLiverpoolRow = true;
                break;
              }
              scoreParent = scoreParent.parentElement;
              liverpoolParent = liverpoolParent.parentElement;
              depth++;
            }
          }
        }
        
        return {
          scoreIndex: scoreIdx,
          scoreElement: scoreEl,
          distanceToLiverpool,
          distanceToOpponent,
          inLiverpoolRow,
          inOpponentRow,
          liverpoolAncestor: liverpoolAncestor !== null,
          opponentAncestor: opponentAncestor !== null
        };
      });
      
      // Determine which score belongs to Liverpool
      // Priority: 1) Same row/container, 2) Closer distance, 3) Same ancestor
      let foundByRowDetection = false;
      
      for (const pair of scoreTeamPairs) {
        if (pair.inLiverpoolRow && !pair.inOpponentRow) {
          liverpoolScoreIndex = pair.scoreIndex;
          foundByRowDetection = true;
          break;
        }
      }
      
      // Also check if one score is clearly in Liverpool row and the other is in opponent row
      if (!foundByRowDetection) {
        const liverpoolPair = scoreTeamPairs.find(p => p.inLiverpoolRow);
        const opponentPair = scoreTeamPairs.find(p => p.inOpponentRow);
        if (liverpoolPair && opponentPair && liverpoolPair.scoreIndex !== opponentPair.scoreIndex) {
          liverpoolScoreIndex = liverpoolPair.scoreIndex;
          foundByRowDetection = true;
        }
      }
      
      // If not found by row, use distance
      if (liverpoolScoreIndex === -1) {
        const liverpoolPair = scoreTeamPairs.find(p => 
          p.distanceToLiverpool < p.distanceToOpponent &&
          p.distanceToLiverpool < scoreTeamPairs.find(p2 => p2.scoreIndex !== p.scoreIndex)?.distanceToLiverpool
        );
        
        if (liverpoolPair) {
          liverpoolScoreIndex = liverpoolPair.scoreIndex;
        }
      }
      
      // Final fallback: use vertical position
      if (liverpoolScoreIndex === -1) {
        const liverpoolIsTopRow = liverpoolTeamRect.top < opponentTeamRect.top;
        liverpoolScoreIndex = liverpoolIsTopRow ? 0 : 1;
      }
      
      // Store whether we found it by row detection for later use in pre-validation
      if (foundByRowDetection) {
        scores[liverpoolScoreIndex]._foundByRowDetection = true;
      }
    } else {
      // No opponent found, use team index as fallback
      liverpoolScoreIndex = liverpoolTeamIndex < scores.length ? liverpoolTeamIndex : 0;
    }
  } else if (scores.length === 1) {
    // Only one score - check if it's associated with Liverpool's team element
    const scoreElement = scores[0];
    const scoreRect = scoreElement.getBoundingClientRect();
    
    // Check if score is in the same parent/container as Liverpool team
    let scoreParent = scoreElement.parentElement;
    let liverpoolParent = liverpoolTeamElement.parentElement;
    let depth = 0;
    
    while (scoreParent && liverpoolParent && depth < 5) {
      if (scoreParent === liverpoolParent) {
        liverpoolScoreIndex = 0;
        break;
      }
      scoreParent = scoreParent.parentElement;
      liverpoolParent = liverpoolParent.parentElement;
      depth++;
    }
    
    // If not in same parent, check horizontal position (left team = left score typically)
    if (liverpoolScoreIndex === -1) {
      const horizontalDistance = Math.abs(scoreRect.left - liverpoolTeamRect.left);
      if (horizontalDistance < 200) {
        liverpoolScoreIndex = 0;
      }
    }
  }
  
  // Strategy 2: If still not found, use DOM structure and position
  if (liverpoolScoreIndex === -1) {
    // Find the score that's closest to Liverpool's team element and on the same side
    let closestScore = null;
    let minDistance = Infinity;
    
    scores.forEach((scoreEl, scoreIdx) => {
      const scoreRect = scoreEl.getBoundingClientRect();
      
      // Calculate distance
      const horizontalDistance = Math.abs(scoreRect.left - liverpoolTeamRect.left);
      const verticalDistance = Math.abs(scoreRect.top - liverpoolTeamRect.top);
      const totalDistance = horizontalDistance + verticalDistance;
      
      // Prefer scores that are:
      // 1. On the same horizontal side (left/right) as Liverpool team
      // 2. Vertically aligned (similar top position)
      const sameHorizontalSide = (scoreRect.left < liverpoolTeamRect.right && 
                                   liverpoolTeamRect.left < scoreRect.right) ||
                                  Math.abs(scoreRect.left - liverpoolTeamRect.left) < 100;
      const verticallyAligned = Math.abs(scoreRect.top - liverpoolTeamRect.top) < 50;
      
      const score = totalDistance;
      if (score < minDistance && (sameHorizontalSide || verticallyAligned)) {
        minDistance = score;
        closestScore = scoreEl;
        liverpoolScoreIndex = scoreIdx;
      }
    });
    
    // If we found a reasonably close score, use it
    if (minDistance < 300) {
      // Good match found
    } else {
      // Too far, don't use this strategy
      liverpoolScoreIndex = -1;
    }
  }
  
  // Strategy 3: Final fallback - use text order after "vs" separator
  if (liverpoolScoreIndex === -1) {
    const containerTextLower = containerText.toLowerCase();
    const vsIndex = Math.max(
      containerTextLower.indexOf(' vs '),
      containerTextLower.indexOf(' v. '),
      containerTextLower.indexOf(' v ')
    );
    
    if (vsIndex !== -1) {
      const beforeVs = containerTextLower.substring(0, vsIndex);
      const afterVs = containerTextLower.substring(vsIndex);
      
      const liverpoolBeforeVs = beforeVs.includes('king of merseyside') || beforeVs.includes('liverpool');
      const liverpoolAfterVs = afterVs.includes('king of merseyside') || afterVs.includes('liverpool');
      
      // Find scores
      const scoresBeforeVs = beforeVs.match(/\b(\d{1,2})\b/g) || [];
      const scoresAfterVs = afterVs.match(/\b(\d{1,2})\b/g) || [];
      
      // If Liverpool is before "vs", first score is likely Liverpool's
      // If Liverpool is after "vs", second score is likely Liverpool's
      if (liverpoolBeforeVs && !liverpoolAfterVs && scores.length >= 1) {
        liverpoolScoreIndex = 0;
      } else if (!liverpoolBeforeVs && liverpoolAfterVs && scores.length >= 2) {
        liverpoolScoreIndex = 1;
      }
    }
  }
  
  // Update Liverpool's score to 10
  if (liverpoolScoreIndex >= 0 && liverpoolScoreIndex < scores.length) {
    const scoreElement = scores[liverpoolScoreIndex];
    
    // If we found the score using row detection, trust that result and skip strict distance validation
    // Row detection is more reliable than distance when elements might overlap
    const foundByRowDetection = scoreElement._foundByRowDetection === true;
    
    // CRITICAL: Pre-validation - MUST verify which score belongs to Liverpool before updating
    // This is the most important check to prevent replacing opponent scores
    // BUT: If we found it by row detection, we can be more lenient
    if (scores.length >= 2 && !foundByRowDetection) {
      const score0Rect = scores[0].getBoundingClientRect();
      const score1Rect = scores[1].getBoundingClientRect();
      
      // Find opponent team
      let opponentTeamElement = null;
      for (let i = 0; i < teams.length; i++) {
        if (!isLiverpoolTeam(teams[i].text)) {
          opponentTeamElement = teams[i].element;
          break;
        }
      }
      
      if (!opponentTeamElement) {
        return false;
      }
      
      const opponentRect = opponentTeamElement.getBoundingClientRect();
      
      // Calculate distances from each score to both teams
      const distance0ToLiverpool = Math.abs(score0Rect.left - liverpoolTeamRect.left) + 
                                    Math.abs(score0Rect.top - liverpoolTeamRect.top);
      const distance0ToOpponent = Math.abs(score0Rect.left - opponentRect.left) + 
                                    Math.abs(score0Rect.top - opponentRect.top);
      
      const distance1ToLiverpool = Math.abs(score1Rect.left - liverpoolTeamRect.left) + 
                                    Math.abs(score1Rect.top - liverpoolTeamRect.top);
      const distance1ToOpponent = Math.abs(score1Rect.left - opponentRect.left) + 
                                    Math.abs(score1Rect.top - opponentRect.top);
      
      // Determine which score belongs to which team
      // Score 0 belongs to Liverpool if it's closer to Liverpool AND closer to Liverpool than score 1
      const score0BelongsToLiverpool = distance0ToLiverpool < distance0ToOpponent && 
                                        distance0ToLiverpool < distance1ToLiverpool;
      
      // Score 1 belongs to Liverpool if it's closer to Liverpool AND closer to Liverpool than score 0
      const score1BelongsToLiverpool = distance1ToLiverpool < distance1ToOpponent && 
                                        distance1ToLiverpool < distance0ToLiverpool;
      
      // CRITICAL CHECK: Only proceed if we have a clear winner
      if (!score0BelongsToLiverpool && !score1BelongsToLiverpool) {
        return false;
      }
      
      // Determine the correct score index based on distance analysis
      let correctScoreIndex = -1;
      if (score0BelongsToLiverpool && !score1BelongsToLiverpool) {
        correctScoreIndex = 0;
      } else if (score1BelongsToLiverpool && !score0BelongsToLiverpool) {
        correctScoreIndex = 1;
      } else {
        // Both seem to belong to Liverpool? This shouldn't happen, skip
        return false;
      }
      
      // If our determined index doesn't match the correct one, use the correct one
      if (liverpoolScoreIndex !== correctScoreIndex) {
        liverpoolScoreIndex = correctScoreIndex;
      }
      
      // Final safety check: verify the selected score is actually closer to Liverpool
      const selectedScoreRect = scores[liverpoolScoreIndex].getBoundingClientRect();
      const selectedDistanceToLiverpool = Math.abs(selectedScoreRect.left - liverpoolTeamRect.left) + 
                                          Math.abs(selectedScoreRect.top - liverpoolTeamRect.top);
      const selectedDistanceToOpponent = Math.abs(selectedScoreRect.left - opponentRect.left) + 
                                          Math.abs(selectedScoreRect.top - opponentRect.top);
      
      if (selectedDistanceToLiverpool >= selectedDistanceToOpponent) {
        return false;
      }
    } else if (foundByRowDetection) {
      // Found by row detection - do a lighter validation
      const selectedScoreRect = scoreElement.getBoundingClientRect();
      const selectedDistanceToLiverpool = Math.abs(selectedScoreRect.left - liverpoolTeamRect.left) + 
                                          Math.abs(selectedScoreRect.top - liverpoolTeamRect.top);
      
      // Find opponent team for comparison
      let opponentTeamElement = null;
      for (let i = 0; i < teams.length; i++) {
        if (!isLiverpoolTeam(teams[i].text)) {
          opponentTeamElement = teams[i].element;
          break;
        }
      }
      
      if (opponentTeamElement) {
        const opponentRect = opponentTeamElement.getBoundingClientRect();
        const selectedDistanceToOpponent = Math.abs(selectedScoreRect.left - opponentRect.left) + 
                                            Math.abs(selectedScoreRect.top - opponentRect.top);
        
        // Only reject if significantly closer to opponent (more than 50px difference)
        if (selectedDistanceToOpponent < selectedDistanceToLiverpool - 50) {
          return false;
        }
      }
    }
    
    // Verify this score is actually associated with Liverpool by checking DOM structure
    // In match results, scores are typically paired with their team in the same row/cell structure
    let isAssociated = false;
    
    // Strategy 1: Check if score and Liverpool team are in the same table cell or row section
    // Find the closest common ancestor that contains both
    let scoreAncestor = scoreElement;
    let liverpoolAncestor = liverpoolTeamElement;
    const commonAncestors = [];
    
    // Collect all ancestors of the score element
    while (scoreAncestor) {
      commonAncestors.push(scoreAncestor);
      scoreAncestor = scoreAncestor.parentElement;
    }
    
    // Check if Liverpool team is a descendant of any score ancestor
    for (const ancestor of commonAncestors) {
      if (ancestor.contains(liverpoolTeamElement) && ancestor !== document.body) {
        // Check if this ancestor also contains the opponent's team
        // If it contains both teams, we need to check which team is closer to the score
        const allTeamsInAncestor = Array.from(ancestor.querySelectorAll('*')).filter(el => {
          const text = el.textContent?.trim() || '';
          return text.length > 0 && text.length < 50 && 
                 (isLiverpoolTeam(text) || teams.some(t => t.text === text && !isLiverpoolTeam(t.text)));
        });
        
        // If this ancestor only contains Liverpool (or Liverpool is the only team), it's associated
        const hasOpponent = Array.from(teams).some(t => 
          !isLiverpoolTeam(t.text) && ancestor.contains(t.element)
        );
        
        if (!hasOpponent || allTeamsInAncestor.length === 1) {
          isAssociated = true;
          break;
        }
      }
    }
    
    // Strategy 2: For each score, determine which team it's paired with
    // Compare distances to both teams to see which score is closer to Liverpool
    if (!isAssociated && scores.length >= 2) {
      const scoreRect = scoreElement.getBoundingClientRect();
      const distanceToLiverpool = Math.abs(scoreRect.left - liverpoolTeamRect.left) + 
                                  Math.abs(scoreRect.top - liverpoolTeamRect.top);
      
      // Find opponent team and calculate distance to it
      let minDistanceToOpponent = Infinity;
      let opponentTeamElement = null;
      for (let i = 0; i < teams.length; i++) {
        if (!isLiverpoolTeam(teams[i].text)) {
          const opponentRect = teams[i].element.getBoundingClientRect();
          const distance = Math.abs(scoreRect.left - opponentRect.left) + 
                          Math.abs(scoreRect.top - opponentRect.top);
          if (distance < minDistanceToOpponent) {
            minDistanceToOpponent = distance;
            opponentTeamElement = teams[i].element;
          }
        }
      }
      
      // Also check the other score to see which team it's closer to
      const otherScoreIndex = liverpoolScoreIndex === 0 ? 1 : 0;
      const otherScoreElement = scores[otherScoreIndex];
      const otherScoreRect = otherScoreElement.getBoundingClientRect();
      const otherDistanceToLiverpool = Math.abs(otherScoreRect.left - liverpoolTeamRect.left) + 
                                      Math.abs(otherScoreRect.top - liverpoolTeamRect.top);
      const otherDistanceToOpponent = opponentTeamElement ? 
        Math.abs(otherScoreRect.left - opponentTeamElement.getBoundingClientRect().left) + 
        Math.abs(otherScoreRect.top - opponentTeamElement.getBoundingClientRect().top) : Infinity;
      
      // Only associate if:
      // 1. This score is closer to Liverpool than to opponent, AND
      // 2. The other score is closer to opponent than to Liverpool
      if (distanceToLiverpool < minDistanceToOpponent && 
          otherDistanceToOpponent < otherDistanceToLiverpool) {
        isAssociated = true;
      } else if (distanceToLiverpool < minDistanceToOpponent - 30) {
        // If significantly closer to Liverpool, associate
        isAssociated = true;
      }
    }
    
    // Strategy 3: Check DOM order - if Liverpool team appears before score in DOM, and score appears before opponent team
    if (!isAssociated) {
      const allElements = Array.from(matchContainer.querySelectorAll('*'));
      const scoreIndex = allElements.indexOf(scoreElement);
      const liverpoolIndex = allElements.indexOf(liverpoolTeamElement);
      
      if (scoreIndex !== -1 && liverpoolIndex !== -1) {
        // Check if there's an opponent team between Liverpool and the score
        let opponentBetween = false;
        for (let i = 0; i < teams.length; i++) {
          if (!isLiverpoolTeam(teams[i].text)) {
            const opponentIndex = allElements.indexOf(teams[i].element);
            if (opponentIndex !== -1) {
              // Check if opponent is between Liverpool and score
              if ((liverpoolIndex < opponentIndex && opponentIndex < scoreIndex) ||
                  (scoreIndex < opponentIndex && opponentIndex < liverpoolIndex)) {
                opponentBetween = true;
                break;
              }
            }
          }
        }
        
        // If no opponent between, and they're close in DOM order, associate
        if (!opponentBetween && Math.abs(scoreIndex - liverpoolIndex) < 20) {
          isAssociated = true;
        }
      }
    }
    
    // For 2+ scores, we've already done strict pre-validation, so skip additional checks
    // For single scores, use the association check
    if (scores.length >= 2) {
      // Already validated in pre-validation, proceed
    } else if (!isAssociated) {
      return false;
    }
    
    // Check if we've already processed this score element
    if (processedScores.has(scoreElement)) {
      return false;
    }
    
    // Remove any winner indicators (triangle SVGs) from the match container
    const winnerIndicators = matchContainer.querySelectorAll('svg.imspo_mt_triangle, svg[class*="triangle"], svg[aria-label="Winner"]');
    winnerIndicators.forEach(indicator => {
      const parentTd = indicator.closest('td');
      if (parentTd) {
        // Check if the td only contains the winner indicator
        const tdChildren = Array.from(parentTd.children);
        const hasOnlyWinnerIndicator = tdChildren.length === 1 && tdChildren[0] === indicator;
        if (hasOnlyWinnerIndicator || parentTd.textContent.trim() === '') {
          // Remove the entire td if it only contains the indicator
          parentTd.remove();
        } else {
          // Just remove the indicator
          indicator.remove();
        }
      } else {
        indicator.remove();
      }
    });
    
    // Also remove any winner indicator cells (td with class imspo_mt_rg)
    const winnerCells = matchContainer.querySelectorAll('td.imspo_mt_rg, td[class*="imspo_mt_rg"]');
    winnerCells.forEach(cell => {
      const hasWinnerIndicator = cell.querySelector('svg.imspo_mt_triangle, svg[class*="triangle"], svg[aria-label="Winner"]');
      const cellText = cell.textContent.trim();
      if (hasWinnerIndicator || cellText === '') {
        cell.remove();
      }
    });
    
    // Update the score text node and make it bold
    const walker = document.createTreeWalker(
      scoreElement,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    
    let textNode = walker.nextNode();
    if (textNode) {
      const currentScore = textNode.textContent.trim();
      if (currentScore !== '10') {
        // Wrap the text in a bold element
        const boldElement = document.createElement('strong');
        boldElement.textContent = '10';
        textNode.parentNode.replaceChild(boldElement, textNode);
        processedMatches.add(matchContainer);
        processedScores.add(scoreElement);
        return true;
      } else {
        // Score is already "10", but make sure it's bold
        if (textNode.parentNode.tagName !== 'STRONG' && textNode.parentNode.tagName !== 'B') {
          const boldElement = document.createElement('strong');
          boldElement.textContent = '10';
          textNode.parentNode.replaceChild(boldElement, textNode);
        }
      }
    } else {
      // Fallback: update textContent directly and make it bold
      const currentScore = scoreElement.textContent.trim();
      if (currentScore !== '10') {
        // Clear the element and add bold "10"
        scoreElement.innerHTML = '';
        const boldElement = document.createElement('strong');
        boldElement.textContent = '10';
        scoreElement.appendChild(boldElement);
        processedMatches.add(matchContainer);
        processedScores.add(scoreElement);
        return true;
      } else {
        // Score is already "10", but make sure it's bold
        if (scoreElement.querySelector('strong, b')) {
          // Already has bold, do nothing
        } else {
          scoreElement.innerHTML = '';
          const boldElement = document.createElement('strong');
          boldElement.textContent = '10';
          scoreElement.appendChild(boldElement);
        }
      }
    }
  }
  
  return false;
}

// Find and process all match containers on the page
function replaceLiverpoolScores() {
  if (!document.body) return;
  
  // Look for match containers using various selectors
  const matchSelectors = [
    '[class*="match"]',
    '[class*="fixture"]',
    '[class*="imspo_mt"]',
    '[class*="result"]',
    'div[data-ved]' // Google search result containers
  ];
  
  const matchContainers = new Set();
  
  // Find containers using selectors
  matchSelectors.forEach(selector => {
    try {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        const container = findMatchContainer(el);
        if (container) {
          matchContainers.add(container);
        }
      });
    } catch (e) {
      // Ignore invalid selectors
    }
  });
  
  // Also search by content - look for "vs" or "King of Merseyside" patterns
  const allDivs = document.querySelectorAll('div');
  allDivs.forEach(div => {
    const text = div.textContent || '';
    if ((text.includes('vs') || text.includes('v.') || text.includes('King of Merseyside')) &&
        text.match(/\b\d{1,2}\b.*\b\d{1,2}\b/)) { // Contains two scores
      const container = findMatchContainer(div);
      if (container) {
        matchContainers.add(container);
      }
    }
  });
  
  // Process each match container
  let updatedCount = 0;
  matchContainers.forEach(container => {
    if (processMatchContainer(container)) {
      updatedCount++;
    }
  });
  
  if (updatedCount > 0) {
    console.log(`[replaceLiverpoolScores] ✅ Updated ${updatedCount} match score(s)`);
    
    // After updating scores, run make-liverpool-first and make-liverpool-perfect
    // to fix any changes to the Premier League table
    console.log('[replaceLiverpoolScores] ⏳ Setting timeout to fix Premier League table...');
    setTimeout(() => {
      console.log('[replaceLiverpoolScores] 🔧 Starting Premier League table fix...');
      
      if (typeof window.makeLiverpoolFirst === 'function') {
        console.log('[replaceLiverpoolScores] ✅ Running makeLiverpoolFirst()...');
        const result1 = window.makeLiverpoolFirst();
        console.log('[replaceLiverpoolScores] ✅ makeLiverpoolFirst() completed, result:', result1);
      } else {
        console.log('[replaceLiverpoolScores] ❌ makeLiverpoolFirst function not found on window');
      }
      
      if (typeof window.makeLiverpoolPerfect === 'function') {
        console.log('[replaceLiverpoolScores] ✅ Running makeLiverpoolPerfect()...');
        const result2 = window.makeLiverpoolPerfect();
        console.log('[replaceLiverpoolScores] ✅ makeLiverpoolPerfect() completed, result:', result2);
      } else {
        console.log('[replaceLiverpoolScores] ❌ makeLiverpoolPerfect function not found on window');
      }
      
      console.log('[replaceLiverpoolScores] ✅ Premier League table fix completed');
    }, 500);
  }
}

// Debounce function to avoid excessive calls
let timeoutId = null;
function debouncedReplace() {
  if (timeoutId) clearTimeout(timeoutId);
  timeoutId = setTimeout(() => {
    replaceLiverpoolScores();
  }, 500);
}

// Observe DOM changes for dynamically loaded content
const observer = new MutationObserver((mutations) => {
  const hasAdditions = mutations.some(m => m.addedNodes.length > 0);
  if (hasAdditions) {
    debouncedReplace();
  }
});

// Initialize
function init() {
  function waitForReady() {
    if (document.readyState === 'complete' && document.body) {
      setTimeout(() => {
        if (document.body.children.length > 0) {
          // Initial processing
          setTimeout(replaceLiverpoolScores, 1000);
          
          // Start observing
          observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: false,
            attributes: false
          });
        } else {
          setTimeout(waitForReady, 500);
        }
      }, 1500);
    } else {
      setTimeout(waitForReady, 100);
    }
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForReady);
    window.addEventListener('load', waitForReady);
  } else {
    waitForReady();
  }
}

// Check settings before initializing
chrome.storage.local.get(['liverpoolSettings'], (result) => {
  const settings = result.liverpoolSettings || { enabled: true };
  if (settings.enabled !== false) {
    init();
  }
});

})();

