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

  mostrarFormulario = false;

  mostrarToast = false;
  mensajeToast = '';
  tipoToast = 'success';

  nuevaCita = {
    idPaciente: '',
    idMedico: '',
    fecha: '',
    hora: '',
    motivo: ''
  };

  // Horario laboral
  HORA_INICIO = 8;   // 8:00 AM
  HORA_FIN = 18;     // 6:00 PM
  DIAS_LABORALES = [1, 2, 3, 4, 5]; // Lunes a Viernes

  // Opciones de horas con intervalos de 30 minutos
  opcionesHoras: string[] = [];

  // Horas disponibles para el médico seleccionado
  horasDisponibles: string[] = [];

  async ngOnInit() {
    await this.dbService.initDB();
    await this.cargarDatos();
    this.generarOpcionesHoras();
  }

  // Generar horas cada 30 minutos: 8:00, 8:30, 9:00, ..., 17:30
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
      motivo: ''
    };
    
    this.horasDisponibles = [];
  }

  editarCita(c: any) {
    this.nuevaCita = { ...c };
    this.editando = true;
    this.idEditando = c.id;
    this.mostrarFormulario = true;
    
    // Cargar horas disponibles para el médico seleccionado
    if (this.nuevaCita.idMedico && this.nuevaCita.fecha) {
      this.cargarHorasDisponibles();
    }
  }

  // ✅ VALIDAR QUE LA FECHA NO SEA PASADA
  validarFechaNoPasada(fecha: string): boolean {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); // Resetear hora para comparar solo fechas
    
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

  // ✅ VALIDAR HORARIO LABORAL
  validarHorarioLaboral(fecha: string, hora: string): boolean {
    const partes = fecha.split('-');
    const año = parseInt(partes[0]);
    const mes = parseInt(partes[1]) - 1;
    const dia = parseInt(partes[2]);
    
    const fechaObj = new Date(año, mes, dia);
    const diaSemana = fechaObj.getDay();
    
    // Días NO laborables: Domingo(0) o Sábado(6)
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

  // ✅ CARGAR HORAS DISPONIBLES PARA EL MÉDICO SELECCIONADO
  async cargarHorasDisponibles() {
    if (!this.nuevaCita.idMedico || !this.nuevaCita.fecha) {
      this.horasDisponibles = [];
      return;
    }
    
    const citasExistentes = await this.dbService.obtenerCitas();
    
    // Obtener horas ya ocupadas por este médico en esta fecha
    const horasOcupadas = citasExistentes
      .filter(c => 
        Number(c.idMedico) === Number(this.nuevaCita.idMedico) && 
        c.fecha === this.nuevaCita.fecha &&
        c.id !== this.idEditando // Excluir la cita actual si es edición
      )
      .map(c => c.hora);
    
    // Filtrar horas disponibles (todas las horas menos las ocupadas)
    this.horasDisponibles = this.opcionesHoras.filter(h => !horasOcupadas.includes(h));
    
    // Si la hora actual seleccionada ya no está disponible, limpiarla
    if (this.nuevaCita.hora && !this.horasDisponibles.includes(this.nuevaCita.hora)) {
      this.nuevaCita.hora = '';
      this.mostrarNotificacion('⚠️ La hora seleccionada ya no está disponible', 'error');
    }
    
    this.cdr.detectChanges();
  }

  // ✅ VALIDAR DOBLE RESERVA
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
      this.mostrarNotificacion(`❌ El Dr. ${medico?.nombre} ya tiene una cita el ${this.nuevaCita.fecha} a las ${this.nuevaCita.hora}`, 'error');
      return false;
    }

    return true;
  }

  // ✅ VALIDAR DOBLE CITA DEL PACIENTE
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
      this.mostrarNotificacion(`❌ El paciente ${paciente?.nombre} ya tiene una cita el ${this.nuevaCita.fecha} a las ${this.nuevaCita.hora}`, 'error');
      return false;
    }

    return true;
  }

  // ✅ CUANDO CAMBIA EL MÉDICO
  onMedicoChange() {
    this.nuevaCita.hora = '';
    this.cargarHorasDisponibles();
  }

  // ✅ CUANDO CAMBIA LA FECHA
  onFechaChange() {
    this.nuevaCita.hora = '';
    if (this.nuevaCita.fecha) {
      // Validar fecha pasada
      if (!this.validarFechaNoPasada(this.nuevaCita.fecha)) {
        this.nuevaCita.fecha = '';
        return;
      }
      // Validar horario laboral
      if (!this.validarHorarioLaboral(this.nuevaCita.fecha, '')) {
        this.nuevaCita.fecha = '';
        return;
      }
      // Cargar horas disponibles
      if (this.nuevaCita.idMedico) {
        this.cargarHorasDisponibles();
      }
    }
  }

  async guardarCita() {
    // Validaciones básicas
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

    // Validar fecha pasada (otra vez por seguridad)
    if (!this.validarFechaNoPasada(this.nuevaCita.fecha)) {
      return;
    }

    // Validar horario laboral
    if (!this.validarHorarioLaboral(this.nuevaCita.fecha, this.nuevaCita.hora)) {
      return;
    }

    // Validar doble reserva (médico)
    const reservaValida = await this.validarDobleReserva();
    if (!reservaValida) return;

    // Validar doble cita del paciente
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
      eraEdicion ? '✅ Cita actualizada correctamente' : '✅ Cita registrada correctamente'
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
    return paciente ? `${paciente.nombre} ${paciente.apellido}` : '';
  }

  obtenerNombreMedico(id: number) {
    return this.medicos.find(m => m.id == id)?.nombre || '';
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