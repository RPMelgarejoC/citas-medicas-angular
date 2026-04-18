import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Db } from '../services/db';

@Component({
  selector: 'app-medicos',
  imports: [FormsModule],
  templateUrl: './medicos.html',
  styleUrl: './medicos.css',
})

export class Medicos implements OnInit {

  constructor(
    private dbService: Db,
    private cdr: ChangeDetectorRef
  ) {}

  medicos: any[] = [];

  editando: boolean = false;
  idEditando: number | null = null;

  mostrarFormulario = false;

  mostrarToast = false;
  mensajeToast = '';
  tipoToast = 'success';
  
  nuevoMedico = {
    nombre: '',
    especialidad: '',
    telefono: ''
  };

  async ngOnInit() {
    await this.dbService.initDB();
    await this.cargarMedicos();
  }

  async cargarMedicos() {
    this.medicos = await this.dbService.obtenerMedicos();
    this.cdr.detectChanges();
  }

  abrirFormulario() {
    this.mostrarFormulario = true;
  }

  cerrarFormulario() {
    this.mostrarFormulario = false;
    this.editando = false;
    this.idEditando = null;

    this.nuevoMedico = {
      nombre: '',
      especialidad: '',
      telefono: ''
    };
  }

  editarMedico(m: any) {
    this.nuevoMedico = { ...m };
    this.editando = true;
    this.idEditando = m.id;
    this.mostrarFormulario = true;
  }

  async agregarMedico() {
    if (!this.nuevoMedico.nombre || !this.nuevoMedico.especialidad) {
      this.mostrarNotificacion('Nombre y especialidad son obligatorios', 'error');
      return;
    }

    const eraEdicion = this.editando;

    const medico = {
      id: this.editando ? this.idEditando : Date.now(),
      ...this.nuevoMedico
    };

    if (this.editando) {
      await this.dbService.actualizarMedico(medico);
    } else {
      await this.dbService.agregarMedico(medico);
    }

    this.cerrarFormulario();
    await this.cargarMedicos();

    this.mostrarNotificacion(
      eraEdicion ? '✅ Médico actualizado correctamente' : '✅ Médico registrado correctamente'
    );
  }

  async eliminarMedico(id: number) {
    const confirmar = confirm('¿Seguro que deseas eliminar este médico?');
    if (!confirmar) return;

    await this.dbService.eliminarMedico(id);
    await this.cargarMedicos();
    
    this.mostrarNotificacion('🗑️ Médico eliminado correctamente', 'success');
  }

  mostrarNotificacion(mensaje: string, tipo: string = 'success') {
    this.mensajeToast = mensaje;
    this.tipoToast = tipo;
    this.mostrarToast = true;

    // Forzar detección de cambios
    this.cdr.detectChanges();

    setTimeout(() => {
      this.mostrarToast = false;
      this.cdr.detectChanges();
    }, 2500);
  }
}