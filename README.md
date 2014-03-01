Understanding Amethyst
----------------------

Amethyst is an interpretation of the _subject-oriented programming_ paradigm designed for web applications running JavaScript. Subjects are essentially shared subcomponents that handle specific tasks inside an application, and they act as building blocks for larger components. The idea here is that many components will have cross-cutting concerns, or things in common, and the best way to address this issue is by abstracting out the common functionality into separately maintainable objects. A better-known, less radical, but related paradigm is _aspect-oriented programming_. 

Subjects can be loaded into any context, and they will interact with that context as needed to carry out their functionality. A subject in Amethyst can list other subjects as dependencies, or a developer can load subjects into anything in a hugely flexible way using the provided `load()` function (see all the patterns below).

You might look through the examples below and notice that much of the functionality we're touting can be created with object-oriented inheritance. So, what is the advantage of using Amethyst?

Subjects in Amethyst are a bit like classes, but much more flexible. Like a class, a subject has encapsulation, and it has a public API. But subjects are not instantiated. They are not separate instances. They are, for the most part, comprised of references. Additionally, subjects can affect their parent context where needed and similarly, the parent can affect them when they are loaded in. When you want to build functionality in layers, this extra flexibility can really save the maintainability of an application. If you want to save memory by sharing structures and making things idempotent, this too becomes incredibly easy when compared to setting things up with classes.

So essentially, we're passing common pieces of functionality around and binding them to different contexts. But we're also running functions to load and unload this functionality, and providing some flexible APIs.

Subjects in Amethyst ensure that everything you need in order to execute some piece of functionality is self-contained, reusable, and automatically namespaced. Subjects also can very easily share the same data structures across many different parent objects if desired--you can very easily save a subject from within a closure, meaning all components that use that subject have access to the same encapsulated, shared data structures, similar to Flyweight pattern.

Subjects in Amethyst __are easily lazy-loaded__ (see the constructor pattern below). Child subjects of a parent don't run until you load the parent. _This differs greatly from a typical component or package system, as the relationship between subjects is deliberately left open-ended._ You can have a subject within a subject within a subject (an so on) and if you don't load the parent, the children won't load either. This allows you to explore deep functionality and customization at a negligible cost. Use what you need when you need it.

Subjects force you to build canonical applications. If you create your entire application using subjects, you'll have a single place to control all error handling and logging. Want to integrate the latest remote logging API? Just put it in one place and watch all logs appear there. All the forms in your application will use the same validation and style, and if you want to make some minor changes, you just have to create a new subject that loads in and modifies the previous `forms` subject. The list goes on.

Setting up your application with subjects might take a little more time initially--but it encourages cleaner code and a more structured way of thinking that pays off down the road. It allows you to create easily maintainable, extensible, and uniform applications. It's the ultimate form of DRY.

Amethyst Subjects vs. RequireJS Modules
---------------------------------------
- Subjects are designed to be loaded into a _previously unknown context_ in a consistent way. RequireJS modules are dealt with manually at the time they are loaded.
  - The function to load a subject is written on the subject itself, rather than in `A.subjects.load()` as a callback. It is run in a context defined by the `A.subjects.load()` function.
  - All defined API methods for the subject are bound to the context provided to `A.subjects.load()`.
  - Because of the unknown parent context, subjects are automatically namespaced without any extra work from the developer. 
- The parent context becomes loaded with all the subjects, so you can design things inside subjects to bind to that context as well. For example, at Writebot we use a subject to abstract Meteor templates that allows our event handlers to both access reactive properties scoped to the parent and also the original template event handler context.

As you can see, it's quite a different paradigm than a module system.

Writing a Subject
-----------------

There are three ways to gain functionality from a subject:
- From whatever's returned from the loaded() function (the handle)
  - Can be used to create a closure unique to every load
- From whatever's in the subject's closure (shared among all loaded subjects, see `store` below...it's easy to cache things across subjects, similar to a Flyweight)
- From whatever's in the API
  - If loaded() does something on `this`, the API can offer different ways of dealing with what it created, since they're both bound to whatever A.subjects.load specified as the first argument.
- Loaded can set up all the subject's functionality, but the API provides the official methods of dealing with that functionality

```javascript
// For the comments below, assuming this subject was loaded into a
// component with A.subjects.load(this, 'example');

// Not required, but if you put things in this space all instances of
// subjects can share them if they're referenced from any of the functions
// below.
var store = {};

var loaded = function (options) {
  // Loaded has direct access to `this`.
  // It is called when the subject is loaded into a component, and it can
  // return a handle, e.g. var handle = A.subjects.load(this, 'example');
};

var unloaded = function (options) {
  // Unloaded also has direct access to `this`.
  // It can be called at any time like A.subjects.unload(this, 'example');
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

A.subjects.save(subject);
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
  A.subjects.load(this, 'example');
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

A.subjects.load(Component.prototype, 'example');

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
  A.subjects.load(privateSubject, 'example');
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
  A.subjects.load(item, 'example');
}

var item = new Item();
decorateWithExample(item);
// item has `example` subject now
```

Singletons are also possible, as well as other patterns. Use your imagination!

Author
------

Amethyst comes from the imagination of author [Jon James](http://github.com/jonjamz).
