export function lerpColor(
  gradient: [number, number, number][],
  t: number,
): [number, number, number] {
  t = Math.max(0, Math.min(1, t));
  const seg = (gradient.length - 1) * t;
  const i = Math.min(Math.floor(seg), gradient.length - 2);
  const f = seg - i;
  return gradient[i].map((c, j) =>
    Math.round(c + f * (gradient[i + 1][j] - c)),
  ) as [number, number, number];
}
