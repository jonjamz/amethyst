//     Amethyst.js 1.0
//     http://Amethystjs.org
//     (c) 2013 Jonathan James, Writebot
//     Amethyst may be freely distributed under the MIT license.

(function () {

  // Setup
  // -----
  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Create the A object for use below.
  var A = {};

  // Export the A object correctly for client and server use.
  // If Node.js -- export with backwards-compatibility for the old `require()` API.
  // If other (browser, etc.), add `A` to root as a global object.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = A;
    }
    exports.A = A;
  } else {
    root.A = A;
  }

  // Utility functions for library.
  // ------------------------------
  var isObject = function (x) {
    return Object.prototype.toString.call(x) === '[object Object]';
  };

  var isArray = function (x) {
    return Object.prototype.toString.call(x) === '[object Array]';
  };

  var isFunction = function (x) {
    return typeof x === 'function';
  };

  var canUseConsoleLog = function () {
    return typeof console !== 'undefined' && console.log;
  };

  // Subjects Module
  // ---------------
  // Amethyst components are comprised of subjects.
  // They are abstractions of commonly used functionality -- specialized constructors that
  // load functionality into a component or decorate existing functionality.
  var subjects = (function () {


    // Scalars.
    // --------
    // All subjects are stored in _store so we can load them into components later.
    var _store = {};

    // Save and load hooks allow us to use reflection easily.
    var saveHooks = { before: [], after: [] }
    , loadHooks = { before: [], after: [] };

    // Utility functions for subjects.
    // -------------------------------
    var subjectHasName = function (x) {
      return x.name !== null;
    };

    var isInStore = function (name) {
      return typeof _store[name] !== "undefined";
    };

    var thereAreBeforeSaveHooks = function () {
      return !!saveHooks.before.length;
    };

    var thereAreAfterSaveHooks = function () {
      return !!saveHooks.after.length;
    };

    var saveSubject = function (name, options) {
      _store[name] = options;
    };

    // The method to save subjects in _store.
    // --------------------------------------
    var save = function (/* list of subject objects with name and options */) {

      // Iterate through a list of subjects passed as arguments.
      // If they validate, add them to _store.
      for (var i = arguments.length - 1; i >= 0; i--) {
        var name, options = {};

        // Validate and assign name.
        if (arguments[i].name == null) throw new Error("Subject " + i + " has no name.");
        name = arguments[i].name;

        // Validate and assign options.
        if (!isObject(arguments[i].options))
          throw new Error("Subject " + i + " options must be an object.");
        options = arguments[i].options;

        // Check for existing subjects by the same name.
        if (isInStore(name)) throw new Error("A subject named " +
          name + " already exists. Please give your subjects unique names.");

        // Run before hooks for save.
        if (thereAreBeforeSaveHooks()) {
          for (var i = saveHooks.before.length - 1; i >= 0; i--) {
            saveHooks.before[i](name, options);
          };
        }

        // Save the subject.
        saveSubject(name, options);

        // Run after hooks for save.
        if (thereAreAfterSaveHooks()) {
          for (var i = saveHooks.after.length - 1; i >= 0; i--) {
            saveHooks.after[i](name, options);
          };
        }

      };
    };

    // The method to load subjects into a parent using an explicit "subjects" property.
    // --------------------------------------------------------------------------------
    var _loadDeps = function (context, subjects) {
      if (!isObject(subjects))
        throw new Error("Subjects " + subjects +
          " to be loaded into a parent must be an object!");

      // Call _load recursively for each subject.
      var args;
      for (key in subjects) {
        if (!subjects.hasOwnProperty(key)) continue;

        if (isArray(subjects[key])) {
          args = [key, subjects[key]];
        } else {
          args = [key, [subjects[key]]];
        }

        // Name and value.
        _load.apply(context, [args]);

      };
    }

    // The method to load subjects into a component.
    // ---------------------------------------------
    var _load = function (/* list of subjects in string or array form */) {
      var subject = {}
      , name = ''
      , argsArray = []
      , loadedResults = []
      , error = function (name) {
          throw new Error("Subject " + name + " not found.");
      };

      // console.log("LOADING SUBJECT", arguments);

      // Loop through all given subjects and load them into the component.
      for (var i = arguments.length - 1; i >= 0; i--) {

        // console.log("LOADING ARGUMENT", i, arguments[i]);

        // Arguments can either be an array or string.
        // An array with two items will have [subjectName, [subjectConstructorArguments]].
        if (isArray(arguments[i])) {
          name = arguments[i][0];

          // Get this subject from `_store` if it exists.
          if (!isInStore(name)) error(name);
          subject = _store[name];

          // Check if we're loading other subjects into this subject. Load them first.
          if (subject.subjects) {
            _loadDeps(this, subject.subjects);
          }

          // Apply argsArray to `loaded` method.
          if (arguments[i].length > 1) argsArray = arguments[i][1];
          if (subject.loaded && isFunction(subject.loaded)) {
            loadedResults.push( subject.loaded.apply(this, argsArray) );
          }

        // Do as above, but for string subject name (without an args array).
        } else if (typeof arguments[i] === 'string') {
          name = arguments[i];
          if (!isInStore(name)) error(name);
          subject = _store[name];
          if (subject.subjects) {
            _loadDeps(this, subject.subjects);
          }
          if (subject.loaded && isFunction(subject.loaded)) {
            loadedResults.push( subject.loaded.call(this) );
          }
        }

        // Add the subject's API to the component. APIs are optional but safe.
        if (subject.api) {
          if (isFunction(subject.api)) {

            this[name] = subject.api.bind(this); // If subjects.api is a function.

          } else {

            var val
            , boundAPI = {};

            for (key in subject.api) { // TODO: make recursive?
              if (!subject.api.hasOwnProperty(key)) continue;
              val = subject.api[key];
              boundAPI[key] = isFunction(val) ? val.bind(this) : val;
            }
            this[name] = boundAPI; // APIs are namespaced by subject when loaded.
          };
        }
      } // End for arguments.

      return loadedResults;

    };

    var load = function (/* context, subject names...*/) {
      var s = Array.prototype.slice.call(arguments, 1);
      _load.apply(arguments[0], s);
    };

    // Run a subject's unloaded() function in a given context
    var unload = function (/* context, subject name */) {
      var s = Array.prototype.slice.call(arguments, 1);
      if (!isInStore(s)) throw new Error("Subject " + s + " not found.");
      if (_store[s].unloaded && isFunction(_store[s].unloaded))
        _store[s].unloaded.call(arguments[0]);
    };

    var view = function () {
      if (canUseConsoleLog()) console.log(_store);
    };

    // Subjects API
    // ------------
    return {
      before: {
        save: function (func) {
          if (!isFunction(func)) throw new Error("Hooks must be functions!");
          saveHooks.before.push(func);
        }
      },
      after: {
        save: function (func) {
          if (!isFunction(func)) throw new Error("Hooks must be functions!");
          saveHooks.after.push(func);
        }
      },
      save: save,
      load: load,
      unload: unload,
      view: view
    };

  }());

  // Add subjects module to A!
  A.subjects = subjects;

}).call(this);
