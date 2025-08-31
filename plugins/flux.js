const fetch = require('node-fetch')
const { Module } = require('../lib/plugins')

Module({ command: 'flux', 
        description: 'Generate m AI image', 
        package: 'ai' 
  })(async (message, match) => {
  if (!match) return await message.send('_Give me a prompt_')
  let url = `https://api.naxordeve.qzz.io/generate/magic?prompt=${match}`
  let res = await fetch(url)
  let img = await res.buffer()
  await message.send({ image: img, caption: `AI: ${match}` })
})
