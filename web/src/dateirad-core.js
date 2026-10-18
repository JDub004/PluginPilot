// Datei-Rad core: pure helpers (no DOM). Inlined into dateirad.html; tested in tests/unit/dateirad.test.ts.
var DR = (function () {
  var enc = new TextEncoder();
  var CRC = (function () { var t = new Uint32Array(256); for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(b) { var c = 0xffffffff; for (var i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
  function concat(parts) { var n = 0, i; for (i = 0; i < parts.length; i++) n += parts[i].length; var o = new Uint8Array(n), p = 0; for (i = 0; i < parts.length; i++) { o.set(parts[i], p); p += parts[i].length; } return o; }

  /** ZIP without compression (store). files: [{name, data: Uint8Array}] */
  function zip(files) {
    var local = [], central = [], off = 0;
    files.forEach(function (f) {
      var name = enc.encode(f.name), crc = crc32(f.data), size = f.data.length;
      var h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true);
      h.setUint32(14, crc, true); h.setUint32(18, size, true); h.setUint32(22, size, true); h.setUint16(26, name.length, true);
      local.push(new Uint8Array(h.buffer), name, f.data);
      var c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true);
      c.setUint32(16, crc, true); c.setUint32(20, size, true); c.setUint32(24, size, true); c.setUint16(28, name.length, true); c.setUint32(42, off, true);
      central.push(new Uint8Array(c.buffer), name);
      off += 30 + name.length + size;
    });
    var cd = concat(central), e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, cd.length, true); e.setUint32(16, off, true);
    return concat(local.concat([cd, new Uint8Array(e.buffer)]));
  }

  /** PDF with one JPEG per page. pages: [{jpeg: Uint8Array, w, h}] (pixels; page fitted to A4 portrait/landscape). */
  function pdf(pages) {
    var parts = [], offs = [], pos = 0;
    function add(x) { var b = typeof x === 'string' ? enc.encode(x) : x; parts.push(b); pos += b.length; }
    function obj(n, body, stream) { offs[n] = pos; add(n + ' 0 obj\n' + body); if (stream) { add('\nstream\n'); add(stream); add('\nendstream'); } add('\nendobj\n'); }
    add('%PDF-1.4\n%\xe2\xe3\xcf\xd3\n');
    var kids = pages.map(function (_, i) { return (3 + i * 3) + ' 0 R'; }).join(' ');
    obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
    obj(2, '<< /Type /Pages /Kids [' + kids + '] /Count ' + pages.length + ' >>');
    pages.forEach(function (p, i) {
      var n = 3 + i * 3, land = p.w > p.h, W = land ? 842 : 595, H = land ? 595 : 842, m = 28;
      var s = Math.min((W - 2 * m) / p.w, (H - 2 * m) / p.h), dw = +(p.w * s).toFixed(2), dh = +(p.h * s).toFixed(2);
      var cs = 'q ' + dw + ' 0 0 ' + dh + ' ' + ((W - dw) / 2).toFixed(2) + ' ' + ((H - dh) / 2).toFixed(2) + ' cm /Im0 Do Q';
      obj(n, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + W + ' ' + H + '] /Resources << /XObject << /Im0 ' + (n + 1) + ' 0 R >> >> /Contents ' + (n + 2) + ' 0 R >>');
      obj(n + 1, '<< /Type /XObject /Subtype /Image /Width ' + p.w + ' /Height ' + p.h + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + p.jpeg.length + ' >>', p.jpeg);
      obj(n + 2, '<< /Length ' + cs.length + ' >>', enc.encode(cs));
    });
    var count = 3 + pages.length * 3, x = pos, xref = 'xref\n0 ' + count + '\n0000000000 65535 f \n';
    for (var i = 1; i < count; i++) xref += String(offs[i]).padStart(10, '0') + ' 00000 n \n';
    add(xref + 'trailer\n<< /Size ' + count + ' /Root 1 0 R >>\nstartxref\n' + x + '\n%%EOF\n');
    return concat(parts);
  }

  /** CSV (comma or semicolon, quotes) -> array of objects. */
  function parseCsv(text) {
    text = text.replace(/^﻿/, '');
    var first = text.split(/\r?\n/)[0] || '', sep = (first.match(/;/g) || []).length > (first.match(/,/g) || []).length ? ';' : first.indexOf('\t') >= 0 && first.indexOf(',') < 0 ? '\t' : ',';
    var rows = [], row = [], cell = '', q = false;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (q) { if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch; }
      else if (ch === '"') q = true;
      else if (ch === sep) { row.push(cell); cell = ''; }
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
      else cell += ch;
    }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
    rows = rows.filter(function (r) { return r.some(function (c) { return c !== ''; }); });
    var head = rows.shift() || [];
    return rows.map(function (r) { var o = {}; head.forEach(function (h, j) { o[h] = r[j] === undefined ? '' : r[j]; }); return o; });
  }
  /** Array of flat objects -> CSV (semicolon, Excel-DE friendly). */
  function toCsv(list, sep) {
    sep = sep || ';';
    if (!Array.isArray(list)) list = [list];
    var head = []; list.forEach(function (o) { Object.keys(o || {}).forEach(function (k) { if (head.indexOf(k) < 0) head.push(k); }); });
    function cell(v) { var s = v === null || v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v); return /[";\n\r,]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
    return [head.map(cell).join(sep)].concat(list.map(function (o) { return head.map(function (h) { return cell((o || {})[h]); }).join(sep); })).join('\r\n') + '\r\n';
  }

  /** Crop rectangle for an aspect preset, centred, in source pixels. */
  function cropFor(w, h, ratio) {
    if (!ratio) return { x: 0, y: 0, w: w, h: h };
    var cw = w, ch = Math.round(w / ratio);
    if (ch > h) { ch = h; cw = Math.round(h * ratio); }
    return { x: Math.round((w - cw) / 2), y: Math.round((h - ch) / 2), w: cw, h: ch };
  }
  /** New output name: "Urlaub.HEIC" + "jpg" -> "Urlaub.jpg"; avoids duplicates. */
  function outName(name, ext, taken) {
    var base = String(name).replace(/\.[^.]+$/, '').replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').slice(0, 80) || 'datei', n = base + '.' + ext, i = 2;
    while (taken && taken[n]) n = base + '-' + i++ + '.' + ext;
    if (taken) taken[n] = 1;
    return n;
  }
  function kind(file) {
    var t = (file.type || '').toLowerCase(), n = (file.name || '').toLowerCase();
    if (/^image\/(png|jpe?g|webp|gif|bmp|svg\+xml|avif)$/.test(t) || /\.(png|jpe?g|webp|gif|bmp|svg|avif)$/.test(n)) return 'image';
    if (/\.(heic|heif)$/.test(n) || /heic|heif/.test(t)) return 'heic';
    if (/\.csv$/.test(n) || t === 'text/csv') return 'csv';
    if (/\.json$/.test(n) || t === 'application/json') return 'json';
    if (/\.(txt|md)$/.test(n) || t === 'text/plain') return 'text';
    return 'other';
  }
  function size(b) { return b < 1024 ? b + ' B' : b < 1048576 ? (b / 1024).toFixed(0) + ' KB' : (b / 1048576).toFixed(1).replace('.', ',') + ' MB'; }
  return { crc32: crc32, zip: zip, pdf: pdf, parseCsv: parseCsv, toCsv: toCsv, cropFor: cropFor, outName: outName, kind: kind, size: size };
})();
