import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../src/supabaseClient';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);

  // Check for recovery link
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
      navigate('/reset-password');
    }

    // Also listen for auth state change just in case
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/reset-password');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const email = (e.currentTarget as HTMLFormElement).email.value;

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      alert('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
      setIsForgotPasswordMode(false);
    } catch (error: any) {
      alert(error.message || 'Erro ao enviar e-mail de recuperação.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const email = (e.currentTarget as HTMLFormElement).email.value;
    const password = (e.currentTarget as HTMLFormElement).password.value;
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }
    localStorage.setItem('isAuthenticated', 'true');
    setLoading(false);
    navigate('/');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const email = (e.currentTarget as HTMLFormElement).email.value;
    const password = (e.currentTarget as HTMLFormElement).password.value;
    const confirmPassword = (e.currentTarget as HTMLFormElement).confirmPassword?.value;

    if (password !== confirmPassword) {
      alert('As senhas não coincidem!');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      alert('A senha deve ter no mínimo 6 caracteres');
      setLoading(false);
      return;
    }

    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: (e.currentTarget as HTMLFormElement).fullName?.value
        }
      }
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    // Save name to localStorage for immediate use
    if ((e.currentTarget as HTMLFormElement).fullName?.value) {
      localStorage.setItem('userName', (e.currentTarget as HTMLFormElement).fullName.value);
    }

    alert('Conta criada com sucesso! Verifique seu e-mail para confirmar.');
    setIsRegisterMode(false);
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-background-dark text-text-dark">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-10">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-text-dark items-center justify-center font-bold text-background-dark text-4xl mb-4 shadow-lg shadow-primary/20">
            Dg
          </div>
          <h1 className="text-3xl font-bold text-white">
            {isForgotPasswordMode ? 'Recuperar Senha' : isRegisterMode ? 'Criar nova conta' : 'Bem-vindo(a) de volta!'}
          </h1>
          <p className="text-subtext-dark mt-2">
            {isForgotPasswordMode
              ? 'Digite seu e-mail para receber o link de recuperação'
              : isRegisterMode
                ? 'Preencha os dados para se cadastrar'
                : 'Faça login para continuar'}
          </p>
        </div>

        <form onSubmit={isForgotPasswordMode ? handleResetPassword : isRegisterMode ? handleRegister : handleLogin} className="space-y-6">
          {isRegisterMode && !isForgotPasswordMode && (
            <div>
              <label className="text-sm font-medium text-subtext-dark block mb-2" htmlFor="fullName">Nome Completo</label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                className="block w-full px-4 py-3 bg-surface-dark border border-border-dark rounded-xl placeholder-subtext-dark text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                placeholder="Seu nome"
              />
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-subtext-dark block mb-2" htmlFor="email">E-mail</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="block w-full px-4 py-3 bg-surface-dark border border-border-dark rounded-xl placeholder-subtext-dark text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              placeholder="seuemail@exemplo.com"
              defaultValue={!isRegisterMode && !isForgotPasswordMode ? "hanna@example.com" : ""}
            />
          </div>

          {!isForgotPasswordMode && (
            <div>
              <label className="text-sm font-medium text-subtext-dark block mb-2" htmlFor="password">Senha</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="block w-full px-4 py-3 bg-surface-dark border border-border-dark rounded-xl placeholder-subtext-dark text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                placeholder={isRegisterMode ? "Mínimo 6 caracteres" : "Sua senha"}
                defaultValue={!isRegisterMode ? "password123" : ""}
              />
            </div>
          )}

          {isRegisterMode && !isForgotPasswordMode && (
            <div>
              <label className="text-sm font-medium text-subtext-dark block mb-2" htmlFor="confirmPassword">Confirmar Senha</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="block w-full px-4 py-3 bg-surface-dark border border-border-dark rounded-xl placeholder-subtext-dark text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                placeholder="Digite a senha novamente"
              />
            </div>
          )}

          {!isRegisterMode && !isForgotPasswordMode && (
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsForgotPasswordMode(true)}
                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Esqueceu a senha?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-primary/30 text-lg font-bold text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-background-dark transition-all transform active:scale-95 disabled:opacity-70"
          >
            {loading ? (
              <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (isForgotPasswordMode ? 'Enviar Link' : isRegisterMode ? 'Criar Conta' : 'Entrar')}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-subtext-dark">
            {isForgotPasswordMode ? (
              <button
                onClick={() => setIsForgotPasswordMode(false)}
                className="font-medium text-primary hover:text-primary/80 transition-colors flex items-center justify-center w-full"
              >
                <span className="material-icons-outlined mr-1 text-base">arrow_back</span>
                Voltar para Login
              </button>
            ) : (
              <>
                {isRegisterMode ? 'Já tem uma conta?' : 'Não tem uma conta?'}{' '}
                <button
                  onClick={() => setIsRegisterMode(!isRegisterMode)}
                  className="font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  {isRegisterMode ? 'Fazer Login' : 'Registre-se'}
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;