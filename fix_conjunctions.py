with open('server/src/routes/conjunctions.ts', 'r', newline='') as f:
    lines = f.readlines()

# Find the line with "function enrichConj"
insert_idx = None
for i, line in enumerate(lines):
    if 'function enrichConj(c: Conjunction): Conjunction' in line:
        insert_idx = i + 2  # After the closing brace and blank line
        break

if insert_idx is None:
    print("Could not find enrichConj function")
    exit(1)

# New lines to insert
new_lines = [
    '/* ---------- Live satellite state from TLE cache ---------- */\n',
    'async function fetchSatState(noradId: number) {\n',
    '  const tles = getCachedFleet();\n',
    '  const tle = tles.find((t) => t.noradId === noradId);\n',
    '  if (!tle || !tle.ok || !tle.line1) return null;\n',
    '  const result = await propagateAtServ(noradId, tle.name, tle.line1, tle.line2, tle.epoch, new Date());\n',
    '  if (!result.ok || !result.state) return null;\n',
    '  return result.state;\n',
    '}\n',
    '\n',  # blank line before next comment
]

# Insert new lines
new_lines_for_next = [
    '/* Linear B-plane encounter trajectory (the standard short-encounter model).',
    ' * Over the brief encounter the relative motion is a straight line along the',
    ' * relative-velocity axis; the secondary passes the primary at the recorded',
    ' * B-plane miss offset.  Returns samples { tOffsetSec, alongKm, xiKm, zetaKm, rangeKm }. */\n',
]

# Insert after the enrichConj function (after the blank line at insert_idx-1)
# Actually insert_idx points to the blank line after the closing brace
# We want to insert before the "Linear B-plane" comment

# Let me just find the "Linear B-plane" line and insert before it
for i, line in enumerate(lines):
    if 'Linear B-plane encounter trajectory' in line:
        # Insert new lines before this line
        # But we also have the enrichConj function to handle
        # Let's insert after line i-1 (the blank line after enrichConj)
        # Actually, enrichConj is at some earlier line
        # Let me just insert at position i (before the Linear B-plane comment)
        # And also handle the enrichConj insertion
        
        # First, let's find enrichConj and insert after it
        for j, line2 in enumerate(lines):
            if 'function enrichConj(c: Conjunction): Conjunction' in line2:
                # Insert after line j+1 (the closing brace line)
                # Lines: j = enrichConj function signature, j+1 = }, j+2 = blank
                # We want to insert after j+1 (after the blank line? or before?)
                # Actually let's insert after j+1 which is the closing brace line
                # That means new lines go at position j+2
                
                # Insert the fetchSatState function after the closing brace (line j+1) and its following blank line (j+2)
                # New content: lines[0:j+2] + new_lines + lines[j+2:]
                
                # Let me just do it step by step
                # The enrichConj function spans from line j to j+1 (the })
                # There's a blank line at j+2
                # The "Linear B-plane" comment starts at line some_idx
                
                # Let's just overwrite the whole file properly
                print(f"enrichConj at line {j+1}, Linear B-plane at line {i+1}")
                break
        break

# Overall simpler approach: just rewrite the specific section we need
print("Ready to edit")