import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Db } from '../services/db';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
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

  // Estadísticas adicionales
  totalPacientes: number = 0;
  totalMedicos: number = 0;
  totalCitas: number = 0;
  citasHoy: number = 0;
  citasSemana: number = 0;
  citasPendientes: number = 0;
  citasCompletadas: number = 0;
  citasCanceladas: number = 0;
  ingresosTotales: number = 0;
  ingresosMes: number = 0;

  citasAgrupadas: any = {};
  citasPorMedico: any[] = [];
  citasPorTipo: any[] = [];

  hoy: string = '';

  async ngOnInit() {
    await this.db.initDB();
    await this.cargarDatos();
    this.calcularEstadisticas();
    this.calcularCitasPorMedico();
    this.calcularCitasPorTipo();

    /*
    this.hoy = new Date().toISOString().split('T')[0];
    */
    this.cdr.detectChanges();
  }

  async cargarDatos() {
    this.pacientes = await this.db.obtenerPacientes();
    this.medicos = await this.db.obtenerMedicos();
    this.citas = await this.db.obtenerCitas();
    this.agruparCitas();
  }

  calcularEstadisticas() {
    const hoy = new Date().toISOString().split('T')[0];
    
    // Calcular fecha de inicio de semana (Lunes)
    const hoyObj = new Date();
    const diaSemana = hoyObj.getDay();
    const diasALunes = diaSemana === 0 ? 6 : diaSemana - 1;
    const inicioSemana = new Date(hoyObj);
    inicioSemana.setDate(hoyObj.getDate() - diasALunes);
    const finSemana = new Date(inicioSemana);
    finSemana.setDate(inicioSemana.getDate() + 6);
    
    // Totales básicos
    this.totalPacientes = this.pacientes.length;
    this.totalMedicos = this.medicos.length;
    this.totalCitas = this.citas.length;
    
    // Citas de hoy
    this.citasHoy = this.citas.filter(c => c.fecha === hoy).length;
    
    // Citas de la semana
    this.citasSemana = this.citas.filter(c => {
      const fechaCita = new Date(c.fecha);
      return fechaCita >= inicioSemana && fechaCita <= finSemana;
    }).length;
    
    // Citas por estado
    this.citasPendientes = this.citas.filter(c => 
      c.estado === 'Programada' || c.estado === 'Confirmada'
    ).length;
    
    this.citasCompletadas = this.citas.filter(c => c.estado === 'Completada').length;
    this.citasCanceladas = this.citas.filter(c => c.estado === 'Cancelada').length;
    
    // Ingresos totales
    this.ingresosTotales = this.citas.reduce((total, c) => total + (c.costo || 0), 0);
    
    // Ingresos del mes actual
    const mesActual = hoyObj.getMonth();
    const añoActual = hoyObj.getFullYear();
    this.ingresosMes = this.citas.filter(c => {
      const fechaCita = new Date(c.fecha);
      return fechaCita.getMonth() === mesActual && fechaCita.getFullYear() === añoActual;
    }).reduce((total, c) => total + (c.costo || 0), 0);
  }

  calcularCitasPorMedico() {
    const medicoStats = new Map();
    
    this.medicos.forEach(medico => {
      const citasMedico = this.citas.filter(c => Number(c.idMedico) === medico.id);
      medicoStats.set(medico.id, {
        nombre: `${medico.nombre} ${medico.apellidoPaterno || ''}`,
        especialidad: medico.especialidad,
        total: citasMedico.length,
        completadas: citasMedico.filter(c => c.estado === 'Completada').length
      });
    });
    
    this.citasPorMedico = Array.from(medicoStats.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }

  calcularCitasPorTipo() {
    const tipoStats = new Map();
    
    this.citas.forEach(cita => {
      const tipo = cita.tipoCita || 'Consulta General';
      tipoStats.set(tipo, (tipoStats.get(tipo) || 0) + 1);
    });
    
    this.citasPorTipo = Array.from(tipoStats.entries())
      .map(([nombre, total]) => ({ nombre, total }))
      .sort((a, b) => b.total - a.total);
  }

  agruparCitas() {
    this.citasAgrupadas = {};
    
    // Ordenar citas por fecha
    const citasOrdenadas = [...this.citas].sort((a, b) => 
      new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
    );
    
    citasOrdenadas.forEach(c => {
      if (!this.citasAgrupadas[c.fecha]) {
        this.citasAgrupadas[c.fecha] = [];
      }
      this.citasAgrupadas[c.fecha].push(c);
    });
  }
  
  obtenerFechas() {
    return Object.keys(this.citasAgrupadas).sort();
  }

  obtenerNombreMedico(id: number) {
    const medico = this.medicos.find(m => m.id == id);
    return medico ? `${medico.nombre} ${medico.apellidoPaterno || ''}` : '';
  }

  obtenerNombrePaciente(id: number) {
    const paciente = this.pacientes.find(p => p.id == id);
    return paciente ? `${paciente.nombre} ${paciente.apellidoPaterno || ''}` : '';
  }

  obtenerColorMedico(id: number) {
    const colores = ['primary', 'success', 'danger', 'warning', 'info', 'teal', 'purple'];
    return colores[id % colores.length];
  }

  obtenerColorEstado(estado: string): string {
    const colores: Record<string, string> = {
      'Programada': 'warning',
      'Confirmada': 'info',
      'En curso': 'primary',
      'Completada': 'success',
      'Cancelada': 'danger',
      'No asistió': 'secondary'
    };
    return colores[estado] || 'secondary';
  }

  obtenerPorcentajeCitasCompletadas(): number {
    if (this.totalCitas === 0) return 0;
    return Math.round((this.citasCompletadas / this.totalCitas) * 100);
  }

  obtenerPorcentajeCitasPendientes(): number {
    if (this.totalCitas === 0) return 0;
    return Math.round((this.citasPendientes / this.totalCitas) * 100);
  }
}