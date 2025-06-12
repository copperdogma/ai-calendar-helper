import React from 'react';

const AppleCalendarIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({
  width = 16,
  height = 16,
  ...props
}) => (
  <svg
    viewBox="0 0 24 24"
    width={width}
    height={height}
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    {...props}
  >
    <title>Apple Calendar</title>
    {/* Outer rounded square */}
    <rect x="3" y="4" width="18" height="17" rx="2" fill="#FFFFFF" stroke="#C7C7CC" />
    {/* Red header */}
    <rect x="3" y="4" width="18" height="4" fill="#FF3B30" />
    {/* Day number 17 example */}
    <text
      x="12"
      y="16"
      fontFamily="Helvetica, Arial, sans-serif"
      fontSize="9"
      fontWeight="bold"
      textAnchor="middle"
      fill="#000000"
    >
      
    </text>
  </svg>
);

export default AppleCalendarIcon;
