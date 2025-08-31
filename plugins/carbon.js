const { Module } = require('../lib/plugins');

Module({
  command: "carbon",
  package: "tools"
})(async (message, match) => {
  if (!match) return message.send("_Please provide code_");
  let code = match;
  let url = `https://api.naxordeve.qzz.io/tools/carbon?code=${code}`;
  await message.send({image: { url },caption: "*Carbon*"
  });
});
