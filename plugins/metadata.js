
const { Module } = require('../lib/plugins');
const { Group } = require('../lib/database/model');

Module({
    command: 'welcome',
    package: 'group',
    description: 'Enable/disable welcome messages'
})(async (message, match) => {
    await message.loadGroupInfo(message.from);
    if (!message.isGroup || !message.isAdmin) return;
    const args = match.toLowerCase();
    if (!args || (!args.includes('on') && !args.includes('off'))) {
    return message.send('_use: welcome on/off_');}
    const enable = args.includes('on');
    await Group.findOneAndUpdate({ jid: message.from },{ welcome: enable },{ upsert: true, new: true }); 
    await message.send(`_Welcome ${enable ? 'enabled' : 'disabled'}_`);
});

Module({
    command: 'goodbye',
    package: 'group',
    description: 'Enable/disable goodbye messages'
})(async (message, match) => {
    await message.loadGroupInfo(message.from);
    if (!message.isGroup || !message.isAdmin) return; 
    const args = match.toLowerCase();
    if (!args || (!args.includes('on') && !args.includes('off'))) {
    return message.send('_use: goodbye on/off_');}
    const enable = args.includes('on');
    await Group.findOneAndUpdate({ jid: message.from },{ goodbye: enable },{ upsert: true, new: true });
    await message.send(`_Goodbye ${enable ? 'enabled' : 'disabled'}_`);
});

Module({
    command: 'setwelcome',
    package: 'group',
    description: 'Set custom welcome message'
})(async (message, match) => {
    await message.loadGroupInfo(message.from);
    if (!message.isGroup || !message.isAdmin) return; 
    if (!match) return message.send('_Provide welcome message. Use @user for user number, @group for group name, @time for timestamp_');  
    await Group.findOneAndUpdate({ jid: message.from },{ msg_wd: match },{ upsert: true, new: true });  
    await message.send('_Welcome message updated_');
});

Module({
    command: 'setgoodbye',
    package: 'group',
    description: 'Set custom goodbye message'
})(async (message, match) => {
    await message.loadGroupInfo(message.from);
    if (!message.isGroup || !message.isAdmin) return;    
    if (!match) return message.send('_Provide goodbye message. Use @user for user number, @group for group name, @time for timestamp_');    
    await Group.findOneAndUpdate({ jid: message.from },{ msg_dw: match },{ upsert: true, new: true }); 
    await message.send('_Goodbye message updated_');
});
      
