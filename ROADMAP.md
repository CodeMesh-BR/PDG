# Roadmap de Melhorias — PDG Dashboard

Levantado em auditoria de 2026-07 (backend Laravel, frontend Vite/React, CI/CD).
Cada item tem severidade e a evidência (arquivo:linha) que a comprova. Prioridade: segurança > confiabilidade/dados > qualidade > performance/UX > processo.

Legenda: 🔴 Crítico · 🟠 Alto · 🟡 Médio · ⚪ Baixo

## Fase 1 — Segurança (fazer primeiro)

- [ ] 🔴 **Sem autorização por role em nenhuma rota da API.** `auth:sanctum` (só autenticação) é o único gate em `routes/api.php`. Não existe Policy/Gate/middleware de role em lugar nenhum (`app/Http/Middleware/` nem existe). Qualquer usuário autenticado (inclusive `detailer`) pode chamar `POST /api/departments`, `DELETE /api/companies/{id}`, `DELETE /api/users/{id}`, etc. direto pela API, ignorando o que a UI esconde.
- [ ] 🔴 **`ServiceLogController::destroy` não verifica dono do registro.** (`app/Http/Controllers/ServiceLogController.php:142`) Qualquer usuário autenticado apaga o lançamento de serviço de qualquer outro usuário, bastando saber o ID.
- [ ] 🔴 **Sem rate limiting em `/auth/login` e `/auth/forgot-password`.** (`bootstrap/app.php:18-22`, `routes/api.php:16-17`) Nenhum middleware `throttle:` é usado em lugar nenhum do projeto — aberto a força bruta de senha e a spam do endpoint de reset.
- [ ] 🟠 **PDFs de contrato/certificado de funcionários ficam públicos sem autenticação.** `UserRegistrationController.php:44,49` salva no disco `public` (`storage/app/public`, exposto via `public/storage` symlink) — qualquer pessoa com o link baixa documentos de RH sem login.
- [ ] 🟠 **`.env.example` de produção usa `MAIL_MAILER=log`.** (`.env.example:52`) Se subir assim, "esqueci minha senha" nunca envia e-mail de verdade — a senha temporária só vai pro log em texto plano, e o usuário recebe a mensagem "e-mail enviado" mesmo sem receber nada.
- [ ] 🟡 **Reset de senha sobrescreve a senha antes de confirmar envio do e-mail.** (`AuthController.php:99-114`) Se o envio falhar, o usuário fica trancado fora da conta (senha antiga já foi destruída).
- [ ] 🟡 **`PlateOcrController` vaza mensagem de exceção crua pro cliente.** (`PlateOcrController.php:226`) Não é filtrado por `APP_DEBUG` — pode expor caminho de arquivo/erro interno de credencial do Google Vision.

## Fase 2 — Bugs de confiabilidade e integridade de dados

- [ ] 🟠 **Bug real: checagem de duplicata usa código de erro do Postgres num projeto MySQL.** `DepartmentController.php:34,61` e `ServiceController.php:38,113` checam `$e->getCode() === '23505'` (SQLSTATE do Postgres). MySQL usa `23000`/`1062` — confirmado correto em `UserRegistrationController.php:75`. Resultado: criar um Department/Service duplicado nunca cai no `catch`, vira erro 500 não tratado em vez do 409 esperado.
- [ ] 🟠 **Tela de editar lançamento de serviço está 100% quebrada.** Frontend (`start-service/api.ts:172-194`, usado em `start-service/[id]/edit/page.tsx:33,62`) chama `GET/PUT /service-logs/{id}`, mas essas rotas **não existem** em `routes/api.php` (só existem `POST`, `GET` index e `DELETE`). Toda tentativa de editar um lançamento dá 404.
- [ ] 🟠 **Deletar Company, Service ou User apaga o histórico de `service_logs` em cascata, sem aviso.** `CompanyController::destroy` (`:158-163`), `UserController::destroy` (`:113-121`) e `ServiceController::destroy` (`:121-129`) fazem `->delete()` puro; `service_logs` tem `cascadeOnDelete()` nas 3 FKs. Diferente de `DepartmentController::destroy`, que corretamente bloqueia a exclusão se houver vínculos.
- [ ] ⚪ `ServiceController::destroy` não trata a `QueryException` do FK `restrictOnDelete` de `companies.default_service_id` — apagar um serviço que é padrão de alguma empresa estoura erro 500 não tratado.
- [ ] ⚪ `users.role` não é validado contra uma lista fixa (`Rule::in`) — aceita qualquer string arbitrária no banco.

## Fase 3 — Qualidade de código e débito técnico

- [ ] 🟠 **Zero testes automatizados em todo o projeto.** Backend só tem o `ExampleTest` padrão do Laravel (`tests/Feature/ExampleTest.php`, `tests/Unit/ExampleTest.php`) — nenhum teste para nenhum controller. Frontend não tem nenhum `*.test.ts(x)`/config de vitest/jest — `yarn lint` é literalmente só `tsc --noEmit`, `eslint` está no `package.json` mas nunca é chamado por nenhum script.
- [ ] 🟠 **Fetch duplicado em 40+ lugares no frontend.** `src/lib/api.ts` só exporta `API_BASE_URL`/`apiUrl()` — não existe um client HTTP compartilhado. Cada hook (`useCompanies.ts`, `useDepartments.ts`, `useEmployees.ts`, `useServicesCatalog.ts`, etc.) reimplementa `localStorage.getItem("token")` + headers + `res.ok` + `res.json()` na mão. Já existe um mini-padrão bom em `start-service/api.ts:17-38` (`authHeaders()` + `request<T>()`) que não foi extraído pra reuso.
- [ ] 🟡 **Tipos `Service`/`Company` duplicados e divergentes entre telas.** `services-catalog/useServicesCatalog.ts` vs `start-service/types.ts` vs `companies/useCompanies.ts` definem o mesmo conceito de formas incompatíveis (ex.: `default_service_id` obrigatório num lugar, opcional em outro). `src/types/` existe mas só tem 2 arquivos triviais — nenhum tipo de domínio mora lá.
- [ ] 🟡 **Tratamento de erro inconsistente na UI, sem toast/notificação compartilhada.** Alguns hooks jogam `err.message` cru na tela (inglês técnico, ex. "Failed to fetch companies: Not Found"), outros mostram mensagem amigável em português, outros só logam no console. `FormAlert` existe mas só é usado em formulários, não em listas.
- [ ] 🟡 **`package-lock.json` e `yarn.lock` convivem e estão desatualizados um em relação ao outro** (último commit do `package-lock.json` é de 2025-11-05, o `yarn.lock` é de 2026-06-30 — quase 8 meses de defasagem). Projeto usa Yarn (`.yarnrc.yml`, `packageManager` no `package.json`) — `package-lock.json` deveria ser removido.
- [ ] 🟡 **`PDG-APP/dist/` (142 arquivos de build) está versionado no git.** É regenerado a cada deploy pela CI — deveria estar no `.gitignore`, não commitado.
- [ ] 🟡 **Não existe `.gitignore` na raiz do repo**, só um por subprojeto — foi por isso que `vendor/` (artefato de um `composer install` rodado na pasta errada, sem `composer.json` na raiz) e `.DS_Store` acabaram commitados na raiz.
- [ ] ⚪ **`PDG-APP/.env.production` está versionado e não é coberto pelo `.gitignore`** do projeto (só ignora `.env`/`.env*.local`). Hoje só tem uma URL, mas é uma armadilha pronta pra um futuro segredo vazar.
- [ ] ⚪ Resíduos do template Next.js original: `next.config.mjs` morto (Vite nunca lê), `"use client"` em 53 arquivos (sem efeito nenhum fora de Next), biblioteca `components/FormElements/*` com bom suporte a acessibilidade mas usada por só 1 tela — todos os formulários reais são `<select>`/`<input>` na mão.
- [ ] ⚪ `@types/react`/`@types/react-dom` presos na v18 enquanto o runtime é React 19 (`package.json`) — pode gerar tipagem incorreta silenciosa.

## Fase 4 — Performance e UX

- [ ] 🟠 **App inteiro é um bundle único de ~1.3MB, sem code-splitting.** `src/main.tsx:12-26` importa estaticamente as 15 páginas — zero `React.lazy` no projeto todo. Usuário baixa o dashboard inteiro só pra ver a tela de login.
- [ ] 🟡 **Queries de dashboard/relatório usam `whereDate('performed_at', ...)`, que não usa o índice existente.** (`DashboardController.php`, `ReportController.php`) O índice composto em `service_logs` tem `performed_at` como coluna final, e a função `DATE()` embutida invalida o uso do índice — full scan a cada carregamento, piora conforme a tabela cresce.
- [ ] 🟡 **Acessibilidade: nenhum formulário real tem `<label htmlFor>` ligado ao campo.** Confirmado em `StartServiceForm.tsx`, `departments/page.tsx`, `services-catalog` — 52 `<label>` no projeto, só 15 `htmlFor`, todos numa biblioteca de componentes que quase ninguém usa.
- [ ] 🟡 **Token expira em 10h e não há tratamento global.** Só o layout protegido detecta um 401 vindo de `/auth/me` e redireciona pro login; todo o resto das telas trata um token expirado como "erro genérico de fetch" em vez de deslogar o usuário.

## Fase 5 — Processo, CI/CD e observabilidade

- [ ] 🔴 **Deploy direto pra produção sem staging, sem gate de aprovação, com dois jobs paralelos que podem deixar o ambiente num estado misto.** `deploy-frontend` e `deploy-api` só dependem de `test`, rodam em paralelo sem depender um do outro — se um falhar e o outro não, frontend e backend podem ficar dessincronizados. A cadeia de comandos SSH do `deploy-api` não tem rollback automático se `migrate --force` falhar no meio.
- [ ] 🟠 **Sem CODEOWNERS, sem template de PR, sem Dependabot/Renovate.** Verificar também nas configurações do GitHub (não dá pra confirmar só pelo repo local) se `main` tem proteção de branch de fato, já que o workflow dispara em qualquer `push` pra `main`.
- [ ] 🟠 **Sem monitoramento de erros (Sentry/Bugsnag) em nenhum dos dois apps.** Log do Laravel é só arquivo plano no servidor (`storage/logs/laravel.log`), sem agregação nem alerta — um erro em produção hoje só aparece se alguém entrar por SSH e olhar o log manualmente.
- [ ] ⚪ README do backend está desatualizado: não documenta os endpoints de Departments nem o override de departamento em `service_logs` (feature que acabamos de implementar).
- [ ] ⚪ CI testa contra PHP 8.2 mas o Dockerfile de produção roda PHP 8.3 — drift pequeno, mas pode deixar passar uma incompatibilidade específica da 8.3.
