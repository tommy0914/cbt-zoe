import React from 'react'

export default function YoungEmeritusLogo({ size = 40 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
    >
      <title>YoungEmeritus Logo</title>
      <defs>
        <linearGradient id="yeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d946ef" />
          <stop offset="50%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      
      {/* Circuit/Node Design */}
      <circle cx="50" cy="50" r="45" stroke="url(#yeGradient)" strokeWidth="2" fill="none" opacity="0.3" />
      
      {/* Center circle */}
      <circle cx="50" cy="50" r="12" fill="url(#yeGradient)" />
      
      {/* Top-left node */}
      <circle cx="25" cy="25" r="6" fill="url(#yeGradient)" opacity="0.8" />
      <line x1="35" y1="35" x2="45" y2="45" stroke="url(#yeGradient)" strokeWidth="1.5" opacity="0.6" />
      
      {/* Top-right node */}
      <circle cx="75" cy="25" r="6" fill="url(#yeGradient)" opacity="0.8" />
      <line x1="65" y1="35" x2="55" y2="45" stroke="url(#yeGradient)" strokeWidth="1.5" opacity="0.6" />
      
      {/* Bottom node */}
      <circle cx="50" cy="75" r="6" fill="url(#yeGradient)" opacity="0.8" />
      <line x1="50" y1="62" x2="50" y2="52" stroke="url(#yeGradient)" strokeWidth="1.5" opacity="0.6" />
    </svg>
  )
}
