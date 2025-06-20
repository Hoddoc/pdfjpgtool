exports.handler = async (event, context) => {
  const code = event.queryStringParameters.code;

  return {
    statusCode: 200,
    body: `Google 인증이 완료되었습니다. 전달받은 코드: ${code}`
  };
};