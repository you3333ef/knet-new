# Secure Payment Link Generator

A secure payment link generation system inspired by Gulf Bank's KNET payment portal. This application allows you to create encrypted, time-limited payment links for secure transactions.

## Features

- 🔐 **256-bit AES Encryption** - All sensitive payment data is encrypted
- ⏰ **Auto-Expiring Links** - Links expire automatically for security
- 🌍 **Bilingual Support** - English and Arabic language support
- ⚡ **Fast & Secure** - Generate and share payment links instantly
- 💳 **KNET Compatible** - Compatible with Kuwait's interbank network
- 📊 **Payment Tracking** - Track payment status in real-time
- 🛡️ **Rate Limiting** - Protection against abuse
- 🎨 **Modern UI** - Clean, responsive design

## Installation

1. Install Node.js dependencies:
```bash
cd payment-link-generator
npm install
```

2. Start the server:
```bash
npm start
```

The server will start on `http://localhost:3000`

## Configuration

You can configure the application using environment variables:

- `PORT` - Server port (default: 3000)
- `SECRET_KEY` - Encryption key for sensitive data
- `BASE_URL` - Base URL for payment links (default: http://localhost:3000)

Example:
```bash
SECRET_KEY="your-secure-random-key" PORT=8080 npm start
```

## API Endpoints

### Generate Payment Link
```http
POST /api/generate-link
Content-Type: application/json

{
  "beneficiary": "ABC Company LLC",
  "amount": "100.00",
  "currency": "KWD",
  "description": "Invoice #12345",
  "language": "en",
  "expiresIn": "24"
}
```

**Response:**
```json
{
  "success": true,
  "referenceNumber": "A1B2C3D4E5F6",
  "transactionId": "uuid-here",
  "paymentLink": "http://localhost:3000/paylink/A1B2C3D4E5F6",
  "expiresAt": "2024-01-01T12:00:00.000Z"
}
```

### Get Payment Details
```http
GET /api/payment/:referenceNumber
```

### Update Payment Status
```http
POST /api/payment/:referenceNumber/status
Content-Type: application/json

{
  "status": "completed" // or "failed", "cancelled"
}
```

### Get Payment Status
```http
GET /api/payment/:referenceNumber/status
```

### List All Payments
```http
GET /api/payments
```

## Usage

### 1. Generate a Payment Link

1. Open `http://localhost:3000` in your browser
2. Fill in the payment details:
   - **Beneficiary Name** - Who will receive the payment
   - **Amount** - Payment amount
   - **Currency** - KWD, USD, EUR
   - **Description** - What the payment is for
   - **Language** - Default language for the payment page
   - **Expires In** - How long the link is valid (1 hour to 7 days)
3. Click "Generate Payment Link"
4. Share the generated link with the payer

### 2. Payment Page

When a payer clicks the payment link:

1. They see the payment details (bilingual)
2. They can accept or decline the payment
3. Status updates are tracked in real-time
4. The link automatically expires after the specified time

### 3. Security Features

- **Encryption**: All sensitive data is encrypted using AES-256-CBC
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Helmet.js**: Security headers for protection
- **Input Validation**: All inputs are validated and sanitized
- **Auto-Expiry**: Links expire automatically

## File Structure

```
payment-link-generator/
├── server.js          # Express server and API endpoints
├── package.json       # Dependencies and scripts
├── public/
│   ├── index.html     # Main application page
│   └── paylink.html   # Payment confirmation page
└── README.md          # This file
```

## Supported Currencies

- **KWD** - Kuwaiti Dinar (default)
- **USD** - US Dollar
- **EUR** - Euro

## Payment Statuses

- **pending** - Payment link created, awaiting action
- **completed** - Payment successful
- **failed** - Payment failed
- **cancelled** - Payment declined by user
- **expired** - Link expired without payment

## Bilingual Support

The payment page supports both English and Arabic languages:

- Payment details display in both languages
- Right-to-left (RTL) text support for Arabic
- All buttons and messages are translated

## Development

To modify the application:

1. **Backend**: Edit `server.js` for API changes
2. **Frontend**: Edit `public/index.html` for the generator page
3. **Payment Page**: Edit `public/paylink.html` for the payment interface

## Security Considerations

- Use a strong, random `SECRET_KEY` in production
- Enable HTTPS in production (use a reverse proxy like Nginx)
- Implement proper database storage (current version uses in-memory storage)
- Add authentication/authorization for the admin endpoints
- Set up proper logging and monitoring
- Implement CSRF protection if needed

## Production Deployment

1. Set up a reverse proxy (Nginx/Apache)
2. Enable HTTPS/SSL
3. Use environment variables for configuration
4. Set up a database (MongoDB, PostgreSQL, etc.)
5. Implement proper logging
6. Set up monitoring and alerts
7. Configure rate limiting based on your needs

## License

MIT License - feel free to use this for your projects.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
