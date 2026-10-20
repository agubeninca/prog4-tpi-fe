import { createCrudStore } from '../shared/createCrudStore';
import { usuarioService, type Usuario, type UsuarioInput } from '../modules/Usuario/services/usuario.service';

export const useUsuarioStore = createCrudStore<Usuario, UsuarioInput>(usuarioService);
