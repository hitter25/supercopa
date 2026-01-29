# Totem Interativo Supercopa Rei

## Visao Geral

Aplicacao interativa de cabine de fotos com IA para torcedores de futebol brasileiro no evento "Supercopa Rei". Os usuarios podem tirar fotos e ter imagens geradas por IA junto com idolos iconicos do Flamengo ou Corinthians.

## Stack Tecnologico

| Tecnologia | Versao | Proposito |
|------------|--------|-----------|
| React | 18.2.0 | Framework UI |
| TypeScript | 5.8.2 | Tipagem estatica |
| Vite | 6.2.0 | Build tool |
| Tailwind CSS | CDN | Estilizacao |
| Framer Motion | 10.18.0 | Animacoes |
| Zustand | 4.5.2 | Gerenciamento de estado |
| Google Gemini AI | 1.28.0 | Geracao de imagens |
| Supabase | 2.39.0 | Backend/Database |

## Estrutura do Projeto

```
totem-interativo-supercopa-rei/
├── App.tsx                    # Componente principal com fluxo de telas
├── index.tsx                  # Entry point React
├── index.html                 # Template HTML
├── vite.config.ts             # Configuracao Vite
├── tsconfig.json              # Configuracao TypeScript
├── package.json               # Dependencias
├── constants.ts               # Dados de times e idolos
├── types.ts                   # Definicoes TypeScript
├── store.ts                   # Estado global (Zustand)
├── .env.local                 # Variaveis de ambiente
├── components/
│   ├── Button.tsx             # Componente de botao reutilizavel
│   ├── GeminiTest.tsx         # Teste de conexao Gemini
│   └── SupabaseTest.tsx       # Teste de conexao Supabase
├── services/
│   ├── geminiService.ts       # Servico de geracao de imagem IA
│   └── supabaseService.ts     # Integracao com banco de dados
└── doc/
    └── README.md              # Esta documentacao
```

## Fluxo da Aplicacao

A aplicacao implementa um fluxo de 8 telas gerenciado via maquina de estados:

```
INICIO
   ↓
[WELCOME] ─────────────────── Tela inicial com animacoes
   ↓ (Clique "Toque para comecar")
[TEAM_SELECTION] ──────────── Escolha Flamengo ou Corinthians
   ↓ (Time selecionado)
[IDOL_SELECTION] ──────────── Escolha o idolo do time
   ↓ (Idolo selecionado)
[INSTRUCTION] ─────────────── Instrucoes (5s auto-avanco)
   ↓
[CAMERA] ──────────────────── Captura selfie com contagem
   ↓ (Foto capturada)
[GENERATION] ──────────────── IA gera imagem com idolo
   ↓ (Geracao completa)
[RESULT] ──────────────────── Exibe imagem final
   ↓
[WHATSAPP] ────────────────── Compartilhar via WhatsApp
   ↓
RESET → Volta para WELCOME
```

## Telas Detalhadas

### 1. WELCOME (Boas-vindas)
- Background com gradientes dinamicos
- Imagens de idolos representativos dos dois times
- Botao "Toque para comecar"
- Animacoes de entrada escalonadas

### 2. TEAM_SELECTION (Selecao de Time)
- Dois botoes grandes: Flamengo e Corinthians
- Cores especificas de cada time
- Design glassmorphism

### 3. IDOL_SELECTION (Selecao de Idolo)
- Lista rolavel de lendas do time
- Exibe nome, apelido, posicao e era
- Fotos dos idolos

### 4. INSTRUCTION (Instrucoes)
- Avanca automaticamente apos 5 segundos
- Mostra informacoes do idolo selecionado
- Botao para pular instrucoes

### 5. CAMERA (Camera)
- Elemento video HTML5 nativo
- Contagem regressiva de 5 segundos
- Efeito de flash na captura
- Som de obturador (Web Audio API)
- Tratamento de erros de permissao

### 6. GENERATION (Geracao)
- Exibe imagem capturada
- Barra de progresso animada
- Texto de estagio (Analisando, Compondo, Renderizando, Finalizando)
- Seletor de qualidade (1K, 2K, 4K)

### 7. RESULT (Resultado)
- Exibe imagem gerada pela IA
- Botao compartilhar WhatsApp
- Botao novo usuario

### 8. WHATSAPP (Compartilhamento)
- Campo de input para telefone
- Botao enviar
- Mensagem de sucesso com contagem para reset

## Dados dos Idolos

### Flamengo
| ID | Nome | Apelido | Posicao | Era |
|----|------|---------|---------|-----|
| zico | Zico | O Galinho | Meia | 1971-1989 |
| adriano | Adriano | Imperador | Atacante | 2009-2010 |
| arrascaeta | Arrascaeta | El Mago | Meia | 2019-Presente |

### Corinthians
| ID | Nome | Apelido | Posicao | Era |
|----|------|---------|---------|-----|
| socrates | Socrates | Doutor | Meia | 1978-1984 |
| cassio | Cassio | Gigante | Goleiro | 2012-2023 |
| memphis | Memphis Depay | Memphis | Atacante | 2024-Presente |

## Servicos

### Gemini Service (Geracao de Imagem IA)

**Arquivo:** `/services/geminiService.ts`

**Funcionalidades:**
- Geracao de imagem usando modelo Gemini 3 Pro Image Preview
- Teste de conexao com relatorio detalhado de erros
- Gerenciamento de API key (suporta .env.local, process.env, vite env)
- Logica de retry com backoff exponencial para rate limiting (erros 503)
- Delays de retry: 2s → 4s → 8s
- Suporta opcoes de qualidade (1K, 2K, 4K)
- Aspect ratio 9:16 (formato vertical/mobile)

**Template do Prompt:**
```
"A hyper-realistic photo of this fan meeting the football legend [IDOLO],
who is wearing a [TIME] kit. The fan and the idol are standing side-by-side
in a friendly pose... professional football stadium with atmospheric floodlights..."
```

### Supabase Service (Backend/Database)

**Arquivo:** `/services/supabaseService.ts`

**Detalhes do Projeto:**
- Project ID: `tdecoglljtghaulaycvd`
- Nome: `supercopa`
- Regiao: `us-west-2`
- URL: `https://tdecoglljtghaulaycvd.supabase.co`

**Funcionalidades:**
- Teste de conexao com diagnosticos detalhados
- Monitoramento de health check
- Validacao de credenciais

## Gerenciamento de Estado (Zustand)

**Estado:**
```typescript
{
  currentScreen: ScreenState,      // Tela atual
  selectedTeam: TeamId | null,     // FLAMENGO ou CORINTHIANS
  selectedIdol: Idol | null,       // Lenda escolhida
  capturedImage: string | null,    // Selfie base64
  generatedImage: string | null,   // Resultado IA
  imageSize: ImageSize             // 1K, 2K ou 4K
}
```

**Acoes:**
- `setScreen(screen)` - Navegar entre telas
- `selectTeam(team)` - Selecionar time
- `selectIdol(idol)` - Escolher idolo
- `setCapturedImage(img)` - Armazenar selfie
- `setGeneratedImage(img)` - Armazenar resultado IA
- `setImageSize(size)` - Selecionar qualidade
- `resetSession()` - Limpar dados e voltar ao inicio

## Componentes

### Button
- 3 variantes: primary (gradiente amarelo), secondary (glass), outline
- Suporta modo fullWidth
- Escala no estado ativo (0.95)
- Tratamento de estado disabled

### GeminiTest
- Widget fixo (canto superior direito)
- Testa conexao da API Gemini
- Exibe status detalhado com JSON expansivel

### SupabaseTest
- Similar ao GeminiTest
- Dois botoes: Teste de conexao + Health check
- Exibe info do projeto e detalhes de conexao

## Design System

### Cores
| Nome | Valor | Uso |
|------|-------|-----|
| Glass | `rgba(255, 255, 255, 0.1)` | Efeitos glassmorphism |
| Flamengo | `#C3281E` | Elementos do Flamengo |
| Corinthians | `#111111` | Elementos do Corinthians |
| Gold | `#D4AF37` | Acentos |

### Fontes
- **Playfair Display** - Titulos (serif)
- **Inter** - Corpo (sans-serif)

### Padroes de Design
- **Glassmorphism:** Backgrounds borrados com efeito de vidro semi-transparente
- **Gradientes Dinamicos:** Baseados no time selecionado
- **Motion Design:** Framer Motion para animacoes de entrada/saida

## Configuracao e Execucao

### Variaveis de Ambiente

Criar arquivo `.env.local` na raiz:
```env
GEMINI_API_KEY=sua_chave_api_gemini
VITE_SUPABASE_URL=https://tdecoglljtghaulaycvd.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anon_supabase
```

### Comandos

```bash
# Instalar dependencias
npm install

# Desenvolvimento (http://localhost:3000)
npm run dev

# Build de producao
npm run build

# Preview do build
npm run preview
```

### Configuracao do Servidor

O servidor esta configurado para rodar em `0.0.0.0:3000`, permitindo acesso de outros dispositivos na mesma rede (ideal para uso em totem/kiosk).

## Tratamento de Erros

### Camera
- Feedback para permissao negada
- Mensagem de erro fallback
- Limpeza de stream no unmount

### API Gemini
- Tratamento de overload 503 com backoff exponencial (ate 3 retries)
- Mensagens de erro detalhadas
- Validacao de API key

### Supabase
- Verificacao de status de conexao
- Monitoramento de saude
- Deteccao de codigos de erro (PGRST116, PGRST205, etc.)

## Seguranca

### Estado Atual
- API keys em `.env.local` (nao deve ser commitado)
- Chaves Supabase expostas no vite.config.ts (aceitavel para anon key)
- Sem autenticacao de usuario implementada

### Recomendacoes
- Implementar Supabase Auth para identificacao de usuario
- Considerar rate limiting na geracao de imagens
- Validar numeros de telefone antes da integracao WhatsApp
- Adicionar headers CORS para producao

## Melhorias Futuras

1. **Integracao WhatsApp Real:** Atualmente mock, precisa API real
2. **Armazenamento de Imagens:** Salvar imagens geradas no Supabase Storage
3. **Analytics:** Rastrear interacoes e taxas de sucesso
4. **Contas de Usuario:** Login opcional para historico
5. **Filtros AR:** Deteccao facial para overlays em tempo real
6. **Integracao de Impressao:** Habilitar impressao fisica no kiosk
7. **QR Codes:** Gerar link compartilhavel com QR code
8. **Multi-idioma:** Interface Portugues/Ingles
9. **Dashboard Admin:** Gerenciar idolos, times, analytics

## Arquivos Principais

| Arquivo | Proposito | Linhas |
|---------|-----------|--------|
| App.tsx | Logica principal, 8 telas | 667 |
| geminiService.ts | Geracao de imagem IA | 236 |
| supabaseService.ts | Integracao banco de dados | 207 |
| store.ts | Gerenciamento de estado | 27 |
| constants.ts | Dados de idolos/times | 75 |
| types.ts | Definicoes TypeScript | 50 |
| Button.tsx | Componente UI reutilizavel | 33 |
