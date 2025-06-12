import React from 'react';

// Simple Microsoft Outlook icon (blue envelope with O)
// Source: https://simpleicons.org/icons/microsoftoutlook.svg (simplified)
const OutlookIcon: React.FC<React.SVGProps<SVGSVGElement>> = props => (
  <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
    <title>Microsoft Outlook</title>
    <path
      fill="#0078D4"
      d="M22.5 4.5h-8.1v1.8h6.3v11.4h-6.3v1.8h8.1zM14.4 3H1.5v18h12.9V3zm-1.8 14.4H3.3V6.6h9.3v10.8zm-4.65-7.8a3 3 0 0 0 0 6 3 3 0 0 0 0-6zm0 4.8a1.8 1.8 0 1 1 0-3.6 1.8 1.8 0 0 1 0 3.6z"
    />
  </svg>
);

export default OutlookIcon;
