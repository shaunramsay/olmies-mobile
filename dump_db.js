const fetch = require('node-fetch');
const fs = require('fs');
(async () => {
    try {
        const res = await fetch('http://localhost:5000/api/v1/auth/testing/debug-db');
        const data = await res.json();
        fs.writeFileSync('C:/Users/Shaun Ramsay/Desktop/olmies-mobile/debug_data.json', JSON.stringify(data, null, 2));
        console.log('Success, wrote debug_data.json');
    } catch(e) { 
        console.error('Fetch error:', e.message);
        fs.writeFileSync('C:/Users/Shaun Ramsay/Desktop/olmies-mobile/debug_error.txt', e.toString());
    }
})();
