import { Routes } from '@angular/router';

import { Pacientes } from './pacientes/pacientes';
import { Medicos } from './medicos/medicos';
import { Citas } from './citas/citas';


export const routes: Routes = [
    { path: 'pacientes', component: Pacientes },
    { path: 'medicos', component: Medicos },
    { path: 'citas', component: Citas },
    { path: '', redirectTo: 'pacientes', pathMatch: 'full' }

];
