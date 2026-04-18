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
    apellidoPaterno: '',
    apellidoMaterno: '',
    cedulaProfesional: '',
    email: '',
    especialidad: '',
    anosExperiencia: 0
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
      apellidoPaterno: '',
      apellidoMaterno: '',
      cedulaProfesional: '',
      email: '',
      especialidad: '',
      anosExperiencia: 0
    };
  }

  editarMedico(m: any) {
    this.nuevoMedico = { ...m };
    this.editando = true;
    this.idEditando = m.id;
    this.mostrarFormulario = true;
  }

  // Validar email
  validarEmail(email: string): boolean {
    if (!email) return true;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this.mostrarNotificacion('❌ Ingrese un email válido', 'error');
      return false;
    }
    
    return true;
  }

  // Validar cédula profesional (mínimo 5 caracteres)
  validarCedula(cedula: string): boolean {
    if (!cedula) {
      this.mostrarNotificacion('❌ La cédula profesional es obligatoria', 'error');
      return false;
    }
    
    if (cedula.length < 5) {
      this.mostrarNotificacion('❌ La cédula profesional debe tener al menos 5 caracteres', 'error');
      return false;
    }
    
    return true;
  }

  // Validar años de experiencia
  validarExperiencia(anos: number): boolean {
    if (anos < 0) {
      this.mostrarNotificacion('❌ Los años de experiencia no pueden ser negativos', 'error');
      return false;
    }
    
    if (anos > 60) {
      this.mostrarNotificacion('❌ Los años de experiencia no pueden superar 60', 'error');
      return false;
    }
    
    return true;
  }

  async agregarMedico() {
    // Validaciones
    if (!this.nuevoMedico.nombre) {
      this.mostrarNotificacion('❌ El nombre es obligatorio', 'error');
      return;
    }
    
    if (!this.nuevoMedico.apellidoPaterno) {
      this.mostrarNotificacion('❌ El apellido paterno es obligatorio', 'error');
      return;
    }
    
    if (!this.nuevoMedico.cedulaProfesional) {
      this.mostrarNotificacion('❌ La cédula profesional es obligatoria', 'error');
      return;
    }
    
    if (!this.validarCedula(this.nuevoMedico.cedulaProfesional)) {
      return;
    }
    
    if (this.nuevoMedico.email && !this.validarEmail(this.nuevoMedico.email)) {
      return;
    }
    
    if (!this.validarExperiencia(this.nuevoMedico.anosExperiencia)) {
      return;
    }

    const eraEdicion = this.editando;

    const medico = {
      id: this.editando ? this.idEditando : Date.now(),
      ...this.nuevoMedico,
      // Campo nombre completo para compatibilidad
      nombreCompleto: `${this.nuevoMedico.nombre} ${this.nuevoMedico.apellidoPaterno} ${this.nuevoMedico.apellidoMaterno}`
    };

    if (this.editando) {
      await this.dbService.actualizarMedico(medico);
    } else {
      await this.dbService.agregarMedico(medico);
    }

    // Cerrar modal ANTES de recargar datos
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

    this.cdr.detectChanges();

    setTimeout(() => {
      this.mostrarToast = false;
      this.cdr.detectChanges();
    }, 2500);
  }
}