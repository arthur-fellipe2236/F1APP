import re

path = '../f1-app/src/index.css'
with open(path, 'r') as f:
    content = f.read()

dark_overrides = '''
/* Dark Mode Overrides for Team Themes */
.dark .theme-ferrari, .theme-ferrari.dark {
  --primary: #FF284B;
  --primary-foreground: #FFFFFF;
  --ring: #FF284B;
}
.dark .theme-mclaren, .theme-mclaren.dark {
  --primary: #FF9933;
  --primary-foreground: #000000;
  --ring: #FF9933;
}
.dark .theme-mercedes, .theme-mercedes.dark {
  --primary: #66FFEA;
  --primary-foreground: #000000;
  --ring: #66FFEA;
}
.dark .theme-redbull, .theme-redbull.dark {
  --primary: #4A6BFF; /* Brighter blue for dark mode visibility */
  --primary-foreground: #FFFFFF;
  --ring: #4A6BFF;
}
.dark .theme-aston, .theme-aston.dark {
  --primary: #34D399; /* Brighter green for dark mode visibility */
  --primary-foreground: #000000;
  --ring: #34D399;
}
'''

if 'Dark Mode Overrides for Team Themes' not in content:
    with open(path, 'a') as f:
        f.write(dark_overrides)
        print('Added dark mode overrides!')
else:
    print('Already added!')
