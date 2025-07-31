import React, { useState } from 'react';
import { supabase } from '../../supabaseClient'; // Ajusta la ruta si es necesario
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

const redirectTo = 'https://www.aweyt.com/reset-password';

const ForgotPasswordView = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim()) {
            toast.error('Por favor, ingresa un correo electrónico válido.');
            return;
        }
        setLoading(true);

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo,
        });

        setLoading(false);

        if (error) {
            toast.error(error.message);
        } else {
            toast.success('Se ha enviado un enlace de recuperación a tu correo electrónico.');
        }
    };

    return (
        <div style={{ maxWidth: 400, margin: '0 auto', padding: 24 }}>
            <h2>Recuperar Contraseña</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="email"
                    placeholder="Ingresa tu correo electrónico"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    disabled={loading}
                    style={{ width: '100%', marginBottom: 12, padding: 8 }}
                />
                <button
                    type="submit"
                    disabled={loading}
                    aria-busy={loading}
                    style={{ width: '100%', padding: 8 }}
                >
                    {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
                </button>
            </form>
            <div style={{ marginTop: 16, textAlign: 'center' }}>
                <Link to="/login">Volver al inicio de sesión</Link>
            </div>
        </div>
    );
};

export default ForgotPasswordView;