import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatarPontos(pontos: number): string {
  return pontos.toLocaleString('pt-BR')
}

export function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function bandeiraPorCodigo(codigo: string): string {
  return `https://flagcdn.com/48x36/${codigo.toLowerCase()}.png`
}

// Converte código ISO de seleção para código de país da flagcdn
// Alguns países têm códigos diferentes entre FIFA e ISO
const CODIGO_PAIS: Record<string, string> = {
  ENG: 'gb-eng',
  SCO: 'gb-sct',
  WAL: 'gb-wls',
  KSA: 'sa',
  KOR: 'kr',
  CRC: 'cr',
  GER: 'de',
  NED: 'nl',
  SUI: 'ch',
  DEN: 'dk',
  AUT: 'at',
  BEL: 'be',
  CMR: 'cm',
  CIV: 'ci',
  CRO: 'hr',
  ECU: 'ec',
  EGY: 'eg',
  GHA: 'gh',
  IRN: 'ir',
  IRQ: 'iq',
  MAR: 'ma',
  NGA: 'ng',
  POL: 'pl',
  POR: 'pt',
  ROU: 'ro',
  RSA: 'za',
  SEN: 'sn',
  SRB: 'rs',
  TUR: 'tr',
  UKR: 'ua',
  URU: 'uy',
  VEN: 've',
  ALG: 'dz',
  NZL: 'nz',
}

export function codigoBandeira(codigoISO: string): string {
  return CODIGO_PAIS[codigoISO] ?? codigoISO.toLowerCase()
}

export function urlBandeira(codigoISO: string, tamanho: '20x15' | '48x36' | '80x60' = '48x36'): string {
  return `https://flagcdn.com/${tamanho}/${codigoBandeira(codigoISO)}.png`
}
