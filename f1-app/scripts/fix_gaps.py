import re

with open('../f1-api/app/api/live.py', 'r', encoding='utf-8') as f:
    content = f.read()

old_block = '''                            # Parse gap (scraped compound column was actually gap)
                            raw_gap = item.get('compound', '')
                            gap_val = 0.0
                            if '+' in raw_gap:
                                try:
                                    gap_val = float(raw_gap.replace('+', '').strip())
                                except:
                                    pass
                            
                            # Parse interval (scraped gap column was actually interval)
                            raw_int = item.get('gap', '')
                            int_val = 0.0
                            if '+' in raw_int:
                                try:
                                    int_val = float(raw_int.replace('+', '').strip())
                                except:
                                    pass'''

new_block = '''                            # Parse gap correctly from the accurate scraper
                            raw_gap = item.get('gap', '')
                            gap_val = 0.0
                            if '+' in raw_gap:
                                try:
                                    gap_val = float(raw_gap.replace('+', '').strip())
                                except:
                                    pass
                            
                            # Parse interval correctly from the accurate scraper
                            raw_int = item.get('interval', '')
                            int_val = 0.0
                            if '+' in raw_int:
                                try:
                                    int_val = float(raw_int.replace('+', '').strip())
                                except:
                                    pass'''

if old_block in content:
    content = content.replace(old_block, new_block)
    with open('../f1-api/app/api/live.py', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed gap and interval mappings!")
else:
    print("Block not found!")
