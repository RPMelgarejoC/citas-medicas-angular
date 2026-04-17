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

  /*
  agregarPaciente() {
    if (this.editando) {
      // EDITAR
      this.pacientes = this.pacientes.map(p =>
        p.id === this.idEditando
          ? { id: this.idEditando, ...this.nuevoPaciente }
          : p
      );

      this.editando = false;
      this.idEditando = null;

    } else {
      // CREAR
      const paciente = {
        id: Date.now(),
        ...this.nuevoPaciente
      };

      this.pacientes.push(paciente);
    }

    // limpiar formulario
    this.nuevoPaciente = {
      nombre: '',
      apellido: '',
      edad: 0,
      telefono: '',
      email: ''
    };
  }
  */

  async agregarPaciente() {

    // VALIDACIÓN SIMPLE
    if (!this.nuevoPaciente.nombre || !this.nuevoPaciente.apellido) {
      alert("Nombre y apellido son obligatorios");
      return;
    }

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
  }

  editarPaciente(p: any) {
    this.nuevoPaciente = { ...p };
    this.editando = true;
    this.idEditando = p.id;
  }

  async eliminarPaciente(id: number) {
    await this.dbService.eliminarPaciente(id);
    await this.cargarPacientes();
  }
}
