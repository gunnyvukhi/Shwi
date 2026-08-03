export const theme = {
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
} as const;

export type Theme = typeof theme;

export default theme;
