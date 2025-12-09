# Rex - Sistema de Requisição de Materiais para Manutenção

Bem-vindo ao Rex, um sistema interno de requisição de materiais projetado para otimizar o processo de manutenção. Este aplicativo permite que mecânicos criem requisições de forma eficiente, enquanto os PCMs (Planejamento e Controle de Manutenção) podem gerenciar, aprovar e acompanhar o status dessas requisições.

## Sobre o Projeto

O Rex foi desenvolvido para simplificar a comunicação e o fluxo de trabalho entre as equipes de manutenção e almoxarifado, garantindo que os materiais certos estejam disponíveis no momento certo.

## Funcionalidades Principais

*   **Criação de Requisições**: Mecânicos podem criar novas requisições de materiais, especificando área, equipamento, item, quantidade, prioridade e descrição do problema, com a opção de anexar fotos.
*   **Catálogo de Itens**: Um catálogo centralizado de itens permite a seleção rápida e padronizada de materiais.
*   **Gestão de Requisições (PCM)**: PCMs têm uma caixa de entrada para visualizar e gerenciar todas as requisições, podendo assumir, atualizar o status (em andamento, pré-liberação, coleta emitida, material disponível, encerrada sem liberação), rejeitar ou transferir requisições.
*   **Histórico de Requisições**: Usuários podem visualizar o histórico completo de suas requisições, com filtros por status.
*   **Gerenciamento de Usuários e Catálogo (Admin)**: Administradores podem gerenciar usuários (promover/rebaixar funções) e manter o catálogo de itens e categorias, incluindo importação via CSV.
*   **Autenticação e Autorização**: Sistema de login seguro com controle de acesso baseado em funções (Mecânico, PCM, Admin).
*   **Notificações em Tempo Real**: Atualizações de status de requisições são refletidas em tempo real.
*   **Design Responsivo**: Interface adaptável para diferentes tamanhos de tela.
*   **Modo Claro/Escuro**: Opção de alternar entre temas claro e escuro.

## Tecnologias Utilizadas

*   **Frontend**: React com TypeScript
*   **Estilização**: Tailwind CSS e shadcn/ui
*   **Roteamento**: React Router DOM
*   **Backend & Banco de Dados**: Supabase (Autenticação, PostgreSQL, Realtime)
*   **Gerenciamento de Estado do Servidor**: Tanstack Query
*   **Validação de Formulários**: React Hook Form e Zod
*   **Ícones**: Lucide React
*   **Notificações**: Sonner
*   **Utilitários de Data**: Date-fns

## Configuração e Instalação Local

Para rodar o projeto Rex em sua máquina local, siga os passos abaixo:

### Pré-requisitos

*   Node.js (versão 18 ou superior) e npm (gerenciador de pacotes)
*   Uma conta Supabase com o projeto configurado (o esquema do banco de dados já está fornecido nas migrações).

### Passos para Instalação

1.  **Clone o repositório:**
    ```sh
    git clone <YOUR_GIT_URL>
    cd <YOUR_PROJECT_NAME>
    ```

2.  **Instale as dependências:**
    ```sh
    npm install
    ```

3.  **Configure as variáveis de ambiente:**
    Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis do seu projeto Supabase:
    ```
    VITE_SUPABASE_URL="https://yhowuqvhltqdcsmvppwt.supabase.co"
    VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlob3d1cXZobHRxZGNzbXZwcHd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMDUzMDAsImV4cCI6MjA4MDg4MTMwMH0.O_R6b9UgTNjFt_BlB83wHBUw2XPsrGSlxxLY9spHh_k"
    ```
    *Substitua os valores pelos do seu projeto Supabase, se necessário. Os valores acima são os padrões do projeto.*

4.  **Inicie o servidor de desenvolvimento:**
    ```sh
    npm run dev
    ```
    O aplicativo estará disponível em `http://localhost:8080`.

## Como Usar

*   **Login**: Acesse a página inicial e faça login com um usuário existente ou crie uma nova conta.
*   **Mecânico**: Após o login, será redirecionado para a página inicial onde pode criar novas requisições e ver o histórico.
*   **PCM**: Após o login, será redirecionado para a caixa de entrada para gerenciar requisições.
*   **Admin**: Após o login, será redirecionado para o painel de administração para gerenciar usuários e o catálogo.

## Implantação

Este projeto é gerenciado pela plataforma Lovable. Para implantar, basta acessar o projeto no Lovable e utilizar as opções de publicação.

## Contribuição

Sinta-se à vontade para contribuir com o projeto. Por favor, siga as diretrizes de código e abra pull requests para novas funcionalidades ou correções.

## Suporte

Para dúvidas ou problemas, entre em contato com a equipe de desenvolvimento.