import React from "react";
import theme from "../../../config/theme";

type Stat = {
  value: string;
  label: string;
};

const defaultStats: Stat[] = [
  { value: "2.4M+", label: "Active athletes" },
  { value: "180+", label: "Workout programs" },
  { value: "98%", label: "Member satisfaction" },
];

const containerStyle: React.CSSProperties = {
  display: "flex",
  gap: "2rem",
  marginTop: "2.5rem"
};

const valueStyle: React.CSSProperties = {
  fontFamily: "'Barlow Condensed', sans-serif",
  fontSize: "2rem",
  fontWeight: 700,
  lineHeight: 1.1,
  color: theme.colors.title
};

const labelStyle: React.CSSProperties = {
  fontSize: "1rem",
  color: "#94a3b8",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: '0.1em',
};

export interface StatsBoxProps {
  stats?: Stat[];
  className?: string;
}

const StatsBox: React.FC<StatsBoxProps> = ({ stats = defaultStats }) => {
  return (
    <div style={containerStyle}>
      {stats.map((stat) => (
        <div key={stat.label}>
          <div style={valueStyle}>
            {stat.value}
          </div>
          <div style={labelStyle}>
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsBox;
