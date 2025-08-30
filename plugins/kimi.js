const axios = require('axios')
const { Module } = require('../lib/plugins')

Module({
  command: 'kimi',
  package: 'ai',
  description: 'Ask Kimi AI'
})(async (message, match) => {
  const q = match.trim()
  if (!q) return await message.send('usage: kimi <your question>')
  const url = `https://api.naxordeve.qzz.io/ai/chat/kimi?question=${q}&model=k1.5&search=false&deep_research=true`
  const res = await axios.get(url, { timeout: 20000 })
  if (!res.data?.success) return await message.send('error')
  const text = res.data.data?.text || 'busy'
  if (text.length < 4000) return await message.send(text)
  for (let i = 0; i < text.length; i += 3500) {
  await message.send(text.slice(i, i + 3500))
  }
})
