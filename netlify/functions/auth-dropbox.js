exports.handler = async (event, context) => {
  return {
    statusCode: 302,
    headers: {
      Location: "https://www.dropbox.com/oauth2/authorize?client_id=ox2nxs1balk4l4i&redirect_uri=https://pdfjpgtool.com/auth/dropbox/callback&response_type=code"
    },
  };
};