'use strict';

Vue.component('arg-panel', {
    props: ['value', 'argTypes'],
    template: `
<div class="arg-panel code-input-panel" :class="argValid ? [] : ['invalid']">
    <input type="text" class="arg-input code-input" :size="Math.max(1, value.length)" v-bind:value="value" ref="arg-input" v-on:input="$emit('input', $event.target.value)" v-on:keydown="handleArgKeydown" v-on:keydown.space="$event.preventDefault()" v-on:keydown.enter="handleArgEnter" v-on:keydown.arrow-left="handleArgArrowLeft" v-on:keydown.arrow-right="handleArgArrowRight" v-on:keydown.backspace="handleArgBackspace" v-on:keydown.delete="handleArgDelete">
</div>
`,
    computed: {
        argValid: function () {
            const arg = this.value;
            const valid = this.argTypes.some(argType => argType.validator(arg) !== null);
            return valid;
        }
    },
    watch: {
        argValid: {
            handler: function (argValid, old) {
                if (argValid === false) {
                    this.$emit('arg-invalidated');
                } else if (old !== undefined) { // check to not trigger on immediate
                    this.$emit('arg-validated');
                }
            },
            immediate: true,
        }
    },
    beforeDestroy: function () {
        if (this.argValid === false) {
            this.$emit('arg-validated');
        }
    },
    methods: {
        focusInput: function (caretPos) {
            const argInput = this.$refs['arg-input'];
            argInput.focus();
            switch (caretPos) {
            case undefined:
                break;
            case 'left':
                argInput.selectionStart = 0;
                argInput.selectionEnd = 0;
                break;
            case 'right':
                const length = argInput.value.length;
                argInput.selectionStart = length;
                argInput.selectionEnd = length;
                break;
            case 'select':
                argInput.selectionStart = 0;
                argInput.selectionEnd = argInput.value.length;
                break;
            default:
                console.warn("Unknown caretPos:", caretPos);
                break;
            }
        },
        handleArgKeydown: function (event) {
            if (event.keyCode !== 188) {
                return;
            }

            event.preventDefault();

            const argInput = this.$refs['arg-input'];
            const selectionStart = argInput.selectionStart;
            if (selectionStart !== argInput.selectionEnd) {
                return;
            }

            if (selectionStart === argInput.value.length) {
                this.$emit('focus-next-arg', 'select');
            }
        },
        handleArgEnter: function (event) {
            const argInput = this.$refs['arg-input'];
            const selectionStart = argInput.selectionStart;
            if (selectionStart !== argInput.selectionEnd) {
                return;
            }

            if (selectionStart === argInput.value.length) {
                event.preventDefault();
                this.$emit('append-line');
            }
        },
        handleArgArrowLeft: function (event) {
            const argInput = this.$refs['arg-input'];
            const selectionStart = argInput.selectionStart;
            if (selectionStart !== argInput.selectionEnd) {
                return;
            }

            if (selectionStart === 0) {
                event.preventDefault();
                this.$emit('focus-prev', 'right');
            }

        },
        handleArgArrowRight: function (event) {
            const argInput = this.$refs['arg-input'];
            const selectionStart = argInput.selectionStart;
            if (selectionStart !== argInput.selectionEnd) {
                return;
            }

            if (selectionStart === argInput.value.length) {
                event.preventDefault();
                this.$emit('focus-next-arg', 'left');
            }
        },
        handleArgBackspace: function (event) {
            const argInput = this.$refs['arg-input'];
            const selectionStart = argInput.selectionStart;
            if (selectionStart !== argInput.selectionEnd) {
                return;
            }

            if (selectionStart === 0) {
                event.preventDefault();
                this.$emit('focus-prev', 'right');
            }
        },
        handleArgDelete: function (event) {
            if (event.keyCode !== 46) {
                return; // needed because delete is also triggered on backspace
            }

            const argInput = this.$refs['arg-input'];
            const selectionStart = argInput.selectionStart;
            if (selectionStart !== argInput.selectionEnd) {
                return;
            }

            if (selectionStart === argInput.value.length) {
                event.preventDefault();
                this.$emit('merge-to-next');
            }
        }
    },
});