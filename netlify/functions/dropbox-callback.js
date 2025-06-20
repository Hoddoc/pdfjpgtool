const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  const code = event.queryStringParameters.code;
  const clientSecret = process.env.DROPBOX_CLIENT_SECRET;

  const credentials = Buffer.from("ox2nxs1balk4l4i:" + clientSecret).toString("base64");

  const response = await fetch("https://api.dropboxapi.com/oauth2/token", {
    method: "POST",
    headers: {
      "Authorization": "Basic " + credentials,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      code,
      grant_type: "authorization_code",
      redirect_uri: "https://pdfjpgtool.com/auth/dropbox/callback"
    })
  });

  const data = await response.json();

  return {
    statusCode: 200,
    body: JSON.stringify(data, null, 2)
  };
};
