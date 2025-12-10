// JWT Viewer - Main JavaScript

(function () {
    'use strict';

    // DOM elements
    const jwtInput = document.getElementById('jwt-input');
    const jwtDisplay = document.getElementById('jwt-display');
    const jwtDisplayHeader = document.getElementById('jwt-display-header');
    const jwtDisplayPayload = document.getElementById('jwt-display-payload');
    const jwtDisplaySignature = document.getElementById('jwt-display-signature');
    const errorMessage = document.getElementById('error-message');
    const decodedSections = document.getElementById('decoded-sections');
    const headerJson = document.getElementById('header-json');
    const headerAlg = document.getElementById('header-alg');
    const payloadJson = document.getElementById('payload-json');
    const signatureValue = document.getElementById('signature-value');
    const expirationPanel = document.getElementById('expiration-panel');
    const expirationIcon = document.getElementById('expiration-icon');
    const expirationText = document.getElementById('expiration-text');
    const expirationDetails = document.getElementById('expiration-details');


    // decode base64url to string
    function base64UrlDecode(str) {
        // replace base64url chars with base64 chars
        let base64 = str.replace(/-/g, '+').replace(/_/g, '/');

        // pad with = if needed
        const pad = base64.length % 4;
        if (pad) {
            base64 += '='.repeat(4 - pad);
        }

        // decode
        const decoded = atob(base64);

        // handle utf-8
        return decodeURIComponent(
            decoded
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
    }

    // parse JWT into parts
    function parseJWT(token) {
        const trimmed = token.trim();
        if (!trimmed) {
            return null;
        }

        const parts = trimmed.split('.');
        if (parts.length !== 3) {
            throw new Error(`Invalid JWT format: expected 3 parts, got ${parts.length}`);
        }

        const [headerB64, payloadB64, signatureB64] = parts;

        let header, payload;
        try {
            header = JSON.parse(base64UrlDecode(headerB64));
        } catch (e) {
            throw new Error('Invalid header: not valid base64 or JSON');
        }

        try {
            payload = JSON.parse(base64UrlDecode(payloadB64));
        } catch (e) {
            throw new Error('Invalid payload: not valid base64 or JSON');
        }

        return {
            raw: {
                header: headerB64,
                payload: payloadB64,
                signature: signatureB64,
            },
            header,
            payload,
            signature: signatureB64,
        };
    }

    // format timestamp to human-readable date
    function formatTimestamp(ts) {
        // JWT timestamps are in seconds, Date expects milliseconds
        const date = new Date(ts * 1000);
        return date.toLocaleString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'short',
        });
    }

    // get relative time string
    function getRelativeTime(ts) {
        const now = Date.now();
        const target = ts * 1000; // convert to ms
        const diff = target - now;
        const absDiff = Math.abs(diff);

        const seconds = Math.floor(absDiff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        let value, unit;
        if (days > 0) {
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

        if (diff > 0) {
            return `in ${value} ${unit}`;
        } else {
            return `${value} ${unit} ago`;
        }
    }

    // check expiration status
    function getExpirationStatus(payload) {
        const now = Math.floor(Date.now() / 1000);

        // check nbf (not before)
        if (payload.nbf && now < payload.nbf) {
            return {
                status: 'not-yet',
                message: 'Not yet valid',
                icon: '⏳',
            };
        }

        // check exp (expiration)
        if (payload.exp) {
            if (now > payload.exp) {
                return {
                    status: 'expired',
                    message: 'Expired',
                    icon: '✗',
                };
            } else {
                return {
                    status: 'valid',
                    message: 'Valid',
                    icon: '✓',
                };
            }
        }

        return null; // no expiration claim
    }

    // build expiration details HTML
    function buildExpirationDetails(payload) {
        const details = [];

        if (payload.iat) {
            details.push(`<div><strong>Issued:</strong> ${formatTimestamp(payload.iat)} (${getRelativeTime(payload.iat)})</div>`);
        }

        if (payload.nbf) {
            details.push(`<div><strong>Not Before:</strong> ${formatTimestamp(payload.nbf)} (${getRelativeTime(payload.nbf)})</div>`);
        }

        if (payload.exp) {
            details.push(`<div><strong>Expires:</strong> ${formatTimestamp(payload.exp)} (${getRelativeTime(payload.exp)})</div>`);
        }

        return details.join('');
    }

    // update the UI with decoded JWT
    function updateUI(jwt) {
        // show color-coded raw display
        jwtDisplayHeader.textContent = jwt.raw.header;
        jwtDisplayPayload.textContent = jwt.raw.payload;
        jwtDisplaySignature.textContent = jwt.raw.signature;
        jwtDisplay.classList.remove('hidden');

        // header panel
        const headerStr = JSON.stringify(jwt.header, null, 2);
        headerJson.textContent = headerStr;
        Prism.highlightElement(headerJson);

        if (jwt.header.alg) {
            headerAlg.textContent = jwt.header.alg;
        } else {
            headerAlg.textContent = '';
        }

        // payload panel
        const payloadStr = JSON.stringify(jwt.payload, null, 2);
        payloadJson.textContent = payloadStr;
        Prism.highlightElement(payloadJson);

        // signature panel
        signatureValue.textContent = jwt.signature;

        // expiration panel
        const expStatus = getExpirationStatus(jwt.payload);
        if (expStatus) {
            expirationPanel.classList.remove('hidden', 'valid', 'expired', 'not-yet');
            expirationPanel.classList.add(expStatus.status);
            expirationIcon.textContent = expStatus.icon;
            expirationText.textContent = expStatus.message;
            expirationDetails.innerHTML = buildExpirationDetails(jwt.payload);
        } else {
            expirationPanel.classList.add('hidden');
        }

        // show decoded sections
        decodedSections.classList.remove('hidden');
        errorMessage.classList.add('hidden');
    }

    // show error
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
        jwtDisplay.classList.add('hidden');
        decodedSections.classList.add('hidden');
    }

    // clear everything
    function clearUI() {
        errorMessage.classList.add('hidden');
        jwtDisplay.classList.add('hidden');
        decodedSections.classList.add('hidden');
    }

    // handle input changes
    function handleInput() {
        const value = jwtInput.value;

        if (!value.trim()) {
            clearUI();
            return;
        }

        try {
            const jwt = parseJWT(value);
            if (jwt) {
                updateUI(jwt);
            }
        } catch (e) {
            showError(e.message);
        }
    }

    // Prism theme handling - sync with page theme
    function syncPrismTheme() {
        const theme = document.documentElement.getAttribute('data-theme');
        const isLight = theme === 'light';
        document.getElementById('prism-theme-dark').disabled = isLight;
        document.getElementById('prism-theme-light').disabled = !isLight;

        // re-highlight if there's content
        if (!decodedSections.classList.contains('hidden')) {
            Prism.highlightElement(headerJson);
            Prism.highlightElement(payloadJson);
        }
    }

    // initialize
    function init() {
        // Sync Prism theme on load and when theme changes
        syncPrismTheme();
        window.addEventListener('theme-changed', syncPrismTheme);

        // event listeners
        jwtInput.addEventListener('input', handleInput);

        // focus input on load
        jwtInput.focus();
    }

    // run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
