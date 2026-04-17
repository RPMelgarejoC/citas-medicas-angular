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

  async agregarMedico() {

    if (!this.nuevoMedico.nombre || !this.nuevoMedico.especialidad) {
      alert("Nombre y especialidad son obligatorios");
      return;
    }

    const medico = {
      id: this.editando ? this.idEditando : Date.now(),
      ...this.nuevoMedico
    };

    if (this.editando) {
      await this.dbService.actualizarMedico(medico);
    } else {
      await this.dbService.agregarMedico(medico);
    }

    this.editando = false;
    this.idEditando = null;

    this.nuevoMedico = {
      nombre: '',
      especialidad: '',
      telefono: ''
    };

    await this.cargarMedicos();
  }

  editarMedico(m: any) {
    this.nuevoMedico = { ...m };
    this.editando = true;
    this.idEditando = m.id;
  }

  async eliminarMedico(id: number) {
    await this.dbService.eliminarMedico(id);
    await this.cargarMedicos();
  }
}