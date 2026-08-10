import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { obterPerfil } from '../services/perfisService';
import { Flex, Spinner } from '@chakra-ui/react';

export function ProtectedRoute() {
  const location = useLocation();
  const [session, setSession] = useState<any>(null);
  const [perfilCompleto, setPerfilCompleto] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verificarAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setSession(session);

      if (session?.user) {
        const perf = await obterPerfil(session.user.id);
        setPerfilCompleto(!!perf?.onboarding_completo);
      } else {
        setPerfilCompleto(false);
      }
      setLoading(false);
    };

    verificarAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        const perf = await obterPerfil(session.user.id);
        setPerfilCompleto(!!perf?.onboarding_completo);
      } else {
        setPerfilCompleto(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <Flex minH="100vh" align="center" justify="center" _dark={{ bg: 'gray.900' }}>
        <Spinner size="xl" color="brand.500" thickness="4px" />
      </Flex>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Redireciona para onboarding se perfil não estiver completo e não estiver na rota de onboarding
  if (!perfilCompleto && location.pathname !== '/completar-perfil') {
    return <Navigate to="/completar-perfil" replace />;
  }

  return <Outlet />;
}
