const { Module } = require('../lib/plugins');
const util = require('util');

Module({
  on: 'text'
})(async (message) => {
  if (!message.body.startsWith('>')) return;
  let sender = message.sender.split('@')[0];
  let sudo = process.env.SUDO ? process.env.SUDO.split(',').map(u => u.trim().replace(/\+/, '')) : [];
  if (!(message.fromMe || sudo.includes(sender))) return;
  let code = message.body.slice(1).trim();
  try {
    let result = await eval(`(async () => { ${code} })()`);
    if (typeof result !== 'string') result = util.inspect(result);
    await message.send(result);
  } catch (e) {
    await message.send(e.message);
  }
});
