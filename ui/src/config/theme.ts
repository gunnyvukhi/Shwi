import type { CSSProperties } from 'react';

export const theme = {
	// Base Brand Colors (Used across Login, Register, Forgot/Reset Password)
	colors: {
		primary: '#38bdf8',
		secondary: '#262626',
		success: '#16a34a',
		warning: '#f59e0b',
		error: '#d4183d',
		background: '#0d0d0d',
		text: '#f5f5f5',
		text2: '#a3a3a3',
		whiteText: '#fff',
		title: '#f5f5f5',
		inputbg: '#262626'
	},

	// Accent & Status Palette for Charts, Icons, Markers
	accents: {
		rose: '#f43f5e',
		roseBg: 'rgba(244, 63, 94, 0.12)',
		indigo: '#818cf8',
		indigoBg: 'rgba(129, 140, 248, 0.12)',
		sky: '#38bdf8',
		skyBg: 'rgba(56, 189, 248, 0.12)',
		orange: '#f97316',
		orangeBg: 'rgba(249, 115, 22, 0.12)',
		emerald: '#10b981',
		emeraldBg: 'rgba(16, 185, 129, 0.12)',
		amber: '#f59e0b',
		amberBg: 'rgba(245, 158, 11, 0.12)'
	},

	// Dashboard & App Dark Mode Theme
	dark: {
		bgMain: '#0a0a0f',
		bgCard: 'rgba(20,20,30,0.65)',
		bgCardSolid: '#14141e',
		textMain: '#fafafa',
		textMuted: '#a1a1aa',
		borderColor: '#27272a',
		primary: '#38bdf8',
		primaryHover: '#7dd3fc',
		navBg: 'rgba(10,10,15,0.88)',
		gridLine: '#27272a',
		chartText: '#71717a',
		svgStroke: '#27272a',
		danger: '#f87171',
		cardShadow: '0 10px 30px -8px rgba(0, 0, 0, 0.5)',
		accentGlow: 'rgba(56, 189, 248, 0.12)',
		bgDepth1: 'rgba(255, 255, 255, 0.03)',
	},

	// Dashboard & App Light Mode Theme
	light: {
		bgMain: '#f0f4f8',
		bgCard: 'rgba(255, 255, 255, 0.92)',
		bgCardSolid: '#ffffff',
		textMain: '#0f172a',
		textMuted: '#475569',
		borderColor: '#cbd5e1',
		primary: '#0284c7',
		primaryHover: '#0369a1',
		navBg: 'rgba(241, 245, 249, 0.92)',
		gridLine: '#cbd5e1',
		chartText: '#64748b',
		svgStroke: '#94a3b8',
		danger: '#dc2626',
		cardShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.08), 0 2px 6px -1px rgba(15, 23, 42, 0.04)',
		accentGlow: 'rgba(2, 132, 199, 0.08)',
		bgDepth1: 'rgba(15, 23, 42, 0.03)',
	}
} as const;

export function getThemeStyles(isDark: boolean): CSSProperties {
	const currentTheme = isDark ? theme.dark : theme.light;
	return {
		'--bg-main': currentTheme.bgMain,
		'--bg-card': currentTheme.bgCard,
		'--bg-card-solid': currentTheme.bgCardSolid,
		'--text-main': currentTheme.textMain,
		'--text-muted': currentTheme.textMuted,
		'--border-color': currentTheme.borderColor,
		'--primary': currentTheme.primary,
		'--primary-hover': currentTheme.primaryHover,
		'--nav-bg': currentTheme.navBg,
		'--grid-line': currentTheme.gridLine,
		'--chart-text': currentTheme.chartText,
		'--svg-stroke': currentTheme.svgStroke,
		'--danger': currentTheme.danger,
		'--card-shadow': currentTheme.cardShadow,
		'--accent-glow': currentTheme.accentGlow,
		'--bg-depth-1': currentTheme.bgDepth1,
	} as CSSProperties;
}

export type Theme = typeof theme;
export type ColorPalette = typeof theme.colors;
export type AccentPalette = typeof theme.accents;
export type ThemeMode = 'dark' | 'light';

export default theme;
