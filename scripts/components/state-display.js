'use strict';

Vue.component('state-display', {
    data : function () {
        return {
            lineIndexStack: [],
            cmpState: null,
            registers: {},
            stateInfo: null,
        };
    },
    template: `
<section class="state-display">
    <div class="line-stack-panel">
        <div class="placeholder-index-panel"></div>
        <div class="line-index-panel" v-for="lineIndex in lineIndexStack">{{ lineIndex + 1 }}</div>
    </div>
    <div class="cmp-state-panel">
        <div class="cmp-state-option less" :class="cmpState === 'less' ? ['active'] : []">&lt;</div>
        <div class="cmp-state-option equal" :class="cmpState === 'equal' ? ['active'] : []">=</div>
        <div class="cmp-state-option greater" :class="cmpState === 'greater' ? ['active'] : []">&gt;</div>
    </div>
    <div class="registers-panel">
        <div class="register-panel" v-for="registerName in registerNames">
            <div class="register-name-panel">{{ registerName }}:</div>
            <div class="register-value-panel">{{ registers[registerName] }}</div>
        </div>
    </div>
</section>`,
    computed: {
        registerNames: function () {
            return Array.from(registers);
        },
        activeLineIndex: function () {
            const lineIndexStack = this.lineIndexStack;
            const length = lineIndexStack.length;
            if (length === 0)
                return null;
            return lineIndexStack[length - 1];
        }
    },
    watch: {
        activeLineIndex: {
            handler: function (activeLineIndex, old) {
                if (activeLineIndex !== null || old !== undefined)
                    this.$emit('active-line-index', activeLineIndex);
            },
            immediate: true,
        }
    }
});