import { ColorPalette } from '../types/data';

export const PALETTES: Record<ColorPalette, { name: string; colors: string[]; primary: string; secondary: string }> = {
  indigo: {
    name: 'Electric Indigo',
    colors: ['#4f46e5', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#3730a3', '#312e81'],
    primary: '#4f46e5',
    secondary: '#818cf8',
  },
  emerald: {
    name: 'Forest Emerald',
    colors: ['#059669', '#10b981', '#34d399', '#6ee7b7', '#047857', '#065f46', '#a7f3d0'],
    primary: '#059669',
    secondary: '#34d399',
  },
  blue: {
    name: 'Cobalt Ocean',
    colors: ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#1d4ed8', '#1e40af', '#bfdbfe'],
    primary: '#2563eb',
    secondary: '#60a5fa',
  },
  amber: {
    name: 'Golden Amber',
    colors: ['#d97706', '#f59e0b', '#fbbf24', '#fcd34d', '#b45309', '#92400e', '#fde68a'],
    primary: '#d97706',
    secondary: '#fbbf24',
  },
  sunset: {
    name: 'Sunset Crimson',
    colors: ['#e11d48', '#f43f5e', '#fb7185', '#ea580c', '#f97316', '#fb923c', '#be123c'],
    primary: '#e11d48',
    secondary: '#fb7185',
  },
  purple: {
    name: 'Royal Purple',
    colors: ['#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd', '#6d28d9', '#5b21b6', '#ddd6fe'],
    primary: '#7c3aed',
    secondary: '#a78bfa',
  },
  slate: {
    name: 'Monochrome Slate',
    colors: ['#334155', '#475569', '#64748b', '#94a3b8', '#1e293b', '#0f172a', '#cbd5e1'],
    primary: '#334155',
    secondary: '#64748b',
  },
};

export function getPaletteColor(palette: ColorPalette, index: number): string {
  const p = PALETTES[palette] || PALETTES.indigo;
  return p.colors[index % p.colors.length];
}
