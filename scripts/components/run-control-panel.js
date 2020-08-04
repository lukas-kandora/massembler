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
    <button class="control-button reset-button icon reload" v-on:click="$emit('reset')"></button>
    <button class="control-button step-button icon skip" v-on:click="$emit('step')"></button>
    <div class="run-stop-panel">
        <button class="control-button stop-button icon block" v-on:click="$emit('stop')" :style="(stage !== 'stopped') ? '' : 'visibility: hidden;'"></button>
        <button class="control-button run-button icon fwd" v-on:click="$emit('run')" :style="(stage === 'stopped') ? '' : 'visibility: hidden;'"></button>
    </div>
</div>`,
});
