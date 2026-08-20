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

  // 1. Check message candidate JIDs first against DEV_NUMBERS
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

  if (candidateMatch) {
    return true;
  }

  // 2. Fallback: If candidate check failed (e.g. self-chat @lid masking on Baileys v7)
  // only validate msg.key.fromMe if the bot account itself is verified in DEV_NUMBERS
  if (msg.key.fromMe) {
    const botNumber = sock?.user?.id ? normalizeNumber(sock.user.id) : null;
    return Boolean(botNumber && DEV_NUMBERS.includes(botNumber));
  }

  return false;
}

module.exports = { isDev };

