# Kitch – Frontend

SPA de **Kitch**, menú digital y pedidos desde la mesa (TP Integrador · Programación IV · UTN FRRa 2026).

**Stack:** React 19 + Vite · React Router · Zustand · Ant Design 6 · Axios · dayjs · decimal.js · Firebase SDK (Auth y Firestore contra los emuladores).

## Arranque

Primero levantá el backend (`npm start` en `prog4-tp-int-be`). Después, acá:

```bash
npm start   # crea el .env si falta, instala dependencias y levanta Vite en http://localhost:5173
```

Funciona igual en macOS, Windows y Linux (Node ≥ 20). Si el backend no responde, avisa, pero arranca igual.

## Tema de marca (colores)

Los colores de la app están centralizados en **un solo lugar** para poder llevarla a otro negocio sin tocar las pantallas:

- `src/theme/marca.ts`: la paleta (`MARCA`) y el tema de Ant Design (`temaAntd`), que se aplica una sola vez en `main.tsx`.
- `src/theme/marca.css`: las mismas variables como CSS (`--marca-verde`, `--marca-rojo`, …) para estilos propios.

Paleta actual: **Puma Energy** — verde `#00764A`, rojo `#ED1C24`, coral `#FB6962` y negro `#000000`. Para otro negocio, cambiar los valores en esos dos archivos. No hay logo: solo colores.

## Vistas

| Ruta | Para quién | Notas |
|---|---|---|
| `/m/:hash` | Cliente (celular) | Se entra escaneando el QR de la mesa → DNI + nombre → menú → carrito → estado del pedido + review |
| `/login` | Personal | Firebase Auth (emulador) |
| `/cocina` | BARRA, COCINA, ADMIN | Comandas en tiempo real (Firestore `onSnapshot`). BARRA y ADMIN cambian el estado; COCINA solo lo visualiza |
| `/cocina/manuales` | BARRA, ADMIN | Registro de comandas cargadas a mano (botón "Cargar comanda" del panel): horario, comanda, cliente y quién la cargó |
| `/cocina/caja` | BARRA, ADMIN | Cierre de caja del día: cobrado por medio de pago, efectivo en caja, cuentas y servidos sin cobrar |
| `/m/:hash/mis-pedidos` | Cliente | Últimos pedidos con "Pedir de nuevo"; avisos en vivo (SSE) cuando un pedido cambia de estado |
| `/admin/estadisticas` | ADMIN | Gráficos de ventas (por día, por hora, productos más vendidos, por mozo) a 7, 30 o 90 días |
| `/admin` | ADMIN | Resumen de ventas del día, historial de pedidos (con quién cambió cada estado), categorías y productos con orden del menú (imagen y pausa), mesas (QR), clientes (ficha con pedidos y reviews), reviews, usuarios y log de errores |

Para probar la vista cliente sin celular: en **Admin → Mesas → Ver QR** está el link "Abrir vista cliente".

## Probar desde el celular

1. Conectá el celular a **la misma red WiFi** que la PC.
2. Corré `npm start` en los dos proyectos. El frontend muestra `✔ Red local: <IP>`: esa IP es la que va en los QR.
3. En **Admin → Mesas → Ver QR**, escaneá el QR con la cámara del celular.

La app detecta sola desde dónde se abrió y le pide la API, el login y las imágenes a esa misma IP, así que el `.env` no se toca.

- **Windows:** la primera vez, el Firewall pregunta por Node.js y Java: permití el acceso en redes **privadas**. La red WiFi tiene que estar como "Privada" (Configuración → Red e Internet → Wi-Fi → propiedades).
- **macOS:** si aparece "¿Permitir conexiones entrantes?" para `node` o `java`, elegí Permitir.
- Si `npm start` elige un adaptador equivocado (VPN, máquina virtual), forzá la IP con `KITCH_IP_LAN=192.168.x.x` en el `.env`.
- Redes de facultad o de bares suelen aislar a los dispositivos entre sí: si el celular no abre la página, probá con el hotspot del celular.

## Scripts

| Script | Qué hace |
|---|---|
| `npm start` | Crea el `.env` si falta, instala dependencias y levanta Vite |
| `npm run build` | Type-check + build de producción |
| `npm run lint` | oxlint |
