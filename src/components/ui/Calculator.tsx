import React, { useState, useEffect } from 'react';
import { X, Delete, Divide, Minus, Plus, Equal, Percent, Calculator as CalcIcon } from 'lucide-react';
import { useRef } from 'react';

interface CalculatorProps {
    onClose: () => void;
    onValueSelect?: (value: string) => void;
    title?: string;
    accentColor?: string;
}

export default function Calculator({ onClose, onValueSelect, title = "Calculadora Profissional", accentColor = "#D4AF37" }: CalculatorProps) {
    const [display, setDisplay] = useState('0');
    const [equation, setEquation] = useState('');
    const [isDone, setIsDone] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);

    const handleNumber = (num: string) => {
        if (isDone) {
            setDisplay(num);
            setIsDone(false);
        } else {
            setDisplay(prev => prev === '0' ? num : prev + num);
        }
    };

    const handleOperator = (op: string) => {
        setEquation(display + ' ' + op + ' ');
        setDisplay('0');
        setIsDone(false);
    };

    const handleClear = () => {
        setDisplay('0');
        setEquation('');
        setIsDone(false);
    };

    const handleCalculate = () => {
        try {
            const fullEquation = equation + display;
            // Using Function constructor as a safer alternative to eval for simple math
            // In a real pro app, we'd use a math parser library
            const result = new Function(`return ${fullEquation.replace('×', '*').replace('÷', '/')}`)();
            setDisplay(String(Number(result.toFixed(2))));
            setEquation('');
            setIsDone(true);
        } catch (e) {
            setDisplay('Error');
        }
    };

    const handlePercent = () => {
        setDisplay(prev => String(parseFloat(prev) / 100));
    };

    const handleBackspace = () => {
        setDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
    };

    useEffect(() => {
        modalRef.current?.focus();

        const handleKeyDown = (e: KeyboardEvent) => {
            // Prevent default behavior for some keys to avoid page scroll or other actions
            if (['/', '*', '-', '+', 'Enter', 'Backspace', 'Escape'].includes(e.key)) {
                e.preventDefault();
                e.stopPropagation();
            }

            if (/^\d$/.test(e.key)) handleNumber(e.key);
            if (e.key === '.') !display.includes('.') && handleNumber('.');
            if (e.key === '+') handleOperator('+');
            if (e.key === '-') handleOperator('-');
            if (e.key === '*') handleOperator('*');
            if (e.key === '/') handleOperator('/');
            if (e.key === 'Enter' || e.key === '=') handleCalculate();
            if (e.key === 'Backspace' || e.key === 'Delete') handleBackspace();
            if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') handleClear();
        };

        window.addEventListener('keydown', handleKeyDown, true);
        return () => window.removeEventListener('keydown', handleKeyDown, true);
    }, [display, equation, isDone]); // Depend on state to have latest values in closure

    const buttons = [
        { label: 'C', action: handleClear, type: 'special' },
        { label: 'DEL', action: handleBackspace, type: 'special', icon: <Delete size={16} /> },
        { label: '%', action: handlePercent, type: 'special', icon: <Percent size={16} /> },
        { label: '÷', action: () => handleOperator('/'), type: 'operator', icon: <Divide size={16} /> },
        { label: '7', action: () => handleNumber('7'), type: 'number' },
        { label: '8', action: () => handleNumber('8'), type: 'number' },
        { label: '9', action: () => handleNumber('9'), type: 'number' },
        { label: '×', action: () => handleOperator('*'), type: 'operator', icon: <X size={16} /> },
        { label: '4', action: () => handleNumber('4'), type: 'number' },
        { label: '5', action: () => handleNumber('5'), type: 'number' },
        { label: '6', action: () => handleNumber('6'), type: 'number' },
        { label: '−', action: () => handleOperator('-'), type: 'operator', icon: <Minus size={16} /> },
        { label: '1', action: () => handleNumber('1'), type: 'number' },
        { label: '2', action: () => handleNumber('2'), type: 'number' },
        { label: '3', action: () => handleNumber('3'), type: 'number' },
        { label: '+', action: () => handleOperator('+'), type: 'operator', icon: <Plus size={16} /> },
        { label: '±', action: () => setDisplay(prev => prev.startsWith('-') ? prev.slice(1) : '-' + prev), type: 'number' },
        { label: '0', action: () => handleNumber('0'), type: 'number' },
        { label: '.', action: () => !display.includes('.') && handleNumber('.'), type: 'number' },
        { label: '=', action: handleCalculate, type: 'equal', icon: <Equal size={16} /> },
    ];

    return (
        <div
            ref={modalRef}
            tabIndex={0}
            className="fixed inset-0 flex items-center justify-center z-[200] p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300 outline-none"
        >
            <div className="bg-[#1a1a1a]/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] w-full max-w-[340px] overflow-hidden shadow-2xl shadow-black/50 animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-6 flex items-center justify-between border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-white/40 border border-white/5">
                            <CalcIcon size={14} />
                        </div>
                        <div>
                            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em] italic">{title}</h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <div className="w-1 h-1 rounded-full animate-pulse" style={{ backgroundColor: accentColor }} />
                                <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Active Engine</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-xl hover:bg-white/5 flex items-center justify-center text-white/20 hover:text-white transition-all border border-transparent hover:border-white/5"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Display */}
                <div className="p-10 bg-black/20 text-right min-h-[160px] flex flex-col justify-end space-y-1 overflow-hidden relative">
                    <div className="text-white/20 text-[10px] uppercase font-black tracking-widest h-4 tabular-nums overflow-hidden whitespace-nowrap text-ellipsis px-2">
                        {equation}
                    </div>
                    <div className={`text-white font-black tracking-tighter tabular-nums overflow-hidden whitespace-nowrap text-ellipsis italic transition-all duration-300 pr-4 ${display.length > 10 ? 'text-2xl' : display.length > 7 ? 'text-3xl' : 'text-5xl'}`}>
                        {display}
                    </div>
                </div>

                {/* Buttons Grid */}
                <div className="p-6 grid grid-cols-4 gap-3">
                    {buttons.map((btn, i) => (
                        <button
                            key={i}
                            onClick={btn.action}
                            className={`
                aspect-square rounded-2xl flex items-center justify-center transition-all duration-200 active:scale-90
                ${btn.type === 'number' ? 'bg-white/5 text-white/80 hover:bg-white/10 text-lg font-bold border border-white/5' : ''}
                ${btn.type === 'operator' ? 'bg-white/[0.02] text-white/40 hover:text-white border border-white/5' : ''}
                ${btn.type === 'special' ? 'bg-white/[0.02] text-white/40 hover:text-red-400/60 border border-white/5 text-[10px] font-black' : ''}
                ${btn.type === 'equal' ? 'shadow-lg text-black font-black' : ''}
              `}
                            style={btn.type === 'equal' ? { backgroundColor: accentColor, boxShadow: `0 0 20px ${accentColor}40` } : {}}
                        >
                            {btn.icon || btn.label}
                        </button>
                    ))}
                </div>

                {/* Footer Actions */}
                {onValueSelect && (
                    <div className="px-6 pb-8">
                        <button
                            onClick={() => display !== 'Error' && onValueSelect(display)}
                            className="w-full py-4 rounded-2xl bg-white/5 border border-white/5 text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all font-black text-[10px] uppercase tracking-[0.3em] disabled:opacity-20 disabled:cursor-not-allowed"
                            disabled={display === 'Error' || display === '0'}
                        >
                            Transferir para o Campo
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
