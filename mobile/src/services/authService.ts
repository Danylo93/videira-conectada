import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

export interface UserData {
  email: string;
  password?: string;
  name: string;
  address?: string;
  role?: string;
  obreiro?: string;
  discipulador?: string;
  cellName?: string;
  phone?: string;
}

export interface AuthResponse {
  user: any;
  token: string;
}

export interface RegisterMemberData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  cellName?: string;
}

export interface RegisterMemberResult {
  autoLoggedIn: boolean;
  requiresEmailConfirmation: boolean;
}

type AppRole = 'pastor' | 'obreiro' | 'discipulador' | 'lider' | 'membro';

type ProfileRow = {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  role: AppRole;
  celula: string | null;
  discipulador_uuid: string | null;
  pastor_uuid: string | null;
};

const AUTH_USER_KEY = 'user';
const AUTH_TOKEN_KEY = 'token';

function mapDbRoleToMobileRole(role: AppRole): string {
  switch (role) {
    case 'pastor':
      return 'Pastor';
    case 'obreiro':
      return 'Obreiro';
    case 'discipulador':
      return 'Discipulador';
    case 'membro':
      return 'Membro';
    case 'lider':
    default:
      return 'L\u00edder';
  }
}

function mapMobileRoleToDbRole(role: string): AppRole {
  const normalizedRole = role.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  switch (normalizedRole) {
    case 'pastor':
      return 'pastor';
    case 'obreiro':
      return 'obreiro';
    case 'discipulador':
      return 'discipulador';
    case 'membro':
    case 'member':
      return 'membro';
    case 'lider':
    default:
      return 'lider';
  }
}

function mapProfileToUser(profile: ProfileRow) {
  return {
    id: profile.id,
    userId: profile.user_id,
    email: profile.email,
    name: profile.name,
    role: mapDbRoleToMobileRole(profile.role),
    phone: profile.phone ?? '',
    cellName: profile.celula ?? '',
    discipulador: profile.discipulador_uuid ?? undefined,
    pastor: profile.pastor_uuid ?? undefined,
  };
}

async function getMemberProfileByUserId(userId: string): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, user_id, name, email, phone, role, celula, discipulador_uuid, pastor_uuid')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as ProfileRow;
}

async function clearLocalAuthData() {
  await AsyncStorage.multiRemove([AUTH_USER_KEY, AUTH_TOKEN_KEY]);
}

async function upsertMemberProfile(userId: string, data: RegisterMemberData): Promise<ProfileRow> {
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .upsert(
      {
        user_id: userId,
        email: data.email,
        name: data.name,
        phone: data.phone ?? null,
        celula: data.cellName ?? null,
        role: 'membro',
      },
      { onConflict: 'user_id' }
    )
    .select('id, user_id, name, email, phone, role, celula, discipulador_uuid, pastor_uuid')
    .single();

  if (profileError || !profileData) {
    throw new Error(profileError?.message || 'Nao foi possivel salvar o perfil de membro.');
  }

  return profileData as ProfileRow;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user || !data.session) {
    throw new Error(error?.message || 'Não foi possível fazer login.');
  }

  const profile = await getMemberProfileByUserId(data.user.id);
  if (!profile) {
    await supabase.auth.signOut();
    await clearLocalAuthData();
    throw new Error('Acesso exclusivo para membros cadastrados na Videira.');
  }

  const userData = mapProfileToUser(profile);
  const token = data.session.access_token;

  await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
  await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));

  return { user: userData, token };
}

export async function register(userData: UserData) {
  if (!userData.password) {
    throw new Error('Senha é obrigatória para criar usuário.');
  }

  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email: userData.email,
    password: userData.password,
  });

  if (signUpError || !authData.user) {
    throw new Error(signUpError?.message || 'Não foi possível criar o usuário no Supabase.');
  }

  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .insert({
      user_id: authData.user.id,
      email: userData.email,
      name: userData.name,
      phone: userData.phone ?? null,
      celula: userData.cellName ?? null,
      discipulador_uuid: userData.discipulador ?? null,
      role: mapMobileRoleToDbRole(userData.role || 'Lider'),
    })
    .select('id, user_id, name, email, phone, role, celula, discipulador_uuid, pastor_uuid')
    .single();

  if (profileError || !profileData) {
    throw new Error(profileError?.message || 'Usuário criado, mas o perfil de membro não foi salvo.');
  }

  const mappedUser = mapProfileToUser(profileData as ProfileRow);
  await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(mappedUser));

  return mappedUser;
}

export async function registerMember(userData: RegisterMemberData): Promise<RegisterMemberResult> {
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email: userData.email,
    password: userData.password,
  });

  if (signUpError || !authData.user) {
    throw new Error(signUpError?.message || 'Nao foi possivel concluir o cadastro.');
  }

  const profile = await upsertMemberProfile(authData.user.id, userData);

  if (authData.session?.access_token) {
    const mappedUser = mapProfileToUser(profile);
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, authData.session.access_token);
    await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(mappedUser));

    return {
      autoLoggedIn: true,
      requiresEmailConfirmation: false,
    };
  }

  await clearLocalAuthData();

  return {
    autoLoggedIn: false,
    requiresEmailConfirmation: true,
  };
}

export async function update(userId: number | string, userData: UserData) {
  const updates: Record<string, string | null> = {};

  if (typeof userData.name === 'string') updates.name = userData.name;
  if (typeof userData.phone === 'string') updates.phone = userData.phone;
  if (typeof userData.cellName === 'string') updates.celula = userData.cellName;

  if (Object.keys(updates).length === 0) {
    const cachedUser = await AsyncStorage.getItem(AUTH_USER_KEY);
    return cachedUser ? JSON.parse(cachedUser) : null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', String(userId))
    .select('id, user_id, name, email, phone, role, celula, discipulador_uuid, pastor_uuid')
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Não foi possível atualizar o perfil.');
  }

  const mappedUser = mapProfileToUser(data as ProfileRow);
  await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(mappedUser));
  return mappedUser;
}

export async function fetchProfile() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    await clearLocalAuthData();
    return null;
  }

  const profile = await getMemberProfileByUserId(session.user.id);
  if (!profile) {
    await supabase.auth.signOut();
    await clearLocalAuthData();
    return null;
  }

  const mappedUser = mapProfileToUser(profile);

  await AsyncStorage.setItem(AUTH_TOKEN_KEY, session.access_token);
  await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(mappedUser));

  return mappedUser;
}

export async function logout() {
  await supabase.auth.signOut();
  await clearLocalAuthData();
}

