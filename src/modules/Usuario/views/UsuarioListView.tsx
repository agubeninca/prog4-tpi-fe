import { useEffect, useState } from 'react';
import { Button, Modal, Popconfirm, Space, Table, Tag, message } from 'antd';
import { getErrorMessage } from '../../../shared/api';
import { useAuthStore } from '../../../stores/auth.store';
import { useUsuarioStore } from '../../../stores/usuario.store';
import { ETIQUETA_ROL, type UsuarioRol } from '../../Auth/services/auth.service';
import { UsuarioForm } from '../components/UsuarioForm';
import type { Usuario, UsuarioInput } from '../services/usuario.service';

const COLOR_ROL: Record<UsuarioRol, string> = { ADMIN: 'purple', COCINA: 'orange' };

export function UsuarioListView() {
  const { items, loading, fetchAll, create, update, remove } = useUsuarioStore();
  const usuarioActual = useAuthStore((state) => state.usuario);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Usuario | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAll().catch((error: unknown) => message.error(getErrorMessage(error)));
  }, [fetchAll]);

  const abrirNuevo = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const abrirEditar = (usuario: Usuario) => {
    setEditing(usuario);
    setModalOpen(true);
  };

  const handleSubmit = async (data: UsuarioInput) => {
    setSaving(true);
    try {
      if (editing) {
        await update(editing.id_usuario, data);
        message.success('Usuario actualizado');
      } else {
        await create(data);
        message.success('Usuario creado');
      }
      setModalOpen(false);
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (id: number) => {
    try {
      await remove(id);
      message.success('Usuario eliminado');
    } catch (error) {
      message.error(getErrorMessage(error));
    }
  };

  return (
    <div>
      <Space wrap style={{ marginBottom: 16, justifyContent: 'space-between', width: '100%' }}>
        <h1>Usuarios del personal</h1>
        <Button type="primary" onClick={abrirNuevo}>
          Nuevo usuario
        </Button>
      </Space>
      <Table
        rowKey="id_usuario"
        loading={loading}
        dataSource={items}
        scroll={{ x: 'max-content' }}
        columns={[
          { title: 'Nombre', dataIndex: 'nombre', width: 200 },
          { title: 'Email', dataIndex: 'email', width: 240 },
          {
            title: 'Rol',
            dataIndex: 'rol',
            width: 150,
            render: (rol: UsuarioRol) => <Tag color={COLOR_ROL[rol]}>{ETIQUETA_ROL[rol]}</Tag>,
          },
          {
            title: 'Acciones',
            render: (_, usuario: Usuario) => (
              <Space>
                <Button onClick={() => abrirEditar(usuario)}>Editar</Button>
                {usuario.id_usuario !== usuarioActual?.id_usuario && (
                  <Popconfirm
                    title="¿Eliminar usuario?"
                    description="No va a poder volver a ingresar."
                    onConfirm={() => handleRemove(usuario.id_usuario)}
                  >
                    <Button danger>Eliminar</Button>
                  </Popconfirm>
                )}
              </Space>
            ),
          },
        ]}
      />
      <Modal
        title={editing ? 'Editar usuario' : 'Nuevo usuario'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <UsuarioForm
          key={editing?.id_usuario ?? 'new'}
          editando={!!editing}
          initialValues={editing ? { email: editing.email, nombre: editing.nombre, rol: editing.rol } : undefined}
          onSubmit={handleSubmit}
          loading={saving}
        />
      </Modal>
    </div>
  );
}
