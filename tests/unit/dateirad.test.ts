import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

type Core = {
  crc32(b: Uint8Array): number; zip(f: { name: string; data: Uint8Array }[]): Uint8Array; pdf(p: { jpeg: Uint8Array; w: number; h: number }[]): Uint8Array;
  parseCsv(t: string): Record<string, string>[]; toCsv(l: unknown[]): string; cropFor(w: number, h: number, r: number | null): { x: number; y: number; w: number; h: number };
  outName(n: string, e: string, t?: Record<string, number>): string; kind(f: { name: string; type: string }): string;
};
const DR = new Function(readFileSync(new URL('../../web/src/dateirad-core.js', import.meta.url), 'utf8') + ';return DR')() as Core;
const enc = new TextEncoder();

describe('Datei-Rad core', () => {
  it('computes the standard CRC32', () => {
    expect(DR.crc32(enc.encode('123456789'))).toBe(0xcbf43926);
  });
  it('writes a ZIP with valid headers, sizes and offsets', () => {
    const z = DR.zip([{ name: 'a.txt', data: enc.encode('hallo') }, { name: 'ü.txt', data: enc.encode('welt!') }]);
    const v = new DataView(z.buffer);
    expect(v.getUint32(0, true)).toBe(0x04034b50);
    const end = z.length - 22;
    expect(v.getUint32(end, true)).toBe(0x06054b50);
    expect(v.getUint16(end + 10, true)).toBe(2);
    const cdOff = v.getUint32(end + 16, true);
    expect(v.getUint32(cdOff, true)).toBe(0x02014b50);
    const second = v.getUint32(cdOff + 46 + 5 + 42, true);
    expect(new TextDecoder().decode(z.slice(second + 30 + 6, second + 30 + 6 + 5))).toBe('welt!');
  });
  it('writes a PDF whose xref offsets point at the objects', () => {
    const p = DR.pdf([{ jpeg: new Uint8Array([0xff, 0xd8, 0xff, 0xd9]), w: 400, h: 300 }, { jpeg: new Uint8Array([0xff, 0xd8, 0xff, 0xd9]), w: 300, h: 400 }]);
    const s = Buffer.from(p).toString('latin1');
    expect(s.startsWith('%PDF-1.4')).toBe(true);
    expect(s).toContain('/Count 2');
    expect(s).toContain('/MediaBox [0 0 842 595]');
    const xref = +s.match(/startxref\n(\d+)/)![1]!;
    expect(s.slice(xref, xref + 4)).toBe('xref');
    const offs = s.slice(xref).split('\n').slice(3, 10).map((l) => +l.slice(0, 10));
    offs.forEach((o, i) => expect(s.slice(o).startsWith(`${i + 1} 0 obj`)).toBe(true));
  });
  it('parses German Excel CSV and writes it back', () => {
    const rows = DR.parseCsv('﻿Name;Preis;Notiz\r\nKaffee;3,50;"mit ""Milch""; heiß"\r\n\r\nTee;2;\r\n');
    expect(rows).toEqual([{ Name: 'Kaffee', Preis: '3,50', Notiz: 'mit "Milch"; heiß' }, { Name: 'Tee', Preis: '2', Notiz: '' }]);
    expect(DR.parseCsv(DR.toCsv(rows))).toEqual(rows);
    expect(DR.parseCsv('a,b\n1,2')).toEqual([{ a: '1', b: '2' }]);
  });
  it('centres crop presets, names outputs safely and detects kinds', () => {
    expect(DR.cropFor(1600, 900, 1)).toEqual({ x: 350, y: 0, w: 900, h: 900 });
    expect(DR.cropFor(1000, 1000, 16 / 9)).toEqual({ x: 0, y: 219, w: 1000, h: 563 });
    const t = {};
    expect([DR.outName('Urlaub.HEIC', 'jpg', t), DR.outName('Urlaub.png', 'jpg', t), DR.outName('../a:b.png', 'pdf')]).toEqual(['Urlaub.jpg', 'Urlaub-2.jpg', '.._a_b.pdf']);
    expect(['x.PNG', 'y.heic', 'z.csv', 'q.exe'].map((n) => DR.kind({ name: n, type: '' }))).toEqual(['image', 'heic', 'csv', 'other']);
  });
});
