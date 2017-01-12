# api-severless
Serverless api gateway 

## Development
1. Start hydra locally (expects hydra to be installed in your path)
```bash
env PORT='443' FORCE_ROOT_CLIENT_CREDENTIALS='8c97eaed-f270-4b2f-9930-03f85160612a:MxGdwYBLZw7qFkUKCFQUeNyvher@jpC]' HTTPS_TLS_CERT_PATH='server.crt' HTTPS_TLS_KEY_PATH='key.pem' hydra host
```
2. Run tests `npm test` or `mocha test/**/*.js`
