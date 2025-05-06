import express from 'express';
import bodyParser from 'body-parser';
import axios from 'axios';
import dotenv from 'dotenv';
import authClient from 'zoominfo-api-auth-client';

const app = express();
const PORT =  3000;

app.use(bodyParser.json());

const ZOOMINFO_USERNAME = process.env.ZOOMINFO_USERNAME;
const ZOOMINFO_CLIENT_ID = process.env.ZOOMINFO_CLIENT_ID;
const ZOOMINFO_PRIVATE_KEY = process.env.ZOOMINFO_PRIVATE_KEY;

if (!ZOOMINFO_USERNAME || !ZOOMINFO_CLIENT_ID || !ZOOMINFO_PRIVATE_KEY) {
  throw new Error("🚨 Missing required ZoomInfo credentials. Please check your .env file.");
}

// API to query ZoomInfo contact
app.post('/query-person', async (req, res) => {
  const { firstName, lastName, companyName } = req.body;

  if (!firstName || !lastName || !companyName) {
    return res.status(400).json({ error: 'Missing required fields: firstName, lastName, companyName' });
  }

  try {
    // Step 1: Get Token
    const token = await authClient.getAccessTokenViaPKI(
      ZOOMINFO_USERNAME,
      ZOOMINFO_CLIENT_ID,
      ZOOMINFO_PRIVATE_KEY
    );

    // Step 2: Query ZoomInfo API
    const response = await axios.post(
      'https://api.zoominfo.com/search/contact',
      {
        firstName,
        lastName,
        companyName
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json(response.data);

  } catch (error) {
    console.error("❌ Error querying ZoomInfo:", error.response?.data || error.message);
    res.status(500).json({ error: 'ZoomInfo query failed', details: error.response?.data || error.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
