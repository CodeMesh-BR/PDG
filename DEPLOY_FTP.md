# Deploy

> ## ⚙️ Deploy automático (CI/CD)
>
> O deploy agora é **automático via GitHub Actions** a cada push na branch
> `main` (`.github/workflows/deploy.yml`). O fluxo manual por FTP abaixo fica
> como referência/fallback.
>
> **Pipeline:** `test` (lint front `tsc --noEmit` + `php artisan test`) → e, se
> passar, `deploy-frontend` (build Vite + rsync do `dist/`) e `deploy-api`
> (rsync do Laravel + `composer install`/`migrate`/caches por SSH) em paralelo.
>
> ### Secrets no GitHub (Settings → Secrets and variables → Actions)
> | Secret | Valor |
> |---|---|
> | `SSH_HOST` | host do cPanel (ex.: `eihpostech.com` ou IP) |
> | `SSH_PORT` | porta SSH do cPanel (geralmente **não** é 22) |
> | `SSH_USER` | usuário do cPanel |
> | `SSH_PRIVATE_KEY` | chave privada SSH (par dedicado; a **pública** vai em cPanel → SSH Access → autorizar) |
> | `FRONTEND_PATH` | caminho absoluto do frontend, ex.: `/home/USER/eihpostech.com/PDG-DOM` |
> | `API_PATH` | caminho absoluto do Laravel, ex.: `/home/USER/api.eihpostech.com/laravel` |
>
> ### Bootstrap (passo único, manual via SSH — NÃO está no workflow)
> Na primeira instalação, ou ao recriar o ambiente, rode no servidor dentro de
> `API_PATH` (o workflow recorrente **não** faz isso para não regenerar a
> `APP_KEY` nem re-semear dados):
> ```bash
> php artisan key:generate --force
> php artisan migrate --force
> php artisan db:seed --force
> php artisan storage:link
> ```
> O `.env` de produção permanece no servidor e **não** é sobrescrito pelo deploy.
>
> ### Pré-requisitos a confirmar no servidor
> - `php` 8.2+ e `composer` disponíveis no PATH do SSH não-interativo (se não,
>   usar caminho completo, ex.: `/usr/local/bin/ea-php82`).
> - Porta SSH correta e chave pública autorizada no cPanel.

---

## Deploy manual (FTP/cPanel) — fallback

Arquitetura **separada** (dois endereços):

| Parte | URL | Pasta no servidor |
|---|---|---|
| **API (Laravel)** | `https://api.eihpostech.com` | `/api.eihpostech.com` (subdomínio) |
| **Frontend (SPA)** | `https://eihpostech.com/PDG-DOM` | `/eihpostech.com/PDG-DOM` |

O frontend (Vite/React) é estático e chama a API em
`https://api.eihpostech.com/api`. O CORS da API libera `https://eihpostech.com`.

---

## A) Frontend → `eihpostech.com/PDG-DOM`

### 1. Gerar o build (local)

No `PDG-APP`:
```bash
corepack enable
yarn install
yarn build
```
- O build usa `VITE_API_URL` de `PDG-APP/.env.production`
  (`https://api.eihpostech.com/api`).
- O `vite.config.ts` está com `base: "/PDG-DOM/"` e o router com
  `basename="/PDG-DOM"`, então o app funciona servido nessa subpasta.
- Saída em `PDG-APP/dist/` (inclui um `.htaccess` de fallback de SPA).

### 2. Enviar

Envie **todo o conteúdo de `PDG-APP/dist/`** para a pasta do servidor:
```
/eihpostech.com/PDG-DOM/
```
Deve conter, entre outros: `index.html`, `.htaccess`, `assets/`, `images/`.

> Como os assets têm hash no nome, em re-deploys convém limpar a pasta
> `PDG-DOM/` antes de subir o novo `dist/` (ou ao menos o `assets/`).

---

## B) API → `api.eihpostech.com`

### 1. Enviar o Laravel

Envie o projeto `PDG-API/api/laravel` para o servidor, com o **document root do
subdomínio `api.eihpostech.com` apontando para a pasta `public`** do Laravel
(cPanel → Domains → New Document Root, terminando em `/public`).

> ⚠️ **NÃO envie por FTP:**
> - **`vendor/`** — o upload de milhares de arquivos quase sempre vem incompleto
>   e quebra o autoload (ex.: faltar `polyfill-intl-grapheme/bootstrap80.php` →
>   500 genérico, sem log). **Rode `composer install` no servidor** (passo 3).
> - **`bootstrap/cache/*`** e **`storage/logs/*.log`** — vêm com caminhos do
>   ambiente local (`/var/www/html` do Docker) e causam 500. Suba o `storage/`
>   com as pastas vazias e limpe com `php artisan optimize:clear`.
>
> Confirme também que o **PHP é 8.2+** tanto na web (MultiPHP Manager) quanto no
> CLI (`php -v`).

Mantenha `.env`, `storage/app/private` e credenciais **fora** de pasta pública
(o `.env` fica na raiz do projeto, um nível acima do `public`).

### 2. `.env` no servidor

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.eihpostech.com

DB_CONNECTION=mysql
DB_HOST=localhost
DB_DATABASE=usuario_banco
DB_USERNAME=usuario_banco
DB_PASSWORD=senha_do_banco

CORS_ALLOWED_ORIGINS=https://eihpostech.com
```
`APP_KEY` e `JWT_SECRET` devem ser gerados/definidos (ver abaixo).

### 3. Comandos (SSH/Terminal)

```bash
cd ~/api.eihpostech.com/laravel        # raiz do projeto (onde está o artisan)

# vendor SEMPRE instalado no servidor (nunca por FTP):
rm -rf vendor                          # se já houver um vendor incompleto/corrompido
composer install --no-dev --optimize-autoloader
# se faltar memória: COMPOSER_MEMORY_LIMIT=-1 composer install --no-dev --optimize-autoloader

php artisan optimize:clear             # limpa caches herdados do ambiente local
php artisan key:generate --force
php artisan migrate --force
php artisan db:seed --force
php artisan storage:link
php artisan config:cache
php artisan route:cache
```

> Se algo der 500 sem aparecer no `storage/logs/laravel.log`, é erro antes do
> Laravel. Diagnostique com um arquivo temporário em `public/` contendo
> `<?php ini_set('display_errors',1); require __DIR__.'/../vendor/autoload.php';`
> e acesse pelo navegador para ver o fatal real (apague depois).

---

## C) Verificação

1. `https://api.eihpostech.com/api/auth/login` (POST) responde JSON.
2. `https://eihpostech.com/PDG-DOM/` carrega a SPA.
3. Login funciona de ponta a ponta (front → API → MySQL).
4. Navegar e dar refresh em rotas internas (ex.: `/PDG-DOM/companies`) continua
   na SPA, sem 404 (graças ao `.htaccess` de fallback).
