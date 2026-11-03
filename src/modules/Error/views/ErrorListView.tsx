import { useEffect, useState } from 'react';
import { BugOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Dropdown, Popconfirm, Segmented, Space, Table, Tag, Typography, message } from 'antd';
import dayjs from 'dayjs';
import { getErrorMessage } from '../../../shared/api';
import { errorService, type ErrorRegistrado, type TipoSistema } from '../services/error.service';

type Filtro = 'todos' | TipoSistema;

const COLOR_TIPO: Record<TipoSistema, string> = { backend: 'volcano', frontend: 'geekblue' };

export function ErrorListView() {
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [recargas, setRecargas] = useState(0);
  const [datos, setDatos] = useState<{ clave: string; errores: ErrorRegistrado[] } | null>(null);

  const clave = `${filtro}#${recargas}`;
  const loading = datos?.clave !== clave;
  const recargar = () => setRecargas((n) => n + 1);

  useEffect(() => {
    let vigente = true;
    errorService
      .getAll(filtro === 'todos' ? undefined : filtro)
      .then((errores) => vigente && setDatos({ clave, errores }))
      .catch((error: unknown) => {
        if (!vigente) return;
        message.error(getErrorMessage(error));
        setDatos({ clave, errores: [] });
      });
    return () => {
      vigente = false;
    };
  }, [clave, filtro]);

  const vaciar = async () => {
    try {
      const { eliminados } = await errorService.vaciar();
      message.success(`Se eliminaron ${eliminados} registro(s)`);
      recargar();
    } catch (error) {
      message.error(getErrorMessage(error));
    }
  };

  // Botones de prueba: generan un error real de cada lado para verificar que el log funciona.
  const probar = async (tipo: TipoSistema) => {
    if (tipo === 'frontend') {
      // Se tira fuera de React: lo captura window.onerror (capturarErroresGlobales).
      setTimeout(() => {
        throw new Error('Error de prueba del frontend (botón "Probar" del panel)');
      });
    } else {
      await errorService.probarBackend().catch(() => undefined); // responde 500 a propósito
    }
    message.info(`Error de prueba de ${tipo} generado`);
    setTimeout(recargar, 1000);
  };

  return (
    <div>
      <Space wrap style={{ marginBottom: 16, justifyContent: 'space-between', width: '100%' }}>
        <h1>Errores</h1>
        <Space wrap>
          <Button icon={<ReloadOutlined />} onClick={recargar} loading={loading}>
            Actualizar
          </Button>
          <Dropdown
            menu={{
              items: [
                { key: 'frontend', label: 'Error de frontend' },
                { key: 'backend', label: 'Error de backend' },
              ],
              onClick: ({ key }) => void probar(key as TipoSistema),
            }}
          >
            <Button icon={<BugOutlined />}>Probar</Button>
          </Dropdown>
          <Popconfirm
            title="¿Vaciar el registro de errores?"
            description="Se borran todos los errores guardados en Firestore."
            okText="Vaciar"
            okButtonProps={{ danger: true }}
            cancelText="Cancelar"
            onConfirm={vaciar}
          >
            <Button danger icon={<DeleteOutlined />} disabled={!datos?.errores.length}>
              Vaciar
            </Button>
          </Popconfirm>
        </Space>
      </Space>
      <Typography.Paragraph type="secondary">
        Errores inesperados del backend (respuestas 500 y fallas fuera de un request) y del frontend (errores de
        JavaScript y de pantallas), guardados en Firestore. Los errores de validación (400, 404, 409) no se registran.
      </Typography.Paragraph>
      <Segmented
        style={{ marginBottom: 16 }}
        value={filtro}
        onChange={(valor) => setFiltro(valor as Filtro)}
        options={[
          { label: 'Todos', value: 'todos' },
          { label: 'Backend', value: 'backend' },
          { label: 'Frontend', value: 'frontend' },
        ]}
      />
      <Table
        rowKey="id"
        loading={loading}
        dataSource={datos?.errores ?? []}
        // Ancho fijo: así una traza larga hace salto de línea en vez de ensanchar la tabla.
        tableLayout="fixed"
        scroll={{ x: 960 }}
        locale={{ emptyText: 'No hay errores registrados' }}
        expandable={{
          rowExpandable: (error) => !!(error.stack || error.navegador),
          expandedRowRender: (error: ErrorRegistrado) => (
            <Space orientation="vertical" style={{ width: '100%' }}>
              {error.navegador && <Typography.Text type="secondary">Navegador: {error.navegador}</Typography.Text>}
              {error.stack && (
                <pre
                  style={{
                    margin: 0,
                    maxHeight: 320,
                    overflow: 'auto',
                    fontSize: 12,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                  }}
                >
                  {error.stack}
                </pre>
              )}
            </Space>
          ),
        }}
        columns={[
          {
            title: 'Fecha',
            dataIndex: 'fecha_hora',
            width: 170,
            render: (valor: string) => (
              <span title={dayjs(valor).fromNow()}>{dayjs(valor).format('DD/MM/YYYY HH:mm:ss')}</span>
            ),
          },
          {
            title: 'Origen',
            dataIndex: 'tipo_sistema',
            width: 100,
            render: (tipo: TipoSistema) => <Tag color={COLOR_TIPO[tipo]}>{tipo}</Tag>,
          },
          {
            title: 'Mensaje',
            dataIndex: 'mensaje',
            render: (valor: string) => (
              <Typography.Text ellipsis={{ tooltip: valor }}>
                {valor}
              </Typography.Text>
            ),
          },
          {
            title: 'Dónde',
            dataIndex: 'contexto',
            width: 220,
            render: (valor: string | null) =>
              valor ? (
                <Typography.Text code ellipsis={{ tooltip: valor }}>
                  {valor}
                </Typography.Text>
              ) : (
                '—'
              ),
          },
          { title: 'Usuario', dataIndex: 'usuario', width: 110, render: (valor: string | null) => valor ?? '—' },
        ]}
      />
    </div>
  );
}
