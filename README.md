# Kitch – Frontend

SPA de **Kitch**, menú digital y pedidos desde la mesa (TP Integrador · Programación IV · UTN FRRa 2026).

**Stack:** React 19 + Vite · React Router · Zustand · Ant Design 6 · Axios · dayjs · decimal.js · Firebase SDK (Auth y Firestore contra los emuladores).

## Arranque

Primero levantá el backend (`npm start` en `prog4-tp-int-be`). Después, acá:

```bash
npm start   # crea el .env si falta, instala dependencias y levanta Vite en http://localhost:5173
```

Funciona igual en macOS, Windows y Linux (Node ≥ 20). Si el backend no responde, avisa, pero arranca igual.

## Vistas

| Ruta | Para quién | Notas |
|---|---|---|
| `/m/:hash` | Cliente (celular) | Se entra escaneando el QR de la mesa → DNI + nombre → menú → carrito → estado del pedido + review |
| `/login` | Personal | Firebase Auth (emulador) |
| `/cocina` | COCINA, ADMIN | Comandas en tiempo real (Firestore `onSnapshot`) y cambio de estado |
| `/admin` | ADMIN | Resumen de ventas del día, categorías, productos (imagen y pausa), mesas (QR), reviews y usuarios |

Para probar la vista cliente sin celular: en **Admin → Mesas → Ver QR** está el link "Abrir vista cliente".

## Scripts

| Script | Qué hace |
|---|---|
| `npm start` | Crea el `.env` si falta, instala dependencias y levanta Vite |
| `npm run build` | Type-check + build de producción |
| `npm run lint` | oxlint |
