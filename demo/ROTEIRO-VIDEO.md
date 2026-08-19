# Roteiro completo do vídeo de apresentação

Este roteiro foi preparado para uma gravação de aproximadamente **12 a 16 minutos**. Ele cobre todas as telas, funcionalidades obrigatórias, tratamento de falhas, banco de dados, arquitetura, Angular, RxJS, bibliotecas, backend, concorrência e idempotência.

Se houver limite de tempo, use a versão resumida no final deste documento.

## 1. Objetivo do vídeo

Ao terminar o vídeo, o avaliador deve ter visto:

- cadastro e persistência de produtos;
- criação de nota fiscal com numeração sequencial e status inicial Aberta;
- inclusão de vários produtos e suas quantidades;
- processamento da impressão;
- mudança da nota para Fechada;
- atualização dos saldos;
- bloqueio de uma segunda impressão;
- falha simulada de um microsserviço;
- recuperação após a falha, sem inconsistência de dados;
- arquitetura com dois microsserviços e dois bancos físicos;
- ciclos de vida do Angular;
- uso de Signals e RxJS;
- bibliotecas utilizadas;
- validação e tratamento de erros no backend;
- transações, concorrência e idempotência;
- justificativa para Golang, C# e LINQ não se aplicarem.

## 2. Preparação antes de gravar

### 2.1 Ambiente

Use preferencialmente:

- resolução de 1920 × 1080;
- navegador com zoom em 100%;
- terminal e editor com fonte entre 16 e 18 px;
- notificações do Windows desativadas;
- microfone testado e cursor visível;
- navegador sem abas pessoais abertas.

Feche processos Node antigos antes da gravação:

```powershell
Get-Process node -ErrorAction SilentlyContinue | Stop-Process
```

Entre na pasta e valide o projeto:

```powershell
cd "C:\Users\jpaul\OneDrive\Documentos\ChatGPT\Teste"
npm test
npm run build
npm run dev
```

O resultado esperado é:

```text
Estoque: 6 testes aprovados
Faturamento: 6 testes aprovados
Estoque disponível em http://localhost:3001
Faturamento disponível em http://localhost:3002
Local: http://localhost:4200
```

Abra previamente:

1. `http://localhost:4200/produtos`;
2. `http://localhost:4200/notas`;
3. `README.md`;
4. `frontend/src/main.ts`;
5. `frontend/src/app/products/products.component.ts`;
6. `frontend/src/app/invoices/invoices.component.ts`;
7. `frontend/src/app/core/api.service.ts`;
8. `frontend/src/app/core/error.interceptor.ts`;
9. `services/stock-service/src/app.js`;
10. `services/billing-service/src/app.js`;
11. os dois arquivos `db.js`.

### 2.2 Dados sugeridos

| Código | Descrição | Saldo inicial |
|---|---|---:|
| `PRD-DEMO-01` | Teclado mecânico | 10 |
| `PRD-DEMO-02` | Mouse sem fio | 5 |
| `PRD-DEMO-03` | Monitor 24 polegadas | 1 |

Se esses códigos já existirem, acrescente um número ao final.

### 2.3 Ensaio

Faça uma gravação curta sem áudio e confirme que o modal aparece inteiro, o indicador “Processando” fica visível, o diálogo de impressão abre, mensagens aparecem e nenhum dado pessoal é exibido.

## 3. Cronograma sugerido

| Tempo | Conteúdo |
|---|---|
| 00:00–00:45 | Apresentação e objetivo |
| 00:45–01:40 | Arquitetura e tecnologias |
| 01:40–03:20 | Cadastro de produtos |
| 03:20–05:00 | Criação da nota fiscal |
| 05:00–06:40 | Impressão, fechamento e saldo |
| 06:40–08:20 | Falha e recuperação |
| 08:20–09:20 | Concorrência e idempotência |
| 09:20–12:30 | Angular, RxJS e frontend |
| 12:30–14:30 | Backend, banco e erros |
| 14:30–15:30 | Testes, bibliotecas e encerramento |

## 4. Roteiro detalhado, cena por cena

### Cena 1 — Apresentação

**Tempo:** 00:00–00:45  
**Mostrar:** aplicação aberta em Produtos.

**Fala sugerida:**

> Olá. Neste vídeo vou apresentar a solução desenvolvida para o teste técnico. O sistema permite cadastrar produtos, controlar saldos, criar notas fiscais com múltiplos itens e processar a impressão. A impressão fecha a nota e realiza a baixa do estoque. Também implementei tratamento de falhas entre microsserviços, persistência em banco de dados, controle de concorrência e idempotência.

**Ações:** passe lentamente pelo menu, aponte para Produtos, Notas fiscais e o indicador de serviços.

### Cena 2 — Arquitetura

**Tempo:** 00:45–01:40  
**Mostrar:** diagrama do README e terminal.

**Fala sugerida:**

> A solução possui três processos. O frontend foi construído em Angular 21 e executa na porta 4200. O microsserviço de Estoque executa na porta 3001 e controla produtos e baixas. O microsserviço de Faturamento executa na porta 3002 e controla notas e itens. Cada microsserviço possui seu próprio banco SQLite físico, mantendo separação de responsabilidades e dados.

> O Angular utiliza um proxy. Chamadas `/api/stock` são encaminhadas ao Estoque e `/api/billing` ao Faturamento. A comunicação entre os microsserviços ocorre por HTTP e JSON.

**Mostrar este diagrama:**

```text
Angular :4200 ──┬── Estoque :3001 ── SQLite stock.db
                └── Faturamento :3002 ── SQLite billing.db
                          │
                          └── HTTP ──> Estoque
```

Depois, mostre as três mensagens de inicialização no terminal.

### Cena 3 — Visão geral de Produtos

**Tempo:** 01:40–02:00

**Fala sugerida:**

> Esta é a tela de produtos. Os indicadores mostram produtos cadastrados, unidades disponíveis e itens com estoque baixo. A lista é carregada da API; os dados não ficam somente na memória do navegador.

**Ações:** aponte para cards, tabela e botão de atualização.

### Cena 4 — Validação do produto

**Tempo:** 02:00–02:25

**Fala sugerida:**

> Código, descrição e saldo são obrigatórios. O saldo precisa ser inteiro e não negativo. Existe validação no frontend para feedback imediato e outra no backend com Zod, porque não é seguro confiar somente no navegador.

**Ações:** abra “Novo produto”, tente campos vazios, descrição com um caractere e saldo `-1`.

### Cena 5 — Cadastro e persistência

**Tempo:** 02:25–03:20

**Fala sugerida:**

> Vou cadastrar três produtos. O código é normalizado para maiúsculas e existe restrição de unicidade no banco.

**Ações:**

1. Cadastre `PRD-DEMO-01`, `Teclado mecânico`, saldo `10`.
2. Cadastre `PRD-DEMO-02`, `Mouse sem fio`, saldo `5`.
3. Cadastre `PRD-DEMO-03`, `Monitor 24 polegadas`, saldo `1`.
4. Mostre o selo de estoque baixo do monitor.
5. Atualize completamente a página.

**Fala após atualizar:**

> Os registros continuam disponíveis depois da atualização, confirmando persistência física no SQLite e não apenas estado do Angular.

### Cena 6 — Criação da nota

**Tempo:** 03:20–05:00

**Fala sugerida:**

> Na tela de notas, a numeração é gerada pelo backend dentro de uma transação. O status inicial é sempre Aberta. O usuário escolhe produtos previamente cadastrados e informa as quantidades.

**Ações:**

1. Abra Notas fiscais e clique em “Nova nota fiscal”.
2. Adicione 2 unidades do teclado.
3. Adicione 1 unidade do mouse.
4. Mostre o resumo dos dois itens.
5. Clique em “Emitir nota aberta”.
6. Aponte para número, quantidade de itens e status Aberta.

**Fala sugerida:**

> Na criação, Faturamento consulta Estoque para validar cada produto e obter código, descrição e saldo oficiais. Ele não confia nos textos enviados pelo frontend.

### Cena 7 — Impressão e fechamento

**Tempo:** 05:00–06:10

**Fala sugerida:**

> A impressão só está disponível para notas abertas. Ao clicar, o Angular bloqueia os botões e mostra o processamento. O Faturamento solicita ao Estoque a baixa. O Estoque valida todos os saldos e realiza as alterações em uma única transação.

**Ações:**

1. Mostre o status Aberta e clique em “Imprimir”.
2. Mostre “Processando”.
3. No diálogo nativo, mostre número, data, itens e total.
4. Cancele o diálogo para não gerar papel ou PDF.
5. Mostre a nota Fechada e o botão desabilitado.

**Fala sugerida:**

> Depois da confirmação do Estoque, Faturamento fecha a nota. O Angular monta uma folha exclusiva e abre o diálogo nativo. Cancelar a impressão física não desfaz o processamento fiscal já concluído.

### Cena 8 — Conferência dos saldos

**Tempo:** 06:10–06:40

**Ações:** volte a Produtos e mostre teclado com 8 e mouse com 4.

**Fala sugerida:**

> O teclado passou de 10 para 8 e o mouse de 5 para 4. Essa atualização foi feita pelo serviço de Estoque, não diretamente pelo frontend.

### Cena 9 — Segunda nota

**Tempo:** 06:40–07:15

**Ações:** crie outra nota com 1 teclado, mostre o próximo número e o status Aberta.

**Fala sugerida:**

> Vou criar uma segunda nota para demonstrar falha temporária. A numeração avançou automaticamente e a nota iniciou Aberta.

### Cena 10 — Falha do microsserviço

**Tempo:** 07:15–07:50

**Ações:** clique “Simular falha”, depois “Imprimir”, mostre erro e status ainda Aberta.

**Fala sugerida:**

> A simulação faz a próxima baixa retornar HTTP 503. Faturamento não fecha a nota; o usuário recebe mensagem clara e pode tentar novamente. Como a baixa não ocorreu, nenhum saldo é alterado.

### Cena 11 — Recuperação

**Tempo:** 07:50–08:20

**Ações:** tente imprimir novamente, cancele o diálogo, mostre nota Fechada e teclado com saldo 7.

**Fala sugerida:**

> Na segunda tentativa o serviço se recuperou. A nota fecha e o saldo passa de 8 para 7. Não é preciso recriar a nota e não ocorre baixa duplicada.

### Cena 12 — Concorrência

**Tempo:** 08:20–08:50  
**Mostrar:** transação em `stock-service/src/app.js`.

**Fala sugerida:**

> Todos os itens são verificados e atualizados dentro de uma transação SQLite. O banco usa WAL e espera controlada para bloqueios. Se duas notas tentarem consumir simultaneamente um produto com saldo 1, as escritas são serializadas: a primeira pode concluir e a segunda recebe 409 ao encontrar o saldo atualizado. A constraint também impede saldo negativo.

**Destaque:**

```js
const transaction = db.transaction(() => {
  // valida todos os saldos
  // atualiza todos os produtos
});
```

```sql
balance INTEGER NOT NULL CHECK (balance >= 0)
```

### Cena 13 — Idempotência

**Tempo:** 08:50–09:20

**Fala sugerida:**

> Cada impressão envia uma chave `invoice:id:print`. Estoque armazena essa chave em coluna única. Repetição por clique duplo, timeout ou retransmissão devolve o resultado anterior sem nova baixa. Um hash dos itens impede reutilizar a chave com conteúdo diferente.

**Destaque:**

```js
idempotencyKey: `invoice:${invoice.id}:print`
```

```sql
idempotency_key TEXT NOT NULL UNIQUE
```

### Cena 14 — Inicialização e rotas Angular

**Tempo:** 09:20–09:55  
**Mostrar:** `main.ts` e `app.routes.ts`.

**Fala sugerida:**

> O frontend utiliza componentes standalone. `main.ts` inicializa o componente principal, registra rotas, cliente HTTP e interceptor global. As rotas associam `/produtos` e `/notas` aos respectivos componentes.

```ts
bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([errorInterceptor]))
  ]
});
```

### Cena 15 — Ciclo de vida

**Tempo:** 09:55–10:25

**Fala sugerida:**

> O ciclo de vida utilizado foi `OnInit`, pelo método `ngOnInit`. Ele executa depois que o Angular cria o componente e inicia a carga dos dados. `OnDestroy` não foi necessário porque as requisições do HttpClient completam automaticamente e não há Observables infinitos mantidos pelos componentes.

```ts
ngOnInit() {
  this.load();
}
```

### Cena 16 — Signals e template

**Tempo:** 10:25–10:55

**Fala sugerida:**

> O estado local usa Signals para listas, carregamento, modais, salvamento e impressão. Quando um Signal muda, Angular atualiza as partes dependentes. Os templates usam `@if` e `@for`.

```ts
products = signal<Product[]>([]);
loading = signal(true);
printingId = signal<number | null>(null);
```

### Cena 17 — RxJS

**Tempo:** 10:55–11:40  
**Mostrar:** `api.service.ts`, `load()` e interceptor.

**Fala sugerida:**

> RxJS representa operações assíncronas. HttpClient retorna Observables; `subscribe` trata sucesso e erro; `finalize` encerra o carregamento nos dois casos. `forkJoin` busca notas e produtos em paralelo. No interceptor, `catchError` mostra feedback e `throwError` preserva o erro para o componente.

```ts
forkJoin({
  invoices: this.api.invoices(),
  products: this.api.products()
});
```

```ts
.pipe(finalize(() => this.loading.set(false)))
```

### Cena 18 — Formulários

**Tempo:** 11:40–12:05

**Fala sugerida:**

> Os formulários usam `FormsModule` e `ngModel`. Antes de enviar, o componente remove espaços, converte números e valida inteiros não negativos. O backend repete as regras para garantir segurança.

### Cena 19 — Estoque

**Tempo:** 12:05–12:45  
**Mostrar:** `stock-service/src/app.js` e `db.js`.

**Fala sugerida:**

> Estoque usa Node.js e Express. Zod valida payloads e `better-sqlite3` acessa o banco. Queries usam parâmetros, evitando concatenar entradas do usuário. Há cadastro, consulta, baixa transacional, health check e simulação de falha.

```text
GET  /health
GET  /products
GET  /products/:id
POST /products
POST /stock/debit
POST /admin/fail-next
```

### Cena 20 — Faturamento

**Tempo:** 12:45–13:25

**Fala sugerida:**

> Faturamento também usa Express, Zod e SQLite, mas possui banco próprio. Na criação, consulta Estoque. Na impressão, exige status Aberta, chama a baixa com timeout de cinco segundos e só então fecha. Se Estoque estiver indisponível, retorna 503 e mantém a nota aberta.

```text
GET  /health
GET  /invoices
POST /invoices
POST /invoices/:id/print
```

### Cena 21 — Erros

**Tempo:** 13:25–14:00

**Fala sugerida:**

> Erros são padronizados com `code`, `message` e, quando necessário, `details`. JSON ou dados inválidos retornam 400; inexistência retorna 404; duplicidade, saldo insuficiente, idempotência divergente e nota fechada retornam 409; indisponibilidade retorna 503; falha inesperada retorna 500. O interceptor mostra as mensagens ao usuário.

| HTTP | Exemplo |
|---:|---|
| 400 | JSON ou dados inválidos |
| 404 | produto, nota ou rota inexistente |
| 409 | duplicidade, saldo insuficiente ou nota fechada |
| 503 | microsserviço indisponível |
| 500 | falha interna inesperada |

### Cena 22 — Bibliotecas e dependências

**Tempo:** 14:00–14:30  
**Mostrar:** `package.json` e `package-lock.json`.

**Fala sugerida:**

> As dependências são gerenciadas por npm Workspaces, com lockfile único. No frontend: Angular, RxJS, TypeScript e Zone.js. No backend: Express para APIs, Zod para validação, `better-sqlite3` para persistência e CORS. `concurrently` inicia os três processos.

> Não foi usada biblioteca visual pronta como Angular Material. A interface responsiva foi construída com HTML e CSS próprios. DM Sans e Manrope vêm do Google Fonts, com fallback local.

### Cena 23 — Go, C# e LINQ

**Tempo:** 14:30–14:45

**Fala sugerida:**

> A solução não utiliza Golang ou C#. Portanto, gerenciamento de dependências Go, frameworks Go ou C# e LINQ não se aplicam. O backend escolhido foi Node.js com Express e npm.

### Cena 24 — Testes e build

**Tempo:** 14:45–15:15

**Fala sugerida:**

> Há doze testes de backend cobrindo cadastro, baixa, idempotência, falha, itens repetidos, entradas inválidas, rotas inexistentes, numeração, status inicial, indisponibilidade, fechamento, reimpressão e saldo insuficiente. O build de produção Angular também foi aprovado.

### Cena 25 — Encerramento

**Tempo:** 15:15–15:30

**Fala sugerida:**

> A solução atende cadastro de produtos, criação e impressão de notas, atualização de saldo, microsserviços, banco real e recuperação de falhas. Como evoluções futuras, considero autenticação, observabilidade, mensageria para operações distribuídas e implantação em contêineres. Obrigado pela avaliação.

## 5. Demonstrações opcionais

### 5.1 Saldo insuficiente

1. Crie duas notas usando 1 unidade do monitor, cujo saldo é 1.
2. Imprima a primeira.
3. Tente imprimir a segunda.
4. Mostre o erro 409, a segunda nota Aberta e saldo não negativo.

**Fala:**

> As duas notas foram criadas quando havia uma unidade. Depois da primeira baixa, a segunda encontra saldo atualizado e recebe conflito. Isso protege o estoque mesmo com notas criadas anteriormente.

### 5.2 Banco físico

Mostre no explorador, sem modificar:

```text
services/stock-service/data/stock.db
services/billing-service/data/billing.db
```

**Fala:**

> São arquivos SQLite reais. Estoque contém produtos e movimentações; Faturamento contém notas e itens. Cada serviço é proprietário de seu banco.

### 5.3 Network do navegador

Abra `F12 → Network`, atualize e mostre:

- `GET /api/stock/products`;
- `GET /api/billing/invoices`;
- status HTTP, JSON e tempo de resposta.

## 6. Respostas prontas

### Por que dois bancos?

> Para manter autonomia. Estoque não acessa tabelas de Faturamento e vice-versa. A integração ocorre por HTTP.

### Por que não uma transação entre os dois bancos?

> Uma transação SQLite não abrange serviços independentes. A solução usa baixa idempotente e ordem segura: Estoque confirma primeiro, Faturamento fecha depois. Se houver falha após a baixa, a repetição recebe o resultado idempotente e conclui o fechamento.

### Por que Signals e RxJS?

> RxJS representa fluxos assíncronos, principalmente HTTP. Signals representam estado local síncrono da interface.

### Por que não OnDestroy?

> As requisições HttpClient completam após uma resposta. Não há WebSockets ou Observables infinitos nos componentes.

### Por que Express?

> É simples e adequado para demonstrar microsserviços, middlewares, validação e erros sem estrutura excessiva.

### SQLite é banco real?

> Sim. Persiste arquivos com tabelas, constraints, transações e WAL. Com múltiplas instâncias, uma evolução seria PostgreSQL.

### Cancelar o diálogo desfaz a nota?

> Não. O processamento e a baixa já ocorreram. O diálogo posterior permite imprimir ou salvar PDF.

## 7. Erros a evitar

- Não execute `npm run dev` duas vezes.
- Não diga que o backend usa Golang ou C#.
- Não diga que Angular Material foi usado.
- Não diga que a baixa acontece no frontend.
- Não diga que SQLite fica em memória.
- Não esconda o erro da simulação.
- Não corte antes de mostrar a nota ainda Aberta após a falha.
- Não esqueça de confirmar o saldo.
- Não mostre tokens, senhas ou arquivos pessoais.
- Não use código de produto já cadastrado.
- Não mova o cursor rapidamente.

## 8. Checklist antes de gravar

- [ ] 12 testes aprovados.
- [ ] Build Angular aprovado.
- [ ] Portas livres antes de iniciar.
- [ ] Três serviços iniciados.
- [ ] Navegador em 100%.
- [ ] Códigos de demonstração disponíveis.
- [ ] Produtos e Notas abrem.
- [ ] Diálogo de impressão abre.
- [ ] Simulação de falha funciona.
- [ ] Arquivos técnicos preparados no editor.
- [ ] Notificações e aplicativos pessoais fechados.
- [ ] Microfone testado.

## 9. Checklist depois de gravar

- [ ] Imagem e áudio desde o início.
- [ ] Interface e código legíveis.
- [ ] Cadastro e persistência mostrados.
- [ ] Nota Aberta mostrada.
- [ ] Processamento e folha de impressão mostrados.
- [ ] Nota Fechada e saldo atualizado mostrados.
- [ ] Falha 503 e recuperação mostradas.
- [ ] Angular, RxJS e ciclo de vida explicados.
- [ ] Bibliotecas visuais explicadas.
- [ ] Backend, erros, banco, concorrência e idempotência explicados.
- [ ] Go, C#, LINQ declarados não aplicáveis.
- [ ] Testes e build mostrados.
- [ ] Nenhum dado pessoal aparece.

## 10. Versão resumida de 6 minutos

| Tempo | Conteúdo |
|---|---|
| 00:00–00:30 | Objetivo e arquitetura |
| 00:30–01:20 | Cadastro e persistência |
| 01:20–02:20 | Nota com dois produtos |
| 02:20–03:10 | Impressão, fechamento e saldo |
| 03:10–04:00 | Falha e recuperação |
| 04:00–05:30 | Angular, RxJS, backend, banco e idempotência |
| 05:30–06:00 | Bibliotecas, itens não aplicáveis, testes e conclusão |

Na versão curta, use `docs/DETALHAMENTO-TECNICO.md` como apoio e não abra todos os arquivos.

## 11. Configuração e nome do vídeo

Use `Win+Shift+R` ou OBS Studio.

- formato MP4;
- 1920 × 1080;
- 30 quadros por segundo;
- áudio 48 kHz;
- cursor visível;
- voz uniforme;
- sem música ou com música quase imperceptível.

Nome sugerido:

```text
demonstracao-teste-tecnico-estoque-faturamento.mp4
```

Assista ao arquivo completo antes de enviar.
