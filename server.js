const express = require('express');
const axios = require('axios');
const path = require('path');
const rateLimit = require('express-rate-limit');
const app = express();

const PORT = process.env.PORT || 5000;

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// Determine base URL
const getBaseURL = () => {
  if (process.env.REPLIT_DEPLOYMENT) {
    return `https://${process.env.REPLIT_DEPLOYMENT}`;
  }
  return 'https://3310ffde-0425-4fd5-97c8-2cf58ee38cff.id.replit.app';
};

const BASE_URL = getBaseURL();

// OAuth configurations
const DROPBOX = {
  CLIENT_ID: 'ox2nxs1balk4l4i',
  CLIENT_SECRET: process.env.DROPBOX_CLIENT_SECRET,
  REDIRECT_URI: `${BASE_URL}/dropbox/callback`
};

const GOOGLE = {
  CLIENT_ID: '330202967434-9u0gnm9ud2f3oasfp0npn6br4h93qs8i.apps.googleusercontent.com',
  CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  REDIRECT_URI: `${BASE_URL}/google/callback`
};

// Serve static files
app.use(express.static(__dirname));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL 
  });
});

// Dropbox OAuth
app.get('/auth/dropbox', (req, res) => {
  const url = `https://www.dropbox.com/oauth2/authorize?response_type=code&client_id=${DROPBOX.CLIENT_ID}&redirect_uri=${encodeURIComponent(DROPBOX.REDIRECT_URI)}`;
  res.redirect(url);
});

app.get('/dropbox/callback', async (req, res) => {
  const code = req.query.code;
  const error = req.query.error;

  if (error) {
    return res.send(`<script>alert('Dropbox 인증 취소'); window.location.href = '/';</script>`);
  }

  if (!code) {
    return res.send(`<script>alert('인증 코드 없음'); window.location.href = '/';</script>`);
  }

  try {
    const response = await axios.post('https://api.dropboxapi.com/oauth2/token', 
      new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        client_id: DROPBOX.CLIENT_ID,
        client_secret: DROPBOX.CLIENT_SECRET,
        redirect_uri: DROPBOX.REDIRECT_URI
      }), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );

    res.send(`<h2>Dropbox 연결 성공!</h2><pre>${JSON.stringify(response.data, null, 2)}</pre>`);
  } catch (err) {
    res.status(500).send('Dropbox 인증 오류: ' + err.message);
  }
});

// Google OAuth
app.get('/auth/google', (req, res) => {
  const url = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${GOOGLE.CLIENT_ID}&redirect_uri=${encodeURIComponent(GOOGLE.REDIRECT_URI)}&scope=https://www.googleapis.com/auth/drive.file&access_type=offline&prompt=consent`;
  res.redirect(url);
});

app.get('/google/callback', async (req, res) => {
  const code = req.query.code;
  const error = req.query.error;

  if (error) {
    return res.send(`<script>alert('Google 인증 취소'); window.location.href = '/';</script>`);
  }

  if (!code) {
    return res.send(`<script>alert('인증 코드 없음'); window.location.href = '/';</script>`);
  }

  try {
    const response = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: GOOGLE.CLIENT_ID,
      client_secret: GOOGLE.CLIENT_SECRET,
      redirect_uri: GOOGLE.REDIRECT_URI,
      grant_type: 'authorization_code'
    });

    res.send(`<h2>Google Drive 연결 성공!</h2><pre>${JSON.stringify(response.data, null, 2)}</pre>`);
  } catch (err) {
    res.status(500).send('Google 인증 오류: ' + err.message);
  }
});

// Default route
const rootLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.'
});

app.get('/', rootLimiter, (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ 서버 실행 중: http://0.0.0.0:${PORT}`);
  console.log(`📡 Public URL: ${BASE_URL}`);
});