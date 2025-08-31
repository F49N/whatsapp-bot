const { Module } = require('../lib/plugins');
const config = require('../config');
const Warn = require('../lib/database/warn');

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

Module({
    command: 'warn',
    package: 'group',
    description: 'Warn a user in the group'
})(async (message, match) => {
    await message.loadGroupInfo();
    if (!message.isGroup) return;
    if (!message.isAdmin && !message.fromMe) return;
    if (!message.isBotAdmin) return;    
    const x = message.quoted?.sender || message.mentions?.[0];
    if (!x) return message.send('_Tag or reply to a user_');   
    const reason = match || '_no reason_';
    const ctx = await Warn.find({ id: message.from, userid: x }); 
    if (ctx.length >= 3) {
    await message.removeParticipant(x);
    await Warn.deleteMany({ id: message.from, userid: x });
    return message.send(`@${x.split('@')[0]} has been removed`, { mentions: [x] });}   
    await new Warn({id: message.from,userid: x,
        reason: reason,
        warnedBy: message.sender
    }).save();
    
    return message.send(`「 *warning* 」\n\n@${x.split('@')[0]}: ${ctx.length + 1}/3\n\n*Reason*: ${reason}`, { mentions: [x] });
});

Module({
    command: 'resetwarns',
    package: 'group',
    description: 'Reset warnings of a user'
})(async (message) => {
    await message.loadGroupInfo();
    if (!message.isGroup) return;
    if (!message.isAdmin) return;
    if (!message.isBotAdmin) return;  
    const x = message.quoted?.sender || message.mentions?.[0];
    if (!x) return message.send('_Tag or reply to a user_');
    await Warn.deleteMany({ id: message.from, userid: x });
    return message.send(`*Warning reset for:* @${x.split('@')[0]}`, { mentions: [x] });
});
        
