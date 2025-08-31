const fs = require('fs');
const axios = require('axios');
const yts = require('yt-search');
const fetch = require('node-fetch');
const { Module } = require('../lib/plugins');
const ytStreamer = require("../lib/ytdl");
const AddMp3Meta = require('../lib/Class/metadata');

const x = 'AIzaSyDLH31M0HfyB7Wjttl6QQudyBEq5x9s1Yg';
async function ytSearch(query, max = 10) {
  const url = `https://www.googleapis.com/youtube/v3/search?key=${x}&part=snippet&type=video&maxResults=${max}&q=${query}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(res.statusText);
  const data = await res.json();
  if (!data.items || !data.items.length) return [];
  return data.items.map(vid => ({
    id: vid.id.videoId,
    title: vid.snippet.title,
    url: `https://www.youtube.com/watch?v=${vid.id.videoId}`,
    thumbnail: vid.snippet.thumbnails.high.url,
    channel: vid.snippet.channelTitle,
    publishedAt: vid.snippet.publishedAt
  }));
}

Module({
  command: 'yts',
  package: 'search',
  description: 'Search YouTube videos'
})(async (message, match) => {
  if (!match) return await message.send('Please provide a search query');
  const query = match.trim();
  const results = await ytSearch(query, 10);
  if (!results.length) return await message.send('err');
  let reply = `*YouTube results:*"${query}":\n\n`;
  results.forEach((v, i) => {
  const date = new Date(v.publishedAt).toISOString().split('T')[0];
    reply += `⬢ ${i + 1}. ${v.title}\n   Channel: ${v.channel}\n   Published: ${date}\n   Link: ${v.url}\n\n`;
  });

  await message.send({
    image: { url: results[0].thumbnail },
    caption: reply
  });
});

async function ytApiSearch(query, maxResults = 13) {
  const API_KEY = 'AIzaSyDLH31M0HfyB7Wjttl6QQudyBEq5x9s1Yg';
  const url = `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&part=snippet&type=video&maxResults=${maxResults}&q=${query}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.statusText}`);
  const data = await res.json();
  if (!data.items || !data.items.length) return [];
  return data.items.map(vid => ({
    id: vid.id.videoId,
    title: vid.snippet.title,
    url: `https://www.youtube.com/watch?v=${vid.id.videoId}`,
    thumbnail: vid.snippet.thumbnails.high.url,
    channel: vid.snippet.channelTitle,
    publishedAt: vid.snippet.publishedAt
  }));
}
  
Module({
  command:"song",
  package:"downloader",
  description:"Download audio from YouTube"
})(async(message, match) => {
  if(!match) return message.send("_need a yt url or song name_");
  let input = match.trim();
  async function searchYt(q) {
    const key = 'AIzaSyDLH31M0HfyB7Wjttl6QQudyBEq5x9s1Yg';
    const res = await fetch(`https://www.googleapis.com/youtube/v3/search?key=${key}&part=snippet&type=video&maxResults=5&q=${q}`);
    const data = await res.json();
    if(!data.items?.length) return [];
    return data.items.map(v => ({
      id: v.id.videoId,
      title: v.snippet.title,
      url: `https://www.youtube.com/watch?v=${v.id.videoId}`
    }));
  }

  async function getTitle(u) {
  let id = u.includes("youtu.be/") ? u.split("youtu.be/")[1].split(/[?&]/)[0] : new URL(u).searchParams.get("v");
  if(!id) return "song";
  const key = 'AIzaSyDLH31M0HfyB7Wjttl6QQudyBEq5x9s1Yg';
  const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?key=${key}&part=snippet&id=${id}`);
  const data = await res.json();
  if(!data.items?.length) return "song";
  return data.items[0].snippet.title;}
  let url = input, title;
  if(!/^https?:\/\/(www\.)?youtube\.com\/watch\?v=/.test(input) && !/^https?:\/\/youtu\.be\//.test(input)) {
  const r = await searchYt(input);
  if(!r.length) return message.send("No results found");
  url = r[0].url;
  title = r[0].title;
 } else {
 title = await getTitle(url);}
 await message.send("*Downloading:* " + title);
 const apiRes = await axios.get(`https://api.naxordeve.qzz.io/download/youtube?url=${url}`);
 if(!apiRes.data?.mp3) return message.send("err");
 const buf = await axios.get(apiRes.data.mp3, { responseType: "arraybuffer" });
 await message.send({document: Buffer.from(buf.data),mimetype: "audio/mpeg",fileName: `${title}.mp3`,externalAdReply: {showAdAttribution: false,title: apiRes.data.title || title,body: "Audio",mediaUrl: url,mediaType: 2,thumbnail: apiRes.data.thumb,sourceUrl: url,renderLargerThumbnail: false
}
  });
});

Module({
  command: 'ytmp4',
  package: 'downloader',
  description: 'Download YouTube MP4'
})(async (message, match) => {
  if (!match) return await message.send('_Give a valid YouTube URL_');
  const url = match.trim();
  const regex = /(?:youtube\.com\/.*v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const id = url.match(regex)?.[1];
  if (!id) return await message.send('_Invalid YouTube URL_');
  const apiRes = await axios.get(`https://garfield-apis.onrender.com/youtube-video?url=${url}&quality=720`);
  const buf = await axios.get(apiRes.data.video['720'].downloadUrl, { responseType: 'arraybuffer' });
  await message.send({ video: Buffer.from(buf.data), caption: `*Title:* ${id}\n*Quality:* 720p` });
});

Module({
  command: 'yta',
  package: 'downloader',
  description: 'Download YouTube Audio'
})(async (message, match) => {
  if (!match) return await message.send('_Give a query or url_');
  let url = match.trim();
  const regex = /(?:youtube\.com\/.*v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const id = url.match(regex)?.[1];
  if (!id) {const res = await ytApiSearch(url, 1);
  if (!res.length) return await message.send('_eish_');
  url = res[0].url; }
  const apiRes = await axios.get(`https://garfield-apis.onrender.com/youtube-audio?url=${url}`);
  const buf = await axios.get(apiRes.data.audio.downloadUrl, { responseType: 'arraybuffer' });
  await message.send({ audio: Buffer.from(buf.data), mimetype: 'audio/mpeg' });
});

Module({
  command: 'ytmp3',
  package: 'downloader',
  description: 'Download YouTube MP3'
})(async (message, match) => {
  if (!match) return await message.send('_Give a query or url_');
  let url = match.trim();
  const regex = /(?:youtube\.com\/.*v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const id = url.match(regex)?.[1];
  if (!id) { const res = await ytApiSearch(url, 1);
  if (!res.length) return await message.send('_eish_');
  url = res[0].url; }
  const apiRes = await axios.get(`https://garfield-apis.onrender.com/youtube-audio?url=${url}`);
  const buf = await axios.get(apiRes.data.audio.downloadUrl, { responseType: 'arraybuffer' });
  await message.send({ audio: Buffer.from(buf.data), mimetype: 'audio/mpeg' });
});

Module({
  command: 'play',
  package: 'downloader',
  description: 'YouTube video player'
})(async (message, match) => {
  if (!match) return await message.send('_Give a *query*_')
  let res = await axios.get(`https://api.naxordeve.qzz.io/download/youtube?query=${match}`)
  let data = res.data
  if (!data?.title) return await message.send('_eish_');
  let thumb = await fetch(data.thumb).then(r => r.buffer())
  let caption = `*_${data.title}_*\n\n\`\`\`1.⬤\`\`\` *audio*\n\`\`\`2.⬤\`\`\` *video*\n\`\`\`3.⬤\`\`\` *document (mp3)*\n\n_*Send a number as a reply*_`
  await message.send({ image: thumb, caption })
});

Module({ on: 'text' })(async (message) => {
  if (!message.quoted) return
  let body = message.quoted.body || message.quoted.msg?.text || message.quoted.msg?.caption || ''
  if (!body.includes('⬤')) return
  let choice = message.body.trim()
  if (!['1','2','3'].includes(choice)) return
  let title = body.split('\n')[0].replace(/[*_]/g, '').trim()
  let res = await axios.get(`https://api.naxordeve.qzz.io/download/youtube?query=${title}`)
  let data = res.data
  if (!data?.title) return await message.send('_eish_')
  await message.send(`\`\`\`Downloading: ${data.title}\`\`\``)
  if (choice === '1') {
    let buf = await axios.get(data.mp3, { responseType: 'arraybuffer' })
    await message.send({ audio: Buffer.from(buf.data), mimetype: 'audio/mpeg' })
  } else if (choice === '2') {
    let buf = await axios.get(data.mp4, { responseType: 'arraybuffer' })
    await message.send({ video: Buffer.from(buf.data), caption: `*Title:* ${data.title}\n*Quality:* ${data.quality}p` })
  } else if (choice === '3') {
    let buf = await axios.get(data.mp3, { responseType: 'arraybuffer' })
    let fileName = data.title.replace(/[^\w\s]/g, '') + '.mp3'
    await message.send({ document: Buffer.from(buf.data), mimetype: 'audio/mpeg', fileName })
  }
})
