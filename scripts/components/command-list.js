'use strict';

Vue.component('command-list', {
    props: ['activeLineIndex'],
    template: `
<section class="command-list">
    <button class="line-add-button icon director" v-on:click="addLine(0)"></button>
    <div class="line-button-group-panel" v-for="(line, index) in lines" :key="line.id">
        <line-panel :class="index === activeLineIndex ? 'active' : ''" :line="line" v-on:remove-line="removeLine(index)" v-on:line-validated="invalidLineCount--" v-on:line-invalidated="invalidLineCount++" v-on:entries-invalidated="invalidEntryCount += $event"></line-panel>
        <button class="line-add-button icon director" v-on:click="addLine(index + 1)"></button>
    </div>
</section>
`,
    data: function () {
        return {
            lines: [],
            invalidEntryCount: 0,
            invalidLineCount: 0,
        };
    },
    watch: {
        invalidEntryCount: {
            handler: function (invalidEntryCount, old) {
                if (old === undefined)
                    old = 0;
                if (invalidEntryCount !== old)
                    this.$emit('entries-invalidated', invalidEntryCount - old);
            },
            immediate: true,
        },
        invalidLineCount: {
            handler: function (invalidLineCount, old) {
                if (old === undefined)
                    old = 0;
                if (invalidLineCount !== old)
                    this.$emit('lines-invalidated', invalidLineCount - old);
            },
            immediate: true,
        }
    },
    methods: {
        addLine: function (index) {
            this.lines.splice(index, 0, {
                id: Symbol(),
                indentation: 0,
                command: "",
                args: [],
                comment: "",
            });
        },
        removeLine: function (index) {
            this.lines.splice(index, 1);
        }
    },
    created: function () {
        if (this.lines.length === 0)
            this.addLine(0);
    },
    beforeDestroy: function () {
        const invalidEntryCount = this.invalidEntryCount;
        if (invalidEntryCount !== 0)
            this.$emit("entries-invalidated", -invalidEntryCount);
        const invalidLineCount = this.invalidLineCount;
        if (invalidLineCount !== 0)
            this.$emit("lines-invalidated", -invalidLineCount);
    },
});