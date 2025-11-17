import re
import sys

# Read the file
with open('src/tools/widget-tools.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Find all schema registrations that need fixing
# Pattern: server.tool("name", "desc", someSchema, ...
pattern = r'(server\.tool\(\s*"[^"]+",\s*"[^"]+",\s*)(\w+Schema)(\s*,)'

def replace_func(match):
    return f"{match.group(1)}{match.group(2)}.shape{match.group(3)}"

# Replace all occurrences
content = re.sub(pattern, replace_func, content)

# Write back
with open('src/tools/widget-tools.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed widget-tools.ts")
