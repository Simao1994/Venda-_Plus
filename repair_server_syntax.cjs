const fs = require('fs');
const path = 'd:/Venda Plus/server.ts';
let content = fs.readFileSync(path, 'utf8');

// The problematic block:
// 4884:     } catch (err: any) {
// 4885:     } catch (err: any) {
// 4886:       res.status(500).json({ error: err.message });

const lines = content.split('\n');
let i = 0;
while (i < lines.length - 2) {
    if (lines[i].includes('} catch (err: any) {') && 
        lines[i+1].trim() === '} catch (err: any) {' && 
        lines[i+2].includes('res.status(500).json')) {
        
        console.log('Found duplicate catch at line', i + 1);
        lines.splice(i, 2, '    } catch (err: any) {');
        i += 1;
    } else {
        i++;
    }
}

fs.writeFileSync(path, lines.join('\n'), 'utf8');
console.log('Successfully repaired server.ts syntax');
