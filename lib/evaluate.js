const specialForms = Object.create(null);

function evaluate(expr, scope) {
  if (expr.type == "value") {
    return expr.value;
  }
  else if (expr.type == "word") {
    if (expr.name in scope) {
      return scope[expr.name];
    }
    else {
      throw new ReferenceError(`Undefined binding: ${expr.name}`);
    }
  }
  else if (expr.type == "apply") {
    let { operator, args } = expr;
    if (operator.type == "word" && operator.name in specialForms) {
      return specialForms[operator.name](expr.args, scope);
    }
    else {
      let op = evaluate(operator, scope);
      if (typeof op == "function") {
        return op(...args.map(arg => evaluate(arg, scope)));
      }
      else {
        throw new TypeError("Applying a non-function.");
      }
    }
  }
}

specialForms.if = (args, scope) => {
  if (args.length != 3) {
    throw new SyntaxError('if expects 3 arguments')
  }
  else if (evaluate(args[0], scope) !== false) {
    return evaluate(args[1], scope)
  }
  else {
    return evaluate(args[2], scope)
  }
}

specialForms.while = (args, scope) => {
  if (args.length != 2) {
    throw new SyntaxError('while expects 2 arguments')
  }
  while (evaluate(args[0], scope) !== false) {
    evaluate(args[1], scope)
  }

  return false;
}

specialForms.do = (args, scope) => {
  let value = false;
  for (let arg of args) {
    value = evaluate(arg, scope);
  }

  return value;
};

specialForms.define = (args, scope) => {
  if (args.length != 2) {
    throw new SyntaxError('define expects 2 arguments')
  }
  else if (args[0].type !== 'word') {
    throw new SyntaxError('attempting to bind to non-word')
  }
  else if (args[0].name in scope) {
    throw new SyntaxError(`Identifier '${args[0].name}' has already been declared`)
  }
  let value = evaluate(args[1], scope)
  scope[args[0].name] = value

  return value
}

specialForms.set = (args, scope) => {
  if (args.length != 2) {
    throw new SyntaxError('define expects 2 arguments')
  }
  else if (args[0].type !== 'word') {
    throw new SyntaxError('attempting to bind to non-word')
  }
  else if (!(args[0].name in scope)) {
    throw new ReferenceError(`Undefined binding: ${args[0].name}`);
  }
  let currScope = scope
  while (!Object.prototype.hasOwnProperty.call(currScope, args[0].name)) {
    currScope = Object.getPrototypeOf(currScope) 
  }
  let value = evaluate(args[1], scope)
  currScope[args[0].name] = value

  return value
}

specialForms.fun = (args, scope) => {
  if (!args.length) {
    throw new SyntaxError('fun expects at least 1 argument')
  }

  let body = args[args.length-1]
  let params = args.slice(0,-1).map(expr => {
    if (expr.type != "word") {
      throw new SyntaxError("Parameter names must be words");
    }

    return expr.name;
  });

  return function() {
    if (arguments.length != params.length) {
      throw new TypeError("Wrong number of arguments");
    }

    let localScope = Object.create(scope);
    for (let i = 0; i < arguments.length; i++) {
      localScope[params[i]] = arguments[i];
    }

    return evaluate(body, localScope);
  };
}

module.exports = evaluate