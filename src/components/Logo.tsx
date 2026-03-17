
import React, { useState } from 'react';

interface LogoProps {
  className?: string;
  showTagline?: boolean;
  light?: boolean;
  onClick?: () => void;
  collapsed?: boolean;
}

/**
 * Identidade Visual da Amazing Corporation.
 * Substituído o logotipo gráfico por identidade textual simplificada.
 */
const Logo: React.FC<LogoProps> = ({ className = "", onClick, collapsed }) => {
  const [error, setError] = useState(false);

  // Logo "Venda Plus" para o sistema
  const systemLogo = "/assets/logo.png";
  const fallbackLogo = "/venda_plus_app_icon.png";

  if (error) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
          <span className="text-zinc-900 font-black text-xs">V</span>
        </div>
        {!collapsed && (
          <span className="text-xl font-black tracking-tighter text-white uppercase">
            Venda<span className="text-yellow-500">Plus</span>
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src={systemLogo}
        alt="Venda Plus"
        className={`${collapsed ? 'w-8 h-8' : 'w-auto h-8'} object-contain`}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          if (target.src.includes(systemLogo)) {
            target.src = fallbackLogo;
          } else {
            setError(true);
          }
        }}
      />
      {!collapsed && (
        <span className="text-xl font-black tracking-tighter text-white uppercase">
          Venda<span className="text-yellow-500">Plus</span>
        </span>
      )}
    </div>
  );
};

export default Logo;
