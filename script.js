// Time zone identifiers (IANA timezone names)
const timeZones = {
    'Manila': 'Asia/Manila',
    'Gothenburg': 'Europe/Stockholm', // Gothenburg uses Stockholm timezone
    'Chennai': 'Asia/Kolkata',
    'Hanoi': 'Asia/Ho_Chi_Minh',
    'Dubai': 'Asia/Dubai',
    'Saudi Arabia': 'Asia/Riyadh',
    'London': 'Europe/London',
    'Japan': 'Asia/Tokyo',
    'South Korea': 'Asia/Seoul',
    'Estonia': 'Europe/Tallinn'
};

// City names in order
// Load saved order from localStorage, or use default order
function loadCityOrder() {
    const saved = localStorage.getItem('timezoneColumnOrder');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            // Validate that all cities are present
            const defaultCities = ['Manila', 'Gothenburg', 'Chennai', 'Hanoi', 'Dubai', 'Saudi Arabia', 'London', 'Japan', 'South Korea', 'Estonia'];
            const allPresent = defaultCities.every(city => parsed.includes(city));
            const allValid = parsed.every(city => defaultCities.includes(city));
            if (allPresent && allValid && parsed.length === defaultCities.length) {
                return parsed;
            }
        } catch (e) {
            console.warn('Failed to load saved column order:', e);
        }
    }
    return ['Manila', 'Gothenburg', 'Chennai', 'Hanoi', 'Dubai', 'Saudi Arabia', 'London', 'Japan', 'South Korea', 'Estonia'];
}

let cities = loadCityOrder();

// Save city order to localStorage
function saveCityOrder() {
    localStorage.setItem('timezoneColumnOrder', JSON.stringify(cities));
}

// Initialize currentDate using UTC to avoid timezone issues
let currentDate = new Date();
currentDate = new Date(Date.UTC(
    currentDate.getUTCFullYear(),
    currentDate.getUTCMonth(),
    currentDate.getUTCDate(),
    0, 0, 0, 0
));

// Format date for display
function formatDate(date) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    
    const dayName = days[date.getUTCDay()];
    const day = date.getUTCDate();
    const month = months[date.getUTCMonth()];
    const year = date.getUTCFullYear();
    
    return `${dayName}, ${day} ${month} ${year}`;
}

// Format time for display
// Uses Intl API which automatically handles DST transitions based on IANA timezone data
function formatTime(utcDate, timezoneId) {
    // Create a fresh formatter each time to ensure we always use current timezone rules
    // This is important for DST transitions and timezone rule updates
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezoneId,
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
    
    const parts = formatter.formatToParts(utcDate);
    const dayName = parts.find(p => p.type === 'weekday').value;
    const hours = parts.find(p => p.type === 'hour').value;
    const minutes = parts.find(p => p.type === 'minute').value;
    
    return `${dayName} ${hours}:${minutes}`;
}

// Format UTC time for display
function formatUTCTime(date) {
    // getUTCDay() returns 0 for Sunday, 1 for Monday, etc.
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    
    const dayName = days[date.getUTCDay()];
    const day = date.getUTCDate();
    const month = months[date.getUTCMonth()];
    const year = date.getUTCFullYear();
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');
    
    return `${dayName}, ${day} ${month} ${year}, ${hours}:${minutes}:${seconds}`;
}

// Get day class for styling
function getDayClass(date) {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return `day-${days[date.getUTCDay()]}`;
}

// Check if time is current (within current hour)
function isCurrentTime(date) {
    const now = new Date();
    const nowUTC = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        now.getUTCHours()
    ));
    const dateUTC = new Date(Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        date.getUTCHours()
    ));
    
    return nowUTC.getTime() === dateUTC.getTime();
}

// Get cell class based on working hours
// Uses Intl API to get accurate local time, automatically accounting for DST
function getCellClass(utcDate, timezoneId, cityName) {
    // Create a fresh formatter to ensure current DST rules are applied
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezoneId,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
    
    const parts = formatter.formatToParts(utcDate);
    const localHour = parseInt(parts.find(p => p.type === 'hour').value);
    const localMinute = parseInt(parts.find(p => p.type === 'minute').value);
    const localTime = localHour * 60 + localMinute; // Convert to minutes for easier comparison
    
    // Manila has different working hours: 12 PM - 9 PM
    if (cityName === 'Manila') {
        if (localHour >= 12 && localHour < 21) {
            return 'working-hours';
        }
    } 
    // Hanoi (Vietnam): 8:30 AM - 5:30 PM
    else if (cityName === 'Hanoi') {
        const startTime = 8 * 60 + 30; // 8:30 AM in minutes
        const endTime = 17 * 60 + 30; // 5:30 PM in minutes
        if (localTime >= startTime && localTime < endTime) {
            return 'working-hours';
        }
    } 
    // All other places: 8 AM - 5 PM
    else {
        if (localHour >= 8 && localHour < 17) {
            return 'working-hours';
        }
    }
    
    return '';
}

// Generate table header based on current city order
function generateTableHeader() {
    const thead = document.querySelector('thead tr');
    if (!thead) return;
    
    // Keep UTC Time header
    const utcHeader = thead.querySelector('th:first-child');
    const utcHeaderHTML = utcHeader ? utcHeader.outerHTML : '<th>UTC Time</th>';
    
    // Generate city headers based on current order
    const cityHeaders = cities.map(city => {
        const tzInfo = {
            'Manila': '(UTC+8)',
            'Gothenburg': '(CET/CEST)',
            'Chennai': '(IST)',
            'Hanoi': '(ICT)',
            'Dubai': '(GST)',
            'Saudi Arabia': '(AST)',
            'London': '(GMT/BST)',
            'Japan': '(UTC+9)',
            'South Korea': '(UTC+9)',
            'Estonia': '(EET/EEST)'
        };
        
        return `<th>${city}<br><span class="tz-info">${tzInfo[city]}</span></th>`;
    }).join('');
    
    thead.innerHTML = utcHeaderHTML + cityHeaders;
}

// Generate table rows
// This function always uses fresh Date objects and Intl API calls
// to ensure DST transitions are correctly handled
function generateTable() {
    const tableBody = document.getElementById('tableBody');
    const dateDisplay = document.getElementById('currentDate');
    
    // Save current selection state before clearing table
    const savedSelection = {
        startRow: selectionStartRow,
        endRow: selectionEndRow
    };
    
    // Generate header first to match current city order
    generateTableHeader();
    
    // Create a fresh copy of currentDate to avoid any stale references
    const baseDate = new Date(currentDate.getTime());
    
    dateDisplay.textContent = formatDate(baseDate);
    
    tableBody.innerHTML = '';
    
    // Generate 24 hours of data
    // Each iteration creates a fresh Date object to ensure accurate timezone conversions
    for (let hour = 0; hour < 24; hour++) {
        const utcDate = new Date(baseDate);
        utcDate.setUTCHours(hour, 0, 0, 0);
        
        const row = document.createElement('tr');
        const isCurrent = isCurrentTime(utcDate);
        
        if (isCurrent) {
            row.classList.add('highlight-row');
        }
        
        row.classList.add(getDayClass(utcDate));
        
        // UTC time cell
        const utcCell = document.createElement('td');
        utcCell.className = 'utc-time';
        const utcText = formatUTCTime(utcDate);
        utcCell.innerHTML = isCurrent 
            ? `<span>🕐</span> ${utcText}`
            : utcText;
        row.appendChild(utcCell);
        
        // City time cells
        cities.forEach(city => {
            const cell = document.createElement('td');
            cell.className = 'time-cell';
            
            const timezoneId = timeZones[city];
            const cellClass = getCellClass(utcDate, timezoneId, city);
            if (cellClass) {
                cell.classList.add(cellClass);
            }
            
            cell.textContent = formatTime(utcDate, timezoneId);
            row.appendChild(cell);
        });
        
        tableBody.appendChild(row);
    }
    
    // Restore selection state after table is generated
    // We'll restore both the state variables and the visual selection
    if (savedSelection.startRow !== null && savedSelection.endRow !== null) {
        selectionStartRow = savedSelection.startRow;
        selectionEndRow = savedSelection.endRow;
    } else {
        // Clear selection state if there wasn't one
        selectionStartRow = null;
        selectionEndRow = null;
    }
    
    // Re-setup drag and drop after table generation to ensure handlers are attached
    // (needed because generateTableHeader() replaces the header HTML)
    setTimeout(() => {
        setupColumnDragAndDrop();
        setupRowSelection();
        
        // Always restore selection after setupRowSelection completes
        // This ensures the visual selection is applied even if setupRowSelection cleared it
        if (selectionStartRow !== null && selectionEndRow !== null) {
            // Use a small delay to ensure DOM is fully ready
            setTimeout(() => {
                updateRowSelection();
            }, 10);
        }
    }, 0);
}

// Navigation functions
// Always create fresh Date objects to ensure timezone calculations are current
function goToToday() {
    // Clear selection when changing days
    clearRowSelection();
    
    // Create a fresh Date object to get the current time
    const now = new Date();
    currentDate = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        0, 0, 0, 0
    ));
    generateTable();
}

function goToPreviousDay() {
    // Clear selection when changing days
    clearRowSelection();
    
    // Create a new Date object to avoid mutation issues
    const newDate = new Date(currentDate);
    newDate.setUTCDate(newDate.getUTCDate() - 1);
    currentDate = newDate;
    generateTable();
}

function goToNextDay() {
    // Clear selection when changing days
    clearRowSelection();
    
    // Create a new Date object to avoid mutation issues
    const newDate = new Date(currentDate);
    newDate.setUTCDate(newDate.getUTCDate() + 1);
    currentDate = newDate;
    generateTable();
}

// Drag and drop functionality for column reordering
function setupColumnDragAndDrop() {
    const thead = document.querySelector('thead tr');
    if (!thead) return;
    
    const headers = Array.from(thead.querySelectorAll('th'));
    // Skip the first column (UTC Time) - it's not draggable
    const draggableHeaders = headers.slice(1);
    
    let draggedColumn = null;
    let draggedIndex = -1;
    let dragOverIndex = -1;
    
    draggableHeaders.forEach((header, index) => {
        header.classList.add('draggable');
        header.setAttribute('draggable', 'true');
        header.setAttribute('data-column-index', index);
        
        header.addEventListener('dragstart', (e) => {
            draggedColumn = header;
            draggedIndex = parseInt(header.getAttribute('data-column-index'));
            header.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', header.innerHTML);
            
            // Add a slight delay to ensure the dragging class is applied
            setTimeout(() => {
                if (header.classList.contains('dragging')) {
                    header.style.opacity = '0.4';
                }
            }, 0);
        });
        
        header.addEventListener('dragend', (e) => {
            // Remove all drag-related classes with smooth transition
            header.classList.remove('dragging');
            header.style.opacity = '';
            
            // Remove drag-over class from all headers with a slight delay for smooth transition
            setTimeout(() => {
                draggableHeaders.forEach(h => {
                    h.classList.remove('drag-over');
                    h.style.transform = '';
                });
            }, 100);
        });
        
        header.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            const targetIndex = parseInt(header.getAttribute('data-column-index'));
            
            if (targetIndex !== draggedIndex) {
                // Remove drag-over from previous target
                if (dragOverIndex !== -1 && dragOverIndex !== targetIndex) {
                    const prevHeader = draggableHeaders[dragOverIndex];
                    prevHeader.classList.remove('drag-over');
                }
                
                // Add drag-over to current target
                header.classList.add('drag-over');
                dragOverIndex = targetIndex;
            }
        });
        
        header.addEventListener('dragleave', (e) => {
            // Only remove drag-over if we're actually leaving the header
            // (not just moving to a child element)
            const rect = header.getBoundingClientRect();
            const x = e.clientX;
            const y = e.clientY;
            
            if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
                header.classList.remove('drag-over');
                if (dragOverIndex === parseInt(header.getAttribute('data-column-index'))) {
                    dragOverIndex = -1;
                }
            }
        });
        
        header.addEventListener('drop', (e) => {
            e.preventDefault();
            header.classList.remove('drag-over');
            dragOverIndex = -1;
            
            const targetIndex = parseInt(header.getAttribute('data-column-index'));
            
            if (draggedIndex !== -1 && targetIndex !== draggedIndex) {
                // Reorder cities array
                const cityToMove = cities[draggedIndex];
                cities.splice(draggedIndex, 1);
                cities.splice(targetIndex, 0, cityToMove);
                
                // Save the new order
                saveCityOrder();
                
                // Add a smooth transition effect before regenerating
                const table = document.getElementById('timeTable');
                table.style.opacity = '0.7';
                table.style.transform = 'scale(0.98)';
                
                // Regenerate table with new column order
                setTimeout(() => {
                    generateTable();
                    
                    // Restore table appearance with smooth transition
                    setTimeout(() => {
                        table.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                        table.style.opacity = '1';
                        table.style.transform = 'scale(1)';
                        
                        // Remove transition after animation completes
                        setTimeout(() => {
                            table.style.transition = '';
                        }, 300);
                    }, 50);
                }, 150);
                
                // Re-setup drag and drop for the new column order
                setTimeout(() => {
                    setupColumnDragAndDrop();
                }, 200);
            }
        });
    });
}

// Row selection functionality
let isSelecting = false;
let selectionStartRow = null;
let selectionEndRow = null;

function clearRowSelection() {
    const tableBody = document.getElementById('tableBody');
    if (tableBody) {
        const rows = tableBody.querySelectorAll('tr');
        rows.forEach(row => {
            row.classList.remove('row-selected', 'row-selected-start', 'row-selected-end');
        });
    }
    selectionStartRow = null;
    selectionEndRow = null;
}

function updateRowSelection() {
    if (selectionStartRow === null || selectionEndRow === null) {
        return;
    }
    
    const tableBody = document.getElementById('tableBody');
    if (!tableBody) return;
    
    const rows = Array.from(tableBody.querySelectorAll('tr'));
    const startIndex = Math.min(selectionStartRow, selectionEndRow);
    const endIndex = Math.max(selectionStartRow, selectionEndRow);
    
    // Clear all selections first
    rows.forEach(row => {
        row.classList.remove('row-selected', 'row-selected-start', 'row-selected-end');
    });
    
    // Apply selection to range
    for (let i = startIndex; i <= endIndex; i++) {
        if (rows[i]) {
            rows[i].classList.add('row-selected');
            if (i === startIndex) {
                rows[i].classList.add('row-selected-start');
            }
            if (i === endIndex) {
                rows[i].classList.add('row-selected-end');
            }
        }
    }
}

function getRowIndexFromElement(element) {
    // Find the row (tr) element
    let row = element;
    while (row && row.tagName !== 'TR') {
        row = row.parentElement;
    }
    
    if (!row) return null;
    
    const tableBody = document.getElementById('tableBody');
    if (!tableBody) return null;
    
    const rows = Array.from(tableBody.querySelectorAll('tr'));
    return rows.indexOf(row);
}

// Set up document-level event listeners once
let rowSelectionListenersSetup = false;

function setupRowSelection() {
    const tableBody = document.getElementById('tableBody');
    if (!tableBody) return;
    
    // Use event delegation on the table for better performance
    // This way we don't need to reattach listeners when table regenerates
    // Note: We don't clear selection here - it's preserved across table regenerations
    if (!rowSelectionListenersSetup) {
        const timeTable = document.getElementById('timeTable');
        if (timeTable) {
            // Use event delegation on the table
            timeTable.addEventListener('mousedown', (e) => {
                const cell = e.target.closest('td');
                if (!cell) return;
                
                // Skip the first column (UTC time) - don't allow selection from there
                if (cell.classList.contains('utc-time')) {
                    return;
                }
                
                // Don't interfere with column drag and drop
                if (e.target.closest('th')) {
                    return;
                }
                
                e.preventDefault();
                isSelecting = true;
                
                const rowIndex = getRowIndexFromElement(cell);
                if (rowIndex !== null) {
                    selectionStartRow = rowIndex;
                    selectionEndRow = rowIndex;
                    updateRowSelection();
                }
            });
            
            timeTable.addEventListener('mousemove', (e) => {
                if (!isSelecting) return;
                
                const cell = e.target.closest('td');
                if (!cell || cell.classList.contains('utc-time')) {
                    return;
                }
                
                const rowIndex = getRowIndexFromElement(cell);
                if (rowIndex !== null && selectionStartRow !== null && rowIndex !== selectionEndRow) {
                    selectionEndRow = rowIndex;
                    updateRowSelection();
                }
            });
            
            // Handle mouse up anywhere to end selection
            document.addEventListener('mouseup', () => {
                if (isSelecting) {
                    isSelecting = false;
                }
            });
            
            // Clear selection when clicking outside the table
            document.addEventListener('click', (e) => {
                if (!e.target.closest('#timeTable')) {
                    clearRowSelection();
                }
            });
            
            rowSelectionListenersSetup = true;
        }
    }
}

// UTC column collapse functionality
function loadUTCCollapseState() {
    const saved = localStorage.getItem('utcColumnCollapsed');
    return saved === 'true';
}

function saveUTCCollapseState(collapsed) {
    localStorage.setItem('utcColumnCollapsed', collapsed.toString());
}

function toggleUTCColumn() {
    const table = document.getElementById('timeTable');
    const toggleText = document.getElementById('utcToggleText');
    const isCollapsed = table.classList.contains('utc-collapsed');
    
    if (isCollapsed) {
        // Show UTC column
        table.classList.remove('utc-collapsed');
        toggleText.textContent = 'Hide UTC Time';
        saveUTCCollapseState(false);
    } else {
        // Hide UTC column
        table.classList.add('utc-collapsed');
        toggleText.textContent = 'Show UTC Time';
        saveUTCCollapseState(true);
    }
}

function initializeUTCCollapse() {
    const table = document.getElementById('timeTable');
    const toggleText = document.getElementById('utcToggleText');
    const isCollapsed = loadUTCCollapseState();
    
    if (isCollapsed) {
        table.classList.add('utc-collapsed');
        toggleText.textContent = 'Show UTC Time';
    } else {
        toggleText.textContent = 'Hide UTC Time';
    }
}

// Event listeners
document.getElementById('today').addEventListener('click', goToToday);
document.getElementById('prevDay').addEventListener('click', goToPreviousDay);
document.getElementById('nextDay').addEventListener('click', goToNextDay);
document.getElementById('toggleUTC').addEventListener('click', toggleUTCColumn);

// Initialize
generateTable();
setupColumnDragAndDrop();
initializeUTCCollapse();

// Auto-refresh mechanism to ensure times stay updated, especially during DST transitions
// Refresh more frequently to catch DST changes (which typically occur at 2 AM local time)
let refreshInterval = 30000; // Start with 30 seconds

// Function to check if we should refresh more frequently (near DST transition times)
function shouldRefreshFrequently() {
    const now = new Date();
    const utcHour = now.getUTCHours();
    
    // DST transitions typically happen around 1-3 AM UTC for most timezones
    // Refresh every 10 seconds during these hours to catch transitions
    if (utcHour >= 1 && utcHour <= 3) {
        return true;
    }
    return false;
}

// Set up auto-refresh with adaptive interval
function setupAutoRefresh() {
    // Clear any existing interval
    if (window.refreshTimer) {
        clearInterval(window.refreshTimer);
    }
    
    // Determine refresh interval based on time
    refreshInterval = shouldRefreshFrequently() ? 10000 : 30000; // 10s during DST hours, 30s otherwise
    
    window.refreshTimer = setInterval(() => {
        const now = new Date();
        const currentDay = new Date(Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate()
        ));
        const displayedDay = new Date(Date.UTC(
            currentDate.getUTCFullYear(),
            currentDate.getUTCMonth(),
            currentDate.getUTCDate()
        ));
        
        // Always regenerate if we're viewing today to catch DST changes
        // Also regenerate if viewing dates near today (within 1 day) to catch transitions
        const dayDiff = Math.abs((currentDay.getTime() - displayedDay.getTime()) / (1000 * 60 * 60 * 24));
        if (dayDiff <= 1) {
            generateTable();
        }
        
        // Adjust refresh interval if needed
        const newInterval = shouldRefreshFrequently() ? 10000 : 30000;
        if (newInterval !== refreshInterval) {
            refreshInterval = newInterval;
            setupAutoRefresh(); // Restart with new interval
        }
    }, refreshInterval);
}

// Initialize auto-refresh
setupAutoRefresh();

// Also refresh when the page becomes visible again (handles tab switching)
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        // Page is visible again, refresh to ensure times are current
        generateTable();
    }
});

