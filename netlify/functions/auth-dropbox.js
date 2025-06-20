// netlify/functions/auth-dropbox.js
const querystring = require("querystring");

exports.handler = async () => {
  const DROPBOX_CLIENT_ID = process.env.DROPBOX_CLIENT_ID;
  const redirectUri = "https://pdfjpgtool.com/auth/dropbox/callback";

  const query = querystring.stringify({
    client_id: DROPBOX_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    token_access_type: "offline",
  });

  return {
    statusCode: 302,
    headers: {
      Location: `https://www.dropbox.com/oauth2/authorize?${query}`,
    },
  };
};

// netlify/functions/dropbox-callback.js
const fetch = require("node-fetch");

exports.handler = async (event) => {
  const code = event.queryStringParameters.code;
  const client_id = process.env.DROPBOX_CLIENT_ID;
  const client_secret = process.env.DROPBOX_CLIENT_SECRET;
  const redirect_uri = "https://pdfjpgtool.com/auth/dropbox/callback";

  const tokenRes = await fetch("https://api.dropbox.com/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      grant_type: "authorization_code",
      client_id,
      client_secret,
      redirect_uri,
    }),
  });

  const data = await tokenRes.json();
  return {
    statusCode: 200,
    body: JSON.stringify(data, null, 2),
  };
};

// netlify.toml
[build]
  publish = "."
  functions = "netlify/functions"
  environment = { DROPBOX_CLIENT_ID = "", DROPBOX_CLIENT_SECRET = "", GOOGLE_CLIENT_SECRET = "" }

[[redirects]]
  from = "/auth/dropbox"
  to = "/.netlify/functions/auth-dropbox"
  status = 200

[[redirects]]
  from = "/auth/dropbox/callback"
  to = "/.netlify/functions/dropbox-callback"
  status = 200

[[redirects]]
  from = "/auth/google"
  to = "/.netlify/functions/auth-google"
  status = 200

[[redirects]]
  from = "/auth/google/callback"
  to = "/.netlify/functions/google-callback"
  status = 200

[[redirects]]
  from = "/upload"
  to = "/.netlify/functions/unified-upload"
  status = 200
