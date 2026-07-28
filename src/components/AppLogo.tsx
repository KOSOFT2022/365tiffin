import React from 'react';

interface AppLogoProps {
  size?: number;
  className?: string;
  glow?: boolean;
}

export const AppLogo: React.FC<AppLogoProps> = ({ size = 40, className = '', glow = false }) => {
  return (
    <div 
      id="tiffingo-app-logo"
      className={`relative flex items-center justify-center overflow-hidden rounded-[24%] bg-[#00c27a] text-white select-none shrink-0 transition-all ${
        glow ? 'shadow-lg shadow-emerald-500/30' : 'shadow-sm'
      } ${className}`}
      style={{ width: size, height: size }}
    >
      {/* High-precision SVG storefront matching the uploaded logo exactly */}
      <svg 
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2.1" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className="w-[62%] h-[62%] text-white"
      >
        {/* Awning/Canopy Roof */}
        <path d="M3 9.5 C 4.5 12.5, 7.5 12.5, 9 9.5 C 10.5 12.5, 13.5 12.5, 15 9.5 C 16.5 12.5, 19.5 12.5, 21 9.5 C 21.5 9, 21.5 8, 20.5 7 L 17.5 4.5 C 16.8 3.8, 15.8 3.5, 14.8 3.5 L 9.2 3.5 C 8.2 3.5, 7.2 3.8, 6.5 4.5 L 3.5 7 C 2.5 8, 2.5 9, 3 9.5 Z" />
        {/* Building Walls */}
        <path d="M5 11 v 8.5 c 0 1.2, 0.8 2, 2 2 h 10 c 1.2 0, 2 -0.8, 2 -2 v -8.5" />
        {/* Door */}
        <path d="M10 21.5 v -3.5 c 0 -1, 0.8 -1.8, 1.8 -1.8 h 0.4 c 1 0, 1.8 0.8, 1.8 1.8 v 3.5" />
      </svg>
    </div>
  );
};
