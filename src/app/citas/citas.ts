import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Db } from '../services/db';

@Component({
  selector: 'app-citas',
  imports: [FormsModule],
  templateUrl: './citas.html',
  styleUrl: './citas.css',
})

export class Citas implements OnInit {

  constructor(
    private dbService: Db,
    private cdr: ChangeDetectorRef
  ) {}

  citas: any[] = [];
  pacientes: any[] = [];
  medicos: any[] = [];

  editando: boolean = false;
  idEditando: number | null = null;

  nuevaCita = {
    idPaciente: '',
    idMedico: '',
    fecha: '',
    hora: '',
    motivo: ''
  };

  async ngOnInit() {
    await this.dbService.initDB();
    await this.cargarDatos();
  }

  async cargarDatos() {
    this.citas = await this.dbService.obtenerCitas();
    this.pacientes = await this.dbService.obtenerPacientes();
    this.medicos = await this.dbService.obtenerMedicos();

    this.cdr.detectChanges();
  }

  async guardarCita() {

    if (!this.nuevaCita.idPaciente || !this.nuevaCita.idMedico) {
      alert("Debe seleccionar paciente y médico");
      return;
    }

    const cita = {
      id: this.editando ? this.idEditando : Date.now(),
      ...this.nuevaCita
    };

    if (this.editando) {
      await this.dbService.actualizarCita(cita);
    } else {
      await this.dbService.agregarCita(cita);
    }

    this.editando = false;
    this.idEditando = null;

    this.nuevaCita = {
      idPaciente: '',
      idMedico: '',
      fecha: '',
      hora: '',
      motivo: ''
    };

    await this.cargarDatos();
  }

  editarCita(c: any) {
    this.nuevaCita = { ...c };
    this.editando = true;
    this.idEditando = c.id;
  }

  async eliminarCita(id: number) {
    await this.dbService.eliminarCita(id);
    await this.cargarDatos();
  }

  // 🔥 FUNCIONES CLAVE PARA MOSTRAR NOMBRES
  obtenerNombrePaciente(id: number) {
    return this.pacientes.find(p => p.id == id)?.nombre || '';
  }

  obtenerNombreMedico(id: number) {
    return this.medicos.find(m => m.id == id)?.nombre || '';
  }
}