const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { SmsClient } = require('@azure/communication-sms');
const path = require('path');

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      fontSrc: ["'self'", "fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: 'Too many SMS requests from this IP, please try again later.'
});

app.use('/api/sms-sender', limiter);

// Body parsing
app.use(express.json({ limit: '1mb' }));

// Serve static files
app.use(express.static('.'));

// Azure Communication Services SMS Client
let smsClient;
const connectionString = process.env.ACS_CONNECTION_STRING || "endpoint=https://donerbestelling.europe.communication.azure.com/;accesskey=E5gLyvZj65ubvZmA1q023ra3ovlvCOftNZiVCO6Ouzo7AUddh7zmJQQJ99BFACULyCpkxZ0VAAAAAZCSZqLj";

if (connectionString && connectionString.includes('endpoint=')) {
  smsClient = new SmsClient(connectionString);
  console.log('✅ Azure Communication Services SMS client initialized');
} else {
  console.warn('⚠️ ACS_CONNECTION_STRING not found. SMS functionality will be simulated.');
}

// SMS API endpoint
app.post('/api/sms-sender', async (req, res) => {
  try {
    const { phoneNumber, message, adminPassword } = req.body;

    // Basic validation
    if (!phoneNumber || !message) {
      return res.status(400).json({
        success: false,
        error: 'Phone number and message are required'
      });
    }

    // Optional admin password validation
    if (process.env.ADMIN_PASSWORD && adminPassword !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({
        success: false,
        error: 'Invalid admin password'
      });
    }

    // Phone number validation (basic)
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number format. Use international format (+31612345678)'
      });
    }    // Send SMS
    if (smsClient) {
      try {
        const sendResults = await smsClient.send({
          from: process.env.ACS_PHONE_NUMBER || '+18555551234', // Use your ACS phone number or default test number
          to: [phoneNumber],
          message: message
        });

        const result = sendResults[0];
        if (result.successful) {
          console.log('✅ SMS sent successfully:', {
            to: phoneNumber,
            messageId: result.messageId,
            timestamp: new Date().toISOString()
          });
          
          res.json({
            success: true,
            messageId: result.messageId,
            message: 'SMS sent successfully'
          });
        } else {
          console.error('❌ SMS send failed:', result.errorMessage);
          res.status(500).json({
            success: false,
            error: 'Failed to send SMS: ' + result.errorMessage
          });
        }
      } catch (smsError) {
        console.error('❌ SMS API error:', smsError);
        res.status(500).json({
          success: false,
          error: 'SMS service error: ' + smsError.message
        });
      }
    } else {
      // Simulation mode
      console.log('📱 === SMS SIMULATION ===');
      console.log('To:', phoneNumber);
      console.log('Message:', message);
      console.log('Timestamp:', new Date().toISOString());
      console.log('========================');
      
      res.json({
        success: true,
        messageId: 'sim-' + Date.now(),
        message: 'SMS simulated successfully (no actual SMS sent - ACS not configured)'
      });
    }

  } catch (error) {
    console.error('SMS API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    smsConfigured: !!smsClient
  });
});

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Doner Orders API running on port ${port}`);
  console.log(`📱 SMS functionality: ${smsClient ? 'ENABLED' : 'SIMULATION MODE'}`);
});

module.exports = app;
