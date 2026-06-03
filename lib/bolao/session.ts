import { cookies } from 'next/headers'

export const BOLAO_COOKIE = 'bolao_id'

/** Retorna o bolao_id salvo no cookie do servidor (Server Components / Route Handlers) */
export async function getBolaoId(): Promise<string | null> {
  const store = await cookies()
  return store.get(BOLAO_COOKIE)?.value ?? null
}

/** Retorna o bolao_id ou lança erro se não estiver definido */
export async function requireBolaoId(): Promise<string> {
  const id = await getBolaoId()
  if (!id) throw new Error('Nenhum bolão selecionado')
  return id
}
