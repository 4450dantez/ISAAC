const DEV_NUMBERS = [
  '254754574642',
  '254718701810',
  '254740832308',
  '254715941789'
];

function normalizeNumber(jid) {
  if (!jid) return '';
  // Strips off @s.whatsapp.net, @lid, and :device suffixes (e.g. 254754574642:15@s.whatsapp.net -> 254754574642)
  return jid
    .split('@')[0]
    .split(':')[0]
    .replace(/\D/g, '');
}

function isDev(msg, sock) {
  if (!msg?.key) return false;

  // 1. First, check candidate sender JIDs in the incoming message
  const candidates = [
    msg.key.participantPn,
    msg.key.participantAlt,
    msg.key.participant,
    msg.key.remoteJidAlt,
    msg.key.remoteJid,
  ];

  const candidateMatch = candidates.some((jid) => {
    const number = normalizeNumber(jid);
    return number && DEV_NUMBERS.includes(number);
  });

  if (candidateMatch) return true;

  // 2. Self-chat / fromMe fallback:
  // If sent from the bot account, check if the bot's own phone number (from sock.user.id) is in DEV_NUMBERS
  if (msg.key.fromMe) {
    const botPn = sock?.user?.id ? normalizeNumber(sock.user.id) : null;
    const botLid = sock?.user?.lid ? normalizeNumber(sock.user.lid) : null;

    if (botPn && DEV_NUMBERS.includes(botPn)) return true;
    if (botLid && DEV_NUMBERS.includes(botLid)) return true;
  }

  return false;
}

module.exports = { isDev };

