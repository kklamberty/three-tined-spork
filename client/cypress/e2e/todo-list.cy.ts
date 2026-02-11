import { TodoListPage } from "cypress/support/todo-list.po";

const page = new TodoListPage();

describe('Todo List', () => {
  before(() => {
    cy.task('seed:database');
  });

  beforeEach(() => {
    page.navigateTo();
  });

  it('Should have the correct title', () => {
    page.getTodoTitle().should('have.text', 'Things to do:');
  });

  it('Should show 300 todos', () => {
    page.getVisibleTodos().should('have.length', 300);
  });
})
