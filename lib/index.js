const { default: makeWASocket, Browsers, useMultiFileAuthState, areJidsSameUser, makeCacheableSignalKeyStore, DisconnectReason } = require('baileys');
const pino = require('pino');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const config = require('../config.js');
const fs = require('fs');
const { getTheme } = require('../Themes/themes');
const theme = getTheme();
const serialize = require('./serialize');
const { loadPlugins } = require('./plugins');
const { connectDB, User } = require('./database/model');
const groupCache = new Map();

const connect = async () => {
    try {
        await connectDB();
    } catch (e) {
        console.error(e);
        return;
    }
    const sessionDir = path.join(__dirname, 'Session');
    if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir);
    const logga = pino({ level: 'silent' });
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
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
        console.log('✅ Garfield connected');
        plugins = await loadPlugins();
        await conn.sendMessage(conn.user.id, {
            image: { url: "https://files.catbox.moe/lq7nwm.jpg" },
            caption: `*${theme.botName}*\n\n*PREFIX:* ${process.env.PREFIX}\n*MODE:* ${process.env.WORK_TYPE}\n*SUDO:* ${process.env.SUDO}\n*Made with❤️*`
        });
    }
    if (connection === 'close') {
        console.log(lastDisconnect?.error);
        setTimeout(connect, 3000);
    }
});

    conn.ev.on('creds.update', saveCreds);

    conn.ev.on('group-participants.update', async ({ id, participants, action }) => {
        if (!plugins.length) return;
        const { Group } = require('./database/model'); 
        const cacheKey = `${id}_${action}`;
        if (groupCache.has(cacheKey)) return;
        groupCache.set(cacheKey, true);
        setTimeout(() => groupCache.delete(cacheKey), 5000); 
        try { const gss = await Group.findOne({ jid: id });
        if (!gss) return; 
        const groupMetadata = await conn.groupMetadata(id);
        const cn_x = new Date().toLocaleTimeString('en-US', {
                timeZone: 'UTC',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
        });          
            for (const participant of participants) {
                if (action === 'add' && gss.welcome) {
                    const w_txt = gss.msg_wd
                        .replace('@user', participant.split('@')[0])
                        .replace('@group', groupMetadata.subject)
                        .replace('@time', cn_x);
                    
                    await conn.sendMessage(id, {
                        text: w_txt,
                        contextInfo: {
                            forwardingScore: 1,
                            isForwarded: true,
                            mentionedJid: [participant]
                        }
                    });
                }
                
                if (action === 'remove' && gss.goodbye) {
                    const g_txt = gss.msg_dw
                        .replace('@user', participant.split('@')[0])
                        .replace('@group', groupMetadata.subject)
                        .replace('@time', cn_x);
                    
                    await conn.sendMessage(id, {
                        text: g_txt,
                        contextInfo: {
                            forwardingScore: 1,
                            isForwarded: true,
                            mentionedJid: [participant]
                        }
                    });
                }
            }
        } catch (error) {}
    });

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

    if (config.STATUS_REACT && message.key?.remoteJid === 'status@broadcast') {
        const st_id = `${message.key.participant}_${message.key.id}`;
        if (!kf.has(st_id) && !conn.areJidsSameUser(message.key.participant, conn.user.id)) {
            const reactions = ['❤️', '❣️', '🩷'];
            try {
            await conn.sendMessage('status@broadcast', {
                    react: {
                        text: reactions[Math.floor(Math.random() * reactions.length)],
                        key: message.key
                    }
                }, { statusJidList: [message.key.participant] });
                kf.add(st_id);
            } catch (e) {
                console.error(e);
            }
        }
    }

    const cmdEvent = config.WORK_TYPE === 'public' || 
                     (config.WORK_TYPE === 'private' && (message.fromMe || process.env.SUDO));
    if (!cmdEvent) return;
    const prefix = config.prefix || process.env.PREFIX;
    if (message.body.startsWith(prefix)) {
        const [cmd, ...args] = message.body.slice(prefix.length).trim().split(' ');
        const match = args.join(' ');
        const found = plugins.find(p => p.command === cmd);
        if (found) {
            await found.exec(message, match);
            return;
        }
    }

    for (const plugin of plugins) {
        if (plugin.on === "text" && message.body) {
            await plugin.exec(message);
        }
    }
});
};

module.exports = { connect };
