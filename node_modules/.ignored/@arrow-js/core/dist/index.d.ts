/**
 * An arrow template one of the three primary ArrowJS utilities. Specifically,
 * templates are functions that return a function which mounts the template to
 * a given parent node. However, the template also has some other properties on
 * it like `.key` and `.isT`.
 *
 * The "magic" of an arrow template, is any expressions that are in the template
 * literal are automatically observed for changes. When a change is detected,
 * the bound attributes or textNodes are updated.
 */
interface ArrowTemplate {
    /**
     * Mounts the template to a given parent node.
     */
    (parent?: ParentNode): ParentNode;
    /**
     * A boolean flag that indicates this is indeed an ArrowTemplate.
     */
    isT: boolean;
    /**
     * Adds a key to this template to identify it as a unique instance.
     * @param key - A unique key that identifies this template instance (not index).
     * @returns
     */
    key: (key: ArrowTemplateKey) => ArrowTemplate;
    /**
     * Returns internal properties of the template, specifically the HTML and
     * expressions, as well as the key if applicable.
     * @returns
     */
    _h: () => [
        html: string,
        expressions: ReactiveFunction[],
        key: ArrowTemplateKey
    ];
    /**
     * The internal key property.
     */
    _k?: ArrowTemplateKey;
}
/**
 * The allowed values for arrow keys.
 */
type ArrowTemplateKey = string | number | undefined;
/**
 * Types of return values that can be rendered.
 */
type ArrowRenderable = string | number | ArrowTemplate | Array<string | number | ArrowTemplate>;
/**
 * A reactive function is a function that is bound to a template. It is the
 * higher order control around the expressions that are in the template literal.
 * It is responsible for updating the template when the expression changes.
 */
interface ReactiveFunction {
    (el?: Node): ArrowRenderable;
    (ev: Event, listener: EventListenerOrEventListenerObject): void;
    $on: (observer: CallableFunction) => void;
    _up: (newExpression: CallableFunction) => void;
    e: CallableFunction;
}
/**
 * A parent node is either an element or a document fragment — something that
 * can have elements appended to it.
 */
type ParentNode = Node | DocumentFragment;
/**
 * The template tagging function, used like: html`<div></div>`(mountEl)
 * @param  {TemplateStringsArray} strings
 * @param  {any[]} ...expressions
 * @returns ArrowTemplate
 */
declare function t(strings: TemplateStringsArray, ...expSlots: any[]): ArrowTemplate;

/**
 * Available types of keys for a reactive object.
 */
type DataSourceKey = string | number | symbol | null;
/**
 * Acceptable types of data targets for the reactive function.
 * TODO: Add much more robust typing for this using generics.
 */
interface DataSource {
    [index: string]: any;
    [index: number]: any;
}
/**
 * An callback for an observer.
 */
interface ObserverCallback {
    (value?: any, oldValue?: any): void;
}
/**
 * A controller interface for a reactive proxy object’s dependencies.
 */
interface DependencyProps {
    /**
     * Adds an observer to a given property.
     * @param p - The property to watch.
     * @param c - The callback to call when the property changes.
     * @returns
     */
    $on: (p: DataSourceKey, c: ObserverCallback) => void;
    /**
     * Removes an observer from a given property.
     * @param p - The property to stop watching.
     * @param c - The callback to stop calling when the property changes.
     * @returns
     */
    $off: (p: DataSourceKey, c: ObserverCallback) => void;
    /**
     * Emits an update "event" for the given property.
     * @param p - Property to emit that an update has occurred.
     * @param newValue - New value of the property.
     * @param oldValue - Old value of the property.
     * @returns
     */
    _em: (p: DataSourceKey, newValue: any, oldValue?: any) => void;
    /**
     * The internal state of the reactive proxy object.
     * @returns
     */
    _st: () => ReactiveProxyState;
    /**
     * The parent proxy object.
     * TODO: This concept should be removed in favor of a more robust dependency
     * tracking system via weakmap reference.
     */
    _p?: ReactiveProxyParent;
}
/**
 * A reactive proxy object.
 */
type ReactiveProxy<T> = {
    [K in keyof T]: T[K] extends DataSource ? ReactiveProxy<T[K]> : T[K];
} & DataSource & DependencyProps;
type ReactiveProxyParent = [
    property: DataSourceKey,
    parent: ReactiveProxy<DataSource>
];
interface ReactiveProxyState {
    o?: ReactiveProxyObservers;
    op?: ReactiveProxyPropertyObservers;
    r?: DataSource;
    p?: ReactiveProxyParent;
}
type ReactiveProxyObservers = Map<DataSourceKey, Set<ObserverCallback>>;
type ReactiveProxyPropertyObservers = Map<ObserverCallback, Set<DataSourceKey>>;
/**
 * Given a data object, often an object literal, return a proxy of that object
 * with mutation observers for each property.
 *
 * @param  {DataSource} data
 * @returns ReactiveProxy
 */
declare function r<T extends DataSource>(data: T, state?: ReactiveProxyState): ReactiveProxy<T>;
/**
 * Watch a function and track any reactive dependencies on it, re-calling it if
 * those dependencies are changed.
 * @param  {CallableFunction} fn
 * @param  {CallableFunction} after?
 * @returns unknown
 */
declare function w<T extends (...args: any[]) => unknown, F extends (...args: any[]) => any | undefined>(fn: T, after?: F): F extends undefined ? ReturnType<T> : ReturnType<F>;

/**
 * Adds the ability to listen to the next tick.
 * @param  {CallableFunction} fn?
 * @returns Promise
 */
declare function nextTick(fn?: CallableFunction): Promise<unknown>;
declare const measurements: Record<string, number[]>;

/**
 * html is an alias for t
 */
declare const html: typeof t;
/**
 * reactive is an alias for r
 */
declare const reactive: typeof r;
/**
 * watch is an alias for w
 */
declare const watch: typeof w;

export { ArrowTemplate, ReactiveProxy, html, measurements, nextTick, r, reactive, t, w, watch };
