import type { FC, ReactNode, CSSProperties } from 'react'
import theme from '../../config/theme'
import Navbar from './Navbar'

type BasicBackgroundProps = {
  children?: ReactNode
  className?: string
  style?: CSSProperties
}



export const BasicBackground: FC<BasicBackgroundProps> = ({ children, style }) => {
  const basicStyle: CSSProperties = {
    minHeight: '100vh',
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    background: theme.colors.background,
    ...style,
  }
  const contentStyle: CSSProperties = {
    position: 'relative',
    right: 0,
    top: 0,
    marginLeft: '16px',
    flexGrow: 1,
    padding: '20px',
    height: '100%',
  }

  return (
    <div id="myBG" style={basicStyle}>
      <div className="app-sidebar">
        <Navbar selected={1} />
      </div>
      <div style={contentStyle} >
        {children}
      </div>
    </div>
  )
}
