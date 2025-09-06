var { Module } = require('../lib/plugins')
var axios = require('axios')

Module({ command: "applemusic",
       package: "downloader"
})(async (message, match) => {
  if (!match) return message.reply("_Give an Apple Music url_")
  let res = await axios.get(`https://api.naxordeve.qzz.io/download/applemusic?url=${match}`)
  if (!res.data.success || !res.data.links) return message.reply("err")
  let mp3 = res.data.links.find(x => x.name.includes("Mp3"))
  if (!mp3) return message.reply("_Not found_")
  await message.conn.sendMessage(message.from,{ document: { url: mp3.url }, mimetype: "audio/mpeg", fileName: mp3.name + ".mp3" },{ quoted: message })
})
