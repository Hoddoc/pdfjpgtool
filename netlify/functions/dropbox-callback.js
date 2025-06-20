const fetch = require("node-fetch");

exports.handler = async (event, context) => {
  const code = event.queryStringParameters.code;

  const client_id = "ox2nxs1balk4l4i";
  const client_secret = "bjl30vxsvayyeiv";
  const redirect_uri = "https://pdfjpgtool.com/auth/dropbox/callback";

  const tokenURL = "https://api.dropboxapi.com/oauth2/token";

  const params = new URLSearchParams();
  params.append("code", code);
  params.append("grant_type", "authorization_code");
  params.append("client_id", client_id);
  params.append("client_secret", client_secret);
  params.append("redirect_uri", redirect_uri);

  try {
    const response = await fetch(tokenURL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
    });

    const data = await response.json();

    if (data.access_token) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "Dropbox 인증 성공",
          access_token: data.access_token,
        }),
      };
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "인증 실패", details: data }),
      };
    }
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "서버 오류", details: err.message }),
    };
  }
};
