const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  const code = event.queryStringParameters.code;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: "330202967434-9u0gnm9ud2f3oasfp0npn6br4h93qs8i.apps.googleusercontent.com",
      client_secret: clientSecret,
      redirect_uri: "https://pdfjpgtool.com/auth/google/callback",
      grant_type: "authorization_code"
    })
  });

  const data = await response.json();

  return {
    statusCode: 200,
    body: JSON.stringify(data, null, 2)
  };
};