'use strict';

// arg types

const registers = new Set();
Array.from({ length: 26 }, (_, i) => i)
    .map(index => index + 'a'.codePointAt(0))
    .map(codePoint => String.fromCodePoint(codePoint))
    .forEach(registers.add.bind(registers));
// Array.from({ length: 26 }, (_, i) => i)
//     .map(index => index + 'A'.codePointAt(0))
//     .map(codePoint => String.fromCodePoint(codePoint))
//     .forEach(registers.add.bind(registers));

class ArgumentType {
    constructor(name, shortName, validator) {
        this.name = name;
        this.shortName = shortName;
        this.validator = validator;
        Object.freeze(this);
    }
};

const argumentTypes = new Map();
Object.entries({
    "integer": ["int", asInteger],
    "register": ["reg", asRegister],
    "label": ["lbl", asLabel],
}).forEach(entry => {
    const [key, value] = entry;
    argumentTypes.set(key, new ArgumentType(key, value[0], value[1]));
});

class ArgumentDefinition {
    constructor(name, ...types) {
        this.name = name;
        this.types = Object.freeze([...types]);
        Object.freeze(this);
    }
}

// command templates

class CommandTemplate {
    constructor(name, desc, executor, ...argDefs) {
        this.name = name;
        this.argNames = argDefs.map(argDef => argDef.name);
        this.desc = desc;
        this.executor = executor;
        this.argTypesList = Object.freeze(argDefs
            .map(argDef => argDef.types)
            .map(types => Object.freeze([...types])))
        Object.freeze(this);
    }
};

const commandTemplates = new Map();
Object.entries({
    mov: [`Sets the value of register a to the value of b. b may be an integer or register.`,
    mov, ["a", "register"], ["b", "integer", "register"]],
    add: [`Adds to the value of register a the value of b. b may be an integer or register.`,
    add, ["a", "register"], ["b", "integer", "register"]],
    sub: [`Subtracts from the value of register a the value of b. b may be an integer or register.`,
    sub, ["a", "register"], ["b", "integer", "register"]],
    mul: [`Multiplies to the value of register a the value of b. b may be an integer or register.`,
    mul, ["a", "register"], ["b", "integer", "register"]],
    div: [`Divieds the value of register a by the value of b. b may be an integer or register.`,
    div, ["a", "register"], ["b", "integer", "register"]],
    inc: [`Increase the value of register a by one.`, inc, ["a", "register"]],
    dec: [`Decrease the value of register a by one.`, dec, ["a", "register"]],
    cmp: [`Compares the values of a  and b. a and b may - independently of each other - be integers or registers.`,
    cmp, ["a", "integer", "register"], ["b", "integer", "register"]],
    jne: [`Continue execution at label l, if the last comparison did not resolve to equal.`, jne, ["l", "label"]],
    jg: [`Continue execution at label l, if the last comparison resolved to greater.`, jg, ["l", "label"]],
    jge: [`Continue execution at label l, if the last comparison resolved to greater or equal.`, jge, ["l", "label"]],
    je: [`Continue execution at label l, if the last comparison resolved to equal.`, je, ["l", "label"]],
    jle: [`Continue execution at label l, if the last comparison resolved to less or equal greater.`, jle, ["l", "label"]],
    jl: [`Continue execution at label l, if the last comparison resolved to less.`, jl, ["l", "label"]],
    jmp: [`Continue execution at label l.`, jmp, ["l", "label"]],
    call: [`Continue execution at label l as a subroutine.`, call, ["l", "label"]],
    ret: [`Return from current subroutine.`, ret],
    end: [`End the program.`, end],
}).forEach(entry => {
    const [key, value] = entry;
    const desc = value[0];
    const executor = value[1];
    const argDefs = value.slice(2).map(arr => new ArgumentDefinition(
        arr[0],
        ...arr.slice(1)
            .map(typeName => argumentTypes.get(typeName))));
    commandTemplates.set(key, new CommandTemplate(key, desc, executor, ...argDefs));
});

class DemoProgram {
    constructor(id, name, program) {
        this.id = id;
        this.name = name;
        this.program = program;
        Object.freeze(this);
    }
};

const demoPrograms = new Map();
Object.entries({
    factorial: ["Factorial", "dmVyc2lvbjoxLjA7JTVCJTVCMCUyQyUyMm1vdiUyMiUyQyUyMmElMjIlMkMlMjI3JTIyJTJDJTIyJTIyJTVEJTJDJTVCMCUyQyUyMm1vdiUyMiUyQyUyMmIlMjIlMkMlMjJhJTIyJTJDJTIyJTIyJTVEJTJDJTVCMCUyQyUyMmNhbGwlMjIlMkMlMjJmYWN0JTIyJTJDJTIyJTIyJTVEJTJDJTVCMCUyQyUyMmVuZCUyMiUyQyUyMiUyMiU1RCUyQyU1QjAlMkMlMjJmYWN0JTNBJTIyJTJDJTIyJTIyJTVEJTJDJTVCMSUyQyUyMmRlYyUyMiUyQyUyMmElMjIlMkMlMjIlMjIlNUQlMkMlNUIxJTJDJTIybXVsJTIyJTJDJTIyYiUyMiUyQyUyMmElMjIlMkMlMjIlMjIlNUQlMkMlNUIxJTJDJTIyY21wJTIyJTJDJTIyYSUyMiUyQyUyMjElMjIlMkMlMjIlMjIlNUQlMkMlNUIxJTJDJTIyam5lJTIyJTJDJTIyZmFjdCUyMiUyQyUyMiUyMiU1RCUyQyU1QjElMkMlMjJyZXQlMjIlMkMlMjIlMjIlNUQlNUQ"],
    fibonacci: ["Fibonacci", "dmVyc2lvbjoxLjA7JTVCJTVCMCUyQyUyMm1vdiUyMiUyQyUyMmElMjIlMkMlMjIxMCUyMiUyQyUyMiUyMiU1RCUyQyU1QjAlMkMlMjJtb3YlMjIlMkMlMjJiJTIyJTJDJTIyMCUyMiUyQyUyMiUyMiU1RCUyQyU1QjAlMkMlMjJtb3YlMjIlMkMlMjJjJTIyJTJDJTIyMSUyMiUyQyUyMiUyMiU1RCUyQyU1QjAlMkMlMjJtb3YlMjIlMkMlMjJkJTIyJTJDJTIyMCUyMiUyQyUyMiUyMiU1RCUyQyU1QjAlMkMlMjJjYWxsJTIyJTJDJTIyZmliJTIyJTJDJTIyJTIyJTVEJTJDJTVCMCUyQyUyMmVuZCUyMiUyQyUyMiUyMiU1RCUyQyU1QjAlMkMlMjIlMjIlMkMlMjIlMjIlNUQlMkMlNUIwJTJDJTIyZmliJTNBJTIyJTJDJTIyJTIyJTVEJTJDJTVCMSUyQyUyMmRlYyUyMiUyQyUyMmElMjIlMkMlMjIlMjIlNUQlMkMlNUIxJTJDJTIybW92JTIyJTJDJTIyZCUyMiUyQyUyMmIlMjIlMkMlMjIlMjIlNUQlMkMlNUIxJTJDJTIyYWRkJTIyJTJDJTIyYiUyMiUyQyUyMmMlMjIlMkMlMjIlMjIlNUQlMkMlNUIxJTJDJTIybW92JTIyJTJDJTIyYyUyMiUyQyUyMmQlMjIlMkMlMjIlMjIlNUQlMkMlNUIxJTJDJTIyY21wJTIyJTJDJTIyYSUyMiUyQyUyMjAlMjIlMkMlMjIlMjIlNUQlMkMlNUIxJTJDJTIyam5lJTIyJTJDJTIyZmliJTIyJTJDJTIyJTIyJTVEJTJDJTVCMSUyQyUyMnJldCUyMiUyQyUyMiUyMiU1RCU1RA"],
}).forEach(entry => {
    const [key, value] = entry;
    demoPrograms.set(key, new DemoProgram(key, value[0], value[1]));
});

// commands
function mov(ctx, arg1, arg2) {
    const val = regInt(ctx, arg2);
    if (val === undefined) {
        return "Cannot read value of uninitialized register '" + arg2 + "'.";
    }
    ctx.registers[arg1] = val;
    return 1;
}

function add(ctx, arg1, arg2) {
    const regVal = ctx.registers[arg1];
    if (regVal === undefined) {
        return "Cannot read value of uninitialized register '" + arg1 + "'.";
    }
    const val = regInt(ctx, arg2);
    if (val === undefined) {
        return "Cannot read value of uninitialized register '" + arg2 + "'.";
    }

    ctx.registers[arg1] = regVal + val;
    return 1;
}

function sub(ctx, arg1, arg2) {
    const regVal = ctx.registers[arg1];
    if (regVal === undefined) {
        return "Cannot read value of uninitialized register '" + arg1 + "'.";
    }
    const val = regInt(ctx, arg2);
    if (val === undefined) {
        return "Cannot read value of uninitialized register '" + arg2 + "'.";
    }

    ctx.registers[arg1] = regVal - val;
    return 1;
}

function mul(ctx, arg1, arg2) {
    const regVal = ctx.registers[arg1];
    if (regVal === undefined) {
        return "Cannot read value of uninitialized register '" + arg1 + "'.";
    }
    const val = regInt(ctx, arg2);
    if (val === undefined) {
        return "Cannot read value of uninitialized register '" + arg2 + "'.";
    }

    ctx.registers[arg1] = regVal * val;
    return 1;
}

function div(ctx, arg1, arg2) {
    const regVal = ctx.registers[arg1];
    if (regVal === undefined) {
        return "Cannot read value of uninitialized register '" + arg1 + "'.";
    }
    const val = regInt(ctx, arg2);
    if (val === undefined) {
        return "Cannot read value of uninitialized register '" + arg2 + "'.";
    }
    if (val === 0) {
        return "Division by 0.";
    }

    ctx.registers[arg1] = (regVal - (regVal % val)) / val;
    return 1;
}

function inc(ctx, arg1) {
    const regVal = ctx.registers[arg1];
    if (regVal === undefined) {
        return "Cannot read value of uninitialized register '" + arg1 + "'.";
    }
    ctx.registers[arg1] = regVal + 1;
    return 1;
}

function dec(ctx, arg1) {
    const regVal = ctx.registers[arg1];
    if (regVal === undefined) {
        return "Cannot read value of uninitialized register '" + arg1 + "'.";
    }
    ctx.registers[arg1] = regVal - 1;
    return 1;
}

function cmp(ctx, arg1, arg2) {
    const leftVal = regInt(ctx, arg1);
    if (leftVal === undefined) {
        return "Cannot read value of uninitialized register '" + arg1 + "'.";
    }
    const rightVal = regInt(ctx, arg2);
    if (rightVal === undefined) {
        return "Cannot read value of uninitialized register '" + arg2 + "'.";
    }
    if (leftVal < rightVal) {
        ctx.cmpState = 'less';
    } else if (leftVal > rightVal) {
        ctx.cmpState = 'greater';
    } else {
        ctx.cmpState = 'equal';
    }
    return 1;
}

function jne(ctx, arg1) {
    const cmpState = ctx.cmpState;
    if (cmpState === null) {
        return "Comparator state is not set.";
    }
    return cmpState !== 'equal'? { label: arg1, newFrame: false } : 1;
}

function jg(ctx, arg1) {
    const cmpState = ctx.cmpState;
    if (cmpState === null) {
        return "Comparator state is not set.";
    }
    return cmpState === 'greater' ? { label: arg1, newFrame: false } : 1;
}

function jge(ctx, arg1) {
    const cmpState = ctx.cmpState;
    if (cmpState === null) {
        return "Comparator state is not set.";
    }
    return (cmpState === 'greater' || cmpState === 'equal')
        ? { label: arg1, newFrame: false } : 1;
}

function je(ctx, arg1) {
    const cmpState = ctx.cmpState;
    if (cmpState === null) {
        return "Comparator state is not set.";
    }
    return cmpState === 'equal' ? { label: arg1, newFrame: false } : 1;
}

function jle(ctx, arg1) {
    const cmpState = ctx.cmpState;
    if (cmpState === null) {
        return "Comparator state is not set.";
    }
    return (cmpState === 'less' || cmpState === 'equal')
        ? { label: arg1, newFrame: false } : 1;
}

function jl(ctx, arg1) {
    const cmpState = ctx.cmpState;
    if (cmpState === null) {
        return "Comparator state is not set.";
    }
    return cmpState === 'less' ? { label: arg1, newFrame: false } : 1;
}

function jmp(ctx, arg1) {
    return { label: arg1, newFrame: false };
}

function call(ctx, arg1) {
    return { label: arg1, newFrame: true };
}

function ret(ctx) {
    const lineIndexStack = ctx.lineIndexStack;
    const length = lineIndexStack.length;
    if (length > 1) {
        lineIndexStack.splice(length - 1);
    }
    return 1;
}

function end(ctx) {
    ctx.lineIndexStack.splice(0);
    return null;
}

// util
function isRegister(val) {
    return registers.has(val);
}
function isInteger(val) {
    return /^(?:0|-?[1-9][0-9]*)$/.test(val);
}
function isLabel(val) {
    return /^[a-zA-Z][a-zA-Z0-9_-]*[a-zA-Z0-9_]$/.test(val);
}
function isCommand(val) {
    return commandTemplates.has(val);
}

function asRegister(val) {
    return isRegister(val)
        ? val : null;
}
function asInteger(val) {
    return isInteger(val)
        ? parseInt(val) : null;
}
function asLabel(val) {
    return isLabel(val)
        ? val : null;
}
function asCommand(val) {
    return isCommand(val)
        ? commandTemplates.get(val) : null;
}

function regInt(ctx, arg) {
    if (typeof arg == 'number') {
        return arg;
    } else {
        console.assert(typeof arg == 'string');
        return ctx.registers[arg];
    }
}

function toNextLine(lineIndexStack, count) {
    if (count === undefined)
        count = 1;
    const length = lineIndexStack.length;
    lineIndexStack.splice(length - 1, 1, lineIndexStack[length - 1] + count);
}

function validateArgs(argTypesList, args) {
    const argCount = argTypesList.length;

    if (args.length !== argCount)
        return false;

    for (let argIndex = 0; argIndex < argCount; argIndex++) {
        const arg = args[argIndex];
        const argTypes = argTypesList[argIndex];

        if (argTypes.some(argType => argType.validator(arg)) === null)
            return false;
    }
    return true;
}

function resolveArgs(argTypesList, args) {

    const argCount = argTypesList.length;
    if (argCount !== args.length)
        return null;

    const resArgs = Array(argCount);
    for (let i = 0; i < argCount; i++) {
        const arg = args[i];
        const resArg = argTypesList[i].map(type => type.validator(arg)).filter(arg => arg !== null);

        if (resArg.length === 0)
            return i;

        console.assert(resArg.length === 1, "Multiple argument type parsers returned valid result.");
        resArgs[i] = resArg[0];
    }
    return resArgs;
}

function ordinalSuffix(number) {

    let suffix;

    if (10 < number && number < 20) {
        suffix = 'th';
    } else {
        const digit = number % 10;
        switch (digit) {
            case 1:
                suffix = 'st';
                break;
            case 2:
                suffix = 'nd';
                break;
            case 3:
                suffix = 'rd';
                break;
            default:
                suffix = 'th';
                break;
        }
    }

    return suffix;
}