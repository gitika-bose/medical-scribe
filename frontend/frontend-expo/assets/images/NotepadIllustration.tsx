import React from 'react';
import Svg, { Circle, Rect, Line, Path, G, Polygon } from 'react-native-svg';

interface NotepadIllustrationProps {
  width?: number;
  height?: number;
}

export default function NotepadIllustration({ width = 256, height = 256 }: NotepadIllustrationProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 200 200" fill="none">
      {/* Soft background circle */}
      <Circle cx={100} cy={100} r={85} fill="#f0f4f8" />

      {/* Notepad/paper */}
      <Rect x={60} y={45} width={80} height={110} rx={4} fill="white" stroke="#e2e8f0" strokeWidth={2} />

      {/* Spiral binding holes */}
      <Circle cx={70} cy={50} r={2.5} fill="#cbd5e1" />
      <Circle cx={85} cy={50} r={2.5} fill="#cbd5e1" />
      <Circle cx={100} cy={50} r={2.5} fill="#cbd5e1" />
      <Circle cx={115} cy={50} r={2.5} fill="#cbd5e1" />
      <Circle cx={130} cy={50} r={2.5} fill="#cbd5e1" />

      {/* Note lines */}
      <Line x1={70} y1={70} x2={110} y2={70} stroke="#94a3b8" strokeWidth={2} strokeLinecap="round" />
      <Line x1={70} y1={85} x2={125} y2={85} stroke="#94a3b8" strokeWidth={2} strokeLinecap="round" />
      <Line x1={70} y1={100} x2={105} y2={100} stroke="#94a3b8" strokeWidth={2} strokeLinecap="round" />

      {/* Checkmarks */}
      <Path d="M 68 115 L 72 119 L 78 111" stroke="#10b981" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M 68 130 L 72 134 L 78 126" stroke="#10b981" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />

      {/* Pencil */}
      <G transform="translate(115, 120) rotate(-45)">
        <Rect x={0} y={0} width={8} height={35} rx={1} fill="#fbbf24" />
        <Polygon points="0,35 4,42 8,35" fill="#f59e0b" />
        <Rect x={0} y={0} width={8} height={6} fill="#fef3c7" />
      </G>

      {/* Small heart accent */}
      <Path
        d="M 125 65 C 125 63, 127 61, 129 61 C 130 61, 131 62, 131 63 C 131 62, 132 61, 133 61 C 135 61, 137 63, 137 65 C 137 68, 131 72, 131 72 C 131 72, 125 68, 125 65 Z"
        fill="#f472b6"
        opacity={0.6}
      />
    </Svg>
  );
}
