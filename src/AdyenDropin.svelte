<script lang='ts'>
    import AdyenCheckout from '@adyen/adyen-web';
    import '@adyen/adyen-web/dist/adyen.css';
    import { onMount } from 'svelte';
    import { clientKey } from './constants';

    export let paymentMethodsConfiguration;
    
    const getPaymentMethods = async () => {
        const response = await fetch('http://localhost:8080/api/getPaymentMethods', {
            method: 'POST',
        })
        
        return response.json();
    };

    const createCheckout = (adyenResponse: any, paymentMethodsConfiguration: any) => { 
        const container = document.getElementById('dropin-container')
        const config = {
            clientKey,
            locale: "en-US",
            environment: "test",
            paymentMethodsConfiguration,
            paymentMethodsResponse: adyenResponse,
            // onSubmit,
            // onAdditionalDetails
        };

        const checkout = new AdyenCheckout(config);
        checkout.create('dropin').mount(container);
    };

    onMount(async () => { 
        getPaymentMethods()
            .then(response => {
                createCheckout(response, paymentMethodsConfiguration);
            })
    })
</script>
<div id="dropin-container"></div>
