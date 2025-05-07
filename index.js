import express from 'express';
import dotenv from 'dotenv';
import authClient from 'zoominfo-api-auth-client';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const username = process.env.ZOOMINFO_USERNAME;
const clientId = process.env.ZOOMINFO_CLIENT_ID;
const privateKey = process.env.ZOOMINFO_PRIVATE_KEY;

app.get('/get-token', async (req, res) => {
  try {
    const token = await authClient.getAccessTokenViaPKI(username, clientId, privateKey);
    console.log('✅ ZoomInfo Token Generated');
    res.json({ access_token: token });
  } catch (error) {
    console.error('❌ Token generation failed:', error);
    res.status(500).json({ error: 'Failed to generate access token' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Token server running on http://localhost:${PORT}`);
});
