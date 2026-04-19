const http = require('http');

const options = {
  hostname: 'localhost',
  port: 44463,
  path: '/api/investments/investors',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log('Columns:', Object.keys(parsed[0] || {}));
    } catch(e) {
      console.log('Error parsing JSON:', data);
    }
  });
});

req.on('error', console.error);
req.end();
