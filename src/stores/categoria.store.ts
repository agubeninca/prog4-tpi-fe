import { createCrudStore } from '../shared/createCrudStore';
import { categoriaService, type Categoria, type CategoriaInput } from '../modules/Categoria/services/categoria.service';

export const useCategoriaStore = createCrudStore<Categoria, CategoriaInput>(categoriaService);
