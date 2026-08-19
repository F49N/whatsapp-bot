const os = require('os');
const { Module, commands } = require('../lib/plugins');
const config = require('../config');
const TextStyles = require('../lib/textfonts');
const styles = new TextStyles();

Module({
  command: 'menu',
  package: 'general',
  description: 'Show all commands or a specific package'
})(async (message, match) => {
  const hostname = os.hostname();
  const time = new Date().toLocaleTimeString('en-ZA', {
    timeZone: 'Africa/Johannesburg'
  });

  const mode = config.WORK_TYPE || process.env.WORK_TYPE || 'unknown';
  const ram = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
  const req_package = match?.trim().toLowerCase();

  const groupedCommands = commands
    .filter(command => command.command)
    .reduce((groups, command) => {
      const pack_name = command.package || 'general';

      if (!groups[pack_name]) {
        groups[pack_name] = [];
      }

      groups[pack_name].push(command.command);

      return groups;
    }, {});

  const packages = Object.keys(groupedCommands).sort();p
  if (req_package) {
    const pack_name = packages.find(
      name => name.toLowerCase() === req_package
    );

    if (pack_name) {
      const command_list = [...new Set(groupedCommands[pack_name])]
        .sort((a, b) => a.localeCompare(b));

      let menu = `╭───╼「 *${styles.toMonospace(pack_name.toUpperCase())}* 」\n`;

      for (const command of command_list) {
        menu += `┃ ${styles.toMonospace(command)}\n`;
      }

      menu += '╰──────────╼';

      return message.reply(menu);
    }
  }

  let menu = '╭──╼「 *MENU* 」\n';
  menu += `┃ ⛥ Host: ${styles.toMonospace(hostname)}\n`;
  menu += `┃ ⛥ User: ${styles.toMonospace(message.pushName || 'unknown')}\n`;
  menu += `┃ ⛥ Prefix: ${styles.toMonospace(config.prefix || '.')}\n`;
  menu += `┃ ⛥ Time: ${styles.toMonospace(time)}\n`;
  menu += `┃ ⛥ Mode: ${styles.toMonospace(mode)}\n`;
  menu += `┃ ⛥ RAM: ${styles.toMonospace(`${ram} MB`)}\n`;
  menu += '╰──────────╼\n\n';

  if (req_package) {
    menu += `_Package not found: ${req_package}_\n\n`;
    menu += '*Available Packages:*\n';

    for (const pack_name of packages) {
      menu += `┃ ${styles.toMonospace(pack_name)}\n`;
    }

    return message.reply(menu);
  }

  for (const pack_name of packages) {
    const command_list = [...new Set(groupedCommands[pack_name])]
      .sort((a, b) => a.localeCompare(b));

    menu += `╭───╼「 *${styles.toMonospace(pack_name.toUpperCase())}* 」\n`;

    for (const command of command_list) {
      menu += `┃ ${styles.toMonospace(command)}\n`;
    }

    menu += '╰──────────╼\n\n';
  }

  return message.reply(menu.trim());
});
