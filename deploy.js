const https = require('https');
const fs = require('fs');

const SITE_ID = 'de1bfe1b-b0f6-4f53-86aa-8eb4e6b2190f';
const AUTH_TOKEN = 'nfp_fMvLTp6xivoN7UfVM2tXcNuhTiktNyuY4031';

function deployToNetlify() {
  const formData = [
    '--boundary----WebKitFormBoundary7MA4YWxkTrZu0gW',
    'Content-Disposition: form-data; name="draft"',
    '',
    'false',
    '--boundary----WebKitFormBoundary7MA4YWxkTrZu0gW',
    'Content-Disposition: form-data; name="message"',
    '',
    'Deploy KNET Payment Link Generator',
    '--boundary----WebKitFormBoundary7MA4YWxkTrZu0gW',
    'Content-Disposition: form-data; name="file"; filename="site.tar.gz"',
    'Content-Type: application/gzip',
    '',
  ];

  const fileData = fs.readFileSync('site.tar.gz');
  const endData = '\r\n--boundary----WebKitFormBoundary7MA4YWxkTrZu0gW--\r\n';

  const requestData = Buffer.concat([
    Buffer.from(formData.join('\r\n') + '\r\n'),
    fileData,
    Buffer.from(endData)
  ]);

  const options = {
    hostname: 'api.netlify.com',
    path: `/api/v1/sites/${SITE_ID}/deploys`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${AUTH_TOKEN}`,
      'Content-Type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW',
      'Content-Length': requestData.length
    }
  };

  const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      if (res.statusCode === 200 || res.statusCode === 201) {
        console.log('✅ Deployment successful!');
        const deploy = JSON.parse(data);
        console.log('🌐 Site URL:', deploy.deploy_url || deploy.ssl_url);
        console.log('🔗 Direct link:', `https://${deploy.id}`);
      } else {
        console.log('❌ Deployment failed:', res.statusCode);
        console.log(data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Error:', error);
  });

  req.write(requestData);
  req.end();
}

deployToNetlify();
