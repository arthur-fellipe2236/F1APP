import re
html = open('../f1-api/app/api/row_html.txt').read()
attrs = set(re.findall(r'data-[a-z-]+="[^"]+"', html))
for attr in attrs:
    print(attr)
