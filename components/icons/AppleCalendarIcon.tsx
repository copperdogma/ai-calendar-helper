import React from 'react';

// Generic calendar icon for ICS downloads
const AppleCalendarIcon: React.FC<React.ImgHTMLAttributes<HTMLImageElement>> = ({
  width = 16,
  height = 16,
  ...props
}) => <img src="/calendar.svg" alt="Calendar Icon" width={width} height={height} {...props} />;

export default AppleCalendarIcon;
