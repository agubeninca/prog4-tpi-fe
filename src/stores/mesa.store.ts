import { createCrudStore } from '../shared/createCrudStore';
import { mesaService, type Mesa, type MesaInput } from '../modules/Mesa/services/mesa.service';

export const useMesaStore = createCrudStore<Mesa, MesaInput>(mesaService);
