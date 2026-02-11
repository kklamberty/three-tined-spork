import { HttpClient, HttpParams, provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed, waitForAsync } from "@angular/core/testing";
import { of } from "rxjs";
import { Todo } from "./todo";
import { TodoService } from "./todo.service";

describe('TodoService', () => {
  // A small collection of test todos
  const testTodos: Todo[] = [
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
      _id: 'fry_lasagne_id',
      owner: 'Dawn',
      status: false,
      body: 'Buy everything for Christmas dinner, including lasagne',
      category: 'groceries',

    }
  ];

  let todoService: TodoService;
  // These are used to mock the HTTP requests so that we (a) don't have to
  // have the server running and (b) we can check exactly which HTTP
  // requests were made to ensure that we're making the correct requests.
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
    todoService = TestBed.inject(TodoService);
  });

  afterEach(() => {
    // After every test, assert that there are no more pending requests.
    httpTestingController.verify();
  })

  it('should be created', () => {
    expect(todoService).toBeTruthy();
  });

  it('should access todos from the server using getTodos() when called with no parameters', waitForAsync(() => {
    const mockedMethod = spyOn(httpClient, 'get').and.returnValue(of(testTodos));
    todoService.getTodos().subscribe(() => {
      expect(mockedMethod)
        .withContext('one call')
        .toHaveBeenCalledTimes(1);
      expect(mockedMethod)
        .withContext('talks to the correct endpoint')
        .toHaveBeenCalledWith(todoService.todoUrl, { params: new HttpParams() });
    });
  }));
});
