const fetch = require('node-fetch');

async function testFetch() {
  const tokenRes = await fetch('http://localhost:5000/api/v1/auth/testing/token');
  const tokenObj = await tokenRes.json();
  const token = tokenObj.token;

  const res = await fetch('http://localhost:5000/api/v1/mobile/modules', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

testFetch().catch(console.error);
