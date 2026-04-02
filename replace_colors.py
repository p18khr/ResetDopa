#!/usr/bin/env python3
import os

# Read the file
file_path = r'C:\dev\dopaReset1\docs\index.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Count original occurrences
count1 = content.count('#00FF41')
count2 = content.count('rgba(0, 255, 65,')

print(f"Original file statistics:")
print(f"  - Found {count1} instances of '#00FF41'")
print(f"  - Found {count2} instances of 'rgba(0, 255, 65,'")
print()

# Perform replacements
updated_content = content.replace('#00FF41', '#00E5FF')
updated_content = updated_content.replace('rgba(0, 255, 65,', 'rgba(0, 229, 255,')

# Verify replacements
new_count1 = updated_content.count('#00FF41')
new_count2 = updated_content.count('rgba(0, 255, 65,')

print(f"After replacement:")
print(f"  - Remaining '#00FF41': {new_count1}")
print(f"  - Remaining 'rgba(0, 255, 65,': {new_count2}")
print()

# Check new values exist
new_count1_replaced = updated_content.count('#00E5FF')
new_count2_replaced = updated_content.count('rgba(0, 229, 255,')

print(f"New values inserted:")
print(f"  - '#00E5FF': {new_count1_replaced} instances")
print(f"  - 'rgba(0, 229, 255,': {new_count2_replaced} instances")
print()

# Write back to file
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(updated_content)

print("✓ File updated successfully!")
