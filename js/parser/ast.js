define('ast/pattern', function() {
  class Pattern {
    constructor(type, id1, id2) {
      this.type = type;
      this.id1 = id1;
      this.id2 = id2;
    }
  }
  return Pattern;
});

define('ast/abstraction', function() {
  class Abstraction {
    /**
     * param here is the name of the variable of the abstraction. Body is the
     * subtree  representing the body of the abstraction.
     */
    constructor(pattern, body) {
      this.pattern = pattern;
      this.body = body; 
    }
  }
  return Abstraction;
});

define('ast/application', function() {
  class Application {
    /**
     * (lhs rhs) - left-hand side and right-hand side of an application.
     */
    constructor(lhs, rhs) {
      this.lhs = lhs;
      this.rhs = rhs;
    }
  }
  return Application;
});

define('ast/identifier', function() {
  class Identifier {
    /**
     * name is the string matched for this identifier.
     */
    constructor(value, name) {
      this.value = value;
      this.name = name;
    }
  }
  return Identifier;
});

define('ast/constant', function() {
  class Constant {
    constructor(value) {
      this.value = value;
    }
  }
  return Constant;
});

define('ast/operation', function() {
  class Operation {
    constructor(type, name) {
      this.type = type;
      this.name = name;
    }
  }
  return Operation;
});

define('ast/if-then-else', function() {
  class IfThenElse {
    constructor(cond, t1, t2) {
      this.cond = cond;
      this.t1 = t1;
      this.t2 = t2;
    }
  }
  return IfThenElse;
});

define('ast/recursion', function() {
  class Recursion {
    constructor(param, body) {
      this.param = param;
      this.body = body;
    }
  }
  return Recursion;
});

define('ast/tuple', function() {
  class Tuple {
    constructor(lhs, rhs) {
      this.lhs = lhs;
      this.rhs = rhs;
    }
  }
  return Tuple;
});

define('ast/cell-creation', function() {
  class CellCreation {
    constructor(term) {
      this.term = term;
    }
  }
  return CellCreation;
});

define('ast/fusion', function() {
  class Fusion {
    constructor(name, id, body) {
      this.name = name;
      this.id = id;
      this.body = body;
    }
  }
  return Fusion;
});

define('ast/pc', function() {
  class Pc {
    constructor(data) {
      this.data = data;
    }
  }
  return Pc; 
});

define('ast/name-abstraction', function() {
  class NameAbstraction {
    constructor(name, body) {
      this.name = name;
      this.body = body;
    }
  }
  return NameAbstraction; 
});

define('ast/name-instantiation', function() {
  class NameInstantiation {
    constructor(name, body) {
      this.name = name;
      this.body = body;
    }
  }
  return NameInstantiation; 
});