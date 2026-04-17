import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
//import { NgFor } from '@angular/common';
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
  tipoToast = 'success'; // success, error

  nuevoPaciente = {
    nombre: '',
    apellido: '',
    edad: 0,
    telefono: '',
    email: ''
  };

  async ngOnInit() {
    await this.dbService.initDB();
    this.cargarPacientes();
  }

  async cargarPacientes() {
    this.pacientes = await this.dbService.obtenerPacientes();
    console.log("Pacientes cargados:", this.pacientes);
    this.cdr.detectChanges(); // 🔥 CLAVE
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
      apellido: '',
      edad: 0,
      telefono: '',
      email: ''
    };

    this.cdr.detectChanges(); // 🔥 aquí mejor
  }
  
  editarPaciente(p: any) {
    this.nuevoPaciente = { ...p };
    this.editando = true;
    this.idEditando = p.id;

    this.mostrarFormulario = true; // 🔥 clave
  }

  async agregarPaciente() {

    // VALIDACIÓN SIMPLE
    if (!this.nuevoPaciente.nombre || !this.nuevoPaciente.apellido) {
      alert("Nombre y apellido son obligatorios");
      return;
    }

    const eraEdicion = this.editando;

    const paciente = {
      id: this.editando ? this.idEditando : Date.now(),
      ...this.nuevoPaciente
    };

    if (this.editando) {
      await this.dbService.actualizarPaciente(paciente); // 🔥 UPDATE
    } else {
      await this.dbService.agregarPaciente(paciente); // CREATE
    }

    this.editando = false;
    this.idEditando = null;

    this.nuevoPaciente = {
      nombre: '',
      apellido: '',
      edad: 0,
      telefono: '',
      email: ''
    };

    await this.cargarPacientes();
    this.cerrarFormulario();

    this.mostrarNotificacion(
      eraEdicion ? 'Paciente actualizado correctamente' : 'Paciente registrado correctamente'
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
    
    this.mostrarNotificacion('Paciente eliminado correctamente', 'success');
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
