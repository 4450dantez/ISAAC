const DEV_NUMBERS = [
  '254754574642',
  '254718701810',
  '254740832308'
];

function isDev(msg) {
  const rawSender =
    msg.key.participant ||
    msg.key.remoteJid;

  if (!rawSender) return false;

  const senderNumber = rawSender
    .split('@')[0]
    .split(':')[0]
    .replace(/\D/g, '');

  return DEV_NUMBERS.includes(senderNumber);
}

module.exports = { isDev };
