# 🚀 Guia de Deploy - Productivity Dashboard

## Opção 1: Deploy na Vercel (Recomendado) ⭐

### Por que Vercel?
- ✅ **Gratuito** para projetos pessoais
- ✅ Deploy **automático** a cada commit
- ✅ **SSL grátis** (HTTPS)
- ✅ **CDN global** (super rápido)
- ✅ Configuração **zero** para Vite/React

---

## 📋 Passo a Passo

### 1. Prepare o Projeto

Primeiro, certifique-se de que tudo está commitado no Git:

```bash
cd /Users/elizabethcelinamm/Downloads/productivity-dashboard

# Adicione todos os arquivos
git add .

# Faça o commit
git commit -m "Preparando para deploy"

# Envie para o GitHub
git push origin main
```

### 2. Crie uma Conta na Vercel

1. Acesse: https://vercel.com/signup
2. Clique em **"Continue with GitHub"**
3. Autorize a Vercel a acessar seus repositórios

### 3. Importe o Projeto

1. No dashboard da Vercel, clique em **"Add New"** > **"Project"**
2. Procure por **"productivity-dashboard"** na lista
3. Clique em **"Import"**

### 4. Configure as Variáveis de Ambiente

Na tela de configuração, clique em **"Environment Variables"** e adicione:

**Variável 1:**
```
Nome: VITE_GEMINI_API_KEY
Valor: [Cole aqui sua chave da API Gemini]
```

**Variável 2:**
```
Nome: VITE_SUPABASE_URL
Valor: https://fumsdepbiyvgmcjbrciz.supabase.co
```

**Variável 3:**
```
Nome: VITE_SUPABASE_ANON_KEY
Valor: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1bXNkZXBiaXl2Z21jamJyY2l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3ODM1NjYsImV4cCI6MjA3OTM1OTU2Nn0.iMpYDDlzwYDJIF7kp3xlMIoCJDeQ851JwDfAlTKFa10
```

### 5. Deploy!

1. Clique em **"Deploy"**
2. Aguarde ~2 minutos (a Vercel vai buildar o projeto)
3. 🎉 Pronto! Você receberá uma URL como: `https://productivity-dashboard-xxx.vercel.app`

---

## 🔧 Configurações Adicionais

### Atualizar URL no Supabase

Depois do deploy, você precisa adicionar a URL da Vercel no Supabase:

1. Acesse: https://app.supabase.com/project/fumsdepbiyvgmcjbrciz/auth/url-configuration
2. Em **"Site URL"**, adicione: `https://productivity-dashboard-xxx.vercel.app`
3. Em **"Redirect URLs"**, adicione:
   - `https://productivity-dashboard-xxx.vercel.app/**`
   - `https://productivity-dashboard-xxx.vercel.app/reset-password`

### Domínio Personalizado (Opcional)

Se você tiver um domínio próprio:

1. No dashboard do projeto na Vercel
2. Vá em **"Settings"** > **"Domains"**
3. Adicione seu domínio (ex: `meuapp.com`)
4. Configure os DNS seguindo as instruções da Vercel

---

## 🔄 Atualizações Automáticas

Depois do primeiro deploy:

1. Faça suas alterações no código
2. `git add .`
3. `git commit -m "Descrição das mudanças"`
4. `git push`
5. **A Vercel faz deploy automático!** 🚀

Você receberá um email quando o deploy estiver pronto.

---

## 📱 Teste o App

Após o deploy, teste no:
- 🖥️ Desktop
- 📱 Celular
- 📱 iPad

Acesse a URL fornecida pela Vercel!

---

## 🐛 Troubleshooting

### "Application error" na Vercel

**Causa:** Erro no build ou variáveis de ambiente faltando

**Solução:**
1. Vá em "Deployments" no dashboard
2. Clique no deployment com erro
3. Veja os logs para identificar o problema
4. Geralmente é variável de ambiente faltando

### "Site not found"

**Causa:** Deploy ainda processando

**Solução:** Aguarde 2-3 minutos e recarregue

### Variáveis de ambiente não funcionam

**Causa:** Falta o prefixo `VITE_`

**Solução:** Todas as variáveis devem começar com `VITE_` para funcionar no Vite

### Banco de dados não conecta

**Causa:** URLs do Supabase não atualizadas

**Solução:**
1. Adicione a URL da Vercel no Supabase (URL Configuration)
2. Adicione em Redirect URLs também

---

## 🎯 Opção 2: Netlify (Alternativa)

Se preferir Netlify:

1. Acesse: https://app.netlify.com/
2. Arraste a pasta do projeto para a área de drop
3. Configure as mesmas variáveis de ambiente
4. Deploy!

Mesmas configurações de ambiente se aplicam.

---

## 📊 Monitoramento

A Vercel oferece:
- ✅ Analytics (visitas, performance)
- ✅ Logs em tempo real
- ✅ Notificações de erro
- ✅ Preview de PRs (antes de mergear)

Acesse tudo no dashboard: https://vercel.com/dashboard

---

## 💰 Custos

**Vercel Free Tier:**
- ✅ 100 GB de banda por mês
- ✅ Deployments ilimitados
- ✅ SSL grátis
- ✅ 100 builds por dia

**Perfeitamente adequado para uso pessoal!**

---

## 🔐 Segurança

Após o deploy:

1. **Nunca commite** as chaves de API
2. Use sempre **variáveis de ambiente**
3. A Vercel **criptografa** as variáveis
4. Rotacione chaves se houver vazamento

---

## 📚 Recursos

- [Documentação Vercel](https://vercel.com/docs)
- [Supabase + Vercel Guide](https://supabase.com/docs/guides/hosting/vercel)
- [Vite Deploy Guide](https://vitejs.dev/guide/static-deploy.html)

---

## ✅ Checklist Final

Antes de compartilhar o link:

- [ ] Testei o login
- [ ] Testei adicionar tarefas
- [ ] Testei adicionar transações
- [ ] Testei o calendário
- [ ] Testei no celular
- [ ] Configurei URLs no Supabase
- [ ] Variáveis de ambiente estão corretas

**Pronto para o mundo! 🌍**
