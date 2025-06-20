const express = require('express');
const path = require('path');
const axios = require('axios');
const app = express();

const PORT = process.env.PORT || 5000;

// OAuth 설정 - pdfjpgtool.com 도메인 사용 (OAuth 앱에 등록된 정확한 주소)
const DROPBOX = {
  CLIENT_ID: 'ox2nxs1balk4l4i',
  CLIENT_SECRET: process.env.DROPBOX_CLIENT_SECRET,
  REDIRECT_URI: 'https://pdfjpgtool.com/dropbox/callback'
};

const GOOGLE = {
  CLIENT_ID: '330202967434-9u0gnm9ud2f3oasfp0npn6br4h93qs8i.apps.googleusercontent.com',
  CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  REDIRECT_URI: 'https://pdfjpgtool.com/google/callback'
};

// Basic middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
});

// CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// JSON parsing middleware
app.use(express.json());

// Serve static files
app.use(express.static('.'));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    port: PORT,
    dropboxRedirect: DROPBOX.REDIRECT_URI,
    googleRedirect: GOOGLE.REDIRECT_URI
  });
});

// Dropbox 인증 시작
app.get('/auth/dropbox', (req, res) => {
  console.log('Dropbox auth request received');
  console.log('Redirect URI:', DROPBOX.REDIRECT_URI);
  const url = `https://www.dropbox.com/oauth2/authorize?response_type=code&client_id=${DROPBOX.CLIENT_ID}&redirect_uri=${encodeURIComponent(DROPBOX.REDIRECT_URI)}`;
  console.log('Redirecting to:', url);
  res.redirect(url);
});

// Dropbox 콜백
app.get('/dropbox/callback', async (req, res) => {
  const code = req.query.code;
  const error = req.query.error;
  
  console.log('Dropbox callback received');
  console.log('Code:', code);
  console.log('Error:', error);
  
  if (error) {
    console.log('OAuth error:', error);
    res.send(`
      <script>
        if (window.opener) {
          window.opener.postMessage({
            type: 'dropbox_auth_error',
            error: 'User denied access'
          }, '*');
          window.close();
        } else {
          alert('Dropbox 인증이 취소되었습니다.');
          window.location.href = '/';
        }
      </script>
    `);
    return;
  }
  
  if (!code) {
    console.log('No authorization code received');
    res.send(`
      <script>
        if (window.opener) {
          window.opener.postMessage({
            type: 'dropbox_auth_error',
            error: 'No authorization code'
          }, '*');
          window.close();
        } else {
          alert('인증 코드를 받지 못했습니다.');
          window.location.href = '/';
        }
      </script>
    `);
    return;
  }

  try {
    console.log('Exchanging code for token...');
    const response = await axios.post('https://api.dropboxapi.com/oauth2/token', new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      client_id: DROPBOX.CLIENT_ID,
      client_secret: DROPBOX.CLIENT_SECRET,
      redirect_uri: DROPBOX.REDIRECT_URI
    }).toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    console.log('Dropbox token received successfully');
    
    res.send(`
      <script>
        if (window.opener) {
          window.opener.postMessage({
            type: 'dropbox_auth_success',
            token: '${response.data.access_token}',
            account_id: '${response.data.account_id || ''}'
          }, '*');
          window.close();
        } else {
          alert('Dropbox 연결이 완료되었습니다!');
          window.location.href = '/';
        }
      </script>
    `);
  } catch (err) {
    console.error('Dropbox token exchange error:', err.response?.data || err.message);
    res.send(`
      <script>
        if (window.opener) {
          window.opener.postMessage({
            type: 'dropbox_auth_error',
            error: 'Token exchange failed'
          }, '*');
          window.close();
        } else {
          alert('Dropbox 인증 중 오류가 발생했습니다.');
          window.location.href = '/';
        }
      </script>
    `);
  }
});

// Google 인증 시작
app.get('/auth/google', (req, res) => {
  console.log('Google auth request received');
  console.log('Redirect URI:', GOOGLE.REDIRECT_URI);
  const url = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${GOOGLE.CLIENT_ID}&redirect_uri=${encodeURIComponent(GOOGLE.REDIRECT_URI)}&scope=https://www.googleapis.com/auth/drive.file&access_type=offline&prompt=consent`;
  console.log('Redirecting to:', url);
  res.redirect(url);
});

// Google 콜백
app.get('/google/callback', async (req, res) => {
  const code = req.query.code;
  const error = req.query.error;
  
  console.log('Google callback received');
  console.log('Code:', code);
  console.log('Error:', error);
  
  if (error) {
    console.log('OAuth error:', error);
    res.send(`
      <script>
        if (window.opener) {
          window.opener.postMessage({
            type: 'google_auth_error',
            error: 'User denied access'
          }, '*');
          window.close();
        } else {
          alert('Google Drive 인증이 취소되었습니다.');
          window.location.href = '/';
        }
      </script>
    `);
    return;
  }
  
  if (!code) {
    console.log('No authorization code received');
    res.send(`
      <script>
        if (window.opener) {
          window.opener.postMessage({
            type: 'google_auth_error',
            error: 'No authorization code'
          }, '*');
          window.close();
        } else {
          alert('인증 코드를 받지 못했습니다.');
          window.location.href = '/';
        }
      </script>
    `);
    return;
  }

  try {
    console.log('Exchanging code for token...');
    const response = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: GOOGLE.CLIENT_ID,
      client_secret: GOOGLE.CLIENT_SECRET,
      redirect_uri: GOOGLE.REDIRECT_URI,
      grant_type: 'authorization_code'
    });

    console.log('Google token received successfully');
    
    res.send(`
      <script>
        if (window.opener) {
          window.opener.postMessage({
            type: 'google_auth_success',
            token: '${response.data.access_token}',
            refresh_token: '${response.data.refresh_token || ''}',
            expires_in: ${response.data.expires_in || 3600}
          }, '*');
          window.close();
        } else {
          alert('Google Drive 연결이 완료되었습니다!');
          window.location.href = '/';
        }
      </script>
    `);
  } catch (err) {
    console.error('Google token exchange error:', err.response?.data || err.message);
    res.send(`
      <script>
        if (window.opener) {
          window.opener.postMessage({
            type: 'google_auth_error',
            error: 'Token exchange failed'
          }, '*');
          window.close();
        } else {
          alert('Google Drive 인증 중 오류가 발생했습니다.');
          window.location.href = '/';
        }
      </script>
    `);
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ 서버 실행 중: http://0.0.0.0:${PORT}`);
  console.log(`🔐 Dropbox callback: ${DROPBOX.REDIRECT_URI}`);
  console.log(`🔐 Google callback: ${GOOGLE.REDIRECT_URI}`);
  console.log(`📡 OAuth configured for pdfjpgtool.com domain`);
});