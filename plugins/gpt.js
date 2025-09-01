const { Module } = require('../lib/plugins')
const fetch = require("node-fetch")

Module({
  command: "gpt",
  package: "ai",
  description: "Chat with ChatGPT"
})(async (message, match) => {
  if (!match) return message.send("_Please provide a question_")
  const sent = await message.send("🤔 Thinking...")
  const res = await fetch("https://api.naxordeve.qzz.io/ai/openai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question: match })
  })
  const data = await res.json()
  const answer = data.answer
  await message.send(answer, { edit: sent.key })
})

Module({
  command: 'garfield',
  package: 'ai',
  description: 'Chat with Garfield the cat'
})(async (message, match) => {
  if (!match) return message.send("What do you want, human?")
  let sys = "You are Garfield, the lazy sarcastic orange cat. You love lasagna, hate Mondays,give short, clear, and useful answers in 2–3-4 lines. with no extra comments or explnation and reply with humor and grumpiness. and you speak English only"
  let q = match
  let r = await fetch("https://api.naxordeve.qzz.io/ai/chatgpt_3.5_scr1", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [
        { role: "system", content: sys },
        { role: "user", content: q }
      ]
    })
  })

  let j = await r.json()
  await message.send(j?.answer || "Ugh... too much work")
})
