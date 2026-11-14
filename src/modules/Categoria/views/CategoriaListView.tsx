import { useEffect, useState } from 'react';
import { Button, Modal, Popconfirm, Space, Table, message } from 'antd';
import { getErrorMessage } from '../../../shared/api';
import { BotonesOrden } from '../../../shared/BotonesOrden';
import { moverElemento } from '../../../shared/moverElemento';
import { useCategoriaStore } from '../../../stores/categoria.store';
import { CategoriaForm } from '../components/CategoriaForm';
import { categoriaService, type Categoria, type CategoriaInput } from '../services/categoria.service';

export function CategoriaListView() {
  const { items, loading, fetchAll, create, update, remove } = useCategoriaStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Categoria | null>(null);
  const [saving, setSaving] = useState(false);
  const [ordenando, setOrdenando] = useState(false);

  useEffect(() => {
    fetchAll().catch((error: unknown) => message.error(getErrorMessage(error)));
  }, [fetchAll]);

  const abrirNueva = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const abrirEditar = (categoria: Categoria) => {
    setEditing(categoria);
    setModalOpen(true);
  };

  const handleSubmit = async (data: CategoriaInput) => {
    setSaving(true);
    try {
      if (editing) {
        await update(editing.id_categoria, data);
        message.success('Categoría actualizada');
      } else {
        await create(data);
        message.success('Categoría creada');
      }
      setModalOpen(false);
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  // El orden de las categorías es el del menú que ve el cliente.
  const mover = async (indice: number, delta: number) => {
    setOrdenando(true);
    try {
      await categoriaService.ordenar(moverElemento(items, indice, delta).map((categoria) => categoria.id_categoria));
      await fetchAll();
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setOrdenando(false);
    }
  };

  const handleRemove = async (id: number) => {
    try {
      await remove(id);
      message.success('Categoría eliminada');
    } catch (error) {
      message.error(getErrorMessage(error));
    }
  };

  return (
    <div>
      <Space wrap style={{ marginBottom: 16, justifyContent: 'space-between', width: '100%' }}>
        <h1>Categorías</h1>
        <Button type="primary" onClick={abrirNueva}>
          Nueva categoría
        </Button>
      </Space>
      <Table
        rowKey="id_categoria"
        loading={loading}
        dataSource={items}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: 'Todavía no hay categorías' }}
        columns={[
          {
            title: 'Orden',
            width: 90,
            render: (_, __: Categoria, indice: number) => (
              <BotonesOrden
                indice={indice}
                total={items.length}
                cargando={ordenando}
                onSubir={() => void mover(indice, -1)}
                onBajar={() => void mover(indice, 1)}
              />
            ),
          },
          { title: 'Nombre', dataIndex: 'nombre', width: 200 },
          { title: 'Descripción', dataIndex: 'descripcion', render: (valor: string | null) => valor ?? '—' },
          {
            title: 'Productos',
            width: 110,
            align: 'center',
            render: (_, categoria: Categoria) => categoria._count?.producto ?? 0,
          },
          {
            title: 'Acciones',
            width: 200,
            render: (_, categoria: Categoria) => (
              <Space>
                <Button onClick={() => abrirEditar(categoria)}>Editar</Button>
                <Popconfirm title="¿Eliminar categoría?" onConfirm={() => handleRemove(categoria.id_categoria)}>
                  <Button danger>Eliminar</Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />
      <Modal
        title={editing ? 'Editar categoría' : 'Nueva categoría'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <CategoriaForm
          key={editing?.id_categoria ?? 'new'}
          initialValues={editing ? { nombre: editing.nombre, descripcion: editing.descripcion ?? undefined } : undefined}
          onSubmit={handleSubmit}
          loading={saving}
        />
      </Modal>
    </div>
  );
}
