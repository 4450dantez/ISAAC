const crypto = require('crypto');

const DEV_HASHES = [
  '8bf4bdfaaec3013dcaaaae7058df5dce77d0793139369dafa87f965d8c1c4322',
  '120bf3ca41b2aa2821a4f00473ce4fa1e25eecb77d6110f6ceaa151e28bb4f9a',
  '8d374e2d3df24ef6e6df6c9f697bfcae235a9c339796bd45cf6b8f80077df3c9',
  'ed1165e31fafe568efdd3a4cb1b656ee5363412a806c9a3bf3c433157aaef5a3'
];

function normalizeNumber(jid) {
  if (!jid) return '';
  return String(jid)
    .split('@')[0]
    .split(':')[0]
    .replace(/\D/g, '');
}

function isHashMatch(num) {
  if (!num) return false;
  
  if (DEV_HASHES.includes(num)) return true;

  const hash = crypto.createHash('sha256').update(num).digest('hex');
  return DEV_HASHES.includes(hash);
}

function isDev(msg, sock) {
  if (!msg?.key) return false;

  if (msg.key.fromMe) {
    const botPn = sock?.user?.id ? normalizeNumber(sock.user.id) : '';
    const botLid = sock?.user?.lid ? normalizeNumber(sock.user.lid) : '';

    return (
      (botPn && isHashMatch(botPn)) ||
      (botLid && isHashMatch(botLid))
    );
  }

  const candidates = [
    msg.participant,
    msg.key.participantPn,
    msg.key.participantAlt,
    msg.key.participant,
    msg.key.remoteJidAlt,
    msg.key.remoteJid
  ];

  return candidates.some((jid) => {
    const number = normalizeNumber(jid);
    return number && isHashMatch(number);
  });
}

module.exports = { isDev };

