import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, G } from 'react-native-svg';

// Heart path (scaled to fit in ~12x12 box centered at origin)
const HEART_PATH = "M0,-3 C-1.5,-5.5 -5,-5.5 -5,-2 C-5,1 0,4.5 0,4.5 C0,4.5 5,1 5,-2 C5,-5.5 1.5,-5.5 0,-3 Z";

export default function CloudBottom({ height = 140, color = '#EAF2FF', bottomOffset = 0, style }) {
  const baseOpacity = style?.opacity ?? 1;
  
  // Heart positions: [x, y, scale, opacity multiplier]
  const hearts = [
    // Top row - floating high
    [20, 6, 0.55, 0.22],
    [55, 10, 0.7, 0.28],
    [95, 4, 0.5, 0.2],
    [140, 8, 0.65, 0.25],
    [185, 3, 0.6, 0.22],
    [230, 7, 0.8, 0.32],
    [275, 5, 0.55, 0.2],
    [315, 9, 0.7, 0.28],
    [360, 6, 0.6, 0.24],
    [395, 10, 0.5, 0.2],
    // Middle row
    [35, 18, 0.75, 0.3],
    [75, 22, 0.5, 0.22],
    [115, 16, 0.65, 0.26],
    [160, 20, 0.55, 0.22],
    [200, 15, 0.85, 0.35],
    [245, 22, 0.6, 0.25],
    [290, 17, 0.7, 0.28],
    [335, 21, 0.55, 0.22],
    [380, 18, 0.65, 0.26],
    // Lower row - near clouds
    [25, 32, 0.45, 0.18],
    [70, 36, 0.55, 0.2],
    [120, 34, 0.5, 0.18],
    [170, 38, 0.6, 0.22],
    [220, 33, 0.5, 0.18],
    [265, 37, 0.55, 0.2],
    [310, 35, 0.45, 0.16],
    [355, 38, 0.5, 0.18],
    [400, 34, 0.55, 0.2],
  ];
  
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        bottom: bottomOffset,
        left: 0,
        right: 0,
        height,
        zIndex: 10,
        elevation: 10,
        ...style,
        opacity: undefined,
      }}
    >
      <Svg width="100%" height="100%" viewBox="0 0 400 140" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="cloudGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={color} stopOpacity={0.15 * baseOpacity} />
            <Stop offset="50%" stopColor={color} stopOpacity={0.5 * baseOpacity} />
            <Stop offset="100%" stopColor={color} stopOpacity={0.8 * baseOpacity} />
          </LinearGradient>
        </Defs>

        {/* Floating heart bits above the clouds */}
        <G>
          {hearts.map(([x, y, scale, opacityMult], i) => (
            <Path
              key={i}
              d={HEART_PATH}
              fill={color}
              opacity={opacityMult * baseOpacity}
              transform={`translate(${x}, ${y}) scale(${scale})`}
            />
          ))}
        </G>

        {/* Single unified cloud shape - no overlapping layers */}
        <Path
          d="M-20,60
             Q10,35 50,50
             Q90,68 130,45
             Q170,22 220,42
             Q270,62 310,38
             Q350,18 390,45
             Q410,55 420,50
             L420,140 L-20,140 Z"
          fill="url(#cloudGradient)"
        />

        {/* Foreground puffs - only the curved tops, no bottom fill */}
        <Path
          d="M-10,95
             Q25,72 60,85
             Q95,100 130,82
             Q160,66 200,80
             Q240,96 280,78
             Q320,60 360,78
             Q395,92 420,80
             L420,140 L-20,140 Z"
          fill={color}
          opacity={0.6 * baseOpacity}
        />

        {/* Bottom edge detail - smooth finish */}
        <Path
          d="M-10,115
             Q40,102 90,112
             Q140,124 190,108
             Q240,95 290,110
             Q340,125 390,108
             Q410,102 420,108
             L420,140 L-20,140 Z"
          fill={color}
          opacity={0.75 * baseOpacity}
        />

        {/* Highlight wisps */}
        <Path
          d="M40,55 Q70,42 100,52"
          fill="none"
          stroke={color}
          strokeWidth="2"
          opacity={0.25 * baseOpacity}
          strokeLinecap="round"
        />
        <Path
          d="M180,48 Q220,35 260,48"
          fill="none"
          stroke={color}
          strokeWidth="2"
          opacity={0.2 * baseOpacity}
          strokeLinecap="round"
        />
        <Path
          d="M320,52 Q355,40 385,52"
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          opacity={0.22 * baseOpacity}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}


