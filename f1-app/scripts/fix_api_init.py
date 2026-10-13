import re

with open('../f1-api/app/api/__init__.py', 'r') as f:
    lines = f.readlines()

filtered = [line for line in lines if 'from . import admin' not in line and 'bp.register_blueprint' not in line]

content = "".join(filtered)
if "admin," not in content:
    content = content.replace('auth,', 'auth,\n        admin,')

with open('../f1-api/app/api/__init__.py', 'w') as f:
    f.write(content)
print("Fixed __init__.py")
