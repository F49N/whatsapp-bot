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
const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'database.db'),
    logging: false,
});
const User = sequelize.define('User', {
    jid: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    name: DataTypes.STRING,
    isAdmin: DataTypes.BOOLEAN
});

const connect = async () => {
    try {
        await sequelize.authenticate();
        await sequelize.sync();
        console.log('sync db');
        console.log('✅ DB connected');
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
            caption: `*${theme.botName}*\n\nPREFIX: ${process.env.PREFIX}\nMODE: ${process.env.WORK_TYPE}\n\n\nSUDO: ${process.env.SUDO}\n\nPlease Enjoy and use it wisely`
        });
    }
    if (connection === 'close') {
        console.log(lastDisconnect?.error);
        setTimeout(connect, 3000);
    }
});

    conn.ev.on('creds.update', saveCreds);

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
    const rawMessage = messages[0];
    if (!rawMessage.message) return;
    if (!plugins.length) return;
    const message = await serialize(rawMessage, conn);
    if (!message || !message.body) return;
    console.log(`\nUser: ${message.sender}\nMessage: ${message.body}\nFrom: ${message.from}\n`);
    await User.findOrCreate({
        where: { jid: message.sender },
        defaults: {
            name: message.pushName || '',
            isAdmin: false
        }
    });

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
                     (config.WORK_TYPE === 'private' && (message.fromMe || config.mods));
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
