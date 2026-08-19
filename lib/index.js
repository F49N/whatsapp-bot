const { default: makeWASocket, Browsers, useMultiFileAuthState, areJidsSameUser, makeCacheableSignalKeyStore, DisconnectReason } = require('baileys');
const pino = require('pino');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const config = require('../config.js');
const fs = require('fs');
const serialize = require('./serialize');
const { load_plugins } = require('./plugins');
const { connectDB, User } = require('./database/model');
const groupCache = new Map();

const connect = async () => {
    try {
        await connectDB();
    } catch (e) {
        console.error(e);
        return;
    }

    const session_path = path.resolve(__dirname, 'Session');
    fs.mkdirSync(session_path, { recursive: true });
    
    const logga = pino({ level: 'silent' });
    const { state, saveCreds } = await useMultiFileAuthState(session_path);
    const conn = makeWASocket({
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, logga)
        },
        browser: Browsers.macOS("Chrome"),
        logger: pino({ level: 'silent' }),
        downloadHistory: false,
        syncFullHistory: false,
        markOnlineOnConnect: false,
        getMessage: false,
        emitOwnEvents: false,
        generateHighQualityLinkPreview: true
    });

    let plugins = [];

    conn.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'open') {
        console.log('✅ F49N connected');
        plugins = await load_plugins();
        await conn.sendMessage(conn.user.id, {
            image: { url: "https://files.catbox.moe/lq7nwm.jpg" },
            caption: `\n\n*PREFIX:* ${process.env.PREFIX}\n*MODE:* ${process.env.WORK_TYPE}\n*SUDO:* ${process.env.SUDO}\n*Made with❤️*`
        });
    }
    if (connection === 'close') {
        console.log(lastDisconnect?.error);
        setTimeout(connect, 3000);
    }
});

    conn.ev.on('creds.update', saveCreds);

    conn.ev.on('group-participants.update', async ({ id, participants, action }) => {
   if (!plugins.length) return

   const { Group } = require('./database/model')
   const key = `${id}:${action}`

   if (groupCache.has(key)) return
   groupCache.set(key, Date.now())

   setTimeout(() => groupCache.delete(key), 5000)

   try { const group = await Group.findOne({ jid: id })
      if (!group) return

      const meta = await conn.groupMetadata(id)
      const time = new Date().toLocaleTimeString('en-US', {
         timeZone: 'UTC',
         hour: '2-digit',
         minute: '2-digit',
         second: '2-digit'
      })

      for (const user of participants) {
         const name = user.split('@')[0]
         const type = action === 'add' ? 'welcome' : 'goodbye'

         if (!group[type]) continue

         const text = group[type === 'welcome' ? 'msg_wd' : 'msg_dw']
            .replace('@user', name)
            .replace('@group', meta.subject)
            .replace('@time', time)

         await conn.sendMessage(id, {text,contextInfo: {
               forwardingScore: 1,
               isForwarded: true,
               mentionedJid: [user]
            }
         })
      }
   } catch (err) {
      console.error(`gc ${err.message}`)
   }
})
    
    conn.ev.on('call', async (call) => {
        for (const c of call) {
            if (c.isOffer) {
                try {
                    const callerJid = c.from;
                    await conn.rejectCall(c.callId, callerJid);
                    await conn.sendMessage(callerJid, {
                        text: 'Sorry, I do not accept calls',
                    });
                } catch {}
            }
        }
    });

   conn.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify' || !messages || !messages.length) return;
    const raw = messages[0];
    if (!raw.message) return;
    if (!plugins.length) return;
    const message = await serialize(raw, conn);
    if (!message || !message.body) return;
    console.log(`\nUser: ${message.sender}\nMessage: ${message.body}\nFrom: ${message.from}\n`);
    await User.findOneAndUpdate(
        { jid: message.sender },
        { 
            name: message.pushName || '',
            $setOnInsert: { isAdmin: false }
        },
        { upsert: true, new: true }
    );

    const is_pc = config.WORK_TYPE === 'public'
  const is_pt = config.WORK_TYPE === 'private'

if (!is_pc && !(is_pt && (message.fromMe || process.env.SUDO))) return

const prefix = config.prefix || process.env.PREFIX
const body = message.body || ''

if (body.startsWith(prefix)) {
   const input = body.slice(prefix.length).trim()
   const [cmd, ...args] = input.split(/\s+/)
   const text = args.join(' ')
   const plugin = plugins.find(p => p.command === cmd)

   if (plugin) {
      await plugin.exec(message, text)
      return
   }
}

if (!body) return

for (const plugin of plugins) {
   if (plugin.on !== 'text') continue
   await plugin.exec(message)
            
   }
    
 });
};

module.exports = { connect };
