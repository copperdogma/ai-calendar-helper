import React from 'react';

// Google Calendar logo (simplified full-color "31" tile)
// Created with SVG paths to approximate official logo sizing 16x16 by default
const GoogleCalendarIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({
  width = 16,
  height = 16,
  ...props
}) => (
  <svg
    viewBox="0 0 24 24"
    width={width}
    height={height}
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    role="img"
  >
    <title>Google Calendar</title>
    {/* Blue base */}
    <path
      d="M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5z"
      fill="#4285F4"
    />
    {/* White inner square */}
    <rect x="5" y="7" width="14" height="12" fill="#FFFFFF" />
    {/* Google colors top bar */}
    <rect x="5" y="5" width="14" height="2" fill="#3367D6" />
    <rect x="5" y="5" width="4" height="2" fill="#EA4335" />
    <rect x="9" y="5" width="4" height="2" fill="#FBBC05" />
    <rect x="13" y="5" width="6" height="2" fill="#34A853" />
    {/* Date number 31 */}
    <text
      x="12"
      y="17"
      fontFamily="Helvetica, Arial, sans-serif"
      fontSize="9"
      fontWeight="bold"
      textAnchor="middle"
      fill="#4285F4"
    >
      31
    </text>
  </svg>
);

export default GoogleCalendarIcon;
