import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Db } from '../services/db';
import { OnInit, ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-pacientes',
  imports: [FormsModule],
  templateUrl: './pacientes.html',
  styleUrl: './pacientes.css',
})
export class Pacientes implements OnInit{

  constructor(
    private dbService: Db,
    private cdr: ChangeDetectorRef
  ) {}

  pacientes: any[] = [];

  editando: boolean = false;
  idEditando: number | null = null;

  mostrarFormulario = false;

  mostrarToast = false;
  mensajeToast = '';
  tipoToast = 'success';

  nuevoPaciente = {
    nombre: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    fechaNacimiento: '',
    celular: '',
    email: '',
    direccion: '',
    seguroMedico: ''
  };

  async ngOnInit() {
    await this.dbService.initDB();
    this.cargarPacientes();
  }

  async cargarPacientes() {
    this.pacientes = await this.dbService.obtenerPacientes();
    console.log("Pacientes cargados:", this.pacientes);
    this.cdr.detectChanges();
  }

  // Calcular edad automáticamente desde fecha de nacimiento
  calcularEdad(fechaNacimiento: string): number {
    if (!fechaNacimiento) return 0;
    
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    
    return edad;
  }

  // Validar fecha de nacimiento (no puede ser futura)
  validarFechaNacimiento(fecha: string): boolean {
    if (!fecha) return true;
    
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaNac = new Date(fecha);
    
    if (fechaNac > hoy) {
      this.mostrarNotificacion('❌ La fecha de nacimiento no puede ser futura', 'error');
      return false;
    }
    
    return true;
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

  // Validar celular (mínimo 8 dígitos)
  validarCelular(celular: string): boolean {
    if (!celular) return true;
    
    const soloNumeros = celular.replace(/\D/g, '');
    if (soloNumeros.length < 8) {
      this.mostrarNotificacion('❌ Ingrese un número de celular válido (mínimo 8 dígitos)', 'error');
      return false;
    }
    
    return true;
  }

  abrirFormulario() {
    this.mostrarFormulario = true;
  }

  cerrarFormulario() {
    this.mostrarFormulario = false;

    this.editando = false;
    this.idEditando = null;

    this.nuevoPaciente = {
      nombre: '',
      apellidoPaterno: '',
      apellidoMaterno: '',
      fechaNacimiento: '',
      celular: '',
      email: '',
      direccion: '',
      seguroMedico: ''
    };

    this.cdr.detectChanges();
  }
  
  editarPaciente(p: any) {
    this.nuevoPaciente = { ...p };
    this.editando = true;
    this.idEditando = p.id;

    this.mostrarFormulario = true;
  }

  async agregarPaciente() {
    // VALIDACIONES
    if (!this.nuevoPaciente.nombre) {
      this.mostrarNotificacion('❌ El nombre es obligatorio', 'error');
      return;
    }
    
    if (!this.nuevoPaciente.apellidoPaterno) {
      this.mostrarNotificacion('❌ El apellido paterno es obligatorio', 'error');
      return;
    }
    
    if (!this.nuevoPaciente.fechaNacimiento) {
      this.mostrarNotificacion('❌ La fecha de nacimiento es obligatoria', 'error');
      return;
    }
    
    // Validar fecha de nacimiento
    if (!this.validarFechaNacimiento(this.nuevoPaciente.fechaNacimiento)) {
      return;
    }
    
    // Validar email
    if (this.nuevoPaciente.email && !this.validarEmail(this.nuevoPaciente.email)) {
      return;
    }
    
    // Validar celular
    if (this.nuevoPaciente.celular && !this.validarCelular(this.nuevoPaciente.celular)) {
      return;
    }

    const eraEdicion = this.editando;
    
    // Calcular edad automáticamente
    const edad = this.calcularEdad(this.nuevoPaciente.fechaNacimiento);

    const paciente = {
      id: this.editando ? this.idEditando : Date.now(),
      ...this.nuevoPaciente,
      edad: edad  // Campo calculado para compatibilidad
    };

    if (this.editando) {
      await this.dbService.actualizarPaciente(paciente);
    } else {
      await this.dbService.agregarPaciente(paciente);
    }

    this.editando = false;
    this.idEditando = null;

    this.nuevoPaciente = {
      nombre: '',
      apellidoPaterno: '',
      apellidoMaterno: '',
      fechaNacimiento: '',
      celular: '',
      email: '',
      direccion: '',
      seguroMedico: ''
    };

    await this.cargarPacientes();
    this.cerrarFormulario();

    this.mostrarNotificacion(
      eraEdicion ? '✅ Paciente actualizado correctamente' : '✅ Paciente registrado correctamente'
    );
  }

  async eliminarPaciente(id: number) {
    const citas = await this.contarCitasPaciente(id);

    let mensaje = '¿Seguro que deseas eliminar este paciente?';

    if (citas.length > 0) {
      mensaje += `\n⚠️ Tiene ${citas.length} cita(s) registrada(s).`;
    }

    const confirmar = confirm(mensaje);

    if (!confirmar) return;

    await this.dbService.eliminarPaciente(id);
    await this.cargarPacientes();
    
    this.mostrarNotificacion('🗑️ Paciente eliminado correctamente', 'success');
  }
  
  mostrarNotificacion(mensaje: string, tipo: string = 'success') {
    this.mensajeToast = mensaje;
    this.tipoToast = tipo;
    this.mostrarToast = true;

    setTimeout(() => {
      this.mostrarToast = false;
      this.cdr.detectChanges();
    }, 2500);
  }

  async contarCitasPaciente(idPaciente: number) {
    const citas = await this.dbService.obtenerCitas();
    return citas.filter(c => c.idPaciente == idPaciente);
  }
}