import { Component, computed, inject, signal } from '@angular/core';
import { TodoService } from '../todo.service';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatIcon } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { catchError, combineLatest, debounceTime, of, switchMap, tap } from 'rxjs';
import { Todo } from '../todo';
import { MatCardModule } from '@angular/material/card';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

@Component({
  selector: 'app-todo-list',
  imports: [
    MatCardModule,
    MatIcon,
    MatListModule,
    MatInputModule,
    MatButtonToggleModule,
    FormsModule,
  ],
  templateUrl: './todo-list.component.html',
  styleUrl: './todo-list.component.scss',
})
export class TodoListComponent {
  // todoService the `TodoService` used to get users from the server
  private todoService = inject(TodoService);

  contains = signal<string | undefined>(undefined);
  status = signal<string | undefined >(undefined);
  limit = signal<number | undefined>(undefined);
  errMsg = signal<string | undefined>(undefined);

  private limit$ = toObservable(this.limit);
  private status$ = toObservable(this.status);

  serverFilteredTodos = toSignal(
    combineLatest([this.status$, this.limit$]).pipe(
      debounceTime(500),
      switchMap(([status, limit]) =>
        this.todoService.getTodos({
          status,
          limit,
        })
      ),
      catchError((err) => {
        if (!(err.error instanceof ErrorEvent)) {
          this.errMsg.set(
            `Problem contacting the server – Error Code: ${err.status}\nMessage: ${err.message}`
          );
        }
        return of<Todo[]>([]);
      }),
      tap(() => {
        // A common side effect is printing to the console.
        // You don't want to leave code like this in the
        // production system, but it can be useful in debugging.
        // console.log('Todos were filtered on the server')
      })
    )
  );

  filteredTodos = computed(() => {
    const serverFilteredTodos = this.serverFilteredTodos();
    return this.todoService.filterTodos(serverFilteredTodos, {
      contains: this.contains(),
    });
  });

}
