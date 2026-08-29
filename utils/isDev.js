const DEV_NUMBERS = new Set(
  (process.env.DEV_NUMBERS || '')
    .split(',')
    .map(v => v.trim().replace(/\D/g, ''))
    .filter(v => v.length >= 8)
);

function normalizeNumber(jid) {
  if (!jid) return '';

  return String(jid)
    .split('@')[0]
    .split(':')[0]
    .replace(/\D/g, '');
}

function isDev(msg, sock) {
  if (!msg?.key || DEV_NUMBERS.size === 0) {
    return false;
  }

  const candidates = [];

  if (msg.key.fromMe) {
    const botPn = normalizeNumber(sock?.user?.id);
    const botLid = normalizeNumber(sock?.user?.lid);

    if (botPn) candidates.push(botPn);
    if (botLid) candidates.push(botLid);
  }

  candidates.push(
    normalizeNumber(msg.participant),
    normalizeNumber(msg.key.participantPn),
    normalizeNumber(msg.key.participantAlt),
    normalizeNumber(msg.key.participant),
    normalizeNumber(msg.key.remoteJidAlt),
    normalizeNumber(msg.key.remoteJid)
  );

  return candidates.some(number => {
    return number && DEV_NUMBERS.has(number);
  });
}

module.exports = {
  isDev,
  normalizeNumber
};
