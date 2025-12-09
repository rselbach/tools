// Timestamp to Time - Main JavaScript

(function () {
    'use strict';

    // DOM elements
    const tsInput = document.getElementById('ts-input');
    const nowBtn = document.getElementById('now-btn');
    const errorMessage = document.getElementById('error-message');
    const resultSection = document.getElementById('result-section');
    const localTime = document.getElementById('local-time');
    const localDate = document.getElementById('local-date');
    const timezoneName = document.getElementById('timezone-name');
    const utcTime = document.getElementById('utc-time');
    const utcDate = document.getElementById('utc-date');
    const isoString = document.getElementById('iso-string');
    const copyIso = document.getElementById('copy-iso');
    const relativeTime = document.getElementById('relative-time');
    const themeToggle = document.getElementById('theme-toggle');

    // parse timestamp - handles seconds, milliseconds, nanoseconds
    function parseTimestamp(input) {
        const trimmed = input.trim();
        if (!trimmed) {
            return null;
        }

        // remove any non-digit characters except minus sign at start
        const cleaned = trimmed.replace(/[^\d-]/g, '');
        const num = parseInt(cleaned, 10);

        if (isNaN(num)) {
            throw new Error('Invalid timestamp: not a number');
        }

        // detect precision based on digit count
        const absNum = Math.abs(num);
        const digits = absNum.toString().length;

        let ms;
        if (digits <= 10) {
            // seconds (up to 9999999999 = Nov 2286)
            ms = num * 1000;
        } else if (digits <= 13) {
            // milliseconds
            ms = num;
        } else if (digits <= 16) {
            // microseconds
            ms = Math.floor(num / 1000);
        } else {
            // nanoseconds
            ms = Math.floor(num / 1000000);
        }

        // sanity check - reasonable date range
        const date = new Date(ms);
        if (isNaN(date.getTime())) {
            throw new Error('Invalid timestamp: results in invalid date');
        }

        const year = date.getFullYear();
        if (year < 1970 || year > 3000) {
            throw new Error(`Unusual year (${year}) - check your timestamp`);
        }

        return date;
    }

    // format time as HH:MM:SS
    function formatTime(date, utc = false) {
        const options = {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        };
        if (utc) {
            options.timeZone = 'UTC';
        }
        return date.toLocaleTimeString('en-US', options);
    }

    // format date as full readable date
    function formatDate(date, utc = false) {
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        };
        if (utc) {
            options.timeZone = 'UTC';
        }
        return date.toLocaleDateString('en-US', options);
    }

    // get timezone name
    function getTimezoneName() {
        try {
            return Intl.DateTimeFormat().resolvedOptions().timeZone;
        } catch (e) {
            return 'Local';
        }
    }

    // get relative time string
    function getRelativeTime(date) {
        const now = Date.now();
        const target = date.getTime();
        const diff = target - now;
        const absDiff = Math.abs(diff);

        const seconds = Math.floor(absDiff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        const weeks = Math.floor(days / 7);
        const months = Math.floor(days / 30);
        const years = Math.floor(days / 365);

        let value, unit;
        if (years > 0) {
            value = years;
            unit = years === 1 ? 'year' : 'years';
        } else if (months > 0) {
            value = months;
            unit = months === 1 ? 'month' : 'months';
        } else if (weeks > 0) {
            value = weeks;
            unit = weeks === 1 ? 'week' : 'weeks';
        } else if (days > 0) {
            value = days;
            unit = days === 1 ? 'day' : 'days';
        } else if (hours > 0) {
            value = hours;
            unit = hours === 1 ? 'hour' : 'hours';
        } else if (minutes > 0) {
            value = minutes;
            unit = minutes === 1 ? 'minute' : 'minutes';
        } else {
            value = seconds;
            unit = seconds === 1 ? 'second' : 'seconds';
        }

        if (absDiff < 1000) {
            return 'just now';
        } else if (diff > 0) {
            return `in ${value} ${unit}`;
        } else {
            return `${value} ${unit} ago`;
        }
    }

    // update UI with parsed date
    function updateUI(date) {
        // local time
        localTime.textContent = formatTime(date, false);
        localDate.textContent = formatDate(date, false);
        timezoneName.textContent = getTimezoneName();

        // UTC
        utcTime.textContent = formatTime(date, true);
        utcDate.textContent = formatDate(date, true);

        // ISO string
        isoString.textContent = date.toISOString();

        // relative time
        relativeTime.textContent = getRelativeTime(date);

        // show results
        resultSection.classList.remove('hidden');
        errorMessage.classList.add('hidden');
    }

    // show error
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
        resultSection.classList.add('hidden');
    }

    // clear UI
    function clearUI() {
        errorMessage.classList.add('hidden');
        resultSection.classList.add('hidden');
    }

    // handle input
    function handleInput() {
        const value = tsInput.value;

        if (!value.trim()) {
            clearUI();
            return;
        }

        try {
            const date = parseTimestamp(value);
            if (date) {
                updateUI(date);
            }
        } catch (e) {
            showError(e.message);
        }
    }

    // copy ISO string to clipboard
    async function copyIsoString() {
        const text = isoString.textContent;
        if (!text) return;

        try {
            await navigator.clipboard.writeText(text);
            copyIso.title = 'Copied!';
            setTimeout(() => {
                copyIso.title = 'Copy';
            }, 2000);
        } catch (e) {
            console.error('Failed to copy:', e);
        }
    }

    // insert current timestamp
    function insertNow() {
        tsInput.value = Math.floor(Date.now() / 1000).toString();
        handleInput();
    }

    // theme handling
    function initTheme() {
        const saved = localStorage.getItem('tstime-theme');
        if (saved === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
        }
    }

    function toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        const newTheme = current === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('tstime-theme', newTheme);
    }

    // initialize
    function init() {
        initTheme();

        // event listeners
        tsInput.addEventListener('input', handleInput);
        nowBtn.addEventListener('click', insertNow);
        copyIso.addEventListener('click', copyIsoString);
        themeToggle.addEventListener('click', toggleTheme);

        // focus input on load
        tsInput.focus();

        // update relative time every second if visible
        setInterval(() => {
            if (!resultSection.classList.contains('hidden')) {
                const value = tsInput.value;
                if (value.trim()) {
                    try {
                        const date = parseTimestamp(value);
                        if (date) {
                            relativeTime.textContent = getRelativeTime(date);
                        }
                    } catch (e) {
                        // ignore
                    }
                }
            }
        }, 1000);
    }

    // run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
