import { describe, expect, it } from 'vitest';
import {
  ROOM_PALETTES,
  TRACK_PALETTES,
  type SwatchPalette,
} from '../src/utils/cyc.js';

function hexToRgb(hex: string): [number, number, number] {
  const n = hex.replace('#', '');
  return [0, 1, 2].map((i) => parseInt(n.slice(i * 2, i * 2 + 2), 16)) as [
    number,
    number,
    number,
  ];
}

function linearize(channel: number): number {
  const value = channel / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

function contrast(foreground: string, background: string): number {
  const high = Math.max(luminance(foreground), luminance(background));
  const low = Math.min(luminance(foreground), luminance(background));
  return (high + 0.05) / (low + 0.05);
}

function mix(hex: string, toward: string, amount: number): string {
  const from = hexToRgb(hex);
  const to = hexToRgb(toward);
  return `#${from
    .map((channel, index) =>
      Math.round(channel + (to[index] - channel) * amount)
        .toString(16)
        .padStart(2, '0')
    )
    .join('')}`;
}

function chipBackground(swatch: string, paper: string): string {
  return mix(paper, swatch, 0.08);
}

const palettes: SwatchPalette[] = [
  ...Object.values(TRACK_PALETTES),
  ...Object.values(ROOM_PALETTES),
];

describe('track and room palettes', () => {
  it('keeps label text at 4.5:1 on tinted chips in both themes', () => {
    for (const palette of palettes) {
      expect(
        contrast(palette.onLight, chipBackground(palette.swatch, '#ffffff'))
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        contrast(palette.onDark, chipBackground(palette.swatch, '#0a2345'))
      ).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('keeps room labels at 4.5:1 on paper in both themes', () => {
    for (const palette of Object.values(ROOM_PALETTES)) {
      expect(contrast(palette.onLight, '#ffffff')).toBeGreaterThanOrEqual(4.5);
      expect(contrast(palette.onDark, '#0a2345')).toBeGreaterThanOrEqual(4.5);
    }
  });
});
