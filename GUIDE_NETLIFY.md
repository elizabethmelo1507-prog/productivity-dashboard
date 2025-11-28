# 🚀 GUIA RÁPIDO - dashboard-flux.netlify.app

## ⚡ FAÇA AGORA - Passos Obrigatórios

### PASSO 1: Configure o Supabase (5 minutos)

1. **Faça login no Supabase:**
   - Vá na aba do navegador que está aberta: https://supabase.com/dashboard/sign-in
   - Faça o login

2. **Acesse Configurações de Auth:**
   - Depois de logado, clique neste link:
   - https://app.supabase.com/project/fumsdepbiyvgmcjbrciz/auth/url-configuration

3. **Configure as URLs:**
   
   No campo **"Site URL"**, cole EXATAMENTE isto:
   ```
   https://dashboard-flux.netlify.app
   ```

   No campo **"Redirect URLs"**, adicione estas 3 linhas (uma por vez, clicando "Add URL" para cada):
   ```
   https://dashboard-flux.netlify.app/**
   https://dashboard-flux.netlify.app/reset-password
   http://localhost:3000/**
   ```

4. **Salve:**
   - Clique no botão **"Save"**
   - ✅ Aguarde a mensagem de confirmação

---

### PASSO 2: Configure Variáveis de Ambiente no Netlify (3 minutos)

1. **Acesse o Netlify:**
   - Vá em: https://app.netlify.com/sites/dashboard-flux/configuration/env

2. **Adicione as Variáveis:**
   
   Clique em **"Add a variable"** ou **"New variable"** e adicione:

   **Variável 1:**
   ```
   Key: VITE_SUPABASE_URL
   Value: https://fumsdepbiyvgmcjbrciz.supabase.co
   ```

   **Variável 2:**
   ```
   Key: VITE_SUPABASE_ANON_KEY
   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1bXNkZXBiaXl2Z21jamJyY2l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3ODM1NjYsImV4cCI6MjA3OTM1OTU2Nn0.iMpYDDlzwYDJIF7kp3xlMIoCJDeQ851JwDfAlTKFa10
   ```

   **Variável 3:**
   ```
   Key: VITE_GEMINI_API_KEY
   Value: AIzaSyAFiYHbLi2M_rMcVO8l_IwXzVzNzZIpxCM
   ```

3. **Salve:**
   - Clique em **"Save"**

---

### PASSO 3: Faça Redeploy (1 minuto)

1. **Vá em Deploys:**
   - https://app.netlify.com/sites/dashboard-flux/deploys

2. **Trigger deploy:**
   - Clique em **"Trigger deploy"** (botão cinza/azul no canto superior direito)
   - Selecione **"Deploy site"**

3. **Aguarde:**
   - Espere 2-3 minutos até o deploy ficar verde ✅

---

### PASSO 4: Teste (1 minuto)

1. **Abra uma janela anônima:**
   - Chrome: `Ctrl+Shift+N` (Windows) ou `Cmd+Shift+N` (Mac)
   - Firefox: `Ctrl+Shift+P`

2. **Acesse:**
   - https://dashboard-flux.netlify.app

3. **Tente fazer login:**
   - Se não tiver conta, crie uma
   - Se já tiver, faça login

4. **Compartilhe:**
   - Se funcionar, compartilhe o link com alguém para testar!

---

## 🎯 Resumo Ultra-Rápido

1. ✅ Login no Supabase → Configure URLs (Site URL + Redirect URLs)
2. ✅ Netlify → Adicione variáveis de ambiente (VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY)
3. ✅ Netherlify → Redeploy
4. ✅ Teste em janela anônima

**Tempo total: ~10 minutos**

---

## ❓ Problemas?

### "Não encontro onde adicionar variáveis no Netlify"
- Acesse: https://app.netlify.com/sites/dashboard-flux/configuration/env
- Ou: Site Settings → Environment variables

### "Não sei onde está 'Redirect URLs' no Supabase"
- É um campo de texto logo abaixo de "Site URL"
- Você pode adicionar múltiplas URLs separadas por linha
- Algumas versões têm botão "+ Add URL"

### "Deploy não está atualizando"
- Limpe o cache do navegador (Ctrl+Shift+Delete)
- Aguarde 3-5 minutos após o deploy
- Tente em janela anônima

---

## 📱 Links Diretos

| Serviço | Link |
|---------|------|
| **Site Publicado** | https://dashboard-flux.netlify.app |
| **Netlify Env Vars** | https://app.netlify.com/sites/dashboard-flux/configuration/env |
| **Netlify Deploys** | https://app.netlify.com/sites/dashboard-flux/deploys |
| **Supabase Auth** | https://app.supabase.com/project/fumsdepbiyvgmcjbrciz/auth/url-configuration |

---

## ✅ Checklist

- [ ] Fiz login no Supabase
- [ ] Configurei Site URL: `https://dashboard-flux.netlify.app`
- [ ] Adicionei 3 Redirect URLs
- [ ] Salvei no Supabase
- [ ] Adicionei VITE_SUPABASE_URL no Netlify
- [ ] Adicionei VITE_SUPABASE_ANON_KEY no Netlify
- [ ] Fiz Redeploy
- [ ] Aguardei 2-3 minutos
- [ ] Testei em janela anônima
- [ ] FUNCIONA! 🎉

---

**Após fazer isso, ME AVISE que vou testar para você!**
