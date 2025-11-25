#!/bin/bash

# 🚀 Script de Deploy Automático
# Este script prepara o projeto para deploy

echo "🚀 Preparando projeto para deploy..."
echo ""

# 1. Verificar se há mudanças não commitadas
if [[ -n $(git status -s) ]]; then
    echo "📝 Há alterações não commitadas. Fazendo commit..."
    git add .
    read -p "Digite a mensagem do commit: " commit_msg
    git commit -m "$commit_msg"
else
    echo "✅ Nenhuma alteração para commitar"
fi

# 2. Testar o build
echo ""
echo "🔨 Testando build de produção..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build bem-sucedido!"
else
    echo "❌ Erro no build. Corrija os erros antes de fazer deploy."
    exit 1
fi

# 3. Push para GitHub
echo ""
echo "📤 Enviando para GitHub..."
git push origin main

if [ $? -eq 0 ]; then
    echo "✅ Código enviado para GitHub!"
else
    echo "❌ Erro ao enviar para GitHub."
    exit 1
fi

echo ""
echo "🎉 Deploy iniciado!"
echo ""
echo "⚠️  IMPORTANTE: Depois do deploy, configure no Supabase:"
echo "1. Acesse: https://app.supabase.com/project/fumsdepbiyvgmcjbrciz/auth/url-configuration"
echo "2. Adicione sua URL da Vercel em 'Site URL' e 'Redirect URLs'"
echo ""
echo "📖 Veja TROUBLESHOOTING.md para mais informações"
