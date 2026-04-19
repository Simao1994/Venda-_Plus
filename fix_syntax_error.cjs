const fs = require('fs');
const path = 'd:/Venda Plus/src/components/investments/InvestmentsModule.tsx';
let content = fs.readFileSync(path, 'utf8');

// The broken block starts at 707 and ends at 748. 
// It looks like a duplicate of the investors table but with different classes and no condition.
// I will use a regex to find and remove this specific stray block.

const brokenBlockRegex = /\}\)\n\s+<table className="w-full text-white">[\s\S]*?<\/div>\n\s+\)\}/m;

// Let's be more precise by looking for the specific content of that stray block
const strayBlock = `          <table className="w-full text-white">
            <thead>
              <tr className="text-left text-[10px] font-black uppercase tracking-widest text-gold-primary/40 border-b border-white/5">
                <th className="pb-6 pl-4">Titular Responsável</th>
                <th className="pb-6">ID</th>
                <th className="pb-6">BI / NIF Oficial</th>
                <th className="pb-6">Telemóvel</th>
                <th className="pb-6 text-right pr-4">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredInvestors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-white/30 font-black uppercase tracking-widest">
                    Nenhum investidor encontrado
                  </td>
                </tr>
              ) : (
                filteredInvestors.map(inv => (
                  <tr key={inv.id} className="group hover:bg-white/[0.02] transition-all">
                    <td className="py-6 pl-4 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center text-gold-primary/20 shadow-inner group-hover:border-gold-primary/30 transition-all">
                         {inv.foto ? <img src={inv.foto} alt="" className="w-full h-full object-cover" /> : <Users size={20} />}
                      </div>
                      <span className="font-black text-slate-100 group-hover:text-gold-primary transition-colors">{inv.nome}</span>
                    </td>
                    <td className="py-6 font-mono text-[10px] text-white/40">{inv.id.substring(0, 8)}...</td>
                    <td className="py-6 font-bold opacity-30">{inv.nif}</td>
                    <td className="py-6 font-bold text-slate-400">{inv.telefone}</td>
                    <td className="py-6 text-right pr-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => { setSearchResult(inv); const p = projects.find(pro => pro.investidor_id === inv.id); if (p) setActiveProject(p); }} className="p-3 opacity-20 hover:opacity-100 hover:text-gold-primary hover:bg-white/5 rounded-xl transition-all shadow-sm"><FileText size={18} /></button>
                        <button onClick={() => { const p = projects.find(pro => pro.investidor_id === inv.id); if (p) setActiveProject(p); setActiveTab('records'); }} className="p-3 opacity-20 hover:opacity-100 hover:text-gold-primary hover:bg-white/5 rounded-xl transition-all shadow-sm"><ChevronRight size={22} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}`;

// We need to find this stray block which starts immediately after the correct one.
// The correct one ends at line 706 with '      )}'
if (content.includes(strayBlock)) {
    content = content.replace(strayBlock, '');
    fs.writeFileSync(path, content, 'utf8');
    console.log('Successfully removed the broken stray block from InvestmentsModule.tsx');
} else {
    console.log('Stray block not found exactly as string, trying regex...');
    // Fallback if whitespace differs
    const fallbackRegex = /<table className="w-full text-white">[\s\S]*?Titular Responsável[\s\S]*?Telemóvel[\s\S]*?<\/table>\s+<\/div>\s+\)\}/m;
    if (fallbackRegex.test(content)) {
        content = content.replace(fallbackRegex, '');
        fs.writeFileSync(path, content, 'utf8');
        console.log('Successfully removed the broken stray block via regex.');
    } else {
        console.log('Could not find the broken block.');
    }
}
