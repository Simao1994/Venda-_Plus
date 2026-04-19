const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'InvestmentsModule.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const regex = /                                    \}\)\)\}\r?\n                            <button type="submit"/;

const fixedBlock = `                                    ))}
                                </tbody>
                            </table>
                        </div>
                     </div>

                     <div className="flex flex-col md:flex-row justify-between items-center p-8 md:p-12 bg-[#002855]/20 rounded-[50px] border border-white/5 shadow-inner gap-8">
                        <div className="flex flex-wrap items-center gap-x-10 gap-y-4">
                            <div className="text-white">
                                <span className="text-[11px] font-black uppercase opacity-30 block mb-2 tracking-[0.4em]">Resgate Final Estimado (Líquido)</span>
                                <div className="flex items-baseline gap-4">
                                   <span className="text-[18px] font-black text-white tracking-tighter drop-shadow-lg">{formatarKz(previewCalculated[previewCalculated.length - 1]?.final || 0)}</span>
                                </div>
                            </div>

                            <div className="h-14 w-px bg-white/5 hidden lg:block" />

                            <div className="flex flex-wrap gap-x-8 gap-y-4">
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest opacity-40 mb-1">Aumento</span>
                                    <span className="text-[12px] font-black text-emerald-400">{formatarKz(previewTotals.aumento)}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-red-500 uppercase tracking-widest opacity-40 mb-1">Saque</span>
                                    <span className="text-[12px] font-black text-red-400">{formatarKz(previewTotals.saque)}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-slate-100 uppercase tracking-widest opacity-40 mb-1">Multa</span>
                                    <span className="text-[12px] font-black text-slate-100">{formatarKz(previewTotals.multa)}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest opacity-40 mb-1">Juros</span>
                                    <span className="text-[12px] font-black text-blue-400">{formatarKz(previewTotals.juros)}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-red-500 uppercase tracking-widest opacity-40 mb-1">IAC</span>
                                    <span className="text-[12px] font-black text-red-500">{formatarKz(previewTotals.iac)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-4 w-full md:w-auto">
                            <button type="button" onClick={() => setModalTab('perfil')} className="flex-1 md:flex-none px-8 py-5 bg-white/5 text-white/40 rounded-[25px] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white/10 hover:text-white transition-all border border-white/10 shadow-xl">Revisar Perfil</button>
                            <button type="submit"`;

if (regex.test(content)) {
    content = content.replace(regex, fixedBlock);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log("Fixed successfully!");
} else {
    console.log("Could not find regex.");
}
