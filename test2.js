const nodemailer = require('nodemailer');

async function t() { 
  const tr = nodemailer.createTransport({ 
    host: 'smtp.gmail.com', 
    port: 587, 
    secure: false, 
    auth: { user: 'enrollment@apccollege.org', pass: 'hswa eqhj anip jaxq' } 
  }); 

  try { 
    await tr.sendMail({ 
      from: '""apcc enrollment form"" <enrollment@apccollege.org>', 
      to: 'enrollment@apccollege.org', 
      subject: 'Test', 
      text: 'Test' 
    }); 
    console.log('OK'); 
  } catch (e) { 
    console.error('ERR', e.message); 
  } 
} 
t();
