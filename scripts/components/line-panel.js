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
            <input type="text" class="command-input code-input" v-model="line.command" ref="command-input" list="command-datalist" :class="commandValid ? [] : ['invalid']" :size="Math.max(1, line.command.length)">
            <div class="args-panel" v-if="argTypesList !== null">
                <arg-panel v-for="(argTypes, index) in argTypesList" :key="index" v-model="line.args[index]" :arg-types="argTypes" v-on:arg-validated="invalidEntryCount--" v-on:arg-invalidated="invalidEntryCount++"/>
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
    mounted: function () {
        this.$refs['command-input'].focus();
    },
    beforeDestroy: function () {
        const invalidEntryCount = this.invalidEntryCount;
        if (invalidEntryCount !== 0)
            this.$emit("entries-invalidated", -invalidEntryCount);
        if (this.lineValid === false) 
            this.$emit('line-validated');
    },
});