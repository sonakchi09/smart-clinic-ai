require('dotenv').config();
const { suggestDoctor } = require('./services/aiService');

async function test() {
  const result = await suggestDoctor('chest pain and shortness of breath');
  console.log('AI Result:', result);
}

test();