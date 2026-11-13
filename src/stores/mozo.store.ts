import { createCrudStore } from '../shared/createCrudStore';
import { mozoService, type Mozo, type MozoInput } from '../modules/Mozo/services/mozo.service';

export const useMozoStore = createCrudStore<Mozo, MozoInput>(mozoService);
