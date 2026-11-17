import { useEffect, useState } from 'react';
import { LockOutlined, ReloadOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Col, Flex, Result, Row, Space, Spin, Statistic, Typography, message } from 'antd';
import dayjs from 'dayjs';
import { getErrorMessage } from '../../../shared/api';
import { formatearMoneda } from '../../../shared/moneda';
import { MARCA } from '../../../theme/marca';
import { ETIQUETA_TURNO, turnoService, type Turno, type TurnoActual } from '../services/turno.service';
import { AbrirTurnoCard } from './AbrirTurnoCard';
import { CerrarTurnoModal } from './CerrarTurnoModal';
import { DiferenciaCaja } from './DiferenciaCaja';
import { ResumenCajaDetalle } from './ResumenCajaDetalle';

const cobrados = (n: number) => `${n} ${n === 1 ? 'pedido cobrado' : 'pedidos cobrados'}`;

/** Turno abierto con su caja en vivo; si no hay ninguno, el formulario para abrirlo. */
export function TurnoActualPanel() {
  const [recargas, setRecargas] = useState(0);
  const [datos, setDatos] = useState<{ clave: number; turno: TurnoActual | null } | null>(null);
  const [cerrando, setCerrando] = useState(false);
  const [ultimoCierre, setUltimoCierre] = useState<Turno | null>(null);

  const cargando = datos?.clave !== recargas;
  // Mientras recarga se sigue mostrando lo último que se trajo.
  const turno = datos ? datos.turno : undefined;
  const recargar = () => setRecargas((n) => n + 1);

  useEffect(() => {
    let vigente = true;
    turnoService
      .actual()
      .then((actual) => vigente && setDatos({ clave: recargas, turno: actual }))
      .catch((error: unknown) => {
        if (!vigente) return;
        message.error(getErrorMessage(error));
        setDatos((previo) => ({ clave: recargas, turno: previo?.turno ?? null }));
      });
    return () => {
      vigente = false;
    };
  }, [recargas]);

  if (turno === undefined) {
    return (
      <Flex justify="center" style={{ padding: 48 }}>
        <Spin />
      </Flex>
    );
  }

  if (!turno) {
    return (
      <Space orientation="vertical" size={16} style={{ width: '100%' }}>
        {ultimoCierre && (
          <Result
            status={ultimoCierre.diferencia && Number(ultimoCierre.diferencia) !== 0 ? 'warning' : 'success'}
            title={`Turno ${ETIQUETA_TURNO[ultimoCierre.nombre].toLowerCase()} cerrado`}
            subTitle={
              <Space orientation="vertical" size={4}>
                <span>
                  Cobrado: <strong>{formatearMoneda(ultimoCierre.resumen?.cobrado.total ?? '0')}</strong> · Efectivo esperado{' '}
                  {formatearMoneda(ultimoCierre.efectivo_esperado ?? '0')} · Contado {formatearMoneda(ultimoCierre.efectivo_contado ?? '0')}
                </span>
                <DiferenciaCaja diferencia={ultimoCierre.diferencia} />
              </Space>
            }
            style={{ padding: '16px 0' }}
          />
        )}
        <AbrirTurnoCard
          onAbierto={() => {
            setUltimoCierre(null);
            recargar();
          }}
        />
      </Space>
    );
  }

  const apertura = dayjs(turno.fecha_apertura);

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <Card>
        <Flex justify="space-between" align="center" wrap gap={12}>
          <div>
            <Typography.Title level={4} style={{ margin: 0 }}>
              Turno {ETIQUETA_TURNO[turno.nombre].toLowerCase()} · abierto
            </Typography.Title>
            <Typography.Text type="secondary">
              Desde el {apertura.format('DD/MM')} a las {apertura.format('HH:mm')} · lo abrió {turno.usuario_apertura.nombre}
            </Typography.Text>
          </div>
          <Space wrap>
            <Button icon={<ReloadOutlined />} onClick={recargar} loading={cargando}>
              Actualizar
            </Button>
            <Button type="primary" danger icon={<LockOutlined />} onClick={() => setCerrando(true)}>
              Cerrar turno
            </Button>
          </Space>
        </Flex>
      </Card>

      <Row gutter={[16, 16]} align="stretch">
        <Col xs={24} md={8}>
          <Card style={{ height: '100%', borderTop: `3px solid ${MARCA.verde}` }}>
            <Statistic
              title="Cobrado en el turno"
              value={formatearMoneda(turno.resumen.cobrado.total)}
              styles={{ content: { color: MARCA.verde, fontSize: 28 } }}
            />
            <Typography.Text type="secondary">{cobrados(turno.resumen.cobrado.cantidad)}</Typography.Text>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card style={{ height: '100%' }}>
            <Statistic title="Efectivo inicial" value={formatearMoneda(turno.efectivo_inicial)} styles={{ content: { fontSize: 28 } }} />
            <Typography.Text type="secondary">
              + {formatearMoneda(turno.resumen.cobrado.efectivo_en_caja)} cobrado en efectivo
            </Typography.Text>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card style={{ height: '100%', borderTop: `3px solid ${MARCA.negro}` }}>
            <Statistic
              title="Tiene que haber en la caja"
              value={formatearMoneda(turno.efectivo_esperado)}
              styles={{ content: { fontSize: 28 } }}
            />
            <Typography.Text type="secondary">Se compara con lo que cuentes al cerrar</Typography.Text>
          </Card>
        </Col>
      </Row>

      {turno.resumen.sin_cobrar.cantidad > 0 && (
        <Alert
          type="warning"
          showIcon
          title={`Hay ${turno.resumen.sin_cobrar.cantidad} pedidos servidos sin cobrar (${formatearMoneda(turno.resumen.sin_cobrar.total)}).`}
          description="Si cerrás el turno igual, se cobran en el próximo."
        />
      )}

      <ResumenCajaDetalle resumen={turno.resumen} periodo="en este turno" />

      <CerrarTurnoModal
        turno={turno}
        open={cerrando}
        onClose={() => setCerrando(false)}
        onCerrado={(cerrado) => {
          setCerrando(false);
          setUltimoCierre(cerrado);
          setDatos({ clave: recargas, turno: null });
        }}
      />
    </Space>
  );
}
