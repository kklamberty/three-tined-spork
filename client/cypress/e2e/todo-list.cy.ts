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
    page.getTodoTitle().should('have.text', 'Todos');
  });

  it('Should show 300 todos', () => {
    page.getVisibleTodos().should('have.length', 300);
  });

  it('Should allow users to limit how many todos they see', () => {
    page.setLimitControl(5).should('have.value', '5');
    page.getVisibleTodos().should('have.lengthOf', 5);
    page.setLimitControl(15).should('have.value', '15');
    page.getVisibleTodos().should('have.lengthOf', 15);
    cy.get('[data-test=limitInput]').clear();
    page.getVisibleTodos().should('have.lengthOf', 300);
  });
})
