const https = require('https');
const fs = require('fs');

const SITE_ID = 'de1bfe1b-b0f6-4f53-86aa-8eb4e6b2190f';
const AUTH_TOKEN = 'nfp_fMvLTp6xivoN7UfVM2tXcNuhTiktNyuY4031';

function base64Encode(str) {
  return Buffer.from(str).toString('base64');
}

function deployToNetlify() {
  const files = {};

  // Read and encode files
  const filesToDeploy = ['index.html', 'paylink.html', '_redirects'];

  filesToDeploy.forEach(filename => {
    const filepath = `./public/${filename}`;
    if (fs.existsSync(filepath)) {
      files[filename] = {
        sha: require('crypto').createHash('sha256').update(fs.readFileSync(filepath)).digest('hex'),
        base64: base64Encode(fs.readFileSync(filepath, 'utf8'))
      };
      console.log(`✓ Added ${filename}`);
    }
  });

  const deployData = {
    files: files,
    draft: false,
    message: 'Deploy with demo mode and _redirects'
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
        console.log('✅ Deployment successful!');
        console.log('🌐 Main URL: https://spectacular-vacherin-1b0f90.netlify.app');
        console.log('📦 Files deployed:', Object.keys(files).join(', '));
        console.log('\n⏳ Waiting for deployment to be ready...');
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
