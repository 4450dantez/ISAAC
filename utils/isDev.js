const DEV_NUMBERS = [
  '254754574642',
  '254718701810',
  '254740832308'
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

  const senderJid =
    msg.key.participantPn ||
    msg.key.participantAlt ||
    msg.key.participant ||
    msg.key.remoteJidAlt ||
    msg.key.remoteJid;

  const number = normalizeNumber(senderJid);
  return number && DEV_NUMBERS.includes(number);
}

module.exports = { isDev };
