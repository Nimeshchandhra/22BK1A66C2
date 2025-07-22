const express = require('express');
const axios = require('axios');
const app = express();

const TEST_SERVER_URL = `${req.protocol}://${req.get('host')}/log`; 

async function Log(stack, level, package_name, message) {
  try {
    const logData = { stack, level, package: package_name, message, timestamp: new Date().toISOString() };
    await axios.post(TEST_SERVER_URL, logData);
  } catch (error) {
    console.error('Failed to send log:', error.message);
  }
}

app.use(express.json());

let urlDatabase = [];

function generateShortCode() {
  return Math.random().toString(36).substring(2, 8);
}

app.post('/api/log', (req, res) => {
  console.log('--- Log Received ---', req.body);
  res.sendStatus(200);
});

app.post('/api/shorten', async (req, res) => {
  await Log('backend', 'info', 'handler', 'Received request to shorten URL');
  const { url, validity, shortCode: customShortCode } = req.body;

  if (!url) {
    await Log('backend', 'error', 'handler', 'URL is required but was not provided');
    return res.status(400).json({ error: 'URL is required' });
  }

  let finalShortCode = customShortCode;

  if (customShortCode) {
    const isTaken = urlDatabase.some(entry => entry.shortCode === customShortCode);
    if (isTaken) {
      await Log('backend', 'warn', 'db', `Attempted to use duplicate shortcode: ${customShortCode}`);
      return res.status(409).json({ error: 'This custom shortcode is already in use.' });
    }
  } else {
    finalShortCode = generateShortCode();
  }

  const validityInMinutes = validity || 30;
  const validityInMilliseconds = validityInMinutes * 60 * 1000;
  const expiresAt = new Date(Date.now() + validityInMilliseconds);

  const newUrlEntry = {
    shortCode: finalShortCode,
    originalUrl: url,
    createdAt: new Date(),
    expiresAt: expiresAt,
    clickCount: 0
  };

  urlDatabase.push(newUrlEntry);
  await Log('backend', 'info', 'db', `Successfully created shortcode ${finalShortCode}`);

  const shortUrl = `${req.protocol}://${req.get('host')}/${finalShortCode}`;
  
  res.status(201).json({ 
    shortLink: shortUrl,
    expiry: expiresAt.toISOString()
  });
});

app.get('/:shortCode', async (req, res) => {
  const { shortCode } = req.params;
  await Log('backend', 'info', 'handler', `Received redirect request for shortcode: ${shortCode}`);
  
  const urlEntry = urlDatabase.find(entry => entry.shortCode === shortCode);

  if (urlEntry) {
    const isExpired = new Date() > new Date(urlEntry.expiresAt);
    if (isExpired) {
      await Log('backend', 'warn', 'redirect', `Redirect failed for ${shortCode}: link expired`);
      res.status(410).send('<h1>This link has expired.</h1>');
    } else {
      urlEntry.clickCount++;
      await Log('backend', 'info', 'redirect', `Redirecting ${shortCode} to ${urlEntry.originalUrl}`);
      res.redirect(urlEntry.originalUrl);
    }
  } else {
    await Log('backend', 'error', 'redirect', `Redirect failed: shortcode ${shortCode} not found`);
    res.status(404).send('<h1>Link not found.</h1>');
  }
});




const PORT = 5000;

app.listen(PORT, () => {
  Log('backend', 'info', 'server', `Server started successfully on port ${PORT}`);
  console.log(`Server running on port ${PORT}`);
});