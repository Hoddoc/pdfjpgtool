exports.handler = async (event, context) => {
  return {
    statusCode: 302,
    headers: {
      Location: "https://accounts.google.com/o/oauth2/v2/auth?" +
        new URLSearchParams({
          client_id: "330202967434-9u0gnm9ud2f3oasfp0npn6br4h93qs8i.apps.googleusercontent.com",
          redirect_uri: "https://pdfjpgtool.com/auth/google/callback",
          response_type: "code",
          scope: "https://www.googleapis.com/auth/drive.file",
          access_type: "offline",
          prompt: "consent"
        }),
    },
  };
};
