const fs = require('fs');
const path = require('path');

const commands = [];

const Module = data => exec => {
  commands.push({
    ...data,
    exec
  });
};

const load_plugins = (dir = path.join(__dirname, '..', 'plugins')) => {
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.js')) continue;

    require(path.join(dir, file));
    console.log(`✅ Plugin: ${file}`);
  }

  return commands;
};

module.exports = {
  Module,
  load_plugins,
  commands
};
