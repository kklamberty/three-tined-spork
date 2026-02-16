import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';

import { TodoListComponent } from './todo-list.component';
import { TodoService } from '../todo.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { MockTodoService } from 'src/testing/todo.service.mock';
import { Observable } from 'rxjs';
import { Todo } from '../todo';

describe('Todo List', () => {
  let todoList: TodoListComponent;
  let fixture: ComponentFixture<TodoListComponent>;
  let todoService: TodoService;

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
      todoService = TestBed.inject(TodoService);
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

  it('should call getTodos() when limit signal changes', fakeAsync(() => {
    const spy = spyOn(todoService, 'getTodos').and.callThrough();
    todoList.limit.set(3);
    fixture.detectChanges();
    // tick must be in fakeAsync
    tick(500); // accounts for the debounce in the pipe in the component
    expect(spy).toHaveBeenCalledWith({ status: undefined, limit: 3 });
  }));

  it('should call getTodos() when status signal changes', fakeAsync(() => {
    const spy = spyOn(todoService, 'getTodos').and.callThrough();
    todoList.status.set('complete');
    fixture.detectChanges();
    // tick must be in fakeAsync
    tick(500); // accounts for the debounce in the pipe in the component
    expect(spy).toHaveBeenCalledWith({ status: 'complete', limit: undefined });
  }));

  it('should call getTodos() when status signal changes', fakeAsync(() => {
    const spy = spyOn(todoService, 'getTodos').and.callThrough();
    todoList.status.set('incomplete');
    fixture.detectChanges();
    // tick must be in fakeAsync
    tick(500); // accounts for the debounce in the pipe in the component
    expect(spy).toHaveBeenCalledWith({ status: 'incomplete', limit: undefined });
  }));

  it('should call getTodos() when status signal changes', fakeAsync(() => {
    const spy = spyOn(todoService, 'getTodos').and.callThrough();
    todoList.status.set('both');
    fixture.detectChanges();
    // tick must be in fakeAsync
    tick(500); // accounts for the debounce in the pipe in the component
    expect(spy).toHaveBeenCalledWith({ status: 'both', limit: undefined });
  }));

  it('should not show error message on successful load', () => {
    expect(todoList.errMsg()).toBeUndefined();
  });
});

/*
 * This test is a little odd, but illustrates how we can use stubs
 * to create mock objects (a service in this case) that be used for
 * testing. Here we set up the mock TodoService (todoServiceStub) so that
 * _always_ fails (throws an exception) when you request a set of todos.
 */
describe('Misbehaving Todo List', () => {
  let todoList: TodoListComponent;
  let fixture: ComponentFixture<TodoListComponent>;

  let todoServiceStub: {
    getTodos: () => Observable<Todo[]>;
    filterTodos: () => Todo[];
  };

  beforeEach(() => {
    // stub TodoService for test purposes
    todoServiceStub = {
      getTodos: () =>
        new Observable((observer) => {
          observer.error('getTodos() Observer generates an error');
        }),
      filterTodos: () => []
    };
  });

  // Construct the `todoList` used for the testing in the `it` statement
  // below.
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        TodoListComponent
      ],
      // providers:    [ TodoService ]  // NO! Don't provide the real service!
      // Provide a test-double instead
      providers: [{
        provide: TodoService,
        useValue: todoServiceStub
      }, provideRouter([])],
    })
      .compileComponents();
  }));

  beforeEach(fakeAsync(() => { // tick must be in fakeAsync
    fixture = TestBed.createComponent(TodoListComponent);
    todoList = fixture.componentInstance;
    fixture.detectChanges();
    tick(500); // accounts for the debounce in the pipe in the component
  }));

  it("generates an error if we don't set up a TodoListService", () => {
    // If the service fails, we expect the `serverFilteredTodos` signal to
    // be an empty array of todos.
    expect(todoList.serverFilteredTodos())
      .withContext("service can't give values to the list if it's not there")
      .toEqual([]);
    // We also expect the `errMsg` signal to contain the "Problem contacting…"
    // error message. (It's arguably a bit fragile to expect something specific
    // like this; maybe we just want to expect it to be non-empty?)
    expect(todoList.errMsg())
      .withContext('the error message will be')
      .toContain('Problem contacting the server – Error Code:');
  });
});
