import { ComponentFixture, fakeAsync, flush, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { TodoService } from '../todo.service';
import { AddTodoComponent } from './add-todo.component';
import { provideHttpClient } from '@angular/common/http';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MockTodoService } from 'src/testing/todo.service.mock';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AbstractControl, FormGroup } from '@angular/forms';
import { TodoListComponent } from '../todo-list/todo-list.component';
import { provideRouter, Router } from '@angular/router';
import { Location } from '@angular/common';
import { of } from 'rxjs';

describe('AddTodoComponent', () => {
  let addTodoComponent: AddTodoComponent;
  let addTodoForm: FormGroup;
  let fixture: ComponentFixture<AddTodoComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        AddTodoComponent,
        MatSnackBarModule
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: TodoService,
          useClass: MockTodoService
        }
      ]
    })
      .compileComponents().catch(error => {
        expect(error).toBeNull();
      });
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddTodoComponent);
    addTodoComponent = fixture.componentInstance;
    fixture.detectChanges();
    addTodoForm = addTodoComponent.addTodoForm;
    expect(addTodoForm).toBeDefined();
    expect(addTodoForm.controls).toBeDefined();
  });

  it('should create', () => {
    expect(addTodoComponent).toBeTruthy();
    expect(addTodoForm).toBeTruthy();
  });

  // Confirms that an initial, empty form is *not* valid, so
  // people can't submit an empty form.
  it('form should be invalid when empty', () => {
    expect(addTodoForm.valid).toBeFalsy();
  });

  describe('The owner field', () => {
    let ownerControl: AbstractControl;

    beforeEach(() => {
      ownerControl = addTodoComponent.addTodoForm.controls.owner;
    });

    it('should not allow empty owner', () => {
      ownerControl.setValue('');
      expect(ownerControl.valid).toBeFalsy();
    });

    it('should allow the name \'Alice\'', () => {
      ownerControl.setValue('Alice');
      expect(ownerControl.valid).toBeTruthy();
    });

    it('should fail for owners that do not match the allowed pattern', () => {
      ownerControl.setValue('Alex');
      expect(ownerControl.valid).toBeFalsy();
      expect(ownerControl.hasError('pattern')).toBeTruthy();
    })
  });

  describe('getErrorMessage()', () => {
    it('should return the correct error message', () => {
      // The type statement is needed to ensure that `controlName` isn't just any
      // random string, but rather one of the keys of the `addUserValidationMessages`
      // map in the component.
      let controlName: keyof typeof addTodoComponent.addTodoValidationMessages = 'owner';
      addTodoComponent.addTodoForm.get(controlName).setErrors({'required': true});
      expect(addTodoComponent.getErrorMessage(controlName)).toEqual('Owner is required');

      // We don't need the type statement here because we're not using the
      // same (previously typed) variable. We could use a `let` and the type statement
      // if we wanted to create a new variable, though.
      controlName = 'status';
      addTodoComponent.addTodoForm.get(controlName).setErrors({'pattern': true});
      expect(addTodoComponent.getErrorMessage(controlName)).toEqual('Status must be \'complete\' or \'incomplete\'');

      controlName = 'body';
      addTodoComponent.addTodoForm.get(controlName).setErrors({'required': true});
      expect(addTodoComponent.getErrorMessage(controlName)).toEqual('Body is required');
    });

    it('should return "Unknown error" if no error message is found', () => {
      // The type statement is needed to ensure that `controlName` isn't just any
      // random string, but rather one of the keys of the `addTodoValidationMessages`
      // map in the component.
      const controlName: keyof typeof addTodoComponent.addTodoValidationMessages = 'category';
      addTodoComponent.addTodoForm.get(controlName).setErrors({'unknown': true});
      expect(addTodoComponent.getErrorMessage(controlName)).toEqual('Unknown error');
    });
  });
});

describe('AddTodoComponent#submitForm()', () => {
  let component: AddTodoComponent;
  let fixture: ComponentFixture<AddTodoComponent>;
  let todoService: TodoService;
  let location: Location;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AddTodoComponent,
        MatSnackBarModule
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {provide: TodoService, useClass: MockTodoService }, // A (more-async-tests) - provide + use class of the mock
        provideRouter([
          { path: 'todos', component: TodoListComponent }
        ])]
    }).compileComponents().catch(error => {
      expect(error).toBeNull();
    });
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddTodoComponent);
    component = fixture.componentInstance;
    todoService = TestBed.inject(TodoService); // B (more-async-tests) - inject the service as the mock
    location = TestBed.inject(Location);
    // We need to inject the router and the HttpTestingController, but
    // never need to use them. So, we can just inject them into the TestBed
    // and ignore the returned values.
    TestBed.inject(Router);
    TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  beforeEach(() => {
    // Set up the form with valid values.
    // We don't actually have to do this, but it does mean that when we
    // check that `submitForm()` is called with the right arguments below,
    // we have some reason to believe that that wasn't passing "by accident".
    component.addTodoForm.controls.owner.setValue('Alice');
    component.addTodoForm.controls.status.setValue('incomplete');
    component.addTodoForm.controls.body.setValue('Buy peanut butter');
    component.addTodoForm.controls.category.setValue('groceries');
  });

  it('should call addTodo() and handle success response', fakeAsync(() => {
    const todoPartial = {
      owner: component.addTodoForm.controls.owner.value,
      // Only need to check status and use a boolean here
      status: component.addTodoForm.controls.status.toString() === `complete` ? true : false,
      body: component.addTodoForm.controls.body.value,
      category: component.addTodoForm.controls.category.value
    }
    const addTodoSpy = spyOn(todoService, 'addTodo').and.returnValue(of('1'));
    component.submitForm();
    expect(addTodoSpy).toHaveBeenCalledWith(todoPartial);
    // Wait for the router to navigate to the new page. This is necessary since
    // navigation is an asynchronous operation.
    tick();
    expect(location.path()).toBe('/todos');
    flush();
  }));
});
