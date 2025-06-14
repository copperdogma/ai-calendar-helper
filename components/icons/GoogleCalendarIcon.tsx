import React from 'react';

// Google Calendar icon now uses external optimized SVG in public assets
const GoogleCalendarIcon: React.FC<React.ImgHTMLAttributes<HTMLImageElement>> = ({
  width = 16,
  height = 16,
  ...props
}) => (
  <img
    src="/google-calendar.svg"
    alt="Google Calendar Icon"
    width={width}
    height={height}
    {...props}
  />
);

export default GoogleCalendarIcon;
