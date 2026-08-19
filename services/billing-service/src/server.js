import { app } from './app.js';
const port = Number(process.env.PORT ?? 3002);
const server = app.listen(port, () => console.log(`Faturamento disponível em http://localhost:${port}`));
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') console.error(`A porta ${port} já está em uso. Encerre a instância anterior antes de iniciar outra.`);
  else console.error('Falha ao iniciar o serviço de Faturamento:', error);
  process.exitCode = 1;
});
