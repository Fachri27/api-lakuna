import sharp from "sharp";

// Logo watermark untuk photo service.
// Logo di-embed sebagai base64 data URI supaya ikut ter-compile ke dist
// (tsc tidak meng-copy aset PNG), dan berjalan sama di dev (tsx) maupun prod.
//
// Sumber logo: apps/frontend/public/logo1.png, di-downscale ke 400px lebar
// (PNG ~2.4KB) — cukup tajam untuk tile watermark ukuran ~12% lebar gambar.

// Base64 dari logo yang sudah di-downscale. Dipisah per baris agar tidak
// membentuk satu string raksasa. Diencode ulang 2026-09-27: salinan lama
// rusak (CRC IDAT salah, tanpa chunk IEND) — libvips lama memaafkannya,
// libvips 8.18 (sharp 0.35) menolak dengan "libpng read error" sehingga
// pratinjau keluar TANPA watermark.
const LOGO_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAZAAAADWCAYAAAD/ydQJAAAACXBIWXMAAwDyAAMA8gEIj4WEAA" +
  "AVDklEQVR4nO2dPa7jyBWFH7wAL8BrcOjUbwBnAyj3BiZxYsyNDBhw9xacGRP2PhqziKdoWm0M" +
  "MDNZJ4bzgY2iWNJVqYqsIou6utIXHLx+r/VzePixLqtYLL7s/iIviAxgAAZgAAZ2jRkADdDAAA" +
  "zAAAy8LMkAcAAHBmAABmDghQICBDQEMAADMPByqwyADdhgAAZgAAZeKCBAQEMAAzAAAy/0QICA" +
  "hgAGYAAGXu45A3MDiAxgAAZgQFxmYG4AkQEMwAAMiMsMzA0gMoABGIABcZmBuQFEBjAAAzAgLj" +
  "MwN4DIAAZgAAbEZQbmBhAZwAAMwIC4zMDcACIDGIABGBCXGZgbQGQAAzAAA+IyA3MDiAxgAAZg" +
  "QFxmYG4AkQEMwAAMiMsMzA0gMoABGIABcZmBuQFEBjAAAzAgLjMwN4DIAAZgAAbEZQbmBhAZwA" +
  "AMwIC4zMDcACIDGIABGBCXGZgbQGQAAzAAA+IyA3MDiAxgAAZgQFxmYG4AkQEMwAAMiMsMzA0g" +
  "MoABGIABcZmBuQFEBjAAAzAgLjMwN4DIAAZgAAbEZQbmBhAZwAAMwIC4zMDcACIDGIABGBCXGZ" +
  "gbQGQAAzAAA+IyA3MDiAxgAAZgQFxmYG4AkQEMwAAMiMsMzA0gMoABGIABcZmBuQFEBjAAAzAg" +
  "LjMwN4DIAAZgAAbEZQbmBhAZwAAMwIC4zMDcACIDGIABGBCXGZgbQGQAAzAAA+IyA3MDiAxgAA" +
  "ZgQFxmYG4AkQEMwAAM+GTA3AAiAxiAARgQlxmYG0BkAAMwAAPiMgNzA4gMYAAGYEBcZmBuAJEB" +
  "DMAADIjLDMwNIDKAARiAAXGZgbkBRAYwAAMwIC4zMDeAyAAGYAAGxGUG5gYQGcAADMCAuMzA3A" +
  "AiAxiAARgQlxmYG0BkAAMwAAPiMgNzA4gMYAAGYEBcZmBuAJEBDMAADIjLDMwNIDKAARiAAXGZ" +
  "gbkBRAYwAAMwIC4zMDeAyAAGYAAGxGUG5gYQGcAADMCAuMzA3AAiAxiAARgQlxmYG0BkAAMwAA" +
  "PiMgNzA4gMYAAGYEBcZmBuAJEBDMAADIjLDMwNIDKAARiAAXGZgbkBRAYwAAMwIC4zMDeAyAAG" +
  "YAAGxGUG5gYQGcAADMCAuMzA3AAiAxiAARgQlxmYG0BkAAMwAAPiMgNzA4gMYAAGYEBcZmBuAJ" +
  "EBDMAADIjLDMwNIDKAARiAAXGZgbkBRAYwAAMwIC4zMDeAyAAGYAAGxGUG5gYQGcAADMCAuMzA" +
  "3AAiAxiAARgQlxmYG0BkAAMwAAPiMgNzA4gMYAAGYEBcZmBuAJEBDMAADIjLDMwNIDKAARiAAX" +
  "GZgbkBRAYwAAMwIC4zMDeAyAAGYAAGxGUG5gYQGcAADMCAuMzA3AAiAxiAARgQlxmYG0BkAAMw" +
  "AAPiMgNzA4gMYAAGYEBcZmBuAJEBDMAADIjLDMwNIDKAARiAAXGZgbkBRAYwAAMwIC4zMDeAyA" +
  "AGYAAGxGUG5gYQGcAADMCAuMzA3AAiAxiAARgQlxmYG0BkAAMwAAPiMgNzA4gMYAAGYEBcZmBu" +
  "AJEBDMAADIjLDMwNIDKAARiAAXGZgbmBW+jTp0/f/PTXP/7uUb399O1Xf8j9fvjnP35jvX2IDC" +
  "yPjR9++OH3nz59+hoOZZNj8SkO8F6N9H/+9qf/Rf0iX32Jn2nVUMfv/UVeP4yefg0/f5bXd5a+" +
  "EBncy3F7OBzeHw6H7zkeZJPjkoO9oYCEBlqJAkJDyfGzIQMUELl7vswNeOuBUEDs9yd6jgwoIH" +
  "L3MjfgBUQKiP1+fET1YDOM8X/+/Pk76225x2wYwpJN95E5JF5ApIDY78dHVKcC8s3nz59/ir9z" +
  "7eucDQVENuXX/ADycpBSQOz34yOqVwE5HA5v8XcKyDkbCohsyq/5AfRsBSS8dkoWs7DW+li67W" +
  "veu7XnW3xPr+/IFZDefm9dlLodI8zCetlyP90MCO9aW0BqD4CWA+XRp/EuaTTWNJqt2a/9nh6v" +
  "2boHon2UPrd3oeqZDQVENj1GN/3wR1LPHkh4X+7mv/B3fbDWHiRLC0jp7C78/Pe//v5b68xLuc" +
  "1lt/Tz9fb32kdT3xMyjje6hSIQfobfa7NPC8iWPab4OUMuo7ZkpFc2awrIPR8PuzuRuYFnKSDh" +
  "taFh/0VeP4b3xs9JPzP8f3hdy2ev6YEc728ZPO31z/T7f/729c/Jaz605nd87/k74kFZ8jlkNn" +
  "zv64c0t9rsWs5m1+yjlh5jaAjDrKmh0T/qe6XT3+buoNYF5Mcff/xv8jnxs97XspDNQ+Ufi+o5" +
  "hyMH4TWtWeS+Myhsc/AeJgUEqTze1N+GbKaK5NoCoveV3hfee/W7zjI38KgFRJ+9HBulr76ou9" +
  "h/LUnf6R4OzNLn9yggY2Ow1+8d3q++VxeQ5E78fe87+XXDdWy0zpnN5XaVnby+mxt60ftq8T4a" +
  "v6dluGlsCL8LjVPudWOj9T42lvF16XeknzmerV8o9x31hTTN//XjwIK8vkuZiVm09sqThnooEm" +
  "HbdW9D78fWbJYUkKTQD35a3r97IpkbeMQCkjSEH9MGSR+UqdLXTRWDJUNYl97OxSMqLVppAVFn" +
  "5Put7uTPZD2bXe51U70cPYyk81uyj8L7q3ogY8NXavRy3kKhKZ39lq6BtCo9UYiFo5Dp0PMsZd" +
  "Zy4qMb6tCDGnplDUU/vL6U59ICknqieMhkXuYN80MXkGOjmQ6F7GMDrzWe8V016GmPYE0BaS0e" +
  "lgUk33gdh4+GYRN5fReleyulBm8mi9N75/dR/oRgLvPYINX0CFqHgdZeA4mv0z2Lqd5XYCG8Ps" +
  "dQmsfUd8afsUeWy28um7DtvQoIxUOa20XzhvnRh7BUEdnHA2/qe+IZYE1j21JApopHTZGyLiC1" +
  "35O7TjK3bTGTePa8xT4az5arGsnU41xPZc0srNP+rSgeupDHCQWZHJp6z2MD/7akcE69trWAUD" +
  "xkUbt400b4WS+ix4NNHyRTZ4tjAzXbCNYWkNniUXGgGxeQi9dOZZfv9R3H7ucKfcs+Sj3O5ni8" +
  "EPtNDS+tWlpA0uIxM2Q3XjQ/8bMPQ2yai9re3wWbx4v93a8xtBQQiocsztm8YX62+0Bqv08Plc" +
  "z1KqYKyJrica8FZO67MmfTs71FXWxrhzrS3CcbzMPh7Z4KSK6HnA4Pxv/X03aHonHK9/qiei7z" +
  "9Pk06fDVFjOcagvIVPHovZ92DyhzA89QQJbAmM50yTVOtT2Q8ULxxdh9qdDkvHspIEmxvDgjnn" +
  "vIVqd9dNXT2fpMe+0QVmBDr9IQ3hv/FjMbCoqaqqv20elaUXrCc77Yfp7ynfoaJwmYFRCKh6zO" +
  "uRvEj65bL2XSq4CsKR7OC8jF2HzLUxpX7KOpAnKcepqchVsUEJ3TeRJCvD9nyE1PZ96X7vMIP4" +
  "epu+frIXudtzpmhmsm6fstCwjFQ7rkfNNG2LNuPYTVo4CsLR7PVkA67KNiAYmNZe5C+tqGc2kB" +
  "yV37OGf2+jFkVuMt7pt0aCuyV2LOqoBQPKRbu9jtgx5dvXog8e5ePQ01HW/uVUByxUN/TlNj+Q" +
  "QF5GofJfupYh9lL9brBmvqBrhcL2fLIazSlOS4Ha2KHMbeR2kig2UBSYvHkplxSE4ZPH0YtSv1" +
  "rl7K5LxkyJf52S7HIYU1BSS90WtN8XiWAjLuow8N++hD62yveHOgWpJjuI8hV3RqexItBeTyul" +
  "j+Po6QQ7xg3rKP4zBYyuSoYdaWfr1VD4TiId3a/acuIC3LvC+9D0Tf6Zw72yv9PXNWWFVAzg1c" +
  "27TKZywg+t+xGKzcR8UCkiouyZGs+zRcaNcFZaqQrCkguYziNsRrG3NrlaUa1ggbr5ek/OX24a" +
  "0LyJjV12PPY8i7dRuRXGTw9IFs0QNJikdmGOl4RnZeXPC0yOCXTgUk29DVTNstHYiPWEBUw3fV" +
  "W4sXfxv3UXUB0Z4DJ+MigqeCMk77nWxYtyggQwEYe8utx0nI8XKab9KzMS4gsXicZsONi1b2/u" +
  "7dE8ncwCMXkMIw0nBxMu3Ox4Yk/F9c1mRNATk3gHVLljxrAUkbu7iPwvYu2EfVBSR3vUM3rKGR" +
  "0+tDTfVyexQQvU/jEGrNtujPm7k73bQHEoet4r048ftZ70pW5WzegHtRbQFpuVN5qhFZehFdF4" +
  "9YqDJFpOkelkcrINON6HlhxLlhpNqL6HP55lQzVr+mgISf6UrMsWge86i/XqZfk+t9RF7Sz7lV" +
  "AYlDhPpGzjTjrW7y3D24zA08agG5blzOB1DuoEz/tqaA6Hn30XvubLNm/PeRC0hmGY791HMtKv" +
  "ZRcwEpbUemgbtqZJcUEK2Emy/x2kdu2m2pB3RRkMebC/PDqNf83qqA1OSnF7qkiEh1zuYN86MW" +
  "kDVPCex5I6FuLKcO6rlx9ocsIBUZT2mrApL6HB8+9X3vAhKZiMxc9kqOWeTWCMt/zvmej9zEg9" +
  "wzZqzvRE9fF7xwUV2acjZvmL1cE2lt1K7Wsmp8RkLPpUymxvvXrIXVcsDfYwHZoMh3KyAJk1/n" +
  "Gre1BSQObw75jPe+pI1+fLhXml9cSFFNLNhPraOV4/YeCkjy2uFJjiknSIoZEE5tA9g4NbRmMc" +
  "RbFpCJ4a7Ji+p6eCJ9X+3d3fH9z1xA1jRGFQVk+P/077XboNetyvWyz/vjOMsqvDZOJtDFobSO" +
  "1j0vppiZvBCeisjNhX+py5kCUhlUejE6NwRUOz4+pYn3dykgxYvqhWJQapSntj+3TfdYQGquUz" +
  "XuI5MeSPqwqqae4bjKbjrEmWaieif79C79zFpa1dfaljy3vXcByWXJRXWhgPSGMTfDJH32dm7I" +
  "p/UMd6shrOlicHkBOfe+0t3tkw3EHReQqZlyrTzkCogu2sN9HguXKildA+nZEOeWNUnZSzkrXe" +
  "9QTM1OdY/XHtJ9U6uQbelO/vj5rfd6xPtFtugZ7R5M5gY8qXz37nn8V8NWWIvqdLduXC7i1O0f" +
  "u/5r7gOZK1RTjWe8C7l0IKezuXRDoVdlvdiW4zj5sDzIvRQQ/Z7SvTp1+2g46754n/6OuWdN5H" +
  "JO/zY1C6vnTKK4b0tFpLS+Wk56Gvkch/E6yJJsVHG9uv6ztID0ynP3JDI34EWlnkV60Oibz2JD" +
  "ljZQ8bXxCW+Frv+vWxSQqW2p6b3omTuZ7T81+JntrT47vWUBKT1oS/1e3Ee5wlPaR6qIzC6fkb" +
  "6ndkw+vG7NmXOchlsqEHOPsb3ozTZcH9PbWSo2uV5d3N5ez0TP5RmfNb/k/bsnkLkBT0oaUf3M" +
  "hHgAXY33jrNYTlMcp87ccgdj1NInEs5tU3ZmVsXz0WNDU7tNyVDHsBhhqSHVF+znik3OX65wT0" +
  "14iDON1u6j0jRg3VCGxiw2lrHhS187rtr7Xdqo1mx7vO9BL9SYG+IpKS5FUij+A9+53qvuibZM" +
  "hU2yeYu9kalsTs9WORzeSj2EtQUkNzMLyVUGhLJ0Wu/pYTzHM9O0B5KeNSVTHrNjyOpgvZgWWX" +
  "ougx6LVz2a4SBuOYDVEFM8yy6eQeozQL1N1duTPNkuJzVUFrVfUEBOD0eamyQQpVfjbdhHH+M+" +
  "ql29dlz36rTmVWykRr2NBWB2LayahRrHzy82tFP7QA+lqiKZe4zt8GTC2oVJp/ZfnJKsson5DP" +
  "/WqxjXFNbwuiWzqjTnWz6OeOdc5gY8Kj2LPa0DlGno03FbPcUxSM+bH/4/mRpZIz1Ov2QZ7vBd" +
  "LZ+RFserx59WbM9cIUi9tB78a94fz7J77qPS94QiMTaaocF/H3sNPVldkl8uizjbKvZQ48KLmp" +
  "XS9bOa70yv/ehsws/we2s2cfuXZrf2M3YPLnMDXlW60Df3niWff49nPUu3/x63ZY2/rXJYm9WW" +
  "Wec+u8f31WZ5zwztnkzmBh5BLY1IWhhKav1+/dlrt2FNI9pje3rvky22p8c23SKv3g37FoVjy2" +
  "x6bn/vbdw9gMwNIDKAARiAAXGZgbkBRAYwAAMwIC4zMDeAyAAGYAAGxGUG5gYQGcAADMCAuMzA" +
  "3AAiAxiAARgQlxmYG0BkAAMwAAPiMgNzA4gMYAAGYEBcZmBuAJEBDMAADIjLDMwNIDKAARiAAX" +
  "GZgbkBRAYwAAMwIC4zMDeAyAAGYAAGxGUG5gYQGcAADMCAuMzA3AAiAxiAARgQlxmYG0BkAAMw" +
  "AAPiMgNzA4gMYAAGYEBcZmBuAJEBDMAADIjLDMwNIDKAARiAAXGZgbkBRAYwAAMwIC4zMDeAyA" +
  "AGYAAGxGUG5gYQGcAADMCAuMzA3AAiAxiAARgQlxmYG0BkAAMwAAPiMgNzA4gMYAAGYEBcZmBu" +
  "AJEBDMAADIjLDMwNIDKAARiAAXGZgbkBRAYwAAMwIC4zMDeAyAAGYAAGxGUG5gYQGcAADMCAuM" +
  "zA3AAiAxiAARgQlxmYG0BkAAMwAAPiMgNzA4gMYAAGYEBcZmBuAJEBDMAADIjLDMwNIDKAARiA" +
  "AXGZgbkBRAYwAAMwIC4zMDeAyAAGYAAGxGUG5gYQGcAADMCAuMzA3AAiAxiAARgQlxmYG0BkAA" +
  "MwAAPiMgNzA4gMYAAGYEBcZmBuAJEBDMAADIjLDMwNIDKAARiAAXGZgbkBRAYwAAMwIC4zMDeA" +
  "yAAGYAAGxGUG5gYQGcAADMCAuMzA3AAiAxiAARgQlxmYG0BkAAMwAAPiMgNzA4gMYAAGYEBcZm" +
  "BuAJEBDMAADIjLDMwNIDKAARiAAXGZgbkBRAYwAAMwIC4zMDeAyAAGYAAGxGUG5gYQGcAADMCA" +
  "uMzA3AAiAxiAARgQlxmYG0BkAAMwAAPiMgNzA4gMYAAGYEBcZmBuAJEBDMAADIjLDMwNIDKAAR" +
  "iAAXGZgbkBRAYwAAMwIC4zMDeAyAAGYAAGxGUG5gYQGcAADMCAuMzA3AAiAxiAARgQlxmYG0Bk" +
  "AAMwAAPiMgNzA4gMYAAGYEBcZmBuAJEBDMAADIjLDMwNIDKAARiAAXGZgbkBRAYwAAMwIC4zMD" +
  "eAyAAGYAAGxGUG5gYQGcAADMCAuMzA3AAiAxiAARgQlxmYG0BkAAMwAAPiMgNzA4gMYAAGYEBc" +
  "ZmBuAJEBDMAADIjLDMwNIDKAARiAAXGZgbkBRAYwAAMwIC4zMDeAyAAGYAAGxGUG5gYQGcAADM" +
  "CAuMzA3AAiAxiAARgQlxmYG0BkAAMwAAPiMgNzA4gMYAAGYEBcZmBuAJEBDMAADIjLDMwNIDKA" +
  "ARiAAXGZwf8B0q3aBnf/nMUAAAAASUVORK5CYII=";

export const LOGO_PNG_BUFFER = Buffer.from(LOGO_BASE64, "base64");
export const LOGO_ASPECT = 9000 / 4813; // lebar/tinggi sumber logo

export type WatermarkStyle = {
  /** Lebar logo relatif terhadap lebar gambar yang sudah di-resize. */
  tileRatio: number;
  /** Faktor spasi antar tile relatif terhadap ukuran logo. */
  gapFactor: number;
  /** Sudut skew diagonal derajat (negatif = miring ke kiri). */
  skewDeg: number;
  /** Opasitas logo (0-1). */
  opacity: number;
};

export const DEFAULT_WATERMARK_STYLE: WatermarkStyle = {
  tileRatio: 0.12,
  gapFactor: 1.2,
  skewDeg: -30,
  opacity: 0.45,
};

/**
 * Bangun overlay PNG berisi logo yang di-tile menyeluruh dan di-skew diagonal.
 *
 * Strategi raster (bukan SVG pattern, karena librsvg/sharp tidak selalu merender
 * <image> di dalam <pattern>):
 *   1. Resize logo ke tileW.
 *   2. Rotate logo sesuai skewDeg dengan background transparan.
 *   3. Tempelkan copy rotasi di grid regular yang melebihi batas gambar supaya
 *      sudut-sudut tetap tertutup.
 */
export async function buildTiledSkewedWatermarkOverlay(
  width: number,
  height: number,
  style: WatermarkStyle = DEFAULT_WATERMARK_STYLE,
): Promise<Buffer> {
  const rad = (Math.abs(style.skewDeg) * Math.PI) / 180;

  const tileW = Math.max(24, Math.round(width * style.tileRatio));
  const tileH = Math.max(12, Math.round(tileW / LOGO_ASPECT));
  const cell = Math.max(tileW + 8, Math.round(tileW * style.gapFactor));

  // Rotasi memperbesar bounding box; perlu margin ekstra agar sudut penuh.
  const bboxW = Math.ceil(tileW * Math.cos(rad) + tileH * Math.sin(rad));
  const bboxH = Math.ceil(tileW * Math.sin(rad) + tileH * Math.cos(rad));
  const margin = Math.max(bboxW, bboxH);

  // Resize logo dan terapkan opasitas via ensureAlpha + modulate brightness.
  const resizedLogo = await sharp(LOGO_PNG_BUFFER)
    .resize(tileW, tileH, { fit: "fill" })
    .ensureAlpha()
    .modulate({ brightness: 1 })
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Terapkan opacity manual ke channel alpha.
  applyOpacity(resizedLogo.data, style.opacity);
  const logoWithOpacity = await sharp(resizedLogo.data, {
    raw: {
      width: resizedLogo.info.width,
      height: resizedLogo.info.height,
      channels: 4,
    },
  })
    .png()
    .toBuffer();

  // Rotate logo dengan background transparan.
  const rotatedLogo = await sharp(logoWithOpacity)
    .rotate(style.skewDeg, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const rotMeta = await sharp(rotatedLogo).metadata();
  const rotW = rotMeta.width ?? bboxW;
  const rotH = rotMeta.height ?? bboxH;

  // Posisi grid: dimulai dari -margin agar area di luar batas juga tertutup.
  const composites: { input: Buffer; top: number; left: number }[] = [];
  const startX = -margin;
  const startY = -margin;
  const endX = width + margin;
  const endY = height + margin;

  const centerOffsetX = Math.round((cell - rotW) / 2);
  const centerOffsetY = Math.round((cell - rotH) / 2);

  for (let y = startY; y < endY; y += cell) {
    for (let x = startX; x < endX; x += cell) {
      composites.push({
        input: rotatedLogo,
        top: y + centerOffsetY,
        left: x + centerOffsetX,
      });
    }
  }

  // Buat canvas transparan dan composit semua logo.
  const overlay = await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(composites)
    .png()
    .toBuffer();

  return overlay;
}

/** Kurangi alpha setiap pixel sesuai opacity. */
function applyOpacity(data: Buffer, opacity: number): void {
  const factor = Math.max(0, Math.min(1, opacity));
  for (let i = 3; i < data.length; i += 4) {
    const alpha = data[i] ?? 255;
    data[i] = Math.round(alpha * factor);
  }
}
