import Pi from '@pi-apps/pi-sdk';

// Replace this with your Pi App Client ID
const PI_CLIENT_ID = 'REPLACE_WITH_PI_CLIENT_ID';

const statusEl = document.getElementById('status');
const signinBtn = document.getElementById('signin');

async function sendTokenToBackend(accessToken) {
  try {
    const res = await fetch('/.netlify/functions/pi-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken })
    });

    const data = await res.json();
    if (res.ok) {
      statusEl.textContent = `Authenticated — user: ${data?.data?.username || JSON.stringify(data.data)}`;
    } else {
      statusEl.textContent = `Backend validation failed: ${JSON.stringify(data)}`;
    }
  } catch (err) {
    console.error(err);
    statusEl.textContent = 'Network error when contacting backend.';
  }
}

async function authenticateFlow() {
  try {
    statusEl.textContent = 'Initializing Pi SDK...';
    // Await Pi.init fully before calling authenticate
    await Pi.init({ clientId: PI_CLIENT_ID });

    statusEl.textContent = 'Pi SDK initialized — performing authenticate...';

    // Use username scope as requested
    const result = await Pi.authenticate({ scope: ['username'] });

    const accessToken = result?.accessToken;
    if (!accessToken) {
      statusEl.textContent = 'Authentication completed but no access token was returned.';
      console.error('No access token in Pi.authenticate result:', result);
      return;
    }

    statusEl.textContent = 'Got access token — validating on backend...';
    await sendTokenToBackend(accessToken);
  } catch (err) {
    console.error(err);
    statusEl.textContent = `Authentication error: ${err?.message || err}`;
  }
}

// Trigger automatically when app loads
window.addEventListener('load', () => {
  authenticateFlow();
});

// Manual trigger
signinBtn.addEventListener('click', () => {
  authenticateFlow();
});
