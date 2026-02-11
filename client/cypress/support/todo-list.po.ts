export class TodoListPage {
  private readonly baseUrl = '/todos';
  private readonly pageTitle = '[data-test=todo-list-title]'
  private readonly todo = '[data-test=todo]'

  navigateTo() {
    return cy.visit(this.baseUrl);
  }

  /**
   * Gets the title of the app when visiting the `/todos` page.
   *
   * @returns the value of the element with [data-test=todo-list-title]
   */
  getTodoTitle() {
    return cy.get(this.pageTitle);
  }

  /**
   * Gets an array of all the elements that have [data-test=todo]
   *
   * @returns the visible todos
   */
  getVisibleTodos() {
    return cy.get(this.todo);
  }

}
