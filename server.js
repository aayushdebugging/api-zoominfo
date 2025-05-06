import authClient from 'zoominfo-api-auth-client';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const username = process.env.ZOOMINFO_USERNAME;
const clientId = process.env.ZOOMINFO_CLIENT_ID;
const privateKey = process.env.ZOOMINFO_PRIVATE_KEY;

async function main() {
  try {
    // Get access token via PKI
    const token = await authClient.getAccessTokenViaPKI(username, clientId, privateKey);
    console.log('✅ ZoomInfo Access Token retrieved');
    console.log('Token:', token);

    const url = 'https://api.zoominfo.com/enrich/contact';
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    const payload = {
      matchPersonInput: [
        {
          firstName: 'derrick',
          lastName: 'Alba',
          companyName: 'Advocate Aurora Health',
        }
      ],
      outputFields: [
        "firstName",
        "lastName",
        "jobTitle",
        "companyName",
        "externalUrls",
        "email",
        "employmentHistory",
        "id",
        "companyId"
      ]
    };

    // Make the API request
    const response = await axios.post(url, payload, { headers });

    // Validate and output the result
    if (
      response.data &&
      response.data.data &&
      Array.isArray(response.data.data.result)
    ) {
      console.log('✅ ZoomInfo Contact Enrichment Response:\n', JSON.stringify(response.data.data.result, null, 2));
    } else {
      console.error('❌ Unexpected response structure:', response.data);
    }

  } catch (error) {
    console.error('❌ Error:', error.response ? error.response.data : error.message);
  }
}

main();
