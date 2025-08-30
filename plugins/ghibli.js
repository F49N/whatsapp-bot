const axios = require("axios")
const FormData = require("form-data")
const { Module } = require("../lib/plugins")

Module({command:"ghibli",
        package:"style",
        description:"Transform image into Studio Ghibli style"
  })(async(message)=>{
  if(!message.quoted||message.quoted.type!=='imageMessage') return message.send("_Reply to an image with .ghibli_")
  const img = await message.quoted.download()
  const page = await axios.get("https://overchat.ai/image/ghibli",{headers:{"User-Agent":"Mozilla/5.0"}})
  const naxor = page.data.match(/const apiKey = '([^']+)'/)
  if(!naxor) return message.send("err")
  const ki = naxor[1]
  const form = new FormData()
  form.append("image",img,{filename:"input.png"})
  form.append("prompt","Convert this image into Studio Ghibli art style")
  form.append("model","gpt-image-1")
  form.append("n",1)
  form.append("size","1024x1024")
  form.append("quality","medium")
  const result = await axios.post("https://api.openai.com/v1/images/edits",form,{headers:{...form.getHeaders(),Authorization:`Bearer ${ki}`},responseType:"json"})
  const data = result.data.data?.[0]?.b64_json
  if(!data) return message.send("err")
  const g = Buffer.from(data,"base64")
  await message.send({image:g,caption:"*Ghibli Style*"})
})
