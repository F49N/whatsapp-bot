const fetch = require('node-fetch')
const { Module } = require('../lib/plugins')

Module({ command: 'creart', 
        description: 'Generate creative AI image', 
        package: 'ai' 
})(async (message, match) => {
  if (!match) return await message.send('_Give me a prompt_')
  let url = `https://api.naxordeve.qzz.io/generate/creart?prompt=${match}`
  let res = await fetch(url)
  let img = await res.buffer()
  await message.send({ image: img, caption: `CreArt: ${match}` })
})
