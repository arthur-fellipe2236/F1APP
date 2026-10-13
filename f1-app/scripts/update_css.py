import re

with open('../f1-app/src/index.css', 'a') as f:
    f.write('''
/* Team Themes */
.theme-ferrari {
  --primary: #E8002D;
  --primary-foreground: #FFFFFF;
  --ring: #E8002D;
}
.theme-mclaren {
  --primary: #FF8000;
  --primary-foreground: #000000;
  --ring: #FF8000;
}
.theme-mercedes {
  --primary: #27F4D2;
  --primary-foreground: #000000;
  --ring: #27F4D2;
}
.theme-redbull {
  --primary: #0600EF;
  --primary-foreground: #FFFFFF;
  --ring: #0600EF;
}
.theme-aston {
  --primary: #229971;
  --primary-foreground: #FFFFFF;
  --ring: #229971;
}
''')
