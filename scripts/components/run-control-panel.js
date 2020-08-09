'use strict';

Vue.component('run-control-panel', {
    props: ['stage'],
    data: function () {
        return {
            lineIndexStack: [],
            cmpState: null,
            registers: {},
        };
    },
    template: `
<div class="run-control-panel">
    <button class="control-button reset-button" v-on:click="$emit('reset')"><i class="fas fa-undo-alt"></i></button>
    <button class="control-button step-button" v-on:click="$emit('step')"><i class="fas fa-step-forward"></i></button>
    <div class="run-stop-panel">
        <button class="control-button stop-button" v-on:click="$emit('stop')" :style="(stage !== 'stopped') ? '' : 'visibility: hidden;'"><i class="fas fa-stop"></i></button>
        <button class="control-button run-button" v-on:click="$emit('run')" :style="(stage === 'stopped') ? '' : 'visibility: hidden;'"><i class="fas fa-forward"></i></button>
    </div>
</div>`,
});
