
with open(r'd:\Venda Plus\server.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()
    for i in range(492, 508):
        print(f"{i+1}: {repr(lines[i])}")
