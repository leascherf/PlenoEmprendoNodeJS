import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { GetLeadsUseCase } from '../../application/use-cases/GetLeadsUseCase';
import { UpdateLeadStateUseCase } from '../../application/use-cases/UpdateLeadStateUseCase';
import { SyncSheetsUseCase } from '../../application/use-cases/SyncSheetsUseCase';
import { GetMetricsUseCase } from '../../application/use-cases/GetMetricsUseCase';

export const leadsRouter = Router();

leadsRouter.use(requireAuth);

// GET /api/leads/metrics/summary — debe ir ANTES de /:contactId para no ser atrapado por ese patrón
leadsRouter.get('/metrics/summary', async (req: Request, res: Response) => {
  try {
    const useCase = new GetMetricsUseCase(req.leadRepository!);
    const result = await useCase.execute({
      desde: req.query.desde ? new Date(req.query.desde as string) : undefined,
      hasta: req.query.hasta ? new Date(req.query.hasta as string) : undefined,
    });
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al calcular métricas';
    res.status(500).json({ error: message });
  }
});

// GET /api/leads
leadsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const useCase = new GetLeadsUseCase(req.leadRepository!);
    const result = await useCase.execute({
      filter: {
        search: req.query.search as string,
        estadoLead: req.query.estadoLead as string,
        closer: req.query.closer as string,
        soloConDuplicados: req.query.soloConDuplicados === 'true',
        soloConSeguimiento: req.query.soloConSeguimiento === 'true',
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      },
    });
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al cargar leads';
    res.status(500).json({ error: message });
  }
});

// POST /api/leads/sync
leadsRouter.post('/sync', async (req: Request, res: Response) => {
  try {
    const useCase = new SyncSheetsUseCase(req.leadRepository!);
    const result = await useCase.execute();
    if (!result.success) {
      res.status(500).json({ error: result.error });
      return;
    }
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error en sincronización';
    res.status(500).json({ error: message });
  }
});

// GET /api/leads/:contactId
leadsRouter.get('/:contactId', async (req: Request, res: Response) => {
  try {
    const lead = await req.leadRepository!.getById(req.params.contactId);
    if (!lead) {
      res.status(404).json({ error: 'Lead no encontrado' });
      return;
    }
    res.json(lead);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al obtener lead';
    res.status(500).json({ error: message });
  }
});

// PUT /api/leads/:contactId
leadsRouter.put('/:contactId', async (req: Request, res: Response) => {
  try {
    const useCase = new UpdateLeadStateUseCase(req.leadRepository!);
    const result = await useCase.execute({
      contactId: req.params.contactId,
      changes: req.body,
    });
    if (!result.success) {
      res.status(400).json({ errors: result.errors });
      return;
    }
    res.json(result.lead);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al actualizar lead';
    res.status(500).json({ error: message });
  }
});
