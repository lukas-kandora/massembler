'use strict';

Vue.component('line-panel', {
    props: ['line'],
    template: `
<div class="line-panel" :class="lineValid ? [] : ['invalid']">
    <div class="line-content-panel">
        <div class="indentation-panel">
            <button class="indentation-add-button icon director" v-on:click="line.indentation++"></button>
            <button class="indentation-button icon cross" v-for="index in line.indentation" v-on:click="line.indentation--"></button>
        </div>
        <div class="code-panel">
            <div class="command-panel code-input-panel" :class="commandValid ? [] : ['invalid']">
                <input type="text" class="command-input code-input" v-model="line.command" ref="command-input" list="command-datalist" :size="Math.max(1, line.command.length)" v-on:keydown.space="handleCommandSpace" v-on:keydown.backspace="handleCommandBackspace" v-on:keydown.delete="handleCommandDelete" v-on:keydown.enter="handleCommandEnter" v-on:keydown.arrow-left="handleCommandArrowLeft" v-on:keydown.arrow-right="handleCommandArrowRight">
            </div>
            <div class="args-panel" v-if="argTypesList !== null">
                <arg-panel v-for="(argTypes, index) in argTypesList" :key="index" v-model="line.args[index]" :arg-types="argTypes" ref="arg-panel" v-on:arg-validated="invalidEntryCount--" v-on:arg-invalidated="invalidEntryCount++" v-on:focus-prev="focusPrev($event, index)" v-on:focus-next-arg="focusNextArg($event, index)" v-on:append-line="appendLine(index)" v-on:merge-to-next="mergeToNext(index)"/>
            </div>
        </div>
        <label class="comment-panel">
            <input type="text" class="comment-input" v-model="line.comment" :size="line.comment.length == 0 ? 1 : 16" placeholder="">
        </label>
    </div>
    <button class="line-remove-button icon cross" v-on:click="$emit('remove-line')"></button>
</div>
`,
    data: function () {
        return {
            argStash: [],
            invalidEntryCount: 0,
        };
    },
    computed: {
        argTypesList: function () {
            const command = this.line.command;
            if (command === "")
                return [];
            const length = command.length;
            if (command.charAt(length - 1) === ':')
                return isLabel(command.substring(0, length - 1)) ? [] : null;
            const commandTemplate = commandTemplates.get(command);
            return commandTemplate === undefined ? null : commandTemplate.argTypesList;
        },
        commandValid: function () {
            return this.argTypesList !== null;
        },
        argsValid: function () {
            return this.invalidEntryCount === 0;
        },
        lineValid: function () {
            return this.commandValid && this.argsValid;
        }
    },
    watch: {
        invalidEntryCount: {
            handler: function (invalidEntryCount, old) {
                if (old === undefined)
                    old = 0;
                if (invalidEntryCount !== old)
                    this.$emit("entries-invalidated", invalidEntryCount - old);
            },
            immediate: true,
        },
        argTypesList: {
            handler: function (argTypesList) {
                const args = this.line.args;
                const oldArgCount = args.length;
                const newArgCount = argTypesList === null ? 0 : argTypesList.length;

                const delta = newArgCount - oldArgCount;
                if (delta < 0) {
                    const transfer = args.splice(newArgCount); // remove from args
                    this.argStash.splice(0, 0, ...transfer); // add to stash
                } else {
                    const transfer = this.argStash.splice(0, delta); // remove from stash
                    const transferLength = transfer.length;
                    transfer.splice(transferLength, 0, ...Array(delta - transferLength).fill("")); // add additional empty
                    args.splice(oldArgCount, 0, ...transfer); // add to args
                }
            },
            immediate: true,
        },
        commandValid: {
            handler: function (commandValid, old) {
                if (commandValid === false) {
                    this.$emit('entries-invalidated', 1);
                } else if (old !== undefined) { // check to not trigger on immediate
                    this.$emit('entries-invalidated', -1);
                }
            },
            immediate: true,
        },
        lineValid: {
            handler: function (lineValid, old) {
                if (lineValid === false) {
                    this.$emit('line-invalidated');
                } else if (old !== undefined) { // check to not trigger on immediate
                    this.$emit('line-validated');
                }
            },
            immediate: true,
        },
    },
    beforeDestroy: function () {
        const invalidEntryCount = this.invalidEntryCount;
        if (invalidEntryCount !== 0)
            this.$emit('entries-invalidated', -invalidEntryCount);
        if (this.lineValid === false) 
            this.$emit('line-validated');
    },
    methods: {
        handleCommandSpace: function (event) {
            event.preventDefault();

            const commandInput = this.$refs['command-input'];
            const selectionStart = commandInput.selectionStart;
            if (selectionStart !== commandInput.selectionEnd) {
                return;
            }

            if (selectionStart === 0) {
                this.line.indentation++;
            } else if (selectionStart === commandInput.value.length) {
                const argPanels = this.$refs['arg-panel'];
                if (argPanels !== undefined && argPanels.length > 0) {
                    argPanels[0].focusInput('select');
                }
            }
        },
        handleCommandBackspace: function (event) {
            const commandInput = this.$refs['command-input'];
            const selectionStart = commandInput.selectionStart;
            if (selectionStart !== commandInput.selectionEnd) {
                return;
            }

            if (selectionStart === 0) {
                const line = this.line;
                if (line.indentation !== 0) {
                    event.preventDefault();
                    line.indentation--;
                } else {
                    event.preventDefault();
                    this.$emit('merge-to-prev');
                }
                
                // else if (line.command === "" && line.comment === "") {
                //     event.preventDefault();
                //     this.$emit('remove-line', { retainIfFirst: true, focusLine: 'prev'});
                // }
            }
        },
        handleCommandDelete: function (event) {
            if (event.keyCode !== 46) {
                return; // needed because delete is also triggered on backspace
            }

            const commandInput = this.$refs['command-input'];
            const selectionStart = commandInput.selectionStart;
            if (selectionStart !== commandInput.selectionEnd) {
                return;
            }

            if (selectionStart === commandInput.value.length) {
                event.preventDefault();
                const argPanels = this.$refs['arg-panel'];
                if (argPanels === undefined || argPanels.length === 0) {
                    this.$emit('merge-to-next');
                }
            }
        },
        handleCommandEnter: function (event) {
            const commandInput = this.$refs['command-input'];
            const selectionStart = commandInput.selectionStart;
            if (selectionStart !== commandInput.selectionEnd) {
                return;
            }

            if (selectionStart === commandInput.value.length) {
                event.preventDefault(); // do this here to be consistent with args panels
                const argPanels = this.$refs['arg-panel'];
                if (argPanels === undefined || argPanels.length === 0) {
                    this.$emit('append-line');
                }
            } else if (selectionStart === 0) {
                event.preventDefault();
                this.$emit('prepend-line');
            }
        },
        handleCommandArrowLeft: function (event) {
            const commandInput = this.$refs['command-input'];
            const selectionStart = commandInput.selectionStart;
            if (selectionStart !== commandInput.selectionEnd) {
                return;
            }

            if (selectionStart == 0) {
                event.preventDefault();
                this.$emit('focus-prev');
            }
        },
        handleCommandArrowRight: function (event) {
            const commandInput = this.$refs['command-input'];
            const selectionStart = commandInput.selectionStart;
            if (selectionStart !== commandInput.selectionEnd) {
                return;
            }

            if (selectionStart === commandInput.value.length) {
                event.preventDefault(); // do this here to be consistent with args panels
                const argPanels = this.$refs['arg-panel'];
                if (argPanels === undefined || argPanels.length === 0) {
                    this.$emit('focus-next');
                } else {
                    argPanels[0].focusInput('left');
                }
            }
        },
        focusPrev: function (event, index) {
            const argPanels = this.$refs['arg-panel'];
            if (index === 0) {
                const commandInput = this.$refs['command-input'];
                commandInput.focus();
                switch (event) {
                case undefined:
                    break;
                case 'left':
                    commandInput.selectionStart = 0;
                    commandInput.selectionEnd = 0;
                    break;
                case 'right':
                    const length = commandInput.value.length;
                    commandInput.selectionStart = length;
                    commandInput.selectionEnd = length;
                    break;
                case 'select':
                    commandInput.selectionStart = 0;
                    commandInput.selectionEnd = commandInput.value.length;
                    break;
                default:
                    console.warn("Unknown caretPos:", caretPos);
                    break;
                }
            } else {
                argPanels[index - 1].focusInput(event);
            }
        },
        focusNextArg: function (event, index) {
            index++;
            const argPanels = this.$refs['arg-panel'];
            if (argPanels === undefined || index === argPanels.length) {
                this.$emit('focus-next', 'left'); // also gets triggered on comma-press in arg input
            } else {
                argPanels[index].focusInput(event);
            }
        },
        focus: function (event) {
            let caretPos = 'left';
            if (event !== undefined) {
                if (event.hasOwnProperty('caretPos')) {
                    caretPos = event.caretPos;
                }
            }

            switch (caretPos) {
            case 'left':
                const commandInput = this.$refs['command-input'];
                commandInput.focus();
                commandInput.selectionStart = 0;
                commandInput.selectionEnd = 0;
                break;
            case 'right':
                const argPanels = this.$refs['arg-panel'];
                if (argPanels === undefined || argPanels.length == 0) {
                    const commandInput = this.$refs['command-input'];
                    commandInput.focus();
                    const length = commandInput.value.length;
                    commandInput.selectionStart = length;
                    commandInput.selectionEnd = length;
                } else {
                    argPanels[argPanels.length - 1].focusInput('right');
                }
                break;
            default:
                console.warn("Unknown caretPos:", caretPos);
                break;
            }
        },
        appendLine: function (index) {
            const argPanels = this.$refs['arg-panel'];
            if (argPanels !== undefined && index + 1 === argPanels.length) {
                this.$emit('append-line');
            }
        },
        mergeToNext: function (index) {
            const argPanels = this.$refs['arg-panel'];
            if (argPanels !== undefined && index + 1 === argPanels.length) {
                this.$emit('merge-to-next');
            }
        }
    },
});