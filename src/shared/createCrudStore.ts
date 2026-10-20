import { create } from 'zustand';

interface CrudService<T, TInput> {
  getAll: () => Promise<T[]>;
  create: (data: TInput) => Promise<T>;
  update: (id: number, data: TInput) => Promise<T>;
  remove: (id: number) => Promise<unknown>;
}

export interface CrudState<T, TInput> {
  items: T[];
  loading: boolean;
  cargado: boolean;
  fetchAll: () => Promise<void>;
  fetchIfNeeded: () => Promise<void>;
  create: (data: TInput) => Promise<void>;
  update: (id: number, data: TInput) => Promise<void>;
  remove: (id: number) => Promise<void>;
}

export function createCrudStore<T, TInput>(service: CrudService<T, TInput>) {
  return create<CrudState<T, TInput>>((set, get) => ({
    items: [],
    loading: false,
    cargado: false,
    fetchAll: async () => {
      set({ loading: true });
      try {
        const items = await service.getAll();
        set({ items, cargado: true });
      } finally {
        set({ loading: false });
      }
    },
    fetchIfNeeded: async () => {
      if (get().cargado || get().loading) {
        return;
      }
      await get().fetchAll();
    },
    create: async (data) => {
      await service.create(data);
      await get().fetchAll();
    },
    update: async (id, data) => {
      await service.update(id, data);
      await get().fetchAll();
    },
    remove: async (id) => {
      await service.remove(id);
      await get().fetchAll();
    },
  }));
}
