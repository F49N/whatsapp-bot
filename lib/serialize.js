const axios = require("axios")
const Jimp = require("jimp")
const { getContentType, downloadContentFromMessage, jidNormalizedUser } = require('baileys')

const groupCache = new Map()

async function makePp(buf) {
  let img = await Jimp.read(buf)
  let w = img.getWidth()
  let h = img.getHeight()
  let crop = img.crop(0, 0, w, h)
  return {
    img: await crop.scaleToFit(324, 720).getBufferAsync(Jimp.MIME_JPEG),
    prev: await crop.normalize().getBufferAsync(Jimp.MIME_JPEG)
  }
}

const serialize = async (msg, conn) => {
  const key = msg.key
  const from = key.remoteJid
  const fromMe = msg.key.fromMe
  const sender = key.fromMe ? jidNormalizedUser(conn.user.id) : jidNormalizedUser(key.participant || from)
  const isGroup = from.endsWith('@g.us')
  const pushName = msg.pushName || 'gafield'
  const type = getContentType(msg.message)
  const content = msg.message[type]

  const extractBody = () => {
    return type === 'conversation' ? content :
           type === 'extendedTextMessage' ? content.text :
           type === 'imageMessage' ? content.caption :
           type === 'videoMessage' ? content.caption :
           type === 'templateButtonReplyMessage' ? content.selectedDisplayText :
           ''
  }

  const extractQuoted = () => {
    const context = msg.message?.extendedTextMessage?.contextInfo
    const quotedMsg = context?.quotedMessage
    if (!quotedMsg) return null

    const qt = getContentType(quotedMsg)
    const qContent = quotedMsg[qt]
    const b =
      qt === 'conversation' ? qContent :
      qt === 'extendedTextMessage' ? qContent.text :
      qt === 'imageMessage' ? qContent.caption :
      qt === 'videoMessage' ? qContent.caption :
      qt === 'templateButtonReplyMessage' ? qContent.selectedDisplayText :
      qt === 'buttonsResponseMessage' ? qContent.selectedButtonId :
      ''

    return {
      type: qt,
      msg: qContent,
      body: b,
      fromMe: context.participant === conn.user.id,
      participant: context.participant,
      id: context.stanzaId,
      key: {
        remoteJid: from,
        fromMe: context.participant === conn.user.id,
        id: context.stanzaId,
        participant: context.participant
      },
      download: async () => {
        const stream = await downloadContentFromMessage(qContent, qt.replace('Message', ''))
        const chunks = []
        for await (const chunk of stream) chunks.push(chunk)
        return Buffer.concat(chunks)
      }
    }
  }

  const msgObj = {
    raw: msg,
    conn,
    key,
    id: key.id,
    from,
    fromMe,
    sender,
    isGroup,
    pushName,
    type,
    body: extractBody(),
    content,
    quoted: extractQuoted(),
    mentions: msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [],
  }

  msgObj.loadGroupInfo = async () => {
    if (!msgObj.isGroup) return
    const cached = groupCache.get(msgObj.from)
    const now = Date.now()
    if (cached && now - cached.timestamp < 5 * 60 * 1000) {
      msgObj.groupMetadata = cached.data
    } else {
      const meta = await conn.groupMetadata(msgObj.from)
      groupCache.set(msgObj.from, { data: meta, timestamp: now })
      msgObj.groupMetadata = meta
    }

    msgObj.groupParticipants = msgObj.groupMetadata.participants
    msgObj.groupAdmins = msgObj.groupParticipants.filter(p => p.admin).map(p => p.id)
    msgObj.groupOwner = msgObj.groupMetadata.owner || msgObj.groupAdmins[0]
    msgObj.joinApprovalMode = msgObj.groupMetadata.joinApprovalMode || false
    msgObj.memberAddMode = msgObj.groupMetadata.memberAddMode || false
    msgObj.announce = msgObj.groupMetadata.announce || false
    msgObj.restrict = msgObj.groupMetadata.restrict || false
    msgObj.isAdmin = msgObj.groupAdmins.includes(msgObj.sender)
    msgObj.isBotAdmin = msgObj.groupAdmins.includes(jidNormalizedUser(conn.user.id))
  }

  msgObj.muteGroup = () => conn.groupSettingUpdate(msgObj.from, 'announcement')
  msgObj.unmuteGroup = () => conn.groupSettingUpdate(msgObj.from, 'not_announcement')
  msgObj.setSubject = (text) => conn.groupUpdateSubject(msgObj.from, text)
  msgObj.setDescription = (text) => conn.groupUpdateDescription(msgObj.from, text)
  msgObj.addParticipant = (jid) => conn.groupParticipantsUpdate(msgObj.from, [jid], 'add')
  msgObj.removeParticipant = (jid) => conn.groupParticipantsUpdate(msgObj.from, [jid], 'remove')
  msgObj.promoteParticipant = (jid) => conn.groupParticipantsUpdate(msgObj.from, [jid], 'promote')
  msgObj.demoteParticipant = (jid) => conn.groupParticipantsUpdate(msgObj.from, [jid], 'demote')
  msgObj.leaveGroup = () => conn.groupLeave(msgObj.from)
  msgObj.inviteCode = () => conn.groupInviteCode(msgObj.from)
  msgObj.revokeInvite = () => conn.groupRevokeInvite(msgObj.from)
  msgObj.getInviteInfo = (code) => conn.groupGetInviteInfo(code)
  msgObj.joinViaInvite = (code) => conn.groupAcceptInvite(code)
  msgObj.getJoinRequests = () => conn.groupRequestParticipantsList(msgObj.from)
  msgObj.updateJoinRequests = (jids, action = 'approve') => conn.groupRequestParticipantsUpdate(msgObj.from, jids, action)
  msgObj.setMemberAddMode = (enable = true) => conn.groupSettingUpdate(msgObj.from, enable ? 'not_announcement' : 'announcement')
  msgObj.fetchStatus = (jid) => conn.fetchStatus(jid)
  msgObj.profilePictureUrl = (jid) => conn.profilePictureUrl(jid)
  msgObj.blockUser = async (jid) => conn.updateBlockStatus(jid, 'block')
  msgObj.unblockUser = async (jid) => conn.updateBlockStatus(jid, 'unblock')
  msgObj.getParticipants = () => msgObj.groupParticipants || []
  msgObj.isParticipant = (jid) => msgObj.getParticipants().some(p => p.id === jid)
  msgObj.download = async () => {
    const stream = await downloadContentFromMessage(msgObj.content, msgObj.type.replace('Message', ''))
    const chunks = []
    for await (const chunk of stream) chunks.push(chunk)
    return Buffer.concat(chunks)
  }

  msgObj.send = async (payload, options = {}) => {
  if (payload?.delete) return conn.sendMessage(msgObj.from, { delete: payload.delete });
  let cend;
  if (typeof payload === 'string') {
    cend = { text: payload };
  } else if (payload.video) {
    cend = { video: payload.video,
    caption: payload.caption || '',
    mimetype: payload.mimetype || 'video/mp4'
    };
  } else {
    cend = payload;
  }

  if (options.edit) cend.edit = options.edit;
  return conn.sendMessage(msgObj.from, cend, { quoted: msgObj.raw });
};

  msgObj.react = async (emoji) => {
  return conn.sendMessage(msgObj.from, {
    reactionMessage: {
      text: emoji,
      key: msgObj.key
    }
  });
};
  
  msgObj.sendFromUrl = async (url, opts = {}) => {
    const res = await axios.get(url, { responseType: "arraybuffer" })
    const buffer = Buffer.from(res.data, "binary")
    if (opts.asSticker) {
      return msgObj.send({ sticker: buffer })
    } else if (opts.asDocument) {
      return msgObj.send({ document: buffer, mimetype: "application/octet-stream", fileName: opts.fileName || "file" })
    } else {
      return msgObj.send({ image: buffer })
    }
  }

  msgObj.setPp = async (jid, buf) => {
    let { query } = conn
    let { img } = await makePp(buf)
    await query({
      tag: "iq",
      attrs: {
        to: "@s.whatsapp.net",
        type: "set",
        xmlns: "w:profile:picture"
      },
      content: [{
        tag: "picture",
        attrs: { type: "image" },
        content: img
      }]
    })
  }

  return msgObj
}

module.exports = serialize
