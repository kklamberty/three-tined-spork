import { Component, inject } from '@angular/core';
import { Validators, ReactiveFormsModule, FormGroup, FormControl, FormsModule } from '@angular/forms';
import { TodoService } from '../todo.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-add-todo',
  templateUrl: './add-todo.component.html',
  styleUrl: './add-todo.component.scss',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatButtonModule
  ],
})
export class AddTodoComponent {
  private todoService = inject(TodoService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  addTodoForm = new FormGroup({

    // I'm going to make these validators match exactly what I have in the server side
    owner: new FormControl('',
      Validators.compose([
        Validators.required,
        Validators.pattern('^(Blanche|Fry|Barry|Workman|Dawn|Roberta|Alice)$'),
      ])
    ),

    // except here... here I need complete or incomplete... or ?
    // and then when I submit the form, I will want to translate/convert
    status: new FormControl('incomplete',
      Validators.pattern('^(complete|incomplete)$')
      // I was thinking I needed a third option, but decided I don't
      // because this is not a filter, but just tells if *this* todo
      // is complete or not
    ),

    body: new FormControl('',
      Validators.compose([
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(1000),
      ])
    ),

    category: new FormControl('',
      Validators.compose([
        Validators.required,
        Validators.pattern('^(groceries|homework|software design|video games)$'),
      ])
    )
  });

  readonly addTodoValidationMessages = {
    owner: [
      {type: 'required', message: 'Owner is required'},
      {type: 'pattern', message: 'Owner must be from a limited set of options'}
    ],
    status: [
      {type: 'pattern', message: 'Status must be \'complete\' or \'incomplete\''}
    ],
    body: [
      {type: 'required', message: 'Body is required'},
      {type: 'minlength', message: 'Body must be at least 2 characters long'},
      {type: 'maxlength', message: 'Body cannot be more than 1000 characters long'},
    ],
    category: [
      {type: 'required', message: 'Category is required'},
      {type: 'pattern', message: 'Category must be from a limited set of options'}
    ]
  };

  formControlHasError(controlName: string): boolean {
    return this.addTodoForm.get(controlName).invalid &&
      (this.addTodoForm.get(controlName).dirty || this.addTodoForm.get(controlName).touched);
  }

  getErrorMessage(controlName: keyof typeof this.addTodoValidationMessages): string {
    for(const {type, message} of this.addTodoValidationMessages[controlName]) {
      if (this.addTodoForm.get(controlName).hasError(type)) {
        return message;
      }
    }
    return 'Unknown error';
  }

  submitForm() {
    // this is the information coming from the form where `status` is a string
    const partialTodoFromForm : Partial<{
      owner: string;
      status: string;
      body: string;
      category: string;
    }> = this.addTodoForm.value;

    // This is the partial I want to use to make a new todo.
    // It has a boolean status.
    // All of the other parts came directly from the form.
    const partialTodo : Partial<{
      owner: string;
      status: boolean;
      body: string;
      category: string;
    }> = {
      owner: partialTodoFromForm.owner,
      // Only need to check status and use a boolean here
      status: partialTodoFromForm.status === `complete` ? true : false,
      body: partialTodoFromForm.body,
      category: partialTodoFromForm.category
    }
    this.todoService.addTodo(partialTodo).subscribe({
      next: () => {
        this.snackBar.open(
          `Added a new ${this.addTodoForm.value.category} todo for ${this.addTodoForm.value.owner}`,
          null,
          { duration: 2000 }
        );
        this.router.navigate(['/todos']);
      },
      error: err => {
        if (err.status === 400) {
          this.snackBar.open(
            `Tried to add an illegal new todo – Error Code: ${err.status}\nMessage: ${err.message}`,
            'OK',
            { duration: 5000 }
          );
        } else if (err.status === 500) {
          this.snackBar.open(
            `The server failed to process your request to add a new todo. Is the server up? – Error Code: ${err.status}\nMessage: ${err.message}`,
            'OK',
            { duration: 5000 }
          );
        } else {
          this.snackBar.open(
            `An unexpected error occurred – Error Code: ${err.status}\nMessage: ${err.message}`,
            'OK',
            { duration: 5000 }
          );
        }
      },
    });
  }

}
