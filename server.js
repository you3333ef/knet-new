const express = require('express');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// In-memory storage for payment links
const paymentLinks = new Map();
const paymentStatuses = new Map();

// Generate secure random reference number
function generateReferenceNumber() {
  return crypto.randomBytes(10).toString('hex').toUpperCase();
}

// Encrypt sensitive data
function encrypt(text) {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(process.env.SECRET_KEY || 'default-secret-key', 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(JSON.stringify(text));
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

// Decrypt data
function decrypt(text) {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(process.env.SECRET_KEY || 'default-secret-key', 'salt', 32);
  const parts = text.split(':');
  const iv = Buffer.from(parts.shift(), 'hex');
  const encryptedText = parts.join(':');
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encryptedText, 'hex');
  decrypted += decipher.final();
  return JSON.parse(decrypted);
}

// Generate payment link
app.post('/api/generate-link', (req, res) => {
  try {
    const { beneficiary, amount, currency, description, language, expiresIn } = req.body;

    // Validate input
    if (!beneficiary || !amount || !description) {
      return res.status(400).json({
        error: 'Missing required fields: beneficiary, amount, description'
      });
    }

    // Generate unique reference number
    const referenceNumber = generateReferenceNumber();
    const transactionId = uuidv4();

    // Create expiration date
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + (parseInt(expiresIn) || 24));

    // Store payment link data
    const linkData = {
      id: transactionId,
      referenceNumber,
      beneficiary,
      amount: parseFloat(amount),
      currency: currency || 'KWD',
      description,
      language: language || 'en',
      status: 'pending',
      createdAt: new Date(),
      expiresAt: expirationDate,
      encryptedData: encrypt({
        beneficiary,
        amount,
        description
      })
    };

    paymentLinks.set(referenceNumber, linkData);
    paymentStatuses.set(transactionId, 'pending');

    // Generate payment link (Gulf Bank style)
    const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
    const paymentLink = `${baseUrl}/paylink/index.html?refNo=${referenceNumber}&islang=en`;

    res.json({
      success: true,
      referenceNumber,
      transactionId,
      paymentLink,
      expiresAt: expirationDate.toISOString()
    });
  } catch (error) {
    console.error('Error generating payment link:', error);
    res.status(500).json({
      error: 'Failed to generate payment link'
    });
  }
});

// Get payment link data
app.get('/api/payment/:referenceNumber', (req, res) => {
  try {
    const { referenceNumber } = req.params;
    const linkData = paymentLinks.get(referenceNumber);

    if (!linkData) {
      return res.status(404).json({
        error: 'Payment link not found'
      });
    }

    // Check if expired
    if (new Date() > new Date(linkData.expiresAt)) {
      return res.status(410).json({
        error: 'Payment link has expired',
        status: 'expired'
      });
    }

    res.json({
      success: true,
      data: {
        referenceNumber: linkData.referenceNumber,
        beneficiary: linkData.beneficiary,
        amount: linkData.amount,
        currency: linkData.currency,
        description: linkData.description,
        language: linkData.language,
        status: linkData.status,
        expiresAt: linkData.expiresAt
      }
    });
  } catch (error) {
    console.error('Error retrieving payment link:', error);
    res.status(500).json({
      error: 'Failed to retrieve payment link'
    });
  }
});

// Update payment status
app.post('/api/payment/:referenceNumber/status', (req, res) => {
  try {
    const { referenceNumber } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'completed', 'failed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status'
      });
    }

    const linkData = paymentLinks.get(referenceNumber);
    if (!linkData) {
      return res.status(404).json({
        error: 'Payment link not found'
      });
    }

    linkData.status = status;
    linkData.updatedAt = new Date();
    paymentLinks.set(referenceNumber, linkData);
    paymentStatuses.set(linkData.id, status);

    res.json({
      success: true,
      status: status
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({
      error: 'Failed to update payment status'
    });
  }
});

// Get payment status
app.get('/api/payment/:referenceNumber/status', (req, res) => {
  try {
    const { referenceNumber } = req.params;
    const linkData = paymentLinks.get(referenceNumber);

    if (!linkData) {
      return res.status(404).json({
        error: 'Payment link not found'
      });
    }

    res.json({
      success: true,
      status: linkData.status,
      updatedAt: linkData.updatedAt
    });
  } catch (error) {
    console.error('Error retrieving payment status:', error);
    res.status(500).json({
      error: 'Failed to retrieve payment status'
    });
  }
});

// List all payment links (admin)
app.get('/api/payments', (req, res) => {
  try {
    const payments = Array.from(paymentLinks.values()).map(link => ({
      referenceNumber: link.referenceNumber,
      beneficiary: link.beneficiary,
      amount: link.amount,
      currency: link.currency,
      description: link.description,
      status: link.status,
      createdAt: link.createdAt,
      expiresAt: link.expiresAt
    }));

    res.json({
      success: true,
      count: payments.length,
      payments
    });
  } catch (error) {
    console.error('Error retrieving payments:', error);
    res.status(500).json({
      error: 'Failed to retrieve payments'
    });
  }
});

// Serve payment page with query parameters (Gulf Bank style)
app.get('/paylink/index.html', (req, res) => {
  const { refNo, islang } = req.query;
  const language = islang || 'en';
  const referenceNumber = refNo;

  if (!referenceNumber) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Link Error</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
          .error { color: #721c24; background-color: #f8d7da; padding: 20px; border-radius: 4px; }
          .bilingual { margin-top: 10px; }
          .arabic { direction: rtl; text-align: right; margin-top: 5px; }
        </style>
      </head>
      <body>
        <div class="error">
          <h1>Invalid Payment Link</h1>
          <div class="bilingual">
            <div>The payment link is invalid.</div>
            <div class="arabic">الرابط غير صالح</div>
          </div>
        </div>
      </body>
      </html>
    `);
  }

  const linkData = paymentLinks.get(referenceNumber);

  if (!linkData) {
    return res.status(404).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Link Error</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
          .error { color: #721c24; background-color: #f8d7da; padding: 20px; border-radius: 4px; }
          .bilingual { margin-top: 10px; }
          .arabic { direction: rtl; text-align: right; margin-top: 5px; }
        </style>
      </head>
      <body>
        <div class="error">
          <h1>Payment Link Not Found</h1>
          <div class="bilingual">
            <div>The requested payment link could not be found.</div>
            <div class="arabic">لم يتم العثور على رابط الدفع المطلوب</div>
          </div>
        </div>
      </body>
      </html>
    `);
  }

  // Check if expired
  if (new Date() > new Date(linkData.expiresAt)) {
    return res.status(410).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Link Expired</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
          .error { color: #721c24; background-color: #f8d7da; padding: 20px; border-radius: 4px; text-align: center; }
          .bilingual { margin-top: 10px; }
          .arabic { direction: rtl; text-align: right; margin-top: 5px; }
        </style>
      </head>
      <body>
        <div class="error">
          <h1>⚠️ Payment Link Expired</h1>
          <div class="bilingual">
            <div>The link is either expired or the payment has been done.</div>
            <div class="arabic">انتهت صلاحية الرابط أو سبق أن تم سداد الدفعة</div>
          </div>
        </div>
      </body>
      </html>
    `);
  }

  // Store language and reference for the page
  res.locals.language = language;
  res.locals.referenceNumber = referenceNumber;

  // Serve payment page
  res.sendFile(path.join(__dirname, 'public', 'paylink.html'));
});

// Legacy route support
app.get('/paylink/:referenceNumber', (req, res) => {
  const { referenceNumber } = req.params;
  // Redirect to new format
  res.redirect(`/paylink/index.html?refNo=${referenceNumber}&islang=en`);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Payment link generator ready at http://localhost:${PORT}`);
});
