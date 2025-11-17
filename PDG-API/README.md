# PDG Dashboard — Laravel API (Docker)

API em **Laravel 11** embutida no projeto React (Vite), localizada em `src/api/laravel`.
Infra com **PHP 8.3 + Apache** e **PostgreSQL 16** via Docker.

---

## Requisitos

- WSL
- Docker Desktop (Windows/Mac/Linux)
- (Windows) Compartilhar a unidade do projeto nas _Settings → Resources → File Sharing_ do Docker
- Portas livres:
  - **8080** (HTTP da API)
  - **5432** (Postgres; se já tiver outro Postgres local, mude a porta — ver abaixo)

---

## Estrutura

```
project-root/
├─ docker-compose.yml
├─ api/
│  └─ laravel/              # <- raiz do projeto Laravel
│     ├─ .env
│     ├─ artisan
│     ├─ app/
│     ├─ bootstrap/
│     ├─ config/
│     ├─ database/
│     └─ public/
├─ docker/
│  └─ api/
│     ├─ Dockerfile         # PHP 8.3 + Apache + pdo_pgsql
│     └─ vhost.conf         # DocumentRoot /public + rewrite
```

---

## Instalar o composer e dependencias

> Execute os comandos no diretório raiz (onde está o `docker-compose.yml`).

### 1) Instalar o composer

```bash
sudo mv composer.phar /usr/local/bin/composer
```

### 2) Instalar dependencias

```bash
cd api/laravel
composer install
```

## Subir o ambiente Docker (Quick Start)

> Execute os comandos no diretório raiz (onde está o `docker-compose.yml`).

### 1) Subir containers

```bash
docker compose up -d --build
```

### 2) APP_KEY e caches

```bash
php artisan route:clear
php artisan route:cache
docker compose exec api php artisan key:generate
docker compose exec api php artisan optimize:clear
```

### 3) `.env` do Laravel (src/api/laravel/.env) (usar o .env.example se preferir)

```env
APP_NAME="PDG API"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8080

DB_CONNECTION=pgsql
DB_HOST=db
DB_PORT=5432
DB_DATABASE=pdg_dash
DB_USERNAME=postgres
DB_PASSWORD=postgres

CACHE_STORE=file
SESSION_DRIVER=file
QUEUE_CONNECTION=sync
```

### 4) Executar migrates do banco

```bash
docker compose exec api php artisan migrate
```

> **Dica:** se trocou usuário/senha do Postgres após o primeiro `up`, o volume pode ter credenciais antigas.
> Solução rápida (apaga dados): `docker compose down -v && docker compose up -d --build`

---

## Seeders de teste

### Rodar o seeding

```bash
# recria tabelas e roda seeders
docker compose exec api php artisan migrate:fresh --seed

# ou apenas rodar a classe específica
docker compose exec api php artisan db:seed --class=UserSeeder
```

```bash
# comandos adicionais para ter a certeza de cache clear
docker compose exec api php artisan optimize:clear
docker compose exec api php artisan config:clear
docker compose exec api php artisan migrate

# se aqui retornar as migrates, tudo está ok
docker compose exec api php artisan migrate:status
```

## Endpoints

Base URL: `http://localhost:8080`

### Gerar token

**POST** `/auth/login`

```json
{
	"email": "admin@example.com",
	"password": "admin12345"
}
```

Retorna access_token para ser usado como Bearer

### Criar usuário

**POST** `/api/users`

```form-data
----------------------------------------
Key                       | Type  | Value
----------------------------------------
display_name              | Text  | Nikolas
full_name                 | Text  | Nikolas Guimarães
email                     | Text  | nikolas@example.com
password                  | Text  | MinhaSenha123
role                      | Text  | worker
phone                     | Text  | +351900000000
address                   | Text  | Rua X
availability[0]           | Text  | mon
availability[1]           | Text  | tue
contract_pdf              | File  | contrato.pdf
work_certificate_pdf      | File  | certidao.pdf
```

### Listas usuários

**GET** `/api/users/` All users
**GET** `/api/users/{id}`

### Atualizar usuário (parcial)

**PATCH** `/api/users/{id}` _(ou PUT)_

```form-data
----------------------------------------
Key                       | Type  | Value
----------------------------------------
display_name              | Text  | Nikolas
full_name                 | Text  | Nikolas Guimarães
email                     | Text  | nikolas@example.com
password                  | Text  | MinhaSenha123
role                      | Text  | worker
phone                     | Text  | +351900000000
address                   | Text  | Rua X
availability[0]           | Text  | mon
availability[1]           | Text  | tue
contract_pdf              | File  | contrato.pdf
work_certificate_pdf      | File  | certidao.pdf
```

### Deletar usuário

**DELETE** `/api/users/{id}`

### Criar serviço

**POST** `/api/services`

```json
{
	"type": "Lavagem",
	"description": "Lavagem premium externa",
	"value": 125.5
}
```

### Listas serviços

**GET** `/api/services/` All services
**GET** `/api/services/{id}`

### Atualizar serviço (parcial)

**PATCH** `/api/services/{id}` _(ou PUT)_
Campos aceitos: `type`, `description`, `value`

### Deletar serviço

**DELETE** `/api/services/{id}`

---

### Criar Empresa

**POST** `/api/companies`

```json
{
	"name": "Loja Alpha",
	"display_name": "Alpha Central",
	"email": "alpha@example.com",
	"address": "Rua X, 123",
	"phone": "+351 900 000 000",
	"service_ids": [1, 3, 5]
}
```

### Listas empresa

**GET** `/api/companies/` All companies
**GET** `/api/companies/{id}`

### Atualizar empresa (parcial)

**PATCH** `/api/companies/{id}` _(ou PUT)_
Campos aceitos: `name`, `display_name`, `address`, `phone`, `service_ids[]`

### Deletar empresa

**DELETE** `/api/companies/{id}`

---

### Lançar serviço realizado

**POST** `/api/service-logs`

```json
{
	"company_id": 10,
	"service_id": 1,
	"car_plate": "ABC1234",
	"date": "2025-11-14",
	"quantity": 1,
	"notes": "Observação se necessário"
}
```

### Caso já exista o lançamento e mesmo assim será lançado novamente, deve-se utilizar o force

```json
{
	"company_id": 10,
	"service_id": 1,
	"car_plate": "ABC1234",
	"date": "2025-11-14",
	"quantity": 1,
	"notes": "Lançado novamente pois o gerente solicitou para fazer de novo",
	"force": true //para forçar repetidos
}
```

---

## DBeaver (opcional)

- Host: `localhost`
- Port: `5432` (ou a que você expôs no compose)
- Database: `pdg_dash`
- User: `postgres`
- Password: `postgres`

---

## Comandos úteis

```bash
# status
docker compose ps

# logs
docker compose logs -f api
docker compose logs -f db

# rotas Laravel
docker compose exec api php artisan route:list

# limpar cache
docker compose exec api php artisan optimize:clear
docker compose exec api php artisan cache:clear
docker compose exec api php artisan config:clear
docker compose exec api php artisan route:clear

# acessar tinker
docker compose exec api php artisan tinker

# criação de migrations, controller, model e seeds
docker compose exec api php artisan make:controller {controler name}
docker compose exec api php artisan make:migration {migration name}
docker compose exec api php artisan migrate:fresh --seed
docker compose exec api php artisan make:model {model name}

# permissões (cache/log)
docker compose exec api sh -lc 'chown -R www-data:www-data storage bootstrap/cache && chmod -R ug+rw storage bootstrap/cache'

# reset TOTAL (⚠️ apaga DB)
docker compose down -v && docker compose up -d --build

# entrar no bash do docker
docker exec -it pdg-api bash

# regenerate autoload
docker compose exec api composer dump-autoload --optimize
```

---

## Troubleshooting

- **404 nos endpoints**: cheque `bootstrap/app.php` com `->withRouting(...)`, Apache apontando para `/public` e `mod_rewrite` ativo.
- **405 (PATCH/PUT)**: confirme que existe rota `match(['put','patch'], '/users/{user}', ...)`.
- **409 ao criar**: email já existe (esperado). Mensagem: _Email already exists._
- **FATAL: password authentication failed**: volume do Postgres com credenciais antigas → `docker compose down -v && up -d --build`.
- **Could not open input file: artisan**: volume errado; monte `./src/api/laravel:/var/www/html`.
- **CORS**: ajuste `config/cors.php` (`allowed_origins`) e limpe configs.

# PADRÃO ENV

DB_CONNECTION=pgsql
DB_HOST=db
DB_PORT=5432
DB_DATABASE=pdg_dash
DB_USERNAME=postgres
DB_PASSWORD=postgres

# PADRÃO DOCKER COMPOSE YML

environment:
POSTGRES_DB: pdg_dash
POSTGRES_USER: postgres
POSTGRES_PASSWORD: postgres
