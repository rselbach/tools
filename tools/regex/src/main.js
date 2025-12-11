import './App.css';

// State
let currentEngine = 'javascript';
let activeFlags = new Set(['g']);
let debounceTimer = null;
let RE2Class = null;
let re2LoadError = null;

// DOM Elements
const engineSelect = document.getElementById('engine');
const engineInfo = document.getElementById('engine-info');
const patternInput = document.getElementById('pattern');
const testString = document.getElementById('test-string');
const highlightedOutput = document.getElementById('highlighted-output');
const errorMessage = document.getElementById('error-message');
const resultsSection = document.getElementById('results-section');
const resultsCount = document.getElementById('results-count');
const matchesList = document.getElementById('matches-list');
const flagsContainer = document.getElementById('flags-container');
const themeToggle = document.getElementById('theme-toggle');

// Theme handling
function initTheme() {
    const saved = localStorage.getItem('tools-theme');
    if (saved) {
        document.documentElement.setAttribute('data-theme', saved);
    }
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('tools-theme', next);
}

// Engine info messages
const engineInfoMessages = {
    javascript: 'JavaScript RegExp - supports backreferences and lookahead',
    re2: 'RE2/Go engine - no backreferences or lookahead, but safe from ReDoS'
};

// Lazy load RE2
async function loadRE2() {
    if (RE2Class) return RE2Class;
    if (re2LoadError) throw re2LoadError;
    
    try {
        const module = await import('re2-wasm');
        RE2Class = module.RE2;
        return RE2Class;
    } catch (e) {
        re2LoadError = e;
        console.error('Failed to load RE2:', e);
        throw e;
    }
}

// Initialize
function init() {
    initTheme();
    
    // Event listeners
    themeToggle.addEventListener('click', toggleTheme);
    engineSelect.addEventListener('change', handleEngineChange);
    patternInput.addEventListener('input', debounceUpdate);
    testString.addEventListener('input', debounceUpdate);
    
    // Flag buttons
    flagsContainer.querySelectorAll('.flag-btn').forEach(btn => {
        btn.addEventListener('click', () => toggleFlag(btn));
    });
    
    // Sync textarea scroll with highlighted output
    testString.addEventListener('scroll', syncScroll);
    
    // Initial update
    updateEngineUI();
    
    // Pre-load RE2 in background
    loadRE2().catch(() => {
        // Silently fail - will show error when user tries to use RE2
    });
}

function handleEngineChange() {
    currentEngine = engineSelect.value;
    updateEngineUI();
    runMatcher();
}

function updateEngineUI() {
    // Update info text
    engineInfo.querySelector('.info-text').textContent = engineInfoMessages[currentEngine];
    
    // Update flag visibility
    const jsOnlyFlags = flagsContainer.querySelectorAll('.js-only');
    jsOnlyFlags.forEach(btn => {
        if (currentEngine === 're2') {
            btn.classList.add('hidden');
            // Remove from active flags if hidden
            activeFlags.delete(btn.dataset.flag);
            btn.classList.remove('active');
        } else {
            btn.classList.remove('hidden');
        }
    });
}

function toggleFlag(btn) {
    const flag = btn.dataset.flag;
    if (activeFlags.has(flag)) {
        activeFlags.delete(flag);
        btn.classList.remove('active');
    } else {
        activeFlags.add(flag);
        btn.classList.add('active');
    }
    runMatcher();
}

function debounceUpdate() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(runMatcher, 150);
}

function syncScroll() {
    highlightedOutput.scrollTop = testString.scrollTop;
    highlightedOutput.scrollLeft = testString.scrollLeft;
}

function getFlags() {
    let flags = Array.from(activeFlags).join('');
    // RE2 requires 'u' flag
    if (currentEngine === 're2' && !flags.includes('u')) {
        flags += 'u';
    }
    return flags;
}

async function runMatcher() {
    const pattern = patternInput.value;
    const text = testString.value;
    
    // Clear previous results
    hideError();
    
    if (!pattern) {
        highlightedOutput.innerHTML = escapeHtml(text);
        resultsSection.classList.add('hidden');
        return;
    }
    
    try {
        const flags = getFlags();
        let regex;
        
        if (currentEngine === 're2') {
            try {
                const RE2 = await loadRE2();
                regex = new RE2(pattern, flags);
            } catch (e) {
                showError('Failed to load RE2 engine: ' + e.message);
                return;
            }
        } else {
            regex = new RegExp(pattern, flags);
        }
        
        const matches = findAllMatches(regex, text, flags.includes('g'));
        displayResults(matches, text);
        
    } catch (e) {
        showError(e.message);
        highlightedOutput.innerHTML = escapeHtml(text);
        resultsSection.classList.add('hidden');
    }
}

function findAllMatches(regex, text, isGlobal) {
    const matches = [];
    
    if (!isGlobal) {
        // Non-global: just find first match
        const match = regex.exec(text);
        if (match) {
            matches.push({
                text: match[0],
                index: match.index,
                groups: extractGroups(match)
            });
        }
    } else {
        // Global: find all matches
        let match;
        const seen = new Set(); // Prevent infinite loops on zero-width matches
        
        // Reset lastIndex for global regex
        regex.lastIndex = 0;
        
        while ((match = regex.exec(text)) !== null) {
            const key = `${match.index}:${match[0].length}`;
            if (seen.has(key)) break;
            seen.add(key);
            
            matches.push({
                text: match[0],
                index: match.index,
                groups: extractGroups(match)
            });
            
            // Prevent infinite loop on zero-width matches
            if (match[0].length === 0) {
                regex.lastIndex++;
            }
        }
    }
    
    return matches;
}

function extractGroups(match) {
    const groups = [];
    
    // Numbered groups (skip index 0 which is the full match)
    for (let i = 1; i < match.length; i++) {
        if (match[i] !== undefined) {
            groups.push({ name: `$${i}`, value: match[i] });
        }
    }
    
    // Named groups
    if (match.groups) {
        for (const [name, value] of Object.entries(match.groups)) {
            if (value !== undefined) {
                groups.push({ name: name, value: value, named: true });
            }
        }
    }
    
    return groups;
}

function displayResults(matches, text) {
    // Update match count
    const count = matches.length;
    resultsCount.textContent = count === 1 ? '1 match' : `${count} matches`;
    
    if (count === 0) {
        highlightedOutput.innerHTML = escapeHtml(text);
        resultsSection.classList.add('hidden');
        return;
    }
    
    // Highlight matches in text
    highlightedOutput.innerHTML = highlightMatches(text, matches);
    
    // Build matches list
    matchesList.innerHTML = matches.map((match, i) => {
        let groupsHtml = '';
        if (match.groups.length > 0) {
            groupsHtml = `
                <div class="match-groups">
                    ${match.groups.map(g => `
                        <span class="group ${g.named ? 'named' : ''}">
                            <span class="group-name">${escapeHtml(g.name)}</span>
                            <span class="group-value">${escapeHtml(g.value)}</span>
                        </span>
                    `).join('')}
                </div>
            `;
        }
        
        return `
            <div class="match-item">
                <div class="match-header">
                    <span class="match-number">#${i + 1}</span>
                    <span class="match-text">${escapeHtml(match.text)}</span>
                    <span class="match-index">index: ${match.index}</span>
                </div>
                ${groupsHtml}
            </div>
        `;
    }).join('');
    
    resultsSection.classList.remove('hidden');
}

function highlightMatches(text, matches) {
    if (matches.length === 0) {
        return escapeHtml(text);
    }
    
    // Sort matches by index (should already be sorted, but just in case)
    matches.sort((a, b) => a.index - b.index);
    
    let result = '';
    let lastIndex = 0;
    
    for (const match of matches) {
        // Add text before this match
        if (match.index > lastIndex) {
            result += escapeHtml(text.substring(lastIndex, match.index));
        }
        
        // Add highlighted match
        result += `<mark class="match-highlight">${escapeHtml(match.text)}</mark>`;
        
        lastIndex = match.index + match.text.length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
        result += escapeHtml(text.substring(lastIndex));
    }
    
    return result;
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
}

function hideError() {
    errorMessage.classList.add('hidden');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Start the app
document.addEventListener('DOMContentLoaded', init);
