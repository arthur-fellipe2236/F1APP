import re

with open('../f1-api/app/api/live.py', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('"session_key": 99999,', '"session_key": 11727,')
with open('../f1-api/app/api/live.py', 'w', encoding='utf-8') as f:
    f.write(content)
