const https = require('https');
const fs = require('fs');
const path = require('path');

const SITE_ID = 'de1bfe1b-b0f6-4f53-86aa-8eb4e6b2190f';
const AUTH_TOKEN = 'nfp_fMvLTp6xivoN7UfVM2tXcNuhTiktNyuY4031';

function deployToNetlify() {
  // Read files
  const filesDir = './public';
  const files = {};

  // Read index.html
  if (fs.existsSync('./public/index.html')) {
    files['index.html'] = fs.readFileSync('./public/index.html', 'utf8');
  }

  // Read paylink.html
  if (fs.existsSync('./public/paylink.html')) {
    files['paylink.html'] = fs.readFileSync('./public/paylink.html', 'utf8');
  }

  // Create JSON deployment
  const deployData = {
    files: files,
    draft: false,
    message: 'Deploy KNET Payment Link Generator'
  };

  const jsonData = JSON.stringify(deployData);

  const options = {
    hostname: 'api.netlify.com',
    path: `/api/v1/sites/${SITE_ID}/deploys`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${AUTH_TOKEN}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(jsonData)
    }
  };

  const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('Status Code:', res.statusCode);

      if (res.statusCode === 200 || res.statusCode === 201) {
        try {
          const deploy = JSON.parse(data);
          console.log('✅ Deployment successful!');
          console.log('🌐 Site URL: https://spectacular-vacherin-1b0f90.netlify.app');
          console.log('📦 Deploy ID:', deploy.id || 'N/A');
        } catch (e) {
          console.log('Response:', data);
        }
      } else {
        console.log('❌ Deployment failed');
        console.log('Response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Error:', error.message);
  });

  req.write(jsonData);
  req.end();
}

deployToNetlify();
