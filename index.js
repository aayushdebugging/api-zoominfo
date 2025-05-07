import express from 'express';
import dotenv from 'dotenv';
import authClient from 'zoominfo-api-auth-client';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json()); // To parse JSON POST body

const username = process.env.ZOOMINFO_USERNAME;
const clientId = process.env.ZOOMINFO_CLIENT_ID;
const privateKey = process.env.ZOOMINFO_PRIVATE_KEY;

// GET token endpoint
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

// POST enrich endpoint
app.post('/enrich', async (req, res) => {
  const { firstName, lastName, companyName } = req.body;

  if (!firstName || !lastName || !companyName) {
    return res.status(400).json({ error: 'Missing firstName, lastName, or companyName' });
  }

  try {
    const accessToken = await authClient.getAccessTokenViaPKI(username, clientId, privateKey);

    const payload = {
      matchPersonInput: [{ firstName, lastName, companyName }],
      outputFields: ['employmentHistory']
    };

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

    if (!enrichedData?.employmentHistory) {
      return res.status(404).json({ error: 'No employment history found' });
    }

    const formattedHistory = enrichedData.employmentHistory.map(job => ({
      jobTitle: job.jobTitle || 'Unknown Title',
      fromDate: job.fromDate || null,
      toDate: job.toDate || null,
      companyName: job.company?.companyName || 'Unknown Company'
    }));

    res.json({ employmentHistory: formattedHistory });
  } catch (error) {
    console.error('❌ Enrichment failed:', error);
    res.status(500).json({ error: 'Failed to enrich contact' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
