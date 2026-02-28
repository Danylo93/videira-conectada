import { api } from './api';

export async function fetchTenantTheme(slug: string) {
  const { data } = await api.get(`/tenants/${slug}/theme`);
  return data.backgroundColor || '#100C08';
}
