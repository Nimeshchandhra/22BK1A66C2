const express = require('express');
const app = express();


app.use(express.json());

let urlDatabase = [];


function generateShortCode() {
  return Math.random().toString(36).substring(2, 8);
}

app.post('/shorturls', (req, res) => {
  const { url, validity, shortCode: customShortCode } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  let finalShortCode = customShortCode;

  if (customShortCode) {
    const isTaken = urlDatabase.some(entry => entry.shortCode === customShortCode);
    if (isTaken) {
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

  const shortUrl = `http://localhost:${PORT}/${finalShortCode}`;
  
  res.status(201).json({ 
    shortLink: shortUrl,
    expiry: expiresAt.toISOString()
  });
});


app.get('/:shortCode', (req, res) => {
  const { shortCode } = req.params;
  const urlEntry = urlDatabase.find(entry => entry.shortCode === shortCode);

  if (urlEntry) {
    const isExpired = new Date() > new Date(urlEntry.expiresAt);
    if (isExpired) {
      res.status(410).send('<h1>This link has expired.</h1>');
    } else {
      urlEntry.clickCount++;
      res.redirect(urlEntry.originalUrl);
    }
  } else {
    res.status(404).send('<h1>Link not found.</h1>');
  }
});

app.get('/shorturls/:shortCode', (req, res) => {
  const { shortCode } = req.params;
  const urlEntry = urlDatabase.find(entry => entry.shortCode === shortCode);

  if (urlEntry) {
    res.json({
      createdAt: urlEntry.createdAt.toISOString(),
      expiresAt: urlEntry.expiresAt.toISOString(),
      originalUrl: urlEntry.originalUrl,
      shortCode: urlEntry.shortCode,
      clickCount: urlEntry.clickCount
    });
  } else {
    res.status(404).json({ error: 'Statistics for this shortcode not found.' });
  }
});




const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});