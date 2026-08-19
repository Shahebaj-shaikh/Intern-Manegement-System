const http = require('http');

const API_HOST = process.env.API_HOST || 'localhost';
const API_PORT = process.env.API_PORT || 5000;

const request = (options, body) => new Promise((resolve, reject) => {
  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (c) => data += c);
    res.on('end', () => {
      try { resolve({ statusCode: res.statusCode, body: data ? JSON.parse(data) : null }); }
      catch (e) { resolve({ statusCode: res.statusCode, body: data }); }
    });
  });
  req.on('error', reject);
  if (body) req.write(JSON.stringify(body));
  req.end();
});

const run = async () => {
  console.log('Logging in as HR...');
  const login = await request({ hostname: API_HOST, port: API_PORT, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } }, { email: 'hr@ims.com', password: 'Hr@12345' });
  if (login.statusCode !== 200) return fail('Login failed', login);
  const token = login.body.data.accessToken;
  console.log('Logged in, token length:', token.length);

  console.log('Fetching interns to locate intern5@ims.com...');
  const internsRes = await request({ hostname: API_HOST, port: API_PORT, path: '/api/interns?page=1&limit=50', method: 'GET', headers: { Authorization: `Bearer ${token}` } });
  if (internsRes.statusCode !== 200) return fail('Failed to fetch interns', internsRes);
  const interns = internsRes.body.data.interns || internsRes.body.data || [];
  const target = interns.find(i => i.email === 'intern5@ims.com');
  if (!target) return fail('intern5@ims.com not found in interns list', { internsCount: interns.length });
  console.log('Found intern:', target._id || target.id || target.id);
  const internId = target._id || target.id || target.id;

  console.log('Generating certificate for intern5...');
  const gen = await request({ hostname: API_HOST, port: API_PORT, path: `/api/certificates/${internId}/generate`, method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }, { role: 'Intern', authorizedBy: 'HR Team' });
  if (gen.statusCode !== 201) return fail('Certificate generation failed', gen);
  const cert = gen.body.data;
  console.log('Certificate generated:', cert.certificateId);

  console.log('Verifying certificate publicly...');
  const verify = await request({ hostname: API_HOST, port: API_PORT, path: `/api/certificates/verify/${cert.certificateId}`, method: 'GET' });
  if (verify.statusCode !== 200) return fail('Public verification failed', verify);
  console.log('Verification response:', verify.body.data);

  console.log('Fetching certificates (auth) to ensure visibility...');
  const list = await request({ hostname: API_HOST, port: API_PORT, path: '/api/certificates', method: 'GET', headers: { Authorization: `Bearer ${token}` } });
  if (list.statusCode !== 200) return fail('Failed to list certificates', list);
  const found = (list.body.data || []).some(c => c.certificateId === cert.certificateId);
  if (!found) return fail('Generated certificate not found in list', list);

  console.log('\nAll certificate integration tests passed.');
  process.exit(0);
};

const fail = (msg, data) => {
  console.error('TEST FAILED:', msg, data);
  process.exit(2);
};

run().catch((e) => { console.error('TEST ERROR', e); process.exit(3); });
