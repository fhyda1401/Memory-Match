// Netlify Function: Validate Pi access token by calling GET https://api.minepi.com/v2/me
// Accepts:
//  - POST JSON body: { accessToken: "<token>" }
//  - or Authorization header: "Bearer <token>"
//
// On success returns 200 JSON with the verified user payload from Pi.
// On failure returns the upstream error status and body.

exports.handler = async function (event) {
  const headers = event.headers || {};
  const contentType = headers['content-type'] || headers['Content-Type'] || '';
  let bodyData = {};
  if (event.body) {
    try {
      bodyData = contentType.includes('application/json') ? JSON.parse(event.body) : {};
    } catch (e) {
      // ignore parse error
      bodyData = {};
    }
  }

  // Extract token from body or Authorization header
  let accessToken = bodyData?.accessToken || bodyData?.token || null;
  if (!accessToken) {
    const authHeader = headers.authorization || headers.Authorization || '';
    if (authHeader.startsWith('Bearer ')) {
      accessToken = authHeader.slice(7).trim();
    }
  }

  if (!accessToken) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Missing access token' })
    };
  }

  try {
    const resp = await fetch('https://api.minepi.com/v2/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    const text = await resp.text();
    const contentType = resp.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    if (!resp.ok) {
      return {
        statusCode: resp.status,
        body: isJson ? text : JSON.stringify({ message: text })
      };
    }

    const data = isJson ? JSON.parse(text) : { raw: text };

    // Optionally establish a server-side session here.
    // For simplicity we return the validated user data to the client.
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    };
  } catch (err) {
    return {
      statusCode: 502,
      body: JSON.stringify({ message: 'Failed to validate token with Pi API', error: String(err) })
    };
  }
};
