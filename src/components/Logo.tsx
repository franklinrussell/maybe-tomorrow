import React from 'react';

export default function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="18" fill="#FFE500"/>
      <line x1="22" y1="50" x2="70" y2="50" stroke="#1a1a1a" strokeWidth="10" strokeLinecap="square"/>
      <polyline points="54,31 74,50 54,69" fill="none" stroke="#1a1a1a" strokeWidth="10" strokeLinecap="square" strokeLinejoin="miter"/>
    </svg>
  );
}
