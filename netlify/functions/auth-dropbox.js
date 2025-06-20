exports.handler = async () => {
  const clientId = process.env.DROPBOX_CLIENT_ID;
  const redirectUri = "https://pdfjpgtool.com/auth/dropbox/callback";

  const url = `https://www.dropbox.com/oauth2/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}`;

  return {
    statusCode: 302,
    headers: {
      Location: url,
    },
  };
};
