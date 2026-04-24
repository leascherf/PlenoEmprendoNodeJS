import { Lead, isFinalized, hasDuplicate, needsFollowUp } from '../../domain/entities/Lead';
import { ILeadRepository } from '../../domain/repositories/ILeadRepository';

export interface MetricsFilter {
  desde?: Date;
  hasta?: Date;
}

export interface CloserMetric {
  closer: string;
  total: number;
  finalizados: number;
  enProceso: number;
  pasaronACloser: number;
}

export interface GetMetricsOutput {
  totalLeads: number;
  leadsPorEstado: Record<string, number>;
  leadsPorCloser: CloserMetric[];
  duplicadosPendientes: number;
  seguimientosPendientes: number;
  finalizados: number;
  tasaConversion: number;
}

export class GetMetricsUseCase {
  constructor(private readonly leadRepo: ILeadRepository) {}

  async execute(filter?: MetricsFilter): Promise<GetMetricsOutput> {
    const allLeads = await this.leadRepo.getAll();
    const leads = filter ? allLeads.filter((l) => this.inRange(l, filter)) : allLeads;

    const leadsPorEstado: Record<string, number> = {};
    for (const lead of leads) {
      const estado = lead.state.estadoLead || 'Sin estado';
      leadsPorEstado[estado] = (leadsPorEstado[estado] ?? 0) + 1;
    }

    const closerMap = new Map<string, CloserMetric>();
    for (const lead of leads) {
      const closer = lead.info.closer || 'Sin asignar';
      if (!closerMap.has(closer)) {
        closerMap.set(closer, { closer, total: 0, finalizados: 0, enProceso: 0, pasaronACloser: 0 });
      }
      const m = closerMap.get(closer)!;
      m.total++;
      if (isFinalized(lead)) m.finalizados++;
      else m.enProceso++;
      if (lead.state.pasoACloser) m.pasaronACloser++;
    }

    const finalizados = leads.filter(isFinalized).length;

    return {
      totalLeads: leads.length,
      leadsPorEstado,
      leadsPorCloser: Array.from(closerMap.values()),
      duplicadosPendientes: leads.filter(hasDuplicate).length,
      seguimientosPendientes: leads.filter(needsFollowUp).length,
      finalizados,
      tasaConversion: leads.length > 0 ? Math.round((finalizados / leads.length) * 100) : 0,
    };
  }

  private inRange(lead: Lead, filter: MetricsFilter): boolean {
    const fecha = lead.info.fechaAgendado;
    if (!fecha) return true;
    if (filter.desde && fecha < filter.desde) return false;
    if (filter.hasta && fecha > filter.hasta) return false;
    return true;
  }
}
