with open("../f1-api/app/api/drivers.py", "r") as f:
    c = f.read()

c = c.replace("query = query.filter(Driver.last_name.in_(last_names))", 'query = query.filter(Driver.last_name.in_(last_names), Driver.first_name != "Jos")')

with open("../f1-api/app/api/drivers.py", "w") as f:
    f.write(c)
print("Removed Jos.")
