export type Role = 'leader' | 'intern';

export type MaintenanceRow = {
  id: string;
  fornecedor?: string;
  loja?: number;
  proposta?: string;
  numeroChamado?: string;
  tipoSolicitacao?: 'Serviço' | 'Material' | string;
  responsavel?: string;
  data?: string; // ISO date
  responsavelProximaAcao?: string;

  requisicaoCriada?: string;
  pedidoCriado?: string;
  folhaServico?: string;
  confirmacao?: boolean;
};
