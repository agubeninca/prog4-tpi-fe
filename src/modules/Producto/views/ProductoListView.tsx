import { useEffect, useMemo, useState } from 'react';
import { PictureOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Image, Modal, Popconfirm, Select, Space, Switch, Table, Typography, Upload, message } from 'antd';
import { getErrorMessage } from '../../../shared/api';
import { urlImagen } from '../../../shared/firebase';
import { formatearMoneda } from '../../../shared/moneda';
import { reemplazarProducto, useProductoStore } from '../../../stores/producto.store';
import { useCategoriaStore } from '../../../stores/categoria.store';
import { ProductoForm } from '../components/ProductoForm';
import { productoService, type Producto, type ProductoInput } from '../services/producto.service';

const TAMANIO_MINIATURA = 48;

export function ProductoListView() {
  const { items, loading, fetchAll, create, update, remove } = useProductoStore();
  const { items: categorias, fetchAll: fetchCategorias } = useCategoriaStore();
  const [filtroCategoria, setFiltroCategoria] = useState<number | undefined>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Producto | null>(null);
  const [saving, setSaving] = useState(false);
  const [imagenProducto, setImagenProducto] = useState<Producto | null>(null);
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const [pausando, setPausando] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([fetchAll(), fetchCategorias()]).catch((error: unknown) => message.error(getErrorMessage(error)));
  }, [fetchAll, fetchCategorias]);

  const productosFiltrados = useMemo(
    () => (filtroCategoria ? items.filter((producto) => producto.id_categoria === filtroCategoria) : items),
    [items, filtroCategoria],
  );

  const abrirNuevo = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const abrirEditar = (producto: Producto) => {
    setEditing(producto);
    setModalOpen(true);
  };

  const handleSubmit = async (data: ProductoInput) => {
    setSaving(true);
    try {
      if (editing) {
        await update(editing.id_producto, data);
        message.success('Producto actualizado');
      } else {
        await create(data);
        message.success('Producto creado');
      }
      setModalOpen(false);
      void fetchCategorias();
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (id: number) => {
    try {
      await remove(id);
      message.success('Producto eliminado');
      void fetchCategorias();
    } catch (error) {
      message.error(getErrorMessage(error));
    }
  };

  // RF-07: control rápido de stock. Un producto pausado desaparece del menú de los clientes.
  const handlePausa = async (producto: Producto, disponible: boolean) => {
    setPausando(producto.id_producto);
    try {
      reemplazarProducto(await productoService.pausar(producto.id_producto, !disponible));
      message.success(disponible ? `"${producto.nombre}" vuelve al menú` : `"${producto.nombre}" pausado`);
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setPausando(null);
    }
  };

  const handleSubirImagen = async (archivo: File) => {
    if (!imagenProducto) return false;
    setSubiendoImagen(true);
    try {
      reemplazarProducto(await productoService.subirImagen(imagenProducto.id_producto, archivo));
      message.success('Imagen actualizada');
      setImagenProducto(null);
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setSubiendoImagen(false);
    }
    return false;
  };

  return (
    <div>
      <Space wrap style={{ marginBottom: 16, justifyContent: 'space-between', width: '100%' }}>
        <h1>Productos</h1>
        <Space wrap>
          <Select
            allowClear
            placeholder="Todas las categorías"
            style={{ minWidth: 200 }}
            value={filtroCategoria}
            onChange={setFiltroCategoria}
            options={categorias.map((categoria) => ({ value: categoria.id_categoria, label: categoria.nombre }))}
          />
          <Button type="primary" onClick={abrirNuevo} disabled={categorias.length === 0}>
            Nuevo producto
          </Button>
        </Space>
      </Space>
      {categorias.length === 0 && !loading && (
        <Typography.Paragraph type="secondary">Para cargar productos, primero creá una categoría.</Typography.Paragraph>
      )}
      <Table
        rowKey="id_producto"
        loading={loading}
        dataSource={productosFiltrados}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: 'No hay productos' }}
        columns={[
          {
            title: 'Imagen',
            width: 80,
            render: (_, producto: Producto) =>
              producto.ruta_imagen ? (
                <Image
                  src={urlImagen(producto.ruta_imagen, producto.fecha_actualizacion)}
                  width={TAMANIO_MINIATURA}
                  height={TAMANIO_MINIATURA}
                  style={{ objectFit: 'cover', borderRadius: 6 }}
                />
              ) : (
                <PictureOutlined style={{ fontSize: 24, color: '#bfbfbf' }} />
              ),
          },
          {
            title: 'Nombre',
            width: 260,
            render: (_, producto: Producto) => (
              <div>
                <div>{producto.nombre}</div>
                {producto.descripcion && (
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {producto.descripcion}
                  </Typography.Text>
                )}
              </div>
            ),
          },
          { title: 'Categoría', width: 150, render: (_, producto: Producto) => producto.categoria.nombre },
          {
            title: 'Precio',
            dataIndex: 'precio',
            width: 120,
            align: 'right',
            render: (precio: string) => <span style={{ whiteSpace: 'nowrap' }}>{formatearMoneda(precio)}</span>,
          },
          {
            title: 'Disponible',
            width: 110,
            align: 'center',
            render: (_, producto: Producto) => (
              <Switch
                checked={!producto.estado_pausado}
                loading={pausando === producto.id_producto}
                checkedChildren="Sí"
                unCheckedChildren="No"
                onChange={(disponible) => handlePausa(producto, disponible)}
              />
            ),
          },
          {
            title: 'Acciones',
            width: 260,
            render: (_, producto: Producto) => (
              <Space>
                <Button onClick={() => setImagenProducto(producto)}>Imagen</Button>
                <Button onClick={() => abrirEditar(producto)}>Editar</Button>
                <Popconfirm title="¿Eliminar producto?" onConfirm={() => handleRemove(producto.id_producto)}>
                  <Button danger>Eliminar</Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />
      <Modal
        title={editing ? 'Editar producto' : 'Nuevo producto'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <ProductoForm
          key={editing?.id_producto ?? 'new'}
          categorias={categorias}
          initialValues={
            editing
              ? {
                  id_categoria: editing.id_categoria,
                  nombre: editing.nombre,
                  descripcion: editing.descripcion ?? undefined,
                  precio: Number(editing.precio),
                }
              : { id_categoria: filtroCategoria }
          }
          onSubmit={handleSubmit}
          loading={saving}
        />
      </Modal>
      <Modal
        title={`Imagen de ${imagenProducto?.nombre ?? ''}`}
        open={!!imagenProducto}
        onCancel={() => setImagenProducto(null)}
        footer={null}
        destroyOnHidden
      >
        {imagenProducto?.ruta_imagen && (
          <img
            src={urlImagen(imagenProducto.ruta_imagen, imagenProducto.fecha_actualizacion)}
            alt={imagenProducto.nombre}
            style={{ display: 'block', maxWidth: '100%', maxHeight: 240, marginBottom: 16, borderRadius: 8 }}
          />
        )}
        <Typography.Paragraph type="secondary">
          JPG, PNG, WEBP o GIF de hasta 5 MB. Se redimensiona a 800 px y se guarda en WEBP.
        </Typography.Paragraph>
        <Upload
          accept="image/jpeg,image/png,image/webp,image/gif"
          maxCount={1}
          showUploadList={false}
          beforeUpload={handleSubirImagen}
        >
          <Button icon={<UploadOutlined />} loading={subiendoImagen}>
            Seleccionar imagen
          </Button>
        </Upload>
      </Modal>
    </div>
  );
}
