# Guia de Uso com IA — Personal Assistant AI

Documento complementar ao **Guia de Replicação**. Explica como usar um assistente de IA de conversação (como o Claude) para acelerar a montagem do projeto: gerar o código de cada arquivo, revisar erros e ajudar nos testes — sem exigir conhecimento técnico prévio de quem está seguindo o guia.

Isso é opcional. O Guia de Replicação funciona sozinho, sem IA nenhuma.

---

## 1. A ideia geral

Em vez de escrever o código na mão, você conversa com a IA descrevendo o que quer (usando o Guia de Replicação como roteiro) e ela gera os arquivos prontos para colar no Apps Script. Funciona melhor dividindo o trabalho por partes — uma conversa (chat) por parte do guia, em vez de tentar fazer tudo de uma vez numa única conversa longa.

Por quê dividir em várias conversas:
- Fica mais fácil revisar o que foi feito em cada etapa antes de avançar.
- Evita que a conversa fique tão longa a ponto da IA "perder o fio" do que já foi combinado.
- Se algo der errado numa parte, é mais simples voltar e refazer só aquele pedaço.

---

## 2. Preparando o terreno (uma vez só)

1. **Crie um repositório vazio no GitHub** para guardar o código (ex: `meu-usuario/meu-assistente`).
2. **Se o seu plano de IA tiver suporte a "projetos" ou "memória de arquivos externos"**, configure para que, no início de cada conversa nova, a IA busque automaticamente o conteúdo do `README.md`, do `GUIA-REPLICACAO.md` e do `CHANGELOG.md` do seu repositório. Isso evita ter que reexplicar o histórico do projeto toda vez — a própria documentação já dá o contexto.
3. **Gere um token de acesso do GitHub** (Parte 6 do Guia de Replicação explica o passo a passo) — é o que permite à IA salvar código diretamente no seu repositório, se o seu assistente tiver acesso a um ambiente de execução com internet. Escolha o menor prazo de validade que fizer sentido para o seu uso, e marque só os escopos necessários (`repo`, e `workflow` se for usar deploy automático).

⚠️ **Sobre colar o token no chat:** trate qualquer token colado numa conversa como exposto — mesmo em um assistente confiável, ele fica registrado no histórico da conversa. Depois de usar, revogue o token no GitHub e gere um novo para a próxima vez. Nunca reaproveite o mesmo token em vários lugares diferentes.

---

## 3. Como estruturar o pedido em cada conversa

Um jeito simples de começar cada conversa nova é usando um prompt parecido com este (adapte livremente):

```
Este projeto é o "Personal Assistant AI" (assistente pessoal via WhatsApp,
Google Apps Script + Sheets + Gemini). Repositório: [link do seu repositório]

No início desta conversa, busque o conteúdo atualizado destes arquivos
antes de responder qualquer coisa sobre o projeto:
- README.md
- GUIA-REPLICACAO.md
- CHANGELOG.md

Use-os como fonte de verdade sobre o que já foi feito e o que falta.

Quero seguir para a próxima parte pendente do guia. Aqui está meu token
do GitHub para você poder salvar o código: [seu token]

Mantenha todo texto que eu precise copiar em formato de código, para
facilitar a cópia. Ao final, me diga só o que eu preciso fazer manualmente
— não preciso da explicação passo a passo do que você já fez.
```

O que esperar da IA, seguindo esse formato:
- Ela gera o código de cada arquivo da parte da vez.
- Se tiver acesso a um ambiente com internet, ela mesma salva o código no seu repositório (commit e push).
- Ela te diz exatamente o que só você pode fazer — porque exige acesso humano ao Google ou à Meta (autorizar permissões, clicar em "Nova versão" na implantação, verificar um número de telefone, etc.).

---

## 4. O que a IA não consegue automatizar (e por quê)

Nenhum assistente de IA de conversação tem acesso direto ao seu editor do Apps Script, à sua conta Google ou ao painel da Meta — por isso, mesmo com o código pronto, alguns passos continuam manuais:

- Colar o código no editor do Apps Script (ou configurar a sincronização automática, que aí sim reduz isso a poucos cliques).
- Autorizar permissões (Calendar, Tasks, chamadas externas) na primeira vez que cada serviço é usado.
- Clicar em **"Nova versão"** na implantação — é uma limitação do próprio Google, não tem como automatizar.
- Qualquer configuração dentro do painel da Meta for Developers (criar o app, verificar número, configurar webhook).

Isso é esperado e não significa que algo deu errado — é só a fronteira entre o que um assistente de texto consegue fazer e o que exige uma pessoa clicando de fato nas telas do Google e da Meta.

---

## 5. Boas práticas ao longo do processo

- Peça para a IA atualizar a documentação do projeto (README, changelog) ao final de cada parte concluída — isso mantém o histórico organizado e facilita retomar depois.
- Peça um resumo curto do que foi feito e do que falta, em vez de uma explicação técnica detalhada de cada passo interno — isso economiza tempo de leitura em conversas longas.
- Se um teste falhar, descreva o que aconteceu (mensagem de erro, comportamento inesperado) em vez de tentar diagnosticar sozinho — geralmente a IA consegue apontar a causa mais provável a partir da mensagem de erro.
- Revise o código gerado antes de colar, mesmo sem saber programar: confira se os nomes de arquivo batem com o que o guia pede, e desconfie de qualquer trecho que peça para você compartilhar dados sensíveis com terceiros.
