import { Tooltip } from "antd";
import "./graficos.css";

export interface PuntoColumna {
  etiqueta: string;
  /** Texto del tooltip (ej. "Lun 10/11 · $12.000,00 · 3 pedidos"). */
  detalle: string;
  valor: number;
}

interface Props {
  puntos: PuntoColumna[];
  titulo: string;
  /** Cada cuántas columnas se rotula el eje X (para que no se pisen). */
  cadaRotulo?: number;
  alto?: number;
  /** Si el gráfico se desplaza (celular), arranca mostrando el extremo derecho (lo más reciente). */
  alFinal?: boolean;
}

const ANCHO_VISTA = 960;
const MARGEN = { arriba: 12, abajo: 22, izquierda: 8, derecha: 8 };

/** Valor "redondo" por encima del máximo, para que la columna más alta no toque el techo. */
function techo(maximo: number) {
  if (maximo <= 0) return 1;
  const potencia = 10 ** Math.floor(Math.log10(maximo));
  return Math.ceil(maximo / potencia) * potencia;
}

/** Gráfico de columnas verticales de una sola serie (SVG). El detalle de cada columna va en el tooltip. */
export function Columnas({
  puntos,
  titulo,
  cadaRotulo = 1,
  alto = 220,
  alFinal = false,
}: Props) {
  const maximo = techo(Math.max(0, ...puntos.map((p) => p.valor)));
  const areaAlto = alto - MARGEN.arriba - MARGEN.abajo;
  const areaAncho = ANCHO_VISTA - MARGEN.izquierda - MARGEN.derecha;
  const banda = areaAncho / Math.max(puntos.length, 1);
  const grosor = Math.min(24, banda * 0.7);
  const base = MARGEN.arriba + areaAlto;

  return (
    <div
      className="grafico-scroll"
      ref={(el) => {
        if (el && alFinal) el.scrollLeft = el.scrollWidth;
      }}
    >
      <svg
        viewBox={`0 0 ${ANCHO_VISTA} ${alto}`}
        width="100%"
        role="img"
        aria-label={titulo}
        style={{ display: "block" }}
      >
        <line
          className="grafico__eje"
          x1={MARGEN.izquierda}
          x2={ANCHO_VISTA - MARGEN.derecha}
          y1={base}
          y2={base}
        />
        {puntos.map((punto, i) => {
          const centro = MARGEN.izquierda + banda * i + banda / 2;
          const altoBarra = (punto.valor / maximo) * areaAlto;
          const visible = punto.valor > 0 ? Math.max(altoBarra, 3) : 0;
          const radio = Math.min(4, grosor / 2, visible);
          const x = centro - grosor / 2;
          const y = base - visible;
          return (
            <Tooltip key={punto.etiqueta} title={punto.detalle}>
              <g
                className="grafico__columna"
                tabIndex={0}
                aria-label={punto.detalle}
              >
                {/* Zona de hover más ancha que la barra. */}
                <rect
                  x={centro - banda / 2}
                  y={MARGEN.arriba}
                  width={banda}
                  height={areaAlto}
                  fill="transparent"
                />
                {visible > 0 && (
                  <path
                    className="grafico__barra"
                    d={`M${x},${base} V${y + radio} Q${x},${y} ${x + radio},${y} H${x + grosor - radio} Q${x + grosor},${y} ${x + grosor},${y + radio} V${base} Z`}
                  />
                )}
                {i % cadaRotulo === 0 && (
                  <text
                    className="grafico__texto"
                    x={centro}
                    y={alto - 6}
                    textAnchor="middle"
                  >
                    {punto.etiqueta}
                  </text>
                )}
              </g>
            </Tooltip>
          );
        })}
      </svg>
    </div>
  );
}
