import { Injectable } from '@angular/core';

const DB_NAME = 'citasDB';
const DB_VERSION = 3;
const STORE_PACIENTES = 'pacientes';
const STORE_MEDICOS = 'medicos';
const STORE_CITAS = 'citas';

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
          
        if (!db.objectStoreNames.contains(STORE_MEDICOS)) {
          db.createObjectStore(STORE_MEDICOS, { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains(STORE_CITAS)) {
          db.createObjectStore(STORE_CITAS, { keyPath: 'id' });
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

  agregarMedico(medico: any): Promise<void> {
    return new Promise((resolve, reject) => {

      const tx = this.db!.transaction(STORE_MEDICOS, 'readwrite');
      const store = tx.objectStore(STORE_MEDICOS);

      const request = store.add(medico);

      request.onsuccess = () => resolve();
      request.onerror = () => reject('Error al guardar médico');
    });
  }

  obtenerMedicos(): Promise<any[]> {
    return new Promise((resolve, reject) => {

      const tx = this.db!.transaction(STORE_MEDICOS, 'readonly');
      const store = tx.objectStore(STORE_MEDICOS);

      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject('Error al obtener médicos');
    });
  }

  actualizarMedico(medico: any): Promise<void> {
    return new Promise((resolve, reject) => {

      const tx = this.db!.transaction(STORE_MEDICOS, 'readwrite');
      const store = tx.objectStore(STORE_MEDICOS);

      const request = store.put(medico);

      request.onsuccess = () => resolve();
      request.onerror = () => reject('Error al actualizar médico');
    });
  }

  eliminarMedico(id: number): Promise<void> {
    return new Promise((resolve, reject) => {

      const tx = this.db!.transaction(STORE_MEDICOS, 'readwrite');
      const store = tx.objectStore(STORE_MEDICOS);

      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject('Error al eliminar médico');
    });
  }

  agregarCita(cita: any): Promise<void> {
    return new Promise((resolve, reject) => {

      const tx = this.db!.transaction(STORE_CITAS, 'readwrite');
      const store = tx.objectStore(STORE_CITAS);

      const request = store.add(cita);

      request.onsuccess = () => resolve();
      request.onerror = () => reject('Error al guardar cita');
    });
  }

  obtenerCitas(): Promise<any[]> {
    return new Promise((resolve, reject) => {

      const tx = this.db!.transaction(STORE_CITAS, 'readonly');
      const store = tx.objectStore(STORE_CITAS);

      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject('Error al obtener citas');
    });
  }

  actualizarCita(cita: any): Promise<void> {
    return new Promise((resolve, reject) => {

      const tx = this.db!.transaction(STORE_CITAS, 'readwrite');
      const store = tx.objectStore(STORE_CITAS);

      const request = store.put(cita);

      request.onsuccess = () => resolve();
      request.onerror = () => reject('Error al actualizar cita');
    });
  }

  eliminarCita(id: number): Promise<void> {
    return new Promise((resolve, reject) => {

      const tx = this.db!.transaction(STORE_CITAS, 'readwrite');
      const store = tx.objectStore(STORE_CITAS);

      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject('Error al eliminar cita');
    });
  }

}
