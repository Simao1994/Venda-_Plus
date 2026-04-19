const fs = require('fs');
const path = 'd:/Venda Plus/src/components/investments/InvestmentsModule.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Fix the title
content = content.replace(/<UserCheck size={24} \/>\s*Ã\s*rea do Investidor/g, '<UserCheck size={24} /> Área do Investidor');

// 2. Add the tfoot to the movements table
const tfootCode = `                        </tbody>
                        <tfoot className="bg-white/5 border-t border-white/10 font-bold">
                          <tr className="text-[10px] uppercase text-gold-primary">
                            <td className="py-4 px-6">TOTAIS DE MOVIMENTAÇÃO</td>
                            <td className="py-4 px-6 text-right">---</td>
                            <td className="py-4 px-6 text-right text-emerald-400">{formatarKz(totalAumento)}</td>
                            <td className="py-4 px-6 text-right text-blue-400">{formatarKz(totalJuros)}</td>
                            <td className="py-4 px-6 text-right text-red-400">{formatarKz(totalIac)}</td>
                            <td className="py-4 px-6 text-right text-red-400">{formatarKz(totalSaques)}</td>
                            <td className="py-4 px-6 text-right text-slate-400">{formatarKz(totalMultas)}</td>
                          </tr>
                        </tfoot>`;

// We target the close of the tbody in the specific section
// Finding the one inside the searchResult block
const targetTbody = '                        </tbody>\n                        <tfoot'; // check if already exists
if (!content.includes(targetTbody)) {
    // We look for where invRecords.map ends
    const insertAfter = '                            ))\n                          )}\n                        </tbody>';
    if (content.includes(insertAfter)) {
        content = content.replace(insertAfter, tfootCode);
    } else {
        console.log('Target for footer not found');
    }
}

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed title and added totals footer');
