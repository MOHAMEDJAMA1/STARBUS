import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function ProtectedRoute() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            setLoading(false);
        };

        checkUser();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen" style={{ backgroundColor: 'var(--color-bg-body)' }}>
                <div style={{ color: 'var(--color-text-secondary)' }}>Loading...</div>
            </div>
        );
    }

    return user ? <Outlet context={{ user }} /> : <Navigate to="/login" replace />;
}
