// netlify/functions/auth-dropbox.js
const querystring = require("querystring");

exports.handler = async (event) => {
  const DROPBOX_CLIENT_ID = process.env.DROPBOX_CLIENT_ID;
  const REDIRECT_URI = "https://pdfjpgtool.com/auth/dropbox/callback";

  const params = querystring.stringify({
    response_type: "code",
    client_id: DROPBOX_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    token_access_type: "offline"
  });

  return {
    statusCode: 302,
    headers: {
      Location: `https://www.dropbox.com/oauth2/authorize?${params}`,
    },
  };
};
