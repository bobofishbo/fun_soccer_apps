// Function to make Tottenham's stats perfect
// W = MP, D = 0, L = 0, GF = 100, GA = 0, Last 5 = all wins

function makeTottenhamPerfect() {
  console.log('[makeTottenhamPerfect] Starting...');
  
  // Find Tottenham row - use aria-label as it's more reliable than text
  const tottenhamRow = Array.from(document.querySelectorAll('tr')).find(row => {
    const ariaLabel = row.getAttribute('aria-label');
    return ariaLabel && ariaLabel.toLowerCase().includes('tottenham');
  });

  if (!tottenhamRow) {
    console.log('[makeTottenhamPerfect] ❌ Tottenham row not found');
    return false;
  }

  console.log('[makeTottenhamPerfect] ✅ Found Tottenham row');

  // Get all cells in the row
  const allCells = Array.from(tottenhamRow.querySelectorAll('td, th'));
  console.log(`[makeTottenhamPerfect] Total cells: ${allCells.length}`);

  // Find MP (Matches Played) - skip empty cells (like cell 0 which is aria-hidden)
  let mpValue = null;
  let mpIndex = -1;
  
  // Skip the first cell if it's empty/aria-hidden, then look for MP
  for (let i = 1; i < allCells.length; i++) {
    const cell = allCells[i];
    const cellText = cell.textContent.trim();
    const num = parseInt(cellText, 10);
    
    if (cellText && !cell.getAttribute('aria-hidden') && !isNaN(num) && num >= 0 && num <= 38) {
      if (i === 2 || i === 3 || (mpValue === null && i > 1)) {
        mpValue = num;
        mpIndex = i;
        break;
      }
    }
  }

  // Fallback: try cell 2 or 3 directly
  if (mpValue === null) {
    for (let i = 2; i <= 3 && i < allCells.length; i++) {
      const cell = allCells[i];
      const cellText = cell.textContent.trim();
      const num = parseInt(cellText, 10);
      if (!isNaN(num) && num >= 0 && num <= 38) {
        mpValue = num;
        mpIndex = i;
        break;
      }
    }
  }

  if (mpValue === null) {
    console.log('[makeTottenhamPerfect] ❌ Could not find MP value');
    return false;
  }

  console.log(`[makeTottenhamPerfect] MP: ${mpValue} at cell ${mpIndex}`);

  // Helper function to update a cell's value
  const updateCellValue = (cell, newValue, cellName = '') => {
    // Try to find the div with class "iU5t0d" or similar structure
    const rankDiv = cell.querySelector('div.iU5t0d');
    if (rankDiv) {
      const walker = document.createTreeWalker(
        rankDiv,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      let textNode = walker.nextNode();
      if (textNode) {
        textNode.textContent = newValue.toString();
        console.log(`[makeTottenhamPerfect] ✅ ${cellName}: ${newValue}`);
        return true;
      }
    }

    // Try to find any div/span with just a number
    const childElements = cell.querySelectorAll('div, span');
    for (const elem of childElements) {
      const text = elem.textContent.trim();
      if (/^\d+$/.test(text)) {
        const walker = document.createTreeWalker(
          elem,
          NodeFilter.SHOW_TEXT,
          null,
          false
        );
        let textNode = walker.nextNode();
        if (textNode) {
          textNode.textContent = newValue.toString();
          console.log(`[makeTottenhamPerfect] ✅ ${cellName}: ${newValue}`);
          return true;
        }
      }
    }

    // Fallback: update text node directly
    const walker = document.createTreeWalker(
      cell,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    let textNode = walker.nextNode();
    if (textNode) {
      textNode.textContent = newValue.toString();
      console.log(`[makeTottenhamPerfect] ✅ ${cellName}: ${newValue}`);
      return true;
    }

    console.log(`[makeTottenhamPerfect] ❌ Failed to update ${cellName}`);
    return false;
  };

  // Update stats based on MP position
  // Column order: Rank, Club, MP, W, D, L, GF, GA, GD, Pts, Last 5
  // If MP is at index mpIndex, then:
  // W is at mpIndex + 1
  // D is at mpIndex + 2
  // L is at mpIndex + 3
  // GF is at mpIndex + 4
  // GA is at mpIndex + 5
  // GD is at mpIndex + 6
  // Pts is at mpIndex + 7

  const wIndex = mpIndex + 1;
  const dIndex = mpIndex + 2;
  const lIndex = mpIndex + 3;
  const gfIndex = mpIndex + 4;
  const gaIndex = mpIndex + 5;
  const gdIndex = mpIndex + 6;
  const ptsIndex = mpIndex + 7;

  // W = MP
  if (allCells.length > wIndex) {
    updateCellValue(allCells[wIndex], mpValue, 'W');
  }

  // D = 0
  if (allCells.length > dIndex) {
    updateCellValue(allCells[dIndex], 0, 'D');
  }

  // L = 0
  if (allCells.length > lIndex) {
    updateCellValue(allCells[lIndex], 0, 'L');
  }

  // GF = 100
  if (allCells.length > gfIndex) {
    updateCellValue(allCells[gfIndex], 100, 'GF');
  }

  // GA = 0
  if (allCells.length > gaIndex) {
    updateCellValue(allCells[gaIndex], 0, 'GA');
  }

  // GD = 100
  if (allCells.length > gdIndex) {
    updateCellValue(allCells[gdIndex], 100, 'GD');
  }

  // Pts = 3 * MP
  if (allCells.length > ptsIndex) {
    const points = mpValue * 3;
    updateCellValue(allCells[ptsIndex], points, 'Pts');
  }

  // Update Last 5 column to show all wins (green ticks)
  // Last 5 is typically one of the last columns
  let lastFiveCell = null;
  
  // Try multiple strategies to find the Last 5 column
  for (let i = allCells.length - 1; i >= 0; i--) {
    const cell = allCells[i];
    
    // Strategy 1: Look for cells with result icon classes
    const resultIcons = cell.querySelectorAll('[class*="imso_gs-r-l-i"], [class*="gs-r-l-i"]');
    if (resultIcons.length >= 3) {
      lastFiveCell = cell;
      console.log(`[makeTottenhamPerfect] Found Last 5 column at cell ${i} (${resultIcons.length} icons via class)`);
      break;
    }
    
    // Strategy 2: Look for cells with multiple circular/icon-like elements
    const allElements = cell.querySelectorAll('span, div');
    const iconLikeElements = Array.from(allElements).filter(elem => {
      const classes = elem.className || '';
      const style = window.getComputedStyle(elem);
      // Look for circular elements or elements that might be result icons
      return classes.includes('circle') || 
             classes.includes('icon') || 
             classes.includes('result') ||
             elem.getAttribute('role') === 'img' ||
             (style.borderRadius && parseFloat(style.borderRadius) > 0) ||
             (style.width === style.height && parseFloat(style.width) > 0);
    });
    
    if (iconLikeElements.length >= 3) {
      lastFiveCell = cell;
      console.log(`[makeTottenhamPerfect] Found Last 5 column at cell ${i} (${iconLikeElements.length} icon-like elements)`);
      break;
    }
  }

  // Fallback: use the last cell
  if (!lastFiveCell && allCells.length > 10) {
    lastFiveCell = allCells[allCells.length - 1];
    console.log(`[makeTottenhamPerfect] Using last cell as Last 5 column`);
  }

  if (lastFiveCell) {
    console.log('[makeTottenhamPerfect] Updating Last 5 column...');
    console.log(`[makeTottenhamPerfect] Last 5 cell HTML preview:`, lastFiveCell.outerHTML.substring(0, 300));
    
    // Strategy 1: Find elements by aria-labelledby (e.g., "l5l-w", "l5l-l", "l5l-d")
    const ariaElements = lastFiveCell.querySelectorAll('[aria-labelledby*="l5l-"]');
    console.log(`[makeTottenhamPerfect] Found ${ariaElements.length} elements with aria-labelledby l5l-`);
    
    // Only update aria-labelledby for matches that have been played (MP value)
    // Total active circles should be i = min(MP, 5)
    const ariaElementsToUpdate = Math.min(mpValue, 5, ariaElements.length);
    console.log(`[makeTottenhamPerfect] Will update ${ariaElementsToUpdate} aria-labelledby elements (MP=${mpValue}, max=5)`);
    
    ariaElements.forEach((elem, index) => {
      // Only update aria-labelledby for matches that have been played
      if (index >= ariaElementsToUpdate) {
        console.log(`[makeTottenhamPerfect]   Aria element ${index + 1}: Skipping (future match placeholder)`);
        return; // Skip empty placeholders for future matches
      }
      
      const ariaLabel = elem.getAttribute('aria-labelledby') || '';
      console.log(`[makeTottenhamPerfect]   Aria element ${index + 1}: aria-labelledby="${ariaLabel}", classes="${elem.className}"`);
      // Replace loss (l), draw (d), or tie (t) with win (w) in aria-labelledby
      if (ariaLabel.includes('l5l-l') || ariaLabel.includes('l5l-d') || ariaLabel.includes('l5l-t')) {
        const newAriaLabel = ariaLabel.replace(/l5l-[ldt]/g, 'l5l-w');
        elem.setAttribute('aria-labelledby', newAriaLabel);
        console.log(`[makeTottenhamPerfect]     Updated to: ${newAriaLabel}`);
      }
    });
    
    // Strategy 2: Find SVG elements (the actual icons)
    const svgIcons = lastFiveCell.querySelectorAll('svg');
    console.log(`[makeTottenhamPerfect] Found ${svgIcons.length} SVG elements`);
    
    // Only update icons for matches that have been played (MP value)
    // Total active circles should be i = min(MP, 5)
    // Leave the remaining icons as empty placeholders for future matches
    const iconsToUpdate = Math.min(mpValue, 5, svgIcons.length);
    console.log(`[makeTottenhamPerfect] Will update ${iconsToUpdate} icons (MP=${mpValue}, max=5, total icons=${svgIcons.length})`);
    console.log(`[makeTottenhamPerfect] Active circles: ${iconsToUpdate}, Empty placeholders: ${svgIcons.length - iconsToUpdate}`);
    
    svgIcons.forEach((svg, index) => {
      // Only update icons for matches that have been played (first i icons where i = min(MP, 5))
      if (index >= iconsToUpdate) {
        console.log(`[makeTottenhamPerfect]   SVG ${index + 1}: Skipping (future match placeholder, index ${index} >= ${iconsToUpdate})`);
        return; // Skip empty placeholders for future matches
      }
      
      // Ensure first icon (index 0) is always processed (regular green circle with tick, no border)
      if (index === 0) {
        console.log(`[makeTottenhamPerfect]   SVG ${index + 1}: Processing FIRST icon (regular green circle, no border)`);
      }
      console.log(`[makeTottenhamPerfect]   SVG ${index + 1}:`);
      console.log(`[makeTottenhamPerfect]     Classes: "${svg.className}"`);
      console.log(`[makeTottenhamPerfect]     ViewBox: "${svg.getAttribute('viewBox')}"`);
      
      // Find the parent container that might have win/loss/draw indicators
      const parent = svg.closest('div');
      if (parent) {
        const parentAria = parent.getAttribute('aria-labelledby') || '';
        const parentClasses = parent.className || '';
        
        console.log(`[makeTottenhamPerfect]     Parent div:`);
        console.log(`[makeTottenhamPerfect]       aria-labelledby: "${parentAria}"`);
        console.log(`[makeTottenhamPerfect]       classes: "${parentClasses}"`);
        
        // Determine icon type from aria-labelledby
        let iconType = 'unknown';
        if (parentAria.includes('l5l-w')) iconType = 'WIN ✓';
        else if (parentAria.includes('l5l-l')) iconType = 'LOSS ✗';
        else if (parentAria.includes('l5l-d')) iconType = 'DRAW -';
        else if (parentAria.includes('l5l-t')) iconType = 'TIE/DRAW -';
        console.log(`[makeTottenhamPerfect]       Icon type: ${iconType}`);
        
        // Update aria-labelledby if it indicates loss, draw, or tie
        if (parentAria.includes('l5l-l') || parentAria.includes('l5l-d') || parentAria.includes('l5l-t')) {
          const newAriaLabel = parentAria.replace(/l5l-[ldt]/g, 'l5l-w');
          parent.setAttribute('aria-labelledby', newAriaLabel);
          console.log(`[makeTottenhamPerfect]       Updated aria-labelledby to: "${newAriaLabel}"`);
        }
        
        // Update classes to indicate win
        let newClasses = parentClasses;
        newClasses = newClasses.replace(/l5l-[ldt]/g, 'l5l-w');
        newClasses = newClasses.replace(/imso_gs-r-l-i-[ld]/g, 'imso_gs-r-l-i-w');
        if (newClasses !== parentClasses) {
          parent.className = newClasses.trim();
          console.log(`[makeTottenhamPerfect]       Updated classes to: "${newClasses.trim()}"`);
        }
      }
      
      // Ensure SVG has green checkmark (win) - look for checkmark path
      const paths = svg.querySelectorAll('path');
      console.log(`[makeTottenhamPerfect]     Found ${paths.length} path elements in SVG`);
      
      paths.forEach((path, pathIndex) => {
        const pathClass = path.getAttribute('class') || '';
        const pathD = path.getAttribute('d') || '';
        const pathFill = path.getAttribute('fill') || '';
        const pathStroke = path.getAttribute('stroke') || '';
        console.log(`[makeTottenhamPerfect]       Path ${pathIndex + 1}: class="${pathClass}", fill="${pathFill}", stroke="${pathStroke}"`);
        console.log(`[makeTottenhamPerfect]       Path ${pathIndex + 1} d attribute: "${pathD.substring(0, 50)}..."`);
      });
      
      const hasCheckmark = Array.from(paths).some(path => {
        const pathClass = path.getAttribute('class') || '';
        return pathClass.includes('hIg8Hb') || pathClass.includes('check') || pathClass.includes('tick');
      });
      console.log(`[makeTottenhamPerfect]     Has checkmark: ${hasCheckmark}`);
      
      // Correct checkmark path (user provided)
      const correctCheckmarkPath = 'M9.2 12.28 7.12 10.2 6 11.32l3.2 3.2 6.4-6.4L14.48 7z';
      
      // Replace ALL hIg8Hb paths (dash/cross/checkmark) with the correct checkmark
      paths.forEach(path => {
        const pathClass = path.getAttribute('class') || '';
        const pathD = path.getAttribute('d') || '';
        
        // If this is a checkmark/icon path (hIg8Hb), ALWAYS replace with correct checkmark
        if (pathClass.includes('hIg8Hb')) {
          // Check if it's already the correct checkmark path
          const isCorrectCheckmark = pathD === correctCheckmarkPath || 
                                     (pathD.includes('12.28') && pathD.includes('11.32l3.2'));
          
          if (!isCorrectCheckmark) {
            // Replace with correct checkmark path
            path.setAttribute('d', correctCheckmarkPath);
            console.log(`[makeTottenhamPerfect]       Replaced hIg8Hb path: "${pathD.substring(0, 40)}..." -> correct checkmark`);
          }
          
          // Always ensure fill (not stroke) for thinner appearance
          path.setAttribute('fill', '#ffffff');
          path.removeAttribute('stroke');
          path.removeAttribute('stroke-width');
          path.style.fill = '#ffffff';
          path.style.stroke = 'none';
        }
      });
      
      // If no checkmark found, try to find the circle path and add checkmark
      if (!hasCheckmark) {
        // Look for circle path and add checkmark path after it
        const circlePath = Array.from(paths).find(p => {
          const pc = p.getAttribute('class') || '';
          return pc.includes('bI5Fmd') || pc.includes('oUnRP') || pc.includes('yIOzif') || pc.includes('circle');
        });
        
        if (circlePath) {
          // Check if checkmark path exists, if not create one
          const checkmarkPath = svg.querySelector('path.hIg8Hb, path[class*="check"], path[class*="tick"]');
          if (!checkmarkPath) {
            // Create checkmark path with correct path
            const newPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            newPath.setAttribute('class', 'hIg8Hb');
            newPath.setAttribute('d', correctCheckmarkPath);
            newPath.setAttribute('fill', '#ffffff');
            newPath.style.fill = '#ffffff';
            svg.appendChild(newPath);
            console.log(`[makeTottenhamPerfect]       Added checkmark path with correct shape`);
          }
        }
      }
      
      // Update SVG fill/stroke to green (win color) - re-query paths after modifications
      const updatedPaths = svg.querySelectorAll('path');
      svg.style.color = '#34a853';
      
      updatedPaths.forEach((path, pathIndex) => {
        const pathClass = path.getAttribute('class') || '';
        
        // Circle paths: classes like "bI5Fmd", "oUnRP", "yIOzif" - make them green
        if (pathClass.includes('bI5Fmd') || pathClass.includes('oUnRP') || pathClass.includes('yIOzif') || 
            pathClass.includes('circle') || (!pathClass.includes('hIg8Hb') && pathIndex === 0)) {
          path.setAttribute('fill', '#34a853');
          path.removeAttribute('stroke');
          // Force fill with !important via style attribute
          path.style.fill = '#34a853';
          console.log(`[makeTottenhamPerfect]       Path ${pathIndex + 1}: Set circle to green`);
        }
        
        // Checkmark paths: class "hIg8Hb" - make them white checkmarks (use fill, not stroke for thinner)
        if (pathClass.includes('hIg8Hb') || pathClass.includes('check') || pathClass.includes('tick')) {
          // Ensure correct checkmark path
          const currentPath = path.getAttribute('d') || '';
          if (currentPath !== correctCheckmarkPath && !currentPath.includes('12.28') && !currentPath.includes('11.32l3.2')) {
            path.setAttribute('d', correctCheckmarkPath);
          }
          // Use fill instead of stroke for thinner appearance
          path.setAttribute('fill', '#ffffff');
          path.removeAttribute('stroke');
          path.removeAttribute('stroke-width');
          path.style.fill = '#ffffff';
          path.style.stroke = 'none';
          console.log(`[makeTottenhamPerfect]       Path ${pathIndex + 1}: Set checkmark to white (fill only, no stroke)`);
        }
      });
      
      // Add white circle border only to the last (oldest) played game
      // First icon (index 0) should be regular green circle with tick, no border
      // Only apply to actually played matches, not future placeholders
      // Last active icon: index iconsToUpdate - 1 (oldest played match)
      const isLastActive = index === iconsToUpdate - 1;
      
      if (isLastActive) {
        console.log(`[makeTottenhamPerfect]     Adding white border to last (oldest) icon (index ${index})`);
        const whiteCirclePath = 'M11 3a8 8 0 1 1 0 16 8 8 0 0 1 0-16';
        const existingPaths = Array.from(svg.querySelectorAll('path'));
        
        // Remove any malformed paths (like "M11 2a9 90 100 18 990000 -18")
        existingPaths.forEach(path => {
          const pathD = path.getAttribute('d') || '';
          const pathClass = path.getAttribute('class') || '';
          // Remove malformed paths that look corrupted
          if (pathD.includes('990000') || (pathD.includes('M11 2a9 90 100') && pathClass.includes('hIg8Hb'))) {
            path.remove();
            console.log(`[makeTottenhamPerfect]     Removed malformed path: "${pathD}"`);
          }
        });
        
        // Re-query paths after removal
        const cleanPaths = Array.from(svg.querySelectorAll('path'));
        
        // Find the green circle path (main background circle)
        const greenCirclePath = cleanPaths.find(path => {
          const pathClass = path.getAttribute('class') || '';
          return pathClass.includes('oUnRP') || pathClass.includes('bI5Fmd') || pathClass.includes('yIOzif');
        });
        
        // Check if white circle border already exists
        const whiteBorderPath = cleanPaths.find(path => {
          const pathD = path.getAttribute('d') || '';
          return pathD === whiteCirclePath;
        });
        
        if (!whiteBorderPath) {
          // Create white circle border path with correct class
          const newWhiteBorder = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          newWhiteBorder.setAttribute('class', 'oUnRP'); // Same class as the green circle
          newWhiteBorder.setAttribute('d', whiteCirclePath);
          newWhiteBorder.setAttribute('fill', 'none');
          newWhiteBorder.setAttribute('stroke', '#ffffff');
          newWhiteBorder.setAttribute('stroke-width', '1');
          newWhiteBorder.style.fill = 'none';
          newWhiteBorder.style.stroke = '#ffffff';
          newWhiteBorder.style.strokeWidth = '1';
          
          // Insert after the green circle (if found), otherwise insert as second child
          if (greenCirclePath && greenCirclePath.nextSibling) {
            svg.insertBefore(newWhiteBorder, greenCirclePath.nextSibling);
          } else if (greenCirclePath) {
            svg.appendChild(newWhiteBorder);
          } else {
            // Insert as second child (first should be green circle)
            const firstChild = svg.firstChild;
            if (firstChild && firstChild.nextSibling) {
              svg.insertBefore(newWhiteBorder, firstChild.nextSibling);
            } else {
              svg.appendChild(newWhiteBorder);
            }
          }
          console.log(`[makeTottenhamPerfect]     SVG ${index + 1} (last active): Added white circle border with class oUnRP`);
        } else {
          // Ensure existing white border has correct class and styling
          whiteBorderPath.setAttribute('class', 'oUnRP');
          whiteBorderPath.setAttribute('d', whiteCirclePath);
          whiteBorderPath.setAttribute('fill', 'none');
          whiteBorderPath.setAttribute('stroke', '#ffffff');
          whiteBorderPath.setAttribute('stroke-width', '1');
          whiteBorderPath.style.fill = 'none';
          whiteBorderPath.style.stroke = '#ffffff';
          whiteBorderPath.style.strokeWidth = '1';
          console.log(`[makeTottenhamPerfect]     SVG ${index + 1} (last active): Ensured white circle border is styled correctly`);
        }
      }
      
      // Force update: ensure all SVGs show as wins
      svg.setAttribute('style', 'color: #34a853;');
      
      // Also update parent div style to ensure green color shows
      const parentDiv = svg.closest('div');
      if (parentDiv) {
        parentDiv.style.color = '#34a853';
      }
      
      console.log(`[makeTottenhamPerfect]     SVG ${index + 1}: Applied green win styling`);
    });
    
    // Strategy 3: Find all div containers with classes indicating results
    const resultDivs = lastFiveCell.querySelectorAll('div[class*="l5l-"], div[aria-labelledby*="l5l-"]');
    console.log(`[makeTottenhamPerfect] Found ${resultDivs.length} result divs`);
    
    resultDivs.forEach(div => {
      const classes = div.className || '';
      const ariaLabel = div.getAttribute('aria-labelledby') || '';
      
      // Update classes
      let newClasses = classes;
      newClasses = newClasses.replace(/l5l-[ldt]/g, 'l5l-w');
      newClasses = newClasses.replace(/imso_gs-r-l-i-[ld]/g, 'imso_gs-r-l-i-w');
      if (newClasses !== classes) {
        div.className = newClasses.trim();
      }
      
      // Update aria-labelledby
      if (ariaLabel && (ariaLabel.includes('l5l-l') || ariaLabel.includes('l5l-d') || ariaLabel.includes('l5l-t'))) {
        div.setAttribute('aria-labelledby', ariaLabel.replace(/l5l-[ldt]/g, 'l5l-w'));
      }
    });
    
    // Strategy 4: Find all elements with class patterns indicating win/loss/draw
    const allResultElements = lastFiveCell.querySelectorAll('[class*="imso_gs-r-l-i"], [class*="gs-r-l-i"], [class*="l5l-"]');
    console.log(`[makeTottenhamPerfect] Found ${allResultElements.length} elements with result classes`);
    
    allResultElements.forEach(elem => {
      const classes = elem.className || '';
      let newClasses = classes;
      
      // Replace loss (l), draw (d), or tie (t) classes with win (w)
      newClasses = newClasses.replace(/imso_gs-r-l-i-l/g, 'imso_gs-r-l-i-w');
      newClasses = newClasses.replace(/gs-r-l-i-l/g, 'gs-r-l-i-w');
      newClasses = newClasses.replace(/imso_gs-r-l-i-d/g, 'imso_gs-r-l-i-w');
      newClasses = newClasses.replace(/gs-r-l-i-d/g, 'gs-r-l-i-w');
      newClasses = newClasses.replace(/l5l-l/g, 'l5l-w');
      newClasses = newClasses.replace(/l5l-d/g, 'l5l-w');
      newClasses = newClasses.replace(/l5l-t/g, 'l5l-w');
      
      if (newClasses !== classes) {
        elem.className = newClasses.trim();
      }
    });
    
    // Final pass: Force all result divs to show as wins and update SVG colors
    const finalResultDivs = lastFiveCell.querySelectorAll('div[aria-labelledby*="l5l-"]');
    console.log(`[makeTottenhamPerfect] Final pass: Found ${finalResultDivs.length} result divs`);
    
    // Only process icons for matches that have been played (MP value)
    // Total active circles should be i = min(MP, 5)
    const finalDivsToUpdate = Math.min(mpValue, 5, finalResultDivs.length);
    console.log(`[makeTottenhamPerfect] Final pass: Will update ${finalDivsToUpdate} divs (MP=${mpValue}, max=5)`);
    
    finalResultDivs.forEach((div, index) => {
      // Only update divs for matches that have been played (first i divs where i = min(MP, 5))
      if (index >= finalDivsToUpdate) {
        console.log(`[makeTottenhamPerfect] Final pass: Skipping div ${index + 1} (future match placeholder, index ${index} >= ${finalDivsToUpdate})`);
        return; // Skip empty placeholders for future matches
      }
      
      // Ensure first div (index 0) is always processed (regular green circle with tick, no border)
      if (index === 0) {
        console.log(`[makeTottenhamPerfect] Final pass: Processing FIRST div (regular green circle, no border)`);
      }
      const ariaLabel = div.getAttribute('aria-labelledby') || '';
      if (ariaLabel.includes('l5l-')) {
        // Ensure aria-labelledby is set to win
        if (!ariaLabel.includes('l5l-w')) {
          div.setAttribute('aria-labelledby', ariaLabel.replace(/l5l-[ldt]/g, 'l5l-w'));
          console.log(`[makeTottenhamPerfect] Final pass: Updated div ${index + 1} to win`);
        }
        
        // Find SVG inside and force green
        const svg = div.querySelector('svg');
        if (svg) {
          svg.style.color = '#34a853';
          const paths = svg.querySelectorAll('path');
          paths.forEach(path => {
            const pathClass = path.getAttribute('class') || '';
            // Circle paths - make green
            if (pathClass.includes('bI5Fmd') || pathClass.includes('oUnRP') || pathClass.includes('yIOzif')) {
              path.style.fill = '#34a853';
              path.setAttribute('fill', '#34a853');
            }
            // Checkmark paths - make white with correct path (fill only, no stroke for thinner)
            const correctCheckmarkPath = 'M9.2 12.28 7.12 10.2 6 11.32l3.2 3.2 6.4-6.4L14.48 7z';
            const isCircle = pathClass.includes('bI5Fmd') || pathClass.includes('oUnRP') || pathClass.includes('yIOzif') || pathClass.includes('circle');
            
            // If it's a checkmark/icon path OR if it's not a circle and not already the correct checkmark, replace it
            if (pathClass.includes('hIg8Hb') || (!isCircle && path.getAttribute('d'))) {
              const currentPath = path.getAttribute('d') || '';
              const isCorrectCheckmark = currentPath === correctCheckmarkPath || 
                                        (currentPath.includes('12.28') && currentPath.includes('11.32l3.2'));
              
              // Replace with correct checkmark path if it's not already correct
              if (!isCorrectCheckmark && !isCircle) {
                path.setAttribute('d', correctCheckmarkPath);
                path.setAttribute('class', 'hIg8Hb'); // Ensure it has the checkmark class
                console.log(`[makeTottenhamPerfect] Final pass: Replaced path "${currentPath.substring(0, 30)}..." with correct checkmark`);
              }
              
              // Always ensure fill (not stroke) for thinner appearance
              if (!isCircle) {
                path.setAttribute('fill', '#ffffff');
                path.removeAttribute('stroke');
                path.removeAttribute('stroke-width');
                path.style.fill = '#ffffff';
                path.style.stroke = 'none';
              }
            }
          });
          
          // Add white circle border only to the last (oldest) played game
          // First icon (index 0) should be regular green circle with tick, no border
          // Only apply to actually played matches, not future placeholders
          // Last active icon: index finalDivsToUpdate - 1 (oldest played match)
          const isLastActive = index === finalDivsToUpdate - 1;
          
          if (isLastActive) {
            console.log(`[makeTottenhamPerfect] Final pass: Adding white border to last (oldest) icon (index ${index})`);
            const whiteCirclePath = 'M11 3a8 8 0 1 1 0 16 8 8 0 0 1 0-16';
            const existingPaths = Array.from(svg.querySelectorAll('path'));
            
            // Remove any malformed paths (like "M11 2a9 90 100 18 990000 -18")
            existingPaths.forEach(path => {
              const pathD = path.getAttribute('d') || '';
              const pathClass = path.getAttribute('class') || '';
              // Remove malformed paths that look corrupted
              if (pathD.includes('990000') || (pathD.includes('M11 2a9 90 100') && pathClass.includes('hIg8Hb'))) {
                path.remove();
                console.log(`[makeTottenhamPerfect] Final pass: Removed malformed path: "${pathD}"`);
              }
            });
            
            // Re-query paths after removal
            const cleanPaths = Array.from(svg.querySelectorAll('path'));
            
            // Find the green circle path (main background circle)
            const greenCirclePath = cleanPaths.find(path => {
              const pathClass = path.getAttribute('class') || '';
              return pathClass.includes('oUnRP') || pathClass.includes('bI5Fmd') || pathClass.includes('yIOzif');
            });
            
            // Check if white circle border already exists
            const whiteBorderPath = cleanPaths.find(path => {
              const pathD = path.getAttribute('d') || '';
              return pathD === whiteCirclePath;
            });
            
            if (!whiteBorderPath) {
              // Create white circle border path with correct class
              const newWhiteBorder = document.createElementNS('http://www.w3.org/2000/svg', 'path');
              newWhiteBorder.setAttribute('class', 'oUnRP'); // Same class as the green circle
              newWhiteBorder.setAttribute('d', whiteCirclePath);
              newWhiteBorder.setAttribute('fill', 'none');
              newWhiteBorder.setAttribute('stroke', '#ffffff');
              newWhiteBorder.setAttribute('stroke-width', '1');
              newWhiteBorder.style.fill = 'none';
              newWhiteBorder.style.stroke = '#ffffff';
              newWhiteBorder.style.strokeWidth = '1';
              
              // Insert after the green circle (if found), otherwise insert as second child
              if (greenCirclePath && greenCirclePath.nextSibling) {
                svg.insertBefore(newWhiteBorder, greenCirclePath.nextSibling);
              } else if (greenCirclePath) {
                svg.appendChild(newWhiteBorder);
              } else {
                // Insert as second child (first should be green circle)
                const firstChild = svg.firstChild;
                if (firstChild && firstChild.nextSibling) {
                  svg.insertBefore(newWhiteBorder, firstChild.nextSibling);
                } else {
                  svg.appendChild(newWhiteBorder);
                }
              }
              console.log(`[makeTottenhamPerfect] Final pass: Added white circle border to last active icon with class oUnRP`);
            } else {
              // Ensure existing white border has correct class and styling
              whiteBorderPath.setAttribute('class', 'oUnRP');
              whiteBorderPath.setAttribute('d', whiteCirclePath);
              whiteBorderPath.setAttribute('fill', 'none');
              whiteBorderPath.setAttribute('stroke', '#ffffff');
              whiteBorderPath.setAttribute('stroke-width', '1');
              whiteBorderPath.style.fill = 'none';
              whiteBorderPath.style.stroke = '#ffffff';
              whiteBorderPath.style.strokeWidth = '1';
              console.log(`[makeTottenhamPerfect] Final pass: Ensured white circle border on last active icon is styled correctly`);
            }
          }
        }
      }
    });
    
    // Summary: Show all circles found
    console.log(`[makeTottenhamPerfect] ===== SUMMARY =====`);
    console.log(`[makeTottenhamPerfect] Total SVG circles found: ${svgIcons.length}`);
    console.log(`[makeTottenhamPerfect] Total aria-labelledby elements: ${ariaElements.length}`);
    console.log(`[makeTottenhamPerfect] Total result divs: ${resultDivs.length}`);
    
    // List each circle with its status
    svgIcons.forEach((svg, index) => {
      const parent = svg.closest('div');
      const parentAria = parent ? parent.getAttribute('aria-labelledby') || '' : '';
      let status = 'unknown';
      if (parentAria.includes('l5l-w')) status = 'WIN ✓';
      else if (parentAria.includes('l5l-l')) status = 'LOSS ✗';
      else if (parentAria.includes('l5l-d')) status = 'DRAW -';
      else if (parentAria.includes('l5l-t')) status = 'TIE/DRAW -';
      console.log(`[makeTottenhamPerfect] Circle ${index + 1}: ${status} (aria-labelledby: "${parentAria}")`);
    });
    
    console.log(`[makeTottenhamPerfect] ✅ Last 5: updated all icons to wins`);
  } else {
    console.log('[makeTottenhamPerfect] ❌ Could not find Last 5 column');
  }

  console.log('[makeTottenhamPerfect] ✅ Complete!');
  return true;
}

// Initialize when page is ready
function initMakeTottenhamPerfect() {
  function attemptUpdate() {
    if (document.readyState === 'complete' && document.body) {
      setTimeout(() => {
        const success = makeTottenhamPerfect();
        if (!success) {
          setTimeout(attemptUpdate, 500);
        }
      }, 1500);
    } else {
      setTimeout(attemptUpdate, 100);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attemptUpdate);
    window.addEventListener('load', attemptUpdate);
  } else {
    attemptUpdate();
  }
}

// Make functions available globally for widget
window.makeTottenhamPerfect = makeTottenhamPerfect;
window.initMakeTottenhamPerfect = initMakeTottenhamPerfect;

// Auto-run if this script is loaded directly
if (typeof window !== 'undefined') {
  // Check settings before initializing
  chrome.storage.local.get(['tottenhamSettings'], (result) => {
    const settings = result.tottenhamSettings || { enabled: true };
    if (settings.enabled !== false) {
      initMakeTottenhamPerfect();
    }
  });
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { makeTottenhamPerfect, initMakeTottenhamPerfect };
}

