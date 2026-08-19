# Configuração do OBS para o vídeo do teste técnico

Este guia configura o OBS Studio para gravar a aplicação, o terminal e o editor em 1080p, com texto legível e áudio claro.

## 1. Execute o assistente inicial

Ao abrir o OBS pela primeira vez:

1. selecione **Otimizar somente para gravação, não vou fazer transmissão**;
2. mantenha resolução base em `1920 × 1080`;
3. selecione `30 FPS`;
4. conclua o assistente.

Não é necessário configurar Twitch, YouTube ou chave de transmissão.

## 2. Configurações de vídeo

Abra **Configurações → Vídeo**:

| Opção | Valor |
|---|---|
| Resolução de base (tela) | `1920 × 1080` |
| Resolução de saída (redimensionada) | `1920 × 1080` |
| Filtro de redução de escala | Lanczos, 36 amostras |
| Valores comuns de FPS | `30` |

Se o computador ficar lento, altere somente a resolução de saída para `1280 × 720`. Mantenha a resolução base igual à resolução do monitor.

## 3. Configuração de gravação recomendada

Abra **Configurações → Saída**.

### Opção simples, recomendada para iniciante

Em **Modo de saída**, selecione **Simples**.

| Opção | Valor |
|---|---|
| Caminho de gravação | uma pasta com espaço livre, por exemplo `Vídeos\TesteTecnico` |
| Qualidade da gravação | Alta qualidade, tamanho médio de arquivo |
| Formato de gravação | `MKV` |
| Codificador | Hardware, se disponível |
| Codificador de áudio | AAC |

Ordem de preferência do codificador:

1. NVIDIA NVENC H.264, se houver placa NVIDIA;
2. Intel Quick Sync H.264, se disponível;
3. AMD HW H.264, se houver placa AMD;
4. x264, se nenhum codificador de hardware aparecer.

### Por que MKV

MKV é mais seguro: se o OBS, o Windows ou o computador fechar inesperadamente, a gravação normalmente continua recuperável. Depois, converta para MP4 dentro do próprio OBS.

Ative **Configurações → Avançado → Gravação → Remuxar automaticamente para MP4**, se essa opção estiver disponível. Alternativamente, depois de gravar use **Arquivo → Remuxar gravações**, escolha o `.mkv` e gere o `.mp4`.

### Opção avançada, somente se necessário

Em **Modo de saída → Avançado → Gravação**:

- tipo: Padrão;
- formato: MKV;
- faixa de áudio: 1;
- codificador: H.264 por hardware;
- controle de taxa NVENC: CQP;
- CQ: entre 18 e 22; comece em 20;
- intervalo de keyframe: 2 segundos;
- preset: Qualidade;
- perfil: High;
- B-frames máximos: 2.

Com x264:

- controle de taxa: CRF;
- CRF: 20;
- preset de CPU: `veryfast`.

## 4. Configuração de áudio

Abra **Configurações → Áudio**:

| Opção | Valor |
|---|---|
| Taxa de amostragem | `48 kHz` |
| Canais | Estéreo |
| Áudio do desktop | Desativado, salvo se precisar gravar sons do sistema |
| Mic/Auxiliar | seu microfone principal |

Para este vídeo, o áudio do desktop normalmente não é necessário. Desativá-lo evita sons de notificações e do navegador.

### Volume do microfone

Fale no volume que usará na gravação e observe o mixer:

- voz normal: aproximadamente entre `-18 dB` e `-10 dB`;
- picos de voz: entre `-10 dB` e `-6 dB`;
- nunca deixe alcançar a área vermelha ou `0 dB`.

Se estiver muito baixo, aproxime o microfone antes de aumentar muito o ganho.

### Filtros do microfone

No Mixer de áudio, clique nos três pontos ou engrenagem do microfone e escolha **Filtros**. Adicione nesta ordem:

1. **Supressão de ruído**
   - método: RNNoise;
   - use para ruído leve de ventoinha ou ambiente.

2. **Compressor**
   - proporção: `3:1` ou `4:1`;
   - limiar: `-18 dB`;
   - ataque: `6 ms`;
   - liberação: `60 ms`;
   - ganho de saída: entre `0` e `2 dB`.

3. **Expansor**, se teclado, respiração ou ventoinha ainda incomodarem
   - preset: Expander;
   - limiar de fechamento inicial: aproximadamente `-40 dB`;
   - ajuste até o ruído diminuir sem cortar o início das palavras.

4. **Limitador**, sempre por último
   - limiar: `-3 dB` ou `-6 dB`;
   - liberação: `60 ms`.

Não use supressão excessiva: ela pode deixar a voz metálica. Grave 30 segundos e escute com fone.

## 5. Crie a coleção e a cena

No menu superior:

1. escolha **Coleção de cenas → Nova**;
2. nomeie como `Teste técnico`;
3. crie uma cena chamada `Apresentação completa`.

### Fonte principal

Em **Fontes**, clique em `+ → Captura de tela`:

1. nomeie como `Monitor principal`;
2. selecione o monitor em que mostrará navegador, terminal e editor;
3. mantenha **Capturar cursor** ativado;
4. ajuste a fonte para preencher toda a tela.

Captura de tela é a opção mais confiável para esta apresentação, porque o vídeo alterna entre navegador, editor, terminal e diálogo nativo de impressão.

Se usar somente Captura de janela, o diálogo de impressão pode não aparecer quando abrir em outra janela.

### Webcam opcional

Se quiser aparecer:

1. adicione `+ → Dispositivo de captura de vídeo`;
2. escolha a webcam;
3. redimensione para aproximadamente 320 × 180;
4. posicione no canto superior direito;
5. verifique se não cobre botões, mensagens ou saldos.

A webcam não é necessária. Para um teste técnico, tela e voz claras são suficientes.

## 6. Evite o efeito de espelho infinito

Se o OBS estiver no mesmo monitor capturado:

1. configure tudo;
2. minimize o OBS antes de iniciar a apresentação;
3. controle a gravação com atalhos.

Se tiver dois monitores, coloque o OBS no monitor secundário e capture apenas o principal.

## 7. Configure atalhos

Abra **Configurações → Teclas de atalho** e defina algo fácil de lembrar:

| Ação | Atalho sugerido |
|---|---|
| Iniciar gravação | `Ctrl+Shift+F9` |
| Parar gravação | `Ctrl+Shift+F10` |
| Pausar gravação | `Ctrl+Shift+F11` |
| Retomar gravação | `Ctrl+Shift+F12` |

Use combinações que não coincidam com atalhos do navegador, editor ou Windows.

## 8. Prepare a tela que será capturada

Antes de iniciar:

- navegador em 100% ou 110%;
- editor com fonte de 16–18 px;
- terminal com fonte de 16–18 px;
- barra de favoritos oculta se contiver dados pessoais;
- notificações do Windows desativadas;
- WhatsApp, Discord, Teams, e-mail e outros aplicativos fechados;
- área de trabalho sem arquivos pessoais visíveis;
- terminal já posicionado na pasta do projeto;
- arquivos do roteiro abertos no editor;
- aplicação em `http://localhost:4200`.

## 9. Faça um teste de 30 segundos

Grave um teste contendo:

1. sua voz normal;
2. troca entre navegador e editor;
3. rolagem de código;
4. clique em um botão da aplicação;
5. alguns segundos de silêncio.

Depois confira:

- texto nítido e legível;
- cursor visível;
- voz sem cortes;
- ausência de eco;
- ausência de ruído forte;
- sincronia entre voz e imagem;
- arquivo reproduz normalmente;
- espaço livre em disco suficiente.

## 10. Durante a gravação

1. inicie com o atalho;
2. espere dois segundos;
3. comece a falar;
4. mova o cursor lentamente;
5. deixe cada mensagem visível por dois ou três segundos;
6. ao mudar para código, pare o cursor no trecho explicado;
7. se errar, faça silêncio por dois segundos, repita a frase e corte depois;
8. ao terminar, espere dois segundos e pare a gravação.

## 11. Depois da gravação

1. remuxe MKV para MP4;
2. assista ao vídeo completo;
3. confirme que falha e recuperação aparecem;
4. confirme que não há informações pessoais;
5. corte silêncios longos ou erros, se necessário;
6. exporte mantendo 1920 × 1080 e 30 FPS;
7. use H.264 com áudio AAC para máxima compatibilidade.

Nome sugerido:

```text
demonstracao-teste-tecnico-estoque-faturamento.mp4
```

## 12. Solução de problemas

### Tela preta

- tente Captura de tela em vez de Captura de janela;
- atualize OBS e Windows;
- em notebook, mantenha OBS na GPU de alto desempenho;
- recrie a fonte e deixe o método de captura como Automático.

### Gravação travando

- use codificador por hardware;
- feche aplicativos desnecessários;
- reduza saída para 1280 × 720;
- mantenha 30 FPS;
- não use qualidade Sem perdas.

### Voz baixa

- aproxime o microfone;
- confirme o dispositivo correto;
- aumente o controle no Mixer aos poucos;
- use filtro Ganho apenas se necessário.

### Voz metálica

- reduza ou desative temporariamente a Supressão de ruído;
- evite usar simultaneamente filtros de ruído do Windows, fabricante e OBS.

### Arquivo muito grande

- use Alta qualidade em vez de Qualidade indistinguível;
- no modo avançado, aumente CQ/CRF de 20 para 22;
- não selecione Sem perdas.
