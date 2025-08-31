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
  const input = match?.trim() || '';
  const is_ai = input === '--auto';
  if (games.has(message.from)) return await message.send('_A game is already running_');
  const mention = message.raw.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
  const reply = message.quoted?.sender;
  const opponent = mention || reply || (is_ai ? 'auto' : null);
  if (!opponent) return await message.send('_Please mention a user, reply to someone, or use --auto to play against bot_'); 
  const game = new TicTacToe(message.sender, opponent === 'auto' ? 'bot' : opponent);
  const session = {
    starter: message.sender,
    opponent,
    game,
    state: 'PLAYING',
    isAuto: opponent === 'auto',
    chatId: message.from,
    id: 'ttt-' + Date.now()
  };
  
  games.set(message.from, session);  
  const dis = `
🎮 *TicTacToe*

Turn ${session.game.activePlayer.split('@')[0]}...

${srt_r(session.game.displayBoard())}

▢ Room ID: ${session.id}
▢ Player ❎: ${session.game.p1.split('@')[0]}
▢ Player ⭕: ${session.is_ai ? 'Bot' : session.game.p2.split('@')[0]}
• use num (1-9)
• *surrender* to give up
`;

  if (session.is_ai) {
  await message.send(dis);
  } else {
  await message.send({text: dis, mentions: [session.game.p1, session.game.p2]
  });
  }
});

Module({
  on: 'text',
})(async (message) => {
  const session = games.get(message.from);
  if (!session) return;
  const body = message.body.trim();
  const s_id = message.sender;
  if (/^(surrender|give up)$/i.test(body)) {
  if (session.is_ai && s_id === session.game.p1) {
      await message.send(`🏳️ ${s_id.split('@')[0]} surrendered, Bot wins\n▢ Room ID: ${session.id}`);
      games.delete(message.from);
      return;
    } else if (!session.is_ai && [session.game.p1, session.game.p2].includes(s_id)) {
      const winner = s_id === session.game.p1 ? session.game.p2 : session.game.p1;
      await message.send(`🏳️ ${s_id.split('@')[0]} surrendered ${winner.split('@')[0]} wins\n▢ Room ID: ${session.id}`);
      games.delete(message.from);
      return;
    }
  }
  if (session.is_ai) {
    if (s_id !== session.game.p1) return;
  } else {
    if (![session.game.p1, session.game.p2].includes(s_id)) return;
    if (s_id !== session.game.activePlayer) return;
  }
  if (!/^[1-9]$/.test(body)) return;
  const pos = parseInt(body) - 1;
  const ok = session.game.play(pos);
  if (!ok) return message.send('_Position is already taken_');
  const mover = () => {
    if (session.game.victor || session.game.totalMoves === 9) return;
    const ap = [];
    for (let i = 0; i < 9; i++) {
      if (!((session.game._p1Board | session.game._p2Board) & (1 << i))) {
        ap.push(i);
      }
    }
    if (ap.length > 0) {
      const ra = ap[Math.floor(Math.random() * ap.length)];
      session.game.play(ra);
    }
  };
  if (session.is_ai && session.game.activePlayer === 'bot' && !session.game.victor && session.game.totalMoves < 9) {
    mover();
  }
  const winner = session.game.victor;
  const tie = session.game.totalMoves === 9;
  let status;
  if (winner) {
    if (session.is_ai) {
    status = winner === session.game.p1 ? `🎉 ${winner.split('@')[0]} wins` : '🎉 Bot wins';
    } else {
    status = `🎉 ${winner.split('@')[0]} wins`;
    }
  } else if (tie) {
    status = '🤝 Game ended in a draw';
  } else {
    if (session.is_ai) {
    status = session.game.activePlayer === session.game.p1 ? `🎲 Turn: ${session.game.activePlayer.split('@')[0]}` : '🎲 Turn: Bot';
    } else {
    status = `🎲 Turn: ${session.game.activePlayer.split('@')[0]}`;
    }
  }

  const dis = `
🎮 *TicTacToe*

${status}

${srt_r(session.game.displayBoard())}

▢ Room ID: ${session.id}
▢ Player ❎: ${session.game.p1.split('@')[0]}
▢ Player ⭕: ${session.is_ai ? 'Bot' : session.game.p2.split('@')[0]}
${!winner && !tie ? '• use number (1-9)\n• *surrender* to give up' : ''}
`;

  await message.send(dis);
  if (winner || tie) games.delete(message.from);
});
   
