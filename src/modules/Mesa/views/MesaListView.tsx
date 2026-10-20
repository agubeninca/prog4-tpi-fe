import { useEffect, useState } from 'react';
import { QrcodeOutlined } from '@ant-design/icons';
import { Button, Modal, Popconfirm, Space, Switch, Table, message } from 'antd';
import { getErrorMessage } from '../../../shared/api';
import { useMesaStore } from '../../../stores/mesa.store';
import { MesaForm } from '../components/MesaForm';
import { MesaQrModal } from '../components/MesaQrModal';
import { mesaService, type Mesa, type MesaInput } from '../services/mesa.service';

export function MesaListView() {
  const { items, loading, fetchAll, create, update, remove } = useMesaStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Mesa | null>(null);
  const [saving, setSaving] = useState(false);
  const [mesaQr, setMesaQr] = useState<Mesa | null>(null);

  useEffect(() => {
    fetchAll().catch((error: unknown) => message.error(getErrorMessage(error)));
  }, [fetchAll]);

  const abrirNueva = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const abrirEditar = (mesa: Mesa) => {
    setEditing(mesa);
    setModalOpen(true);
  };

  const handleSubmit = async (data: MesaInput) => {
    setSaving(true);
    try {
      if (editing) {
        await update(editing.id_mesa, data);
        message.success('Mesa actualizada');
      } else {
        await create(data);
        message.success('Mesa creada');
      }
      setModalOpen(false);
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleActiva = async (mesa: Mesa, activa: boolean) => {
    try {
      await update(mesa.id_mesa, { numero_mesa: mesa.numero_mesa, activa });
      message.success(activa ? `Mesa ${mesa.numero_mesa} habilitada` : `Mesa ${mesa.numero_mesa} deshabilitada`);
    } catch (error) {
      message.error(getErrorMessage(error));
    }
  };

  const handleRegenerarQr = async (mesa: Mesa) => {
    try {
      const actualizada = await mesaService.regenerarQr(mesa.id_mesa);
      await fetchAll();
      setMesaQr(actualizada);
      message.success('QR regenerado. El QR impreso anterior dejó de funcionar');
    } catch (error) {
      message.error(getErrorMessage(error));
    }
  };

  const handleRemove = async (id: number) => {
    try {
      await remove(id);
      message.success('Mesa eliminada');
    } catch (error) {
      message.error(getErrorMessage(error));
    }
  };

  return (
    <div>
      <Space wrap style={{ marginBottom: 16, justifyContent: 'space-between', width: '100%' }}>
        <h1>Mesas</h1>
        <Button type="primary" onClick={abrirNueva}>
          Nueva mesa
        </Button>
      </Space>
      <Table
        rowKey="id_mesa"
        loading={loading}
        dataSource={items}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: 'Todavía no hay mesas' }}
        columns={[
          { title: 'Mesa', dataIndex: 'numero_mesa', width: 90, align: 'center' },
          {
            title: 'Habilitada',
            width: 110,
            align: 'center',
            render: (_, mesa: Mesa) => (
              <Switch
                checked={mesa.activa}
                checkedChildren="Sí"
                unCheckedChildren="No"
                onChange={(activa) => handleActiva(mesa, activa)}
              />
            ),
          },
          {
            title: 'Acciones',
            render: (_, mesa: Mesa) => (
              <Space wrap>
                <Button icon={<QrcodeOutlined />} onClick={() => setMesaQr(mesa)}>
                  Ver QR
                </Button>
                <Button onClick={() => abrirEditar(mesa)}>Editar</Button>
                <Popconfirm
                  title="¿Regenerar el QR?"
                  description="El QR impreso actual dejará de funcionar."
                  onConfirm={() => handleRegenerarQr(mesa)}
                >
                  <Button>Regenerar QR</Button>
                </Popconfirm>
                <Popconfirm title="¿Eliminar mesa?" onConfirm={() => handleRemove(mesa.id_mesa)}>
                  <Button danger>Eliminar</Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />
      <Modal
        title={editing ? `Editar mesa ${editing.numero_mesa}` : 'Nueva mesa'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <MesaForm
          key={editing?.id_mesa ?? 'new'}
          initialValues={editing ? { numero_mesa: editing.numero_mesa, activa: editing.activa } : undefined}
          onSubmit={handleSubmit}
          loading={saving}
        />
      </Modal>
      <MesaQrModal mesa={mesaQr} onClose={() => setMesaQr(null)} />
    </div>
  );
}
