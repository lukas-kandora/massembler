'use strict';

window.onload = function () {

    const commandDatalist = document.getElementById("command-datalist");
    commandTemplates.forEach((_, command) => {
        const option = document.createElement("option");
        option.setAttribute("value", command);
        commandDatalist.appendChild(option);
    });


    const vue = new Vue({
        el: "#main",
        data: {
            edit: true,

            activeLineIndex: null,
            invalidEntryCount: 0,
            invalidLineCount: 0,

            execError: null,
        },
        computed: {
            programValid: function () {
                return this.invalidLineCount === 0;
            },
            execState: function () {
                const stateDisplay = this.$refs['state-display'];
                return stateDisplay === undefined ? undefined : stateDisplay.$data;
            },
            programLines: function () {
                return this.$refs['command-list'].$data.lines;
            },
            stage: function () {
                const execState = this.execState;
                const lineIndexStack = execState.lineIndexStack;
                return lineIndexStack.length === 0 ? 'stopped' : 'running';
            },
        },
        methods: {
            loadProgram: function (value, format) {
                const commandList = this.$refs['command-list'];
                commandList.importFrom(value, format);
            },
            copyLink: function () {
                const commandList = this.$refs['command-list'];
                const encodedProgram = commandList.exportTo('base64');

                const url = location.protocol + '//' + location.host + location.pathname + '?program=' + encodedProgram;
                navigator.clipboard.writeText(url);
            },
            run: function () {

                function fun() {
                    if (this.stage !== 'stopped' && this.execError === null) {
                        this.step();
                        setTimeout(() => fun.call(this), 25);
                    }
                }

                this.step();
                fun.call(this);
            },
            step: function () {
                const execState = this.execState;
                const lineIndexStack = execState.lineIndexStack;
                const length = lineIndexStack.length;
    
                if (length === 0) {
                    lineIndexStack.splice(0, 0, 0);
                    this.execError = null;
                    return;
                }
                
                const lineIndex = lineIndexStack[length - 1];
    
                const lines = this.programLines;
                const lineCount = lines.length;
    
                if (lineIndex >= lineCount) {
                    this.execError = {
                        type: 'error',
                        msg: "Program counter of " + (lineIndex + 1) + " exceeds number of lines.",
                    };
                    return;
                }
    
                const line = lines[lineIndex];
                const command = line.command;
    
                let next = null;
                if (command === "") {
                    toNextLine(lineIndexStack);
                    this.execError = null;
                    return;
                } else if (command.charAt(command.length - 1) === ':') {
                    const label = command.substring(0, command.length - 1);
                    if (asLabel(label) === null) {
                        this.execError = {
                            type: 'warning',
                            msg: "Label '" + label+ "' in line " + (lineIndex + 1) + " is not a valid label and will be ignored.",
                        };
                    } else {
                        this.execError = null;
                    }
                    toNextLine(lineIndexStack);
                    return;
                } else {
                    const commandTemplate = commandTemplates.get(command);
                    if (commandTemplate === undefined) {
                        this.execError = {
                            type: 'error',
                            msg: "Command '" + command + "' in line " + (lineIndex + 1) + " is unknown.",
                        };
                        return;
                    }
    
                    const argTypesList = commandTemplate.argTypesList;
                    const args = line.args;

                    const resolvedArgs = resolveArgs(commandTemplate.argTypesList, args);
                    console.assert(resolvedArgs !== null, "command", command, "in line", lineIndex, "needs", argTypesList.length, "arguments but got", args.length);

                    if (typeof resolvedArgs == 'number') {

                        const errorArgIndex = resolvedArgs;

                        const arg = args[errorArgIndex];
                        const argTypes = argTypesList[errorArgIndex];
                        const argTypeCount = argTypes.length;
                        let typesString = argTypes[argTypeCount - 1].name;
                        if (argTypeCount !== 1) {
                            typesString = argTypes.slice(0, -1).map(argType => argType.name).join(", ") + " or " + typesString;
                        }
                        this.execError = {
                            type: 'error',
                            msg: arg.length === 0
                            ? (errorArgIndex + 1) + ordinalSuffix(errorArgIndex + 1) + " argument of command '" + command + "' in line " + (lineIndex + 1) + " was not specified."
                            : (errorArgIndex + 1) + ordinalSuffix(errorArgIndex + 1) + " argument of command '" + command + "' in line " + (lineIndex + 1) + " needs to be " + typesString + ".",
                        };
                        return;
                    }
    
                    const res = commandTemplate.executor(execState, ...resolvedArgs);

                    if (res !== null) {
                        switch (typeof res) {
                        case 'number':
                            toNextLine(lineIndexStack, res);
                            this.execError = null;
                            break;
                        case 'object':
                            const newFrame = res.newFrame;
                            const labelC = res.label + ':';

                            const indices = lines.flatMap((line, index) => line.command === labelC ? [index] : []);
                            const indicesLength = indices.length;
                            switch (indicesLength) {
                            case 1:
                                if (newFrame) {
                                    if (lineIndexStack.length === 63) {
                                        this.execError = {
                                            type: 'error',
                                            msg: "Stack limit exceeded.",
                                        };
                                        break;
                                    }
                                    lineIndexStack.push(indices[0]);
                                } else {
                                    lineIndexStack.splice(-1, 1, indices[0]);
                                }
                                this.execError = null;
                                break;
                            case 0:
                                this.execError = {
                                    type: 'error',
                                    msg: "No line with label '" + res.label + "' found.",
                                };
                                break;
                            default:
                                this.execError = {
                                    type: 'error',
                                    msg: "Multiple occurrences of label '" + res.label + "' found in lines " + indices.slice(0, -1).map(i => (i + 1)).join(", ") + " and " + (indices[indicesLength - 1] + 1) + ".",
                                };
                                break;
                            }
                            break;
                        case 'string':
                            this.execError = {
                                type: 'error',
                                msg: res,
                            };
                            break;
                        default:
                            this.execError = {
                                type: 'error',
                                msg: "Operation returned result of unexpected type " + (typeof res) + ".",
                            };
                            break;
                        }
                    }
                }
            },
            reset: function () {
                this.stop();
                this.execState.cmpState = null;
                this.execState.registers = {};
            },
            stop: function () {
                this.execState.lineIndexStack.splice(0);
                this.execError = null;
            },
        }
    });
    window.vue = vue;

    const urlParams = new URLSearchParams(window.location.search);
    let program = urlParams.get('program');
    if (program !== null) {

        if (demoPrograms.has(program))
            program = demoPrograms.get(program).program;

        vue.loadProgram(program, 'base64');
    }

};