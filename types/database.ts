// Tipos gerados manualmente — rode `supabase gen types typescript` para atualizar
// após configurar o projeto Supabase

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      edicoes: {
        Row: {
          id: string
          nome: string
          ano: number
          valor_bolao: number
          status: 'configurando' | 'aberto' | 'em_andamento' | 'encerrado'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['edicoes']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['edicoes']['Insert']>
      }
      selecoes: {
        Row: {
          id: string
          nome: string
          codigo_iso: string
          bandeira_url: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['selecoes']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['selecoes']['Insert']>
      }
      grupos: {
        Row: {
          id: string
          edicao_id: string
          nome: string
          inicio_em: string | null
          encerrado: boolean
        }
        Insert: Omit<Database['public']['Tables']['grupos']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['grupos']['Insert']>
      }
      grupos_selecoes: {
        Row: { grupo_id: string; selecao_id: string }
        Insert: Database['public']['Tables']['grupos_selecoes']['Row']
        Update: Partial<Database['public']['Tables']['grupos_selecoes']['Row']>
      }
      resultados_grupos: {
        Row: {
          grupo_id: string
          primeiro_id: string
          segundo_id: string
          atualizado_em: string
        }
        Insert: Omit<Database['public']['Tables']['resultados_grupos']['Row'], 'atualizado_em'>
        Update: Partial<Database['public']['Tables']['resultados_grupos']['Insert']>
      }
      fases: {
        Row: {
          id: string
          edicao_id: string
          nome: 'oitavas' | 'quartas' | 'semifinal' | 'final'
          inicio_em: string | null
          prazo_apostas_em: string | null
          apostas_liberadas: boolean
        }
        Insert: Omit<Database['public']['Tables']['fases']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['fases']['Insert']>
      }
      confrontos: {
        Row: {
          id: string
          fase_id: string
          posicao: number
          selecao_a_id: string | null
          selecao_b_id: string | null
          vencedor_id: string | null
          placar_a: number | null
          placar_b: number | null
          inicio_em: string | null
        }
        Insert: Omit<Database['public']['Tables']['confrontos']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['confrontos']['Insert']>
      }
      artilheiros: {
        Row: {
          edicao_id: string
          selecao_id: string | null
          jogador_nome: string
          atualizado_em: string
        }
        Insert: Omit<Database['public']['Tables']['artilheiros']['Row'], 'atualizado_em'>
        Update: Partial<Database['public']['Tables']['artilheiros']['Insert']>
      }
      apostas_grupos: {
        Row: {
          id: string
          user_id: string
          grupo_id: string
          primeiro_id: string
          segundo_id: string
          criado_em: string
          atualizado_em: string
        }
        Insert: Omit<Database['public']['Tables']['apostas_grupos']['Row'], 'id' | 'criado_em' | 'atualizado_em'>
        Update: Partial<Database['public']['Tables']['apostas_grupos']['Insert']>
      }
      apostas_artilheiro: {
        Row: {
          id: string
          user_id: string
          edicao_id: string
          jogador_nome: string
          criado_em: string
        }
        Insert: Omit<Database['public']['Tables']['apostas_artilheiro']['Row'], 'id' | 'criado_em'>
        Update: Partial<Database['public']['Tables']['apostas_artilheiro']['Insert']>
      }
      apostas_confrontos: {
        Row: {
          id: string
          user_id: string
          confronto_id: string
          selecao_vencedor_id: string
          placar_a: number | null
          placar_b: number | null
          criado_em: string
          atualizado_em: string
        }
        Insert: Omit<Database['public']['Tables']['apostas_confrontos']['Row'], 'id' | 'criado_em' | 'atualizado_em'>
        Update: Partial<Database['public']['Tables']['apostas_confrontos']['Insert']>
      }
      pontuacoes: {
        Row: {
          id: string
          user_id: string
          edicao_id: string
          pontos_grupos: number
          pontos_oitavas: number
          pontos_quartas: number
          pontos_semifinal: number
          pontos_final: number
          pontos_artilheiro: number
          pontos_total: number
          acertos_total: number
          acertos_final: number
          acertos_semifinal: number
          primeira_aposta_em: string | null
          atualizado_em: string
        }
        Insert: Omit<Database['public']['Tables']['pontuacoes']['Row'], 'id' | 'atualizado_em'>
        Update: Partial<Database['public']['Tables']['pontuacoes']['Insert']>
      }
      perfis: {
        Row: {
          id: string
          nome: string
          avatar_url: string | null
          is_admin: boolean
          pagamento_confirmado: boolean
          bloqueado: boolean
          criado_em: string
          atualizado_em: string
        }
        Insert: Omit<Database['public']['Tables']['perfis']['Row'], 'criado_em' | 'atualizado_em'>
        Update: Partial<Database['public']['Tables']['perfis']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

// Tipos derivados convenientes
export type Edicao = Database['public']['Tables']['edicoes']['Row']
export type Selecao = Database['public']['Tables']['selecoes']['Row']
export type Grupo = Database['public']['Tables']['grupos']['Row']
export type Fase = Database['public']['Tables']['fases']['Row']
export type Confronto = Database['public']['Tables']['confrontos']['Row']
export type ApostaGrupo = Database['public']['Tables']['apostas_grupos']['Row']
export type ApostaConfrontos = Database['public']['Tables']['apostas_confrontos']['Row']
export type Pontuacao = Database['public']['Tables']['pontuacoes']['Row']
export type Perfil = Database['public']['Tables']['perfis']['Row']
