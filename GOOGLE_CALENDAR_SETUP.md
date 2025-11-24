# 📅 Configuração do Google Calendar

## Pré-requisitos
- Conta do Google
- Projeto Supabase criado

## Passo 1: Configurar Google Cloud Console

1. **Acesse o Google Cloud Console**
   - Vá para: https://console.cloud.google.com/

2. **Crie um novo projeto** (ou use um existente)
   - Clique em "Select a project" no topo
   - Clique em "NEW PROJECT"
   - Nome: "Productivity Dashboard"
   - Clique em "CREATE"

3. **Ative a Google Calendar API**
   - No menu lateral, vá em "APIs & Services" > "Library"
   - Busque por "Google Calendar API"
   - Clique em "ENABLE"

4. **Configure a tela de consentimento OAuth**
   - Vá em "APIs & Services" > "OAuth consent screen"
   - Escolha "External" e clique em "CREATE"
   - Preencha:
     - App name: "Productivity Dashboard"
     - User support email: seu email
     - Developer contact: seu email
   - Clique em "SAVE AND CONTINUE"
   - Em "Scopes", clique em "ADD OR REMOVE SCOPES"
   - Adicione: `https://www.googleapis.com/auth/calendar.readonly`
   - Clique em "SAVE AND CONTINUE"
   - Em "Test users", adicione seu email do Google
   - Clique em "SAVE AND CONTINUE"

5. **Crie credenciais OAuth 2.0**
   - Vá em "APIs & Services" > "Credentials"
   - Clique em "CREATE CREDENTIALS" > "OAuth client ID"
   - Application type: "Web application"
   - Name: "Productivity Dashboard Web"
   - **Authorized redirect URIs**: 
     - Adicione: `https://SEUPROJETO.supabase.co/auth/v1/callback`
     - Substitua `SEUPROJETO` pelo seu ID do Supabase
   - Clique em "CREATE"
   - **COPIE** o Client ID e Client Secret gerados

## Passo 2: Configurar Supabase

1. **Acesse o Supabase Dashboard**
   - Vá para: https://app.supabase.com/

2. **Configure o Google Provider**
   - Navegue até: Authentication > Providers
   - Procure por "Google" na lista
   - **Enabled**: ON (toggle para ativar)
   - **Client ID**: Cole o Client ID do passo anterior
   - **Client Secret**: Cole o Client Secret do passo anterior
   - **Authorized Client IDs**: Deixe vazio (opcional)
   - Clique em "SAVE"

3. **Verifique a URL de Callback**
   - Ainda em Authentication > Providers
   - Role até "Redirect URLs"
   - Copie a URL que aparece (será algo como `https://SEUPROJETO.supabase.co/auth/v1/callback`)
   - **Certifique-se** de que essa URL está adicionada no Google Cloud Console (Passo 1.5)

## Passo 3: Testar a Integração

1. **Abra seu aplicativo**
   - Rode: `npm run dev`

2. **Acesse Settings > Integrações**
   - Clique no botão "Conectar" no card do Google Calendar

3. **Autorize o aplicativo**
   - Você será redirecionado para o Google
   - Faça login com sua conta
   - Aceite as permissões solicitadas
   - Você será redirecionado de volta para o aplicativo

4. **Verifique a sincronização**
   - Vá para o Dashboard
   - Os eventos do seu Google Calendar devem aparecer na seção de Agenda
   - Eventos do Google terão uma cor roxa distintiva

## Troubleshooting

### Erro: "redirect_uri_mismatch"
- **Causa**: A URL de redirecionamento não está configurada corretamente
- **Solução**: 
  1. Verifique se a URL no Google Cloud Console é EXATAMENTE igual à do Supabase
  2. Certifique-se de incluir `https://` no início
  3. Não adicione barras `/` no final

### Erro: "Access blocked: This app's request is invalid"
- **Causa**: O escopo do Calendar não foi adicionado
- **Solução**: 
  1. Volte para OAuth consent screen no Google Cloud
  2. Adicione o escopo `https://www.googleapis.com/auth/calendar.readonly`

### Eventos não aparecem
- **Causa**: Token de acesso não foi salvo ou expirou
- **Solução**: 
  1. Desconecte e reconecte a conta do Google
  2. Verifique se o provider_token está presente na sessão (Console > Application > Session Storage)

### "Erro ao conectar. Verifique se o Google OAuth está configurado no Supabase."
- **Causa**: Configuração incompleta no Supabase
- **Solução**: 
  1. Verifique se o Google Provider está "Enabled" no Supabase
  2. Certifique-se de que Client ID e Secret foram salvos corretamente

## Desenvolvimento Local

Para testar localmente, adicione também esta URL de redirecionamento no Google Cloud Console:
- `http://localhost:5173/auth/v1/callback` (ou a porta que você está usando)

E no Supabase, em "Authentication > URL Configuration > Redirect URLs", adicione:
- `http://localhost:5173`

## Notas de Segurança

- O aplicativo solicita **apenas leitura** (`calendar.readonly`)
- Não é possível criar, editar ou deletar eventos do Google
- O token de acesso é armazenado de forma segura na sessão do Supabase
- Para revogar acesso: Google Account > Security > Third-party apps & services

## Recursos Adicionais

- [Documentação OAuth 2.0 do Google](https://developers.google.com/identity/protocols/oauth2)
- [Documentação Auth do Supabase](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google Calendar API Reference](https://developers.google.com/calendar/api/v3/reference)
