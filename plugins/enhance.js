const fetch = require("node-fetch");
const {Module} = require('../lib/plugins');

Module({
  command: "upscale",
  package: "tools"
})(async (message) => {
  if (!message.quoted || !["imageMessage"].includes(message.quoted.type)) {
  return message.send("_Please reply to an image_");}
  const img = await message.quoted.download();
  const bs = img.toString("base64");
  const res = await fetch("https://api.naxordeve.qzz.io/tools/enhance", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ imageBase64: bs })});
  if (!res.ok) {
  const error = await res.json().catch(() => ({}));
  return message.send((error.error || res.statusText));}
  const buffer = Buffer.from(await res.arrayBuffer());
  await message.send({ image: buffer, caption: "*ENHANCED*" });
});
