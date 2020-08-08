Vue.component('manual-panel', {
    template: `
<section class="manual-panel">
    <h2 class="manual-headline">Reference</h2>
    <dl class="manual-definition-list">
        <template v-for="template in commandTemplates">
            <dt>{{ commandDef(template) }}</dt>
            <dd v-html="template.desc"></dd>
        </template>
        <dt>label-name:</dt>
        <dd>Defines a label to use as jump marker by other commands.</dd>
        <dt>; arbitrary comment</dt>
        <dd>Enter comments at the end of a line.</dd>
    </dl>
</section>`,
    computed: {
        commandTemplates: function () {
            return Array.from(commandTemplates.values());
        },
    },
    methods: {
        commandDef: function (commandTemplate) {
            const argNames = commandTemplate.argNames;
            const argsString = argNames.join(", ");

            return argNames.length === 0
                ? commandTemplate.name
                : commandTemplate.name + " " + argsString;
        }
    }
});