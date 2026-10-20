import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router';
import { ConfigProvider } from 'antd';
import esES from 'antd/locale/es_ES';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import relativeTime from 'dayjs/plugin/relativeTime';
import { ClienteLayout } from './layouts/ClienteLayout';
import { Cargando } from './shared/Cargando';
import { ErrorBoundary } from './shared/ErrorBoundary';
import { NotFoundView } from './shared/NotFoundView';
import { RutaProtegida } from './shared/RutaProtegida';
import { InicioView } from './modules/Inicio/views/InicioView';
import { RequiereIdentificacion } from './modules/ClienteMesa/components/RequiereIdentificacion';
import {
  AdminLayout,
  CarritoView,
  CategoriaListView,
  CocinaLayout,
  IdentificacionView,
  LoginView,
  MenuView,
  MesaListView,
  PanelComandasView,
  PedidoEstadoView,
  ProductoListView,
  ResumenView,
  ReviewListView,
  UsuarioListView,
} from './vistas';
import './index.css';

dayjs.extend(relativeTime);
dayjs.locale('es');

const root = document.getElementById('root')!;

ReactDOM.createRoot(root).render(
  <ConfigProvider locale={esES}>
    <ErrorBoundary>
      <BrowserRouter>
        <Cargando>
          <Routes>
            <Route index element={<InicioView />} />
            <Route path="login" element={<LoginView />} />

            {/* Vista Cliente (pública, mobile-first): se entra escaneando el QR de la mesa */}
            <Route path="m/:hash" element={<ClienteLayout />}>
              <Route index element={<IdentificacionView />} />
              <Route element={<RequiereIdentificacion />}>
                <Route path="menu" element={<MenuView />} />
                <Route path="carrito" element={<CarritoView />} />
                <Route path="pedido/:id" element={<PedidoEstadoView />} />
              </Route>
            </Route>

            {/* Vista Cocina / Barra */}
            <Route
              path="cocina"
              element={
                <RutaProtegida roles={['ADMIN', 'COCINA']}>
                  <CocinaLayout />
                </RutaProtegida>
              }
            >
              <Route index element={<PanelComandasView />} />
            </Route>

            {/* Panel de Administración */}
            <Route
              path="admin"
              element={
                <RutaProtegida roles={['ADMIN']}>
                  <AdminLayout />
                </RutaProtegida>
              }
            >
              <Route index element={<ResumenView />} />
              <Route path="categorias" element={<CategoriaListView />} />
              <Route path="productos" element={<ProductoListView />} />
              <Route path="mesas" element={<MesaListView />} />
              <Route path="reviews" element={<ReviewListView />} />
              <Route path="usuarios" element={<UsuarioListView />} />
            </Route>

            <Route path="*" element={<NotFoundView />} />
          </Routes>
        </Cargando>
      </BrowserRouter>
    </ErrorBoundary>
  </ConfigProvider>,
);
