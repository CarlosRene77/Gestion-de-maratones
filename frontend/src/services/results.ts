import type {
  Certificado,
  ResultadoDorsal,
  ResultadosEvento,
  Genero,
} from '@/types';
import { request } from './api';

export const resultsApi = {
  async byEvent(
    idEvento: number | string,
    filters: { genero?: Genero; id_categoria?: number } = {},
  ): Promise<ResultadosEvento> {
    return (
      await request<ResultadosEvento>({
        method: 'GET',
        url: `/resultados/evento/${idEvento}`,
        params: filters,
      })
    ).data;
  },

  async byDorsal(numeroDorsal: number | string): Promise<ResultadoDorsal> {
    return (
      await request<ResultadoDorsal>({
        method: 'GET',
        url: `/resultados/dorsal/${numeroDorsal}`,
      })
    ).data;
  },

  async certificate(numeroDorsal: number | string): Promise<Certificado> {
    return (
      await request<Certificado>({
        method: 'GET',
        url: `/resultados/certificado/${numeroDorsal}`,
      })
    ).data;
  },
};
