import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor } from '@angular/common';

@Component({
  selector: 'app-pacientes',
  imports: [FormsModule, NgFor],
  templateUrl: './pacientes.html',
  styleUrl: './pacientes.css',
})
export class Pacientes {
  pacientes: any[] = [];

  nuevoPaciente = {
    nombre: '',
    apellido: '',
    edad: 0,
    telefono: '',
    email: ''
  };

  agregarPaciente() {
    const paciente = {
      id: Date.now(),
      ...this.nuevoPaciente
    };

    this.pacientes.push(paciente);

    // limpiar formulario
    this.nuevoPaciente = {
      nombre: '',
      apellido: '',
      edad: 0,
      telefono: '',
      email: ''
    };
  }

  eliminarPaciente(id: number) {
    this.pacientes = this.pacientes.filter(p => p.id !== id);
  }
}
