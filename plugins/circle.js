const {Module} = require('../lib/plugins');
const StickerBuilder = require('../lib/sticker');

Module({
  command: "circle",
  package: "tools",
  description: "Convert an image into a circle"
})(async (message) => {
  if (!message.quoted || !/imageMessage/.test(message.quoted.type)) {
  return message.send("_Reply to an image_");}
  let buf = await message.quoted.download();
  let circled = await StickerBuilder.circleImage(buf);
  await message.send({ image: circled });
});
