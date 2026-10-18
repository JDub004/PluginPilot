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

type Core2 = Core & {
  scanLook(p: Uint8ClampedArray): Uint8ClampedArray;
  fitPlan(i: { kind: string; bytes: number }[], t: { maxMb: number; format: string; single: boolean }): { steps: string[]; output: string; files: number };
  TARGETS: { name: string; source: string; confidence: string; checked: string }[];
};
const D2 = DR as Core2;
const MB = 1024 * 1024;

describe('Datei-Rad: PDFs and "Passend machen"', () => {
  it('detects PDFs', () => expect(DR.kind({ name: 'x.PDF', type: '' })).toBe('pdf'));
  it('plans merge + shrink for 23 photos into one PDF under 10 MB', () => {
    const photos = Array.from({ length: 23 }, () => ({ kind: 'image', bytes: 3 * MB }));
    expect(D2.fitPlan(photos, { maxMb: 10, format: 'pdf', single: true })).toEqual({ steps: ['merge', 'shrink'], output: 'pdf', files: 1 });
  });
  it('does nothing for a PDF that already fits', () => {
    expect(D2.fitPlan([{ kind: 'pdf', bytes: 2 * MB }], { maxMb: 5, format: 'pdf', single: true }).steps).toEqual([]);
  });
  it('converts images separately when several files are allowed', () => {
    expect(D2.fitPlan([{ kind: 'image', bytes: MB }, { kind: 'image', bytes: 8 * MB }], { maxMb: 2, format: 'jpg', single: false })).toEqual({ steps: ['shrink', 'convert'], output: 'jpg', files: 2 });
  });
  it('turns paper grey into white and ink into black', () => {
    const px = new Uint8ClampedArray(4 * 100);
    for (let i = 0; i < 100; i++) { const v = i < 10 ? 60 : 190; px.set([v, v, v, 255], i * 4); }
    D2.scanLook(px);
    expect(px[0]).toBe(0);
    expect(px[50 * 4]).toBe(255);
  });
  it('regression: noisy grey paper becomes white, not speckled', () => {
    const px = new Uint8ClampedArray(4 * 1000);
    for (let i = 0; i < 1000; i++) { const v = i < 50 ? 50 : 180 + (i * 7919 % 41); px.set([v, v, v, 255], i * 4); }
    D2.scanLook(px);
    let white = 0; for (let i = 50; i < 1000; i++) if (px[i * 4]! >= 230) white++;
    expect(white / 950).toBeGreaterThan(0.97);
    expect(px[0]).toBe(0);
  });
  it('every upload target has a source, confidence and check date (no guarantees)', () => {
    for (const t of D2.TARGETS) { expect(t.source).toMatch(/^https:\/\//); expect(t.confidence).toBeTruthy(); expect(t.checked).toMatch(/^\d{4}-\d\d-\d\d$/); }
  });
});
