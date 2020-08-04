'use strict';

Vue.component('arg-panel', {
    props: ['value', 'argTypes'],
    template: `
<div class="arg-panel">
    <input type="text" class="arg-input code-input" :class="argValid ? [] : ['invalid']" :size="Math.max(1, value.length)" v-bind:value="value" v-on:input="$emit('input', $event.target.value)">
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
    }
});