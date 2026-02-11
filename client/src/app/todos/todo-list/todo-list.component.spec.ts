import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TodoListComponent } from './todo-list.component';
import { TodoService } from '../todo.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { MockTodoService } from 'src/testing/todo.service.mock';

describe('Todo List', () => {
  let todoList: TodoListComponent;
  let fixture: ComponentFixture<TodoListComponent>;
  //let todoService: TodoService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TodoListComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: TodoService, useClass: MockTodoService },
        provideRouter([])
      ],
    });
  });

  beforeEach(waitForAsync(() => {
    TestBed.compileComponents().then(() => {
      fixture = TestBed.createComponent(TodoListComponent);
      todoList = fixture.componentInstance;
      //todoService = TestBed.inject(TodoService);
      fixture.detectChanges();
    });
  }));

  it('should create', () => {
    expect(todoList).toBeTruthy();
  });

  it('should initialize with serverFilteredTodos available', () => {
    const todos = todoList.serverFilteredTodos();
    expect(todos).toBeDefined();
    expect(Array.isArray(todos)).toBe(true);
  });
});
