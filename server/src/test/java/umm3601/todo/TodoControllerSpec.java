package umm3601.todo;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.bson.Document;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;

import com.mongodb.MongoClientSettings;
import com.mongodb.ServerAddress;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;

import io.javalin.Javalin;
import io.javalin.http.BadRequestResponse;
import io.javalin.http.Context;
import io.javalin.http.HttpStatus;
//import io.javalin.json.JavalinJackson;
import io.javalin.http.NotFoundResponse;
import io.javalin.validation.Validation;
import io.javalin.validation.ValidationException;
import io.javalin.validation.Validator;

@SuppressWarnings({ "MagicNumber" })

class TodoControllerSpec {

  // An instance of the controller we're testing that is prepared in
  // `setupEach()`, and then exercised in the various tests below.
  private TodoController todoController;

  // A Mongo object ID that is initialized in `setupEach()` and used
  // in a few of the tests.
  private ObjectId specialTodoID;

  // The client and database that will be used
  // for all the tests in this spec file.
  private static MongoClient mongoClient;
  private static MongoDatabase db;

  // Used to translate between JSON and POJOs.
  //private static JavalinJackson javalinJackson = new JavalinJackson();

  @Mock
  private Context ctx;

  @Captor
  private ArgumentCaptor<ArrayList<Todo>> todoArrayListCaptor;

  @Captor
  private ArgumentCaptor<Todo> todoCaptor;

  @Captor
  private ArgumentCaptor<Map<String, String>> mapCaptor;

  /* Sets up (the connection to the) DB once; that connection and DB will
   * then be (re)used for all the tests, and closed in the `teardown()`
   * method.
   */
  @BeforeAll
  static void setupAll() {
    String mongoAddr = System.getenv().getOrDefault("MONGO_ADDR", "localhost");

    mongoClient = MongoClients.create(
        MongoClientSettings.builder()
            .applyToClusterSettings(builder -> builder.hosts(Arrays.asList(new ServerAddress(mongoAddr))))
            .build());
    db = mongoClient.getDatabase("test");
  }

  // Heres the teardown method where we close the connection.
  @AfterAll
  static void teardown() {
    db.drop();
    mongoClient.close();
  }

  @BeforeEach
  void setupEach() throws IOException {
    // Reset our mock context and argument captor (declared with Mockito
    // annotations @Mock and @Captor)
    MockitoAnnotations.openMocks(this);

    // Setup database
    MongoCollection<Document> todoDocuments = db.getCollection("todos");
    todoDocuments.drop();
    List<Document> testTodos = new ArrayList<>();
    testTodos.add(
        new Document()
            .append("owner", "Blanche")
            .append("status", true)
            .append("body", "Finish Lab 2 writeup")
            .append("category", "homework"));
    testTodos.add(
        new Document()
            .append("owner", "Blanche")
            .append("status", false)
            .append("body", "Finish Lab 3 writeup")
            .append("category", "homework"));
    testTodos.add(
        new Document()
            .append("owner", "Fry")
            .append("status", false)
            .append("body", "Buy ingredients for lasagne")
            .append("category", "groceries"));

    specialTodoID = new ObjectId();
    Document specialTodo = new Document()
        .append("_id", specialTodoID)
        .append("owner", "Dawn")
        .append("status", false)
        .append("body", "Buy everything for Christmas dinner, including lasagne")
        .append("category", "groceries");

    todoDocuments.insertMany(testTodos);
    todoDocuments.insertOne(specialTodo);

    todoController = new TodoController(db);
  }

  // all our test for added functionality
  @Test
  void addsRoutes() {
    Javalin mockServer = mock(Javalin.class);
    todoController.addRoutes(mockServer);
    verify(mockServer, Mockito.atLeast(2)).get(any(), any());
    verify(mockServer, Mockito.atLeast(1)).post(any(), any());
    verify(mockServer, never()).delete(any(), any());
  }

  @Test
  void canGetAllTodos() throws IOException {
    when(ctx.queryParamMap()).thenReturn(Collections.emptyMap());
    todoController.getTodos(ctx);

    verify(ctx).json(todoArrayListCaptor.capture());
    verify(ctx).status(HttpStatus.OK);

    // Check that the database collection holds the same number of documents
    // as the size of the captured List<Todo>
    assertEquals(
        db.getCollection("todos").countDocuments(),
        todoArrayListCaptor.getValue().size());
  }

  @Test
  void getTodoWithExistentId() throws IOException {
    String id = specialTodoID.toHexString();
    when(ctx.pathParam("id")).thenReturn(id);

    todoController.getTodoByID(ctx);

    verify(ctx).json(todoCaptor.capture());
    verify(ctx).status(HttpStatus.OK);
    assertEquals("Dawn", todoCaptor.getValue().owner);
    assertEquals(specialTodoID.toHexString(), todoCaptor.getValue()._id);
  }

  @Test
  void getTodoWithBadId() throws IOException {
    when(ctx.pathParam("id")).thenReturn("bad");

    Throwable exception = assertThrows(BadRequestResponse.class, () -> {
      todoController.getTodoByID(ctx);
    });

    assertEquals("The requested todo id wasn't a legal Mongo Object ID.", exception.getMessage());
  }

  @Test
  void getTodoWithNonexistentId() throws IOException {
    String id = "588935f5c668650dc77df581";
    when(ctx.pathParam("id")).thenReturn(id);

    Throwable exception = assertThrows(NotFoundResponse.class, () -> {
      todoController.getTodoByID(ctx);
    });

    assertEquals("The requested todo was not found", exception.getMessage());
  }

  @Test
  void canGetTodosLimitedTo2() throws IOException {
    Integer limit = 2;
    String limitString = "2";

    Map<String, List<String>> queryParams = new HashMap<>();
    queryParams.put(TodoController.LIMIT_KEY, Arrays.asList(new String[] {limitString}));
    when(ctx.queryParamMap()).thenReturn(queryParams);
    when(ctx.queryParam(TodoController.LIMIT_KEY)).thenReturn(limitString);

    Validation validation = new Validation();
    Validator<Integer> validator = validation.validator(TodoController.LIMIT_KEY, Integer.class, limitString);
    when(ctx.queryParamAsClass(TodoController.LIMIT_KEY, Integer.class)).thenReturn(validator);

    todoController.getTodos(ctx);

    verify(ctx).json(todoArrayListCaptor.capture());
    verify(ctx).status(HttpStatus.OK);

    // Confirm that we are only showing 2 todos
    assertEquals(limit, todoArrayListCaptor.getValue().size());
  }

  @Test
  void canGetTodosWithStatus() throws IOException {
    //Boolean targetStatus = true;
    String targetStatusString = "complete";

    Map<String, List<String>> queryParams = new HashMap<>();
    queryParams.put(TodoController.STATUS_KEY, Arrays.asList(new String[] {targetStatusString}));
    when(ctx.queryParamMap()).thenReturn(queryParams);
    when(ctx.queryParam(TodoController.STATUS_KEY)).thenReturn(targetStatusString);

    Validation validation = new Validation();
    Validator<String> validator = validation.validator(TodoController.STATUS_KEY, String.class, targetStatusString);
    when(ctx.queryParamAsClass(TodoController.STATUS_KEY, String.class)).thenReturn(validator);

    todoController.getTodos(ctx);

    verify(ctx).json(todoArrayListCaptor.capture());
    verify(ctx).status(HttpStatus.OK);

    // Confirm that all the todos passed to `json` have status true.
    for (Todo todo : todoArrayListCaptor.getValue()) {
      assertEquals(true, todo.status);
    }
  }

  @Test
  void canGetTodosWithStatusIncomplete() throws IOException {
    String targetStatusString = "incomplete";

    Map<String, List<String>> queryParams = new HashMap<>();
    queryParams.put(TodoController.STATUS_KEY, Arrays.asList(new String[] {targetStatusString}));
    when(ctx.queryParamMap()).thenReturn(queryParams);
    when(ctx.queryParam(TodoController.STATUS_KEY)).thenReturn(targetStatusString);

    Validation validation = new Validation();
    Validator<String> validator = validation.validator(TodoController.STATUS_KEY, String.class, targetStatusString);
    when(ctx.queryParamAsClass(TodoController.STATUS_KEY, String.class)).thenReturn(validator);

    todoController.getTodos(ctx);

    verify(ctx).json(todoArrayListCaptor.capture());
    verify(ctx).status(HttpStatus.OK);

    // Confirm that all the todos passed to `json` have status true.
    for (Todo todo : todoArrayListCaptor.getValue()) {
      assertEquals(false, todo.status);
    }
  }

  @Test
  void respondsAppropriatelyToBadStatus() {
    Map<String, List<String>> queryParams = new HashMap<>();
    String illegalStatusString = "bad";
    queryParams.put(TodoController.STATUS_KEY, Arrays.asList(new String[] {illegalStatusString}));
    when(ctx.queryParamMap()).thenReturn(queryParams);
    // When the code being tested calls `ctx.queryParam(STATUS_KEY)` return the
    // `illegalIntegerString`.
    when(ctx.queryParam(TodoController.STATUS_KEY)).thenReturn(illegalStatusString);

    // Create a validator that confirms that when we ask for the value associated with
    // `STATUS_KEY`, we get back the `illegalStatusString`.
    Validation validation = new Validation();
    // The `STATUS_KEY` should be name of the key whose value is being validated.
    // You can actually put whatever you want here, because it's only used in the generation
    // of testing error reports, but using the actual key value will make those reports more informative.
    Validator<String> validator = validation.validator(TodoController.STATUS_KEY, String.class, illegalStatusString);
    when(ctx.queryParamAsClass(TodoController.STATUS_KEY, String.class)).thenReturn(validator);

    // This should now throw a `ValidationException` because
    // our request has a status that doesn't match the allowed pattern.
    ValidationException exception = assertThrows(ValidationException.class, () -> {
      todoController.getTodos(ctx);
    });
    // This digs into the returned `ValidationException` to get the underlying `Exception` that caused
    // the validation to fail:
    //   - `exception.getErrors` returns a `Map` that maps keys (like `STATUS_KEY`) to lists of
    //      validation errors for that key
    //   - `.get(STATUS_KEY)` returns a list of all the validation errors associated with `STATUS_KEY`
    //   - `.get(0)` assumes that the root cause is the first error in the list. In our case there
    //     is only one root cause,
    //     so that's safe, but you might be careful about that assumption in other contexts.
    //   - `.exception()` gets the actual `Exception` value that was the underlying cause
    String exceptionMessage = exception.getErrors().get(TodoController.STATUS_KEY).get(0).getMessage();
    assertTrue(exceptionMessage.contains(illegalStatusString));
  }

  @Test
  void canGetTodosWithCategory() throws IOException {
    Map<String, List<String>> queryParams = new HashMap<>();
    String categoryString = "groceries";
    queryParams.put(TodoController.CATEGORY_KEY, Arrays.asList(new String[] {categoryString}));
    when(ctx.queryParamMap()).thenReturn(queryParams);

    Validation validation = new Validation();
    Validator<String> validator = validation.validator(TodoController.CATEGORY_KEY, String.class, categoryString);
    when(ctx.queryParamAsClass(TodoController.CATEGORY_KEY, String.class)).thenReturn(validator);

    todoController.getTodos(ctx);

    verify(ctx).json(todoArrayListCaptor.capture());
    verify(ctx).status(HttpStatus.OK);

    assertEquals(2, todoArrayListCaptor.getValue().size());
  }

  @Test
  void canGetTodosWithOwner() throws IOException {
    Map<String, List<String>> queryParams = new HashMap<>();
    String ownerString = "Blanche";
    queryParams.put(TodoController.OWNER_KEY, Arrays.asList(new String[] {ownerString}));
    when(ctx.queryParamMap()).thenReturn(queryParams);

    Validation validation = new Validation();
    Validator<String> validator = validation.validator(TodoController.OWNER_KEY, String.class, ownerString);
    when(ctx.queryParamAsClass(TodoController.OWNER_KEY, String.class)).thenReturn(validator);

    todoController.getTodos(ctx);

    verify(ctx).json(todoArrayListCaptor.capture());
    verify(ctx).status(HttpStatus.OK);

    assertEquals(2, todoArrayListCaptor.getValue().size());
    }

  @Test
  void canGetBodyWithString() throws IOException {
    Integer bodyNumber = 2;

    Map<String, List<String>> queryParams = new HashMap<>();
    queryParams.put(TodoController.BODY_KEY, Arrays.asList(new String[] {"lasagne"}));
    when(ctx.queryParamMap()).thenReturn(queryParams);
    when(ctx.queryParam(TodoController.BODY_KEY)).thenReturn("lasagne");

    todoController.getTodos(ctx);

    verify(ctx).json(todoArrayListCaptor.capture());
    verify(ctx).status(HttpStatus.OK);

    // Confirm that we have two bodies with the phrase "lasagne".
    assertEquals(bodyNumber, todoArrayListCaptor.getValue().size());
  }

  @Test
  void canGetSortedTodosByCategory() throws IOException {
    Map<String, List<String>> queryParams = new HashMap<>();
    queryParams.put(TodoController.SORTBY_KEY, Arrays.asList(new String[] {"category"}));
    when(ctx.queryParamMap()).thenReturn(queryParams);
    when(ctx.queryParam(TodoController.SORTBY_KEY)).thenReturn("category");

    todoController.getTodos(ctx);

    verify(ctx).json(todoArrayListCaptor.capture());
    verify(ctx).status(HttpStatus.OK);

    List<String> sortedList = new ArrayList<>();

    for (Todo todo : todoArrayListCaptor.getValue()) {
      sortedList.add(todo.category);
    }

    List<String> myList = new ArrayList<>();
    myList.add("groceries");
    myList.add("groceries");
    myList.add("homework");
    myList.add("homework");

    assertEquals(myList, sortedList);
  }

  @Test
  void getTodosByOwnerAndCategory() throws IOException {
    String targetOwnerString = "Fry";
    String targetCategoryString = "groceries";

    Map<String, List<String>> queryParams = new HashMap<>();
    queryParams.put(TodoController.OWNER_KEY, Arrays.asList(new String[] {targetOwnerString}));
    queryParams.put(TodoController.CATEGORY_KEY, Arrays.asList(new String[] {targetCategoryString}));
    when(ctx.queryParamMap()).thenReturn(queryParams);
    when(ctx.queryParam(TodoController.OWNER_KEY)).thenReturn(targetOwnerString);

    Validation validation = new Validation();
    Validator<String> validator = validation.validator(TodoController.CATEGORY_KEY, String.class, targetCategoryString);
    when(ctx.queryParamAsClass(TodoController.CATEGORY_KEY, String.class)).thenReturn(validator);
    when(ctx.queryParam(TodoController.CATEGORY_KEY)).thenReturn(targetCategoryString);

    Validation validation2 = new Validation();
    Validator<String> validator2 = validation2.validator(TodoController.OWNER_KEY, String.class, targetOwnerString);
    when(ctx.queryParamAsClass(TodoController.OWNER_KEY, String.class)).thenReturn(validator2);
    when(ctx.queryParam(TodoController.OWNER_KEY)).thenReturn(targetOwnerString);

    todoController.getTodos(ctx);

    verify(ctx).json(todoArrayListCaptor.capture());
    verify(ctx).status(HttpStatus.OK);
    assertEquals(1, todoArrayListCaptor.getValue().size());
    for (Todo todo : todoArrayListCaptor.getValue()) {
      assertEquals(targetOwnerString, todo.owner);
      assertEquals(targetCategoryString, todo.category);
    }
  }
}
