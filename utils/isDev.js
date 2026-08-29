const crypto = require('crypto');

const DEV_HASHES = [
  '8bf4bdfaaec3013dcaaaae7058df5dce77d0793139369dafa87f965d8c1c4322',
  '120bf3ca41b2aa2821a4f00473ce4fa1e25eecb77d6110f6ceaa151e28bb4f9a',
  '8d374e2d3df24ef6e6df6c9f697bfcae235a9c339796bd45cf6b8f80077df3c9',
  'ed1165e31fafe568efdd3a4cb1b656ee5363412a806c9a3bf3c433157aaef5a3'
];

function normalizeNumber(jid) {
  if (typeof jid !== 'string') return '';
  return jid.split('@')[0].split(':')[0].replace(/\D/g, '');
}

function hashNumber(num) {
  return crypto.createHash('sha256').update(num).digest('hex');
}

function isHashMatch(targetNum) {
  if (!targetNum) return false;
  const targetHash = hashNumber(targetNum);
  
  return DEV_HASHES.some(devHash => {
    try {
      return crypto.timingSafeEqual(
        Buffer.from(devHash, 'hex'),
        Buffer.from(targetHash, 'hex')
      );
    } catch {
      return false;
    }
  });
}

function isDev(msg, sock) {
  if (!msg || typeof msg !== 'object' || !msg.key) return false;

  if (msg.key.fromMe) {
    const botPn = sock?.user?.id ? normalizeNumber(sock.user.id) : '';
    const botLid = sock?.user?.lid ? normalizeNumber(sock.user.lid) : '';

    return isHashMatch(botPn) || isHashMatch(botLid);
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
    return isHashMatch(number);
  });
}

module.exports = { isDev };

