import { lazy } from 'react';

// Cada sección se descarga recién cuando se visita (el celular del cliente no baja el panel de admin).
export const LoginView = lazy(() => import('./modules/Auth/views/LoginView').then((m) => ({ default: m.LoginView })));
export const IdentificacionView = lazy(() =>
  import('./modules/ClienteMesa/views/IdentificacionView').then((m) => ({ default: m.IdentificacionView })),
);
export const MenuView = lazy(() => import('./modules/ClienteMesa/views/MenuView').then((m) => ({ default: m.MenuView })));
export const CarritoView = lazy(() => import('./modules/ClienteMesa/views/CarritoView').then((m) => ({ default: m.CarritoView })));
export const PedidoEstadoView = lazy(() =>
  import('./modules/ClienteMesa/views/PedidoEstadoView').then((m) => ({ default: m.PedidoEstadoView })),
);
export const CocinaLayout = lazy(() => import('./layouts/CocinaLayout').then((m) => ({ default: m.CocinaLayout })));
export const PanelComandasView = lazy(() =>
  import('./modules/Cocina/views/PanelComandasView').then((m) => ({ default: m.PanelComandasView })),
);
export const AdminLayout = lazy(() => import('./layouts/AdminLayout').then((m) => ({ default: m.AdminLayout })));
export const ResumenView = lazy(() => import('./modules/Resumen/views/ResumenView').then((m) => ({ default: m.ResumenView })));
export const CategoriaListView = lazy(() =>
  import('./modules/Categoria/views/CategoriaListView').then((m) => ({ default: m.CategoriaListView })),
);
export const ProductoListView = lazy(() =>
  import('./modules/Producto/views/ProductoListView').then((m) => ({ default: m.ProductoListView })),
);
export const MesaListView = lazy(() => import('./modules/Mesa/views/MesaListView').then((m) => ({ default: m.MesaListView })));
export const ReviewListView = lazy(() => import('./modules/Review/views/ReviewListView').then((m) => ({ default: m.ReviewListView })));
export const UsuarioListView = lazy(() =>
  import('./modules/Usuario/views/UsuarioListView').then((m) => ({ default: m.UsuarioListView })),
);
