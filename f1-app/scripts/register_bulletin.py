import re
with open('../f1-api/app/api/__init__.py', 'r') as f:
    content = f.read()

if 'bulletin,' not in content:
    content = content.replace('admin,', 'admin,\n        bulletin,')
    with open('../f1-api/app/api/__init__.py', 'w') as f:
        f.write(content)
print("Registered bulletin")
