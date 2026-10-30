#!/usr/bin/env python3
"""Create local configuration without overwriting existing credentials."""
import hashlib
import os
import secrets
from pathlib import Path

root = Path(__file__).resolve().parent.parent
env_path = root / '.env'
credentials_path = root / 'credentials.txt'
if env_path.exists() or credentials_path.exists():
    raise SystemExit('Configuração existente: .env e credentials.txt não foram alterados.')

password = secrets.token_urlsafe(24)
salt = secrets.token_hex(16)
digest = hashlib.scrypt(password.encode(), salt=salt.encode(), n=32768, r=8, p=1,
                        maxmem=64 * 1024 * 1024).hex()
password_hash = f'scrypt:32768:8:1${salt}${digest}'
# Single quotes preserve dollar signs when Docker Compose reads this env file.
configuration = (f'SECRET_KEY={secrets.token_hex(48)}\nADMIN_USER=admin\n'
                 f"ADMIN_PASSWORD_HASH='{password_hash}'\nCOOKIE_SECURE=true\n")
for path, text in [(env_path, configuration), (credentials_path,
                  f'Usuário: admin\nSenha: {password}\n')]:
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'w') as file:
        file.write(text)
print('Configuração criada. Consulte as credenciais em credentials.txt.')
