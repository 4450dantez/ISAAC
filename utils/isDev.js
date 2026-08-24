const DEV_NUMBERS = [
  '254754574642',
  '254718701810',
  '254740832308',
  '254715941789'
];

function normalizeNumber(jid) {
  if (!jid) return '';

  return jid
    .split('@')[0]
    .split(':')[0]
    .replace(/\D/g, '');
}

function isDev(msg, sock) {
  if (!msg?.key) return false;

  // 1. If message was sent by the bot instance itself (fromMe)
  if (msg.key.fromMe) {
    const botPn = sock?.user?.id
      ? normalizeNumber(sock.user.id)
      : '';

    const botLid = sock?.user?.lid
      ? normalizeNumber(sock.user.lid)
      : '';

    if (botPn && DEV_NUMBERS.includes(botPn)) return true;
    if (botLid && DEV_NUMBERS.includes(botLid)) return true;

    return false;
  }

  // 2. Candidate JID fields for Group & Direct messages
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
