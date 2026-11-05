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
import { capturarErroresGlobales } from './shared/reportarError';
import { NotFoundView } from './shared/NotFoundView';
import { RutaProtegida } from './shared/RutaProtegida';
import { InicioView } from './modules/Inicio/views/InicioView';
import { RequiereIdentificacion } from './modules/ClienteMesa/components/RequiereIdentificacion';
import {
  AdminLayout,
  CarritoView,
  ClienteListView,
  CategoriaListView,
  ErrorListView,
  CocinaLayout,
  IdentificacionView,
  LoginView,
  MenuView,
  MesaListView,
  PedidoListView,
  PanelComandasView,
  PedidoEstadoView,
  RegistroManualView,
  ProductoListView,
  ResumenView,
  ReviewListView,
  UsuarioListView,
} from './vistas';
import './index.css';

dayjs.extend(relativeTime);
dayjs.locale('es');

// Errores de JavaScript no atrapados → log de errores (Firestore, vía POST /errores).
capturarErroresGlobales();

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

            {/* Panel de comandas: Barra lo gestiona, Cocina solo lo visualiza */}
            <Route
              path="cocina"
              element={
                <RutaProtegida roles={['ADMIN', 'BARRA', 'COCINA']}>
                  <CocinaLayout />
                </RutaProtegida>
              }
            >
              <Route index element={<PanelComandasView />} />
              <Route
                path="manuales"
                element={
                  <RutaProtegida roles={['ADMIN', 'BARRA']}>
                    <RegistroManualView />
                  </RutaProtegida>
                }
              />
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
              <Route path="pedidos" element={<PedidoListView />} />
              <Route path="clientes" element={<ClienteListView />} />
              <Route path="reviews" element={<ReviewListView />} />
              <Route path="usuarios" element={<UsuarioListView />} />
              <Route path="errores" element={<ErrorListView />} />
            </Route>

            <Route path="*" element={<NotFoundView />} />
          </Routes>
        </Cargando>
      </BrowserRouter>
    </ErrorBoundary>
  </ConfigProvider>,
);
