const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function resolveFurnaceFrameLayout({ x = 0, y = 0, width = 0, height = 0, cornerSize = 28 }) {
  const safeWidth = Math.max(0, width), safeHeight = Math.max(0, height);
  const corner = clamp(cornerSize, 4, Math.max(4, Math.min(safeWidth, safeHeight) / 2));
  return { x, y, width: safeWidth, height: safeHeight, cornerSize: corner,
    horizontalLength: Math.max(0, safeWidth - corner * 2), verticalLength: Math.max(0, safeHeight - corner * 2) };
}

function corner(context, x, y, size, rotation) {
  context.save(); context.translate(x, y); context.rotate(rotation); context.beginPath();
  context.moveTo(0, size); context.lineTo(0, size * .28); context.quadraticCurveTo(0, 0, size * .28, 0);
  context.lineTo(size, 0); context.moveTo(size * .18, size * .7); context.arc(0, 0, size * .7, 0, Math.PI / 2);
  context.stroke(); context.restore();
}

export function drawFurnaceFrame(context, options = {}) {
  const { x, y, width, height, cornerSize, horizontalLength, verticalLength } = resolveFurnaceFrameLayout({
    ...options, cornerSize: options.cornerSize ?? 28
  });
  const accent = options.accentColor ?? '#72cfe8';
  const alpha = (options.opacity ?? .55) * (options.hovered ? 1 : options.active ? .86 : .68) * (options.locked ? .48 : 1);
  context.save(); context.fillStyle = options.hovered ? 'rgba(31,69,88,.96)' : options.background ?? 'rgba(5,13,22,.82)'; context.fillRect(x, y, width, height);
  if (options.hovered) { context.save(); context.globalAlpha = .34; context.shadowColor = accent; context.shadowBlur = 28;
    context.strokeStyle = accent; context.lineWidth = 8; context.strokeRect(x + 5, y + 5, Math.max(0, width - 10), Math.max(0, height - 10)); context.restore(); }
  context.globalAlpha = alpha; context.strokeStyle = accent; context.lineWidth = options.variant === 'panel' ? 3 : 2;
  const c = cornerSize;
  corner(context, x, y, c, 0); corner(context, x + width, y, c, Math.PI / 2);
  corner(context, x + width, y + height, c, Math.PI); corner(context, x, y + height, c, Math.PI * 1.5);
  context.beginPath();
  const gapH = Math.min(18, horizontalLength * .12), gapV = Math.min(14, verticalLength * .12);
  context.moveTo(x + c, y); context.lineTo(x + width / 2 - gapH, y); context.moveTo(x + width / 2 + gapH, y); context.lineTo(x + width - c, y);
  context.moveTo(x + c, y + height); context.lineTo(x + width / 2 - gapH, y + height); context.moveTo(x + width / 2 + gapH, y + height); context.lineTo(x + width - c, y + height);
  context.moveTo(x, y + c); context.lineTo(x, y + height / 2 - gapV); context.moveTo(x, y + height / 2 + gapV); context.lineTo(x, y + height - c);
  context.moveTo(x + width, y + c); context.lineTo(x + width, y + height / 2 - gapV); context.moveTo(x + width, y + height / 2 + gapV); context.lineTo(x + width, y + height - c); context.stroke();
  context.globalAlpha *= .45; context.strokeRect(x + 8, y + 8, Math.max(0, width - 16), Math.max(0, height - 16));
  if (options.completed) { context.globalAlpha = Math.min(1, alpha + .25); context.fillStyle = accent;
    [[x + width / 2, y], [x + width / 2, y + height], [x, y + height / 2], [x + width, y + height / 2]].forEach(([px, py]) => { context.beginPath(); context.arc(px, py, 3, 0, Math.PI * 2); context.fill(); }); }
  context.restore(); return { cornerSize, horizontalLength, verticalLength };
}
