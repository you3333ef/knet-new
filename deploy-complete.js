const https = require('https');
const fs = require('fs');
const archiver = require('archiver');

const SITE_ID = 'de1bfe1b-b0f6-4f53-86aa-8eb4e6b2190f';
const AUTH_TOKEN = 'nfp_fMvLTp6xivoN7UfVM2tXcNuhTiktNyuY4031';

async function createZipAndDeploy() {
  return new Promise((resolve, reject) => {
    // Create zip file
    const output = fs.createWriteStream('deploy-complete.zip');
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', function() {
      console.log(archive.pointer() + ' total bytes');
      console.log('✓ Zip created successfully');
      deployZip().then(resolve).catch(reject);
    });

    archive.on('error', function(err) {
      reject(err);
    });

    // Append files from public directory
    archive.directory('./public/', false);

    // Pipe archive data to the file
    archive.pipe(output);

    // Finalize the archive
    archive.finalize();
  });
}

function deployZip() {
  return new Promise((resolve, reject) => {
    const zipData = fs.readFileSync('deploy-complete.zip');

    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);

    const parts = [];
    parts.push(Buffer.from(`--${boundary}\r\n`));
    parts.push(Buffer.from('Content-Disposition: form-data; name="draft"\r\n\r\n'));
    parts.push(Buffer.from('false\r\n'));
    parts.push(Buffer.from(`--${boundary}\r\n`));
    parts.push(Buffer.from('Content-Disposition: form-data; name="message"\r\n\r\n'));
    parts.push(Buffer.from('Deploy complete app with demo mode\r\n'));
    parts.push(Buffer.from(`--${boundary}\r\n`));
    parts.push(Buffer.from('Content-Disposition: form-data; name="file"; filename="deploy-complete.zip"\r\n'));
    parts.push(Buffer.from('Content-Type: application/zip\r\n\r\n'));
    parts.push(zipData);
    parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));

    const requestData = Buffer.concat(parts);

    const options = {
      hostname: 'api.netlify.com',
      path: `/api/v1/sites/${SITE_ID}/deploys`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': requestData.length
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
          console.log('🌐 Site URL: https://spectacular-vacherin-1b0f90.netlify.app');
          console.log('📦 Zip size:', zipData.length, 'bytes');
          resolve();
        } else {
          console.log('❌ Deployment failed');
          console.log('Response:', data);
          reject(new Error('Deployment failed'));
        }

        // Clean up
        try {
          fs.unlinkSync('deploy-complete.zip');
        } catch (e) {
          // ignore
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Error:', error.message);
      reject(error);
    });

    req.write(requestData);
    req.end();
  });
}

createZipAndDeploy()
  .then(() => {
    console.log('\n✅ All done!');
    console.log('\n📝 Next steps:');
    console.log('1. Wait 1-2 minutes for deployment to propagate');
    console.log('2. Visit: https://spectacular-vacherin-1b0f90.netlify.app');
    console.log('3. Test the payment link generator');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Deployment failed:', error);
    process.exit(1);
  });
