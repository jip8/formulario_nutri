import csv
import functools
import io
import json
import os
import secrets
import sqlite3
import time
from datetime import datetime, timezone
from pathlib import Path

from flask import Flask, Response, abort, request, session, send_from_directory, jsonify, redirect
from werkzeug.security import check_password_hash
from werkzeug.middleware.proxy_fix import ProxyFix

app = Flask(__name__, static_folder='web/assets', static_url_path='/assets')
app.config.update(SECRET_KEY=os.environ['SECRET_KEY'], MAX_CONTENT_LENGTH=64 * 1024,
                  SESSION_COOKIE_SECURE=os.getenv('COOKIE_SECURE', 'true') == 'true',
                  SESSION_COOKIE_HTTPONLY=True, SESSION_COOKIE_SAMESITE='Lax',
                  PERMANENT_SESSION_LIFETIME=3600)
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_for=1)
DB = os.getenv('DATABASE_PATH', '/data/responses.sqlite3')
SCHEMA = Path(os.getenv('QUESTIONNAIRE_PATH', '/app/questionnaire.json'))
ADMIN_USER = os.getenv('ADMIN_USER', 'admin')
ADMIN_HASH = os.environ['ADMIN_PASSWORD_HASH']

def db():
    con = sqlite3.connect(DB, timeout=15)
    con.row_factory = sqlite3.Row
    return con

Path(DB).parent.mkdir(parents=True, exist_ok=True)
with db() as con:
    con.executescript('''PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS responses (id TEXT PRIMARY KEY, created_at TEXT NOT NULL, version TEXT NOT NULL, answers TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS attempts (bucket TEXT PRIMARY KEY, count INTEGER NOT NULL, expires INTEGER NOT NULL);
    ''')

def questionnaire():
    return json.loads(SCHEMA.read_text())

def csrf_token():
    if 'csrf' not in session:
        session['csrf'] = secrets.token_urlsafe(32)
    return session['csrf']

app.jinja_env.globals['csrf_token'] = csrf_token

@app.before_request
def protect():
    if request.method == 'POST':
        expected = session.get('csrf', '')
        if not expected or not secrets.compare_digest(expected, request.headers.get('X-CSRF-Token', '')):
            abort(400, 'Sessão expirada. Recarregue a página e tente novamente.')

@app.after_request
def security(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['Referrer-Policy'] = 'same-origin'
    response.headers['Content-Security-Policy'] = "default-src 'self'; style-src 'self'; script-src 'self'; img-src 'self' data:; form-action 'self'; frame-ancestors 'none'; base-uri 'self'"
    response.headers['Cache-Control'] = 'no-store'
    return response

def throttle(kind, maximum, seconds):
    bucket = kind + ':' + request.remote_addr
    now = int(time.time())
    with db() as con:
        con.execute('DELETE FROM attempts WHERE expires < ?', (now,))
        con.execute('INSERT INTO attempts VALUES (?, 1, ?) ON CONFLICT(bucket) DO UPDATE SET count=count+1', (bucket, now + seconds))
        count = con.execute('SELECT count FROM attempts WHERE bucket=?', (bucket,)).fetchone()['count']
    if count > maximum:
        abort(429, 'Muitas tentativas. Aguarde alguns minutos e tente novamente.')

def authenticated(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        if not session.get('admin'):
            abort(401, 'Faça login para consultar as respostas.')
        return func(*args, **kwargs)
    return wrapper

@app.get('/healthz')
def health():
    with db() as con:
        con.execute('SELECT 1')
    return {'status': 'ok', 'questionnaire_ready': questionnaire().get('ready', False)}

@app.get('/')
@app.get('/admin')
@app.get('/admin/login')
@app.get('/admin/respostas/<response_id>')
def index(response_id=None):
    return send_from_directory('/app/web', 'index.html')

@app.get('/jogo.html')
def game():
    return redirect('https://www.canva.com/design/DAHX9XQK3eA/THxikF8wYpPHDMHFikUiyQ/edit')

@app.get('/media/<path:filename>')
def media(filename):
    return send_from_directory('/app/web/media', filename)

@app.get('/api/session')
def get_session():
    return {'admin': bool(session.get('admin')), 'csrf': csrf_token()}

@app.get('/api/questionnaire')
def get_questionnaire():
    return questionnaire()

@app.post('/api/login')
def login():
    throttle('login', 10, 900)
    data = request.get_json() or {}
    password = data.get('password', '')
    username = data.get('username', '')
    if not isinstance(password, str) or not isinstance(username, str):
        abort(400)
    valid = check_password_hash(ADMIN_HASH, password)
    if not (secrets.compare_digest(username, ADMIN_USER) and valid):
        abort(401, 'Usuário ou senha incorretos.')
    session.clear()
    session['admin'] = True
    session.permanent = True
    return get_session()

@app.post('/api/logout')
@authenticated
def logout():
    session.clear()
    return get_session()

@app.post('/api/responses')
def submit():
    q = questionnaire()
    if not q.get('ready'):
        abort(503, 'O questionário ainda não está disponível.')
    throttle('submit', 10, 3600)
    data = request.get_json() or {}
    if data.get('website'):
        abort(400)
    incoming = data.get('answers', {})
    if not isinstance(incoming, dict):
        abort(400)
    errors, values = {}, {}
    for field in q['fields']:
        key = field['id']
        value = incoming.get(key, [] if field['type'] == 'checkbox' else '')
        if field['type'] == 'checkbox':
            if not isinstance(value, list) or len(value) > 100 or any(not isinstance(v, str) for v in value):
                abort(400)
        else:
            if not isinstance(value, str):
                abort(400)
            value = value.strip()
        values[key] = value
        if field.get('required') and not value:
            errors[key] = 'Preencha este campo.'
        elif isinstance(value, str) and len(value) > field.get('max_length', 5000):
            errors[key] = 'Resposta muito longa.'
        elif field.get('options') and any(v not in field['options'] for v in (value if isinstance(value, list) else [value]) if v):
            errors[key] = 'Selecione uma opção válida.'
        elif field['type'] == 'email' and value and ('@' not in value or '.' not in value.split('@')[-1] or ' ' in value):
            errors[key] = 'Informe um e-mail válido.'
    if errors:
        return {'errors': errors}
    answers = [{'label': f['label'], 'value': values[f['id']]} for f in q['fields']]
    with db() as con:
        con.execute('INSERT INTO responses VALUES (?, ?, ?, ?)',
                    (secrets.token_hex(12), datetime.now(timezone.utc).isoformat(), q['version'], json.dumps(answers, ensure_ascii=False)))
    return {'ok': True}, 201

@app.get('/api/responses')
@authenticated
def admin():
    page = max(1, request.args.get('page', 1, type=int))
    with db() as con:
        total = con.execute('SELECT count(*) FROM responses').fetchone()[0]
        rows = con.execute('SELECT id, created_at, version FROM responses ORDER BY created_at DESC LIMIT 25 OFFSET ?', ((page - 1) * 25,)).fetchall()
    return {'total': total, 'rows': [dict(row) for row in rows]}

@app.get('/api/responses/<response_id>')
@authenticated
def detail(response_id):
    with db() as con:
        row = con.execute('SELECT * FROM responses WHERE id=?', (response_id,)).fetchone()
    if row is None:
        abort(404)
    result = dict(row)
    result['answers'] = json.loads(result['answers'])
    return result

@app.get('/api/export.csv')
@authenticated
def export():
    def safe(value):
        value = str(value)
        return "'" + value if value.lstrip().startswith(('=', '+', '-', '@')) else value
    def generate():
        yield '\ufeff'
        out = io.StringIO()
        writer = csv.writer(out)
        writer.writerow(['ID', 'Data UTC', 'Versão', 'Pergunta', 'Resposta'])
        yield out.getvalue()
        with db() as con:
            for row in con.execute('SELECT * FROM responses ORDER BY created_at DESC'):
                for answer in json.loads(row['answers']):
                    out.seek(0); out.truncate(0)
                    value = answer['value']
                    writer.writerow([row['id'], row['created_at'], safe(row['version']), safe(answer['label']), safe('; '.join(value) if isinstance(value, list) else value)])
                    yield out.getvalue()
    return Response(generate(), mimetype='text/csv', headers={'Content-Disposition': 'attachment; filename=respostas.csv'})

@app.errorhandler(400)
@app.errorhandler(401)
@app.errorhandler(404)
@app.errorhandler(413)
@app.errorhandler(415)
@app.errorhandler(429)
@app.errorhandler(503)
def error_page(error):
    return jsonify(error=error.description), error.code
