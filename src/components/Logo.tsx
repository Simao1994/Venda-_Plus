import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { TrendingUp } from 'lucide-react';

interface LogoProps {
  className?: string;
  onClick?: () => void;
  collapsed?: boolean;
  isPublic?: boolean;
}

const Logo: React.FC<LogoProps> = ({ className = "", onClick, collapsed, isPublic }) => {
  const { user } = useAuth();
  const isMaster = user?.role === 'master';

  return (
    <div 
      className={`flex items-center gap-3 transition-all cursor-pointer select-none group ${className}`} 
      onClick={onClick}
    >
      <div className={`${collapsed ? 'w-10 h-10' : 'w-10 h-10'} bg-gradient-to-br from-gold-primary to-gold-secondary rounded-xl flex items-center justify-center text-bg-deep shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-transform group-hover:scale-110 shrink-0`}>
        <TrendingUp size={22} className="shrink-0" />
      </div>
      
      {!collapsed && (
        <div className="flex items-center gap-2 leading-none">
          <span className="text-xl font-black tracking-tighter italic text-gold-gradient whitespace-nowrap">
            VENDA <span className="text-white group-hover:text-gold-primary transition-colors">PLUS</span>
          </span>
          {isMaster && (
            <div className="flex flex-col border-l border-gold-primary/20 pl-2 ml-1">
              <span className="text-[8px] font-black uppercase tracking-[0.2em] text-gold-primary">
                MASTER
              </span>
              <span className="text-[6px] font-bold text-white/20 uppercase tracking-widest">
                CORE
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Logo;
