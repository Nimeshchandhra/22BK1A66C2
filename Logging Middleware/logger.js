const express = require('express');
const app = express();


app.use(express.json());

let incidents = [];
let nextId = 1;

app.get('/api/incidents', (req, res) => {
  res.json(incidents);
});

app.post('/api/incidents', (req, res) => {
  const { description } = req.body;
  
  if (!description) {
    return res.status(400).json({ error: 'Description is required' });
  }

  let category = 'General Inquiry';
  let priority = 'Low';
  const descLower = description.toLowerCase();

  if (descLower.includes('password') || descLower.includes('login') || descLower.includes('account')) {
    category = 'Account Issue';
    priority = 'High';
  } else if (descLower.includes('network') || descLower.includes('slow') || descLower.includes('wifi')) {
    category = 'Network';
    priority = 'Medium';
  } else if (descLower.includes('printer') || descLower.includes('hardware')) {
    category = 'Hardware';
    priority = 'Medium';
  }

  const newIncident = {
    id: nextId++,
    description: description,
    category: category,
    priority: priority,
    createdAt: new Date().toISOString()
  };

  incidents.push(newIncident);

  res.status(201).json(newIncident);
});


app.get('/api/report', (req, res) => {
  const report = {};

  for (const incident of incidents) {
    const category = incident.category;
    if (report[category]) {
      report[category]++;
    } else {
      report[category] = 1;
    }
  }

  res.json(report);
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});