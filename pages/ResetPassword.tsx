import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../src/supabaseClient';

const ResetPassword: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [success, setSuccess] = useState(false);

    const [verifyingSession, setVerifyingSession] = useState(true);

    useEffect(() => {
        // Listen for auth state changes to handle the recovery session
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'PASSWORD_RECOVERY' || session) {
                // Session established, user can reset password
                setVerifyingSession(false);
            } else {
                // No session yet, but check if we have a hash (Supabase might be processing)
                const hash = window.location.hash;
                if (!hash || !hash.includes('type=recovery') && !hash.includes('access_token')) {
                    // Only redirect if we are SURE there's no recovery happening
                    // navigate('/login'); // Commented out to prevent loop for now, let user manually go back if needed
                }
            }
        });

        // Fallback check after 2 seconds
        const timer = setTimeout(async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                // Only redirect if we are absolutely sure and time has passed
                // const hash = window.location.hash;
                // if (!hash || !hash.includes('type=recovery')) {
                //   navigate('/login');
                // }
            }
            setVerifyingSession(false);
        }, 2000);

        return () => {
            authListener.subscription.unsubscribe();
            clearTimeout(timer);
        };
    }, [navigate]);

    if (verifyingSession) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background-dark text-white">
                <div className="flex flex-col items-center">
                    <span className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4"></span>
                    <p>Verificando link de segurança...</p>
                </div>
            </div>
        );
    }

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            alert('As senhas não coincidem!');
            return;
        }

        if (password.length < 6) {
            alert('A senha deve ter no mínimo 6 caracteres');
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({ password: password });

            if (error) throw error;

            setSuccess(true);
            await supabase.auth.signOut(); // Clear recovery session
        } catch (error: any) {
            alert(error.message || 'Erro ao atualizar a senha.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-background-dark text-text-dark">
                <div className="w-full max-w-sm animate-fade-in text-center">
                    <div className="inline-flex w-16 h-16 rounded-full bg-green-500/20 items-center justify-center mb-6">
                        <span className="material-icons-outlined text-3xl text-green-500">check_circle</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-4">Senha Redefinida!</h1>
                    <p className="text-subtext-dark mb-8">
                        Sua senha foi atualizada com sucesso. Agora você pode fazer login com sua nova senha.
                    </p>
                    <button
                        onClick={() => window.location.href = '/login'} // Force reload to clear any hash/state
                        className="w-full py-3.5 px-4 rounded-xl shadow-lg shadow-primary/30 text-lg font-bold text-white bg-primary hover:bg-primary/90 transition-all"
                    >
                        Ir para Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-background-dark text-text-dark">
            <div className="w-full max-w-sm animate-fade-in">
                <div className="text-center mb-10">
                    <div className="inline-flex w-16 h-16 rounded-2xl bg-text-dark items-center justify-center font-bold text-background-dark text-4xl mb-4 shadow-lg shadow-primary/20">
                        Dg
                    </div>
                    <h1 className="text-3xl font-bold text-white">
                        Redefinir Senha
                    </h1>
                    <p className="text-subtext-dark mt-2">
                        Digite sua nova senha abaixo
                    </p>
                </div>

                <form onSubmit={handleUpdatePassword} className="space-y-6">
                    <div>
                        <label className="text-sm font-medium text-subtext-dark block mb-2" htmlFor="password">Nova Senha</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            className="block w-full px-4 py-3 bg-surface-dark border border-border-dark rounded-xl placeholder-subtext-dark text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                            placeholder="Mínimo 6 caracteres"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-subtext-dark block mb-2" htmlFor="confirmPassword">Confirmar Nova Senha</label>
                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            required
                            className="block w-full px-4 py-3 bg-surface-dark border border-border-dark rounded-xl placeholder-subtext-dark text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                            placeholder="Digite a senha novamente"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-primary/30 text-lg font-bold text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-background-dark transition-all transform active:scale-95 disabled:opacity-70"
                    >
                        {loading ? (
                            <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        ) : 'Atualizar Senha'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;
