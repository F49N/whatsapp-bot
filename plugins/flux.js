const axios = require('axios')
const { Module } = require('../lib/plugins')

Module({
  command: 'flux',
  package: 'ai',
  description: 'Generate AI image using Flux'
})(async (message, match) => {
  if (!match || !match.trim()) return await message.send('_Provide a prompt eg flux Naxor_')
  const prompt = match.trim()
  const url = `https://api.naxordeve.qzz.io/generate/flux?prompt=${prompt}`
  const res = await axios.get(url, { responseType: 'arraybuffer' })
  const buffer = Buffer.from(res.data, 'binary')
  await message.send({ image: { buffer }, caption: prompt })
})
