(async () => {
    try {
        const res = await fetch('http://localhost:5000/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({username: '1234567', password: 'password', role: 'Student'})
        });
        const data = await res.json();
        console.log('Login:', data);

        const modRes = await fetch('http://localhost:5000/api/v1/mobile/modules', {
            headers: { 'Authorization': 'Bearer ' + data.token }
        });
        const modDataText = await modRes.text();
        console.log('Modules Error Body:', modDataText);
    } catch(e) { console.error(e); }
})();
