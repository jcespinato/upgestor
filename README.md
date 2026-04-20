# Upgestor - Landing Page + MVP de Sistema

Site profissional moderno e responsivo da **Upgestor**, com foco em conversao de pequenos negocios para planos de assinatura mensal.

## Sobre o projeto

Este projeto foi criado para apresentar a Upgestor como uma solucao simples e acessivel, unindo:

- Sistema de gestao financeira basico
- Presenca online com site profissional
- Atendimento e conversao via WhatsApp

O site inclui uma landing page comercial e um mini sistema MVP para demonstracao.

## Funcionalidades principais

- Hero com copy persuasiva e CTA para WhatsApp
- Secoes de dores, solucao, beneficios e autoridade
- Planos de assinatura (Basico, Pro e Premium)
- Botao de contato com mensagem pronta no WhatsApp
- MVP com:
  - Login/cadastro local por email e senha
  - Dashboard (entradas, saidas, lucro do mes)
  - Cadastro de movimentacoes financeiras
  - Historico com filtro por data
  - Resumo mensal automatico

## Estrutura de arquivos

- `index.html`: estrutura da landing page e area do MVP
- `styles.css`: estilos visuais, responsividade e identidade do projeto
- `app.js`: logica do MVP (login local, dados locais e interacoes)

## Como executar localmente

1. Baixe ou clone este repositorio
2. Abra o arquivo `index.html` no navegador
3. Na secao MVP, use email e senha para entrar/criar conta de demonstracao

## Publicacao

Pode ser publicado facilmente em:

- [Vercel](https://vercel.com/)
- [Netlify](https://www.netlify.com/)
- GitHub Pages (somente frontend estatico)

## Checklist para colocar no ar no GitHub Pages

1. Suba todos os arquivos para o repositorio no GitHub.
2. Em `Settings > Pages`, selecione a branch principal e a pasta raiz (`/`).
3. Crie/edite o arquivo `CNAME` na raiz com o seu dominio final (ex.: `www.seudominio.com.br`).
4. Atualize os placeholders com seu dominio real em:
   - `robots.txt`
   - `sitemap.xml`
5. Configure os DNS no seu provedor de dominio:
   - `A` para `185.199.108.153`
   - `A` para `185.199.109.153`
   - `A` para `185.199.110.153`
   - `A` para `185.199.111.153`
   - `CNAME` para `www` apontando para `<seu-usuario>.github.io`
6. Aguarde propagacao DNS (pode levar algumas horas).

## Observacao sobre Firebase

Atualmente, o projeto esta configurado para funcionar em modo local de demonstracao, sem depender de Firebase.

Se quiser evoluir para producao com dados em nuvem e acesso em multiplos dispositivos, voce pode integrar:

- Firebase Authentication
- Firestore Database

## Autor

**Joao Espinato**

## Contato

- WhatsApp: [5528999644083](https://wa.me/5528999644083)

