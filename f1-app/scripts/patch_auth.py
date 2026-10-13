with open('../f1-api/app/api/auth.py', 'r') as f:
    content = f.read()
    
content = content.replace('current_app.config.get("SECRET_KEY", "f1-secret-key-123")', 'current_app.config.get("SECRET_KEY") or "f1-secret-key-123"')

with open('../f1-api/app/api/auth.py', 'w') as f:
    f.write(content)
print("Patched auth.py")
