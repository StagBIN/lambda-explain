const https = require('https');

function httpsPost({ hostname, path, headers, body }) {
  return new Promise((resolve, reject) => {
    console.log('Preparing HTTPS POST request...');
    const options = {
      hostname,
      path,
      method: 'POST',
      headers,
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log('HTTPS response received. Processing...');
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log('Successful response:', data);
          resolve(JSON.parse(data));
        } else {
          console.log(`Error with response. Status code: ${res.statusCode}`, data);
          reject(new Error(`HTTP status code ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      console.log('Request error:', error);
      reject(error);
    });
    req.write(body);
    req.end();
  });
}

exports.handler = async (event) => {
  console.log('Event:', event);
  const api_key = process.env.GEMINI_API_KEY;
  if (!api_key) {
    console.log('Missing GEMINI_API_KEY in environment variables');
    return { 
      headers: {
            'Access-Control-Allow-Origin': '*'
        },
      statusCode: 500, 
      body: 'Missing GEMINI_API_KEY in environment variables' };
  }

  const input_text = event["data"];
  if (!input_text) {
    console.log('Missing text to explain');
    return { headers: {
            'Access-Control-Allow-Origin': '*'
        },
        statusCode: 400, 
        body: 'Missing text to explain' };
  }

  const gemini_payload = JSON.stringify({
    contents: [{
      parts: [{
        text: `Explain this text: ${input_text}`
      }]
    }]
  });

  try {
    console.log('Sending request to Gemini API...');
    const response = await httpsPost({
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/gemini-pro:generateContent?key=${api_key}`,
      headers: {
        'Content-Type': 'application/json'
      },
      body: gemini_payload,
    });

    console.log('Response from Gemini API:', response.candidates[0]);
    return {
       statusCode: 200,
       headers: {
            'Access-Control-Allow-Origin': '*'
        },
       body: response.candidates[0].content.parts[0].text
    };
  } catch (error) {
    console.log('Error occurred:', error.message);
    return {
      headers: {
            'Access-Control-Allow-Origin': '*'
        },
      statusCode: 500,
      body: JSON.stringify({ message: 'An error occurred', error: error.message })
    };
  }
};
