
import React from 'react';

interface LogoProps {
  className?: string;
  showTagline?: boolean;
  light?: boolean;
  onClick?: () => void;
}

/**
 * Identidade Visual da Amazing Corporation.
 * Substituído o logotipo gráfico por identidade textual simplificada.
 */
const Logo: React.FC<LogoProps> = ({ className = "", onClick }) => {
  return (
    <img
      src="/assets/logo.png"
      alt="Amazing Corporation Logo"
      className={`object-contain select-none ${className}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      onError={(e) => {
        // Fallback simple text if image fails to load
        const target = e.target as HTMLImageElement;
        target.onerror = null;
        target.style.display = 'none';
      }}
    />
  );
};

export default Logo;
