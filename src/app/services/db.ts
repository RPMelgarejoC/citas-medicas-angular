import { Injectable } from '@angular/core';

const DB_NAME = 'citasDB';
const DB_VERSION = 1;
const STORE_PACIENTES = 'pacientes';

@Injectable({
  providedIn: 'root',
})
export class Db {
  private db: IDBDatabase | null = null;

  initDB(): Promise<void> {
    return new Promise((resolve, reject) => {

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject('Error al abrir DB');

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains(STORE_PACIENTES)) {
          db.createObjectStore(STORE_PACIENTES, { keyPath: 'id' });
        }
      };
    });
  }

  agregarPaciente(paciente: any): Promise<void> {
    return new Promise((resolve, reject) => {

      const tx = this.db!.transaction(STORE_PACIENTES, 'readwrite');
      const store = tx.objectStore(STORE_PACIENTES);

      const request = store.add(paciente);

      request.onsuccess = () => resolve();
      request.onerror = () => reject('Error al guardar');
    });
  }

  obtenerPacientes(): Promise<any[]> {
    return new Promise((resolve, reject) => {

      const tx = this.db!.transaction(STORE_PACIENTES, 'readonly');
      const store = tx.objectStore(STORE_PACIENTES);

      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject('Error al obtener datos');
    });
  }

  actualizarPaciente(paciente: any): Promise<void> {
    return new Promise((resolve, reject) => {

      const tx = this.db!.transaction('pacientes', 'readwrite');
      const store = tx.objectStore('pacientes');

      const request = store.put(paciente); // 🔥 PUT actualiza o crea

      request.onsuccess = () => resolve();
      request.onerror = () => reject('Error al actualizar');
    });
  }

  eliminarPaciente(id: number): Promise<void> {
    return new Promise((resolve, reject) => {

      const tx = this.db!.transaction('pacientes', 'readwrite');
      const store = tx.objectStore('pacientes');

      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject('Error al eliminar');
    });
  }
}
