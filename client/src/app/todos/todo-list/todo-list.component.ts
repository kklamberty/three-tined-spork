import { Component, inject } from '@angular/core';
import { TodoService } from '../todo.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIcon } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'app-todo-list',
  imports: [
    MatIcon,
    MatListModule,
  ],
  templateUrl: './todo-list.component.html',
  styleUrl: './todo-list.component.scss',
})
export class TodoListComponent {
  // todoService the `TodoService` used to get users from the server
  private todoService = inject(TodoService);

  serverFilteredTodos = toSignal(this.todoService.getTodos());
}
