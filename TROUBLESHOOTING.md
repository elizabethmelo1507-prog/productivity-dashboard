# 🚨 Troubleshooting - Problemas Comuns de Deploy

## Problema: "Funciona no meu PC mas não para outras pessoas"

### ✅ SOLUÇÃO PRINCIPAL

Este é o problema mais comum! A causa é que **o Supabase precisa saber quais URLs são permitidas**.

#### Passos para Resolver:

1. **Faça o deploy primeiro** (Vercel ou Netlify)
2. **Copie a URL gerada** (ex: `https://seu-app.vercel.app`)
3. **Configure no Supabase:**
   
   Vá em: https://app.supabase.com/project/fumsdepbiyvgmcjbrciz/auth/url-configuration
   
   - **Site URL:** `https://seu-app.vercel.app`
   - **Redirect URLs:** Adicione estas 3 URLs:
     - `https://seu-app.vercel.app/**`
     - `https://seu-app.vercel.app/reset-password`
     - `http://localhost:3000/**`

4. **Aguarde 1-2 minutos** para as configurações propagarem
5. **Teste novamente**

---

## Problema: Variáveis de Ambiente

### Sintomas:
- Erro: "Missing Supabase environment variables"
- Página em branco
- Erro de autenticação

### Solução:

**Na Vercel:**
1. Vá em: `Project Settings` > `Environment Variables`
2. Adicione:
   - `VITE_SUPABASE_URL` = `https://fumsdepbiyvgmcjbrciz.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1bXNkZXBiaXl2Z21jamJyY2l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3ODM1NjYsImV4cCI6MjA3OTM1OTU2Nn0.iMpYDDlzwYDJIF7kp3xlMIoCJDeQ851JwDfAlTKFa10`
3. **Redeploy** o projeto

**Na Netlify:**
1. Vá em: `Site Settings` > `Environment Variables`
2. Adicione as mesmas variáveis acima
3. **Redeploy** o site

---

## Problema: Erros de CORS

### Sintomas:
- Erro no console: "CORS policy blocked"
- Requisições para Supabase falhando

### Solução:

1. Acesse: https://app.supabase.com/project/fumsdepbiyvgmcjbrciz/settings/api
2. Role até **CORS Configuration**
3. Adicione sua URL de produção: `https://seu-app.vercel.app`
4. Salve e aguarde 1-2 minutos

---

## Problema: Build Failing

### Sintomas:
- Deploy falha na Vercel/Netlify
- Erro: "Build failed"

### Solução:

1. **Verifique os logs de build** no dashboard
2. Causas comuns:
   - Faltam variáveis de ambiente → Adicione conforme acima
   - Erro de TypeScript → Rode `npm run build` localmente primeiro
   - Dependências faltando → Rode `npm install` e commite o `package-lock.json`

### Comandos para testar localmente:

```bash
# Teste o build de produção
npm run build

# Se der erro, corrija os erros e tente novamente
npm run dev
```

---

## Problema: Página em Branco

### Sintomas:
- Deploy bem-sucedido
- Mas página fica branca

### Solução:

1. **Abra o Console do Browser** (F12)
2. Veja se há erros em vermelho
3. Causas comuns:
   - **Variáveis de ambiente faltando** → Configure na Vercel/Netlify
   - **URLs não configuradas no Supabase** → Configure conforme acima
   - **Erro de build** → Verifique os logs

---

## Problema: Login não funciona

### Sintomas:
- Erro ao fazer login
- Redirecionamento falha
- "Invalid redirect URL"

### Solução:

1. **Configure URLs no Supabase** (ver solução principal acima)
2. **Verifique as variáveis de ambiente**
3. **Aguarde 1-2 minutos** após configurar
4. **Limpe o cache do browser** (Ctrl+Shift+Delete)

---

## ✅ Checklist de Deploy

Use este checklist para garantir que tudo está configurado:

- [ ] Código está no GitHub
- [ ] Deploy feito na Vercel/Netlify
- [ ] Variáveis de ambiente configuradas (`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`)
- [ ] URL da Vercel/Netlify configurada no Supabase (Site URL)
- [ ] Redirect URLs configuradas no Supabase
- [ ] Aguardei 1-2 minutos após configurar
- [ ] Testei em navegador anônimo/privado
- [ ] Compartilhei o link com outra pessoa para testar

---

## 🆘 Ainda não funciona?

Se seguiu todos os passos acima e ainda não funciona:

1. **Abra o Console do Browser** (F12)
2. **Tire um screenshot do erro**
3. **Verifique os logs de deploy** na Vercel/Netlify
4. **Tire um screenshot dos logs**

Com essas informações, será mais fácil diagnosticar o problema específico.

---

## 📝 URLs Importantes

- **Supabase Auth Config:** https://app.supabase.com/project/fumsdepbiyvgmcjbrciz/auth/url-configuration
- **Supabase API Settings:** https://app.supabase.com/project/fumsdepbiyvgmcjbrciz/settings/api
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Netlify Dashboard:** https://app.netlify.com/
