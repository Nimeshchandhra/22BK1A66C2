const axios = require('axios');

const TEST_SERVER_URL = '${req.protocol}://${req.get('host')}/log'; 

async function Log(stack, level, package_name, message) {
  try {
    const logData = {
      stack: stack,
      level: level,
      package: package_name,
      message: message,
      timestamp: new Date().toISOString()
    };

    await axios.post(TEST_SERVER_URL, logData);
    
  } catch (error) {
    console.error('Failed to send log:', error.message);
  }
}

module.exports = Log;