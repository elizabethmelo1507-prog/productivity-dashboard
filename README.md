<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 📊 Productivity Dashboard

Um dashboard completo de produtividade com tarefas, transações financeiras e calendário integrado.

## ✨ Funcionalidades

- 📝 Gerenciamento de tarefas
- 💰 Controle financeiro
- 📅 Calendário integrado
- 🔐 Autenticação com Supabase
- 📱 Design responsivo

## 🚀 Como fazer Deploy

**IMPORTANTE:** Leia o guia completo de deploy em [DEPLOY.md](./DEPLOY.md)

### Quick Start:

1. **Configure as variáveis de ambiente na Vercel/Netlify:**
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

2. **Após o deploy, configure no Supabase:**
   - Vá em: https://app.supabase.com/project/fumsdepbiyvgmcjbrciz/auth/url-configuration
   - Adicione sua URL de produção em "Site URL" e "Redirect URLs"

3. **⚠️ SEM ISSO, O APP NÃO FUNCIONARÁ PARA OUTRAS PESSOAS!**

### Script Automático:

```bash
./deploy.sh
```

## 🐛 Problemas?

**O app funciona no seu PC mas não para outras pessoas?**

👉 Veja o guia completo de soluções: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

Problemas comuns resolvidos:
- ✅ URLs não configuradas no Supabase
- ✅ Variáveis de ambiente faltando
- ✅ Erros de CORS
- ✅ Página em branco
- ✅ Login não funciona

## 🛠️ Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Rodar em modo desenvolvimento
npm run dev

# Build de produção
npm run build
```

## 📖 Documentação

- [DEPLOY.md](./DEPLOY.md) - Guia completo de deploy
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Resolução de problemas
- [GOOGLE_CALENDAR_SETUP.md](./GOOGLE_CALENDAR_SETUP.md) - Setup do Google Calendar

## 🔐 Segurança

- ✅ Variáveis de ambiente configuradas
- ✅ Credenciais nunca no código
- ✅ Row-Level Security no Supabase
- ✅ Autenticação segura

## 📝 License

MIT
# productivity-dashboard
