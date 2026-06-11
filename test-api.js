const axios = require('axios');

async function test() {
  const info = await axios.get('https://crm.concept2designs.in/mobile_app/api/info');
  const cookie = info.headers['set-cookie'].find(c => c.startsWith('csrf_cookie_name=')).split(';')[0];
  const token = cookie.split('=')[1];
  
  try {
    const rawBody = '{"description":"test <!--&csrf_token_name=' + token + '&-->"}';
    const res = await axios.post('https://crm.concept2designs.in/mobile_app/api/lead_note/1', rawBody, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': cookie
      }
    });
    console.log(res.status, res.data);
  } catch (e) {
    console.log(e.response ? e.response.status + ' ' + (typeof e.response.data === 'string' ? e.response.data.slice(0, 100) : JSON.stringify(e.response.data)) : e.message);
  }
}
test();
