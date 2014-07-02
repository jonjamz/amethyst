About Amethyst
--------------

Amethyst provides __convention over configuration__ modules for JavaScript. We call these modules _"subjects"_ because of the programming paradigm that influenced Amethyst. Here's a quick rundown of the features that subjects offer:

* Every subject has a public API.
* Every subject has a `loaded()` function. This is written once when the subject is defined, and run each time the subject is loaded. It is bound to a new, specified context when run.
  * Set up your subject in a new context with `loaded()`. See the examples below.
  * A similar `unloaded()` function can be written as well.
* Every subject can specify another subject as a dependency (try not to get too crazy with this, though).
* Subjects are written, saved, and then loaded into a given context.
  * You can share the same data structures among many subjects loaded into different contexts if you reference outer-scope variables in a `loaded()` function or public API method.
* Amethyst supports `save` and `load` event hooks. You can add any amount of functions as hooks, and these will have access to information about every subject being saved or loaded passed in as arguments.
  * For example, you could hook into the `after.load` event and write some logic that notifies a third-party service when a specific subject is loaded somewhere. Or, you could set up a new channel on a mediator. Lots you can do.

More Information
----------------

Amethyst is an interpretation of the __subject-oriented programming__ paradigm designed for web applications running JavaScript. When you think of _"subjects"_, think of _"adaptive functionality that works across many contexts"_.

When writing a modular application, many modules will have common needs. Sometimes, the proper use of a piece of functionality requires modules to share state. With Amethyst, common functionality doesn't need to be abstracted out of the private scope. It can be written in one place and loaded into many contexts as a cross-cutting concern.

So, subjects are essentially shared submodules designed to be composed into larger modules. Check this out:

```javascript

// Let's create a character module using subjects
var Character = function (name, faceType, bodyType) {
  this.name = name;

  A.subjects.load(this,
    ['faces', faceType],
    ['bodies', bodyType]
  );

};

// Let's add some animations compatible with the faces and bodies subjects
// We don't need to wrap the arguments in an array if we're not specifying any options for `loaded()`
A.subjects.load(Character.prototype,
  'faceAnimations',
  'bodyAnimations'
);

// Now we'll create some characters
var character1 = new Character('john', ['green-eyes', 'smile-3'], ['tall', 'skinny']);
var character2 = new Character('mike', ['blue-eyes', 'smile-1'], ['medium', 'strong']);

// faceAnimations and bodyAnimations both depend on the `rendering` subject, so it's loaded in already
// Let's render our characters now
character1.rendering.render({x: 123, y: 123, z: 123});
character2.rendering.render({x: 123, y: 123, z: 200});

// Make one smile and the other walk
character1.faceAnimations.smile();
character2.bodyAnimations.walk(1, 'forward');

// You know what, let's modify character1 to look like an alien
A.subjects.load(character1,
  ['faces', ['alien-eyes', 'alien-smile']],
  ['bodies', ['tall', 'alien']]
);

// Re-render character1
character1.rendering.renderInPlace();

// Cool, so now we can load the rendering subject somewhere else and access shared state
var map = function () {
  A.subjects.load(this, 'rendering');
};

// Check if any items on the screen are colliding
var collisions = map.rendering.anyColliding();
console.log(collisions); // ['john', 'mike']

```

JavaScript gives us easy referencing, closures, and contextual binding. Amethyst puts these features to use to make flexible and maintainable coding easy.

Amethyst Subjects vs. RequireJS Modules
---------------------------------------
- Amethyst automatically binds all defined methods for a subject (`loaded()`, `unloaded()`, public API) to a parent context.
- Subjects are written and used in a uniform, _convention over configuration_ manner. As such, they are less flexible than RequireJS modules. Subjects may be used across many applications, but they are primarily meant to contribute functionality to modules, and even be used as modules themselves, in a single application.
  - The function to load a subject is written on the subject itself, rather than in `A.subjects.load()` as a callback. It is run in a context defined by the `A.subjects.load()` function.
  - All defined API methods for the subject are bound to the context provided to `A.subjects.load()`.
  - Because of the unknown parent context, subjects are automatically namespaced without any extra work from the developer.
- The parent context becomes loaded with all the subjects, so you can design things inside subjects to bind to that context as well. For example, on one project, we use a subject to abstract Meteor templates that allows our event handlers to both access reactive properties scoped to the parent and also the original template event handler context. In this way, you have many small subjects working together to form larger components.

Writing a Subject
-----------------

There are three ways to gain functionality from a subject:
- From whatever's returned from the loaded() function (the handle)
  - Can be used to create a closure unique to every load
- From whatever's in the subject's closure (shared among all loaded subjects, see `store` below...it's easy to cache things across subjects, similar to a Flyweight)
- From whatever's in the API
  - If loaded() does something on `this`, the API can offer different ways of dealing with what it created, since they're both bound to whatever `A.subjects.load` specified as the first argument.
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
  var privateSubject = function () {};
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

Upcoming Features
-----------------

I'm about to release a new feature for Amethyst that allows for composing many subjects into groups, where you have the option to rename any clashing public API names. This will bypass the automatic namespacing that usually occurs when loading subjects into a parent context. 

I will also release a few helpful utilities.

An Amethyst server using Meteor's DDP protocol will also enable subjects to be remote-loaded in real-time.

Author
------

Amethyst comes from the imagination of author [Jon James](http://github.com/jonjamz).
