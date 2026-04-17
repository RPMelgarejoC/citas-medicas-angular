import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink} from '@angular/router';
import { HostListener } from '@angular/core';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('citas-medicas');

  sidebarOpen = false;

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: any) {

    const sidebar = document.querySelector('.sidebar');
    const button = document.querySelector('.toggle-btn');

    if (!sidebar?.contains(event.target) && !button?.contains(event.target)) {
      this.sidebarOpen = false;
    }
  }
}

