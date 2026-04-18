import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule, CurrencyPipe } from '@angular/common'; // 🔥 Agregar CurrencyPipe
import { Db } from '../services/db';

@Component({
  selector: 'app-citas',
  imports: [FormsModule, CommonModule],
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

  mostrarFormulario = false;

  mostrarToast = false;
  mensajeToast = '';
  tipoToast = 'success';

  nuevaCita = {
    idPaciente: '',
    idMedico: '',
    fecha: '',
    hora: '',
    tipoCita: 'Consulta General',
    estado: 'Programada',
    duracion: 30,
    costo: 0,
    motivo: '',
    notas: '',
    recordatorio: false
  };

  // Horario laboral
  HORA_INICIO = 8;
  HORA_FIN = 18;

  // Opciones de horas con intervalos de 30 minutos
  opcionesHoras: string[] = [];

  // Horas disponibles para el médico seleccionado
  horasDisponibles: string[] = [];

  // Opciones para selects
  tiposCita = [
    'Consulta General',
    'Emergencia',
    'Control',
    'Especialista',
    'Vacunación',
    'Examen Médico'
  ];

  estadosCita = [
    'Programada',
    'Confirmada',
    'En curso',
    'Completada',
    'Cancelada',
    'No asistió'
  ];

  duraciones = [15, 30, 45, 60, 90, 120];

  async ngOnInit() {
    await this.dbService.initDB();
    await this.cargarDatos();
    this.generarOpcionesHoras();
  }

  generarOpcionesHoras() {
    this.opcionesHoras = [];
    for (let hora = this.HORA_INICIO; hora < this.HORA_FIN; hora++) {
      this.opcionesHoras.push(`${hora.toString().padStart(2, '0')}:00`);
      this.opcionesHoras.push(`${hora.toString().padStart(2, '0')}:30`);
    }
  }

  async cargarDatos() {
    this.citas = await this.dbService.obtenerCitas();
    this.pacientes = await this.dbService.obtenerPacientes();
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

    this.nuevaCita = {
      idPaciente: '',
      idMedico: '',
      fecha: '',
      hora: '',
      tipoCita: 'Consulta General',
      estado: 'Programada',
      duracion: 30,
      costo: 0,
      motivo: '',
      notas: '',
      recordatorio: false
    };
    
    this.horasDisponibles = [];
  }

  editarCita(c: any) {
    this.nuevaCita = { ...c };
    this.editando = true;
    this.idEditando = c.id;
    this.mostrarFormulario = true;
    
    if (this.nuevaCita.idMedico && this.nuevaCita.fecha) {
      this.cargarHorasDisponibles();
    }
  }

  validarFechaNoPasada(fecha: string): boolean {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const partes = fecha.split('-');
    const fechaSeleccionada = new Date(
      parseInt(partes[0]), 
      parseInt(partes[1]) - 1, 
      parseInt(partes[2])
    );
    
    if (fechaSeleccionada < hoy) {
      this.mostrarNotificacion('❌ No se pueden agendar citas en fechas pasadas', 'error');
      return false;
    }
    
    return true;
  }

  validarHorarioLaboral(fecha: string, hora: string): boolean {
    const partes = fecha.split('-');
    const año = parseInt(partes[0]);
    const mes = parseInt(partes[1]) - 1;
    const dia = parseInt(partes[2]);
    
    const fechaObj = new Date(año, mes, dia);
    const diaSemana = fechaObj.getDay();
    
    if (diaSemana === 0) {
      this.mostrarNotificacion('❌ Los domingos no hay consulta médica', 'error');
      return false;
    }
    
    if (diaSemana === 6) {
      this.mostrarNotificacion('❌ Los sábados no hay consulta médica', 'error');
      return false;
    }
    
    return true;
  }

  async cargarHorasDisponibles() {
    if (!this.nuevaCita.idMedico || !this.nuevaCita.fecha) {
      this.horasDisponibles = [];
      return;
    }
    
    const citasExistentes = await this.dbService.obtenerCitas();
    
    const horasOcupadas = citasExistentes
      .filter(c => 
        Number(c.idMedico) === Number(this.nuevaCita.idMedico) && 
        c.fecha === this.nuevaCita.fecha &&
        c.id !== this.idEditando
      )
      .map(c => c.hora);
    
    this.horasDisponibles = this.opcionesHoras.filter(h => !horasOcupadas.includes(h));
    
    if (this.nuevaCita.hora && !this.horasDisponibles.includes(this.nuevaCita.hora)) {
      this.nuevaCita.hora = '';
      this.mostrarNotificacion('⚠️ La hora seleccionada ya no está disponible', 'error');
    }
    
    this.cdr.detectChanges();
  }

  async validarDobleReserva(): Promise<boolean> {
    const citasExistentes = await this.dbService.obtenerCitas();
    
    const citaDuplicada = citasExistentes.find(c => 
      Number(c.idMedico) === Number(this.nuevaCita.idMedico) && 
      c.fecha === this.nuevaCita.fecha && 
      c.hora === this.nuevaCita.hora &&
      c.id !== this.idEditando
    );

    if (citaDuplicada) {
      const medico = this.medicos.find(m => m.id == this.nuevaCita.idMedico);
      this.mostrarNotificacion(`❌ El Dr. ${medico?.nombre} ya tiene una cita en ese horario`, 'error');
      return false;
    }

    return true;
  }

  async validarDobleCitaPaciente(): Promise<boolean> {
    const citasExistentes = await this.dbService.obtenerCitas();
    
    const citaDuplicada = citasExistentes.find(c => 
      Number(c.idPaciente) === Number(this.nuevaCita.idPaciente) && 
      c.fecha === this.nuevaCita.fecha && 
      c.hora === this.nuevaCita.hora &&
      c.id !== this.idEditando
    );

    if (citaDuplicada) {
      const paciente = this.pacientes.find(p => p.id == this.nuevaCita.idPaciente);
      this.mostrarNotificacion(`❌ El paciente ${paciente?.nombre} ya tiene una cita en ese horario`, 'error');
      return false;
    }

    return true;
  }

  onMedicoChange() {
    this.nuevaCita.hora = '';
    this.cargarHorasDisponibles();
  }

  onFechaChange() {
    this.nuevaCita.hora = '';
    if (this.nuevaCita.fecha) {
      if (!this.validarFechaNoPasada(this.nuevaCita.fecha)) {
        this.nuevaCita.fecha = '';
        return;
      }
      if (!this.validarHorarioLaboral(this.nuevaCita.fecha, '')) {
        this.nuevaCita.fecha = '';
        return;
      }
      if (this.nuevaCita.idMedico) {
        this.cargarHorasDisponibles();
      }
    }
  }

  async guardarCita() {
    if (!this.nuevaCita.idPaciente || !this.nuevaCita.idMedico) {
      this.mostrarNotificacion('❌ Debe seleccionar paciente y médico', 'error');
      return;
    }

    if (!this.nuevaCita.fecha) {
      this.mostrarNotificacion('❌ Debe seleccionar una fecha', 'error');
      return;
    }
    
    if (!this.nuevaCita.hora) {
      this.mostrarNotificacion('❌ Debe seleccionar una hora disponible', 'error');
      return;
    }

    if (!this.validarFechaNoPasada(this.nuevaCita.fecha)) {
      return;
    }

    if (!this.validarHorarioLaboral(this.nuevaCita.fecha, this.nuevaCita.hora)) {
      return;
    }

    const reservaValida = await this.validarDobleReserva();
    if (!reservaValida) return;

    const pacienteValido = await this.validarDobleCitaPaciente();
    if (!pacienteValido) return;

    const eraEdicion = this.editando;

    const cita = {
      id: this.editando ? this.idEditando : Date.now(),
      ...this.nuevaCita
    };

    if (this.editando) {
      await this.dbService.actualizarCita(cita);
    } else {
      await this.dbService.agregarCita(cita);
    }

    this.cerrarFormulario();
    await this.cargarDatos();

    this.mostrarNotificacion(
      eraEdicion ? 'Cita actualizada correctamente' : 'Cita registrada correctamente'
    );
  }

  async eliminarCita(id: number) {
    const confirmar = confirm('¿Seguro que deseas eliminar esta cita?');
    if (!confirmar) return;

    await this.dbService.eliminarCita(id);
    await this.cargarDatos();
    
    this.mostrarNotificacion('🗑️ Cita eliminada correctamente', 'success');
  }

  obtenerNombrePaciente(id: number) {
    const paciente = this.pacientes.find(p => p.id == id);
    return paciente ? `${paciente.nombre} ${paciente.apellidoPaterno}` : '';
  }

  obtenerNombreMedico(id: number) {
    const medico = this.medicos.find(m => m.id == id);
    return medico ? `${medico.nombre} ${medico.apellidoPaterno}` : '';
  }

  getEstadoBadgeClass(estado: string): string {
    const clases: Record<string, string> = {
      'Programada': 'estado-programada',
      'Confirmada': 'estado-confirmada',
      'En curso': 'estado-curso',
      'Completada': 'estado-completada',
      'Cancelada': 'estado-cancelada',
      'No asistió': 'estado-no-asistio'
    };
    return clases[estado] || 'estado-programada';
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