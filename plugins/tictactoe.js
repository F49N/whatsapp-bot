const { Module } = require('../lib/plugins');
const TicTacToe = require('../lib/tictactoe-d');
const games = new Map();

function srt_r(boardStr) {
  return boardStr.split('\n').map(r => {
    return r.split(' | ').map(v => {
      if (v === '❌' || v === '⭕') return v;
      return ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣'][parseInt(v)-1];
    }).join('');
  }).join('\n');
}

Module({
  command: 'ttt',
  package: 'games',
  description: 'TicTacToe game',
})(async (message, match) => {
  if (!message.isGroup) return;
  const roomName = match?.trim();
  if (games.has(message.from)) 
  return await message.send('_A game is already running_');
  const game = new TicTacToe(message.sender, 'o'); 
  const session = {
    starter: message.sender,
    opponent: null,
    game,
    state: 'WAITING',
    roomName,
    chatId: message.from,
    id: 'ttt-' + Date.now()
  };

  games.set(message.from, session);
  await message.send(`⏳ *Waiting for opponent*\n▢ Room ID: ${session.id}\nType *.ttt ${roomName || ''}* to join`);
});

Module({
  on: 'text',
})(async (message) => {
  const session = games.get(message.from);
  if (!session) return;
  const body = message.body.trim();
  const s_id = message.sender;
  if (session.state === 'WAITING' && s_id !== session.starter) {
    session.opponent = s_id;
    session.game.p2 = s_id;
    session.state = 'PLAYING';
    await message.send(`
🎮 *TicTacToe*

Turn ${session.game.activePlayer}...

${srt_r(session.game.displayBoard())}

▢ Room ID: ${session.id}
▢ Player ❎: ${session.game.p1}
▢ Player ⭕: ${session.game.p2}
• Use num (1-9)
•*surrender* to give up
`);
    return;
  }
  if (![session.game.p1, session.game.p2].includes(s_id)) return;
  if (/^(surrender|give up)$/i.test(body)) {
    const winner = s_id === session.game.p1 ? session.game.p2 : session.game.p1;
    await message.send(`🏳️ ${s_id} surrendered! ${winner} wins\n▢ Room ID: ${session.id}`);
    games.delete(message.from);
    return;
  }

  if (s_id !== session.game.activePlayer) return;
  if (!/^[1-9]$/.test(body)) return;
  const pos = parseInt(body) - 1;
  const ok = session.game.play(pos);
  if (!ok) return message.send('Position is already taken');
  const winner = session.game.victor;
  const tie = session.game.totalMoves === 9;
  let status;
  if (winner) status = `🎉 ${winner} wins`;
  else if (tie) status = '🤝 Game ended in a draw';
  else status = `🎲 Turn: ${session.game.activePlayer}`;

  await message.send(`
🎮 *TicTacToe*

${status}

${srt_r(session.game.displayBoard())}

▢ Room ID: ${session.id}
▢ Player ❎: ${session.game.p1}
▢ Player ⭕: ${session.game.p2}
${!winner && !tie ? '• Use number (1-9)\n•*surrender* to give up' : ''}
`);

  if (winner || tie) games.delete(message.from);
});
