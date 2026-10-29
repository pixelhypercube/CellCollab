"""

Special Python file used to parse the full lexicon into binary matrices in /client/src/data/fullLexicon.js

"""


import os
import re
import json

INPUT_TXT = "lexicon.txt"
OUTPUT_JS = "../client/src/data/fullLexicon.js"

def parse_ascii_lexicon(input_file=INPUT_TXT, output_file=OUTPUT_JS):
    if not os.path.exists(input_file):
        print(f"Error: '{input_file}' not found. Please place it in the working directory.")
        return

    with open(input_file, "r", encoding="utf-8", errors="ignore") as f:
        text = f.read()

    # split into entries starting with :Term Name:
    # pattern entries start with :name: and end before the next :name: or end of file
    entry_pattern = re.compile(r"^:([^:\n]+):([^\n]*\n(?:(?!\n:[^:\n]+:).)*)", re.MULTILINE | re.DOTALL)
    entries = entry_pattern.findall(text)

    print(f"Found {len(entries)} entries. Extracting pattern grids...")

    lexicon = []

    for name, content in entries:
        lines = content.splitlines()

        # collect blocks of grid lines (lines containing only '.', '*', and whitespace)
        grid_blocks = []
        current_block = []

        for line in lines:
            stripped = line.strip()
            # a valid grid line has length >= 2 and contains only '.' and '*'
            if stripped and re.fullmatch(r"^[.*]+$", stripped):
                current_block.append(stripped)
            else:
                if current_block:
                    grid_blocks.append(current_block)
                    current_block = []
        if current_block:
            grid_blocks.append(current_block)

        # process each grid block found under this entry
        for idx, block in enumerate(grid_blocks):
            # check if block contains at least one live cell
            if not any("*" in row for row in block):
                continue

            board = [[1 if ch == "*" else 0 for ch in row] for row in block]
            height = len(board)
            width = max(len(row) for row in board) if height > 0 else 0

            # normalize jagged rows to consistent width
            normalized_board = [row + [0] * (width - len(row)) for row in board]

            # if an entry has multiple diagrams, append index suffix
            clean_name = name.strip()
            if len(grid_blocks) > 1:
                display_name = f"{clean_name} ({idx + 1}) ({width}x{height})"
            else:
                display_name = f"{clean_name} ({width}x{height})"

            lexicon.append({
                "name": display_name,
                "board": normalized_board
            })
            print(f"Parsed: {display_name}")

    # export to js
    js_content = f"const fullLexicon = {json.dumps(lexicon, separators=(',', ':'))};\n\nexport default fullLexicon;\n"
    
    with open(output_file, "w", encoding="utf-8") as f:
        f.write(js_content)

    print(f"\nCompleted! Exported {len(lexicon)} patterns to '{output_file}'.")

if __name__ == "__main__":
    parse_ascii_lexicon()