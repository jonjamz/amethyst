Understanding Subjects
----------------------

You're probably new to _subject-oriented programming_. You might look through the examples below and notice that much of the functionality we're packaging into subjects could be created with namespaced methods. So, what is the advantage of using subjects?

Functions, by themselves, don't allow you to keep track of state. Outside structures are required. You can bind a function to `this` in a constructor, or apply it to object, but how do you ensure that the function has access to everything it needs to do its job properly? Not to mention, things get really messy if you need to build functionality in layers.

Subjects provide a way to ensure that everything you need in order to execute some piece of functionality is self-contained and reusable. Also, you can very easily save a subject from within a closure, meaning all components that use that subject have access to the same encapsulated, shared data structures, similar to Flyweight pattern.

Subjects don't run until you load them. You can have a subject within a subject within a subject (an so on) and if you don't load the parent, the children won't load either. This allows you to explore deep functionality and customization at a negligible cost. Use what you need when you need it.

Subjects force you to build canonical applications. If you create your entire application using subjects, you'll have a single place to control all error handling and logging. Want to integrate the latest remote logging API? Just put it in one place and watch all logs appear there. All the forms in your application will use the same validation and style, and if you want to make some minor changes, you just have to create a new subject that loads in and modifies the previous `forms` subject. The list goes on.

Setting up your application with subjects might take a little more time initially--but it encourages cleaner code and a more structured way of thinking that pays off down the road. It allows you to create easily maintainable, extensible, and uniform applications. It's the ultimate form of DRY.

Writing a Subject
-----------------

There are three ways to gain functionality from a subject:
- From whatever's returned from the loaded() function (the handle)
  - Can be used to create a closure unique to every load
- From whatever's in the subject's closure (shared among all loaded subjects, see `store` below...it's easy to cache things across subjects, similar to a Flyweight)
- From whatever's in the API
  - If loaded() does something on `this`, the API can offer different ways of dealing with what it created, since they're both bound to whatever R.subjects.load specified as the first argument.
- Loaded can set up all the subject's functionality, but the API provides the official methods of dealing with that functionality

```javascript
// For the comments below, assuming this subject was loaded into a
// component with R.subjects.load(this, 'example');

// Not required, but if you put things in this space all instances of
// subjects can share them if they're referenced from any of the functions
// below.
var store = {};

var loaded = function (options) {
  // Loaded has direct access to `this`.
  // It is called when the subject is loaded into a component, and it can
  // return a handle, e.g. var handle = R.subjects.load(this, 'example');
};

var unloaded = function (options) {
  // Unloaded also has direct access to `this`.
  // It can be called at any time like R.subjects.unload(this, 'example');
};

// Api is loaded into the namespace of the subject in a component.
// `this.example.firstMethod()`
var api = {
  firstMethod: function () {
    console.log("hello from the example API!");
  }
};

var subject = {
  name: 'example',
  options: {
    loaded: loaded,
    unloaded: unloaded,
    api: api
  }
};

R.subjects.save(subject);
```

Using a Subject
---------------

There are several patterns you can use to load one or more subjects. These parallel some of the more popular JS patterns.

__Constructor__

This is the most common pattern for loading subjects, because functionality can be constructed lazily, saving memory. Also, if you load subjects inside functions that are called after program start (even in the `loaded` function of another subject), you don't have to worry about the order in which subjects are created and saved, because that happens for all subjects on program start.

_It's highly recommended to use this pattern._

```javascript
// You want to have many instances of some functionality.
var Component = function (options) {
  R.subjects.load(this, 'example');
  return; // If you're using CoffeeScript, make sure to return nothing or `undefined`
};

// Later...
var instance1 = new Component();
var instance2 = new Component();
```

__Constructor with Prototypes__

This is similar to the pattern above, except that functionality will be loaded onto the object's prototype on program start.

```javascript
var Component = function (options) {
  //...
};

R.subjects.load(Component.prototype, 'example');

var instance1 = new Component();
var instance2 = new Component();
// instance1.example.method();
```

__Revealing Module__

This pattern allows you to encapsulate functionality, but it runs immediately on program start.

```javascript
// You want to encapsulate some functionality.
var Component = (function () {
  var privateSubject = {};
  R.subjects.load(privateSubject, 'example');
  return {
    publicMethod: privateSubject.example.method
  };
}());

Component.publicMethod();
```

__Decorator__

```javascript
// You want to pass in an existing object and modify something about it
function decorateWithExample(item) {
  R.subjects.load(item, 'example');
}

var item = new Item();
decorateWithExample(item);
// item has `example` subject now
```

Singletons are also possible, as well as other patterns. Use your imagination!

Author
------

Amethyst comes from the imagination of author [Jon James](http://github.com/jonjamz).
