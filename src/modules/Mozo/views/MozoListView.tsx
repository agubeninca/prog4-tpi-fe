import { useEffect, useState } from 'react';
import { Button, Modal, Popconfirm, Space, Switch, Table, Tag, Typography, message } from 'antd';
import { getErrorMessage } from '../../../shared/api';
import { useMozoStore } from '../../../stores/mozo.store';
import { MozoForm } from '../components/MozoForm';
import type { Mozo, MozoInput } from '../services/mozo.service';

/** Mozos del salón: se eligen al cargar una comanda a mano y "toman" la mesa hasta que se cobra. */
export function MozoListView() {
  const { items, loading, fetchAll, create, update, remove } = useMozoStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Mozo | null>(null);
  const [saving, setSaving] = useState(false);
  const [cambiandoActivo, setCambiandoActivo] = useState<number | null>(null);

  useEffect(() => {
    fetchAll().catch((error: unknown) => message.error(getErrorMessage(error)));
  }, [fetchAll]);

  const abrirNuevo = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const abrirEditar = (mozo: Mozo) => {
    setEditing(mozo);
    setModalOpen(true);
  };

  const handleSubmit = async (data: MozoInput) => {
    setSaving(true);
    try {
      if (editing) {
        await update(editing.id_mozo, data);
        message.success('Mozo actualizado');
      } else {
        await create(data);
        message.success('Mozo agregado');
      }
      setModalOpen(false);
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const cambiarActivo = async (mozo: Mozo, activo: boolean) => {
    setCambiandoActivo(mozo.id_mozo);
    try {
      await update(mozo.id_mozo, { activo });
      message.success(`${mozo.nombre} ${activo ? 'activado' : 'desactivado'}`);
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setCambiandoActivo(null);
    }
  };

  const handleRemove = async (mozo: Mozo) => {
    try {
      await remove(mozo.id_mozo);
      message.success(`${mozo.nombre} eliminado`);
    } catch (error) {
      message.error(getErrorMessage(error));
    }
  };

  return (
    <div>
      <Space wrap style={{ marginBottom: 8, justifyContent: 'space-between', width: '100%' }}>
        <h1>Mozos</h1>
        <Button type="primary" onClick={abrirNuevo}>
          Nuevo mozo
        </Button>
      </Space>
      <Typography.Paragraph type="secondary" style={{ maxWidth: 720 }}>
        Al cargar una comanda a mano se elige el mozo que atiende la mesa. La mesa queda a su nombre hasta que todos sus
        pedidos estén pagados o cancelados: mientras tanto, otro mozo no le puede cargar comandas.
      </Typography.Paragraph>
      <Table
        rowKey="id_mozo"
        loading={loading}
        dataSource={items}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: 'Todavía no hay mozos' }}
        columns={[
          { title: 'Nombre', dataIndex: 'nombre', width: 220 },
          {
            title: 'Activo',
            width: 100,
            align: 'center',
            render: (_, mozo: Mozo) => (
              <Switch
                checked={mozo.activo}
                loading={cambiandoActivo === mozo.id_mozo}
                onChange={(activo) => void cambiarActivo(mozo, activo)}
                aria-label={`${mozo.activo ? 'Desactivar' : 'Activar'} a ${mozo.nombre}`}
              />
            ),
          },
          {
            title: 'Atendiendo ahora',
            render: (_, mozo: Mozo) =>
              mozo.mesas_atendiendo.length === 0 ? (
                <Typography.Text type="secondary">Sin mesas</Typography.Text>
              ) : (
                <Space size={4} wrap>
                  {mozo.mesas_atendiendo.map((numero) => (
                    <Tag key={numero} color="blue">
                      Mesa {numero}
                    </Tag>
                  ))}
                </Space>
              ),
          },
          {
            title: 'Acciones',
            width: 200,
            render: (_, mozo: Mozo) => (
              <Space>
                <Button onClick={() => abrirEditar(mozo)}>Editar</Button>
                <Popconfirm
                  title={`¿Eliminar a ${mozo.nombre}?`}
                  description="Sus pedidos anteriores siguen mostrando que los atendió."
                  onConfirm={() => handleRemove(mozo)}
                >
                  <Button danger>Eliminar</Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />
      <Modal
        title={editing ? 'Editar mozo' : 'Nuevo mozo'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <MozoForm
          key={editing?.id_mozo ?? 'nuevo'}
          initialValues={editing ? { nombre: editing.nombre, activo: editing.activo } : undefined}
          onSubmit={handleSubmit}
          loading={saving}
        />
      </Modal>
    </div>
  );
}
