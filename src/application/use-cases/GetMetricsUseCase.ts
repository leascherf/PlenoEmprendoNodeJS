// ─────────────────────────────────────────────
//  USE CASE: GetMetricsUseCase
//  Calcula métricas de negocio a partir de leads.
//  Equivale a MetricsForm del WinForms.
// ─────────────────────────────────────────────

import { Lead } from '../../domain/entities/Lead';
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
  tasaConversion: number; // % de leads que llegaron a FINALIZADO
}

export class GetMetricsUseCase {
  constructor(private readonly leadRepo: ILeadRepository) {}

  async execute(filter?: MetricsFilter): Promise<GetMetricsOutput> {
    const allLeads = await this.leadRepo.getAll();

    // Filtrar por fecha si se especifica
    const leads = filter
      ? allLeads.filter((l) => this.inRange(l, filter))
      : allLeads;

    // Leads por estado
    const leadsPorEstado: Record<string, number> = {};
    for (const lead of leads) {
      const estado = lead.state.estadoLead || 'Sin estado';
      leadsPorEstado[estado] = (leadsPorEstado[estado] ?? 0) + 1;
    }

    // Leads por closer
    const closerMap = new Map<string, CloserMetric>();
    for (const lead of leads) {
      const closer = lead.info.closer || 'Sin asignar';
      if (!closerMap.has(closer)) {
        closerMap.set(closer, {
          closer,
          total: 0,
          finalizados: 0,
          enProceso: 0,
          pasaronACloser: 0,
        });
      }
      const m = closerMap.get(closer)!;
      m.total++;
      if (lead.state.estadoLead === 'FINALIZADO' || lead.state.cerradoManual) m.finalizados++;
      else m.enProceso++;
      if (lead.state.pasoACloser) m.pasaronACloser++;
    }

    const finalizados = leads.filter(
      (l) => l.state.estadoLead === 'FINALIZADO' || l.state.cerradoManual
    ).length;

    return {
      totalLeads: leads.length,
      leadsPorEstado,
      leadsPorCloser: Array.from(closerMap.values()),
      duplicadosPendientes: leads.filter(
        (l) => l.state.posibleDuplicado && !l.state.duplicadoChequeado
      ).length,
      seguimientosPendientes: leads.filter(
        (l) => l.state.estadoLead === 'Link Enviado: Seguimiento'
      ).length,
      finalizados,
      tasaConversion: leads.length > 0
        ? Math.round((finalizados / leads.length) * 100)
        : 0,
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
