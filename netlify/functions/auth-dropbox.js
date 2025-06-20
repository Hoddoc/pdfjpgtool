exports.handler = async (event, context) => {
  const DROPBOX_CLIENT_ID = "ox2nxs1balk4l4i";
  const REDIRECT_URI = "https://pdfjpgtool.com/auth/dropbox/callback";

  const dropboxAuthURL = `https://www.dropbox.com/oauth2/authorize?response_type=code&client_id=${DROPBOX_CLIENT_ID}&redirect_uri=${REDIRECT_URI}`;

  return {
    statusCode: 302,
    headers: {
      Location: dropboxAuthURL,
    },
  };
};
