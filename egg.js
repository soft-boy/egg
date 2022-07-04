#!/usr/bin/env node
const fs = require('fs')
var prompt = require('prompt-base')('>');
prompt.prefix = '🥚'

const parse = require('./lib/parse')
const evaluate = require('./lib/evaluate')
const topScope = require('./lib/topScope.js')

const [,, ...args] = process.argv

if (!args.length) {
  console.log('\x1b[36m%s\x1b[0m', 'Welcome to Egg v0.0.1.')

  let scope = Object.create(topScope)
  const execREPL = async () => {
    const input = await prompt.run() || ''

    try {
      val = evaluate(parse(input), scope)
      if (val) console.log(val)
    } catch (e) {
      console.log(e)
    }
    
    execREPL()
  }

  execREPL()
}
else {
  const filename = args[0]
  const file = fs.readFileSync(filename).toString()

  function run(program) {
    return evaluate(parse(program), Object.create(topScope));
  }

  run(file);
}
