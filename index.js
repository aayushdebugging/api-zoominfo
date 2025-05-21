// server.js

import express from 'express';
import dotenv from 'dotenv';
import authClient from 'zoominfo-api-auth-client';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ZoomInfo Credentials
const username = process.env.ZOOMINFO_USERNAME;
const clientId = process.env.ZOOMINFO_CLIENT_ID;
const privateKey = process.env.ZOOMINFO_PRIVATE_KEY;

/**
 * GET /get-token
 * Retrieves ZoomInfo API token using PKI auth
 */
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

/**
 * POST /enrich
 * Enriches a contact using firstName, lastName, and companyId
 */
app.post('/enrich', async (req, res) => {
  const { firstName, lastName, companyName } = req.body;

  if (!firstName || !lastName || !companyName) {
    return res.status(400).json({ error: 'Missing required fields: firstName, lastName, companyId' });
  }

  try {
    const accessToken = await authClient.getAccessTokenViaPKI(username, clientId, privateKey);

    const payload = {
      matchPersonInput: [{ firstName, lastName, companyName }],
      outputFields: [
  "firstName",
  "lastName",
  "jobTitle",
  "companyName",
  "city",
  "state",
  "country",
  "employmentHistory",
  "externalUrls",
  "email",
  "hashedEmails",
  "phone",
  "mobilePhoneDoNotCall",
  "education"
]};

    const response = await fetch('https://api.zoominfo.com/enrich/contact', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    const enrichedData = result?.data?.result?.[0]?.data?.[0];

    if (!enrichedData) {
      return res.status(404).json({ error: 'No contact data found' });
    }

    res.json({ enrichedProfile: enrichedData });
  } catch (error) {
    console.error('❌ Enrichment failed:', error);
    res.status(500).json({ error: 'Failed to enrich contact' });
  }
});

/**
 * POST /search-candidates
 * Searches ZoomInfo contacts by filters
 */
app.post('/search-candidates', async (req, res) => {
  const { department, managementLevel, metroRegion, industryCodes, rpp = 10 } = req.body;

  if (!department || !managementLevel || !metroRegion || !industryCodes) {
    return res.status(400).json({
      error: 'Missing one or more required fields: department, managementLevel, metroRegion, industryCodes'
    });
  }

  try {
    const accessToken = await authClient.getAccessTokenViaPKI(username, clientId, privateKey);

    const payload = {
      department,
      managementLevel,
      metroRegion,
      industryCodes,
      rpp
    };

    const response = await fetch('https://api.zoominfo.com/search/contact', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!data?.data || data.data.length === 0) {
      return res.status(404).json({ error: 'No candidates found' });
    }

    res.json({ candidates: data.data });
  } catch (error) {
    console.error('❌ Candidate search failed:', error);
    res.status(500).json({ error: 'Failed to search for candidates' });
  }
});

// Start Express server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
