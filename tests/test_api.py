import importlib.util
import json
import os
import tempfile
import unittest
from pathlib import Path
from werkzeug.security import generate_password_hash

class ApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory()
        root = Path(cls.tmp.name)
        cls.schema = root / 'questionnaire.json'
        cls.schema.write_text(json.dumps({'ready': True, 'version': 'test-1', 'fields': [
            {'id': 'name', 'label': 'Nome', 'type': 'text', 'required': True},
            {'id': 'choice', 'label': 'Escolha', 'type': 'radio', 'options': ['A','B'], 'required': True}]}))
        os.environ.update(SECRET_KEY='test-secret', ADMIN_PASSWORD_HASH=generate_password_hash('test-password'), COOKIE_SECURE='false', DATABASE_PATH=str(root/'test.sqlite3'), QUESTIONNAIRE_PATH=str(cls.schema))
        spec = importlib.util.spec_from_file_location('main', '/app/main.py')
        cls.main = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(cls.main)
        cls.app = cls.main.app
        cls.app.config['TESTING'] = True

    def setUp(self):
        self.client = self.app.test_client()
        self.csrf = self.client.get('/api/session').json['csrf']

    def post(self, path, data):
        return self.client.post(path, json=data, headers={'X-CSRF-Token': self.csrf})

    def test_unauthenticated_data_blocked(self):
        self.assertEqual(self.client.get('/api/responses').status_code, 401)
        self.assertEqual(self.client.get('/api/export.csv').status_code, 401)

    def test_csrf_required(self):
        self.assertEqual(self.client.post('/api/login', json={}).status_code, 400)

    def test_invalid_choice_rejected(self):
        response = self.post('/api/responses', {'answers': {'name': 'Teste', 'choice':'C'}})
        self.assertIn('choice', response.json['errors'])

    def test_submission_admin_export_logout(self):
        response = self.post('/api/responses', {'answers': {'name': '=1+1', 'choice':'A'}})
        self.assertEqual(response.status_code, 201)
        login = self.post('/api/login', {'username':'admin', 'password':'test-password'})
        self.assertEqual(login.status_code, 200)
        self.csrf = login.json['csrf']
        listing = self.client.get('/api/responses').json
        self.assertGreater(listing['total'], 0)
        detail = self.client.get('/api/responses/'+listing['rows'][0]['id']).json
        self.assertEqual(detail['answers'][0]['value'], '=1+1')
        exported = self.client.get('/api/export.csv')
        self.assertIn("'=1+1", exported.data.decode())
        self.assertEqual(self.post('/api/logout', {}).status_code, 200)
        self.assertEqual(self.client.get('/api/responses').status_code, 401)

    def test_wrong_password(self):
        self.assertEqual(self.post('/api/login', {'username':'admin','password':'wrong'}).status_code, 401)

    def test_pending_does_not_accept_submissions(self):
        original = self.schema.read_text()
        try:
            self.schema.write_text('{"ready":false}')
            self.assertEqual(self.post('/api/responses', {'answers':{}}).status_code, 503)
        finally:
            self.schema.write_text(original)

if __name__ == '__main__':
    unittest.main()
