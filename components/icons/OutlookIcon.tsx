import React from 'react';

// Outlook Calendar icon now uses external optimized SVG in public assets
const OutlookIcon: React.FC<React.ImgHTMLAttributes<HTMLImageElement>> = ({
  width = 16,
  height = 16,
  ...props
}) => (
  <img
    src="/outlook-calendar.svg"
    alt="Outlook Calendar Icon"
    width={width}
    height={height}
    {...props}
  />
);

export default OutlookIcon;
