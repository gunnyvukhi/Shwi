import React, { forwardRef } from 'react';

type MultiLineItem = { text?: React.ReactNode; color?: string };

type TitleProps = React.HTMLAttributes<HTMLHeadingElement> & {
	content?: React.ReactNode;
	multiLine?: Array<MultiLineItem>;
	fontSize?: string;
	lineHeight?: number;
	tcolor?: string;
	ml?: string;
	mr?: string;
	mt?: string;
	mb?: string;
};

const Title = forwardRef<HTMLHeadingElement, TitleProps>(function Title(
	{ style, fontSize, lineHeight, tcolor, ml, mr, mt, mb, content, multiLine = [] },
	ref,
) {
	const mergedStyle: React.CSSProperties = {
		whiteSpace: 'pre-wrap',
		fontFamily: "'Barlow Condensed', sans-serif",
		fontWeight: '800',
		...(fontSize ? { fontSize } : { fontSize: 'clamp(2.5rem, 5vw, 4rem)' }),
		...(lineHeight ? { lineHeight } : { lineHeight: 1.05 }),
		...(tcolor ? { color: tcolor } : { color: '#fff' }),
		letterSpacing: '-0.01em',
		...(ml ? { marginLeft: ml } : {}),
		...(mr ? { marginRight: mr } : {}),
		...(mt ? { marginTop: mt } : {}),
		...(mb ? { marginBottom: mb } : {}),
		...style,
	};
	return (
		<h1 ref={ref} style={mergedStyle}>
			{multiLine && multiLine.length > 0 ? (
				<>
					{multiLine.map((title, i) => (
						<React.Fragment key={i}>
							<span style={title.color ? { color: title.color } : undefined}>
								{title.text}
							</span>
							<br />
						</React.Fragment>
					))}
				</>
			) : (
				content
			)}
		</h1>
	);
	});

export default Title;
