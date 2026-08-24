const DEV_NUMBERS = [
  '254754574642',
  '254718701810',
  '254740832308',
  '254715941789'
];

function normalizeNumber(jid) {
  if (!jid) return '';

  return String(jid)
    .split('@')[0]
    .split(':')[0]
    .replace(/\D/g, '');
}

function isDev(msg) {
  if (!msg?.key) return false;

  const possibleJids = [
    msg.key.participantPn,
    msg.key.participantAlt,
    msg.key.participant,
    msg.key.remoteJidAlt,
    msg.key.remoteJid
  ];

  for (const jid of possibleJids) {
    const number = normalizeNumber(jid);

    if (number && DEV_NUMBERS.includes(number)) {
      return true;
    }
  }

  return false;
}

module.exports = { isDev };
