import React, { forwardRef } from 'react';
import theme from '../../../config/theme';

type MultiLineItem = { text?: React.ReactNode; color?: string };

type DescriptionProps = React.HTMLAttributes<HTMLHeadingElement> & {
    content?: React.ReactNode;
    multiLine?: Array<MultiLineItem>;
    fontSize?: string;
    lineHeight?: number;
    tcolor?: string;
    ml?: string;
    mr?: string;
    mt?: string;
    mb?: string;
    mw?: string;
};

const Description = forwardRef<HTMLHeadingElement, DescriptionProps>(function Description(
    { style, fontSize, lineHeight, tcolor, ml, mr, mt, mb, mw, content, multiLine = [] },
    ref,
) {
    const mergedStyle: React.CSSProperties = {
        whiteSpace: 'pre-wrap',
        ...(fontSize ? { fontSize } : { fontSize: '1rem' }),
        ...(lineHeight ? { lineHeight } : { lineHeight: 1.65 }),
        ...(tcolor ? { color: tcolor } : { color: theme.colors.text2 }),
        ...(ml ? { marginLeft: ml } : {}),
        ...(mr ? { marginRight: mr } : {}),
        ...(mt ? { marginTop: mt } : {}),
        ...(mb ? { marginBottom: mb } : {}),
        ...(mw ? { maxWidth: mw } : {}),
        ...style,
    };
    return (
        <p ref={ref} style={mergedStyle}>
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
        </p>
    );
    });

export default Description;
