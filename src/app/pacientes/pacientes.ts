import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
//import { NgFor } from '@angular/common';


@Component({
  selector: 'app-pacientes',
  imports: [FormsModule],
  templateUrl: './pacientes.html',
  styleUrl: './pacientes.css',
})
export class Pacientes {
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

  editarPaciente(p: any) {
    this.nuevoPaciente = { ...p };
    this.editando = true;
    this.idEditando = p.id;
  }

  eliminarPaciente(id: number) {
    this.pacientes = this.pacientes.filter(p => p.id !== id);
  }
}
