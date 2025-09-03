var { Module } = require('../lib/plugins');

Module({
  command: "left",
  package: "owner",
  description: ""
})(async (message) => {
  await message.loadGroupInfo(message.from);
  if (!message.isGroup) return;
  const sudo = (process.env.SUDO || "").split(",");
  const sender = message.sender.split("@")[0]; 
  if (!message.fromMe && !sudo.includes(sender)) return;
  return message.conn.groupLeave(message.from);
});
