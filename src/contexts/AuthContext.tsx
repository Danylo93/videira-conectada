import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { User, AuthState, AuthTransition, ActiveRole } from '@/types/auth';

import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import FancyLoader from '@/components/FancyLoader';

type AuthLoaderCopy = {
  message: string;
  tips: string[];
};

const AUTH_LOADER_COPY: Record<AuthTransition, AuthLoaderCopy> = {
  initial: {
    message: 'Aquecendo o coração da Videira',
    tips: [
      'Conferindo se o seu login está no rol dos santos digitais…',
      'Chamando Gabriel pra guardar a senha…',
      'Espremendo uvas fresquinhas pra sessão começar!',
    ],
  },
  login: {
    message: 'Conferindo os pergaminhos do seu acesso',
    tips: [
      'Girando as chaves de Pedro pra abrir a porta certa…',
      'Procurando o selo real com o seu nome carimbado…',
      'Mandando um aleluia pro servidor antes de liberar a entrada…',
    ],
  },
  logout: {
    message: 'Recolhendo as cadeiras da célula com carinho',
    tips: [
      'Guardando o cajado do líder até a próxima batalha…',
      'Encerrando o culto digital com bênção apostólica…',
      'Lustrando o cálice pra quando você voltar sedento…',
    ],
  },
};


const AuthContext = createContext<AuthState | undefined>(undefined);

/** Dados do perfil sem o papel aplicado — a base para montar o User. */
type PerfilBase = Omit<User, 'role' | 'isObreiro'> & { papelCadastrado: string };

const roleStorageKey = (userId: string) => `activeRole:${userId}`;

/**
 * Aplica o papel escolhido ao usuário. As telas continuam lendo `user.role`,
 * então trocar de papel muda o app inteiro sem alterar cada tela.
 */
function comPapel(base: PerfilBase, papel: ActiveRole): User {
  const { papelCadastrado: _ignorado, ...perfil } = base;
  if (papel === 'obreiro') {
    // Obreiro tem acesso de nível pastor, escopado pelo pastor real.
    return { ...perfil, role: 'pastor', isObreiro: true };
  }
  if (papel === 'pastor') return { ...perfil, role: 'pastor', isObreiro: false };
  if (papel === 'discipulador') return { ...perfil, role: 'discipulador', isObreiro: false };
  return { ...perfil, role: 'lider', isObreiro: false };
}

/**
 * Contas liberadas para escolher a função no login. Por enquanto só o Danylo,
 * que acumula obreiro, discipulador e líder de célula — as demais entram
 * direto no papel cadastrado, como sempre. Para liberar outra pessoa, basta
 * incluir o e-mail aqui.
 */
const EMAILS_COM_MULTIPLAS_FUNCOES = ['danylo.oliveira73@gmail.com'];

const podeEscolherFuncao = (email?: string | null) =>
  !!email && EMAILS_COM_MULTIPLAS_FUNCOES.includes(email.trim().toLowerCase());

/**
 * Descobre os papéis que a pessoa pode assumir a partir das relações que já
 * existem no banco — sem precisar de campo novo:
 * - papel cadastrado em profiles.role;
 * - discipulador, se há líderes apontando para ela (discipulador_uuid);
 * - líder de célula, se há pessoas na célula dela (members.lider_id).
 */
async function descobrirPapeis(
  perfilId: string,
  papelCadastrado: string,
  email?: string | null,
): Promise<ActiveRole[]> {
  const papeis = new Set<ActiveRole>();
  if (papelCadastrado === 'pastor') papeis.add('pastor');
  if (papelCadastrado === 'obreiro') papeis.add('obreiro');
  if (papelCadastrado === 'discipulador') papeis.add('discipulador');
  if (papelCadastrado === 'lider') papeis.add('lider');

  // Fora da lista: mantém só o papel cadastrado (sem pop-up de escolha).
  if (!podeEscolherFuncao(email)) return [...papeis];

  try {
    const [{ count: lideresNaRede }, { count: pessoasNaCelula }] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('discipulador_uuid', perfilId),
      supabase.from('members').select('id', { count: 'exact', head: true }).eq('lider_id', perfilId).eq('active', true),
    ]);
    if ((lideresNaRede ?? 0) > 0) papeis.add('discipulador');
    if ((pessoasNaCelula ?? 0) > 0) papeis.add('lider');
  } catch (erro) {
    console.error('Erro ao descobrir papéis do usuário:', erro);
  }

  // Ordem do mais amplo para o mais específico.
  const ordem: ActiveRole[] = ['pastor', 'obreiro', 'discipulador', 'lider'];
  return ordem.filter((p) => papeis.has(p));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [perfilBase, setPerfilBase] = useState<PerfilBase | null>(null);
  const [availableRoles, setAvailableRoles] = useState<ActiveRole[]>([]);
  const [activeRole, setActiveRoleState] = useState<ActiveRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [authTransition, setAuthTransition] = useState<AuthTransition>('initial');

  // Usuário exposto ao app: perfil + papel ativo aplicado. Enquanto a escolha
  // não é feita, usamos o papel mais amplo apenas para nome/tema na tela de
  // seleção — as rotas ficam bloqueadas por needsRoleChoice até escolher.
  const papelEfetivo = activeRole ?? availableRoles[0] ?? null;
  const user = perfilBase && papelEfetivo ? comPapel(perfilBase, papelEfetivo) : null;
  const needsRoleChoice = !!perfilBase && !activeRole && availableRoles.length > 1;

  const setActiveRole = (papel: ActiveRole) => {
    if (!availableRoles.includes(papel)) return;
    setActiveRoleState(papel);
    if (perfilBase) localStorage.setItem(roleStorageKey(perfilBase.id), papel);
  };

  useEffect(() => {
    const handleSession = async (currentSession: Session | null) => {
     

      if (currentSession?.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, name, email, role, phone, discipulador_uuid, pastor_uuid, celula, is_tesoureiro, is_curso_coordenador, is_kids, is_radicais, created_at')
          .eq('user_id', currentSession.user.id)
          .single();

        if (profileError) {
          console.error('Error loading profile:', profileError);
          setPerfilBase(null);
          setAvailableRoles([]);
          setActiveRoleState(null);
        } else if (profile) {
          const base: PerfilBase = {
            id: profile.id,
            name: profile.name,
            email: profile.email,
            phone: profile.phone,
            discipuladorId: profile.discipulador_uuid,
            pastorId: profile.pastor_uuid,
            celula: profile.celula,
            isTesoureiro: profile.is_tesoureiro || false,
            isCursoCoordenador: profile.is_curso_coordenador || false,
            isKids: profile.is_kids || false,
            isRadicais: profile.is_radicais || false,
            createdAt: new Date(profile.created_at),
            papelCadastrado: profile.role,
          };

          const papeis = await descobrirPapeis(profile.id, profile.role, profile.email);
          setPerfilBase(base);
          setAvailableRoles(papeis);

          // Com um papel só, entra direto. Com vários, respeita a escolha
          // anterior; se não houver, o app pede para escolher.
          const salvo = localStorage.getItem(roleStorageKey(profile.id)) as ActiveRole | null;
          if (papeis.length === 1) {
            setActiveRoleState(papeis[0]);
          } else if (salvo && papeis.includes(salvo)) {
            setActiveRoleState(salvo);
          } else {
            setActiveRoleState(null);
          }
        } else {
          setPerfilBase(null);
          setAvailableRoles([]);
          setActiveRoleState(null);
        }
      } else {
        setPerfilBase(null);
        setAvailableRoles([]);
        setActiveRoleState(null);
      }

      setLoading(false);
      setAuthTransition(prev => {
        if (currentSession?.user) {
          return prev === 'login' ? 'initial' : prev;
        }
        return prev === 'logout' ? 'logout' : 'initial';
      });
    };

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      handleSession(session);
    });

    // Handle any existing session on initial load
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setAuthTransition('login');
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      setAuthTransition('initial');
      throw new Error(error.message);
    }
    
    // O onAuthStateChange callback irá processar a sessão automaticamente
    // Não setar loading como false aqui, deixar o handleSession fazer isso
  };

  const logout = async () => {
    setAuthTransition('logout');
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      setLoading(false);
      setAuthTransition('initial');
      throw new Error(error.message);
    }
    // The onAuthStateChange callback will handle clearing the user
  };

  const value: AuthState = {
    user,
    // Autenticado assim que o perfil carrega: se faltar escolher o papel, o
    // app mostra a seleção em vez de mandar de volta para o login.
    isAuthenticated: !!perfilBase,
    login,
    logout,
    loading,
    authTransition,
    availableRoles,
    activeRole,
    setActiveRole,
    needsRoleChoice,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
