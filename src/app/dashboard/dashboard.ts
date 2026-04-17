import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Db } from '../services/db';

@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})

export class Dashboard implements OnInit {

  constructor(
    private db: Db,
    private cdr: ChangeDetectorRef
  ) {}

  pacientes: any[] = [];
  medicos: any[] = [];
  citas: any[] = [];
  citasAgrupadas: any = {};

  async ngOnInit() {
    await this.db.initDB();

    this.pacientes = await this.db.obtenerPacientes();
    this.medicos = await this.db.obtenerMedicos();
    this.citas = await this.db.obtenerCitas();

    this.agruparCitas();

    this.cdr.detectChanges();
  }

  obtenerNombreMedico(id: number) {
    return this.medicos.find(m => m.id == id)?.nombre || '';
  }

  obtenerColorMedico(id: number) {
    const colores = ['primary', 'success', 'danger', 'warning', 'info'];
    return colores[id % colores.length];
  }

  agruparCitas() {
    this.citasAgrupadas = {};

    this.citas.forEach(c => {
      if (!this.citasAgrupadas[c.fecha]) {
        this.citasAgrupadas[c.fecha] = [];
      }

      this.citasAgrupadas[c.fecha].push(c);
    });
  }
  
  obtenerFechas() {
    return Object.keys(this.citasAgrupadas).sort();
  }
}