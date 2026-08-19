# Teste técnico — estoque e faturamento

Aplicação full stack para cadastro de produtos, emissão e impressão de notas fiscais. A solução usa Angular 21 e dois microsserviços Node.js/Express com bancos SQLite independentes.

## Executar

Pré-requisito: Node.js 20+.

```bash
npm install
npm run dev
```

Acesse `http://localhost:4200`. O Angular encaminha `/api/stock` e `/api/billing` para as portas `3001` (Estoque) e `3002` (Faturamento). Os bancos são criados em `services/stock-service/data/stock.db` e `services/billing-service/data/billing.db`.

## Testes e build

```bash
npm test
npm run build
```

## Arquitetura

```text
Angular :4200 ──┬── Estoque :3001 ── SQLite stock.db
                └── Faturamento :3002 ── SQLite billing.db
                          │
                          └── HTTP transacional/idempotente ──> Estoque
```

Ao criar uma nota, o Faturamento valida os produtos e obtém seus dados oficiais no Estoque. Ao imprimir, chama a baixa atômica com uma chave de idempotência. Saldo insuficiente produz `409`; falha temporária produz `503`; chamadas repetidas não baixam estoque novamente. A nota só é fechada depois da confirmação da baixa.

Se aparecer `EADDRINUSE`, já existe uma instância nas mesmas portas. Encerre o terminal anterior com `Ctrl+C`; se necessário, execute `Get-Process node -ErrorAction SilentlyContinue | Stop-Process` e inicie novamente.

