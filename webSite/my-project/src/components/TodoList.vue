<template>
  <div class="container">
    <div class="row">
      <div class="col-12 py-5">
        <h1>{{ listName }}</h1>
      </div>
    </div>
    <div class="row mb-3">
      <create-todo @on-new-todo="addTodo($event)" />
    </div>
    <div class="row">
      <div class="col-12 col-sm-10 col-lg-6">
        <ul class="list-group">
          <todo
            v-for="(todo, index) in todos"
            :key="index"
            :description="todo.task"
            :completed="todo.done"
            @on-toggle="toggleTodo(todo)"
            @on-delete="deleteTodo(todo)"
            @on-edit="editTodo(todo, $event)"
          />
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import Todo from "./Todo.vue";
import CreateTodo from "./CreateTodo.vue";
export default {
  props: {
    listName: String,
  },
  data() {
    return {
      todos: [
        // { description: "Do the dishes", completed: false },
        // { description: "Take out the trash", completed: false },
        // { description: "Finish doing laundry", completed: false },
      ],
    };
  },
  mounted() {
    this.getAllTodos();
  },
  methods: {
    getAllTodos() {
      fetch("https://qekf9lgczb.execute-api.eu-west-1.amazonaws.com/prod/todos")
        .then((response) => response.json())
        .then((data) => (this.todos = data));
    },
    updateOrCreateToto(todo) {
      fetch(
        "https://qekf9lgczb.execute-api.eu-west-1.amazonaws.com/prod/todo",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // 'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: JSON.stringify(todo), // body data type must match "Content-Type" header
        }
      )
        .then((respone) => respone.json())
        .then((data) => console.log(data));
    },
    addTodo(newTodo) {
      const todo = { task: newTodo, done: false };
      this.todos.push(todo);
      this.updateOrCreateToto(todo);
    },
    toggleTodo(todo) {
      todo.done = !todo.done;
      this.updateOrCreateToto(todo);
    },
    deleteTodo(deletedTodo) {
      this.todos = this.todos.filter((todo) => todo !== deletedTodo);
      fetch(
        `https://qekf9lgczb.execute-api.eu-west-1.amazonaws.com/prod/todos/${deletedTodo.id}`,
        {
          method: "DELETE",
        }
      )
        .then((respone) => respone.json())
        .then((data) => console.log(data));
    },
    editTodo(todo, newTodoDescription) {
      todo.task = newTodoDescription;
      this.updateOrCreateToto(todo);
    },
  },
  components: { Todo, CreateTodo },
};
</script>

<style scoped lang="scss"></style>
