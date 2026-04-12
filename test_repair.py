import re

with open('frontend/main.py', 'r', encoding='utf-8') as f:
    c = f.read()

# Replace elevated buttons with basic setup
c = re.sub(r'ft\.ElevatedButton\("Войти", on_click=login_click, bgcolor=[^,]+, color=[^\)]+\)', 'ft.ElevatedButton("Войти", on_click=login_click)', c)
c = re.sub(r'ft\.ElevatedButton\("Зарегистрироваться", on_click=reg_click, bgcolor=[^,]+, color=[^\)]+\)', 'ft.ElevatedButton("Зарегистрироваться", on_click=reg_click)', c)

# Replace broken icon just in case
c = c.replace('"nature_people"', '"person"')

# Replace TextFields with basic
c = c.replace('border_color=UGRA_BLUE', 'bgcolor=ft.Colors.TRANSPARENT')

with open('frontend/main.py', 'w', encoding='utf-8') as f:
    f.write(c)
