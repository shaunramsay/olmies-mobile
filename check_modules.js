const fetch = require('node-fetch');
const fs = require('fs');
(async () => {
    try {
        const res = await fetch('http://localhost:5000/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({username: '1234567', password: 'password', role: 'Student'})
        });
        const data = await res.json();
        const modRes = await fetch('http://localhost:5000/api/v1/mobile/modules', {
            headers: { 'Authorization': 'Bearer ' + data.token }
        });
        const modData = await modRes.text();
        fs.writeFileSync('C:/Users/Shaun Ramsay/Desktop/olmies-mobile/modTest.json', modData);
    } catch(e) { console.error('Error:', e); }
})();
