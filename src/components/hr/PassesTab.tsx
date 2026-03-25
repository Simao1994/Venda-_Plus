// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
    IdCard, Printer, X, RefreshCw,
    Search, ShieldCheck, User as UserIcon,
    Download, CreditCard, ArrowLeftRight
} from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Logo from '../Logo';

// ─── PVC Card Dimensions (85.6mm × 54mm @ 96dpi ≈ 323px × 204px)
// We scale up 3× for screen quality: 969 × 612 → display scaled down
const CARD_W = 323;
const CARD_H = 204;
const CARD_SCALE = 2.8;

interface Employee {
    id: number;
    name: string;
    position: string;
    photo_url?: string;
    email?: string;
    phone?: string;
    hire_date?: string;
    hr_departments?: { name: string };
}

interface CompanyProfile {
    logo?: string;
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
}

// ─── FRONT FACE ───────────────────────────────────────────────────
const CardFront: React.FC<{ emp: Employee; company: CompanyProfile | null; empNumber: string }> = ({ emp, company, empNumber }) => (
    <div
        id="pvc-card-front"
        className="pvc-card"
        style={{
            width: '85.6mm', height: '54mm',
            position: 'relative', overflow: 'hidden',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            borderRadius: '4mm',
            fontFamily: "'Inter', sans-serif",
            color: '#1e293b',
            flexShrink: 0
        }}
    >
        {/* Background Blobs Canva-style */}
        <div style={{ position: 'absolute', top: '-15mm', right: '-15mm', width: '50mm', height: '50mm', borderRadius: '50%', background: 'linear-gradient(135deg, #4f46e5, #6366f1)', opacity: 0.1 }} />
        <div style={{ position: 'absolute', bottom: '-20mm', left: '-5mm', width: '60mm', height: '60mm', borderRadius: '50%', background: 'linear-gradient(135deg, #ec4899, #f43f5e)', opacity: 0.05 }} />
        
        <div style={{ display: 'flex', height: '100%', alignItems: 'center', padding: '0 6mm' }}>
            {/* Left accent border */}
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '2mm', background: 'linear-gradient(180deg, #4f46e5, #ec4899)' }} />
            
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: '5mm', alignItems: 'center', width: '100%' }}>
                {/* Photo Holder */}
                <div style={{ width: '22mm', height: '22mm', borderRadius: '50%', overflow: 'hidden', border: '0.8mm solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', flexShrink: 0, background: '#f1f5f9' }}>
                    {emp.photo_url 
                        ? <img src={emp.photo_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> 
                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8pt', color: '#94a3b8', fontWeight: 800 }}>FOTO</div>
                    }
                </div>
                
                {/* Info Text */}
                <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '5.5pt', fontWeight: 900, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1mm' }}>{company?.name || 'EMPRESA'}</p>
                    <h2 style={{ fontSize: '12pt', fontWeight: 900, color: '#0f172a', margin: 0, lineHeight: 1.1, letterSpacing: '-0.02em' }}>{emp.name}</h2>
                    <p style={{ fontSize: '7pt', fontWeight: 600, color: '#64748b', margin: '1mm 0 3mm 0' }}>{emp.position}</p>
                    
                    <div style={{ display: 'inline-flex', padding: '1mm 2.5mm', background: '#f1f5f9', borderRadius: '1.5mm', border: '0.5px solid #e2e8f0' }}>
                        <span style={{ fontSize: '5.5pt', fontFamily: 'monospace', fontWeight: 800, color: '#475569', letterSpacing: '0.05em' }}>ID: {empNumber}</span>
                    </div>
                </div>
            </div>
        </div>
        
        {/* Dept Badge */}
        <div style={{ position: 'absolute', top: '4mm', right: '4mm', background: '#4f46e5', color: 'white', padding: '1.2mm 3mm', borderRadius: '10mm', fontSize: '5pt', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', boxShadow: '0 2px 5px rgba(79,70,229,0.3)' }}>
            {emp.hr_departments?.name || 'COLABORADOR'}
        </div>
        
        {/* Contact/Website footer */}
        <div style={{ position: 'absolute', bottom: '3mm', right: '4mm', textAlign: 'right' }}>
            {company?.email && <p style={{ fontSize: '4.5pt', color: '#94a3b8', fontWeight: 700, margin: 0 }}>{company.email}</p>}
            {company?.phone && <p style={{ fontSize: '4.5pt', color: '#94a3b8', fontWeight: 700, margin: 0 }}>{company.phone}</p>}
        </div>
    </div>
);

// ─── BACK FACE ────────────────────────────────────────────────────
const CardBack: React.FC<{ emp: Employee; company: CompanyProfile | null; empNumber: string }> = ({ emp, company, empNumber }) => {
    const qrData = JSON.stringify({
        id: emp.id,
        name: emp.name,
        position: emp.position,
        numero: empNumber,
        empresa: company?.name || '',
    });

    return (
        <div
            id="pvc-card-back"
            className="pvc-card"
            style={{
                width: '85.6mm', height: '54mm',
                position: 'relative', overflow: 'hidden',
                background: '#0f172a',
                borderRadius: '4mm',
                fontFamily: "'Inter', sans-serif",
                color: '#ffffff',
                display: 'flex', flexDirection: 'column',
                flexShrink: 0
            }}
        >
            {/* Magnetic stripe simulator */}
            <div style={{ width: '100%', height: '9mm', background: '#000000', marginTop: '5mm', opacity: 0.8 }} />
            
            <div style={{ display: 'flex', padding: '4mm 6mm', flex: 1, alignItems: 'center', gap: '6mm' }}>
                <div style={{ background: 'white', padding: '2mm', borderRadius: '2mm', flexShrink: 0 }}>
                    <QRCodeSVG value={qrData} size={60} bgColor="#ffffff" fgColor="#000000" level="M" />
                </div>
                
                <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '5.5pt', color: '#94a3b8', fontWeight: 600, marginBottom: '2.5mm', lineHeight: 1.4 }}>Este cartão é pessoal e intransmissível. O uso indevido é punível. Em caso de perda, contacte os recursos humanos imediatamente.</p>
                    <div style={{ width: '100%', height: '7mm', background: 'repeating-linear-gradient(90deg, #ffffff, #ffffff 1px, transparent 1px, transparent 3.5px)', opacity: 0.15 }} />
                    <p style={{ fontSize: '6.5pt', fontFamily: 'monospace', letterSpacing: '0.25em', color: '#e2e8f0', marginTop: '1mm', textAlign: 'center' }}>{empNumber}</p>
                </div>
            </div>
            
            <div style={{ background: '#1e293b', padding: '2mm 6mm', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontSize: '4.5pt', color: '#94a3b8', margin: 0, fontWeight: 600 }}>Válido até: {new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toLocaleDateString('pt-AO')}</p>
                <p style={{ fontSize: '4.5pt', color: '#818cf8', fontWeight: 900, margin: 0, letterSpacing: '0.05em' }}>SISTEMA DE GESTÃO V.2026</p>
            </div>
        </div>
    );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────
export default function PassesTab({ autoPrintEmployee, onClearAutoPrint }: { autoPrintEmployee?: any; onClearAutoPrint?: () => void }) {
    const { user } = useAuth();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [printingPass, setPrintingPass] = useState<Employee | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showBack, setShowBack] = useState(false);
    const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
    
    const frontRef = useRef<HTMLDivElement>(null);
    const backRef = useRef<HTMLDivElement>(null);
    const bothRef = useRef<HTMLDivElement>(null);

    const handlePrintFront = useReactToPrint({
        contentRef: frontRef,
        documentTitle: `PassPVC-${printingPass?.name}-Frente`
    });

    const handlePrintBack = useReactToPrint({
        contentRef: backRef,
        documentTitle: `PassPVC-${printingPass?.name}-Verso`
    });

    const handlePrintBoth = useReactToPrint({
        contentRef: bothRef,
        documentTitle: `PassPVC-${printingPass?.name}-Ambos`
    });

    useEffect(() => { fetchEmployees(); fetchCompanyProfile(); }, []);

    useEffect(() => {
        if (autoPrintEmployee) {
            setPrintingPass(autoPrintEmployee);
            setShowBack(false);
            if (onClearAutoPrint) onClearAutoPrint();
        }
    }, [autoPrintEmployee]);

    const fetchCompanyProfile = async () => {
        try {
            const { data } = await supabase
                .from('companies')
                .select('logo, name, phone, email, address')
                .eq('id', user?.company_id)
                .maybeSingle();
            setCompanyProfile(data);
        } catch (e) { console.error(e); }
    };

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/hr/employees', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Falha ao carregar funcionários');
            const data = await res.json();
            // Filter active employees only
            const activeEmps = (data || []).filter((e: any) => e.status === 'active');
            setEmployees(activeEmps);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const getEmpNumber = (emp: Employee) => {
        const n = String(emp.id).padStart(6, '0');
        return `EMP-${n}`;
    };

    const filtered = employees.filter(e =>
        e.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.position?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <div className="flex justify-center items-center py-20">
            <RefreshCw className="animate-spin text-indigo-400" size={28} />
        </div>
    );

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="glass-panel p-8 rounded-[2.5rem] border border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute -right-10 -bottom-10 opacity-5"><IdCard size={200} className="text-indigo-400" /></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="px-3 py-1 bg-indigo-500/20 text-indigo-400 text-[9px] font-black uppercase rounded-full border border-indigo-500/30 tracking-widest">Sistema Ativo</div>
                        <div className="text-white/20 text-[9px] font-black uppercase tracking-widest">ISO/IEC 7810 ID-1 • 85.6×54mm</div>
                    </div>
                    <h3 className="text-3xl font-black uppercase tracking-tight text-white">Emissão de <span className="text-indigo-400">Passes PVC</span></h3>
                    <p className="text-white/30 text-sm mt-1">Cartões de identificação corporativa com QR Code integrado</p>
                </div>
                <div className="relative z-10 w-full md:w-72">
                    <input
                        type="text"
                        placeholder="Pesquisar funcionário..."
                        className="w-full glass-panel border border-white/10 rounded-2xl py-3 px-10 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-transparent"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                </div>
            </div>

            {/* Employee Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filtered.map(emp => {
                    const initials = emp.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                    return (
                        <div key={emp.id} className="glass-panel p-5 rounded-[2rem] border border-white/5 flex flex-col items-center text-center hover:border-indigo-500/30 transition-all group">
                            <div className="relative mb-3">
                                <div className="w-20 h-20 rounded-[1.5rem] bg-white/5 flex items-center justify-center overflow-hidden border-2 border-white/10 group-hover:border-indigo-500/30 transition-all">
                                    {emp.photo_url
                                        ? <img src={emp.photo_url} className="w-full h-full object-cover" />
                                        : <span className="text-xl font-black text-white/30">{initials}</span>
                                    }
                                </div>
                                <div className="absolute -bottom-1 -right-1 bg-indigo-500 text-white p-1 rounded-lg shadow-lg">
                                    <ShieldCheck size={12} />
                                </div>
                            </div>
                            <h4 className="font-black text-white text-sm uppercase leading-tight mb-1">{emp.name}</h4>
                            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">{emp.position}</p>
                            <p className="text-[9px] text-indigo-400/60 mb-4">{getEmpNumber(emp)}</p>
                            <button
                                onClick={() => { setPrintingPass(emp); setShowBack(false); }}
                                className="w-full py-3 bg-indigo-500/20 text-indigo-400 rounded-xl font-black uppercase text-[10px] border border-indigo-500/30 hover:bg-indigo-500/30 transition-all flex items-center justify-center gap-2"
                            >
                                <CreditCard size={14} /> Emitir Passe
                            </button>
                        </div>
                    );
                })}

                {filtered.length === 0 && (
                    <div className="col-span-full py-20 text-center glass-panel rounded-[3rem] border border-dashed border-white/10">
                        <Search className="mx-auto text-white/10 mb-4" size={40} />
                        <p className="text-white/30 font-bold">Nenhum funcionário ativo encontrado.</p>
                    </div>
                )}
            </div>

            {/* ─── MODAL ─── */}
            {printingPass && (
                <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
                    <style>{`
                        @media print {
                            body * { visibility: hidden !important; }
                            #pvc-card-front, #pvc-card-front * { visibility: visible !important; }
                            #pvc-card-back, #pvc-card-back *   { visibility: visible !important; }
                            #pvc-print-target, #pvc-print-target * { visibility: visible !important; }
                            #pvc-print-target {
                                position: fixed !important;
                                inset: 0 !important;
                                display: flex !important;
                                align-items: center !important;
                                justify-content: center !important;
                                z-index: 99999 !important;
                            }
                            @page { size: auto; margin: 0; }
                        }
                    `}</style>

                    <div className="w-full max-w-3xl rounded-[2.5rem] overflow-hidden glass-panel border border-white/10 shadow-2xl my-auto">
                        {/* Modal Header */}
                        <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-black text-white uppercase flex items-center gap-2">
                                    <IdCard className="text-indigo-400" size={22} /> Emissão PVC — {printingPass.name}
                                </h2>
                                <p className="text-white/30 text-xs mt-1">ISO/IEC 7810 • Tamanho ID-1 (85.6mm × 54mm)</p>
                            </div>
                            <button onClick={() => { setPrintingPass(null); setShowBack(false); }} className="p-2 text-white/30 hover:bg-white/10 rounded-2xl transition-all">
                                <X size={22} />
                            </button>
                        </div>

                        {/* Card Preview */}
                        <div className="p-8 flex flex-col items-center gap-8">
                            {/* Toggle Frente / Verso */}
                            <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
                                <button onClick={() => setShowBack(false)} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${!showBack ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-white/30 hover:text-white/50'}`}>
                                    Frente
                                </button>
                                <button onClick={() => setShowBack(true)} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${showBack ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-white/30 hover:text-white/50'}`}>
                                    Verso (QR Code)
                                </button>
                            </div>

                            {/* Card display — both rendered but one hidden (for print) */}
                            <div id="pvc-print-target" style={{ position: 'relative' }}>
                                <div style={{ display: showBack ? 'none' : 'block' }}>
                                    <CardFront emp={printingPass} company={companyProfile} empNumber={getEmpNumber(printingPass)} />
                                </div>
                                <div style={{ display: showBack ? 'block' : 'none' }}>
                                    <CardBack emp={printingPass} company={companyProfile} empNumber={getEmpNumber(printingPass)} />
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 w-full max-w-lg">
                                <button
                                    onClick={() => showBack ? handlePrintBack() : handlePrintFront()}
                                    className="flex-1 py-4 bg-indigo-500/20 text-indigo-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-500/30 transition-all flex items-center justify-center gap-2 border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.15)]"
                                >
                                    <Printer size={18} /> Imprimir {showBack ? 'Verso' : 'Frente'}
                                </button>
                                <button
                                    onClick={handlePrintBoth}
                                    className="flex-1 py-4 bg-violet-500/20 text-violet-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-violet-500/30 transition-all flex items-center justify-center gap-2 border border-violet-500/30"
                                >
                                    <ArrowLeftRight size={18} /> Imprimir Ambos
                                </button>
                                <button
                                    onClick={() => { setPrintingPass(null); setShowBack(false); }}
                                    className="px-6 py-4 glass-panel text-white/30 rounded-2xl font-black text-xs uppercase tracking-widest hover:text-white/60 transition-all border border-white/10"
                                >
                                    Fechar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Hidden Print Areas used by react-to-print */}
            {printingPass && (
                <div style={{ display: 'none' }}>
                    {/* Front Only */}
                    <div ref={frontRef}>
                        <style>{`
                            @media print { 
                                html, body { margin: 0; padding: 0; display: flex; align-items: center; justify-content: center; } 
                                * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                            }
                        `}</style>
                        <CardFront emp={printingPass} company={companyProfile} empNumber={getEmpNumber(printingPass)} />
                    </div>

                    {/* Back Only */}
                    <div ref={backRef}>
                        <style>{`
                            @media print { 
                                html, body { margin: 0; padding: 0; display: flex; align-items: center; justify-content: center; } 
                                * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                            }
                        `}</style>
                        <CardBack emp={printingPass} company={companyProfile} empNumber={getEmpNumber(printingPass)} />
                    </div>

                    {/* Both (Landscape A4 style) */}
                    <div ref={bothRef}>
                         <style>{`
                            @media print { 
                                html, body { display: flex; gap: 20px; align-items: center; justify-content: center; margin: 0; padding: 0; } 
                                * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                            }
                        `}</style>
                        <div style={{ display: 'flex', gap: '20px' }}>
                            <CardFront emp={printingPass} company={companyProfile} empNumber={getEmpNumber(printingPass)} />
                            <CardBack emp={printingPass} company={companyProfile} empNumber={getEmpNumber(printingPass)} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
