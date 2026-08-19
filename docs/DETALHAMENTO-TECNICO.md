# Detalhamento técnico

## Stack e arquitetura

- Frontend: Angular 21, TypeScript, componentes standalone e Signals.
- Microsserviço de Estoque: Node.js 22, Express e SQLite (`stock.db`).
- Microsserviço de Faturamento: Node.js 22, Express e SQLite (`billing.db`).
- Comunicação: APIs REST/JSON. O Angular usa proxy de desenvolvimento para as duas APIs. O Faturamento consulta o Estoque na criação e solicita a baixa no fechamento.
- Persistência: `better-sqlite3`, WAL habilitado, constraints de integridade e transações atômicas.

Não foram usados Golang ou C#. Portanto, gerenciamento de dependências Go, frameworks Go/C# e LINQ não se aplicam. Em Node.js, as dependências são gerenciadas pelo npm Workspaces, com um `package-lock.json` único e scripts centralizados.

## Angular

### Ciclos de vida

Foi usado `OnInit` (`ngOnInit`) nas telas de Produtos e Notas para carregar dados assim que cada componente entra em cena. Não há subscriptions de longa duração: todas as chamadas do `HttpClient` completam após uma resposta, portanto `OnDestroy` não foi necessário.

### RxJS

- `Observable` é o contrato de todas as chamadas HTTP.
- `forkJoin` busca notas e produtos em paralelo.
- `finalize` encerra indicadores de carregamento mesmo quando ocorre erro.
- `catchError` e `throwError` no interceptor global exibem feedback consistente e preservam o erro para o chamador.

Signals controlam o estado local reativo de tela (`loading`, listas, modal e nota em impressão). Formulários usam `FormsModule`.

### Componentes visuais

O design system foi implementado em CSS próprio, responsivo, sem biblioteca externa de componentes visuais. Isso reduz o bundle e demonstra domínio de Angular/CSS. A tipografia usa DM Sans e Manrope via Google Fonts; se estiver offline, há fallback sans-serif.

## Backend e integridade

Express implementa endpoints e middlewares; Zod valida todo payload de entrada. Os erros são convertidos para JSON previsível (`code`, `message`, e `details` quando aplicável), com status HTTP adequados: 400 validação, 404 inexistente, 409 conflito e 503 indisponibilidade temporária.

Na impressão, a nota permanece `OPEN` se a comunicação com Estoque falhar. O usuário recebe uma mensagem acionável e pode tentar novamente. A tela possui “Simular falha”, que faz a próxima baixa retornar 503, permitindo demonstrar recuperação.

### Concorrência e idempotência

A baixa de todos os itens ocorre em uma única transação SQLite. Primeiro todos os saldos são verificados; depois todos são decrementados. A serialização de escrita do SQLite impede duas baixas concorrentes de consumirem o mesmo saldo 1.

Cada impressão usa `invoice:{id}:print` como chave de idempotência. `stock_movements.idempotency_key` é `UNIQUE`; se a mesma requisição chegar novamente, o Estoque devolve o resultado anterior e não altera saldo. O Faturamento também bloqueia notas já fechadas.

## Processo de impressão

1. Angular desabilita o botão e mostra spinner.
2. Faturamento valida que a nota existe e está aberta.
3. Faturamento solicita uma baixa idempotente ao Estoque, com timeout de cinco segundos.
4. Estoque valida todos os saldos e atualiza-os em transação.
5. Somente após sucesso, Faturamento muda a nota para `CLOSED`.
6. Angular monta uma folha fiscal exclusiva para impressão, abre o diálogo nativo do navegador, recarrega notas/produtos e mostra a confirmação.
