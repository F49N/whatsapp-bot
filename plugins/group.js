const { Module } = require('../lib/plugins');
const config = require('../config');
//const { GroupWarns } = require('../lib/database/');

Module({
    command: 'add',
    package: 'group',
    description: 'Add member to group'
})(async (message) => {
    await message.loadGroupInfo(message.from);
    if (!message.isGroup || !message.isAdmin || !message.isBotAdmin) return;
    const number = message.body.replace(/[^0-9]/g, '');
    if (!number) return message.send('_Provide user num_');
    const jid = number + '@s.whatsapp.net';
    const res = await message.addParticipant(jid);
    const status = res?.[jid]?.status;
    if (status === 200) {
        await message.send(`${number} has been added`, {
            mentions: [jid]
        });
    } else if (status === 403) {
        await message.send(`${number} allow group invites`, {
            mentions: [jid]
        });
    } else {
        await message.send(`403: ${number}`, {
            mentions: [jid]
        });
    }
});

Module({
    command: 'kick',
    package: 'group',
    description: 'Remove member from group'
})(async (message) => {
    await message.loadGroupInfo(message.from);
    if (!message.isGroup || !message.isAdmin || !message.isBotAdmin) return;
    const jid = message.quoted?.participant || message.body.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    await message.removeParticipant(jid);
    await message.send(`${jid} removed`);
});

Module({
    command: 'promote',
    package: 'group',
    description: 'Promote member to admin'
})(async (message) => {
    await message.loadGroupInfo(message.from);
    if (!message.isGroup || !message.isAdmin || !message.isBotAdmin) return;
    const jid = message.quoted?.participant || message.body.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    await message.promoteParticipant(jid);
    await message.send(`${jid} has been promoted`);
});

Module({
    command: 'demote',
    package: 'group',
    description: 'Demote admin to member'
})(async (message) => {
    await message.loadGroupInfo(message.from);
    if (!message.isGroup || !message.isAdmin || !message.isBotAdmin) return;
    const jid = message.quoted?.participant || message.body.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    await message.demoteParticipant(jid);
    await message.send(`${jid} has been demoted`);
});

Module({
    command: 'close',
    package: 'group',
    description: 'Mute the group (admins only)'
})(async (message) => {
    await message.loadGroupInfo(message.from);
    if (!message.isGroup || !message.isAdmin || !message.isBotAdmin) return;
    await message.muteGroup(message.from);
    await message.send('_Group has been muted_');
});

Module({
    command: 'unmute',
    package: 'group',
    description: 'Unmute the group'
})(async (message) => {
    await message.loadGroupInfo(message.from);
    if (!message.isGroup || !message.isAdmin || !message.isBotAdmin) return;
    await message.unmuteGroup(message.from);
    await message.send('_Group has been unmuted_');
});

Module({
    command: 'subject',
    package: 'group',
    description: 'Set new group subject'
})(async (message,match) => {
    await message.loadGroupInfo(message.from);
    if (!message.isGroup || !message.isAdmin || !message.isBotAdmin) return;
    if (!match) return;
    await message.setSubject(match);
    await message.send('_Group subject updated_');
});

Module({
    command: 'desc',
    package: 'group',
    description: 'Set new group description'
})(async (message,match) => {
    await message.loadGroupInfo(message.from);
    if (!message.isGroup || !message.isAdmin || !message.isBotAdmin) return;
    if (!match) return;
    await message.setDescription(match);
    await message.send('_Group description updated_');
});

Module({
    command: 'leave',
    package: 'group',
    description: 'Bot leaves the group'
})(async (message) => {
    await message.loadGroupInfo(message.from);
    if (!message.isGroup || !message.isfromMe) return;
    await message.send('_Leaving..._');
    await message.leaveGroup(message.from);
});

Module({
    command: 'approve',
    package: 'group',
    description: 'Approve join requests (all or @)'
})(async (message) => {
    await message.loadGroupInfo(message.from);
    if (!message.isGroup || !message.isAdmin || !message.isBotAdmin || !message.joinApprovalMode) return;
    const requests = await message.getJoinRequests(message.from);
    if (!requests.length) return message.send('_No pending requests_');
    await message.updateJoinRequests(requests, 'approve');
    await message.send(`Approved: ${requests.length} users`);
});

Module({
    command: 'reject',
    package: 'group',
    description: 'Reject join requests (all or @)'
})(async (message) => {
    await message.loadGroupInfo(message.from);
    if (!message.isGroup || !message.isAdmin || !message.isBotAdmin || !message.joinApprovalMode) return;
    const requests = await message.getJoinRequests(message.from);
    if (!requests.length) return message.send('_No pending requests_');
    await message.updateJoinRequests(requests, 'reject');
    await message.send(`Rejected: ${requests.length} users`);
});

/*Module({
    command: 'warn',
    package: 'group',
    description: 'Warn a user in the group'
})(async (message) => {
    await message.loadGroupInfo(message.from);
    if (!message.isGroup || !message.isAdmin || !message.isBotAdmin) return;
    const mentionedJid = message.content?.contextInfo?.mentionedJid?.[0] || message.quoted?.sender; 
    if (!mentionedJid) return message.send('_Please mention a user or reply to them_');
    const g_id = message.from;
    const y_id = mentionedJid;
    let [ctx] = await GroupWarns.findOrCreate({where: { group: g_id, user: y_id },defaults: { warns: 0 },});
    ctx.warns += 1;
    await ctx.save();
    const time = 3;
    const remaining = time - ctx.warns;
    await message.send(config.WARN_MESSAGE
    .replace('&mention', `${y_id.split('@')[0]}`)
    .replace('&warn', ctx.warns)
    .replace('&remaining', remaining));
    if (ctx.warns >= time) {
    try { await message.removeParticipant(y_id);
    await message.send(config.WARN_KICK_MESSAGE.replace('&mention', `${y_id.split('@')[0]}`));
    await ctx.destroy();
    } catch (e) { console.error(e);
      }
    }
});

Module({
    command: 'resetwarn',
    package: 'group',
    description: 'Reset warnings of a user in the group'
})(async (message) => {
    await message.loadGroupInfo(message.from);
    if (!message.isGroup || !message.isAdmin || !message.isBotAdmin) return;
    const mentionedJid = message.content?.contextInfo?.mentionedJid?.[0] || message.quoted?.sender; 
    if (!mentionedJid) return message.send('_Please mention a user or reply to them_');
    const g_id = message.from;
    const x_id = mentionedJid;
    const ctz = await GroupWarns.findOne({ where: { group: g_id, user: x_id } });
    if (!ctz) return message.send('_This user has no warnings_');
    await ctz.destroy();
    await message.send(config.WARN_RESET_MESSAGE
    .replace('&mention', `${x_id.split('@')[0]}`)
    .replace('&remaining', 3) 
    );
});*/
