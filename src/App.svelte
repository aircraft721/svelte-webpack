<script lang="ts">
    import AdyenDropin from './AdyenDropin.svelte'

    export let paymentMethodsConfiguration;

</script>

<div class="container">
    <AdyenDropin paymentMethodsConfiguration={paymentMethodsConfiguration} />
</div>

<style>
    .container {
        width: 50%;
    }
</style>
