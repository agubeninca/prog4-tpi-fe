import './graficos.css';

export interface PuntoFila {
  nombre: string;
  /** Texto a la derecha de la barra (ya formateado). */
  valorTexto: string;
  valor: number;
}

/** Ranking en barras horizontales de una sola serie: el valor va al final de cada barra. */
export function Filas({ puntos, titulo }: { puntos: PuntoFila[]; titulo: string }) {
  const maximo = Math.max(0, ...puntos.map((p) => p.valor));
  return (
    <div className="grafico-filas" role="list" aria-label={titulo}>
      {puntos.map((punto) => (
        <div key={punto.nombre} className="grafico-fila" role="listitem">
          <span className="grafico-fila__nombre" title={punto.nombre}>
            {punto.nombre}
          </span>
          <div className="grafico-fila__pista">
            <div className="grafico-fila__barra" style={{ width: `${maximo > 0 ? (punto.valor / maximo) * 100 : 0}%` }} />
          </div>
          <span className="grafico-fila__valor">{punto.valorTexto}</span>
        </div>
      ))}
    </div>
  );
}
