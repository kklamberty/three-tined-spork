import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Todo } from './todo';

/**
 * Service that provides the interface for getting information
 * about `Todos` from the server.
 */
@Injectable({
  providedIn: 'root',
})
export class TodoService {
  // The private `HttpClient` is *injected* into the service
  // by the Angular framework. This allows the system to create
  // only one `HttpClient` and share that across all services
  // that need it, and it allows us to inject a mock version
  // of `HttpClient` in the unit tests so they don't have to
  // make "real" HTTP calls to a server that might not exist or
  // might not be currently running.
  private httpClient = inject(HttpClient);

  // The URL for the todos part of the server API.
  readonly todoUrl: string = `${environment.apiUrl}todos`;

  private readonly statusKey = 'status';
  private readonly limitKey = 'limit';

  getTodos(filters?: { status?: string, limit?: number }): Observable<Todo[]> {
    let httpParams: HttpParams = new HttpParams();
    if (filters) {
      if ((filters.status == 'complete') || (filters.status == 'incomplete')) {
        httpParams = httpParams.set(this.statusKey, filters.status);
      }
      if (filters.limit) {
        if (filters.limit < 999999999 && filters.limit > 0) {
          // sending too large a number in a request makes the
          // type conversion fail on the server side, BAD REQUEST
          httpParams = httpParams.set(this.limitKey, filters.limit.toString());
        }
      }
    }
    // Send the HTTP GET request with the given URL and parameters.
    // That will return the desired `Observable<Todo[]>`.
    return this.httpClient.get<Todo[]>(this.todoUrl, {
      params: httpParams,
    });

  }

}
