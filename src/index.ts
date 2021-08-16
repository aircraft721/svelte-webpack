import App from "./App.svelte";
declare global {
    interface Window { MyComponent: any; }
}

const MyComponent = function (options) {
    return new App(options);
};

(window as any).loadSvelteElement = function (container, props) {
    new (MyComponent as any)({
        target: container,
        props
    });
}

