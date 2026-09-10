#!/usr/bin/env python3
import sys

with open('server/src/routes/conjunctions.ts', 'r', newline='') as f:
    content = f.read()

# Find the position: after enrichConj function and its blank line, before "Linear B-plane"
# enrichConj ends at line 94 (1-indexed): '}' 
# Line 95 (1-indexed): blank line
# Line 96 (1-indexed): "/* Linear B-plane..."

# We want to insert after line 95 (the blank line), before line 96

# Find "/* Linear B-plane" and insert before it
linear_bplane_idx = content.find('/* Linear B-plane encounter trajectory')
if linear_bplane_idx == -1:
    print("ERROR: Could not find Linear B-plane marker")
    sys.exit(1)

# Find the newline before Linear B-plane
# Insert after the blank line that's before Linear B-plane
# The blank line is at linear_bplane_idx - 1 (the character just before the comment start)

# Actually, let's find the position right after the second blank line after enrichConj
# enrichConj closing brace is at line 94, blank line at 95, Linear B-plane at 96

# Let's just search for the pattern and insert
# We need to insert the new function definition

new_function = '''/* ---------- Live satellite state from TLE cache ---------- */
async function fetchSatState(noradId: number) {
  const tles = getCachedFleet();
  const tle = tles.find((t) => t.noradId === noradId);
  if (!tle || !tle.ok || !tle.line1) return null;
  const result = await propagateAtServ(noradId, tle.name, tle.line1, tle.line2, tle.epoch, new Date());
  if (!result.ok || !result.state) return null;
  return result.state;
}

/* Linear B-plane encounter trajectory (the standard short-encounter model).
 * Over the brief encounter the relative motion is a straight line along the
 * relative-velocity axis; the secondary passes the primary at the recorded
 * B-plane miss offset.  Returns samples { tOffsetSec, alongKm, xiKm, zetaKm, rangeKm }. */

/* Linear B-plane encounter trajectory'''

# Insert new_function before the Linear B-plane comment
# The Linear B-plane line starts with '/* Linear B-plane'
insert_pos = linear_bplane_idx

new_content = content[:insert_pos] + new_function + '\n' + content[insert_pos:]

with open('server/src/routes/conjunctions.ts', 'w', newline='') as f:
    f.write(new_content)

print(f"Inserted fetchSatState function before Linear B-plane comment at position {linear_bplane_idx}")
print(f"File now has {len(new_content)} chars")