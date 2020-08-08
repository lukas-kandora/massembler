'use strict';

Vue.component('command-list', {
    props: ['activeLineIndex'],
    template: `
<section class="command-list">
    <button class="line-add-button icon director" v-on:click="addLine(0)"></button>
    <div class="line-button-group-panel" v-for="(line, index) in lines" :key="line.id">
        <line-panel :class="index === activeLineIndex ? 'active' : ''" :line="line" ref="line-panel" v-on:remove-line="removeLine($event, index)" v-on:line-validated="invalidLineCount--" v-on:line-invalidated="invalidLineCount++" v-on:entries-invalidated="invalidEntryCount += $event" v-on:add-line="addLine(index + 1)" v-on:focus-prev="focusPrev(index)" v-on:focus-next="focusNext(index)" v-on:merge-to-prev="mergeToPrev(index)" v-on:merge-to-next="mergeToNext(index)" v-on:prepend-line="prependLine(index)" v-on:append-line="appendLine(index)"></line-panel>
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
            const lines = this.lines;
            lines.splice(index, 0, {
                id: Symbol(),
                indentation: index === 0 ? 0 : lines[index - 1].indentation,
                command: "",
                args: [],
                comment: "",
            });
            // with timeout because linePanel does not exist yet
            setTimeout(() => this.getLinePanel(index).focus({ caretPos: 'left' }));
        },
        prependLine: function (index) {
            const lines = this.lines;
            lines.splice(index, 0, {
                id: Symbol(),
                indentation: lines[index].indentation,
                command: "",
                args: [],
                comment: "",
            });
        },
        appendLine: function (index) {
            this.addLine(index + 1);
        },
        removeLine: function (event, index) {
            let retainIfFirst = false;
            let retainIfLast = false;
            let focusLine = 'next';
            if (event !== undefined) {
                if (event.hasOwnProperty('retainIfFirst')) {
                    retainIfFirst = event.retainIfFirst;
                }
                if (event.hasOwnProperty('retainIfLast')) {
                    retainIfLast = event.retainIfLast;
                }
                if (event.hasOwnProperty('focusLine')) {
                    focusLine = event.focusLine;
                }
            }

            const lines = this.lines;
            if ((!retainIfFirst || index !== 0) && (!retainIfLast || (index + 1) !== lines.length)) {
                switch (focusLine) {
                case 'prev':
                    if (index !== 0) {
                        this.getLinePanel(index - 1).focus({ caretPos: 'right' });
                    }
                    break;
                case 'next':
                    if ((index + 1) !== lines.length) {
                        this.getLinePanel(index + 1).focus({ caretPos: 'left' });
                    }
                    break;
                default:
                    console.log("Unknown focusLine:", focusLine);
                }
                lines.splice(index, 1);
            }
        },
        focusPrev: function(index) {
            if (index === 0)
                return;

            index--;
            this.getLinePanel(index).focus({ caretPos: 'right' });
        },
        focusNext: function(index) {
            index++;
            if (index === this.lines.length)
                return;

            this.getLinePanel(index).focus({ caretPos: 'left' });
        },
        mergeToPrev: function (index) {
            if (index === 0)
                return;
            
            const lines = this.lines;
            const prevLine = lines[index - 1];
            const line = lines[index];

            if (prevLine.command === "" && prevLine.comment === "") {
                lines.splice(index - 1, 1);
            } else if (prevLine.comment === "" && line.command == "") {
                prevLine.comment = line.comment;
                this.getLinePanel(index - 1).focus({ caretPos: 'right' });
                lines.splice(index, 1);
            } else if (line.command === "" && line.comment === "") {
                this.getLinePanel(index - 1).focus({ caretPos: 'right' });
                lines.splice(index, 1);
            }
        },
        mergeToNext: function (index) {
            const lines = this.lines;
            if ((index + 1) === lines.length)
                return;
                
            const line = lines[index];
            const nextLine = lines[index + 1];

            if (line.command === "" && line.comment === "") {
                this.getLinePanel(index + 1).focus({ caretPos: 'left' });
                lines.splice(index, 1);
            } else if (line.comment === "" && nextLine.command == "") {
                line.comment = nextLine.comment;
                lines.splice(index + 1, 1);
            } else if (nextLine.command === "" && nextLine.comment === "") {
                lines.splice(index + 1, 1);
            }
        },
        getLinePanel: function(index) {
            const linePanels = this.$refs['line-panel'];
            // ref-array is not sorted by index, so we need to take the line from
            // this.lines and search for the linePanel with said line.
            const line = this.lines[index];
            const linePanelIndex = linePanels.map(lp => lp.line).indexOf(line);
            return linePanels[linePanelIndex];
        },
    },
    mounted: function () {
        if (this.lines.length === 0)
            this.addLine(0);
    },
    beforeDestroy: function () {
        const invalidEntryCount = this.invalidEntryCount;
        if (invalidEntryCount !== 0)
            this.$emit('entries-invalidated', -invalidEntryCount);
        const invalidLineCount = this.invalidLineCount;
        if (invalidLineCount !== 0)
            this.$emit('lines-invalidated', -invalidLineCount);
    },
});