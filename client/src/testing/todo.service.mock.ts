import { Injectable } from "@angular/core";
import { Observable, of } from "rxjs";
import { AppComponent } from "src/app/app.component";
import { Todo } from "src/app/todos/todo";
import { TodoService } from "src/app/todos/todo.service";

@Injectable({
  providedIn: AppComponent
})
export class MockTodoService implements Pick<TodoService, 'getTodos' | 'filterTodos' | 'addTodo'> {
  static testTodos: Todo[] =[
    {
      _id: 'blanche_lab2_id',
      owner: 'Blanche',
      status: true,
      body: 'Finish Lab 2 writeup',
      category: 'homework',
    },
    {
      _id: 'blanche_lab3_id',
      owner: 'Blanche',
      status: false,
      body: 'Finish Lab 3 writeup',
      category: 'homework',
    },
    {
      _id: 'fry_lasagne_id',
      owner: 'Fry',
      status: false,
      body: 'Buy ingredients for lasagne',
      category: 'groceries',
    },
    {
      _id: 'dawn_lasagne_id',
      owner: 'Dawn',
      status: false,
      body: 'Buy everything for Christmas dinner, including lasagne',
      category: 'groceries',

    }
  ];

  // skipcq: JS-0105
  // It's OK that the `_filters` argument isn't used here, so we'll disable
  // this warning for just his function.
  /* eslint-disable @typescript-eslint/no-unused-vars */
  getTodos(_filters: { limit?: number }): Observable<Todo[]> {
    return of(MockTodoService.testTodos);
  }

  addTodo(newUser: Partial<Todo>): Observable<string> {
    // Send post request to add a new todo with the todo data as the body.
    // `res.id` should be the MongoDB ID of the newly added `Todo`.
    return of('')
  }

  filterTodos(todos: Todo[], filters: {
    contains?: string;
  }): Todo[] {
    return []
  }
}
