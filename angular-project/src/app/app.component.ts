import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  imports: [RouterOutlet, CommonModule]
})
export class AppComponent implements OnInit {
  title = 'angular-project';

  ngOnInit(): void {
    document.body.classList.add('default-layout');
  }
}
