(async () => {
  const base = 'http://localhost:9002';
  try {
    const dev = await fetch(base + '/api/admin/dev-login');
    if (!dev.ok) {
      console.error('dev-login failed', await dev.text());
      process.exit(1);
    }
    const j = await dev.json();
    const token = j.token;
    const usersRes = await fetch(base + '/api/admin-panel/users?pageSize=20', { headers: { Authorization: 'Bearer ' + token } });
    const usersJson = await usersRes.json();
    console.log('raw users response:');
    console.dir(usersJson, { depth: 2 });
    const users = Array.isArray(usersJson) ? usersJson : usersJson.result || usersJson;
    console.log('sample users (id, email, lastAccessAt):');
    for (let i = 0; i < Math.min(10, users.length); i++) {
      const u = users[i];
      console.log(u.id, u.email, u.lastAccessAt || '-');
    }
  } catch (e) {
    console.error('ERR', e);
    process.exit(1);
  }
})();
