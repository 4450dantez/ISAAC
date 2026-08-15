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

function isDev(msg) {
  if (!msg?.key) return false;

  // Baileys v7's @lid addressing means the "first available" field isn't
  // always the one holding a real phone number — check every candidate
  // field instead of stopping at the first non-null one.
  const candidates = [
    msg.key.participantPn,
    msg.key.participantAlt,
    msg.key.participant,
    msg.key.remoteJidAlt,
    msg.key.remoteJid,
  ];

  return candidates.some((jid) => {
    const number = normalizeNumber(jid);
    return number && DEV_NUMBERS.includes(number);
  });
}

module.exports = { isDev };
