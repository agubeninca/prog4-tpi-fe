import type { ThemeConfig } from 'antd';

/**
 * Colores de marca: ÚNICO lugar donde se definen. Para llevar la app a otro negocio alcanza con
 * cambiar esta paleta (y los mismos valores en `marca.css`, que son las variables CSS equivalentes).
 *
 * Paleta actual: Puma Energy (códigos de marca).
 */
export const MARCA = {
  /** Verde institucional. Color principal: botones, links, selección, "vendido". */
  verde: '#00764A',
  /** Verde oscuro (derivado del institucional): fondo del menú lateral. */
  verdeOscuro: '#004D30',
  /** Verde muy claro (derivado): fondos suaves. */
  verdeSuave: '#E6F2ED',
  /** Rojo principal: acentos, ítem activo del menú y acciones destructivas. */
  rojo: '#ED1C24',
  /** Rojo secundario / coral: hover y acentos suaves. */
  coral: '#FB6962',
  /** Negro de la marca: tipografía y contrastes. */
  negro: '#000000',
} as const;

/** Tema de Ant Design a partir de la paleta de marca (se aplica con <ConfigProvider theme={...}>). */
export const temaAntd: ThemeConfig = {
  token: {
    colorPrimary: MARCA.verde,
    colorSuccess: MARCA.verde,
    colorError: MARCA.rojo,
    colorLink: MARCA.verde,
    colorTextBase: MARCA.negro,
    borderRadius: 8,
  },
  components: {
    Layout: {
      headerBg: MARCA.verde,
      siderBg: MARCA.verdeOscuro,
      triggerBg: MARCA.verdeOscuro,
    },
    Menu: {
      darkItemBg: MARCA.verdeOscuro,
      darkSubMenuItemBg: MARCA.verdeOscuro,
      darkItemColor: 'rgba(255, 255, 255, 0.82)',
      darkItemHoverBg: 'rgba(255, 255, 255, 0.1)',
      darkItemHoverColor: '#ffffff',
      darkItemSelectedBg: MARCA.rojo,
      darkItemSelectedColor: '#ffffff',
      darkGroupTitleColor: 'rgba(255, 255, 255, 0.55)',
    },
  },
};
