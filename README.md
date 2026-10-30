# Cheguei! — Formulário Nutri

Cartilha interativa sobre alimentação infantil, com identidade de caderno de descobertas, atividades e questionário de feedback.

**Site:** https://formulario.jipdev.cloud · **Administração:** https://formulario.jipdev.cloud/admin

## Recursos

- Comparação entre recusa alimentar passageira e seletividade alimentar.
- Escalada do comer em SVG/CSS e três atividades sensoriais.
- Formas de preparo com navegação por toque ou teclado.
- Prato ilustrado inteiramente em SVG: 50% vegetais, 25% cereais/tubérculos e 25% compartilhados entre proteínas e leguminosas.
- Sugestões de trocas, seção do Instagram, jogo no Canva e créditos acadêmicos Uceff.
- Quatro perguntas de feedback, painel autenticado, paginação, detalhes e exportação CSV.

A interface usa React, Vite e React Icons. O backend usa Flask/Gunicorn e SQLite em volume persistente. Docker Compose executa a aplicação; o Nginx do servidor oferece HTTPS com certificado Let's Encrypt. As fontes são locais, com pesos reais de seminegrito e negrito. A interface respeita movimento reduzido.

## Instalação

Requisitos: Docker com Compose e Python 3 para gerar a configuração.

```sh
git clone https://github.com/jip8/formulario_nutri.git
cd formulario_nutri
python3 deploy/init-env.py
docker compose up -d --build
docker compose ps
```

O script gera `.env` com chave de sessão e hash de senha, além de `credentials.txt` com o acesso inicial. Ambos têm permissão `600` e ficam fora do Git. O script recusa sobrescrever uma configuração existente. `.env.example` descreve as variáveis necessárias.

A aplicação escuta em `127.0.0.1:18500`. A porta fica restrita ao próprio servidor, onde o Nginx faz o proxy. Os cookies são seguros por padrão; o login exige HTTPS. Para um ambiente local isolado via HTTP, altere `COOKIE_SECURE=false` no `.env` e recrie o container.

## Nginx e HTTPS

As configurações estão em `deploy/nginx-http.conf` e `deploy/nginx-https.conf`. O domínio é `formulario.jipdev.cloud`.

No servidor de produção, o projeto está em `/root/projects/formulario`, o registro DNS A aponta para `143.95.171.121` e o Nginx usa o proxy local na porta `18500`. O script `deploy/enable-https.sh` foi preparado para esse caminho e endereço; ajuste-os se instalar em outro servidor.

Na primeira instalação do domínio, crie `/var/www/formulario-acme`, instale a configuração HTTP em `sites-available` e habilite-a em `sites-enabled`. Depois, com Nginx e Certbot instalados e DNS apontando para o servidor:

```sh
./deploy/enable-https.sh
```

O script emite o certificado pelo webroot, valida a configuração e recarrega o Nginx. O servidor deve manter o timer de renovação do Certbot e um deploy hook que valide/recarregue o Nginx após renovar o certificado.

## Operação

```sh
docker compose up -d --build
docker compose logs --tail 100
curl -f http://127.0.0.1:18500/healthz
```

`app/questionnaire.json` define a versão e os campos. Ele é montado somente para leitura no container; editar seu conteúdo atualiza o questionário sem rebuild. Cada envio preserva sua versão e os rótulos das perguntas. Para alterar as credenciais, atualize o hash no `.env` e recrie o container. Trocar a chave de sessão invalida sessões existentes.

As imagens de referência do DOCX não são publicadas: a escada e o prato foram recriados com SVG/CSS. O print do Instagram e a fotografia do jogo usados na cartilha foram extraídos do material fornecido. O link do jogo aponta para o Canva indicado pelo responsável pelo projeto.

## Verificação

Testes da API, com banco temporário separado:

```sh
docker compose run --rm -v "$PWD/tests:/tests:ro" app python -m unittest discover -s /tests -v
```

Os scripts `tests/browser.cjs` e `tests/alignment.cjs` verificam a interface e as proporções do SVG. Exigem Playwright e Chromium instalados. O módulo pode estar em `frontend/node_modules` ou ser indicado em `PLAYWRIGHT_MODULE`. `FORMULARIO_ROOT` pode alterar a raiz do projeto; os artefatos são gerados em `artifacts/`, fora do Git.

Para testar o fluxo de envio sem criar respostas reais, inicie um container temporário:

```sh
docker compose run -d --rm --name formulario-qa \
  -p 127.0.0.1:18501:8000 \
  -e COOKIE_SECURE=false -e DATABASE_PATH=/tmp/qa.sqlite3 app
node tests/browser.cjs
node tests/alignment.cjs
docker stop formulario-qa
```

O teste de navegador usa as credenciais locais de `credentials.txt`. `QA_BASE` altera o endereço dos testes, cujo padrão é `http://127.0.0.1:18501`. Os testes de envio devem sempre usar o banco temporário.

## Backup

```sh
mkdir -p backups
docker compose exec -T app python -c "import sqlite3; c=sqlite3.connect('/data/responses.sqlite3'); b=sqlite3.connect('/tmp/backup.sqlite3'); c.backup(b); b.close()"
docker compose cp app:/tmp/backup.sqlite3 backups/responses.sqlite3
```

Preserve o volume `formulario_responses`: `docker compose down -v` apaga as respostas. Bancos, backups, credenciais, documentos de referência, dependências e artefatos locais não fazem parte deste repositório.
