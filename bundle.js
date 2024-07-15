const stylesheet$c = new CSSStyleSheet();
stylesheet$c.replaceSync(`@font-face {
  font-family: "lato";
  src: url(/data/lato.ttf) format("truetype");
}
* {
  --radius-tab-1100: .6em .6em 0 0;
  --radius-panel-0011: 0 0 .6em .6em;
  --padding-border-0110: 0 8px 8px 0;
  --radius-outer-0010: 0 0 20px 0;
  --radius-inner-0010: 0 0 12px 0;
  --radius-button-1111: .4em .4em .4em .4em;
  --radius-notice-1111: .8em .8em .8em .8em;
  --radius-field-1111: .2em .2em .2em .2em;
  --gap-medium: 0.9em;
  --gap-small: 0.6em;
  --gap-tiny: 0.3em;
  --font-size-header: 1.25em;
  --thin-border: 1px solid rgba(255,255,255,0.5);
  --thin-glass-border: 1px solid rgba(255,255,255,0.5);
  --thin-white-shadow: inset 0em -1px rgba(255,255,255,0.5);
  --floating-box-shadow: 0px 4px 16px 4px rgba(0,0,0,0.75);
  --glass-gradient: linear-gradient(
    to bottom, rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0)
  );
  --white-highlight: 
    inset 1.0px 1.0px 1.0px rgba(255, 255, 255, .75);
  --menu-font-size: 0.75em;
  --panel-font-size: 0.75em;
  --light-main-color: rgb(255, 247, 222);
  --light-focus-color: rgb(255, 255, 230);
  --dark-focus-shadow: rgb(22, 16, 0) 0 0 4px;
  --main-color-glass: rgba(40, 40, 140, 0.4);
  --dark-main-glass: rgba(16, 16, 101, 0.4);
  --dark-accept-color: rgb(0, 82, 68);
  --dark-reject-color: rgb(69, 28, 0);
  --white-glass: rgba(200,200,255, 0.1);
  --gray-glass: rgba(32,32,32, 0.4);
  --dark-glass: rgba(16,16,16, 0.4);
  --glass-filter: blur(32px);
}
.contents {
  display: contents;
}
.grid {
  display: grid;
}
.menu.grid {
  grid-auto-flow: column;
}
.start.grid {
  align-items: start;
}
.start.left.grid {
  align-items: start;
  justify-items: start;
}
.center.grid {
  align-items: center;
  justify-items: center;
}
.stretch.grid {
  align-items: stretch;
  justify-items: stretch;
}
.indent {
  padding-left: 1em;
}
button, input[type='submit'] {
	background: none;
	color: inherit;
	padding: 0;
	font: inherit;
	cursor: pointer;
  border: none;
}
.tab {
  box-shadow: var(--thin-white-shadow);
}
input.button, .button, .tab {
  border-top: var(--thin-glass-border);
  border-right: var(--thin-glass-border);
}
input.button, .button {
  border-radius: var(--radius-button-1111);
  border-bottom: var(--thin-glass-border);
  border-left: var(--thin-glass-border);
  padding-bottom: var(--gap-small);
  padding-top: var(--gap-small);
}
.tab {
  border-radius: var(--radius-tab-1100);
  padding-bottom: var(--gap-medium);
  padding-top: var(--gap-medium);
}
`);

/**
 * A queue of expressions to run as soon as an async slot opens up.
 */
const queueStack = new Set();
/**
 * A stack of functions to run on the next tick.
 */
const nextTicks = new Set();
function isTpl(template) {
    return typeof template === 'function' && !!template.isT;
}
function isR(obj) {
    return (typeof obj === 'object' &&
        obj !== null &&
        '$on' in obj &&
        typeof obj.$on === 'function');
}
/**
 * Utility that ensures we only attempt to make reactive objects that _can_ be made reactive.
 *
 * Examples of objects that cause issues: NodeList, HTMLElement
 * @see {@link https://github.com/vuejs/core/blob/8998afa42755cbdb3403cd6c0fe158980da8492c/packages/reactivity/src/reactive.ts#L43-L62}
 */
// export function canReactiveWrap(maybeObj: any): boolean {
//   return ['Object', 'Array'].includes(
//     // from https://github.com/vuejs/core/blob/8998afa42755cbdb3403cd6c0fe158980da8492c/packages/shared/src/general.ts#L64-L67
//     // extracts "Type" from "[object Type]"
//     Object.prototype.toString.call(maybeObj).slice(8, -1)
//   )
// }
function isReactiveFunction(fn) {
    return '$on' in fn;
}
/**
 * Queue an item to execute after all synchronous functions have been run. This
 * is used for `w()` to ensure multiple dependency mutations tracked on the
 * same expression do not result in multiple calls.
 * @param  {CallableFunction} fn
 * @returns ObserverCallback
 */
function queue(fn) {
    return (newValue, oldValue) => {
        function executeQueue() {
            // copy the current queues and clear it to allow new items to be added
            // during the execution of the current queue.
            const queue = Array.from(queueStack);
            queueStack.clear();
            const ticks = Array.from(nextTicks);
            nextTicks.clear();
            queue.forEach((fn) => fn(newValue, oldValue));
            ticks.forEach((fn) => fn());
            if (queueStack.size) {
                // we received new items while executing the queue, so we need to
                // execute the queue again.
                queueMicrotask(executeQueue);
            }
        }
        if (!queueStack.size) {
            queueMicrotask(executeQueue);
        }
        queueStack.add(fn);
    };
}
const measurements = {};
/**
 * A simple benchmarking function.
 * @param label - A label for the measurement
 * @param fn - A function to measure or a number to record
 * @returns
 */
function measure(label, fn) {
    const start = performance.now();
    const isFn = typeof fn === 'function';
    label = isFn ? `${label} (ms)` : `${label} (calls)`;
    const x = isFn ? fn() : fn;
    const result = isFn ? performance.now() - start : fn;
    if (!measurements[label])
        measurements[label] = [result];
    else
        measurements[label].push(result);
    return x;
}

/**
 * A "global" dependency tracker object.
 */
const dependencyCollector = new Map();
/**
 * Given a data object, often an object literal, return a proxy of that object
 * with mutation observers for each property.
 *
 * @param  {DataSource} data
 * @returns ReactiveProxy
 */
function r$4(data, state = {}) {
    // If this is already reactive, a non object, or an object than shouldn't be made reactive just return it.
    if (isR(data) || typeof data !== 'object')
        return data;
    // This is the observer registry itself, with properties as keys and callbacks as watchers.
    const observers = state.o || new Map();
    // This is a reverse map of observers with callbacks as keys and properties that callback is watching as values.
    const observerProperties = state.op || new Map();
    // If the data is an array, we should know...but only once.
    const isArray = Array.isArray(data);
    const children = [];
    const proxySource = isArray ? [] : Object.create(data, {});
    for (const property in data) {
        const entry = data[property];
        if (typeof entry === 'object' && entry !== null) {
            proxySource[property] = !isR(entry) ? r$4(entry) : entry;
            children.push(property);
        }
        else {
            proxySource[property] = entry;
        }
    }
    // The add/remove dependency function(s)
    const dep = (a) => (p, c) => {
        let obs = observers.get(p);
        let props = observerProperties.get(c);
        if (!obs) {
            obs = new Set();
            observers.set(p, obs);
        }
        if (!props) {
            props = new Set();
            observerProperties.set(c, props);
        }
        obs[a](c);
        props[a](p);
    };
    // Add a property listener
    const $on = dep('add');
    // Remove a property listener
    const $off = dep('delete');
    // Emit a property mutation event by calling all sub-dependencies.
    const _em = (property, newValue, oldValue) => {
        observers.has(property) &&
            observers.get(property).forEach((c) => c(newValue, oldValue));
    };
    /**
     * Return the reactive proxy state data.
     */
    const _st = () => {
        return {
            o: observers,
            op: observerProperties,
            r: proxySource,
            p: proxy._p,
        };
    };
    // These are the internal properties of all `r()` objects.
    const depProps = {
        $on,
        $off,
        _em,
        _st,
        _p: undefined,
    };
    // Create the actual proxy object itself.
    const proxy = new Proxy(proxySource, {
        has(target, key) {
            return key in depProps || key in target;
        },
        get(...args) {
            const [, p] = args;
            // For properties of the DependencyProps type, return their values from
            // the depProps instead of the target.
            if (Reflect.has(depProps, p))
                return Reflect.get(depProps, p);
            const value = Reflect.get(...args);
            // For any existing dependency collectors that are active, add this
            // property to their observed properties.
            addDep(proxy, p);
            // We have special handling of array operations to prevent O(n^2) issues.
            if (isArray && p in Array.prototype) {
                return arrayOperation(p, proxySource, proxy, value);
            }
            return value;
        },
        set(...args) {
            const [target, property, value] = args;
            const old = Reflect.get(target, property);
            if (Reflect.has(depProps, property)) {
                // We are setting a reserved property like _p
                return Reflect.set(depProps, property, value);
            }
            if (value && isR(old)) {
                const o = old;
                // We're assigning an object (array or pojo probably), so we want to be
                // reactive, but if we already have a reactive object in this
                // property, then we need to replace it and transfer the state of deps.
                const oldState = o._st();
                const newR = isR(value) ? reactiveMerge(value, o) : r$4(value, oldState);
                Reflect.set(target, property, 
                // Create a new reactive object
                newR);
                _em(property, newR);
                oldState.o.forEach((_c, property) => {
                    const oldValue = Reflect.get(old, property);
                    const newValue = Reflect.get(newR, property);
                    if (oldValue !== newValue) {
                        o._em(property, newValue, oldValue);
                    }
                });
                return true;
            }
            const didSet = Reflect.set(...args);
            if (didSet) {
                if (old !== value) {
                    // Notify any discrete property observers of the change.
                    _em(property, value, old);
                }
                if (proxy._p) {
                    // Notify parent observers of a change.
                    proxy._p[1]._em(...proxy._p);
                }
            }
            return didSet;
        },
    });
    if (state.p)
        proxy._p = state.p;
    // Before we return the proxy object, quickly map through the children
    // and set the parents (this is only run on the initial setup).
    children.map((c) => {
        proxy[c]._p = [c, proxy];
    });
    return proxy;
}
/**
 * Add a property to the tracked reactive properties.
 * @param  {ReactiveProxy} proxy
 * @param  {DataSourceKey} property
 */
function addDep(proxy, property) {
    dependencyCollector.forEach((tracker) => {
        let properties = tracker.get(proxy);
        if (!properties) {
            properties = new Set();
            tracker.set(proxy, properties);
        }
        properties.add(property);
    });
}
function arrayOperation(op, arr, proxy, native) {
    const synthetic = (...args) => {
        // The `as DataSource` here should really be the ArrayPrototype, but we're
        // just tricking the compiler since we've already checked it.
        const retVal = Array.prototype[op].call(arr, ...args);
        // @todo determine how to handle notifying elements and parents of elements.
        arr.forEach((item, i) => proxy._em(String(i), item));
        // Notify the the parent of changes.
        if (proxy._p) {
            const [property, parent] = proxy._p;
            parent._em(property, proxy);
        }
        return retVal;
    };
    switch (op) {
        case 'shift':
        case 'pop':
        case 'sort':
        case 'reverse':
        case 'copyWithin':
            return synthetic;
        case 'unshift':
        case 'push':
        case 'fill':
            return (...args) => synthetic(...args.map((arg) => r$4(arg)));
        case 'splice':
            return function (start, remove, ...inserts) {
                // Preserve the argument count when there's only one argument,
                // because if a second argument is passed but undefined,
                // it gets treated as 0.
                return arguments.length === 1
                    ? synthetic(start)
                    : synthetic(start, remove, ...inserts.map((arg) => r$4(arg)));
            };
        default:
            return native;
    }
}
/**
 * Given two reactive proxies, merge the important state attributes from the
 * source into the target.
 * @param  {ReactiveProxy} reactiveTarget
 * @param  {ReactiveProxy} reactiveSource
 * @returns ReactiveProxy
 */
function reactiveMerge(reactiveTarget, reactiveSource) {
    const state = reactiveSource._st();
    if (state.o) {
        state.o.forEach((callbacks, property) => {
            callbacks.forEach((c) => {
                reactiveTarget.$on(property, c);
            });
        });
    }
    if (state.p) {
        reactiveTarget._p = state.p;
    }
    return reactiveTarget;
}
/**
 * Watch a function and track any reactive dependencies on it, re-calling it if
 * those dependencies are changed.
 * @param  {CallableFunction} fn
 * @param  {CallableFunction} after?
 * @returns unknown
 */
function w$1(fn, after) {
    const trackingId = Symbol();
    if (!dependencyCollector.has(trackingId)) {
        dependencyCollector.set(trackingId, new Map());
    }
    let currentDeps = new Map();
    const queuedCallFn = queue(callFn);
    function callFn() {
        dependencyCollector.set(trackingId, new Map());
        const value = fn();
        const newDeps = dependencyCollector.get(trackingId);
        dependencyCollector.delete(trackingId);
        // Disable existing properties
        currentDeps.forEach((propertiesToUnobserve, proxy) => {
            const newProperties = newDeps.get(proxy);
            if (newProperties) {
                newProperties.forEach((prop) => propertiesToUnobserve.delete(prop));
            }
            propertiesToUnobserve.forEach((prop) => proxy.$off(prop, queuedCallFn));
        });
        // Start observing new properties.
        newDeps.forEach((properties, proxy) => {
            properties.forEach((prop) => proxy.$on(prop, queuedCallFn));
        });
        currentDeps = newDeps;
        return after ? after(value) : value;
    }
    // If this is a reactive function, then when the expression is updated, re-run
    if (isReactiveFunction(fn))
        fn.$on(callFn);
    return callFn();
}

/**
 * Event listeners that were bound by arrow and should be cleaned up should the
 * given node be garbage collected.
 */
const listeners = new WeakMap();
/**
 * A list of HTML templates to a HTMLTemplate element that contains instances
 * of each. This acts as a cache.
 */
const templateMemo = {};
/**
 * The delimiter that describes where expressions are located.
 */
const delimiter = '➳❍';
const bookend = '❍⇚';
const delimiterComment = `<!--${delimiter}-->`;
const bookendComment = `<!--${bookend}-->`;
/**
 * The template tagging function, used like: html`<div></div>`(mountEl)
 * @param  {TemplateStringsArray} strings
 * @param  {any[]} ...expressions
 * @returns ArrowTemplate
 */
function t$2(strings, ...expSlots) {
    const expressions = [];
    let str = '';
    const addExpressions = (expression, html) => {
        if (typeof expression === 'function') {
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            let observer = () => { };
            expressions.push(Object.assign((...args) => expression(...args), {
                e: expression,
                $on: (obs) => {
                    observer = obs;
                },
                _up: (exp) => {
                    expression = exp;
                    observer();
                },
            }));
            return html + delimiterComment;
        }
        if (Array.isArray(expression)) {
            return expression.reduce((html, exp) => addExpressions(exp, html), html);
        }
        return html + expression;
    };
    const toString = () => {
        if (!str) {
            if (!expSlots.length && strings.length === 1 && strings[0] === '') {
                str = '<!---->';
            }
            else {
                str = strings.reduce(function interlaceTemplate(html, strVal, i) {
                    html += strVal;
                    return expSlots[i] !== undefined
                        ? addExpressions(expSlots[i], html)
                        : html;
                }, '');
            }
        }
        return str;
    };
    const template = (el) => {
        const dom = createNodes(toString());
        const frag = fragment(dom, { i: 0, e: expressions });
        return el ? frag(el) : frag();
    };
    // If the template contains no expressions, it is 100% static so it's key
    // its own content
    template.isT = true;
    template._k = 0;
    template._h = () => [toString(), expressions, template._k];
    template.key = (key) => {
        template._k = key;
        return template;
    };
    return template;
}
/**
 * @param  {NodeList} dom
 * @param  {ReactiveExpressions} tokens
 * @param  {ReactiveProxy} data?
 */
function fragment(dom, expressions) {
    let node;
    let i = 0;
    const children = dom.childNodes;
    while ((node = children.item(i++))) {
        // Delimiters in the body are found inside comments.
        if (node.nodeType === 8 && node.nodeValue === delimiter) {
            // We are dealing with a reactive node.
            comment(node, expressions);
            continue;
        }
        // Bind attributes, add events, and push onto the fragment.
        if (node instanceof Element)
            attrs(node, expressions);
        if (node.hasChildNodes()) {
            fragment(node, expressions);
        }
        // Select lists "default" selections get out of wack when being moved around
        // inside fragments, this resets them.
        if (node instanceof HTMLOptionElement)
            node.selected = node.defaultSelected;
    }
    return ((parent) => {
        if (parent) {
            parent.appendChild(dom);
            return parent;
        }
        return dom;
    });
}
/**
 * Given a node, parse for meaningful expressions.
 * @param  {Element} node
 * @returns void
 */
function attrs(node, expressions) {
    var _a;
    const toRemove = [];
    let i = 0;
    let attr;
    while ((attr = node.attributes[i++])) {
        if (expressions.i >= expressions.e.length)
            return;
        if (attr.value !== delimiterComment)
            continue;
        let attrName = attr.name;
        const expression = expressions.e[expressions.i++];
        if (attrName.charAt(0) === '@') {
            const event = attrName.substring(1);
            node.addEventListener(event, expression);
            if (!listeners.has(node))
                listeners.set(node, new Map());
            (_a = listeners.get(node)) === null || _a === void 0 ? void 0 : _a.set(event, expression);
            toRemove.push(attrName);
        }
        else {
            // Logic to determine if this is an IDL attribute or a content attribute
            const isIDL = (attrName === 'value' && 'value' in node) ||
                attrName === 'checked' ||
                (attrName.startsWith('.') && (attrName = attrName.substring(1)));
            w$1(expression, (value) => {
                if (isIDL) {
                    // Handle all IDL attributes, TS won’t like this since it is not
                    // fully aware of the type we are operating on, but JavaScript is
                    // perfectly fine with it, so we need to ignore TS here.
                    // @ts-ignore:next-line
                    node[attrName] = value;
                    // Explicitly set the "value" to false remove the attribute. However
                    // we need to be sure this is not a "Reflected" attribute, so we check
                    // the current value of the attribute to make sure it is not the same
                    // as the value we just set. If it is the same, it must be reflected.
                    // so removing the attribute would remove the idl we just set.
                    if (node.getAttribute(attrName) != value)
                        value = false;
                }
                // Set a standard content attribute.
                value !== false
                    ? node.setAttribute(attrName, value)
                    : (node.removeAttribute(attrName), i--);
            });
        }
    }
    toRemove.forEach((attrName) => node.removeAttribute(attrName));
}
/**
 * Removes DOM nodes from the dom and cleans up any attached listeners.
 * @param node - A DOM element to remove
 */
function removeNodes(node) {
    node.forEach(removeNode);
}
/**
 * Removes the node from the dom and cleans up any attached listeners.
 * @param node - A DOM element to remove
 */
function removeNode(node) {
    var _a;
    node.remove();
    (_a = listeners
        .get(node)) === null || _a === void 0 ? void 0 : _a.forEach((listener, event) => node.removeEventListener(event, listener));
}
/**
 * Given a textNode, parse the node for expressions and return a fragment.
 * @param  {Node} node
 * @param  {ReactiveProxy} data
 * @param  {ReactiveExpressions} tokens
 * @returns DocumentFragment
 */
function comment(node, expressions) {
    var _a;
    // At this point, we know we're dealing with some kind of reactive token fn
    const expression = expressions.e[expressions.i++];
    let boundNode;
    if (expression && isTpl(expression.e)) {
        // If the expression is an html`` (ArrowTemplate), then call it with data
        // and then call the ArrowTemplate with no parent, so we get the nodes.
        boundNode = createPartial().add(expression.e)();
    }
    else {
        // This is where the *actual* reactivity takes place:
        let partialMemo;
        boundNode = (partialMemo = w$1(expression, (value) => setNode(value, partialMemo)))();
    }
    (_a = node.parentNode) === null || _a === void 0 ? void 0 : _a.replaceChild(boundNode, node);
}
/**
 * Set the value of a given node.
 * @param  {Node} n
 * @param  {any} value
 * @param  {ReactiveProxy} data
 * @returns Node
 */
function setNode(value, p) {
    const isUpdate = typeof p === 'function';
    const partial = isUpdate ? p : createPartial();
    Array.isArray(value)
        ? value.forEach((item) => measure('partialAdd', () => partial.add(item)))
        : partial.add(value);
    if (isUpdate)
        partial._up();
    return partial;
}
/**
 * Given an HTML string, produce actual DOM elements.
 * @param html - a string of html
 * @returns
 */
function createNodes(html) {
    var _a;
    const tpl = (_a = templateMemo[html]) !== null && _a !== void 0 ? _a : (() => {
        const tpl = document.createElement('template');
        tpl.innerHTML = html;
        return (templateMemo[html] = tpl);
    })();
    const dom = tpl.content.cloneNode(true);
    dom.normalize(); // textNodes are automatically split somewhere around 65kb, this joins them back together.
    return dom;
}
/**
 * Template partials are stateful functions that perform a fragment render when
 * called, but also have function properties like ._up() which attempts to only
 * perform a patch of the previously rendered nodes.
 * @returns TemplatePartial
 */
function createPartial(group = Symbol()) {
    let html = '';
    let expressions = { i: 0, e: [] };
    let chunks = [];
    let previousChunks = [];
    const keyedChunks = new Map();
    const toRemove = [];
    /**
     * This is the actual document partial function.
     */
    const partial = () => {
        let dom;
        if (!chunks.length)
            addPlaceholderChunk();
        if (chunks.length === 1 && !isTpl(chunks[0].tpl)) {
            // In this case we have only a textNode to render, so we can just return
            // the text node with the proper value applied.
            const chunk = chunks[0];
            chunk.dom.length
                ? (chunk.dom[0].nodeValue = chunk.tpl)
                : chunk.dom.push(document.createTextNode(chunk.tpl));
            dom = chunk.dom[0];
        }
        else {
            dom = assignDomChunks(fragment(createNodes(html), expressions)());
        }
        reset();
        return dom;
    };
    partial.ch = () => previousChunks;
    partial.l = 0;
    partial.add = (tpl) => {
        if (!tpl && tpl !== 0)
            return partial;
        // If the tpl is a string or a number it means the result should be a
        // textNode — in that case we do *not* want to generate any DOM nodes for it
        // so here we want to ensure that `html` is just ''.
        let localExpressions = [];
        let key;
        let template = '';
        if (isTpl(tpl)) {
            [template, localExpressions, key] = tpl._h();
        }
        html += template;
        html += bookendComment;
        const keyedChunk = key && keyedChunks.get(key);
        const chunk = keyedChunk || {
            html: template,
            exp: localExpressions,
            dom: [],
            tpl,
            key,
        };
        chunks.push(chunk);
        if (key) {
            // Since this is a keyed chunk, we need to either add it to the
            // keyedChunks map, or we need to update the expressions in that chunk.
            keyedChunk
                ? keyedChunk.exp.forEach((exp, i) => exp._up(localExpressions[i].e))
                : keyedChunks.set(key, chunk);
        }
        expressions.e.push(...localExpressions);
        partial.l++;
        return partial;
    };
    partial._up = () => {
        const subPartial = createPartial(group);
        let startChunking = 0;
        let lastNode = previousChunks[0].dom[0];
        // If this is an empty update, we need to "placehold" its spot in the dom
        // with an empty placeholder chunk.
        if (!chunks.length)
            addPlaceholderChunk(document.createComment(''));
        const closeSubPartial = () => {
            if (!subPartial.l)
                return;
            const frag = subPartial();
            const last = frag.lastChild;
            lastNode[startChunking ? 'after' : 'before'](frag);
            transferChunks(subPartial, chunks, startChunking);
            lastNode = last;
        };
        chunks.forEach((chunk, index) => {
            // There are a few things that can happen in here:
            // 1. We match a key and output previously rendered nodes.
            // 2. We use a previous rendered dom, and swap the expression.
            // 3. The actual HTML chunk is changed/new so we need to remove the nodes.
            // 4. We render totally new nodes using a partial.
            const prev = previousChunks[index];
            if (chunk.key && chunk.dom.length) {
                closeSubPartial();
                // This is a keyed dom chunk that has already been rendered.
                if (!prev || prev.dom !== chunk.dom) {
                    lastNode[index ? 'after' : 'before'](...chunk.dom);
                }
                lastNode = chunk.dom[chunk.dom.length - 1];
                // Note: we don't need to update keyed chunks expressions here because
                // it is done in partial.add as soon as a keyed chunk is added to the
                // partial.
            }
            else if (prev && chunk.html === prev.html && !prev.key) {
                // We can reuse the DOM node, and need to swap the expressions. First
                // close out any partial chunks. Then "upgrade" the expressions.
                closeSubPartial();
                prev.exp.forEach((expression, i) => expression._up(chunk.exp[i].e));
                // We always want to reference the root expressions as long as the
                // chunks remain equivalent, so here we explicitly point the new chunk's
                // expression set to the original chunk expression set — which was just
                // updated with the new expression's "values".
                chunk.exp = prev.exp;
                chunk.dom = prev.dom;
                lastNode = chunk.dom[chunk.dom.length - 1];
                if (isTextNodeChunk(chunk) && lastNode instanceof Text) {
                    lastNode.nodeValue = chunk.tpl;
                }
            }
            else {
                if (prev && chunk.html !== prev.html && !prev.key) {
                    // The previous chunk in this position has changed its underlying html
                    // this happens when someone is using non-reactive values in the
                    // template. We need to remove the previous nodes.
                    toRemove.push(...prev.dom);
                }
                // Ok, now we're building some new DOM up y'all, let the chunking begin!
                if (!subPartial.l)
                    startChunking = index;
                subPartial.add(chunk.tpl);
            }
        });
        closeSubPartial();
        let node = lastNode === null || lastNode === void 0 ? void 0 : lastNode.nextSibling;
        while (node && group in node) {
            toRemove.push(node);
            const next = node.nextSibling;
            node = next;
        }
        removeNodes(toRemove);
        reset();
    };
    // What follows are internal "methods" for each partial.
    const reset = () => {
        toRemove.length = 0;
        html = '';
        partial.l = 0;
        expressions = { i: 0, e: [] };
        previousChunks = [...chunks];
        chunks = [];
    };
    const addPlaceholderChunk = (node) => {
        html = '<!---->';
        chunks.push({
            html,
            exp: [],
            dom: node ? [node] : [],
            tpl: t$2 `${html}`,
            key: 0,
        });
    };
    /**
     * Walks through the document fragment and assigns the nodes to the correct
     * DOM chunk. Chunks of DOM are divided by the bookend comment.
     * @param frag - A document fragment that has been created from a partial
     * @returns
     */
    const assignDomChunks = (frag) => {
        let chunkIndex = 0;
        const toRemove = [];
        frag.childNodes.forEach((node) => {
            if (node.nodeType === 8 && node.data === bookend) {
                chunkIndex++;
                // Remove the comment
                toRemove.push(node);
                return;
            }
            Object.defineProperty(node, group, { value: group });
            chunks[chunkIndex].dom.push(node);
        });
        toRemove.forEach((node) => node.remove());
        return frag;
    };
    const transferChunks = (partialA, chunksB, chunkIndex) => {
        partialA.ch().forEach((chunk, index) => {
            chunksB[chunkIndex + index].dom = chunk.dom;
        });
    };
    return partial;
}
/**
 * Checks if a given chunk is a textNode chunk.
 * @param chunk - A partial chunk
 * @returns
 */
function isTextNodeChunk(chunk) {
    return chunk.dom.length === 1 && !isTpl(chunk.tpl);
}

/**
 * html is an alias for t
 */
const html$1 = t$2;
/**
 * reactive is an alias for r
 */
const reactive = r$4;

const mergeTemplates = (templates1, templates2) => {
  const center = [
    templates1.pop() , templates2.shift()
  ].filter(x => x).join('');
  return [...templates1, center, ...templates2];
};

const addAttributes = (
    tag, templates_in, values_in, attributes={}
) => {
  const values = (
      Object.values(attributes).concat(values_in)
  );
  const att_list = Object.keys(attributes).reduce(
    ([...att_list], att) => mergeTemplates(
      att_list, [` ${att}="`, '"']
    ), [`<${tag}`]
  );
  const templates_out = mergeTemplates(
    mergeTemplates(att_list, ['>']),
    mergeTemplates(templates_in, [`</${tag}>`])
  );
  return [ templates_out, ...values ];
};

const toElement = (tag) => {
  return ([...templates_in], ...values_in) => {
    return (attributes) => {
      return html$1(...addAttributes(
        tag, templates_in, values_in, attributes 
      ));
    }
  }
};

/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const t$1=globalThis,e$2=t$1.ShadowRoot&&(void 0===t$1.ShadyCSS||t$1.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,s$2=Symbol(),o$2=new WeakMap;let n$2 = class n{constructor(t,e,o){if(this._$cssResult$=!0,o!==s$2)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e;}get styleSheet(){let t=this.o;const s=this.t;if(e$2&&void 0===t){const e=void 0!==s&&1===s.length;e&&(t=o$2.get(s)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),e&&o$2.set(s,t));}return t}toString(){return this.cssText}};const r$3=t=>new n$2("string"==typeof t?t:t+"",void 0,s$2),i$2=(t,...e)=>{const o=1===t.length?t[0]:e.reduce(((e,s,o)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(s)+t[o+1]),t[0]);return new n$2(o,t,s$2)},S$1=(s,o)=>{if(e$2)s.adoptedStyleSheets=o.map((t=>t instanceof CSSStyleSheet?t:t.styleSheet));else for(const e of o){const o=document.createElement("style"),n=t$1.litNonce;void 0!==n&&o.setAttribute("nonce",n),o.textContent=e.cssText,s.appendChild(o);}},c$2=e$2?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const s of t.cssRules)e+=s.cssText;return r$3(e)})(t):t;

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const{is:i$1,defineProperty:e$1,getOwnPropertyDescriptor:r$2,getOwnPropertyNames:h$1,getOwnPropertySymbols:o$1,getPrototypeOf:n$1}=Object,a$1=globalThis,c$1=a$1.trustedTypes,l$1=c$1?c$1.emptyScript:"",p$1=a$1.reactiveElementPolyfillSupport,d$1=(t,s)=>t,u$1={toAttribute(t,s){switch(s){case Boolean:t=t?l$1:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t);}return t},fromAttribute(t,s){let i=t;switch(s){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t);}catch(t){i=null;}}return i}},f$1=(t,s)=>!i$1(t,s),y$1={attribute:!0,type:String,converter:u$1,reflect:!1,hasChanged:f$1};Symbol.metadata??=Symbol("metadata"),a$1.litPropertyMetadata??=new WeakMap;let b$1 = class b extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t);}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,s=y$1){if(s.state&&(s.attribute=!1),this._$Ei(),this.elementProperties.set(t,s),!s.noAccessor){const i=Symbol(),r=this.getPropertyDescriptor(t,i,s);void 0!==r&&e$1(this.prototype,t,r);}}static getPropertyDescriptor(t,s,i){const{get:e,set:h}=r$2(this.prototype,t)??{get(){return this[s]},set(t){this[s]=t;}};return {get(){return e?.call(this)},set(s){const r=e?.call(this);h.call(this,s),this.requestUpdate(t,r,i);},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??y$1}static _$Ei(){if(this.hasOwnProperty(d$1("elementProperties")))return;const t=n$1(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties);}static finalize(){if(this.hasOwnProperty(d$1("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(d$1("properties"))){const t=this.properties,s=[...h$1(t),...o$1(t)];for(const i of s)this.createProperty(i,t[i]);}const t=this[Symbol.metadata];if(null!==t){const s=litPropertyMetadata.get(t);if(void 0!==s)for(const[t,i]of s)this.elementProperties.set(t,i);}this._$Eh=new Map;for(const[t,s]of this.elementProperties){const i=this._$Eu(t,s);void 0!==i&&this._$Eh.set(i,t);}this.elementStyles=this.finalizeStyles(this.styles);}static finalizeStyles(s){const i=[];if(Array.isArray(s)){const e=new Set(s.flat(1/0).reverse());for(const s of e)i.unshift(c$2(s));}else void 0!==s&&i.push(c$2(s));return i}static _$Eu(t,s){const i=s.attribute;return !1===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev();}_$Ev(){this._$ES=new Promise((t=>this.enableUpdating=t)),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach((t=>t(this)));}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.();}removeController(t){this._$EO?.delete(t);}_$E_(){const t=new Map,s=this.constructor.elementProperties;for(const i of s.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t);}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return S$1(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach((t=>t.hostConnected?.()));}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach((t=>t.hostDisconnected?.()));}attributeChangedCallback(t,s,i){this._$AK(t,i);}_$EC(t,s){const i=this.constructor.elementProperties.get(t),e=this.constructor._$Eu(t,i);if(void 0!==e&&!0===i.reflect){const r=(void 0!==i.converter?.toAttribute?i.converter:u$1).toAttribute(s,i.type);this._$Em=t,null==r?this.removeAttribute(e):this.setAttribute(e,r),this._$Em=null;}}_$AK(t,s){const i=this.constructor,e=i._$Eh.get(t);if(void 0!==e&&this._$Em!==e){const t=i.getPropertyOptions(e),r="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:u$1;this._$Em=e,this[e]=r.fromAttribute(s,t.type),this._$Em=null;}}requestUpdate(t,s,i){if(void 0!==t){if(i??=this.constructor.getPropertyOptions(t),!(i.hasChanged??f$1)(this[t],s))return;this.P(t,s,i);}!1===this.isUpdatePending&&(this._$ES=this._$ET());}P(t,s,i){this._$AL.has(t)||this._$AL.set(t,s),!0===i.reflect&&this._$Em!==t&&(this._$Ej??=new Set).add(t);}async _$ET(){this.isUpdatePending=!0;try{await this._$ES;}catch(t){Promise.reject(t);}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,s]of this._$Ep)this[t]=s;this._$Ep=void 0;}const t=this.constructor.elementProperties;if(t.size>0)for(const[s,i]of t)!0!==i.wrapped||this._$AL.has(s)||void 0===this[s]||this.P(s,this[s],i);}let t=!1;const s=this._$AL;try{t=this.shouldUpdate(s),t?(this.willUpdate(s),this._$EO?.forEach((t=>t.hostUpdate?.())),this.update(s)):this._$EU();}catch(s){throw t=!1,this._$EU(),s}t&&this._$AE(s);}willUpdate(t){}_$AE(t){this._$EO?.forEach((t=>t.hostUpdated?.())),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t);}_$EU(){this._$AL=new Map,this.isUpdatePending=!1;}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return !0}update(t){this._$Ej&&=this._$Ej.forEach((t=>this._$EC(t,this[t]))),this._$EU();}updated(t){}firstUpdated(t){}};b$1.elementStyles=[],b$1.shadowRootOptions={mode:"open"},b$1[d$1("elementProperties")]=new Map,b$1[d$1("finalized")]=new Map,p$1?.({ReactiveElement:b$1}),(a$1.reactiveElementVersions??=[]).push("2.0.4");

const convertToAttribute = (properties, k, v) => {
  const v_type = (properties?.get(k))?.type || String;
  return u$1.toAttribute(v, v_type);
};

const convertFromAttribute = (properties, k, v_att) => {
  const v_type = (properties?.get(k))?.type || String;
  return u$1.fromAttribute(v_att, v_type);
};

const createReactiveState = (options, closure=null) => {
  const { defaults={}, constants={} } = options;
  return new Proxy(reactive(defaults), {
    set(target, key, value) {
      if (key in defaults) {
        Reflect.set(target, key, value);
      }
      else if (closure) {
        Reflect.set(closure, key, value);
      }
      return true;
    },
    get(target, key, receiver) {
      if (key in constants) {
        return Reflect.get(constants, key);
      }
      if (key in defaults) {
        return Reflect.get(target, key);
      }
      if (closure) {
        return Reflect.get(closure, key);
      }
      return undefined;
    }
  });
};

function updateAttribute(k, v_att) {
  this.__reflectingProperty = k;
  if (v_att == null) {
    return this.removeAttribute(k);
  }
  this.setAttribute(k, v_att);
  this.__reflectingProperty = null;
}

function addStyles(globalStyleSheet) {
  const shadow = this.shadowRoot;
  shadow.adoptedStyleSheets = [
    ...shadow.adoptedStyleSheets,
    this.constructor._styleSheet,
    globalStyleSheet
  ].filter(x => x);
  return shadow;
}

/**
* Adds element to customElements registry, defining any reactive state.
*
* This function creates web components with reactive ArrowJS state. It accepts
* ArrowJS components that contain an elementTemplate property or Lit components
* that define a render() function.
* 
* These components can access their state from the elementState property,
* and they can define subcomponents using their own defineElement method.
* The subcomponents can read/write any reactive state of their parents.
*
* @param {function} element            Class that extends HTMLElement.
* @param {object}   options            Attributes and parameters.
* @param {object}   options.defaults   Default values for reactive parameters.
* @param {object}   options.constants  Constant values for constant parameters.
* @param {array}    options.attributes Parameter names used in HTML attributes.
*
* @return {string}  Name of new HTMLElement in customElements registry.
*/
function defineElement(element, options={}) {
  const { 
    globalStyleSheet, customSuffix, closure
  } = this;
  return (el => {
    const tag = `${element.name.toLowerCase()}-${customSuffix}`;
    if (!customElements.get(tag)) customElements.define(tag, el);
    return tag;
  })(class extends element {
    static name = element.name
    static elementProperties = element.elementProperties
    static observedAttributes = [...new Set([
      ...(element.observedAttributes || []),
      ...(options.attributes || [])
    ])]
    constructor() {
      super();
      this._reactiveState = createReactiveState(options, closure);
      for ( let k in this._reactiveState ) {
        const init_v = convertFromAttribute(
          this.constructor.elementProperties, k, this.getAttribute(k)
        );
        if (init_v !== null) {
          this.elementState[k] = init_v;
        }
        else {
          this.elementState[k] = this._reactiveState[k];
        }
      }
      if (this.elementTemplate) {
        // For elements that don't use Lit
        this.attachShadow({mode: 'open'});
        html$1`${this.elementTemplate}`(
          addStyles.call(this, globalStyleSheet)
        );
      }
      else if (this.shadowRoot) {
        addStyles.call(this, globalStyleSheet);
      }
    }
    get defineElement() {
      return defineElement.bind({
        globalStyleSheet, customSuffix,
        closure: this._reactiveState
      })
    }
    get elementState() {
      if (!this._reactiveState) {
        return new Proxy({}, {
          get: () => undefined, set: () => true
        });
      }
      return new Proxy(this._reactiveState, {
        get: (target, k) => target[k],
        set: (target, k, v) => {
          target[k] = v;
          if (this.constructor.observedAttributes.includes(k)) {
            const v_att = convertToAttribute(
              this.constructor.elementProperties, k, v
            );
            updateAttribute.call(this, k, v_att);
            // Support Lit Element rendering
            if (this.requestUpdate) {
              this.requestUpdate();
            }
          }
          return true;
        }
      })
    }
    render() {
      // Support Lit Element rendering
      const rendered = super.render();
      addStyles.call(this, globalStyleSheet);
      return rendered;
    }
    attributeChangedCallback(k, old_v, v) {
      if (super.attributeChangedCallback) {
        super.attributeChangedCallback(k, old_v, v);
      }
      else if (this.__reflectingProperty != k) {
        this.elementState[k] = convertFromAttribute(
          this.constructor.elementProperties, k, v
        );
      }
    }
  });
}

/**
* Allows configuration of defineElement function.
*
*
* @param {string}   customSuffix       Suffix of all defined components.
* @param {object}   globals            Attributes and parameters.
* @param {object}   globals.styleSheet Global CSS styles.
* @param {object}   globals.defaults   Default values for reactive parameters.
* @param {object}   globals.constants  Constant values for constant parameters.
* @param {array}    globals.attributes Parameter names used in HTML attributes.
*
* @return {function} The defineElement function that has been configured.
*/
const toElementState = ( customSuffix, globals={} ) => {
  return defineElement.bind({
    closure: createReactiveState(globals), customSuffix,
    globalStyleSheet: globals.styleSheet
  });
};

const stylesheet$b = new CSSStyleSheet();
stylesheet$b.replaceSync(`.root.grid {
  font-family: "lato",sans-serif;
  color: var(--light-main-color);
  top: 0;
  overflow: hidden;
  max-height: 100dvh;
  position: absolute;
  grid-template-columns: auto 1fr;
  grid-template-rows: 100dvh auto;
  > .grid {
    grid-column: 1;
    grid-row: 1;
  }
  .notice {
    grid-column: 1 / -1;
    grid-row: 1 / -1;
  }
  img {
    grid-column: 1 / -1;
    grid-row: 1 / -1;
  }
}
.panel.inner {
  border-radius: var(--radius-inner-0010);
  background: var(--gray-glass);
}
.panel.outer {
  border-radius: var(--radius-outer-0010);
  backdrop-filter: var(--glass-filter);
  background-color: var(--dark-main-glass);
  border: var(--thin-glass-border);
}
`);

const stylesheet$a = new CSSStyleSheet();
stylesheet$a.replaceSync(`:host {
  transition: transform 0.5s ease 0s;
  width: 30em;
  .wrapper {
    padding: var(--padding-border-0110);
    grid-template-rows: auto auto 1fr;
    grid-template-columns: 1fr;
    pointer-events: all;
    * {
      grid-column: 1;
    }
    .inner.grid {
      grid-row: 3;
      background-color: var(--gray-glass);
      align-self: stretch;
      border-top: none;
    }
    .dialog[open='true'] {
      grid-row: 2 / 4;
      height: 100%;
    }
    > .icon {
      grid-row: 1;
      align-self: start;
      justify-self: end;
      transform: translate(3em, .3em);
    }
    > .icon[expanded='true'] {
      transform: translate(0, .3em);
    }
  }
}

:host([expanded='true']) {
  .wrapper {
    overflow: hidden;
    .inner.grid {
      overflow: hidden;
    }
  }
}

:host(:not([expanded='true'])) {
  transform: translate(-27em, 0);
  .wrapper {
    transform: translate(-3em, 0);
    .icon {
      grid-row: 1 / 4;
      height: 100%;
    }
  }
}
`);

const stylesheet$9 = new CSSStyleSheet();
stylesheet$9.replaceSync(`.wrapper.grid {
  overflow: scroll;
  font-size: var(--panel-font-size);
  grid-template-rows: auto 1fr;
  padding: var(--gap-tiny);
  border: var(--thin-border);
  border-image: var(--glass-gradient) 1 100%;
}
.end {
  border-bottom: var(--thin-glass-border);
  border-radius: var(--radius-panel-0011);
}
.end[expanded] {
  border-radius: 0;
}
`);

const stylesheet$8 = new CSSStyleSheet();
stylesheet$8.replaceSync(`:host {
  --a11y-collapse-horizontal-padding: var(--gap-small);
  --a11y-collapse-padding-bottom: var(--gap-medium);
  --a11y-collapse-padding-top: 0px;
  --a11y-collapse-disabled-heading-color: inherit;
  --a11y-collapse-heading-color: inherit; 
  --a11y-collapse-border-between: none;
  --simple-icon-color: inherit;
  font-family: inherit;
  border: none;
  margin: 0;
  simple-icon-lite#expand {
    border: var(--thin-glass-border);
    background-color: var(--dark-main-glass);
    transition: transform 0.25s ease 0s;
    padding: var(--gap-tiny);
    margin: var(--gap-tiny);
    border-radius: 50%;
  }
  button {
    border-radius: var(--radius-tab-1100);
    font-size: var(--font-size-header);
    border: var(--thin-glass-border);
    border-bottom: none;
    font-family: inherit;
    cursor: pointer;
    color: inherit;
  }
  div#content {
    border-top: none;
    transition: transform 0s ease 0s;
    border: var(--thin-glass-border);
    border-image: var(--glass-gradient) 1 100%;
  }
}
`);

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const t=globalThis,i=t.trustedTypes,s$1=i?i.createPolicy("lit-html",{createHTML:t=>t}):void 0,e="$lit$",h=`lit$${Math.random().toFixed(9).slice(2)}$`,o="?"+h,n=`<${o}>`,r$1=document,l=()=>r$1.createComment(""),c=t=>null===t||"object"!=typeof t&&"function"!=typeof t,a=Array.isArray,u=t=>a(t)||"function"==typeof t?.[Symbol.iterator],d="[ \t\n\f\r]",f=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,v=/-->/g,_=/>/g,m=RegExp(`>|${d}(?:([^\\s"'>=/]+)(${d}*=${d}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),p=/'/g,g=/"/g,$=/^(?:script|style|textarea|title)$/i,y=t=>(i,...s)=>({_$litType$:t,strings:i,values:s}),x=y(1),b=y(2),w=Symbol.for("lit-noChange"),T=Symbol.for("lit-nothing"),A=new WeakMap,E=r$1.createTreeWalker(r$1,129);function C(t,i){if(!Array.isArray(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==s$1?s$1.createHTML(i):i}const P=(t,i)=>{const s=t.length-1,o=[];let r,l=2===i?"<svg>":"",c=f;for(let i=0;i<s;i++){const s=t[i];let a,u,d=-1,y=0;for(;y<s.length&&(c.lastIndex=y,u=c.exec(s),null!==u);)y=c.lastIndex,c===f?"!--"===u[1]?c=v:void 0!==u[1]?c=_:void 0!==u[2]?($.test(u[2])&&(r=RegExp("</"+u[2],"g")),c=m):void 0!==u[3]&&(c=m):c===m?">"===u[0]?(c=r??f,d=-1):void 0===u[1]?d=-2:(d=c.lastIndex-u[2].length,a=u[1],c=void 0===u[3]?m:'"'===u[3]?g:p):c===g||c===p?c=m:c===v||c===_?c=f:(c=m,r=void 0);const x=c===m&&t[i+1].startsWith("/>")?" ":"";l+=c===f?s+n:d>=0?(o.push(a),s.slice(0,d)+e+s.slice(d)+h+x):s+h+(-2===d?i:x);}return [C(t,l+(t[s]||"<?>")+(2===i?"</svg>":"")),o]};class V{constructor({strings:t,_$litType$:s},n){let r;this.parts=[];let c=0,a=0;const u=t.length-1,d=this.parts,[f,v]=P(t,s);if(this.el=V.createElement(f,n),E.currentNode=this.el.content,2===s){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes);}for(;null!==(r=E.nextNode())&&d.length<u;){if(1===r.nodeType){if(r.hasAttributes())for(const t of r.getAttributeNames())if(t.endsWith(e)){const i=v[a++],s=r.getAttribute(t).split(h),e=/([.?@])?(.*)/.exec(i);d.push({type:1,index:c,name:e[2],strings:s,ctor:"."===e[1]?k:"?"===e[1]?H:"@"===e[1]?I:R}),r.removeAttribute(t);}else t.startsWith(h)&&(d.push({type:6,index:c}),r.removeAttribute(t));if($.test(r.tagName)){const t=r.textContent.split(h),s=t.length-1;if(s>0){r.textContent=i?i.emptyScript:"";for(let i=0;i<s;i++)r.append(t[i],l()),E.nextNode(),d.push({type:2,index:++c});r.append(t[s],l());}}}else if(8===r.nodeType)if(r.data===o)d.push({type:2,index:c});else {let t=-1;for(;-1!==(t=r.data.indexOf(h,t+1));)d.push({type:7,index:c}),t+=h.length-1;}c++;}}static createElement(t,i){const s=r$1.createElement("template");return s.innerHTML=t,s}}function N(t,i,s=t,e){if(i===w)return i;let h=void 0!==e?s._$Co?.[e]:s._$Cl;const o=c(i)?void 0:i._$litDirective$;return h?.constructor!==o&&(h?._$AO?.(!1),void 0===o?h=void 0:(h=new o(t),h._$AT(t,s,e)),void 0!==e?(s._$Co??=[])[e]=h:s._$Cl=h),void 0!==h&&(i=N(t,h._$AS(t,i.values),h,e)),i}class S{constructor(t,i){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=i;}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:i},parts:s}=this._$AD,e=(t?.creationScope??r$1).importNode(i,!0);E.currentNode=e;let h=E.nextNode(),o=0,n=0,l=s[0];for(;void 0!==l;){if(o===l.index){let i;2===l.type?i=new M(h,h.nextSibling,this,t):1===l.type?i=new l.ctor(h,l.name,l.strings,this,t):6===l.type&&(i=new L(h,this,t)),this._$AV.push(i),l=s[++n];}o!==l?.index&&(h=E.nextNode(),o++);}return E.currentNode=r$1,e}p(t){let i=0;for(const s of this._$AV)void 0!==s&&(void 0!==s.strings?(s._$AI(t,s,i),i+=s.strings.length-2):s._$AI(t[i])),i++;}}class M{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,i,s,e){this.type=2,this._$AH=T,this._$AN=void 0,this._$AA=t,this._$AB=i,this._$AM=s,this.options=e,this._$Cv=e?.isConnected??!0;}get parentNode(){let t=this._$AA.parentNode;const i=this._$AM;return void 0!==i&&11===t?.nodeType&&(t=i.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,i=this){t=N(this,t,i),c(t)?t===T||null==t||""===t?(this._$AH!==T&&this._$AR(),this._$AH=T):t!==this._$AH&&t!==w&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):u(t)?this.k(t):this._(t);}S(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.S(t));}_(t){this._$AH!==T&&c(this._$AH)?this._$AA.nextSibling.data=t:this.T(r$1.createTextNode(t)),this._$AH=t;}$(t){const{values:i,_$litType$:s}=t,e="number"==typeof s?this._$AC(t):(void 0===s.el&&(s.el=V.createElement(C(s.h,s.h[0]),this.options)),s);if(this._$AH?._$AD===e)this._$AH.p(i);else {const t=new S(e,this),s=t.u(this.options);t.p(i),this.T(s),this._$AH=t;}}_$AC(t){let i=A.get(t.strings);return void 0===i&&A.set(t.strings,i=new V(t)),i}k(t){a(this._$AH)||(this._$AH=[],this._$AR());const i=this._$AH;let s,e=0;for(const h of t)e===i.length?i.push(s=new M(this.S(l()),this.S(l()),this,this.options)):s=i[e],s._$AI(h),e++;e<i.length&&(this._$AR(s&&s._$AB.nextSibling,e),i.length=e);}_$AR(t=this._$AA.nextSibling,i){for(this._$AP?.(!1,!0,i);t&&t!==this._$AB;){const i=t.nextSibling;t.remove(),t=i;}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t));}}class R{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,i,s,e,h){this.type=1,this._$AH=T,this._$AN=void 0,this.element=t,this.name=i,this._$AM=e,this.options=h,s.length>2||""!==s[0]||""!==s[1]?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=T;}_$AI(t,i=this,s,e){const h=this.strings;let o=!1;if(void 0===h)t=N(this,t,i,0),o=!c(t)||t!==this._$AH&&t!==w,o&&(this._$AH=t);else {const e=t;let n,r;for(t=h[0],n=0;n<h.length-1;n++)r=N(this,e[s+n],i,n),r===w&&(r=this._$AH[n]),o||=!c(r)||r!==this._$AH[n],r===T?t=T:t!==T&&(t+=(r??"")+h[n+1]),this._$AH[n]=r;}o&&!e&&this.j(t);}j(t){t===T?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"");}}class k extends R{constructor(){super(...arguments),this.type=3;}j(t){this.element[this.name]=t===T?void 0:t;}}class H extends R{constructor(){super(...arguments),this.type=4;}j(t){this.element.toggleAttribute(this.name,!!t&&t!==T);}}class I extends R{constructor(t,i,s,e,h){super(t,i,s,e,h),this.type=5;}_$AI(t,i=this){if((t=N(this,t,i,0)??T)===w)return;const s=this._$AH,e=t===T&&s!==T||t.capture!==s.capture||t.once!==s.once||t.passive!==s.passive,h=t!==T&&(s===T||e);e&&this.element.removeEventListener(this.name,this,s),h&&this.element.addEventListener(this.name,this,t),this._$AH=t;}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t);}}class L{constructor(t,i,s){this.element=t,this.type=6,this._$AN=void 0,this._$AM=i,this.options=s;}get _$AU(){return this._$AM._$AU}_$AI(t){N(this,t);}}const Z=t.litHtmlPolyfillSupport;Z?.(V,M),(t.litHtmlVersions??=[]).push("3.1.4");const j=(t,i,s)=>{const e=s?.renderBefore??i;let h=e._$litPart$;if(void 0===h){const t=s?.renderBefore??null;e._$litPart$=h=new M(i.insertBefore(l(),t),t,void 0,s??{});}return h._$AI(t),h};

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */class s extends b$1{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0;}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const i=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=j(i,this.renderRoot,this.renderOptions);}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0);}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1);}render(){return w}}s._$litElement$=!0,s[("finalized")]=!0,globalThis.litElementHydrateSupport?.({LitElement:s});const r=globalThis.litElementPolyfillSupport;r?.({LitElement:s});(globalThis.litElementVersions??=[]).push("4.0.6");

/**
 * Copyright 2018 The Pennsylvania State University
 * @license Apache-2.0, see License.md for full text.
 *
 * `simple-colors-shared-styles`
 * @element simple-colors-shared-styles
 * a shared set of styles for `simple-colors`
 *
 *

 * @demo ./demo/index.html
 */

globalThis.SimpleColorsSharedStyles = {};
globalThis.SimpleColorsSharedStyles.instance = null;

class SimpleColorsSharedStyles extends s {
  //styles function
  static get styles() {
    return [
      i$2`
        html {
          --simple-colors-default-theme-accent-1: #ffffff;
          --simple-colors-default-theme-accent-2: #eeeeee;
          --simple-colors-default-theme-accent-3: #dddddd;
          --simple-colors-default-theme-accent-4: #cccccc;
          --simple-colors-default-theme-accent-5: #bbbbbb;
          --simple-colors-default-theme-accent-6: #999999;
          --simple-colors-default-theme-accent-7: #666666;
          --simple-colors-default-theme-accent-8: #444444;
          --simple-colors-default-theme-accent-9: #333333;
          --simple-colors-default-theme-accent-10: #222222;
          --simple-colors-default-theme-accent-11: #111111;
          --simple-colors-default-theme-accent-12: #000000;

          --simple-colors-default-theme-grey-1: #ffffff;
          --simple-colors-default-theme-grey-2: #eeeeee;
          --simple-colors-default-theme-grey-3: #dddddd;
          --simple-colors-default-theme-grey-4: #cccccc;
          --simple-colors-default-theme-grey-5: #bbbbbb;
          --simple-colors-default-theme-grey-6: #999999;
          --simple-colors-default-theme-grey-7: #666666;
          --simple-colors-default-theme-grey-8: #444444;
          --simple-colors-default-theme-grey-9: #333333;
          --simple-colors-default-theme-grey-10: #222222;
          --simple-colors-default-theme-grey-11: #111111;
          --simple-colors-default-theme-grey-12: #000000;

          --simple-colors-default-theme-red-1: #ffdddd;
          --simple-colors-default-theme-red-2: #ffaeae;
          --simple-colors-default-theme-red-3: #ff8f8f;
          --simple-colors-default-theme-red-4: #ff7474;
          --simple-colors-default-theme-red-5: #fd5151;
          --simple-colors-default-theme-red-6: #ff2222;
          --simple-colors-default-theme-red-7: #ee0000;
          --simple-colors-default-theme-red-8: #ac0000;
          --simple-colors-default-theme-red-9: #850000;
          --simple-colors-default-theme-red-10: #670000;
          --simple-colors-default-theme-red-11: #520000;
          --simple-colors-default-theme-red-12: #3f0000;

          --simple-colors-default-theme-pink-1: #ffe6f1;
          --simple-colors-default-theme-pink-2: #ffa5cf;
          --simple-colors-default-theme-pink-3: #ff87c0;
          --simple-colors-default-theme-pink-4: #ff73b5;
          --simple-colors-default-theme-pink-5: #fd60aa;
          --simple-colors-default-theme-pink-6: #ff3996;
          --simple-colors-default-theme-pink-7: #da004e;
          --simple-colors-default-theme-pink-8: #b80042;
          --simple-colors-default-theme-pink-9: #980036;
          --simple-colors-default-theme-pink-10: #78002b;
          --simple-colors-default-theme-pink-11: #5a0020;
          --simple-colors-default-theme-pink-12: #440019;

          --simple-colors-default-theme-purple-1: #fce6ff;
          --simple-colors-default-theme-purple-2: #f4affd;
          --simple-colors-default-theme-purple-3: #f394ff;
          --simple-colors-default-theme-purple-4: #f07cff;
          --simple-colors-default-theme-purple-5: #ed61ff;
          --simple-colors-default-theme-purple-6: #e200ff;
          --simple-colors-default-theme-purple-7: #a500ba;
          --simple-colors-default-theme-purple-8: #8a009b;
          --simple-colors-default-theme-purple-9: #6c0079;
          --simple-colors-default-theme-purple-10: #490052;
          --simple-colors-default-theme-purple-11: #33003a;
          --simple-colors-default-theme-purple-12: #200025;

          --simple-colors-default-theme-deep-purple-1: #f3e4ff;
          --simple-colors-default-theme-deep-purple-2: #ddacff;
          --simple-colors-default-theme-deep-purple-3: #c97eff;
          --simple-colors-default-theme-deep-purple-4: #bb63f9;
          --simple-colors-default-theme-deep-purple-5: #b44aff;
          --simple-colors-default-theme-deep-purple-6: #a931ff;
          --simple-colors-default-theme-deep-purple-7: #7e00d8;
          --simple-colors-default-theme-deep-purple-8: #5d009f;
          --simple-colors-default-theme-deep-purple-9: #4c0081;
          --simple-colors-default-theme-deep-purple-10: #3a0063;
          --simple-colors-default-theme-deep-purple-11: #2a0049;
          --simple-colors-default-theme-deep-purple-12: #1d0033;

          --simple-colors-default-theme-indigo-1: #e5ddff;
          --simple-colors-default-theme-indigo-2: #c3b2ff;
          --simple-colors-default-theme-indigo-3: #af97ff;
          --simple-colors-default-theme-indigo-4: #9e82ff;
          --simple-colors-default-theme-indigo-5: #9373ff;
          --simple-colors-default-theme-indigo-6: #835fff;
          --simple-colors-default-theme-indigo-7: #3a00ff;
          --simple-colors-default-theme-indigo-8: #2801b0;
          --simple-colors-default-theme-indigo-9: #20008c;
          --simple-colors-default-theme-indigo-10: #160063;
          --simple-colors-default-theme-indigo-11: #100049;
          --simple-colors-default-theme-indigo-12: #0a0030;

          --simple-colors-default-theme-blue-1: #e2ecff;
          --simple-colors-default-theme-blue-2: #acc9ff;
          --simple-colors-default-theme-blue-3: #95baff;
          --simple-colors-default-theme-blue-4: #74a5ff;
          --simple-colors-default-theme-blue-5: #5892fd;
          --simple-colors-default-theme-blue-6: #4083ff;
          --simple-colors-default-theme-blue-7: #0059ff;
          --simple-colors-default-theme-blue-8: #0041bb;
          --simple-colors-default-theme-blue-9: #003494;
          --simple-colors-default-theme-blue-10: #002569;
          --simple-colors-default-theme-blue-11: #001947;
          --simple-colors-default-theme-blue-12: #001333;

          --simple-colors-default-theme-light-blue-1: #cde8ff;
          --simple-colors-default-theme-light-blue-2: #a1d1ff;
          --simple-colors-default-theme-light-blue-3: #92c9ff;
          --simple-colors-default-theme-light-blue-4: #65b3ff;
          --simple-colors-default-theme-light-blue-5: #58adff;
          --simple-colors-default-theme-light-blue-6: #41a1ff;
          --simple-colors-default-theme-light-blue-7: #007ffc;
          --simple-colors-default-theme-light-blue-8: #0066ca;
          --simple-colors-default-theme-light-blue-9: #0055a8;
          --simple-colors-default-theme-light-blue-10: #003f7d;
          --simple-colors-default-theme-light-blue-11: #002850;
          --simple-colors-default-theme-light-blue-12: #001b36;

          --simple-colors-default-theme-cyan-1: #ccf3fd;
          --simple-colors-default-theme-cyan-2: #9beaff;
          --simple-colors-default-theme-cyan-3: #77e2ff;
          --simple-colors-default-theme-cyan-4: #33d4ff;
          --simple-colors-default-theme-cyan-5: #1ccfff;
          --simple-colors-default-theme-cyan-6: #00c9ff;
          --simple-colors-default-theme-cyan-7: #009dc7;
          --simple-colors-default-theme-cyan-8: #007999;
          --simple-colors-default-theme-cyan-9: #005970;
          --simple-colors-default-theme-cyan-10: #003f50;
          --simple-colors-default-theme-cyan-11: #002c38;
          --simple-colors-default-theme-cyan-12: #001a20;

          --simple-colors-default-theme-teal-1: #d4ffee;
          --simple-colors-default-theme-teal-2: #98ffd7;
          --simple-colors-default-theme-teal-3: #79ffcb;
          --simple-colors-default-theme-teal-4: #56ffbd;
          --simple-colors-default-theme-teal-5: #29ffac;
          --simple-colors-default-theme-teal-6: #00ff9c;
          --simple-colors-default-theme-teal-7: #009d75;
          --simple-colors-default-theme-teal-8: #007658;
          --simple-colors-default-theme-teal-9: #004e3a;
          --simple-colors-default-theme-teal-10: #003829;
          --simple-colors-default-theme-teal-11: #002a20;
          --simple-colors-default-theme-teal-12: #001b14;

          --simple-colors-default-theme-green-1: #e1ffeb;
          --simple-colors-default-theme-green-2: #acffc9;
          --simple-colors-default-theme-green-3: #79ffa7;
          --simple-colors-default-theme-green-4: #49ff88;
          --simple-colors-default-theme-green-5: #24ff70;
          --simple-colors-default-theme-green-6: #00f961;
          --simple-colors-default-theme-green-7: #008c37;
          --simple-colors-default-theme-green-8: #00762e;
          --simple-colors-default-theme-green-9: #005a23;
          --simple-colors-default-theme-green-10: #003d18;
          --simple-colors-default-theme-green-11: #002a11;
          --simple-colors-default-theme-green-12: #001d0c;

          --simple-colors-default-theme-light-green-1: #ebffdb;
          --simple-colors-default-theme-light-green-2: #c7ff9b;
          --simple-colors-default-theme-light-green-3: #b1ff75;
          --simple-colors-default-theme-light-green-4: #a1fd5a;
          --simple-colors-default-theme-light-green-5: #8efd38;
          --simple-colors-default-theme-light-green-6: #6fff00;
          --simple-colors-default-theme-light-green-7: #429d00;
          --simple-colors-default-theme-light-green-8: #357f00;
          --simple-colors-default-theme-light-green-9: #296100;
          --simple-colors-default-theme-light-green-10: #1b3f00;
          --simple-colors-default-theme-light-green-11: #143000;
          --simple-colors-default-theme-light-green-12: #0d2000;

          --simple-colors-default-theme-lime-1: #f1ffd2;
          --simple-colors-default-theme-lime-2: #dfff9b;
          --simple-colors-default-theme-lime-3: #d4ff77;
          --simple-colors-default-theme-lime-4: #caff58;
          --simple-colors-default-theme-lime-5: #bdff2d;
          --simple-colors-default-theme-lime-6: #aeff00;
          --simple-colors-default-theme-lime-7: #649900;
          --simple-colors-default-theme-lime-8: #4d7600;
          --simple-colors-default-theme-lime-9: #3b5a00;
          --simple-colors-default-theme-lime-10: #293f00;
          --simple-colors-default-theme-lime-11: #223400;
          --simple-colors-default-theme-lime-12: #182400;

          --simple-colors-default-theme-yellow-1: #ffffd5;
          --simple-colors-default-theme-yellow-2: #ffffac;
          --simple-colors-default-theme-yellow-3: #ffff90;
          --simple-colors-default-theme-yellow-4: #ffff7c;
          --simple-colors-default-theme-yellow-5: #ffff3a;
          --simple-colors-default-theme-yellow-6: #f6f600;
          --simple-colors-default-theme-yellow-7: #929100;
          --simple-colors-default-theme-yellow-8: #787700;
          --simple-colors-default-theme-yellow-9: #585700;
          --simple-colors-default-theme-yellow-10: #454400;
          --simple-colors-default-theme-yellow-11: #303000;
          --simple-colors-default-theme-yellow-12: #242400;

          --simple-colors-default-theme-amber-1: #fff2d4;
          --simple-colors-default-theme-amber-2: #ffdf92;
          --simple-colors-default-theme-amber-3: #ffd677;
          --simple-colors-default-theme-amber-4: #ffcf5e;
          --simple-colors-default-theme-amber-5: #ffc235;
          --simple-colors-default-theme-amber-6: #ffc500;
          --simple-colors-default-theme-amber-7: #b28900;
          --simple-colors-default-theme-amber-8: #876800;
          --simple-colors-default-theme-amber-9: #614b00;
          --simple-colors-default-theme-amber-10: #413200;
          --simple-colors-default-theme-amber-11: #302500;
          --simple-colors-default-theme-amber-12: #221a00;

          --simple-colors-default-theme-orange-1: #ffebd7;
          --simple-colors-default-theme-orange-2: #ffca92;
          --simple-colors-default-theme-orange-3: #ffbd75;
          --simple-colors-default-theme-orange-4: #ffb05c;
          --simple-colors-default-theme-orange-5: #ff9e36;
          --simple-colors-default-theme-orange-6: #ff9625;
          --simple-colors-default-theme-orange-7: #e56a00;
          --simple-colors-default-theme-orange-8: #ae5100;
          --simple-colors-default-theme-orange-9: #833d00;
          --simple-colors-default-theme-orange-10: #612d00;
          --simple-colors-default-theme-orange-11: #3d1c00;
          --simple-colors-default-theme-orange-12: #2c1400;

          --simple-colors-default-theme-deep-orange-1: #ffe7e0;
          --simple-colors-default-theme-deep-orange-2: #ffb299;
          --simple-colors-default-theme-deep-orange-3: #ffa588;
          --simple-colors-default-theme-deep-orange-4: #ff8a64;
          --simple-colors-default-theme-deep-orange-5: #ff7649;
          --simple-colors-default-theme-deep-orange-6: #ff6c3c;
          --simple-colors-default-theme-deep-orange-7: #f53100;
          --simple-colors-default-theme-deep-orange-8: #b92500;
          --simple-colors-default-theme-deep-orange-9: #8a1c00;
          --simple-colors-default-theme-deep-orange-10: #561100;
          --simple-colors-default-theme-deep-orange-11: #3a0c00;
          --simple-colors-default-theme-deep-orange-12: #240700;

          --simple-colors-default-theme-brown-1: #f0e2de;
          --simple-colors-default-theme-brown-2: #e5b8aa;
          --simple-colors-default-theme-brown-3: #c59485;
          --simple-colors-default-theme-brown-4: #b68373;
          --simple-colors-default-theme-brown-5: #ac7868;
          --simple-colors-default-theme-brown-6: #a47060;
          --simple-colors-default-theme-brown-7: #85574a;
          --simple-colors-default-theme-brown-8: #724539;
          --simple-colors-default-theme-brown-9: #5b3328;
          --simple-colors-default-theme-brown-10: #3b1e15;
          --simple-colors-default-theme-brown-11: #2c140e;
          --simple-colors-default-theme-brown-12: #200e09;

          --simple-colors-default-theme-blue-grey-1: #e7eff1;
          --simple-colors-default-theme-blue-grey-2: #b1c5ce;
          --simple-colors-default-theme-blue-grey-3: #9badb6;
          --simple-colors-default-theme-blue-grey-4: #8d9fa7;
          --simple-colors-default-theme-blue-grey-5: #7a8f98;
          --simple-colors-default-theme-blue-grey-6: #718892;
          --simple-colors-default-theme-blue-grey-7: #56707c;
          --simple-colors-default-theme-blue-grey-8: #40535b;
          --simple-colors-default-theme-blue-grey-9: #2f3e45;
          --simple-colors-default-theme-blue-grey-10: #1e282c;
          --simple-colors-default-theme-blue-grey-11: #182023;
          --simple-colors-default-theme-blue-grey-12: #0f1518;
          --simple-colors-fixed-theme-accent-1: #ffffff;
          --simple-colors-fixed-theme-accent-2: #eeeeee;
          --simple-colors-fixed-theme-accent-3: #dddddd;
          --simple-colors-fixed-theme-accent-4: #cccccc;
          --simple-colors-fixed-theme-accent-5: #bbbbbb;
          --simple-colors-fixed-theme-accent-6: #999999;
          --simple-colors-fixed-theme-accent-7: #666666;
          --simple-colors-fixed-theme-accent-8: #444444;
          --simple-colors-fixed-theme-accent-9: #333333;
          --simple-colors-fixed-theme-accent-10: #222222;
          --simple-colors-fixed-theme-accent-11: #111111;
          --simple-colors-fixed-theme-accent-12: #000000;

          --simple-colors-fixed-theme-grey-1: #ffffff;
          --simple-colors-fixed-theme-grey-2: #eeeeee;
          --simple-colors-fixed-theme-grey-3: #dddddd;
          --simple-colors-fixed-theme-grey-4: #cccccc;
          --simple-colors-fixed-theme-grey-5: #bbbbbb;
          --simple-colors-fixed-theme-grey-6: #999999;
          --simple-colors-fixed-theme-grey-7: #666666;
          --simple-colors-fixed-theme-grey-8: #444444;
          --simple-colors-fixed-theme-grey-9: #333333;
          --simple-colors-fixed-theme-grey-10: #222222;
          --simple-colors-fixed-theme-grey-11: #111111;
          --simple-colors-fixed-theme-grey-12: #000000;

          --simple-colors-fixed-theme-red-1: #ffdddd;
          --simple-colors-fixed-theme-red-2: #ffaeae;
          --simple-colors-fixed-theme-red-3: #ff8f8f;
          --simple-colors-fixed-theme-red-4: #ff7474;
          --simple-colors-fixed-theme-red-5: #fd5151;
          --simple-colors-fixed-theme-red-6: #ff2222;
          --simple-colors-fixed-theme-red-7: #ee0000;
          --simple-colors-fixed-theme-red-8: #ac0000;
          --simple-colors-fixed-theme-red-9: #850000;
          --simple-colors-fixed-theme-red-10: #670000;
          --simple-colors-fixed-theme-red-11: #520000;
          --simple-colors-fixed-theme-red-12: #3f0000;

          --simple-colors-fixed-theme-pink-1: #ffe6f1;
          --simple-colors-fixed-theme-pink-2: #ffa5cf;
          --simple-colors-fixed-theme-pink-3: #ff87c0;
          --simple-colors-fixed-theme-pink-4: #ff73b5;
          --simple-colors-fixed-theme-pink-5: #fd60aa;
          --simple-colors-fixed-theme-pink-6: #ff3996;
          --simple-colors-fixed-theme-pink-7: #da004e;
          --simple-colors-fixed-theme-pink-8: #b80042;
          --simple-colors-fixed-theme-pink-9: #980036;
          --simple-colors-fixed-theme-pink-10: #78002b;
          --simple-colors-fixed-theme-pink-11: #5a0020;
          --simple-colors-fixed-theme-pink-12: #440019;

          --simple-colors-fixed-theme-purple-1: #fce6ff;
          --simple-colors-fixed-theme-purple-2: #f4affd;
          --simple-colors-fixed-theme-purple-3: #f394ff;
          --simple-colors-fixed-theme-purple-4: #f07cff;
          --simple-colors-fixed-theme-purple-5: #ed61ff;
          --simple-colors-fixed-theme-purple-6: #e200ff;
          --simple-colors-fixed-theme-purple-7: #a500ba;
          --simple-colors-fixed-theme-purple-8: #8a009b;
          --simple-colors-fixed-theme-purple-9: #6c0079;
          --simple-colors-fixed-theme-purple-10: #490052;
          --simple-colors-fixed-theme-purple-11: #33003a;
          --simple-colors-fixed-theme-purple-12: #200025;

          --simple-colors-fixed-theme-deep-purple-1: #f3e4ff;
          --simple-colors-fixed-theme-deep-purple-2: #ddacff;
          --simple-colors-fixed-theme-deep-purple-3: #c97eff;
          --simple-colors-fixed-theme-deep-purple-4: #bb63f9;
          --simple-colors-fixed-theme-deep-purple-5: #b44aff;
          --simple-colors-fixed-theme-deep-purple-6: #a931ff;
          --simple-colors-fixed-theme-deep-purple-7: #7e00d8;
          --simple-colors-fixed-theme-deep-purple-8: #5d009f;
          --simple-colors-fixed-theme-deep-purple-9: #4c0081;
          --simple-colors-fixed-theme-deep-purple-10: #3a0063;
          --simple-colors-fixed-theme-deep-purple-11: #2a0049;
          --simple-colors-fixed-theme-deep-purple-12: #1d0033;

          --simple-colors-fixed-theme-indigo-1: #e5ddff;
          --simple-colors-fixed-theme-indigo-2: #c3b2ff;
          --simple-colors-fixed-theme-indigo-3: #af97ff;
          --simple-colors-fixed-theme-indigo-4: #9e82ff;
          --simple-colors-fixed-theme-indigo-5: #9373ff;
          --simple-colors-fixed-theme-indigo-6: #835fff;
          --simple-colors-fixed-theme-indigo-7: #3a00ff;
          --simple-colors-fixed-theme-indigo-8: #2801b0;
          --simple-colors-fixed-theme-indigo-9: #20008c;
          --simple-colors-fixed-theme-indigo-10: #160063;
          --simple-colors-fixed-theme-indigo-11: #100049;
          --simple-colors-fixed-theme-indigo-12: #0a0030;

          --simple-colors-fixed-theme-blue-1: #e2ecff;
          --simple-colors-fixed-theme-blue-2: #acc9ff;
          --simple-colors-fixed-theme-blue-3: #95baff;
          --simple-colors-fixed-theme-blue-4: #74a5ff;
          --simple-colors-fixed-theme-blue-5: #5892fd;
          --simple-colors-fixed-theme-blue-6: #4083ff;
          --simple-colors-fixed-theme-blue-7: #0059ff;
          --simple-colors-fixed-theme-blue-8: #0041bb;
          --simple-colors-fixed-theme-blue-9: #003494;
          --simple-colors-fixed-theme-blue-10: #002569;
          --simple-colors-fixed-theme-blue-11: #001947;
          --simple-colors-fixed-theme-blue-12: #001333;

          --simple-colors-fixed-theme-light-blue-1: #cde8ff;
          --simple-colors-fixed-theme-light-blue-2: #a1d1ff;
          --simple-colors-fixed-theme-light-blue-3: #92c9ff;
          --simple-colors-fixed-theme-light-blue-4: #65b3ff;
          --simple-colors-fixed-theme-light-blue-5: #58adff;
          --simple-colors-fixed-theme-light-blue-6: #41a1ff;
          --simple-colors-fixed-theme-light-blue-7: #007ffc;
          --simple-colors-fixed-theme-light-blue-8: #0066ca;
          --simple-colors-fixed-theme-light-blue-9: #0055a8;
          --simple-colors-fixed-theme-light-blue-10: #003f7d;
          --simple-colors-fixed-theme-light-blue-11: #002850;
          --simple-colors-fixed-theme-light-blue-12: #001b36;

          --simple-colors-fixed-theme-cyan-1: #ccf3fd;
          --simple-colors-fixed-theme-cyan-2: #9beaff;
          --simple-colors-fixed-theme-cyan-3: #77e2ff;
          --simple-colors-fixed-theme-cyan-4: #33d4ff;
          --simple-colors-fixed-theme-cyan-5: #1ccfff;
          --simple-colors-fixed-theme-cyan-6: #00c9ff;
          --simple-colors-fixed-theme-cyan-7: #009dc7;
          --simple-colors-fixed-theme-cyan-8: #007999;
          --simple-colors-fixed-theme-cyan-9: #005970;
          --simple-colors-fixed-theme-cyan-10: #003f50;
          --simple-colors-fixed-theme-cyan-11: #002c38;
          --simple-colors-fixed-theme-cyan-12: #001a20;

          --simple-colors-fixed-theme-teal-1: #d4ffee;
          --simple-colors-fixed-theme-teal-2: #98ffd7;
          --simple-colors-fixed-theme-teal-3: #79ffcb;
          --simple-colors-fixed-theme-teal-4: #56ffbd;
          --simple-colors-fixed-theme-teal-5: #29ffac;
          --simple-colors-fixed-theme-teal-6: #00ff9c;
          --simple-colors-fixed-theme-teal-7: #009d75;
          --simple-colors-fixed-theme-teal-8: #007658;
          --simple-colors-fixed-theme-teal-9: #004e3a;
          --simple-colors-fixed-theme-teal-10: #003829;
          --simple-colors-fixed-theme-teal-11: #002a20;
          --simple-colors-fixed-theme-teal-12: #001b14;

          --simple-colors-fixed-theme-green-1: #e1ffeb;
          --simple-colors-fixed-theme-green-2: #acffc9;
          --simple-colors-fixed-theme-green-3: #79ffa7;
          --simple-colors-fixed-theme-green-4: #49ff88;
          --simple-colors-fixed-theme-green-5: #24ff70;
          --simple-colors-fixed-theme-green-6: #00f961;
          --simple-colors-fixed-theme-green-7: #008c37;
          --simple-colors-fixed-theme-green-8: #00762e;
          --simple-colors-fixed-theme-green-9: #005a23;
          --simple-colors-fixed-theme-green-10: #003d18;
          --simple-colors-fixed-theme-green-11: #002a11;
          --simple-colors-fixed-theme-green-12: #001d0c;

          --simple-colors-fixed-theme-light-green-1: #ebffdb;
          --simple-colors-fixed-theme-light-green-2: #c7ff9b;
          --simple-colors-fixed-theme-light-green-3: #b1ff75;
          --simple-colors-fixed-theme-light-green-4: #a1fd5a;
          --simple-colors-fixed-theme-light-green-5: #8efd38;
          --simple-colors-fixed-theme-light-green-6: #6fff00;
          --simple-colors-fixed-theme-light-green-7: #429d00;
          --simple-colors-fixed-theme-light-green-8: #357f00;
          --simple-colors-fixed-theme-light-green-9: #296100;
          --simple-colors-fixed-theme-light-green-10: #1b3f00;
          --simple-colors-fixed-theme-light-green-11: #143000;
          --simple-colors-fixed-theme-light-green-12: #0d2000;

          --simple-colors-fixed-theme-lime-1: #f1ffd2;
          --simple-colors-fixed-theme-lime-2: #dfff9b;
          --simple-colors-fixed-theme-lime-3: #d4ff77;
          --simple-colors-fixed-theme-lime-4: #caff58;
          --simple-colors-fixed-theme-lime-5: #bdff2d;
          --simple-colors-fixed-theme-lime-6: #aeff00;
          --simple-colors-fixed-theme-lime-7: #649900;
          --simple-colors-fixed-theme-lime-8: #4d7600;
          --simple-colors-fixed-theme-lime-9: #3b5a00;
          --simple-colors-fixed-theme-lime-10: #293f00;
          --simple-colors-fixed-theme-lime-11: #223400;
          --simple-colors-fixed-theme-lime-12: #182400;

          --simple-colors-fixed-theme-yellow-1: #ffffd5;
          --simple-colors-fixed-theme-yellow-2: #ffffac;
          --simple-colors-fixed-theme-yellow-3: #ffff90;
          --simple-colors-fixed-theme-yellow-4: #ffff7c;
          --simple-colors-fixed-theme-yellow-5: #ffff3a;
          --simple-colors-fixed-theme-yellow-6: #f6f600;
          --simple-colors-fixed-theme-yellow-7: #929100;
          --simple-colors-fixed-theme-yellow-8: #787700;
          --simple-colors-fixed-theme-yellow-9: #585700;
          --simple-colors-fixed-theme-yellow-10: #454400;
          --simple-colors-fixed-theme-yellow-11: #303000;
          --simple-colors-fixed-theme-yellow-12: #242400;

          --simple-colors-fixed-theme-amber-1: #fff2d4;
          --simple-colors-fixed-theme-amber-2: #ffdf92;
          --simple-colors-fixed-theme-amber-3: #ffd677;
          --simple-colors-fixed-theme-amber-4: #ffcf5e;
          --simple-colors-fixed-theme-amber-5: #ffc235;
          --simple-colors-fixed-theme-amber-6: #ffc500;
          --simple-colors-fixed-theme-amber-7: #b28900;
          --simple-colors-fixed-theme-amber-8: #876800;
          --simple-colors-fixed-theme-amber-9: #614b00;
          --simple-colors-fixed-theme-amber-10: #413200;
          --simple-colors-fixed-theme-amber-11: #302500;
          --simple-colors-fixed-theme-amber-12: #221a00;

          --simple-colors-fixed-theme-orange-1: #ffebd7;
          --simple-colors-fixed-theme-orange-2: #ffca92;
          --simple-colors-fixed-theme-orange-3: #ffbd75;
          --simple-colors-fixed-theme-orange-4: #ffb05c;
          --simple-colors-fixed-theme-orange-5: #ff9e36;
          --simple-colors-fixed-theme-orange-6: #ff9625;
          --simple-colors-fixed-theme-orange-7: #e56a00;
          --simple-colors-fixed-theme-orange-8: #ae5100;
          --simple-colors-fixed-theme-orange-9: #833d00;
          --simple-colors-fixed-theme-orange-10: #612d00;
          --simple-colors-fixed-theme-orange-11: #3d1c00;
          --simple-colors-fixed-theme-orange-12: #2c1400;

          --simple-colors-fixed-theme-deep-orange-1: #ffe7e0;
          --simple-colors-fixed-theme-deep-orange-2: #ffb299;
          --simple-colors-fixed-theme-deep-orange-3: #ffa588;
          --simple-colors-fixed-theme-deep-orange-4: #ff8a64;
          --simple-colors-fixed-theme-deep-orange-5: #ff7649;
          --simple-colors-fixed-theme-deep-orange-6: #ff6c3c;
          --simple-colors-fixed-theme-deep-orange-7: #f53100;
          --simple-colors-fixed-theme-deep-orange-8: #b92500;
          --simple-colors-fixed-theme-deep-orange-9: #8a1c00;
          --simple-colors-fixed-theme-deep-orange-10: #561100;
          --simple-colors-fixed-theme-deep-orange-11: #3a0c00;
          --simple-colors-fixed-theme-deep-orange-12: #240700;

          --simple-colors-fixed-theme-brown-1: #f0e2de;
          --simple-colors-fixed-theme-brown-2: #e5b8aa;
          --simple-colors-fixed-theme-brown-3: #c59485;
          --simple-colors-fixed-theme-brown-4: #b68373;
          --simple-colors-fixed-theme-brown-5: #ac7868;
          --simple-colors-fixed-theme-brown-6: #a47060;
          --simple-colors-fixed-theme-brown-7: #85574a;
          --simple-colors-fixed-theme-brown-8: #724539;
          --simple-colors-fixed-theme-brown-9: #5b3328;
          --simple-colors-fixed-theme-brown-10: #3b1e15;
          --simple-colors-fixed-theme-brown-11: #2c140e;
          --simple-colors-fixed-theme-brown-12: #200e09;

          --simple-colors-fixed-theme-blue-grey-1: #e7eff1;
          --simple-colors-fixed-theme-blue-grey-2: #b1c5ce;
          --simple-colors-fixed-theme-blue-grey-3: #9badb6;
          --simple-colors-fixed-theme-blue-grey-4: #8d9fa7;
          --simple-colors-fixed-theme-blue-grey-5: #7a8f98;
          --simple-colors-fixed-theme-blue-grey-6: #718892;
          --simple-colors-fixed-theme-blue-grey-7: #56707c;
          --simple-colors-fixed-theme-blue-grey-8: #40535b;
          --simple-colors-fixed-theme-blue-grey-9: #2f3e45;
          --simple-colors-fixed-theme-blue-grey-10: #1e282c;
          --simple-colors-fixed-theme-blue-grey-11: #182023;
          --simple-colors-fixed-theme-blue-grey-12: #0f1518;
        }
      `,
    ];
  }

  // render function
  render() {
    return x``;
  }

  // properties available to the custom element for data binding
  static get properties() {
    return {
      ...super.properties,

      /**
       * The colors object.
       * Each color contains an array of shades as hex codes from lightest to darkest.
       */
      colors: {
        attribute: "colors",
        type: Object,
      },
      /**
    * Object with information on which color combinations are WCAG 2.0AA compliant, "eg": 
     {
       "greyColor": {          //if either the color or its contrast will be a grey
         "aaLarge": [          //if bold text >= 14pt, text >= 18pt, decorative only, or disabled
           {                 //for the first shade of a color
             "min": 7,         //index of the lightest contrasting shade of another color
             "max": 12         //index of the darkest contrasting shade of another color
           },
           ...
         ],
         "aa": [ ... ]         //if bold text < 14pt, or text < 18pt
       },
       "colorColor": { ... }   //if neither the color nor its contrast are grey
     }
   */
      contrasts: {
        attribute: "contrasts",
        type: Object,
      },
    };
  }

  constructor() {
    super();
    this.colors = {
      grey: [
        "#ffffff",
        "#eeeeee",
        "#dddddd",
        "#cccccc",
        "#bbbbbb",
        "#999999",
        "#666666",
        "#444444",
        "#333333",
        "#222222",
        "#111111",
        "#000000",
      ],
      red: [
        "#ffdddd",
        "#ffaeae",
        "#ff8f8f",
        "#ff7474",
        "#fd5151",
        "#ff2222",
        "#ee0000",
        "#ac0000",
        "#850000",
        "#670000",
        "#520000",
        "#3f0000",
      ],
      pink: [
        "#ffe6f1",
        "#ffa5cf",
        "#ff87c0",
        "#ff73b5",
        "#fd60aa",
        "#ff3996",
        "#da004e",
        "#b80042",
        "#980036",
        "#78002b",
        "#5a0020",
        "#440019",
      ],
      purple: [
        "#fce6ff",
        "#f4affd",
        "#f394ff",
        "#f07cff",
        "#ed61ff",
        "#e200ff",
        "#a500ba",
        "#8a009b",
        "#6c0079",
        "#490052",
        "#33003a",
        "#200025",
      ],
      "deep-purple": [
        "#f3e4ff",
        "#ddacff",
        "#c97eff",
        "#bb63f9",
        "#b44aff",
        "#a931ff",
        "#7e00d8",
        "#5d009f",
        "#4c0081",
        "#3a0063",
        "#2a0049",
        "#1d0033",
      ],
      indigo: [
        "#e5ddff",
        "#c3b2ff",
        "#af97ff",
        "#9e82ff",
        "#9373ff",
        "#835fff",
        "#3a00ff",
        "#2801b0",
        "#20008c",
        "#160063",
        "#100049",
        "#0a0030",
      ],
      blue: [
        "#e2ecff",
        "#acc9ff",
        "#95baff",
        "#74a5ff",
        "#5892fd",
        "#4083ff",
        "#0059ff",
        "#0041bb",
        "#003494",
        "#002569",
        "#001947",
        "#001333",
      ],
      "light-blue": [
        "#cde8ff",
        "#a1d1ff",
        "#92c9ff",
        "#65b3ff",
        "#58adff",
        "#41a1ff",
        "#007ffc",
        "#0066ca",
        "#0055a8",
        "#003f7d",
        "#002850",
        "#001b36",
      ],
      cyan: [
        "#ddf8ff",
        "#9beaff",
        "#77e2ff",
        "#33d4ff",
        "#1ccfff",
        "#00c9ff",
        "#009dc7",
        "#007999",
        "#005970",
        "#003f50",
        "#002c38",
        "#001a20",
      ],
      teal: [
        "#d9fff0",
        "#98ffd7",
        "#79ffcb",
        "#56ffbd",
        "#29ffac",
        "#00ff9c",
        "#009d75",
        "#007658",
        "#004e3a",
        "#003829",
        "#002a20",
        "#001b14",
      ],
      green: [
        "#e1ffeb",
        "#acffc9",
        "#79ffa7",
        "#49ff88",
        "#24ff70",
        "#00f961",
        "#008c37",
        "#00762e",
        "#005a23",
        "#003d18",
        "#002a11",
        "#001d0c",
      ],
      "light-green": [
        "#ebffdb",
        "#c7ff9b",
        "#b1ff75",
        "#a1fd5a",
        "#8efd38",
        "#6fff00",
        "#429d00",
        "#357f00",
        "#296100",
        "#1b3f00",
        "#143000",
        "#0d2000",
      ],
      lime: [
        "#f1ffd2",
        "#dfff9b",
        "#d4ff77",
        "#caff58",
        "#bdff2d",
        "#aeff00",
        "#649900",
        "#4d7600",
        "#3b5a00",
        "#293f00",
        "#223400",
        "#182400",
      ],
      yellow: [
        "#ffffd5",
        "#ffffac",
        "#ffff90",
        "#ffff7c",
        "#ffff3a",
        "#f6f600",
        "#929100",
        "#787700",
        "#585700",
        "#454400",
        "#303000",
        "#242400",
      ],
      amber: [
        "#fff2d4",
        "#ffdf92",
        "#ffd677",
        "#ffcf5e",
        "#ffc235",
        "#ffc500",
        "#b28900",
        "#876800",
        "#614b00",
        "#413200",
        "#302500",
        "#221a00",
      ],
      orange: [
        "#ffebd7",
        "#ffca92",
        "#ffbd75",
        "#ffb05c",
        "#ff9e36",
        "#ff9625",
        "#e56a00",
        "#ae5100",
        "#833d00",
        "#612d00",
        "#3d1c00",
        "#2c1400",
      ],
      "deep-orange": [
        "#ffe7e0",
        "#ffb299",
        "#ffa588",
        "#ff8a64",
        "#ff7649",
        "#ff6c3c",
        "#f53100",
        "#b92500",
        "#8a1c00",
        "#561100",
        "#3a0c00",
        "#240700",
      ],
      brown: [
        "#f0e2de",
        "#e5b8aa",
        "#c59485",
        "#b68373",
        "#ac7868",
        "#a47060",
        "#85574a",
        "#724539",
        "#5b3328",
        "#3b1e15",
        "#2c140e",
        "#200e09",
      ],
      "blue-grey": [
        "#e7eff1",
        "#b1c5ce",
        "#9badb6",
        "#8d9fa7",
        "#7a8f98",
        "#718892",
        "#56707c",
        "#40535b",
        "#2f3e45",
        "#1e282c",
        "#182023",
        "#0f1518",
      ],
    };
    this.contrasts = {
      greyColor: {
        aaLarge: [
          { min: 7, max: 12 },
          { min: 7, max: 12 },
          { min: 7, max: 12 },
          { min: 7, max: 12 },
          { min: 8, max: 12 },
          { min: 10, max: 12 },
          { min: 1, max: 3 },
          { min: 1, max: 5 },
          { min: 1, max: 6 },
          { min: 1, max: 6 },
          { min: 1, max: 6 },
          { min: 1, max: 6 },
        ],
        aa: [
          //if bold text < 14pt, or text < 18pt
          { min: 7, max: 12 },
          { min: 7, max: 12 },
          { min: 7, max: 12 },
          { min: 8, max: 12 },
          { min: 8, max: 12 },
          { min: 11, max: 12 },
          { min: 1, max: 2 },
          { min: 1, max: 7 },
          { min: 1, max: 7 },
          { min: 1, max: 6 },
          { min: 1, max: 6 },
          { min: 1, max: 6 },
        ],
      },
      colorColor: {
        //if neither the color nor its contrast are grey
        aaLarge: [
          { min: 7, max: 12 },
          { min: 7, max: 12 },
          { min: 8, max: 12 },
          { min: 9, max: 12 },
          { min: 10, max: 12 },
          { min: 11, max: 12 },
          { min: 1, max: 2 },
          { min: 1, max: 3 },
          { min: 1, max: 4 },
          { min: 1, max: 5 },
          { min: 1, max: 6 },
          { min: 1, max: 6 },
        ],
        aa: [
          { min: 8, max: 12 },
          { min: 8, max: 12 },
          { min: 9, max: 12 },
          { min: 9, max: 12 },
          { min: 11, max: 12 },
          { min: 12, max: 12 },
          { min: 1, max: 1 },
          { min: 1, max: 2 },
          { min: 1, max: 4 },
          { min: 1, max: 4 },
          { min: 1, max: 5 },
          { min: 1, max: 5 },
        ],
      },
    };
  }

  /**
   * Store the tag name to make it easier to obtain directly.
   */
  static get tag() {
    return "simple-colors-shared-styles";
  }

  /**
   * gets the color information of a given CSS variable or class
   *
   * @param {string} the CSS variable (eg. `--simple-colors-fixed-theme-red-3`)
   * @param {object} an object that includes the theme, color, and shade information
   */
  getColorInfo(colorName) {
    let temp1 = colorName
        .replace(/(simple-colors-)?(-text)?(-border)?/g, "")
        .split("-theme-"),
      theme = temp1.length > 0 ? temp1[0] : "default",
      temp2 = temp1.length > 0 ? temp1[1].split("-") : temp1[0].split("-"),
      color =
        temp2.length > 1 ? temp2.slice(1, temp2.length - 1).join("-") : "grey",
      shade = temp2.length > 1 ? temp2[temp2.length - 1] : "1";
    return {
      theme: theme,
      color: color,
      shade: shade,
    };
  }
  /**
   * returns a variable based on color name, shade, and fixed theme
   *
   * @param {string} the color name
   * @param {number} the color shade
   * @param {boolean} the color shade
   * @returns {string} the CSS Variable
   */
  makeVariable(color = "grey", shade = 1, theme = "default") {
    return ["--simple-colors", theme, "theme", color, shade].join("-");
  }
  /**
   * for large or small text given a color and its shade,
   * lists all the shades of another color that would be
   * WCAG 2.0 AA-compliant for contrast
   *
   * @param {boolean} large text? >= 18pt || (bold && >= 14pt)
   * @param {string} color name, e.g. "deep-purple"
   * @param {string} color shade, e.g. 3
   * @param {string} contrasting color name, e.g. "grey"
   * @param {array} all of the WCAG 2.0 AA-compliant shades of the contrasting color
   */
  getContrastingShades(isLarge, colorName, colorShade, contrastName) {
    let hasGrey =
        colorName === "grey" || contrastName === "grey"
          ? "greyColor"
          : "colorColor",
      aa = isLarge ? "aaLarge" : "aa",
      index = parseInt(colorShade),
      range = this.contrasts[hasGrey][aa][index];
    return Array(range.max - range.min + 1)
      .fill()
      .map((_, idx) => range.min + idx);
  }

  /**
   * for large or small text given a color and its shade,
   * lists all the colors and shades that would be
   * WCAG 2.0 AA-compliant for contrast
   *
   * @param {boolean} large text? >= 18pt || (bold && >= 14pt)
   * @param {string} color name, e.g. "deep-purple"
   * @param {string} color shade, e.g. 3
   * @param {object} all of the WCAG 2.0 AA-compliant colors and shades
   */
  getContrastingColors(colorName, colorShade, isLarge) {
    let result = {};
    Object.keys(this.colors).forEach((color) => {
      result[color] = this.getContrastingShades(
        isLarge,
        colorName,
        colorShade,
        color,
      );
    });
    return result;
  }
  /**
   * determines if two shades are WCAG 2.0 AA-compliant for contrast
   *
   * @param {boolean} large text? >= 18pt || (bold && >= 14pt)
   * @param {string} color name, e.g. "deep-purple"
   * @param {string} color shade, e.g. 3
   * @param {string} contrasting color name, e.g. "grey"
   * @param {string} contrast shade, e.g. 12
   * @param {boolean} whether or not the contrasting shade is WCAG 2.0 AA-compliant
   */
  isContrastCompliant(
    isLarge,
    colorName,
    colorShade,
    contrastName,
    contrastShade,
  ) {
    let hasGrey =
        colorName === "grey" || contrastName === "grey"
          ? "greyColor"
          : "colorColor",
      aa = isLarge ? "aaLarge" : "aa",
      index = parseInt(colorShade) + 1,
      range = this.contrasts[hasGrey][aa][index];
    return contrastShade >= range.min && ontrastShade >= range.max;
  }

  /**
   * gets the current shade based on the index
   *
   * @param {string} the index
   * @param {number} the shade
   */
  indexToShade(index) {
    return parseInt(index) + 1;
  }

  /**
   * gets the current shade based on the index
   *
   * @param {string} the shade
   * @param {number} the index
   */
  shadeToIndex(shade) {
    return parseInt(shade) - 1;
  }
}
customElements.define(SimpleColorsSharedStyles.tag, SimpleColorsSharedStyles);
/**
 * Checks to see if there is an instance available, and if not appends one
 */
globalThis.SimpleColorsSharedStyles.requestAvailability = () => {
  if (globalThis.SimpleColorsSharedStyles.instance == null) {
    globalThis.SimpleColorsSharedStyles.instance = document.createElement(
      "simple-colors-shared-styles",
    );
    globalThis.SimpleColorsSharedStyles.colors =
      globalThis.SimpleColorsSharedStyles.instance.colors;
    globalThis.SimpleColorsSharedStyles.contrasts =
      globalThis.SimpleColorsSharedStyles.instance.contrasts;
    globalThis.SimpleColorsSharedStyles.stylesheet =
      document.createElement("style");
    globalThis.SimpleColorsSharedStyles.stylesheet.innerHTML = `${SimpleColorsSharedStyles.styles[0].cssText}`;
    document.head.appendChild(globalThis.SimpleColorsSharedStyles.stylesheet);
  }
  return globalThis.SimpleColorsSharedStyles.instance;
};
const SimpleColorsSharedStylesGlobal =
  typeof global !== "undefined"
    ? new SimpleColorsSharedStyles()
    : globalThis.SimpleColorsSharedStyles.requestAvailability();

/**
 * Copyright 2018 The Pennsylvania State University
 * @license Apache-2.0, see License.md for full text.
 */
const SimpleColorsSuper = function (SuperClass) {
  return class extends SuperClass {
    //styles function
    static get styles() {
      let styles = i$2("");
      if (super.styles) {
        styles = super.styles;
      }
      return [
        styles,
        i$2`
          :host([dark]) {
            --simple-colors-default-theme-accent-1: #000000;
            --simple-colors-default-theme-accent-2: #111111;
            --simple-colors-default-theme-accent-3: #222222;
            --simple-colors-default-theme-accent-4: #333333;
            --simple-colors-default-theme-accent-5: #444444;
            --simple-colors-default-theme-accent-6: #666666;
            --simple-colors-default-theme-accent-7: #999999;
            --simple-colors-default-theme-accent-8: #bbbbbb;
            --simple-colors-default-theme-accent-9: #cccccc;
            --simple-colors-default-theme-accent-10: #dddddd;
            --simple-colors-default-theme-accent-11: #eeeeee;
            --simple-colors-default-theme-accent-12: #ffffff;

            --simple-colors-default-theme-grey-1: #000000;
            --simple-colors-default-theme-grey-2: #111111;
            --simple-colors-default-theme-grey-3: #222222;
            --simple-colors-default-theme-grey-4: #333333;
            --simple-colors-default-theme-grey-5: #444444;
            --simple-colors-default-theme-grey-6: #666666;
            --simple-colors-default-theme-grey-7: #999999;
            --simple-colors-default-theme-grey-8: #bbbbbb;
            --simple-colors-default-theme-grey-9: #cccccc;
            --simple-colors-default-theme-grey-10: #dddddd;
            --simple-colors-default-theme-grey-11: #eeeeee;
            --simple-colors-default-theme-grey-12: #ffffff;

            --simple-colors-default-theme-red-1: #3f0000;
            --simple-colors-default-theme-red-2: #520000;
            --simple-colors-default-theme-red-3: #670000;
            --simple-colors-default-theme-red-4: #850000;
            --simple-colors-default-theme-red-5: #ac0000;
            --simple-colors-default-theme-red-6: #ee0000;
            --simple-colors-default-theme-red-7: #ff2222;
            --simple-colors-default-theme-red-8: #fd5151;
            --simple-colors-default-theme-red-9: #ff7474;
            --simple-colors-default-theme-red-10: #ff8f8f;
            --simple-colors-default-theme-red-11: #ffaeae;
            --simple-colors-default-theme-red-12: #ffdddd;

            --simple-colors-default-theme-pink-1: #440019;
            --simple-colors-default-theme-pink-2: #5a0020;
            --simple-colors-default-theme-pink-3: #78002b;
            --simple-colors-default-theme-pink-4: #980036;
            --simple-colors-default-theme-pink-5: #b80042;
            --simple-colors-default-theme-pink-6: #da004e;
            --simple-colors-default-theme-pink-7: #ff3996;
            --simple-colors-default-theme-pink-8: #fd60aa;
            --simple-colors-default-theme-pink-9: #ff73b5;
            --simple-colors-default-theme-pink-10: #ff87c0;
            --simple-colors-default-theme-pink-11: #ffa5cf;
            --simple-colors-default-theme-pink-12: #ffe6f1;

            --simple-colors-default-theme-purple-1: #200025;
            --simple-colors-default-theme-purple-2: #33003a;
            --simple-colors-default-theme-purple-3: #490052;
            --simple-colors-default-theme-purple-4: #6c0079;
            --simple-colors-default-theme-purple-5: #8a009b;
            --simple-colors-default-theme-purple-6: #a500ba;
            --simple-colors-default-theme-purple-7: #e200ff;
            --simple-colors-default-theme-purple-8: #ed61ff;
            --simple-colors-default-theme-purple-9: #f07cff;
            --simple-colors-default-theme-purple-10: #f394ff;
            --simple-colors-default-theme-purple-11: #f4affd;
            --simple-colors-default-theme-purple-12: #fce6ff;

            --simple-colors-default-theme-deep-purple-1: #1d0033;
            --simple-colors-default-theme-deep-purple-2: #2a0049;
            --simple-colors-default-theme-deep-purple-3: #3a0063;
            --simple-colors-default-theme-deep-purple-4: #4c0081;
            --simple-colors-default-theme-deep-purple-5: #5d009f;
            --simple-colors-default-theme-deep-purple-6: #7e00d8;
            --simple-colors-default-theme-deep-purple-7: #a931ff;
            --simple-colors-default-theme-deep-purple-8: #b44aff;
            --simple-colors-default-theme-deep-purple-9: #bb63f9;
            --simple-colors-default-theme-deep-purple-10: #c97eff;
            --simple-colors-default-theme-deep-purple-11: #ddacff;
            --simple-colors-default-theme-deep-purple-12: #f3e4ff;

            --simple-colors-default-theme-indigo-1: #0a0030;
            --simple-colors-default-theme-indigo-2: #100049;
            --simple-colors-default-theme-indigo-3: #160063;
            --simple-colors-default-theme-indigo-4: #20008c;
            --simple-colors-default-theme-indigo-5: #2801b0;
            --simple-colors-default-theme-indigo-6: #3a00ff;
            --simple-colors-default-theme-indigo-7: #835fff;
            --simple-colors-default-theme-indigo-8: #9373ff;
            --simple-colors-default-theme-indigo-9: #9e82ff;
            --simple-colors-default-theme-indigo-10: #af97ff;
            --simple-colors-default-theme-indigo-11: #c3b2ff;
            --simple-colors-default-theme-indigo-12: #e5ddff;

            --simple-colors-default-theme-blue-1: #001333;
            --simple-colors-default-theme-blue-2: #001947;
            --simple-colors-default-theme-blue-3: #002569;
            --simple-colors-default-theme-blue-4: #003494;
            --simple-colors-default-theme-blue-5: #0041bb;
            --simple-colors-default-theme-blue-6: #0059ff;
            --simple-colors-default-theme-blue-7: #4083ff;
            --simple-colors-default-theme-blue-8: #5892fd;
            --simple-colors-default-theme-blue-9: #74a5ff;
            --simple-colors-default-theme-blue-10: #95baff;
            --simple-colors-default-theme-blue-11: #acc9ff;
            --simple-colors-default-theme-blue-12: #e2ecff;

            --simple-colors-default-theme-light-blue-1: #001b36;
            --simple-colors-default-theme-light-blue-2: #002850;
            --simple-colors-default-theme-light-blue-3: #003f7d;
            --simple-colors-default-theme-light-blue-4: #0055a8;
            --simple-colors-default-theme-light-blue-5: #0066ca;
            --simple-colors-default-theme-light-blue-6: #007ffc;
            --simple-colors-default-theme-light-blue-7: #41a1ff;
            --simple-colors-default-theme-light-blue-8: #58adff;
            --simple-colors-default-theme-light-blue-9: #65b3ff;
            --simple-colors-default-theme-light-blue-10: #92c9ff;
            --simple-colors-default-theme-light-blue-11: #a1d1ff;
            --simple-colors-default-theme-light-blue-12: #cde8ff;

            --simple-colors-default-theme-cyan-1: #001a20;
            --simple-colors-default-theme-cyan-2: #002c38;
            --simple-colors-default-theme-cyan-3: #003f50;
            --simple-colors-default-theme-cyan-4: #005970;
            --simple-colors-default-theme-cyan-5: #007999;
            --simple-colors-default-theme-cyan-6: #009dc7;
            --simple-colors-default-theme-cyan-7: #00c9ff;
            --simple-colors-default-theme-cyan-8: #1ccfff;
            --simple-colors-default-theme-cyan-9: #33d4ff;
            --simple-colors-default-theme-cyan-10: #77e2ff;
            --simple-colors-default-theme-cyan-11: #9beaff;
            --simple-colors-default-theme-cyan-12: #ddf8ff;

            --simple-colors-default-theme-teal-1: #001b14;
            --simple-colors-default-theme-teal-2: #002a20;
            --simple-colors-default-theme-teal-3: #003829;
            --simple-colors-default-theme-teal-4: #004e3a;
            --simple-colors-default-theme-teal-5: #007658;
            --simple-colors-default-theme-teal-6: #009d75;
            --simple-colors-default-theme-teal-7: #00ff9c;
            --simple-colors-default-theme-teal-8: #29ffac;
            --simple-colors-default-theme-teal-9: #56ffbd;
            --simple-colors-default-theme-teal-10: #79ffcb;
            --simple-colors-default-theme-teal-11: #98ffd7;
            --simple-colors-default-theme-teal-12: #d9fff0;

            --simple-colors-default-theme-green-1: #001d0c;
            --simple-colors-default-theme-green-2: #002a11;
            --simple-colors-default-theme-green-3: #003d18;
            --simple-colors-default-theme-green-4: #005a23;
            --simple-colors-default-theme-green-5: #00762e;
            --simple-colors-default-theme-green-6: #008c37;
            --simple-colors-default-theme-green-7: #00f961;
            --simple-colors-default-theme-green-8: #24ff70;
            --simple-colors-default-theme-green-9: #49ff88;
            --simple-colors-default-theme-green-10: #79ffa7;
            --simple-colors-default-theme-green-11: #acffc9;
            --simple-colors-default-theme-green-12: #e1ffeb;

            --simple-colors-default-theme-light-green-1: #0d2000;
            --simple-colors-default-theme-light-green-2: #143000;
            --simple-colors-default-theme-light-green-3: #1b3f00;
            --simple-colors-default-theme-light-green-4: #296100;
            --simple-colors-default-theme-light-green-5: #357f00;
            --simple-colors-default-theme-light-green-6: #429d00;
            --simple-colors-default-theme-light-green-7: #6fff00;
            --simple-colors-default-theme-light-green-8: #8efd38;
            --simple-colors-default-theme-light-green-9: #a1fd5a;
            --simple-colors-default-theme-light-green-10: #b1ff75;
            --simple-colors-default-theme-light-green-11: #c7ff9b;
            --simple-colors-default-theme-light-green-12: #ebffdb;

            --simple-colors-default-theme-lime-1: #182400;
            --simple-colors-default-theme-lime-2: #223400;
            --simple-colors-default-theme-lime-3: #293f00;
            --simple-colors-default-theme-lime-4: #3b5a00;
            --simple-colors-default-theme-lime-5: #4d7600;
            --simple-colors-default-theme-lime-6: #649900;
            --simple-colors-default-theme-lime-7: #aeff00;
            --simple-colors-default-theme-lime-8: #bdff2d;
            --simple-colors-default-theme-lime-9: #caff58;
            --simple-colors-default-theme-lime-10: #d4ff77;
            --simple-colors-default-theme-lime-11: #dfff9b;
            --simple-colors-default-theme-lime-12: #f1ffd2;

            --simple-colors-default-theme-yellow-1: #242400;
            --simple-colors-default-theme-yellow-2: #303000;
            --simple-colors-default-theme-yellow-3: #454400;
            --simple-colors-default-theme-yellow-4: #585700;
            --simple-colors-default-theme-yellow-5: #787700;
            --simple-colors-default-theme-yellow-6: #929100;
            --simple-colors-default-theme-yellow-7: #f6f600;
            --simple-colors-default-theme-yellow-8: #ffff3a;
            --simple-colors-default-theme-yellow-9: #ffff7c;
            --simple-colors-default-theme-yellow-10: #ffff90;
            --simple-colors-default-theme-yellow-11: #ffffac;
            --simple-colors-default-theme-yellow-12: #ffffd5;

            --simple-colors-default-theme-amber-1: #221a00;
            --simple-colors-default-theme-amber-2: #302500;
            --simple-colors-default-theme-amber-3: #413200;
            --simple-colors-default-theme-amber-4: #614b00;
            --simple-colors-default-theme-amber-5: #876800;
            --simple-colors-default-theme-amber-6: #b28900;
            --simple-colors-default-theme-amber-7: #ffc500;
            --simple-colors-default-theme-amber-8: #ffc235;
            --simple-colors-default-theme-amber-9: #ffcf5e;
            --simple-colors-default-theme-amber-10: #ffd677;
            --simple-colors-default-theme-amber-11: #ffdf92;
            --simple-colors-default-theme-amber-12: #fff2d4;

            --simple-colors-default-theme-orange-1: #2c1400;
            --simple-colors-default-theme-orange-2: #3d1c00;
            --simple-colors-default-theme-orange-3: #612d00;
            --simple-colors-default-theme-orange-4: #833d00;
            --simple-colors-default-theme-orange-5: #ae5100;
            --simple-colors-default-theme-orange-6: #e56a00;
            --simple-colors-default-theme-orange-7: #ff9625;
            --simple-colors-default-theme-orange-8: #ff9e36;
            --simple-colors-default-theme-orange-9: #ffb05c;
            --simple-colors-default-theme-orange-10: #ffbd75;
            --simple-colors-default-theme-orange-11: #ffca92;
            --simple-colors-default-theme-orange-12: #ffebd7;

            --simple-colors-default-theme-deep-orange-1: #240700;
            --simple-colors-default-theme-deep-orange-2: #3a0c00;
            --simple-colors-default-theme-deep-orange-3: #561100;
            --simple-colors-default-theme-deep-orange-4: #8a1c00;
            --simple-colors-default-theme-deep-orange-5: #b92500;
            --simple-colors-default-theme-deep-orange-6: #f53100;
            --simple-colors-default-theme-deep-orange-7: #ff6c3c;
            --simple-colors-default-theme-deep-orange-8: #ff7649;
            --simple-colors-default-theme-deep-orange-9: #ff8a64;
            --simple-colors-default-theme-deep-orange-10: #ffa588;
            --simple-colors-default-theme-deep-orange-11: #ffb299;
            --simple-colors-default-theme-deep-orange-12: #ffe7e0;

            --simple-colors-default-theme-brown-1: #200e09;
            --simple-colors-default-theme-brown-2: #2c140e;
            --simple-colors-default-theme-brown-3: #3b1e15;
            --simple-colors-default-theme-brown-4: #5b3328;
            --simple-colors-default-theme-brown-5: #724539;
            --simple-colors-default-theme-brown-6: #85574a;
            --simple-colors-default-theme-brown-7: #a47060;
            --simple-colors-default-theme-brown-8: #ac7868;
            --simple-colors-default-theme-brown-9: #b68373;
            --simple-colors-default-theme-brown-10: #c59485;
            --simple-colors-default-theme-brown-11: #e5b8aa;
            --simple-colors-default-theme-brown-12: #f0e2de;

            --simple-colors-default-theme-blue-grey-1: #0f1518;
            --simple-colors-default-theme-blue-grey-2: #182023;
            --simple-colors-default-theme-blue-grey-3: #1e282c;
            --simple-colors-default-theme-blue-grey-4: #2f3e45;
            --simple-colors-default-theme-blue-grey-5: #40535b;
            --simple-colors-default-theme-blue-grey-6: #56707c;
            --simple-colors-default-theme-blue-grey-7: #718892;
            --simple-colors-default-theme-blue-grey-8: #7a8f98;
            --simple-colors-default-theme-blue-grey-9: #8d9fa7;
            --simple-colors-default-theme-blue-grey-10: #9badb6;
            --simple-colors-default-theme-blue-grey-11: #b1c5ce;
            --simple-colors-default-theme-blue-grey-12: #e7eff1;
          }

          :host {
            accent-color: var(--simple-colors-default-theme-accent-7);
          }

          :host([accent-color="grey"]) {
            --simple-colors-default-theme-accent-1: #ffffff;
            --simple-colors-default-theme-accent-2: #eeeeee;
            --simple-colors-default-theme-accent-3: #dddddd;
            --simple-colors-default-theme-accent-4: #cccccc;
            --simple-colors-default-theme-accent-5: #bbbbbb;
            --simple-colors-default-theme-accent-6: #999999;
            --simple-colors-default-theme-accent-7: #666666;
            --simple-colors-default-theme-accent-8: #444444;
            --simple-colors-default-theme-accent-9: #333333;
            --simple-colors-default-theme-accent-10: #222222;
            --simple-colors-default-theme-accent-11: #111111;
            --simple-colors-default-theme-accent-12: #000000;
            --simple-colors-fixed-theme-accent-1: #ffffff;
            --simple-colors-fixed-theme-accent-2: #eeeeee;
            --simple-colors-fixed-theme-accent-3: #dddddd;
            --simple-colors-fixed-theme-accent-4: #cccccc;
            --simple-colors-fixed-theme-accent-5: #bbbbbb;
            --simple-colors-fixed-theme-accent-6: #999999;
            --simple-colors-fixed-theme-accent-7: #666666;
            --simple-colors-fixed-theme-accent-8: #444444;
            --simple-colors-fixed-theme-accent-9: #333333;
            --simple-colors-fixed-theme-accent-10: #222222;
            --simple-colors-fixed-theme-accent-11: #111111;
            --simple-colors-fixed-theme-accent-12: #000000;
          }

          :host([dark][accent-color="grey"]) {
            --simple-colors-default-theme-accent-1: #000000;
            --simple-colors-default-theme-accent-2: #111111;
            --simple-colors-default-theme-accent-3: #222222;
            --simple-colors-default-theme-accent-4: #333333;
            --simple-colors-default-theme-accent-5: #444444;
            --simple-colors-default-theme-accent-6: #666666;
            --simple-colors-default-theme-accent-7: #999999;
            --simple-colors-default-theme-accent-8: #bbbbbb;
            --simple-colors-default-theme-accent-9: #cccccc;
            --simple-colors-default-theme-accent-10: #dddddd;
            --simple-colors-default-theme-accent-11: #eeeeee;
            --simple-colors-default-theme-accent-12: #ffffff;
          }

          :host([accent-color="red"]) {
            --simple-colors-default-theme-accent-1: #ffdddd;
            --simple-colors-default-theme-accent-2: #ffaeae;
            --simple-colors-default-theme-accent-3: #ff8f8f;
            --simple-colors-default-theme-accent-4: #ff7474;
            --simple-colors-default-theme-accent-5: #fd5151;
            --simple-colors-default-theme-accent-6: #ff2222;
            --simple-colors-default-theme-accent-7: #ee0000;
            --simple-colors-default-theme-accent-8: #ac0000;
            --simple-colors-default-theme-accent-9: #850000;
            --simple-colors-default-theme-accent-10: #670000;
            --simple-colors-default-theme-accent-11: #520000;
            --simple-colors-default-theme-accent-12: #3f0000;
            --simple-colors-fixed-theme-accent-1: #ffdddd;
            --simple-colors-fixed-theme-accent-2: #ffaeae;
            --simple-colors-fixed-theme-accent-3: #ff8f8f;
            --simple-colors-fixed-theme-accent-4: #ff7474;
            --simple-colors-fixed-theme-accent-5: #fd5151;
            --simple-colors-fixed-theme-accent-6: #ff2222;
            --simple-colors-fixed-theme-accent-7: #ee0000;
            --simple-colors-fixed-theme-accent-8: #ac0000;
            --simple-colors-fixed-theme-accent-9: #850000;
            --simple-colors-fixed-theme-accent-10: #670000;
            --simple-colors-fixed-theme-accent-11: #520000;
            --simple-colors-fixed-theme-accent-12: #3f0000;
          }

          :host([dark][accent-color="red"]) {
            --simple-colors-default-theme-accent-1: #3f0000;
            --simple-colors-default-theme-accent-2: #520000;
            --simple-colors-default-theme-accent-3: #670000;
            --simple-colors-default-theme-accent-4: #850000;
            --simple-colors-default-theme-accent-5: #ac0000;
            --simple-colors-default-theme-accent-6: #ee0000;
            --simple-colors-default-theme-accent-7: #ff2222;
            --simple-colors-default-theme-accent-8: #fd5151;
            --simple-colors-default-theme-accent-9: #ff7474;
            --simple-colors-default-theme-accent-10: #ff8f8f;
            --simple-colors-default-theme-accent-11: #ffaeae;
            --simple-colors-default-theme-accent-12: #ffdddd;
          }

          :host([accent-color="pink"]) {
            --simple-colors-default-theme-accent-1: #ffe6f1;
            --simple-colors-default-theme-accent-2: #ffa5cf;
            --simple-colors-default-theme-accent-3: #ff87c0;
            --simple-colors-default-theme-accent-4: #ff73b5;
            --simple-colors-default-theme-accent-5: #fd60aa;
            --simple-colors-default-theme-accent-6: #ff3996;
            --simple-colors-default-theme-accent-7: #da004e;
            --simple-colors-default-theme-accent-8: #b80042;
            --simple-colors-default-theme-accent-9: #980036;
            --simple-colors-default-theme-accent-10: #78002b;
            --simple-colors-default-theme-accent-11: #5a0020;
            --simple-colors-default-theme-accent-12: #440019;
            --simple-colors-fixed-theme-accent-1: #ffe6f1;
            --simple-colors-fixed-theme-accent-2: #ffa5cf;
            --simple-colors-fixed-theme-accent-3: #ff87c0;
            --simple-colors-fixed-theme-accent-4: #ff73b5;
            --simple-colors-fixed-theme-accent-5: #fd60aa;
            --simple-colors-fixed-theme-accent-6: #ff3996;
            --simple-colors-fixed-theme-accent-7: #da004e;
            --simple-colors-fixed-theme-accent-8: #b80042;
            --simple-colors-fixed-theme-accent-9: #980036;
            --simple-colors-fixed-theme-accent-10: #78002b;
            --simple-colors-fixed-theme-accent-11: #5a0020;
            --simple-colors-fixed-theme-accent-12: #440019;
          }

          :host([dark][accent-color="pink"]) {
            --simple-colors-default-theme-accent-1: #440019;
            --simple-colors-default-theme-accent-2: #5a0020;
            --simple-colors-default-theme-accent-3: #78002b;
            --simple-colors-default-theme-accent-4: #980036;
            --simple-colors-default-theme-accent-5: #b80042;
            --simple-colors-default-theme-accent-6: #da004e;
            --simple-colors-default-theme-accent-7: #ff3996;
            --simple-colors-default-theme-accent-8: #fd60aa;
            --simple-colors-default-theme-accent-9: #ff73b5;
            --simple-colors-default-theme-accent-10: #ff87c0;
            --simple-colors-default-theme-accent-11: #ffa5cf;
            --simple-colors-default-theme-accent-12: #ffe6f1;
          }

          :host([accent-color="purple"]) {
            --simple-colors-default-theme-accent-1: #fce6ff;
            --simple-colors-default-theme-accent-2: #f4affd;
            --simple-colors-default-theme-accent-3: #f394ff;
            --simple-colors-default-theme-accent-4: #f07cff;
            --simple-colors-default-theme-accent-5: #ed61ff;
            --simple-colors-default-theme-accent-6: #e200ff;
            --simple-colors-default-theme-accent-7: #a500ba;
            --simple-colors-default-theme-accent-8: #8a009b;
            --simple-colors-default-theme-accent-9: #6c0079;
            --simple-colors-default-theme-accent-10: #490052;
            --simple-colors-default-theme-accent-11: #33003a;
            --simple-colors-default-theme-accent-12: #200025;
            --simple-colors-fixed-theme-accent-1: #fce6ff;
            --simple-colors-fixed-theme-accent-2: #f4affd;
            --simple-colors-fixed-theme-accent-3: #f394ff;
            --simple-colors-fixed-theme-accent-4: #f07cff;
            --simple-colors-fixed-theme-accent-5: #ed61ff;
            --simple-colors-fixed-theme-accent-6: #e200ff;
            --simple-colors-fixed-theme-accent-7: #a500ba;
            --simple-colors-fixed-theme-accent-8: #8a009b;
            --simple-colors-fixed-theme-accent-9: #6c0079;
            --simple-colors-fixed-theme-accent-10: #490052;
            --simple-colors-fixed-theme-accent-11: #33003a;
            --simple-colors-fixed-theme-accent-12: #200025;
          }

          :host([dark][accent-color="purple"]) {
            --simple-colors-default-theme-accent-1: #200025;
            --simple-colors-default-theme-accent-2: #33003a;
            --simple-colors-default-theme-accent-3: #490052;
            --simple-colors-default-theme-accent-4: #6c0079;
            --simple-colors-default-theme-accent-5: #8a009b;
            --simple-colors-default-theme-accent-6: #a500ba;
            --simple-colors-default-theme-accent-7: #e200ff;
            --simple-colors-default-theme-accent-8: #ed61ff;
            --simple-colors-default-theme-accent-9: #f07cff;
            --simple-colors-default-theme-accent-10: #f394ff;
            --simple-colors-default-theme-accent-11: #f4affd;
            --simple-colors-default-theme-accent-12: #fce6ff;
          }

          :host([accent-color="deep-purple"]) {
            --simple-colors-default-theme-accent-1: #f3e4ff;
            --simple-colors-default-theme-accent-2: #ddacff;
            --simple-colors-default-theme-accent-3: #c97eff;
            --simple-colors-default-theme-accent-4: #bb63f9;
            --simple-colors-default-theme-accent-5: #b44aff;
            --simple-colors-default-theme-accent-6: #a931ff;
            --simple-colors-default-theme-accent-7: #7e00d8;
            --simple-colors-default-theme-accent-8: #5d009f;
            --simple-colors-default-theme-accent-9: #4c0081;
            --simple-colors-default-theme-accent-10: #3a0063;
            --simple-colors-default-theme-accent-11: #2a0049;
            --simple-colors-default-theme-accent-12: #1d0033;
            --simple-colors-fixed-theme-accent-1: #f3e4ff;
            --simple-colors-fixed-theme-accent-2: #ddacff;
            --simple-colors-fixed-theme-accent-3: #c97eff;
            --simple-colors-fixed-theme-accent-4: #bb63f9;
            --simple-colors-fixed-theme-accent-5: #b44aff;
            --simple-colors-fixed-theme-accent-6: #a931ff;
            --simple-colors-fixed-theme-accent-7: #7e00d8;
            --simple-colors-fixed-theme-accent-8: #5d009f;
            --simple-colors-fixed-theme-accent-9: #4c0081;
            --simple-colors-fixed-theme-accent-10: #3a0063;
            --simple-colors-fixed-theme-accent-11: #2a0049;
            --simple-colors-fixed-theme-accent-12: #1d0033;
          }

          :host([dark][accent-color="deep-purple"]) {
            --simple-colors-default-theme-accent-1: #1d0033;
            --simple-colors-default-theme-accent-2: #2a0049;
            --simple-colors-default-theme-accent-3: #3a0063;
            --simple-colors-default-theme-accent-4: #4c0081;
            --simple-colors-default-theme-accent-5: #5d009f;
            --simple-colors-default-theme-accent-6: #7e00d8;
            --simple-colors-default-theme-accent-7: #a931ff;
            --simple-colors-default-theme-accent-8: #b44aff;
            --simple-colors-default-theme-accent-9: #bb63f9;
            --simple-colors-default-theme-accent-10: #c97eff;
            --simple-colors-default-theme-accent-11: #ddacff;
            --simple-colors-default-theme-accent-12: #f3e4ff;
          }

          :host([accent-color="indigo"]) {
            --simple-colors-default-theme-accent-1: #e5ddff;
            --simple-colors-default-theme-accent-2: #c3b2ff;
            --simple-colors-default-theme-accent-3: #af97ff;
            --simple-colors-default-theme-accent-4: #9e82ff;
            --simple-colors-default-theme-accent-5: #9373ff;
            --simple-colors-default-theme-accent-6: #835fff;
            --simple-colors-default-theme-accent-7: #3a00ff;
            --simple-colors-default-theme-accent-8: #2801b0;
            --simple-colors-default-theme-accent-9: #20008c;
            --simple-colors-default-theme-accent-10: #160063;
            --simple-colors-default-theme-accent-11: #100049;
            --simple-colors-default-theme-accent-12: #0a0030;
            --simple-colors-fixed-theme-accent-1: #e5ddff;
            --simple-colors-fixed-theme-accent-2: #c3b2ff;
            --simple-colors-fixed-theme-accent-3: #af97ff;
            --simple-colors-fixed-theme-accent-4: #9e82ff;
            --simple-colors-fixed-theme-accent-5: #9373ff;
            --simple-colors-fixed-theme-accent-6: #835fff;
            --simple-colors-fixed-theme-accent-7: #3a00ff;
            --simple-colors-fixed-theme-accent-8: #2801b0;
            --simple-colors-fixed-theme-accent-9: #20008c;
            --simple-colors-fixed-theme-accent-10: #160063;
            --simple-colors-fixed-theme-accent-11: #100049;
            --simple-colors-fixed-theme-accent-12: #0a0030;
          }

          :host([dark][accent-color="indigo"]) {
            --simple-colors-default-theme-accent-1: #0a0030;
            --simple-colors-default-theme-accent-2: #100049;
            --simple-colors-default-theme-accent-3: #160063;
            --simple-colors-default-theme-accent-4: #20008c;
            --simple-colors-default-theme-accent-5: #2801b0;
            --simple-colors-default-theme-accent-6: #3a00ff;
            --simple-colors-default-theme-accent-7: #835fff;
            --simple-colors-default-theme-accent-8: #9373ff;
            --simple-colors-default-theme-accent-9: #9e82ff;
            --simple-colors-default-theme-accent-10: #af97ff;
            --simple-colors-default-theme-accent-11: #c3b2ff;
            --simple-colors-default-theme-accent-12: #e5ddff;
          }

          :host([accent-color="blue"]) {
            --simple-colors-default-theme-accent-1: #e2ecff;
            --simple-colors-default-theme-accent-2: #acc9ff;
            --simple-colors-default-theme-accent-3: #95baff;
            --simple-colors-default-theme-accent-4: #74a5ff;
            --simple-colors-default-theme-accent-5: #5892fd;
            --simple-colors-default-theme-accent-6: #4083ff;
            --simple-colors-default-theme-accent-7: #0059ff;
            --simple-colors-default-theme-accent-8: #0041bb;
            --simple-colors-default-theme-accent-9: #003494;
            --simple-colors-default-theme-accent-10: #002569;
            --simple-colors-default-theme-accent-11: #001947;
            --simple-colors-default-theme-accent-12: #001333;
            --simple-colors-fixed-theme-accent-1: #e2ecff;
            --simple-colors-fixed-theme-accent-2: #acc9ff;
            --simple-colors-fixed-theme-accent-3: #95baff;
            --simple-colors-fixed-theme-accent-4: #74a5ff;
            --simple-colors-fixed-theme-accent-5: #5892fd;
            --simple-colors-fixed-theme-accent-6: #4083ff;
            --simple-colors-fixed-theme-accent-7: #0059ff;
            --simple-colors-fixed-theme-accent-8: #0041bb;
            --simple-colors-fixed-theme-accent-9: #003494;
            --simple-colors-fixed-theme-accent-10: #002569;
            --simple-colors-fixed-theme-accent-11: #001947;
            --simple-colors-fixed-theme-accent-12: #001333;
          }

          :host([dark][accent-color="blue"]) {
            --simple-colors-default-theme-accent-1: #001333;
            --simple-colors-default-theme-accent-2: #001947;
            --simple-colors-default-theme-accent-3: #002569;
            --simple-colors-default-theme-accent-4: #003494;
            --simple-colors-default-theme-accent-5: #0041bb;
            --simple-colors-default-theme-accent-6: #0059ff;
            --simple-colors-default-theme-accent-7: #4083ff;
            --simple-colors-default-theme-accent-8: #5892fd;
            --simple-colors-default-theme-accent-9: #74a5ff;
            --simple-colors-default-theme-accent-10: #95baff;
            --simple-colors-default-theme-accent-11: #acc9ff;
            --simple-colors-default-theme-accent-12: #e2ecff;
          }

          :host([accent-color="light-blue"]) {
            --simple-colors-default-theme-accent-1: #cde8ff;
            --simple-colors-default-theme-accent-2: #a1d1ff;
            --simple-colors-default-theme-accent-3: #92c9ff;
            --simple-colors-default-theme-accent-4: #65b3ff;
            --simple-colors-default-theme-accent-5: #58adff;
            --simple-colors-default-theme-accent-6: #41a1ff;
            --simple-colors-default-theme-accent-7: #007ffc;
            --simple-colors-default-theme-accent-8: #0066ca;
            --simple-colors-default-theme-accent-9: #0055a8;
            --simple-colors-default-theme-accent-10: #003f7d;
            --simple-colors-default-theme-accent-11: #002850;
            --simple-colors-default-theme-accent-12: #001b36;
            --simple-colors-fixed-theme-accent-1: #cde8ff;
            --simple-colors-fixed-theme-accent-2: #a1d1ff;
            --simple-colors-fixed-theme-accent-3: #92c9ff;
            --simple-colors-fixed-theme-accent-4: #65b3ff;
            --simple-colors-fixed-theme-accent-5: #58adff;
            --simple-colors-fixed-theme-accent-6: #41a1ff;
            --simple-colors-fixed-theme-accent-7: #007ffc;
            --simple-colors-fixed-theme-accent-8: #0066ca;
            --simple-colors-fixed-theme-accent-9: #0055a8;
            --simple-colors-fixed-theme-accent-10: #003f7d;
            --simple-colors-fixed-theme-accent-11: #002850;
            --simple-colors-fixed-theme-accent-12: #001b36;
          }

          :host([dark][accent-color="light-blue"]) {
            --simple-colors-default-theme-accent-1: #001b36;
            --simple-colors-default-theme-accent-2: #002850;
            --simple-colors-default-theme-accent-3: #003f7d;
            --simple-colors-default-theme-accent-4: #0055a8;
            --simple-colors-default-theme-accent-5: #0066ca;
            --simple-colors-default-theme-accent-6: #007ffc;
            --simple-colors-default-theme-accent-7: #41a1ff;
            --simple-colors-default-theme-accent-8: #58adff;
            --simple-colors-default-theme-accent-9: #65b3ff;
            --simple-colors-default-theme-accent-10: #92c9ff;
            --simple-colors-default-theme-accent-11: #a1d1ff;
            --simple-colors-default-theme-accent-12: #cde8ff;
          }

          :host([accent-color="cyan"]) {
            --simple-colors-default-theme-accent-1: #ddf8ff;
            --simple-colors-default-theme-accent-2: #9beaff;
            --simple-colors-default-theme-accent-3: #77e2ff;
            --simple-colors-default-theme-accent-4: #33d4ff;
            --simple-colors-default-theme-accent-5: #1ccfff;
            --simple-colors-default-theme-accent-6: #00c9ff;
            --simple-colors-default-theme-accent-7: #009dc7;
            --simple-colors-default-theme-accent-8: #007999;
            --simple-colors-default-theme-accent-9: #005970;
            --simple-colors-default-theme-accent-10: #003f50;
            --simple-colors-default-theme-accent-11: #002c38;
            --simple-colors-default-theme-accent-12: #001a20;
            --simple-colors-fixed-theme-accent-1: #ddf8ff;
            --simple-colors-fixed-theme-accent-2: #9beaff;
            --simple-colors-fixed-theme-accent-3: #77e2ff;
            --simple-colors-fixed-theme-accent-4: #33d4ff;
            --simple-colors-fixed-theme-accent-5: #1ccfff;
            --simple-colors-fixed-theme-accent-6: #00c9ff;
            --simple-colors-fixed-theme-accent-7: #009dc7;
            --simple-colors-fixed-theme-accent-8: #007999;
            --simple-colors-fixed-theme-accent-9: #005970;
            --simple-colors-fixed-theme-accent-10: #003f50;
            --simple-colors-fixed-theme-accent-11: #002c38;
            --simple-colors-fixed-theme-accent-12: #001a20;
          }

          :host([dark][accent-color="cyan"]) {
            --simple-colors-default-theme-accent-1: #001a20;
            --simple-colors-default-theme-accent-2: #002c38;
            --simple-colors-default-theme-accent-3: #003f50;
            --simple-colors-default-theme-accent-4: #005970;
            --simple-colors-default-theme-accent-5: #007999;
            --simple-colors-default-theme-accent-6: #009dc7;
            --simple-colors-default-theme-accent-7: #00c9ff;
            --simple-colors-default-theme-accent-8: #1ccfff;
            --simple-colors-default-theme-accent-9: #33d4ff;
            --simple-colors-default-theme-accent-10: #77e2ff;
            --simple-colors-default-theme-accent-11: #9beaff;
            --simple-colors-default-theme-accent-12: #ddf8ff;
          }

          :host([accent-color="teal"]) {
            --simple-colors-default-theme-accent-1: #d9fff0;
            --simple-colors-default-theme-accent-2: #98ffd7;
            --simple-colors-default-theme-accent-3: #79ffcb;
            --simple-colors-default-theme-accent-4: #56ffbd;
            --simple-colors-default-theme-accent-5: #29ffac;
            --simple-colors-default-theme-accent-6: #00ff9c;
            --simple-colors-default-theme-accent-7: #009d75;
            --simple-colors-default-theme-accent-8: #007658;
            --simple-colors-default-theme-accent-9: #004e3a;
            --simple-colors-default-theme-accent-10: #003829;
            --simple-colors-default-theme-accent-11: #002a20;
            --simple-colors-default-theme-accent-12: #001b14;
            --simple-colors-fixed-theme-accent-1: #d9fff0;
            --simple-colors-fixed-theme-accent-2: #98ffd7;
            --simple-colors-fixed-theme-accent-3: #79ffcb;
            --simple-colors-fixed-theme-accent-4: #56ffbd;
            --simple-colors-fixed-theme-accent-5: #29ffac;
            --simple-colors-fixed-theme-accent-6: #00ff9c;
            --simple-colors-fixed-theme-accent-7: #009d75;
            --simple-colors-fixed-theme-accent-8: #007658;
            --simple-colors-fixed-theme-accent-9: #004e3a;
            --simple-colors-fixed-theme-accent-10: #003829;
            --simple-colors-fixed-theme-accent-11: #002a20;
            --simple-colors-fixed-theme-accent-12: #001b14;
          }

          :host([dark][accent-color="teal"]) {
            --simple-colors-default-theme-accent-1: #001b14;
            --simple-colors-default-theme-accent-2: #002a20;
            --simple-colors-default-theme-accent-3: #003829;
            --simple-colors-default-theme-accent-4: #004e3a;
            --simple-colors-default-theme-accent-5: #007658;
            --simple-colors-default-theme-accent-6: #009d75;
            --simple-colors-default-theme-accent-7: #00ff9c;
            --simple-colors-default-theme-accent-8: #29ffac;
            --simple-colors-default-theme-accent-9: #56ffbd;
            --simple-colors-default-theme-accent-10: #79ffcb;
            --simple-colors-default-theme-accent-11: #98ffd7;
            --simple-colors-default-theme-accent-12: #d9fff0;
          }

          :host([accent-color="green"]) {
            --simple-colors-default-theme-accent-1: #e1ffeb;
            --simple-colors-default-theme-accent-2: #acffc9;
            --simple-colors-default-theme-accent-3: #79ffa7;
            --simple-colors-default-theme-accent-4: #49ff88;
            --simple-colors-default-theme-accent-5: #24ff70;
            --simple-colors-default-theme-accent-6: #00f961;
            --simple-colors-default-theme-accent-7: #008c37;
            --simple-colors-default-theme-accent-8: #00762e;
            --simple-colors-default-theme-accent-9: #005a23;
            --simple-colors-default-theme-accent-10: #003d18;
            --simple-colors-default-theme-accent-11: #002a11;
            --simple-colors-default-theme-accent-12: #001d0c;
            --simple-colors-fixed-theme-accent-1: #e1ffeb;
            --simple-colors-fixed-theme-accent-2: #acffc9;
            --simple-colors-fixed-theme-accent-3: #79ffa7;
            --simple-colors-fixed-theme-accent-4: #49ff88;
            --simple-colors-fixed-theme-accent-5: #24ff70;
            --simple-colors-fixed-theme-accent-6: #00f961;
            --simple-colors-fixed-theme-accent-7: #008c37;
            --simple-colors-fixed-theme-accent-8: #00762e;
            --simple-colors-fixed-theme-accent-9: #005a23;
            --simple-colors-fixed-theme-accent-10: #003d18;
            --simple-colors-fixed-theme-accent-11: #002a11;
            --simple-colors-fixed-theme-accent-12: #001d0c;
          }

          :host([dark][accent-color="green"]) {
            --simple-colors-default-theme-accent-1: #001d0c;
            --simple-colors-default-theme-accent-2: #002a11;
            --simple-colors-default-theme-accent-3: #003d18;
            --simple-colors-default-theme-accent-4: #005a23;
            --simple-colors-default-theme-accent-5: #00762e;
            --simple-colors-default-theme-accent-6: #008c37;
            --simple-colors-default-theme-accent-7: #00f961;
            --simple-colors-default-theme-accent-8: #24ff70;
            --simple-colors-default-theme-accent-9: #49ff88;
            --simple-colors-default-theme-accent-10: #79ffa7;
            --simple-colors-default-theme-accent-11: #acffc9;
            --simple-colors-default-theme-accent-12: #e1ffeb;
          }

          :host([accent-color="light-green"]) {
            --simple-colors-default-theme-accent-1: #ebffdb;
            --simple-colors-default-theme-accent-2: #c7ff9b;
            --simple-colors-default-theme-accent-3: #b1ff75;
            --simple-colors-default-theme-accent-4: #a1fd5a;
            --simple-colors-default-theme-accent-5: #8efd38;
            --simple-colors-default-theme-accent-6: #6fff00;
            --simple-colors-default-theme-accent-7: #429d00;
            --simple-colors-default-theme-accent-8: #357f00;
            --simple-colors-default-theme-accent-9: #296100;
            --simple-colors-default-theme-accent-10: #1b3f00;
            --simple-colors-default-theme-accent-11: #143000;
            --simple-colors-default-theme-accent-12: #0d2000;
            --simple-colors-fixed-theme-accent-1: #ebffdb;
            --simple-colors-fixed-theme-accent-2: #c7ff9b;
            --simple-colors-fixed-theme-accent-3: #b1ff75;
            --simple-colors-fixed-theme-accent-4: #a1fd5a;
            --simple-colors-fixed-theme-accent-5: #8efd38;
            --simple-colors-fixed-theme-accent-6: #6fff00;
            --simple-colors-fixed-theme-accent-7: #429d00;
            --simple-colors-fixed-theme-accent-8: #357f00;
            --simple-colors-fixed-theme-accent-9: #296100;
            --simple-colors-fixed-theme-accent-10: #1b3f00;
            --simple-colors-fixed-theme-accent-11: #143000;
            --simple-colors-fixed-theme-accent-12: #0d2000;
          }

          :host([dark][accent-color="light-green"]) {
            --simple-colors-default-theme-accent-1: #0d2000;
            --simple-colors-default-theme-accent-2: #143000;
            --simple-colors-default-theme-accent-3: #1b3f00;
            --simple-colors-default-theme-accent-4: #296100;
            --simple-colors-default-theme-accent-5: #357f00;
            --simple-colors-default-theme-accent-6: #429d00;
            --simple-colors-default-theme-accent-7: #6fff00;
            --simple-colors-default-theme-accent-8: #8efd38;
            --simple-colors-default-theme-accent-9: #a1fd5a;
            --simple-colors-default-theme-accent-10: #b1ff75;
            --simple-colors-default-theme-accent-11: #c7ff9b;
            --simple-colors-default-theme-accent-12: #ebffdb;
          }

          :host([accent-color="lime"]) {
            --simple-colors-default-theme-accent-1: #f1ffd2;
            --simple-colors-default-theme-accent-2: #dfff9b;
            --simple-colors-default-theme-accent-3: #d4ff77;
            --simple-colors-default-theme-accent-4: #caff58;
            --simple-colors-default-theme-accent-5: #bdff2d;
            --simple-colors-default-theme-accent-6: #aeff00;
            --simple-colors-default-theme-accent-7: #649900;
            --simple-colors-default-theme-accent-8: #4d7600;
            --simple-colors-default-theme-accent-9: #3b5a00;
            --simple-colors-default-theme-accent-10: #293f00;
            --simple-colors-default-theme-accent-11: #223400;
            --simple-colors-default-theme-accent-12: #182400;
            --simple-colors-fixed-theme-accent-1: #f1ffd2;
            --simple-colors-fixed-theme-accent-2: #dfff9b;
            --simple-colors-fixed-theme-accent-3: #d4ff77;
            --simple-colors-fixed-theme-accent-4: #caff58;
            --simple-colors-fixed-theme-accent-5: #bdff2d;
            --simple-colors-fixed-theme-accent-6: #aeff00;
            --simple-colors-fixed-theme-accent-7: #649900;
            --simple-colors-fixed-theme-accent-8: #4d7600;
            --simple-colors-fixed-theme-accent-9: #3b5a00;
            --simple-colors-fixed-theme-accent-10: #293f00;
            --simple-colors-fixed-theme-accent-11: #223400;
            --simple-colors-fixed-theme-accent-12: #182400;
          }

          :host([dark][accent-color="lime"]) {
            --simple-colors-default-theme-accent-1: #182400;
            --simple-colors-default-theme-accent-2: #223400;
            --simple-colors-default-theme-accent-3: #293f00;
            --simple-colors-default-theme-accent-4: #3b5a00;
            --simple-colors-default-theme-accent-5: #4d7600;
            --simple-colors-default-theme-accent-6: #649900;
            --simple-colors-default-theme-accent-7: #aeff00;
            --simple-colors-default-theme-accent-8: #bdff2d;
            --simple-colors-default-theme-accent-9: #caff58;
            --simple-colors-default-theme-accent-10: #d4ff77;
            --simple-colors-default-theme-accent-11: #dfff9b;
            --simple-colors-default-theme-accent-12: #f1ffd2;
          }

          :host([accent-color="yellow"]) {
            --simple-colors-default-theme-accent-1: #ffffd5;
            --simple-colors-default-theme-accent-2: #ffffac;
            --simple-colors-default-theme-accent-3: #ffff90;
            --simple-colors-default-theme-accent-4: #ffff7c;
            --simple-colors-default-theme-accent-5: #ffff3a;
            --simple-colors-default-theme-accent-6: #f6f600;
            --simple-colors-default-theme-accent-7: #929100;
            --simple-colors-default-theme-accent-8: #787700;
            --simple-colors-default-theme-accent-9: #585700;
            --simple-colors-default-theme-accent-10: #454400;
            --simple-colors-default-theme-accent-11: #303000;
            --simple-colors-default-theme-accent-12: #242400;
            --simple-colors-fixed-theme-accent-1: #ffffd5;
            --simple-colors-fixed-theme-accent-2: #ffffac;
            --simple-colors-fixed-theme-accent-3: #ffff90;
            --simple-colors-fixed-theme-accent-4: #ffff7c;
            --simple-colors-fixed-theme-accent-5: #ffff3a;
            --simple-colors-fixed-theme-accent-6: #f6f600;
            --simple-colors-fixed-theme-accent-7: #929100;
            --simple-colors-fixed-theme-accent-8: #787700;
            --simple-colors-fixed-theme-accent-9: #585700;
            --simple-colors-fixed-theme-accent-10: #454400;
            --simple-colors-fixed-theme-accent-11: #303000;
            --simple-colors-fixed-theme-accent-12: #242400;
          }

          :host([dark][accent-color="yellow"]) {
            --simple-colors-default-theme-accent-1: #242400;
            --simple-colors-default-theme-accent-2: #303000;
            --simple-colors-default-theme-accent-3: #454400;
            --simple-colors-default-theme-accent-4: #585700;
            --simple-colors-default-theme-accent-5: #787700;
            --simple-colors-default-theme-accent-6: #929100;
            --simple-colors-default-theme-accent-7: #f6f600;
            --simple-colors-default-theme-accent-8: #ffff3a;
            --simple-colors-default-theme-accent-9: #ffff7c;
            --simple-colors-default-theme-accent-10: #ffff90;
            --simple-colors-default-theme-accent-11: #ffffac;
            --simple-colors-default-theme-accent-12: #ffffd5;
          }

          :host([accent-color="amber"]) {
            --simple-colors-default-theme-accent-1: #fff2d4;
            --simple-colors-default-theme-accent-2: #ffdf92;
            --simple-colors-default-theme-accent-3: #ffd677;
            --simple-colors-default-theme-accent-4: #ffcf5e;
            --simple-colors-default-theme-accent-5: #ffc235;
            --simple-colors-default-theme-accent-6: #ffc500;
            --simple-colors-default-theme-accent-7: #b28900;
            --simple-colors-default-theme-accent-8: #876800;
            --simple-colors-default-theme-accent-9: #614b00;
            --simple-colors-default-theme-accent-10: #413200;
            --simple-colors-default-theme-accent-11: #302500;
            --simple-colors-default-theme-accent-12: #221a00;
            --simple-colors-fixed-theme-accent-1: #fff2d4;
            --simple-colors-fixed-theme-accent-2: #ffdf92;
            --simple-colors-fixed-theme-accent-3: #ffd677;
            --simple-colors-fixed-theme-accent-4: #ffcf5e;
            --simple-colors-fixed-theme-accent-5: #ffc235;
            --simple-colors-fixed-theme-accent-6: #ffc500;
            --simple-colors-fixed-theme-accent-7: #b28900;
            --simple-colors-fixed-theme-accent-8: #876800;
            --simple-colors-fixed-theme-accent-9: #614b00;
            --simple-colors-fixed-theme-accent-10: #413200;
            --simple-colors-fixed-theme-accent-11: #302500;
            --simple-colors-fixed-theme-accent-12: #221a00;
          }

          :host([dark][accent-color="amber"]) {
            --simple-colors-default-theme-accent-1: #221a00;
            --simple-colors-default-theme-accent-2: #302500;
            --simple-colors-default-theme-accent-3: #413200;
            --simple-colors-default-theme-accent-4: #614b00;
            --simple-colors-default-theme-accent-5: #876800;
            --simple-colors-default-theme-accent-6: #b28900;
            --simple-colors-default-theme-accent-7: #ffc500;
            --simple-colors-default-theme-accent-8: #ffc235;
            --simple-colors-default-theme-accent-9: #ffcf5e;
            --simple-colors-default-theme-accent-10: #ffd677;
            --simple-colors-default-theme-accent-11: #ffdf92;
            --simple-colors-default-theme-accent-12: #fff2d4;
          }

          :host([accent-color="orange"]) {
            --simple-colors-default-theme-accent-1: #ffebd7;
            --simple-colors-default-theme-accent-2: #ffca92;
            --simple-colors-default-theme-accent-3: #ffbd75;
            --simple-colors-default-theme-accent-4: #ffb05c;
            --simple-colors-default-theme-accent-5: #ff9e36;
            --simple-colors-default-theme-accent-6: #ff9625;
            --simple-colors-default-theme-accent-7: #e56a00;
            --simple-colors-default-theme-accent-8: #ae5100;
            --simple-colors-default-theme-accent-9: #833d00;
            --simple-colors-default-theme-accent-10: #612d00;
            --simple-colors-default-theme-accent-11: #3d1c00;
            --simple-colors-default-theme-accent-12: #2c1400;
            --simple-colors-fixed-theme-accent-1: #ffebd7;
            --simple-colors-fixed-theme-accent-2: #ffca92;
            --simple-colors-fixed-theme-accent-3: #ffbd75;
            --simple-colors-fixed-theme-accent-4: #ffb05c;
            --simple-colors-fixed-theme-accent-5: #ff9e36;
            --simple-colors-fixed-theme-accent-6: #ff9625;
            --simple-colors-fixed-theme-accent-7: #e56a00;
            --simple-colors-fixed-theme-accent-8: #ae5100;
            --simple-colors-fixed-theme-accent-9: #833d00;
            --simple-colors-fixed-theme-accent-10: #612d00;
            --simple-colors-fixed-theme-accent-11: #3d1c00;
            --simple-colors-fixed-theme-accent-12: #2c1400;
          }

          :host([dark][accent-color="orange"]) {
            --simple-colors-default-theme-accent-1: #2c1400;
            --simple-colors-default-theme-accent-2: #3d1c00;
            --simple-colors-default-theme-accent-3: #612d00;
            --simple-colors-default-theme-accent-4: #833d00;
            --simple-colors-default-theme-accent-5: #ae5100;
            --simple-colors-default-theme-accent-6: #e56a00;
            --simple-colors-default-theme-accent-7: #ff9625;
            --simple-colors-default-theme-accent-8: #ff9e36;
            --simple-colors-default-theme-accent-9: #ffb05c;
            --simple-colors-default-theme-accent-10: #ffbd75;
            --simple-colors-default-theme-accent-11: #ffca92;
            --simple-colors-default-theme-accent-12: #ffebd7;
          }

          :host([accent-color="deep-orange"]) {
            --simple-colors-default-theme-accent-1: #ffe7e0;
            --simple-colors-default-theme-accent-2: #ffb299;
            --simple-colors-default-theme-accent-3: #ffa588;
            --simple-colors-default-theme-accent-4: #ff8a64;
            --simple-colors-default-theme-accent-5: #ff7649;
            --simple-colors-default-theme-accent-6: #ff6c3c;
            --simple-colors-default-theme-accent-7: #f53100;
            --simple-colors-default-theme-accent-8: #b92500;
            --simple-colors-default-theme-accent-9: #8a1c00;
            --simple-colors-default-theme-accent-10: #561100;
            --simple-colors-default-theme-accent-11: #3a0c00;
            --simple-colors-default-theme-accent-12: #240700;
            --simple-colors-fixed-theme-accent-1: #ffe7e0;
            --simple-colors-fixed-theme-accent-2: #ffb299;
            --simple-colors-fixed-theme-accent-3: #ffa588;
            --simple-colors-fixed-theme-accent-4: #ff8a64;
            --simple-colors-fixed-theme-accent-5: #ff7649;
            --simple-colors-fixed-theme-accent-6: #ff6c3c;
            --simple-colors-fixed-theme-accent-7: #f53100;
            --simple-colors-fixed-theme-accent-8: #b92500;
            --simple-colors-fixed-theme-accent-9: #8a1c00;
            --simple-colors-fixed-theme-accent-10: #561100;
            --simple-colors-fixed-theme-accent-11: #3a0c00;
            --simple-colors-fixed-theme-accent-12: #240700;
          }

          :host([dark][accent-color="deep-orange"]) {
            --simple-colors-default-theme-accent-1: #240700;
            --simple-colors-default-theme-accent-2: #3a0c00;
            --simple-colors-default-theme-accent-3: #561100;
            --simple-colors-default-theme-accent-4: #8a1c00;
            --simple-colors-default-theme-accent-5: #b92500;
            --simple-colors-default-theme-accent-6: #f53100;
            --simple-colors-default-theme-accent-7: #ff6c3c;
            --simple-colors-default-theme-accent-8: #ff7649;
            --simple-colors-default-theme-accent-9: #ff8a64;
            --simple-colors-default-theme-accent-10: #ffa588;
            --simple-colors-default-theme-accent-11: #ffb299;
            --simple-colors-default-theme-accent-12: #ffe7e0;
          }

          :host([accent-color="brown"]) {
            --simple-colors-default-theme-accent-1: #f0e2de;
            --simple-colors-default-theme-accent-2: #e5b8aa;
            --simple-colors-default-theme-accent-3: #c59485;
            --simple-colors-default-theme-accent-4: #b68373;
            --simple-colors-default-theme-accent-5: #ac7868;
            --simple-colors-default-theme-accent-6: #a47060;
            --simple-colors-default-theme-accent-7: #85574a;
            --simple-colors-default-theme-accent-8: #724539;
            --simple-colors-default-theme-accent-9: #5b3328;
            --simple-colors-default-theme-accent-10: #3b1e15;
            --simple-colors-default-theme-accent-11: #2c140e;
            --simple-colors-default-theme-accent-12: #200e09;
            --simple-colors-fixed-theme-accent-1: #f0e2de;
            --simple-colors-fixed-theme-accent-2: #e5b8aa;
            --simple-colors-fixed-theme-accent-3: #c59485;
            --simple-colors-fixed-theme-accent-4: #b68373;
            --simple-colors-fixed-theme-accent-5: #ac7868;
            --simple-colors-fixed-theme-accent-6: #a47060;
            --simple-colors-fixed-theme-accent-7: #85574a;
            --simple-colors-fixed-theme-accent-8: #724539;
            --simple-colors-fixed-theme-accent-9: #5b3328;
            --simple-colors-fixed-theme-accent-10: #3b1e15;
            --simple-colors-fixed-theme-accent-11: #2c140e;
            --simple-colors-fixed-theme-accent-12: #200e09;
          }

          :host([dark][accent-color="brown"]) {
            --simple-colors-default-theme-accent-1: #200e09;
            --simple-colors-default-theme-accent-2: #2c140e;
            --simple-colors-default-theme-accent-3: #3b1e15;
            --simple-colors-default-theme-accent-4: #5b3328;
            --simple-colors-default-theme-accent-5: #724539;
            --simple-colors-default-theme-accent-6: #85574a;
            --simple-colors-default-theme-accent-7: #a47060;
            --simple-colors-default-theme-accent-8: #ac7868;
            --simple-colors-default-theme-accent-9: #b68373;
            --simple-colors-default-theme-accent-10: #c59485;
            --simple-colors-default-theme-accent-11: #e5b8aa;
            --simple-colors-default-theme-accent-12: #f0e2de;
          }

          :host([accent-color="blue-grey"]) {
            --simple-colors-default-theme-accent-1: #e7eff1;
            --simple-colors-default-theme-accent-2: #b1c5ce;
            --simple-colors-default-theme-accent-3: #9badb6;
            --simple-colors-default-theme-accent-4: #8d9fa7;
            --simple-colors-default-theme-accent-5: #7a8f98;
            --simple-colors-default-theme-accent-6: #718892;
            --simple-colors-default-theme-accent-7: #56707c;
            --simple-colors-default-theme-accent-8: #40535b;
            --simple-colors-default-theme-accent-9: #2f3e45;
            --simple-colors-default-theme-accent-10: #1e282c;
            --simple-colors-default-theme-accent-11: #182023;
            --simple-colors-default-theme-accent-12: #0f1518;
            --simple-colors-fixed-theme-accent-1: #e7eff1;
            --simple-colors-fixed-theme-accent-2: #b1c5ce;
            --simple-colors-fixed-theme-accent-3: #9badb6;
            --simple-colors-fixed-theme-accent-4: #8d9fa7;
            --simple-colors-fixed-theme-accent-5: #7a8f98;
            --simple-colors-fixed-theme-accent-6: #718892;
            --simple-colors-fixed-theme-accent-7: #56707c;
            --simple-colors-fixed-theme-accent-8: #40535b;
            --simple-colors-fixed-theme-accent-9: #2f3e45;
            --simple-colors-fixed-theme-accent-10: #1e282c;
            --simple-colors-fixed-theme-accent-11: #182023;
            --simple-colors-fixed-theme-accent-12: #0f1518;
          }

          :host([dark][accent-color="blue-grey"]) {
            --simple-colors-default-theme-accent-1: #0f1518;
            --simple-colors-default-theme-accent-2: #182023;
            --simple-colors-default-theme-accent-3: #1e282c;
            --simple-colors-default-theme-accent-4: #2f3e45;
            --simple-colors-default-theme-accent-5: #40535b;
            --simple-colors-default-theme-accent-6: #56707c;
            --simple-colors-default-theme-accent-7: #718892;
            --simple-colors-default-theme-accent-8: #7a8f98;
            --simple-colors-default-theme-accent-9: #8d9fa7;
            --simple-colors-default-theme-accent-10: #9badb6;
            --simple-colors-default-theme-accent-11: #b1c5ce;
            --simple-colors-default-theme-accent-12: #e7eff1;
          }

          /* from a11y-utils */
          .sr-only {
            position: absolute;
            left: -10000px;
            top: auto;
            width: 1px;
            height: 1px;
            overflow: hidden;
          }
        `,
      ];
    }

    // render function
    render() {
      return x` <slot></slot>`;
    }

    // properties available to the custom element for data binding
    static get properties() {
      return {
        ...super.properties,

        /**
         * a selected accent-"color": grey, red, pink, purple, etc.
         */
        accentColor: {
          attribute: "accent-color",
          type: String,
          reflect: true,
        },
        /**
         * make the default theme dark?
         */
        dark: {
          name: "dark",
          type: Boolean,
          reflect: true,
        },
      };
    }

    constructor() {
      super();
      this.accentColor = "grey";
      this.dark = false;
      this.colors = SimpleColorsSharedStylesGlobal.colors;
    }

    static get tag() {
      return "simple-colors";
    }

    /**
     * gets the current shade
     *
     * @param {string} the shade
     * @param {number} the inverted shade
     */
    invertShade(shade) {
      return SimpleColorsSharedStylesGlobal.invertShade(shade);
    }

    /**
     * gets the color information of a given CSS variable or class
     *
     * @param {string} the CSS variable (eg. `--simple-colors-fixed-theme-red-3`) or a class (eg. `.simple-colors-fixed-theme-red-3-text`)
     * @param {object} an object that includes the theme, color, and shade information
     */
    getColorInfo(colorName) {
      return SimpleColorsSharedStylesGlobal.getColorInfo(colorName);
    }

    /**
     * returns a variable based on color name, shade, and fixed theme
     *
     * @param {string} the color name
     * @param {number} the color shade
     * @param {boolean} the color shade
     * @returns {string} the CSS Variable
     */
    makeVariable(color = "grey", shade = 1, theme = "default") {
      return SimpleColorsSharedStylesGlobal.makeVariable(
        (color = "grey"),
        (shade = 1),
        (theme = "default"),
      );
    }

    /**
     * for large or small text given a color and its shade,
     * lists all the colors and shades that would be
     * WCAG 2.0 AA-compliant for contrast
     *
     * @param {boolean} large text? >= 18pt || (bold && >= 14pt)
     * @param {string} color name, e.g. "deep-purple"
     * @param {string} color shade, e.g. 3
     * @param {object} all of the WCAG 2.0 AA-compliant colors and shades
     */
    getContrastingColors(colorName, colorShade, isLarge) {
      return SimpleColorsSharedStylesGlobal.getContrastingColors(
        colorName,
        colorShade,
        isLarge,
      );
    }

    /**
     * for large or small text given a color and its shade,
     * lists all the shades of another color that would be
     * WCAG 2.0 AA-compliant for contrast
     *
     * @param {boolean} large text? >= 18pt || (bold && >= 14pt)
     * @param {string} color name, e.g. "deep-purple"
     * @param {string} color shade, e.g. 3
     * @param {string} contrasting color name, e.g. "grey"
     * @param {array} all of the WCAG 2.0 AA-compliant shades of the contrasting color
     */
    getContrastingShades(isLarge, colorName, colorShade, contrastName) {
      return SimpleColorsSharedStylesGlobal.getContrastingShades(
        isLarge,
        colorName,
        colorShade,
        contrastName,
      );
    }

    /**
     * determines if two shades are WCAG 2.0 AA-compliant for contrast
     *
     * @param {boolean} large text? >= 18pt || (bold && >= 14pt)
     * @param {string} color name, e.g. "deep-purple"
     * @param {string} color shade, e.g. 3
     * @param {string} contrasting color name, e.g. "grey"
     * @param {string} contrast shade, e.g. 12
     * @param {boolean} whether or not the contrasting shade is WCAG 2.0 AA-compliant
     */
    isContrastCompliant(
      isLarge,
      colorName,
      colorShade,
      contrastName,
      contrastShade,
    ) {
      return SimpleColorsSharedStylesGlobal.isContrastCompliant(
        isLarge,
        colorName,
        colorShade,
        contrastName,
        contrastShade,
      );
    }
  };
};
/**
  * `simple-colors`
  * a shared set of styles for `@haxtheweb`
 ### Styling
 See demo of "all of the colors" (`demo/colors.html`) for styling.
  *
 
  * @demo ./demo/index.html demo
  * @demo ./demo/how.html getting started
  * @demo ./demo/colors.html all of the colors
  * @demo ./demo/picker.html simple-colors-picker
  * @demo ./demo/extending.html extending simple-colors
  * @element simple-colors
  */
class SimpleColors extends SimpleColorsSuper(s) {}
customElements.define(SimpleColors.tag, SimpleColors);

/**
 * Singleton to manage iconsets
 * @demo demo/index.html
 */
// polyfill for replaceAll, I hate you Safari / really old stuff
if (!String.prototype.replaceAll) {
  String.prototype.replaceAll = function (find, replace) {
    return this.split(find).join(replace);
  };
}
/**
 *
 * @class SimpleIconset
 * @extends HTMLElement
 */
class SimpleIconset extends HTMLElement {
  static get tag() {
    return "simple-iconset";
  }
  constructor() {
    super();
    this.iconsets = {};
    this.iconlist = [];
    this.manifest = {};
    this.needsHydrated = [];
  }
  /**
   * Manifest.js files can register themselves to create an icon list.
   * These files export an array of iconsets
   * as [{name: iconsetName, icons: [ iconName,iconName2 ]}]
   *
   * @param {array} manifest array of iconsets
   * @memberof SimpleIconset
   */
  registerManifest(manifest) {
    (manifest || []).forEach((iconset) => {
      if (!this.manifest[iconset.name]) {
        this.manifest[iconset.name] = iconset.icons || [];
        this.manifest[iconset.name].forEach((icon) => {
          this.iconlist.push(`${iconset.name}:${icon}`);
        });
      }
    });
  }
  /**
   * Iconsets are to register a namespace in either manner:
   * object notation: key name of the icon with a specific path to the file
   * {
   *   icon: iconLocation,
   *   icon2: iconLocation2
   * }
   * string notation: assumes icon name can be found at ${iconLocationBasePath}${iconname}.svg
   * iconLocationBasePath
   */
  registerIconset(name, icons = {}) {
    if (typeof icons === "object") {
      this.iconsets[name] = { ...icons };
    } else if (typeof icons === "string") {
      this.iconsets[name] = icons;
    }
    // try processing anything that might have missed previously
    if (this.needsHydrated.length > 0) {
      let list = [];
      this.needsHydrated.forEach((item, index) => {
        // set the src from interns of the icon, returns if it matched
        // which will then push it into the list to be removed from processing
        if (
          typeof item.setSrcByIcon === "function" &&
          item.setSrcByIcon(this)
        ) {
          list.push(index);
        }
      });
      // process in reverse order to avoid key splicing issues
      list.reverse().forEach((val) => {
        this.needsHydrated.splice(val, 1);
      });
    }
  }
  /**
   * return the icon location on splitting the string on : for position in the object
   * if the icon doesn't exist, it sets a value for future updates in the event
   * that the library for the icon registers AFTER the request to visualize is made
   */
  getIcon(val, context) {
    let ary = val.replaceAll("/", "-").split(":");
    // legacy API used to fill in icons: for lazy devs so let's mirror
    if (ary.length === 1) {
      ary = ["icons", val];
    }
    if (ary.length == 2 && this.iconsets[ary[0]]) {
      if (
        typeof this.iconsets[ary[0]] !== "string" &&
        this.iconsets[ary[0]][ary[1]] &&
        typeof this.iconsets[ary[0]][ary[1]] !== "function"
      ) {
        return this.iconsets[ary[0]][ary[1]];
      } else if (ary[1]) {
        return `${this.iconsets[ary[0]]}${ary[1]}.svg`;
      }
    }
    // if we get here we just missed on the icon hydrating which means
    // either it's an invalid icon OR the library to register the icons
    // location will import AFTER (possible microtiming early on)
    // also weird looking by context is either the element asking about
    // itself OR the the iconset state manager checking for hydration
    if (context !== this && context) {
      this.needsHydrated.push(context);
    }
    return null;
  }
}

customElements.define(SimpleIconset.tag, SimpleIconset);

globalThis.SimpleIconset = globalThis.SimpleIconset || {};
/**
 * Checks to see if there is an instance available, and if not appends one
 */
globalThis.SimpleIconset.requestAvailability = () => {
  if (globalThis.SimpleIconset.instance == null && globalThis.document) {
    globalThis.SimpleIconset.instance =
      globalThis.document.createElement("simple-iconset");
    globalThis.document.body.appendChild(globalThis.SimpleIconset.instance);
  }
  return globalThis.SimpleIconset.instance;
};
// self request so that when this file is referenced it exists in the dom
const SimpleIconsetStore =
  typeof global !== "undefined"
    ? new SimpleIconset()
    : globalThis.SimpleIconset.requestAvailability();

/**
 * @const SimpleIconIconsetsManifest
 */
const SimpleIconIconsetsManifest = [
  {
    name: "av",
    icons: [
      "add-to-queue",
      "airplay",
      "album",
      "art-track",
      "av-timer",
      "branding-watermark",
      "call-to-action",
      "closed-caption",
      "equalizer",
      "explicit",
      "fast-forward",
      "fast-rewind",
      "featured-play-list",
      "featured-video",
      "fiber-dvr",
      "fiber-manual-record",
      "fiber-new",
      "fiber-pin",
      "fiber-smart-record",
      "forward-10",
      "forward-30",
      "forward-5",
      "games",
      "hd",
      "hearing",
      "high-quality",
      "library-add",
      "library-books",
      "library-music",
      "loop",
      "mic-none",
      "mic-off",
      "mic",
      "movie",
      "music-video",
      "new-releases",
      "not-interested",
      "note",
      "pause-circle-filled",
      "pause-circle-outline",
      "pause",
      "play-arrow",
      "play-circle-filled",
      "play-circle-outline",
      "playlist-add-check",
      "playlist-add",
      "playlist-play",
      "queue-music",
      "queue-play-next",
      "queue",
      "radio",
      "recent-actors",
      "remove-from-queue",
      "repeat-one",
      "repeat",
      "replay-10",
      "replay-30",
      "replay-5",
      "replay",
      "shuffle",
      "skip-next",
      "skip-previous",
      "slow-motion-video",
      "snooze",
      "sort-by-alpha",
      "stop",
      "subscriptions",
      "subtitles",
      "surround-sound",
      "video-call",
      "video-label",
      "video-library",
      "videocam-off",
      "videocam",
      "volume-down",
      "volume-mute",
      "volume-off",
      "volume-up",
      "web-asset",
      "web",
    ],
  },
  {
    name: "communication",
    icons: [
      "business",
      "call-end",
      "call-made",
      "call-merge",
      "call-missed-outgoing",
      "call-missed",
      "call-received",
      "call-split",
      "call",
      "chat-bubble-outline",
      "chat-bubble",
      "chat",
      "clear-all",
      "comment",
      "contact-mail",
      "contact-phone",
      "contacts",
      "dialer-sip",
      "dialpad",
      "email",
      "forum",
      "import-contacts",
      "import-export",
      "invert-colors-off",
      "live-help",
      "location-off",
      "location-on",
      "mail-outline",
      "message",
      "no-sim",
      "phone",
      "phonelink-erase",
      "phonelink-lock",
      "phonelink-ring",
      "phonelink-setup",
      "portable-wifi-off",
      "present-to-all",
      "ring-volume",
      "rss-feed",
      "screen-share",
      "speaker-phone",
      "stay-current-landscape",
      "stay-current-portrait",
      "stay-primary-landscape",
      "stay-primary-portrait",
      "stop-screen-share",
      "swap-calls",
      "textsms",
      "voicemail",
      "vpn-key",
    ],
  },
  {
    name: "device",
    icons: [
      "access-alarm",
      "access-alarms",
      "access-time",
      "add-alarm",
      "airplanemode-active",
      "airplanemode-inactive",
      "battery-20",
      "battery-30",
      "battery-50",
      "battery-60",
      "battery-80",
      "battery-90",
      "battery-alert",
      "battery-charging-20",
      "battery-charging-30",
      "battery-charging-50",
      "battery-charging-60",
      "battery-charging-80",
      "battery-charging-90",
      "battery-charging-full",
      "battery-full",
      "battery-std",
      "battery-unknown",
      "bluetooth-connected",
      "bluetooth-disabled",
      "bluetooth-searching",
      "bluetooth",
      "brightness-auto",
      "brightness-high",
      "brightness-low",
      "brightness-medium",
      "data-usage",
      "developer-mode",
      "devices",
      "dvr",
      "gps-fixed",
      "gps-not-fixed",
      "gps-off",
      "graphic-eq",
      "location-disabled",
      "location-searching",
      "network-cell",
      "network-wifi",
      "nfc",
      "screen-lock-landscape",
      "screen-lock-portrait",
      "screen-lock-rotation",
      "screen-rotation",
      "sd-storage",
      "settings-system-daydream",
      "signal-cellular-0-bar",
      "signal-cellular-1-bar",
      "signal-cellular-2-bar",
      "signal-cellular-3-bar",
      "signal-cellular-4-bar",
      "signal-cellular-connected-no-internet-0-bar",
      "signal-cellular-connected-no-internet-1-bar",
      "signal-cellular-connected-no-internet-2-bar",
      "signal-cellular-connected-no-internet-3-bar",
      "signal-cellular-connected-no-internet-4-bar",
      "signal-cellular-no-sim",
      "signal-cellular-null",
      "signal-cellular-off",
      "signal-wifi-0-bar",
      "signal-wifi-1-bar-lock",
      "signal-wifi-1-bar",
      "signal-wifi-2-bar-lock",
      "signal-wifi-2-bar",
      "signal-wifi-3-bar-lock",
      "signal-wifi-3-bar",
      "signal-wifi-4-bar-lock",
      "signal-wifi-4-bar",
      "signal-wifi-off",
      "storage",
      "usb",
      "wallpaper",
      "widgets",
      "wifi-lock",
      "wifi-tethering",
    ],
  },
  {
    name: "editor",
    icons: [
      "attach-file",
      "attach-money",
      "border-all",
      "border-bottom",
      "border-clear",
      "border-color",
      "border-horizontal",
      "border-inner",
      "border-left",
      "border-outer",
      "border-right",
      "border-style",
      "border-top",
      "border-vertical",
      "bubble-chart",
      "drag-handle",
      "format-align-center",
      "format-align-justify",
      "format-align-left",
      "format-align-right",
      "format-bold",
      "format-clear",
      "format-color-fill",
      "format-color-reset",
      "format-color-text",
      "format-indent-decrease",
      "format-indent-increase",
      "format-italic",
      "format-line-spacing",
      "format-list-bulleted",
      "format-list-numbered",
      "format-page-break",
      "format-paint",
      "format-quote",
      "format-shapes",
      "format-size",
      "format-strikethrough",
      "format-textdirection-l-to-r",
      "format-textdirection-r-to-l",
      "format-underlined",
      "functions",
      "highlight",
      "insert-chart",
      "insert-comment",
      "insert-drive-file",
      "insert-emoticon",
      "insert-invitation",
      "insert-link",
      "insert-photo",
      "linear-scale",
      "merge-type",
      "mode-comment",
      "mode-edit",
      "monetization-on",
      "money-off",
      "multiline-chart",
      "pie-chart-outlined",
      "pie-chart",
      "publish",
      "short-text",
      "show-chart",
      "space-bar",
      "strikethrough-s",
      "text-fields",
      "title",
      "vertical-align-bottom",
      "vertical-align-center",
      "vertical-align-top",
      "wrap-text",
    ],
  },
  {
    name: "elmsln-custom",
    icons: [],
  },
  {
    name: "hardware",
    icons: [
      "cast-connected",
      "cast",
      "computer",
      "desktop-mac",
      "desktop-windows",
      "developer-board",
      "device-hub",
      "devices-other",
      "dock",
      "gamepad",
      "headset-mic",
      "headset",
      "keyboard-arrow-down",
      "keyboard-arrow-left",
      "keyboard-arrow-right",
      "keyboard-arrow-up",
      "keyboard-backspace",
      "keyboard-capslock",
      "keyboard-hide",
      "keyboard-return",
      "keyboard-tab",
      "keyboard-voice",
      "keyboard",
      "laptop-chromebook",
      "laptop-mac",
      "laptop-windows",
      "laptop",
      "memory",
      "mouse",
      "phone-android",
      "phone-iphone",
      "phonelink-off",
      "phonelink",
      "power-input",
      "router",
      "scanner",
      "security",
      "sim-card",
      "smartphone",
      "speaker-group",
      "speaker",
      "tablet-android",
      "tablet-mac",
      "tablet",
      "toys",
      "tv",
      "videogame-asset",
      "watch",
    ],
  },
  {
    name: "icons",
    icons: [
      "3d-rotation",
      "accessibility",
      "accessible",
      "account-balance-wallet",
      "account-balance",
      "account-box",
      "account-circle",
      "add-alert",
      "add-box",
      "add-circle-outline",
      "add-circle",
      "add-shopping-cart",
      "add",
      "alarm-add",
      "alarm-off",
      "alarm-on",
      "alarm",
      "all-out",
      "android",
      "announcement",
      "apps",
      "archive",
      "arrow-back",
      "arrow-downward",
      "arrow-drop-down-circle",
      "arrow-drop-down",
      "arrow-drop-up",
      "arrow-forward",
      "arrow-upward",
      "aspect-ratio",
      "assessment",
      "assignment-ind",
      "assignment-late",
      "assignment-return",
      "assignment-returned",
      "assignment-turned-in",
      "assignment",
      "attachment",
      "autorenew",
      "backspace",
      "backup",
      "block",
      "book",
      "bookmark-border",
      "bookmark",
      "bug-report",
      "build",
      "cached",
      "camera-enhance",
      "cancel",
      "card-giftcard",
      "card-membership",
      "card-travel",
      "change-history",
      "check-box-outline-blank",
      "check-box",
      "check-circle",
      "check",
      "chevron-left",
      "chevron-right",
      "chrome-reader-mode",
      "class",
      "clear",
      "close",
      "cloud-circle",
      "cloud-done",
      "cloud-download",
      "cloud-off",
      "cloud-queue",
      "cloud-upload",
      "cloud",
      "code",
      "compare-arrows",
      "content-copy",
      "content-cut",
      "content-paste",
      "copyright",
      "create-new-folder",
      "create",
      "credit-card",
      "dashboard",
      "date-range",
      "delete-forever",
      "delete-sweep",
      "delete",
      "description",
      "dns",
      "done-all",
      "done",
      "donut-large",
      "donut-small",
      "drafts",
      "eject",
      "error-outline",
      "error",
      "euro-symbol",
      "event-seat",
      "event",
      "exit-to-app",
      "expand-less",
      "expand-more",
      "explore",
      "extension",
      "face",
      "favorite-border",
      "favorite",
      "feedback",
      "file-download",
      "file-upload",
      "filter-list",
      "find-in-page",
      "find-replace",
      "fingerprint",
      "first-page",
      "flag",
      "flight-land",
      "flight-takeoff",
      "flip-to-back",
      "flip-to-front",
      "folder-open",
      "folder-shared",
      "folder",
      "font-download",
      "forward",
      "fullscreen-exit",
      "fullscreen",
      "g-translate",
      "gavel",
      "gesture",
      "get-app",
      "gif",
      "grade",
      "group-work",
      "help-outline",
      "help",
      "highlight-off",
      "history",
      "home",
      "hourglass-empty",
      "hourglass-full",
      "http",
      "https",
      "important-devices",
      "inbox",
      "indeterminate-check-box",
      "info-outline",
      "info",
      "input",
      "invert-colors",
      "label-outline",
      "label",
      "language",
      "last-page",
      "launch",
      "lightbulb-outline",
      "line-style",
      "line-weight",
      "link",
      "list",
      "lock-open",
      "lock-outline",
      "lock",
      "low-priority",
      "loyalty",
      "mail",
      "markunread-mailbox",
      "markunread",
      "menu",
      "more-horiz",
      "more-vert",
      "motorcycle",
      "move-to-inbox",
      "next-week",
      "note-add",
      "offline-pin",
      "opacity",
      "open-in-browser",
      "open-in-new",
      "open-with",
      "pageview",
      "pan-tool",
      "payment",
      "perm-camera-mic",
      "perm-contact-calendar",
      "perm-data-setting",
      "perm-device-information",
      "perm-identity",
      "perm-media",
      "perm-phone-msg",
      "perm-scan-wifi",
      "pets",
      "picture-in-picture-alt",
      "picture-in-picture",
      "play-for-work",
      "polymer",
      "power-settings-new",
      "pregnant-woman",
      "print",
      "query-builder",
      "question-answer",
      "radio-button-checked",
      "radio-button-unchecked",
      "receipt",
      "record-voice-over",
      "redeem",
      "redo",
      "refresh",
      "remove-circle-outline",
      "remove-circle",
      "remove-shopping-cart",
      "remove",
      "reorder",
      "reply-all",
      "reply",
      "report-problem",
      "report",
      "restore-page",
      "restore",
      "room",
      "rounded-corner",
      "rowing",
      "save",
      "schedule",
      "search",
      "select-all",
      "send",
      "settings-applications",
      "settings-backup-restore",
      "settings-bluetooth",
      "settings-brightness",
      "settings-cell",
      "settings-ethernet",
      "settings-input-antenna",
      "settings-input-component",
      "settings-input-composite",
      "settings-input-hdmi",
      "settings-input-svideo",
      "settings-overscan",
      "settings-phone",
      "settings-power",
      "settings-remote",
      "settings-voice",
      "settings",
      "shop-two",
      "shop",
      "shopping-basket",
      "shopping-cart",
      "sort",
      "speaker-notes-off",
      "speaker-notes",
      "spellcheck",
      "star-border",
      "star-half",
      "star",
      "stars",
      "store",
      "subdirectory-arrow-left",
      "subdirectory-arrow-right",
      "subject",
      "supervisor-account",
      "swap-horiz",
      "swap-vert",
      "swap-vertical-circle",
      "system-update-alt",
      "tab-unselected",
      "tab",
      "text-format",
      "theaters",
      "thumb-down",
      "thumb-up",
      "thumbs-up-down",
      "timeline",
      "toc",
      "today",
      "toll",
      "touch-app",
      "track-changes",
      "translate",
      "trending-down",
      "trending-flat",
      "trending-up",
      "turned-in-not",
      "turned-in",
      "unarchive",
      "undo",
      "unfold-less",
      "unfold-more",
      "update",
      "verified-user",
      "view-agenda",
      "view-array",
      "view-carousel",
      "view-column",
      "view-day",
      "view-headline",
      "view-list",
      "view-module",
      "view-quilt",
      "view-stream",
      "view-week",
      "visibility-off",
      "visibility",
      "warning",
      "watch-later",
      "weekend",
      "work",
      "youtube-searched-for",
      "zoom-in",
      "zoom-out",
    ],
  },
  {
    name: "image",
    icons: [
      "add-a-photo",
      "add-to-photos",
      "adjust",
      "assistant-photo",
      "assistant",
      "audiotrack",
      "blur-circular",
      "blur-linear",
      "blur-off",
      "blur-on",
      "brightness-1",
      "brightness-2",
      "brightness-3",
      "brightness-4",
      "brightness-5",
      "brightness-6",
      "brightness-7",
      "broken-image",
      "brush",
      "burst-mode",
      "camera-alt",
      "camera-front",
      "camera-rear",
      "camera-roll",
      "camera",
      "center-focus-strong",
      "center-focus-weak",
      "collections-bookmark",
      "collections",
      "color-lens",
      "colorize",
      "compare",
      "control-point-duplicate",
      "control-point",
      "crop-16-9",
      "crop-3-2",
      "crop-5-4",
      "crop-7-5",
      "crop-din",
      "crop-free",
      "crop-landscape",
      "crop-original",
      "crop-portrait",
      "crop-rotate",
      "crop-square",
      "crop",
      "dehaze",
      "details",
      "edit",
      "exposure-neg-1",
      "exposure-neg-2",
      "exposure-plus-1",
      "exposure-plus-2",
      "exposure-zero",
      "exposure",
      "filter-1",
      "filter-2",
      "filter-3",
      "filter-4",
      "filter-5",
      "filter-6",
      "filter-7",
      "filter-8",
      "filter-9-plus",
      "filter-9",
      "filter-b-and-w",
      "filter-center-focus",
      "filter-drama",
      "filter-frames",
      "filter-hdr",
      "filter-none",
      "filter-tilt-shift",
      "filter-vintage",
      "filter",
      "flare",
      "flash-auto",
      "flash-off",
      "flash-on",
      "flip",
      "gradient",
      "grain",
      "grid-off",
      "grid-on",
      "hdr-off",
      "hdr-on",
      "hdr-strong",
      "hdr-weak",
      "healing",
      "image-aspect-ratio",
      "image",
      "iso",
      "landscape",
      "leak-add",
      "leak-remove",
      "lens",
      "linked-camera",
      "looks-3",
      "looks-4",
      "looks-5",
      "looks-6",
      "looks-one",
      "looks-two",
      "looks",
      "loupe",
      "monochrome-photos",
      "movie-creation",
      "movie-filter",
      "music-note",
      "nature-people",
      "nature",
      "navigate-before",
      "navigate-next",
      "palette",
      "panorama-fish-eye",
      "panorama-horizontal",
      "panorama-vertical",
      "panorama-wide-angle",
      "panorama",
      "photo-album",
      "photo-camera",
      "photo-filter",
      "photo-library",
      "photo-size-select-actual",
      "photo-size-select-large",
      "photo-size-select-small",
      "photo",
      "picture-as-pdf",
      "portrait",
      "remove-red-eye",
      "rotate-90-degrees-ccw",
      "rotate-left",
      "rotate-right",
      "slideshow",
      "straighten",
      "style",
      "switch-camera",
      "switch-video",
      "tag-faces",
      "texture",
      "timelapse",
      "timer-10",
      "timer-3",
      "timer-off",
      "timer",
      "tonality",
      "transform",
      "tune",
      "view-comfy",
      "view-compact",
      "vignette",
      "wb-auto",
      "wb-cloudy",
      "wb-incandescent",
      "wb-iridescent",
      "wb-sunny",
    ],
  },
  {
    name: "loading",
    icons: ["bars"],
  },
  {
    name: "maps",
    icons: [
      "add-location",
      "beenhere",
      "directions-bike",
      "directions-boat",
      "directions-bus",
      "directions-car",
      "directions-railway",
      "directions-run",
      "directions-subway",
      "directions-transit",
      "directions-walk",
      "directions",
      "edit-location",
      "ev-station",
      "flight",
      "hotel",
      "layers-clear",
      "layers",
      "local-activity",
      "local-airport",
      "local-atm",
      "local-bar",
      "local-cafe",
      "local-car-wash",
      "local-convenience-store",
      "local-dining",
      "local-drink",
      "local-florist",
      "local-gas-station",
      "local-grocery-store",
      "local-hospital",
      "local-hotel",
      "local-laundry-service",
      "local-library",
      "local-mall",
      "local-movies",
      "local-offer",
      "local-parking",
      "local-pharmacy",
      "local-phone",
      "local-pizza",
      "local-play",
      "local-post-office",
      "local-printshop",
      "local-see",
      "local-shipping",
      "local-taxi",
      "map",
      "my-location",
      "navigation",
      "near-me",
      "person-pin-circle",
      "person-pin",
      "pin-drop",
      "place",
      "rate-review",
      "restaurant-menu",
      "restaurant",
      "satellite",
      "store-mall-directory",
      "streetview",
      "subway",
      "terrain",
      "traffic",
      "train",
      "tram",
      "transfer-within-a-station",
      "zoom-out-map",
    ],
  },
  {
    name: "notification",
    icons: [
      "adb",
      "airline-seat-flat-angled",
      "airline-seat-flat",
      "airline-seat-individual-suite",
      "airline-seat-legroom-extra",
      "airline-seat-legroom-normal",
      "airline-seat-legroom-reduced",
      "airline-seat-recline-extra",
      "airline-seat-recline-normal",
      "bluetooth-audio",
      "confirmation-number",
      "disc-full",
      "do-not-disturb-alt",
      "do-not-disturb-off",
      "do-not-disturb-on",
      "do-not-disturb",
      "drive-eta",
      "enhanced-encryption",
      "event-available",
      "event-busy",
      "event-note",
      "folder-special",
      "live-tv",
      "mms",
      "more",
      "network-check",
      "network-locked",
      "no-encryption",
      "ondemand-video",
      "personal-video",
      "phone-bluetooth-speaker",
      "phone-forwarded",
      "phone-in-talk",
      "phone-locked",
      "phone-missed",
      "phone-paused",
      "power",
      "priority-high",
      "rv-hookup",
      "sd-card",
      "sim-card-alert",
      "sms-failed",
      "sms",
      "sync-disabled",
      "sync-problem",
      "sync",
      "system-update",
      "tap-and-play",
      "time-to-leave",
      "vibration",
      "voice-chat",
      "vpn-lock",
      "wc",
      "wifi",
    ],
  },
  {
    name: "places",
    icons: [
      "ac-unit",
      "airport-shuttle",
      "all-inclusive",
      "beach-access",
      "business-center",
      "casino",
      "child-care",
      "child-friendly",
      "fitness-center",
      "free-breakfast",
      "golf-course",
      "hot-tub",
      "kitchen",
      "pool",
      "room-service",
      "rv-hookup",
      "smoke-free",
      "smoking-rooms",
      "spa",
    ],
  },
  {
    name: "social",
    icons: [
      "cake",
      "domain",
      "group-add",
      "group",
      "location-city",
      "mood-bad",
      "mood",
      "notifications-active",
      "notifications-none",
      "notifications-off",
      "notifications-paused",
      "notifications",
      "pages",
      "party-mode",
      "people-outline",
      "people",
      "person-add",
      "person-outline",
      "person",
      "plus-one",
      "poll",
      "public",
      "school",
      "sentiment-dissatisfied",
      "sentiment-neutral",
      "sentiment-satisfied",
      "sentiment-very-dissatisfied",
      "sentiment-very-satisfied",
      "share",
      "whatshot",
    ],
  },
];
SimpleIconsetStore.registerManifest(SimpleIconIconsetsManifest);

const here = new URL("./simple-icons.js", import.meta.url).href + "/../";
[
  "av",
  "communication",
  "device",
  "editor",
  "elmsln-custom",
  "hardware",
  "icons",
  "image",
  "maps",
  "notification",
  "places",
  "social",
  "loading",
].forEach((i) => {
  SimpleIconsetStore.registerIconset(i, `${here}svgs/${i}/`);
});
// flags too but they come from elsewhere
// ISO 3166-1-alpha-2 Flags
// via https://flagicons.lipis.dev/
SimpleIconsetStore.registerIconset(
  "flags",
  `${here}../../../node_modules/flag-icons/flags/4x3/`,
);
// square flag less common but needed ratio
SimpleIconsetStore.registerIconset(
  "flags1x1",
  `${here}../../../node_modules/flag-icons/flags/1x1/`,
);

[
  "courseicons",
  "hax",
  "lrn",
  "mdextra",
  "mdi-social",
  "editable-table",
  "drawing",
  "paper-audio-icons",
].forEach((i) => {
  SimpleIconsetStore.registerIconset(
    i,
    `${new URL("./simple-hax-iconset.js", import.meta.url).href}/../svgs/${i}/`,
  );
});

/**
 * @note Gut all design settings in HAX core. this allows for design systems to hook in
 * by overriding the way the designSystemHAXProperties returns property definitions
 *
 * under standardAdvancedProps
 * review what should be removed but just about everything
 * also many of these generate events which can be removed as well!!!
 * this is core gutting, but we'll have to implement them in a uniform way
 * so that if hideDefaultSettings is there we should still respect that
 * Possibly changing it hideDesignLayoutSettings: [] which is an array
 * of keys to hide from this specific element. If the entire thing is there
 * then it'll remove all of them
 */
globalThis.addEventListener(
  "hax-store-ready",
  (e) => {
    if (globalThis.HaxStore) {
      const HAXStore = globalThis.HaxStore.requestAvailability();
      HAXStore.designSystemHAXProperties = (props, tag) => {
        // test if this element can be scaled
        if (props.canScale) {
          props.settings.developer.unshift({
            attribute: "data-width",
            title: "Width",
            description: "Scaled relative to width of container",
            inputMethod: "slider",
            min: props.canScale.min ? props.canScale.min : 25,
            max: props.canScale.max ? props.canScale.max : 100,
            step: props.canScale.step ? props.canScale.step : 25,
          });
        }
        // will catch prims and MIGHT catch tag
        let inline = HAXStore.isInlineElement(tag);
        // test for inline bc we are so early in bootstrap we might miss it
        if (props.gizmo && props.gizmo.meta && props.gizmo.meta.inlineOnly) {
          inline = true;
        }
        // everything that allows for advacned should be able to apply spacing
        // this stuff floats to the top of those options
        if (!props.hideDefaultSettings && !inline) {
          if (["media-image", "img"].includes(tag)) {
            props.settings.advanced.push({
              attribute: "data-float-position",
              title: "Float Position",
              description: "Alignment relative to other items on large screens",
              inputMethod: "select",
              options: {
                "": "-- default --",
                left: "Left",
                right: "Right",
              },
            });
          } else {
            props.settings.advanced.push({
              attribute: "data-text-align",
              title: "Text align",
              description: "Horizontal alignment of text",
              inputMethod: "select",
              options: {
                "": "-- default --",
                left: "Left",
                center: "Center",
                right: "Right",
                justify: "Justify",
              },
            });
          }
          props.settings.advanced.push({
            attribute: "data-padding",
            title: "Padding",
            description: "Padding for added aesthetics",
            inputMethod: "select",
            inputMethod: "radio",
            itemsList: [...HAXOptionSampleFactory("padding")],
          });
          props.settings.advanced.push({
            attribute: "data-margin",
            title: "Margin",
            description: "Margin for added aesthetics",
            inputMethod: "select",
            inputMethod: "radio",
            itemsList: [...HAXOptionSampleFactory("margin")],
          });
        }
        // design treatments are rather open ended but should be high up for things that have them
        if (
          props.designSystem === true ||
          props.designSystem.designTreatment === true
        ) {
          if (["p", "blockquote"].includes(tag)) {
            props.settings.configure.push({
              attribute: "data-design-treatment",
              title: "Design treatment",
              description: "Minor aesthetic treatments for emphasis",
              inputMethod: "radio",
              itemsList: [
                ...HAXOptionSampleFactory("design-treatment").filter((item) =>
                  item && item.value.startsWith("dropCap") ? true : false,
                ),
              ],
            });
            /**
             *  props.settings.configure.push({
              attribute: "data-design-treatment",
              title: "Design Treatment",
              description:
              "Minor design treatment leveraging Primary color value",
              inputMethod: "fieldset",
              collapsible: true,
              collapsed: true,
              properties: [
                {
                  attribute: "data-design-treatment",
                  inputMethod: "radio",
                  itemsList: [
                    ...HAXOptionSampleFactory("design-treatment").filter((item) =>
                      item && item.value.startsWith("dropCap") ? true : false,
                    ),
                  ],
                }
              ]
            });
             */
          } else if (["h1", "h2", "h3", "h4", "h5", "h6"].includes(tag)) {
            // filter options to only NON-dropCap options
            props.settings.configure.push({
              attribute: "data-design-treatment",
              title: "Design treatment",
              description: "Minor aesthetic treatments for emphasis",
              inputMethod: "radio",
              itemsList: [
                ...HAXOptionSampleFactory("design-treatment").filter((item) =>
                  item && !item.value.startsWith("dropCap") ? true : false,
                ),
              ],
            });
            // headings can pick up instructional meaning
            props.settings.configure.push({
              attribute: "data-instructional-action",
              title: "Instructional Context",
              description: "Indicated to users visually",
              inputMethod: "radio",
              itemsList: [...HAXOptionSampleFactory("instructional-action")],
            });
          }
        }
        // block elements can get accents which effectively implies that they
        // can get the other 'card' like configuration pieces
        if (props.designSystem === true || props.designSystem.accent === true) {
          props.settings.configure.push({
            attribute: "data-accent",
            title: "Accent color",
            description: "Offset items visually for aesthetic purposes",
            inputMethod: "select",
            inputMethod: "radio",
            itemsList: [...HAXOptionSampleFactory("accent")],
          });
        }
        // things allowed to have primary
        /* if (
          [
            "p",
            "blockquote",
            "ol",
            "ul",
            "hr",
            "abbr",
            "mark",
            "h1",
            "h2",
            "h3",
            "h4",
            "h5",
            "h6",
          ].includes(tag)
        ) {*/
        if (
          props.designSystem === true ||
          props.designSystem.primary === true
        ) {
          props.settings.configure.push({
            attribute: "data-primary",
            title: "Primary color",
            description:
              "Primary color to apply color, often for meaning or aesthetic",
            inputMethod: "radio",
            itemsList: [...HAXOptionSampleFactory("primary")],
          });
        }
        // textual controls
        if (props.designSystem === true || props.designSystem.text === true) {
          props.settings.advanced.push({
            attribute: "data-font-family",
            title: "Font family",
            inputMethod: "select",
            inputMethod: "radio",
            itemsList: [...HAXOptionSampleFactory("font-family")],
          });

          props.settings.advanced.push({
            attribute: "data-font-weight",
            title: "Font weight",
            description: "Ensure it is only for aesthetic purposes",
            inputMethod: "select",
            inputMethod: "radio",
            itemsList: [...HAXOptionSampleFactory("font-weight")],
          });

          props.settings.advanced.push({
            attribute: "data-font-size",
            title: "Font size",
            description: "Ensure sizing is only for aesthetic purposes",
            inputMethod: "select",
            inputMethod: "radio",
            itemsList: [...HAXOptionSampleFactory("font-size")],
          });
        }
        // things that would give a card appearance
        if (props.designSystem === true || props.designSystem.card === true) {
          props.settings.advanced.push({
            attribute: "data-border-radius",
            title: "Border radius",
            description: "Border radius to apply",
            inputMethod: "select",
            inputMethod: "radio",
            itemsList: [...HAXOptionSampleFactory("border-radius")],
          });
          props.settings.advanced.push({
            attribute: "data-border",
            title: "Border",
            description: "Thickness of the border",
            inputMethod: "select",
            inputMethod: "radio",
            itemsList: [...HAXOptionSampleFactory("border")],
          });
          props.settings.advanced.push({
            attribute: "data-box-shadow",
            title: "Box shadow",
            description: "Subtly raises off the page",
            inputMethod: "select",
            inputMethod: "radio",
            itemsList: [...HAXOptionSampleFactory("box-shadow")],
          });
        }
        return props;
      };
    }
  },
  { once: true },
);
/**
 * Instructional design meshing with styles. What we use to represent concepts
 */
const learningComponentNouns = {
  content: "Content",
  assessment: "Assessment",
  quiz: "Quiz",
  submission: "Submission",
  lesson: "Lesson",
  module: "Module",
  task: "Task",
  activity: "Activity",
  project: "Project",
  practice: "Practice",
  unit: "Unit",
  objectives: "Learning Objectives",
};

const learningComponentVerbs = {
  connection: "Connection",
  knowledge: "Did You Know?",
  strategy: "Learning Strategy",
  discuss: "Discuss",
  listen: "Listen",
  make: "Make",
  observe: "Observe",
  present: "Present",
  read: "Read",
  reflect: "Reflect",
  research: "Research",
  watch: "Watch",
  write: "Write",
};

const learningComponentTypes = {
  ...learningComponentVerbs,
  ...learningComponentNouns,
};

const learningComponentColors = {
  content: "blue-grey",
  assessment: "red",
  quiz: "blue",
  submission: "deep-purple",
  lesson: "purple",
  module: "red",
  task: "blue-grey",
  activity: "orange",
  project: "deep-orange",
  practice: "brown",
  unit: "light-green",
  objectives: "indigo",
  connection: "green",
  knowledge: "cyan",
  strategy: "teal",
  discuss: "blue",
  listen: "purple",
  make: "orange",
  observe: "yellow",
  present: "light-blue",
  read: "lime",
  reflect: "amber",
  research: "deep-orange",
  watch: "pink",
  write: "deep-purple",
};

function iconFromPageType(type) {
  switch (type) {
    case "content":
      return "lrn:page";
    case "assessment":
      return "lrn:assessment";
    case "quiz":
      return "lrn:quiz";
    case "submission":
      return "icons:move-to-inbox";
    case "lesson":
      return "hax:lesson";
    case "module":
      return "hax:module";
    case "unit":
      return "hax:unit";
    case "task":
      return "hax:task";
    case "activity":
      return "hax:ticket";
    case "project":
      return "hax:bulletin-board";
    case "practice":
      return "hax:shovel";
    case "connection":
      return "courseicons:chem-connection";
    case "knowledge":
      return "courseicons:knowledge";
    case "strategy":
      return "courseicons:strategy";
    case "discuss":
      return "courseicons:strategy";
    case "listen":
      return "courseicons:listen";
    case "make":
      return "courseicons:strategy";
    case "observe":
      return "courseicons:strategy";
    case "present":
      return "courseicons:strategy";
    case "read":
      return "courseicons:strategy";
    case "reflect":
      return "courseicons:strategy";
    case "research":
      return "courseicons:strategy";
    case "watch":
      return "courseicons:strategy";
    case "write":
      return "lrn:write";
  }
  return "courseicons:learning-objectives";
}

const ApplicationAttributeData = {
  primary: {
    0: "Pugh blue",
    1: "Beaver blue",
    2: "Nittany navy",
    3: "Potential midnight",
    4: "Coaly gray",
    5: "Limestone gray",
    6: "Slate gray",
    7: "Creek teal",
    8: "Sky blue",
    9: "Shrine tan",
    10: "Roar golden",
    11: "Original 87 pink",
    12: "Discovery coral",
    13: "Wonder purple",
    14: "Artherton violet",
    15: "Invent orange",
    16: "Keystone yellow",
    17: "Opportunity green",
    18: "Future lime",
    19: "Forest green",
    20: "Landgrant brown",
    21: "Global Neon",
    22: "Error",
    23: "Warning",
    24: "Info",
    25: "Success",
  },
  accent: {
    0: "Sky Max",
    1: "Slate Max",
    2: "Limestone Max",
    3: "Shrine Max",
    4: "Roar Max",
    5: "Creek Max",
    6: "White",
    7: "Error Light",
    8: "Warning Light",
    9: "Info Light",
    10: "Success Light",
    11: "Alert Immediate",
    12: "Alert Urgent",
    13: "Alert All Clear",
    14: "Alert Non Emergency",
  },
  margin: {
    xs: "X-Small",
    s: "Small",
    m: "Medium",
    l: "Large",
    xl: "X-Large",
  },
  padding: {
    xs: "X-Small",
    s: "Small",
    m: "Medium",
    l: "Large",
    xl: "X-Large",
  },
  border: {
    xs: "X-Small",
    sm: "Small",
    md: "Medium",
    lg: "Large",
  },
  "border-radius": {
    xs: "Rounded",
    md: "Rounder",
    xl: "Roundest",
  },
  "box-shadow": {
    sm: "Drop shadow",
  },
  "design-treatment": {
    // heading treatments
    vert: "Vertical line",
    "horz-10p": "Horizontal line 10%",
    "horz-25p": "Horizontal line 25%",
    "horz-50p": "Horizontal line 50%",
    "horz-full": "Horizontal line 100%",
    "horz-md": "Horizontal line Medium",
    "horz-lg": "Horizontal line Large",
    horz: "Horizontal line",
    bg: "Background color",
    // text treatment
    "dropCap-sm": "Drop Cap - Small",
    "dropCap-md": "Drop Cap - Medium",
    "dropCap-lg": "Drop Cap - Large",
  },
  "font-family": {
    primary: "Roboto",
    secondary: "Roboto Slab",
    navigation: "Roboto Condensed",
  },
  "font-weight": {
    light: "Light",
    medium: "Medium",
    bold: "Bold",
  },
  "font-size": {
    "3xs": "Smaller",
    s: "Large",
    m: "Larger",
    l: "Largest",
  },
  "instructional-action": learningComponentTypes,
};

// ensure we get keys back in the right format
function HAXOptionSampleFactory(type) {
  return Object.keys(ApplicationAttributeData[type]).map((key) => {
    return {
      value: key,
      html: ["primary", "accent"].includes(type)
        ? x`<d-d-d-sample
            @click="${updatePreviewColorVar}"
            type="${type}"
            option="${key}"
          ></d-d-d-sample>`
        : x`<d-d-d-sample type="${type}" option="${key}"></d-d-d-sample>`,
    };
  });
}

function updatePreviewColorVar(e) {
  let target = e.target;
  globalThis.document.body.style.setProperty(
    `--ddd-sample-theme-${target.type}`,
    `var(--ddd-${target.type}-${target.option})`,
  );
}

// attributes need to be driven from a cannonical list
// @note this may need ways of overriding it in the future but at least
// we've consolidated everything into one place for these small design mods
const instructionalStyles = Object.keys(learningComponentColors).map(
  (item) => {
    let color = learningComponentColors[item];
    return i$2`
      [data-instructional-action="${r$3(item)}"] {
        --instructional-action-color: var(
          --simple-colors-default-theme-${r$3(color)}-8,
          ${r$3(color)}
        );
      }

      [data-instructional-action="${r$3(item)}"]::before {
        -webkit-mask-image: url("${r$3(
          SimpleIconsetStore.getIcon(iconFromPageType(item)),
        )}");
      }
    `;
  },
);

/* Logical Gaps:
  Heading colors; sizes; letter spacing; line height
  When to use chevron > with links?
  gradients need to be rotated (sometimes?)
  When to use // after headers?
*/
// fonts used
const DDDFonts = [
  "https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,300;0,400;0,500;0,700;0,900;1,300;1,400;1,500;1,700;1,900&display=swap",
  "https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@300;400;500;700;900&display=swap",
  "https://fonts.googleapis.com/css2?family=Roboto+Condensed:wght@300;400;500;700;900&display=swap",
];
// CSS variables which is most of the system needed
const DDDVariables = i$2`
  :root {
    color-scheme: light dark;
  }
  :root,
  html,
  body,
  :host {
    /* base colors */
    --ddd-theme-default-beaverBlue: #1e407c;
    --ddd-theme-default-beaver70: rgba(30, 64, 124, 0.7);
    --ddd-theme-default-beaver80: rgba(30, 64, 124, 0.8);
    --ddd-theme-default-landgrantBrown: #6a3028;
    --ddd-theme-default-nittanyNavy: #001e44;
    --ddd-theme-default-navy40: rgba(0, 30, 68, 0.4);
    --ddd-theme-default-navy60: rgba(0, 30, 68, 0.6);
    --ddd-theme-default-navy65: rgba(0, 30, 68, 0.65);
    --ddd-theme-default-navy70: rgba(0, 30, 68, 0.7);
    --ddd-theme-default-navy80: rgba(0, 30, 68, 0.8);
    --ddd-theme-default-potentialMidnight: #000321;
    --ddd-theme-default-potential0: rgba(0, 3, 33, 0);
    --ddd-theme-default-potential50: rgba(0, 3, 33, 0.5);
    --ddd-theme-default-potential70: rgba(0, 3, 33, 0.7);
    --ddd-theme-default-potential75: rgba(0, 3, 33, 0.75);
    --ddd-theme-default-pughBlue: #96bee6;
    --ddd-theme-default-coalyGray: #262626;
    --ddd-theme-default-keystoneYellow: #ffd100;
    --ddd-theme-default-slateGray: #314d64;
    --ddd-theme-default-slateLight: #ccdae6;
    --ddd-theme-default-slateMaxLight: #eef3f7;
    --ddd-theme-default-skyBlue: #009cde;
    --ddd-theme-default-skyLight: #ccf0ff;
    --ddd-theme-default-skyMaxLight: #e6f7ff;
    --ddd-theme-default-limestoneGray: #a2aaad;
    --ddd-theme-default-limestoneLight: #e4e5e7;
    --ddd-theme-default-limestoneMaxLight: #f2f2f4;
    --ddd-theme-default-white: #ffffff;
    --ddd-theme-default-shrineLight: #f7f2ee;
    --ddd-theme-default-shrineMaxLight: #fdfbf5;
    --ddd-theme-default-creekTeal: #3ea39e;
    --ddd-theme-default-creekLight: #cfeceb;
    --ddd-theme-default-creekMaxLight: #edf8f7;
    --ddd-theme-default-shrineTan: #b88965;
    --ddd-theme-default-roarGolden: #bf8226;
    --ddd-theme-default-roarLight: #f9eddc;
    --ddd-theme-default-roarMaxlight: #fffaf2;
    --ddd-theme-default-forestGreen: #4a7729;
    --ddd-theme-default-athertonViolet: #ac8dce;
    --ddd-theme-default-original87Pink: #bc204b;
    --ddd-theme-default-discoveryCoral: #f2665e;
    --ddd-theme-default-futureLime: #99cc00;
    --ddd-theme-default-wonderPurple: #491d70;
    --ddd-theme-default-inventOrange: #e98300;
    --ddd-theme-default-opportunityGreen: #008755;
    --ddd-theme-default-globalNeon: #ebff00;
    --ddd-theme-default-accent: #96bee6;
    --ddd-theme-default-white85: rgba(255, 255, 255, 0.85);
    --ddd-theme-default-white65: rgba(255, 255, 255, 0.65);

    /* 
  base colors, cannot be modified by user; SimpleColors hijacks this
  
  Theme level color, components pick up hues of theme color
  
  User can override these colors with their own theme colors
  */

    /* functional colors */
    --ddd-theme-default-link: #005fa9;
    --ddd-theme-default-link80: rgba(0, 95, 169, 0.8);
    --ddd-theme-default-linkLight: #cce9ff;
    --ddd-theme-default-disabled: #f4f4f4;
    --ddd-theme-default-error: #5f2120;
    --ddd-theme-default-errorLight: #fdeded;
    --ddd-theme-default-warning: #663c00;
    --ddd-theme-default-warningLight: #fff4e5;
    --ddd-theme-default-info: #014361;
    --ddd-theme-default-infoLight: #e5f6fd;
    --ddd-theme-default-success: #1e4620;
    --ddd-theme-default-successLight: #edf7ed;
    --ddd-theme-default-alertImmediate: #f8d3de;
    --ddd-theme-default-alertUrgent: #fff6cc;
    --ddd-theme-default-alertAllClear: #f2ffcc;
    --ddd-theme-default-alertNonEmergency: #e6f7ff;
    --ddd-theme-default-background: #eff2f5;
    --ddd-theme-default-disabled: #f4f4f4;

    /* DDDSpecific: Define primary colors in RGB for use in rgba() */
    --ddd-primary-0-rgb: 150, 190, 230, 0.7; /* Pugh Blue */
    --ddd-primary-1-rgb: 30, 64, 124; /* Beaver Blue */
    --ddd-primary-2-rgb: 0, 30, 68; /* Nittany Navy */
    --ddd-primary-3-rgb: 0, 3, 33; /* Potential Midnight */
    --ddd-primary-4-rgb: 38, 38, 38; /* Coaly Gray */
    --ddd-primary-5-rgb: 162, 170, 173; /* Limestone Gray */
    --ddd-primary-6-rgb: 49, 77, 100; /* Slate Gray */
    --ddd-primary-7-rgb: 62, 163, 158; /* Creek Teal */
    --ddd-primary-8-rgb: 0, 156, 222; /* Sky Blue */
    --ddd-primary-9-rgb: 184, 137, 101; /* Shrine Tan */
    --ddd-primary-10-rgb: 191, 130, 38; /* Roar Golden */
    --ddd-primary-11-rgb: 188, 32, 75, 0.7; /* Original 87 Pink */
    --ddd-primary-12-rgb: 242, 102, 94; /* Discovery Coral */
    --ddd-primary-13-rgb: 73, 29, 112; /* Wonder Purple */
    --ddd-primary-14-rgb: 172, 141, 206; /* Atherton Violet */
    --ddd-primary-15-rgb: 233, 131, 0; /* Invent Orange */
    --ddd-primary-16-rgb: 255, 209, 0; /* Keystone Yellow */
    --ddd-primary-17-rgb: 0, 135, 85; /* Opportunity Green */
    --ddd-primary-18-rgb: 153, 204, 0; /* Future Lime */
    --ddd-primary-19-rgb: 74, 119, 41; /* Forest Green */
    --ddd-primary-20-rgb: 106, 48, 40; /* Landgrant Brown */
    --ddd-primary-21-rgb: 235, 255, 0; /* Global Neon */
    --ddd-primary-22-rgb: 95, 33, 32; /* Error */
    --ddd-primary-23-rgb: 102, 60, 0; /* Warning */
    --ddd-primary-24-rgb: 1, 67, 97; /* Info */
    --ddd-primary-25-rgb: 30, 70, 32; /* Success */

    /* primary colors */
    --ddd-primary-0: var(
      --ddd-theme-default-pughBlue
    ); /* not enough contrast to white, accent-0, accent-1, accent-2, accent-3, accent-4, accent-5 */
    --ddd-primary-1: var(
      --ddd-theme-default-beaverBlue
    ); /* not enough contrast to black */
    --ddd-primary-2: var(
      --ddd-theme-default-nittanyNavy
    ); /* not enough contrast to black */
    --ddd-primary-3: var(
      --ddd-theme-default-potentialMidnight
    ); /* not enough contrast to black */
    --ddd-primary-4: var(
      --ddd-theme-default-coalyGray
    ); /* not enough contrast to black */
    --ddd-primary-5: var(
      --ddd-theme-default-limestoneGray
    ); /* not enough contrast to white, accent-0, accent-1, accent-2, accent-3, accent-4, accent-5 */
    --ddd-primary-6: var(
      --ddd-theme-default-slateGray
    ); /* not enough contrast to black */
    --ddd-primary-7: var(
      --ddd-theme-default-creekTeal
    ); /* not enough contrast to accent-0, accent-1, accent-2, accent-3, accent-4, accent-5 */
    --ddd-primary-8: var(
      --ddd-theme-default-skyBlue
    ); /* not enough contrast to accent-0, accent-1, accent-2, accent-3, accent-4, accent-5 */
    --ddd-primary-9: var(
      --ddd-theme-default-shrineTan
    ); /* not enough contrast to accent-5 3, 1*/
    --ddd-primary-10: var(
      --ddd-theme-default-roarGolden
    ); /* not enough contrast to accent-0, accent-1, accent-2 */
    --ddd-primary-11: var(--ddd-theme-default-original87Pink);
    --ddd-primary-12: var(
      --ddd-theme-default-discoveryCoral
    ); /* not enough contrast to accent-0, accent-1, accent-2, accent-3, accent-4, accent-5 */
    --ddd-primary-13: var(
      --ddd-theme-default-wonderPurple
    ); /* not enough contrast to black */
    --ddd-primary-14: var(
      --ddd-theme-default-athertonViolet
    ); /* not enough contrast to white, accent-0, accent-1, accent-2, accent-3, accent-4, accent-5 */
    --ddd-primary-15: var(
      --ddd-theme-default-inventOrange
    ); /* not enough contrast to white, accent-0, accent-1, accent-2, accent-3, accent-4, accent-5 */
    --ddd-primary-16: var(
      --ddd-theme-default-keystoneYellow
    ); /* not enough contrast to white, accent-0, accent-1, accent-2, accent-3, accent-4, accent-5 */
    --ddd-primary-17: var(--ddd-theme-default-opportunityGreen);
    --ddd-primary-18: var(
      --ddd-theme-default-futureLime
    ); /* not enough contrast to white, accent-0, accent-1, accent-2, accent-3, accent-4, accent-5 */
    --ddd-primary-19: var(--ddd-theme-default-forestGreen);
    --ddd-primary-20: var(
      --ddd-theme-default-landgrantBrown
    ); /* not enough contrast to black */
    --ddd-primary-21: var(
      --ddd-theme-default-globalNeon
    ); /* not enough contrast to white, accent-0, accent-1, accent-2, accent-3, accent-4, accent-5 */
    --ddd-primary-22: var(--ddd-theme-default-error);
    --ddd-primary-23: var(--ddd-theme-default-warning);
    --ddd-primary-24: var(--ddd-theme-default-info);
    --ddd-primary-25: var(--ddd-theme-default-success);

    /* accent colors */

    --ddd-accent-0: var(--ddd-theme-default-skyMaxLight);
    --ddd-accent-1: var(--ddd-theme-default-slateMaxLight);
    --ddd-accent-2: var(--ddd-theme-default-limestoneMaxLight);
    --ddd-accent-3: var(--ddd-theme-default-shrineMaxLight);
    --ddd-accent-4: var(--ddd-theme-default-roarMaxlight);
    --ddd-accent-5: var(--ddd-theme-default-creekMaxLight);
    --ddd-accent-6: var(--ddd-theme-default-white);
    --ddd-accent-7: var(--ddd-theme-default-errorLight);
    --ddd-accent-8: var(--ddd-theme-default-warningLight);
    --ddd-accent-9: var(--ddd-theme-default-infoLight);
    --ddd-accent-10: var(--ddd-theme-default-successLight);
    --ddd-accent-11: var(--ddd-theme-default-alertImmediate);
    --ddd-accent-12: var(--ddd-theme-default-alertUrgent);
    --ddd-accent-13: var(--ddd-theme-default-alertAllClear);
    --ddd-accent-14: var(--ddd-theme-default-alertNonEmergency);

    /*fonts*/
    --ddd-font-primary: "Roboto", "Franklin Gothic Medium", Tahoma, sans-serif;
    --ddd-font-secondary: "Roboto Slab", serif;
    --ddd-font-navigation: "Roboto Condensed", sans-serif; /* navigation font */

    /* font weights - generalized */
    --ddd-font-weight-light: 300;
    --ddd-font-weight-regular: 400; /* default weight for body */
    --ddd-font-weight-medium: 500;
    --ddd-font-weight-bold: 700; /* default weight for headers */
    --ddd-font-weight-black: 900;

    /* font sizes */
    --ddd-font-size-4xs: 16px;
    --ddd-font-size-3xs: 18px; /* body default */
    --ddd-font-size-xxs: 20px; /* h6 */
    --ddd-font-size-xs: 22px; /* h5 */
    --ddd-font-size-s: 24px; /* h4 */
    --ddd-font-size-ms: 28px; /* h3 */
    --ddd-font-size-m: 32px; /* h2 */
    --ddd-font-size-ml: 36px;
    --ddd-font-size-l: 40px; /* h1 */
    --ddd-font-size-xl: 48px;
    --ddd-font-size-xxl: 56px;
    --ddd-font-size-3xl: 64px;
    --ddd-font-size-4xl: 72px;

    --ddd-font-size-type1-s: 80px;
    --ddd-font-size-type1-m: 150px;
    --ddd-font-size-type1-l: 200px;

    /* global override font styles for light-dom content */
    --ddd-theme-h1-font-size: var(--ddd-font-size-l);
    --ddd-theme-h2-font-size: var(--ddd-font-size-m);
    --ddd-theme-h3-font-size: var(--ddd-font-size-ms);
    --ddd-theme-h4-font-size: var(--ddd-font-size-s);
    --ddd-theme-h5-font-size: var(--ddd-font-size-xs);
    --ddd-theme-h6-font-size: var(--ddd-font-size-xxs);
    --ddd-theme-body-font-size: var(--ddd-font-size-xxs);

    /* letter spacing */
    --ddd-ls-16-sm: 0.08px;
    --ddd-ls-18-sm: 0.09px;
    --ddd-ls-20-sm: 0.1px;
    --ddd-ls-22-sm: 0.11px;
    --ddd-ls-24-sm: 0.12px;
    --ddd-ls-28-sm: 0.14px;
    --ddd-ls-32-sm: 0.16px;
    --ddd-ls-36-sm: 0.18px;
    --ddd-ls-40-sm: 0.2px;
    --ddd-ls-48-sm: 0.24px;
    --ddd-ls-56-sm: 0.28px;
    --ddd-ls-64-sm: 0.32px;
    --ddd-ls-72-sm: 0.36px;
    --ddd-ls-16-lg: 0.24px;
    --ddd-ls-18-lg: 0.27px;
    --ddd-ls-20-lg: 0.3px;
    --ddd-ls-22-lg: 0.33px;
    --ddd-ls-24-lg: 0.36px;
    --ddd-ls-28-lg: 0.42px;
    --ddd-ls-32-lg: 0.48px;
    --ddd-ls-36-lg: 0.54px;
    --ddd-ls-40-lg: 0.6px;
    --ddd-ls-48-lg: 0.72px;
    --ddd-ls-56-lg: 0.84px;
    --ddd-ls-64-lg: 0.96px;
    --ddd-ls-72-lg: 1.08px;

    /* line height */
    --ddd-lh-120: 120%;
    --ddd-lh-140: 140%;
    --ddd-lh-150: 150%;

    /* spacing */
    --ddd-spacing-0: 0px;
    --ddd-spacing-1: 4px; /*  body default */
    --ddd-spacing-2: 8px;
    --ddd-spacing-3: 12px; /* h6 */
    --ddd-spacing-4: 16px; /* h5 */
    --ddd-spacing-5: 20px; /* h4 */
    --ddd-spacing-6: 24px; /* h3 */
    --ddd-spacing-7: 28px; /* h2 */
    --ddd-spacing-8: 32px; /* h1 */
    --ddd-spacing-9: 36px;
    --ddd-spacing-10: 40px;
    --ddd-spacing-11: 44px;
    --ddd-spacing-12: 48px;
    --ddd-spacing-13: 52px;
    --ddd-spacing-14: 56px;
    --ddd-spacing-15: 60px;
    --ddd-spacing-16: 64px;
    --ddd-spacing-17: 68px;
    --ddd-spacing-18: 72px;
    --ddd-spacing-19: 76px;
    --ddd-spacing-20: 80px;
    --ddd-spacing-21: 84px;
    --ddd-spacing-22: 88px;
    --ddd-spacing-23: 92px;
    --ddd-spacing-24: 96px;
    --ddd-spacing-25: 100px;
    --ddd-spacing-26: 104px;
    --ddd-spacing-27: 108px;
    --ddd-spacing-28: 112px;
    --ddd-spacing-29: 116px;
    --ddd-spacing-30: 120px;

    /* borders */
    --ddd-border-xs: 1px solid var(--ddd-theme-default-limestoneLight);
    --ddd-border-sm: 2px solid var(--ddd-theme-default-limestoneLight);
    --ddd-border-md: 3px solid var(--ddd-theme-default-limestoneLight);
    --ddd-border-lg: 4px solid var(--ddd-theme-default-limestoneLight);

    --ddd-border-size-xs: 1px;
    --ddd-border-size-sm: 2px;
    --ddd-border-size-md: 3px;
    --ddd-border-size-lg: 4px;

    --ddd-theme-header-border-thickness-0: 0px;
    --ddd-theme-header-border-thickness-xs: 1px;
    --ddd-theme-header-border-thickness-sm: 2px;
    --ddd-theme-header-border-thickness-md: 3px;
    --ddd-theme-header-border-thickness-lg: 4px;

    --ddd-theme-header-border-treatment-0: 0px;
    --ddd-theme-header-border-treatment-10p: 10%; /* good */
    --ddd-theme-header-border-treatment-25p: 25%; /* good */
    --ddd-theme-header-border-treatment-50p: 50%; /* good */
    --ddd-theme-header-border-treatment-75p: 75%;
    --ddd-theme-header-border-treatment-full: 100%; /* good */
    --ddd-theme-header-border-treatment-sm: 28px;
    --ddd-theme-header-border-treatment-md: 56px; /* good */
    --ddd-theme-header-border-treatment-lg: 84px; /* good */

    --ddd-theme-header-border-thickness: var(
      --ddd-theme-header-border-thickness-lg
    );
    --ddd-theme-header-border-color: var(--ddd-theme-primary);
    --ddd-theme-header-border-treatment: var(
      --ddd-theme-header-border-treatment-lg
    );

    /* shadows */
    --ddd-boxShadow-0: 0px 0px 0px 0px rgba(0, 0, 0, 0);
    --ddd-boxShadow-sm: rgba(0, 3, 33, 0.063) 0px 4px 8px 0px;
    --ddd-boxShadow-md: rgba(0, 3, 33, 0.063) 0px 8px 16px 0px;
    --ddd-boxShadow-lg: rgba(0, 3, 33, 0.063) 0px 12px 24px 0px;
    --ddd-boxShadow-xl: rgba(0, 3, 33, 0.063) 0px 16px 32px 0px;

    /* breakpoints */
    --ddd-breakpoint-sm: 360px;
    --ddd-breakpoint-md: 768px;
    --ddd-breakpoint-lg: 1080px;
    --ddd-breakpoint-xl: 1440px;

    /* Radius */
    --ddd-radius-0: 0px;
    --ddd-radius-xs: 4px;
    --ddd-radius-sm: 8px;
    --ddd-radius-md: 12px;
    --ddd-radius-lg: 16px;
    --ddd-radius-xl: 20px;
    --ddd-radius-rounded: 100px;
    --ddd-radius-circle: 100%;

    /* Gradients */
    --ddd-theme-default-gradient-navBar: linear-gradient(
      90deg,
      rgb(0, 30, 68) 0%,
      rgb(0, 30, 68) 31%,
      rgb(30, 64, 124) 76%,
      rgb(0, 3, 33) 100%
    );
    --ddd-theme-default-gradient-footer: linear-gradient(
      rgb(30, 64, 124) 0%,
      rgb(0, 30, 68) 65%,
      rgb(0, 30, 68) 100%
    );
    --ddd-theme-default-gradient-newsFeature: linear-gradient(
      360deg,
      rgb(30, 64, 124) 20%,
      rgb(0, 156, 222) 100%
    );
    --ddd-theme-default-gradient-buttons: linear-gradient(
      rgb(0, 156, 222) 0%,
      rgb(30, 64, 124) 85%
    );
    --ddd-theme-default-gradient-hero: linear-gradient(
      360deg,
      rgba(0, 30, 68, 0.8) 0%,
      rgba(0, 30, 68, 0.4) 50%,
      rgba(0, 3, 33, 0) 100%
    );
    --ddd-theme-default-gradient-hero2: linear-gradient(
      360deg,
      rgb(0, 30, 68) 0%,
      rgba(0, 30, 68, 0.4) 50%,
      rgba(0, 3, 33, 0) 100%
    );
    --ddd-theme-default-gradient-antihero: linear-gradient(
      180deg,
      rgba(0, 30, 68, 0.8) 0%,
      rgba(0, 30, 68, 0.4) 50%,
      rgba(0, 3, 33, 0) 100%
    );
    --ddd-theme-default-gradient-antihero2: linear-gradient(
      180deg,
      rgb(0, 30, 68) 0%,
      rgba(0, 30, 68, 0.4) 50%,
      rgba(0, 3, 33, 0) 100%
    );

    --ddd-icon-3xs: 20px;
    --ddd-icon-xxs: 24px;
    --ddd-icon-xs: 32px;
    --ddd-icon-sm: 40px;
    --ddd-icon-md: 48px;
    --ddd-icon-lg: 56px;
    --ddd-icon-xl: 64px;
    --ddd-icon-2xl: 72px;
    --ddd-icon-3xl: 84px;
    --ddd-icon-4xl: 96px;

    /* borrowed from base styling */

    scroll-behavior: smooth;
    font-family: var(--ddd-font-primary);
    font-size: var(--ddd-theme-body-font-size);
    font-weight: var(--ddd-font-weight-regular);
    letter-spacing: normal;
    --simple-modal-content-container-color: light-dark(
      var(--ddd-primary-4),
      var(--ddd-accent-6)
    );
    --simple-modal-content-container-background: light-dark(
      var(--ddd-accent-6),
      var(--ddd-primary-4)
    );
  }

  body.dark-mode {
    color-scheme: only dark;
  }
`;
/* Data Attributes used by HAX */
const DDDDataAttributes = [
  i$2`
    /* basic width operation, not great but not terrible */
    [data-width="25"] {
      width: 25%;
    }
    [data-width="50"] {
      width: 50%;
    }
    [data-width="75"] {
      width: 75%;
    }

    /* Float positioning for larger devices */
    @media (min-width: 1440px) {
      [data-float-position="left"] {
        float: left;
        margin: var(--ddd-spacing-8) var(--ddd-spacing-8) 0 var(--ddd-spacing-4);
      }
      [data-float-position="right"] {
        float: right;
        margin: var(--ddd-spacing-8) var(--ddd-spacing-4) 0 var(--ddd-spacing-8);
      }
      [data-hax-ray][data-float-position]:focus-within::after,
      [data-hax-ray][data-float-position]:hover::after {
        content: "Floating item";
        position: absolute;
        white-space: nowrap;
        font-style: normal;
        position: absolute;
        padding: var(--ddd-spacing-1) var(--ddd-spacing-2);
        color: var(
          --ddd-theme-font-color,
          var(--ddd-theme-default-white, #fff)
        );
        background-color: var(
          --ddd-theme-default-info,
          rgba(175, 184, 193, 0.2)
        );
        font-size: var(--ddd-theme-body-font-size);
        font-weight: var(--ddd-font-weight-regular);
        border-radius: var(--ddd-radius-xs);
        right: var(--ddd-spacing-4);
        left: unset;
        margin-top: -16px;
      }
      [data-hax-ray][data-float-position="left"]:focus-within::after,
      [data-hax-ray][data-float-position="left"]:hover::after {
        left: var(--ddd-spacing-4);
        right: unset;
      }
    }

    /* basic text operations, not DDD specific persay */
    [data-text-align="left"] {
      text-align: left;
    }
    [data-text-align="center"] {
      text-align: center;
    }
    [data-text-align="right"] {
      text-align: right;
    }
    [data-text-align="justify"] {
      text-align: justify;
    }

    /* primary color */
    [data-primary="0"] {
      --ddd-theme-primary: var(--ddd-primary-0);
      --lowContrast-override: black;
    }
    [data-primary="1"] {
      --ddd-theme-primary: var(--ddd-primary-1);
      --ddd-theme-bgContrast: white;
    }
    [data-primary="2"] {
      --ddd-theme-primary: var(--ddd-primary-2);
      --ddd-theme-bgContrast: white;
    }
    [data-primary="3"] {
      --ddd-theme-primary: var(--ddd-primary-3);
      --ddd-theme-bgContrast: white;
    }
    [data-primary="4"] {
      --ddd-theme-primary: var(--ddd-primary-4);
      --ddd-theme-bgContrast: white;
    }
    [data-primary="5"] {
      --ddd-theme-primary: var(--ddd-primary-5);
      --lowContrast-override: black;
    }
    [data-primary="6"] {
      --ddd-theme-primary: var(--ddd-primary-6);
      --ddd-theme-bgContrast: white;
    }
    [data-primary="7"] {
      --ddd-theme-primary: var(--ddd-primary-7);
      --lowContrast-override: black;
    }
    [data-primary="8"] {
      --ddd-theme-primary: var(--ddd-primary-8);
      --lowContrast-override: black;
    }
    [data-primary="9"] {
      --ddd-theme-primary: var(--ddd-primary-9);
      --lowContrast-override: black;
    }
    [data-primary="10"] {
      --ddd-theme-primary: var(--ddd-primary-10);
      --lowContrast-override: black;
    }
    [data-primary="11"] {
      --ddd-theme-primary: var(--ddd-primary-11);
      --ddd-theme-bgContrast: white;
    }
    [data-primary="12"] {
      --ddd-theme-primary: var(--ddd-primary-12);
      --lowContrast-override: black;
    }
    [data-primary="13"] {
      --ddd-theme-primary: var(--ddd-primary-13);
      --ddd-theme-bgContrast: white;
    }
    [data-primary="14"] {
      --ddd-theme-primary: var(--ddd-primary-14);
      --lowContrast-override: black;
    }
    [data-primary="15"] {
      --ddd-theme-primary: var(--ddd-primary-15);
      --lowContrast-override: black;
    }
    [data-primary="16"] {
      --ddd-theme-primary: var(--ddd-primary-16);
      --lowContrast-override: black;
    }
    [data-primary="17"] {
      --ddd-theme-primary: var(--ddd-primary-17);
      --lowContrast-override: black;
    }
    [data-primary="18"] {
      --ddd-theme-primary: var(--ddd-primary-18);
      --lowContrast-override: black;
    }
    [data-primary="19"] {
      --ddd-theme-primary: var(--ddd-primary-19);
      --ddd-theme-bgContrast: white;
    }
    [data-primary="20"] {
      --ddd-theme-primary: var(--ddd-primary-20);
      --ddd-theme-bgContrast: white;
    }
    [data-primary="21"] {
      --ddd-theme-primary: var(--ddd-primary-21);
      --lowContrast-override: black;
    }
    [data-primary="22"] {
      --ddd-theme-primary: var(--ddd-primary-22);
      --ddd-theme-bgContrast: white;
    }
    [data-primary="23"] {
      --ddd-theme-primary: var(--ddd-primary-23);
      --ddd-theme-bgContrast: white;
    }
    [data-primary="24"] {
      --ddd-theme-primary: var(--ddd-primary-24);
      --ddd-theme-bgContrast: white;
    }
    [data-primary="25"] {
      --ddd-theme-primary: var(--ddd-primary-25);
      --ddd-theme-bgContrast: white;
    }

    /* accent color */
    [data-accent] {
      --ddd-theme-colorContrast: black;
    }
    [data-accent="0"] {
      --ddd-theme-accent: var(--ddd-accent-0);
    }
    [data-accent="1"] {
      --ddd-theme-accent: var(--ddd-accent-1);
    }
    [data-accent="2"] {
      --ddd-theme-accent: var(--ddd-accent-2);
    }
    [data-accent="3"] {
      --ddd-theme-accent: var(--ddd-accent-3);
    }
    [data-accent="4"] {
      --ddd-theme-accent: var(--ddd-accent-4);
    }
    [data-accent="5"] {
      --ddd-theme-accent: var(--ddd-accent-5);
    }
    [data-accent="6"] {
      --ddd-theme-accent: var(--ddd-accent-6);
    }
    [data-accent="7"] {
      --ddd-theme-accent: var(--ddd-accent-7);
    }
    [data-accent="8"] {
      --ddd-theme-accent: var(--ddd-accent-8);
    }
    [data-accent="9"] {
      --ddd-theme-accent: var(--ddd-accent-9);
    }
    [data-accent="10"] {
      --ddd-theme-accent: var(--ddd-accent-10);
    }
    [data-accent="11"] {
      --ddd-theme-accent: var(--ddd-accent-11);
    }
    [data-accent="12"] {
      --ddd-theme-accent: var(--ddd-accent-12);
    }
    [data-accent="13"] {
      --ddd-theme-accent: var(--ddd-accent-13);
    }
    [data-accent="14"] {
      --ddd-theme-accent: var(--ddd-accent-14);
    }

    [data-primary="19"][data-accent="11"],
    [data-primary="11"][data-accent="11"] {
      --lowContrast-override: black;
    }

    /* font family */

    [data-font-family="primary"] {
      font-family: var(--ddd-font-primary);
    }
    [data-font-family="secondary"] {
      font-family: var(--ddd-font-secondary);
    }
    [data-font-family="navigation"] {
      font-family: var(--ddd-font-navigation);
    }

    /* font weight */

    [data-font-weight="light"] {
      font-weight: var(--ddd-font-weight-light);
    }
    [data-font-weight="regular"] {
      font-weight: var(--ddd-font-weight-regular);
    }
    [data-font-weight="medium"] {
      font-weight: var(--ddd-font-weight-medium);
    }
    [data-font-weight="bold"] {
      font-weight: var(--ddd-font-weight-bold);
    }
    [data-font-weight="black"] {
      font-weight: var(--ddd-font-weight-black);
    }

    /* font size */
    /* normal line height if we are letting use mess w/ font size */
    [data-font-size] {
      line-height: normal;
    }
    [data-font-size="4xs"] {
      font-size: var(--ddd-font-size-4xs);
    }
    [data-font-size="3xs"] {
      font-size: var(--ddd-font-size-3xs);
    }
    [data-font-size="xxs"] {
      font-size: var(--ddd-font-size-xxs);
    }
    [data-font-size="xs"] {
      font-size: var(--ddd-font-size-xs);
    }
    [data-font-size="s"] {
      font-size: var(--ddd-font-size-s);
    }
    [data-font-size="ms"] {
      font-size: var(--ddd-font-size-ms);
    }
    [data-font-size="m"] {
      font-size: var(--ddd-font-size-m);
    }
    [data-font-size="ml"] {
      font-size: var(--ddd-font-size-ml);
    }
    [data-font-size="l"] {
      font-size: var(--ddd-font-size-l);
    }
    [data-font-size="xl"] {
      font-size: var(--ddd-font-size-xl);
    }
    [data-font-size="xxl"] {
      font-size: var(--ddd-font-size-xxl);
    }
    [data-font-size="3xl"] {
      font-size: var(--ddd-font-size-3xl);
    }
    [data-font-size="4xl"] {
      font-size: var(--ddd-font-size-4xl);
    }
    [data-font-size="type1-s"] {
      font-size: var(--ddd-font-size-type1-s);
    }
    [data-font-size="type1-m"] {
      font-size: var(--ddd-font-size-type1-m);
    }
    [data-font-size="type1-l"] {
      font-size: var(--ddd-font-size-type1-l);
    }
    /* padding spacing */
    [data-design-treatment="bg"][data-padding="xs"],
    [data-accent][data-padding="xs"],
    [data-padding="xs"] {
      padding: var(--ddd-spacing-2);
    }
    [data-design-treatment="bg"][data-padding="s"],
    [data-accent][data-padding="s"],
    [data-padding="s"] {
      padding: var(--ddd-spacing-4);
    }
    [data-design-treatment="bg"][data-padding="m"],
    [data-accent][data-padding="m"],
    [data-padding="m"] {
      padding: var(--ddd-spacing-8);
    }
    [data-design-treatment="bg"][data-padding="l"],
    [data-accent][data-padding="l"],
    [data-padding="l"] {
      padding: var(--ddd-spacing-12);
    }
    [data-design-treatment="bg"][data-padding="xl"],
    [data-accent][data-padding="xl"],
    [data-padding="xl"] {
      padding: var(--ddd-spacing-16);
    }
    /* margin spacing */
    [data-margin="xs"] {
      margin: var(--ddd-spacing-2);
    }
    [data-margin="s"] {
      margin: var(--ddd-spacing-4);
    }
    [data-margin="m"] {
      margin: var(--ddd-spacing-8);
    }
    [data-margin="l"] {
      margin: var(--ddd-spacing-12);
    }
    [data-margin="xl"] {
      margin: var(--ddd-spacing-16);
    }

    /* border width */
    p[data-border],
    blockquote[data-border],
    ol[data-border],
    ul[data-border],
    div[data-border] [data-border] {
      border-color: var(--ddd-theme-primary);
    }
    [data-border="xs"] {
      border: var(--ddd-border-xs);
      --ddd-theme-border-size: var(--ddd-border-size-xs);
    }
    [data-border="sm"] {
      border: var(--ddd-border-sm);
      --ddd-theme-border-size: var(--ddd-border-size-sm);
    }
    [data-border="md"] {
      border: var(--ddd-border-md);
      --ddd-theme-border-size: var(--ddd-border-size-md);
    }
    [data-border="lg"] {
      border: var(--ddd-border-lg);
      --ddd-theme-border-size: var(--ddd-border-size-lg);
    }

    /* border-radius */
    [data-border-radius="xs"] {
      border-radius: var(--ddd-radius-xs);
    }
    [data-border-radius="sm"] {
      border-radius: var(--ddd-radius-sm);
    }
    [data-border-radius="md"] {
      border-radius: var(--ddd-radius-md);
    }
    [data-border-radius="lg"] {
      border-radius: var(--ddd-radius-lg);
    }
    [data-border-radius="xl"] {
      border-radius: var(--ddd-radius-xl);
    }

    /* box-shadow */
    [data-box-shadow="sm"] {
      box-shadow: var(--ddd-boxShadow-sm);
    }
    [data-box-shadow="md"] {
      box-shadow: var(--ddd-boxShadow-md);
    }
    [data-box-shadow="lg"] {
      box-shadow: var(--ddd-boxShadow-lg);
    }
    [data-box-shadow="xl"] {
      box-shadow: var(--ddd-boxShadow-xl);
    }
  `,
  ...instructionalStyles,
];

/* Tag based application */
const DDDReset = i$2`
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    font-family: var(--ddd-font-primary);
    font-weight: var(--ddd-font-weight-bold);
    line-height: auto;
    letter-spacing: auto;
  }

  h1 {
    margin: var(--ddd-spacing-12) 0 var(--ddd-spacing-8);
  }
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin: var(--ddd-spacing-8) 0 var(--ddd-spacing-4);
    padding: 0;
  }
  h1 + h2,
  h1 + h3,
  h1 + h4,
  h1 + h5,
  h1 + h6,
  h2 + h3,
  h2 + h4,
  h2 + h5,
  h2 + h6,
  h3 + h4,
  h3 + h5,
  h3 + h6,
  h4 + h5,
  h4 + h6,
  h5 + h6 {
    margin-top: 0;
  }
  h1 {
    font-size: var(--ddd-theme-h1-font-size);
  }
  h2 {
    font-size: var(--ddd-theme-h2-font-size);
  }
  h3 {
    font-size: var(--ddd-theme-h3-font-size);
  }
  h4 {
    font-size: var(--ddd-theme-h4-font-size);
  }
  h5 {
    font-size: var(--ddd-theme-h5-font-size);
  }
  h6 {
    font-size: var(--ddd-theme-h6-font-size);
  }
  h1 + p,
  h2 + p,
  h3 + p,
  h4 + p,
  h5 + p,
  h6 + p {
    margin-top: 0;
  }
  p {
    margin: var(--ddd-spacing-6) 0;
  }
  dl {
    padding: var(--ddd-spacing-6);
    margin: 0;
    border: var(--ddd-border-sm);
  }
  dt {
    font-weight: var(--ddd-font-weight-bold);
    font-size: var(--ddd-theme-h6-font-size);
  }
  dd {
    margin-bottom: var(--ddd-spacing-4);
    margin-inline-start: var(--ddd-spacing-8);
  }

  p[data-accent],
  blockquote[data-accent],
  ol[data-accent],
  ul[data-accent],
  div[data-accent] {
    color: light-dark(currentcolor, var(--ddd-theme-colorContrast));
    border: var(--ddd-border-sm);
    border-color: var(--ddd-theme-primary);
    border-width: var(--ddd-theme-border-size);
    background-color: var(--ddd-theme-accent);
  }
  p[data-accent]:not([data-padding]),
  blockquote[data-accent]:not([data-padding]),
  ol[data-accent]:not([data-padding]),
  ul[data-accent]:not([data-padding]),
  div[data-accent]:not([data-padding]),
  p[data-border]:not([data-padding]),
  blockquote[data-border]:not([data-padding]),
  ol[data-border]:not([data-padding]),
  ul[data-border]:not([data-padding]),
  div[data-border]:not([data-padding]) {
    padding: var(--ddd-spacing-6);
  }
  ol[data-accent],
  ul[data-accent] {
    padding-left: var(--ddd-spacing-9);
  }
  /* p uniformity but ignore if either is in a slot */
  p:not([slot]) + p:not([slot]) {
    margin-top: 0;
  }

  /* heading presets */
  h1.type1 {
    font-size: var(--ddd-font-size-type1-s);
    font-weight: var(--ddd-font-weight-black);
    display: flex;
    text-align: center;
    justify-content: center;
    width: 100%;
    color: var(--ddd-theme-default-white);
    flex-wrap: nowrap;
    overflow-wrap: normal;
    text-wrap: wrap;
  }
  @media (min-width: 768px) {
    h1.type1 {
      font-size: var(--ddd-font-size-type1-m);
    }
  }
  @media (min-width: 1080px) {
    h1.type1 {
      font-size: var(--ddd-font-size-type1-l);
    }
  }

  h2.type2 {
    font-size: var(--ddd-font-size-4xl);
    color: var(--ddd-theme-default-beaverBlue);
  }
  .h2 > hr {
    width: 84px;
    border-width: 4px;
    margin-top: var(--ddd-spacing-6);
  }
  h2.type3 {
    font-size: var(--ddd-font-size-xxl);
    color: var(--ddd-theme-default-nittanyNavy);
  }

  a,
  a:any-link,
  a:-webkit-any-link {
    line-break: auto;
    color: light-dark(
      var(--ddd-theme-default-link),
      var(--ddd-theme-default-linkLight)
    );
    font-weight: var(--ddd-font-weight-bold);
    text-decoration: none;
    background-color: var(--ddd-theme-accent);
  }
  a:hover {
    text-decoration: underline;
    cursor: pointer;
  }

  thead,
  tbody,
  tfoot,
  tr,
  td,
  th {
    font-size: var(--ddd-theme-body-font-size);
    font-family: var(--ddd-font-primary);
  }
  ul,
  ol {
    font-size: var(--ddd-theme-body-font-size);
    display: flex;
    flex-flow: column;
    gap: var(--ddd-spacing-3);
    font-family: var(--ddd-font-primary);
    margin: 0 0 var(--ddd-spacing-6) 0;
  }
  ul.link-list {
    list-style: none;
  }
  ul.link-list li::after {
    content: url('data:image/svg+xml; utf8, <svg style="width:32px;height:32px;" fill="%23005fa9" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="%23005fa9" d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>');
    height: calc(var(--ddd-theme-body-font-size) + 2px);
    width: calc(var(--ddd-theme-body-font-size) + 2px);
    display: inline-block;
    position: relative;
    bottom: calc(-1 * var(--ddd-spacing-1));
    left: 0px;
  }
  ul li,
  ol li {
    font-size: var(--ddd-theme-body-font-size);
  }
  ul li::marker,
  ol li::marker {
    unicode-bidi: isolate;
    font-variant-numeric: tabular-nums;
    text-transform: none;
    text-indent: 0px;
    text-align: start;
    text-align-last: start;
  }
  ul {
    list-style: square;
  }
  ul li::marker {
    color: var(
      --lowContrast-override,
      var(--ddd-theme-primary, var(--ddd-theme-default-skyBlue))
    );
  }
  blockquote {
    font-family: var(--ddd-font-primary);
    font-size: var(--ddd-theme-body-font-size);
    font-style: italic;
    border-left: var(--ddd-spacing-1) solid var(--ddd-theme-primary);
    padding-left: var(--ddd-spacing-6);
    padding-bottom: var(--ddd-spacing-2);
    margin: var(--ddd-spacing-9) 0 var(--ddd-spacing-9) var(--ddd-spacing-10);
    line-height: var(--ddd-lh-150);
  }
  hr {
    display: block;
    border: none;
    border-color: var(--ddd-theme-primary);
    border-top-width: var(--ddd-theme-header-border-thickness);
    border-top-style: solid;
    margin: 0;
    padding: 0;
  }

  .h-invert {
    background-color: var(--ddd-theme-primary);
    color: var(--ddd-theme-bgContrast);
  }

  /** smooth transitions in hax when applying these design system attributes */
  [data-hax-ray][data-design-treatment],
  [data-hax-ray][data-accent],
  [data-hax-ray][data-primary],
  [data-hax-ray][data-padding],
  [data-hax-ray][data-margin] {
    transition:
      padding 0.3s ease-in-out,
      margin 0.3s ease-in-out,
      border 0.3s ease-in-out,
      color 0.3s ease-in-out,
      box-shadow 0.3s ease-in-out,
      border-radius 0.3s ease-in-out,
      background-color 0.3s ease-in-out;
  }

  [data-design-treatment="vert"] {
    border-bottom: none;
    border-left: var(--ddd-theme-header-border-thickness) solid
      var(--ddd-theme-primary, var(--ddd-primary-0));
    padding-left: var(--ddd-spacing-3);
  }

  [data-design-treatment="horz-10p"] {
    --ddd-theme-header-border-treatment: var(
      --ddd-theme-header-border-treatment-10p
    );
  }
  [data-design-treatment="horz-25p"] {
    --ddd-theme-header-border-treatment: var(
      --ddd-theme-header-border-treatment-25p
    );
  }
  [data-design-treatment="horz-50p"] {
    --ddd-theme-header-border-treatment: var(
      --ddd-theme-header-border-treatment-50p
    );
  }
  [data-design-treatment="horz-full"] {
    --ddd-theme-header-border-treatment: calc(
      var(--ddd-theme-header-border-treatment-full) - 32px
    );
  }
  [data-instructional-action][data-design-treatment="horz-full"] {
    --ddd-theme-header-border-treatment: calc(
      var(--ddd-theme-header-border-treatment-full) - 32px - 40px
    );
  }
  [data-design-treatment="horz-md"] {
    --ddd-theme-header-border-treatment: var(
      --ddd-theme-header-border-treatment-md
    );
  }
  [data-design-treatment="horz-lg"] {
    --ddd-theme-header-border-treatment: var(
      --ddd-theme-header-border-treatment-lg
    );
  }

  [data-design-treatment^="horz"]::after {
    content: "";
    transition: width 0.3s ease-in-out;
    width: var(--ddd-theme-header-border-treatment);
    border-bottom: var(--ddd-theme-header-border-thickness) solid
      var(--ddd-theme-primary, var(--ddd-primary-0));
    height: 0;
    display: block;
    padding-top: var(--ddd-spacing-2);
  }

  [data-instructional-action][data-design-treatment^="horz"]::after {
    content: "";
    width: var(--ddd-theme-header-border-treatment);
    border-bottom: var(--ddd-theme-header-border-thickness) solid
      var(--ddd-theme-primary, var(--ddd-primary-0));
    height: 0;
    display: block;
    position: relative;
    bottom: 12px;
    left: 32px;
    margin-left: var(--ddd-spacing-3);
  }

  [data-design-treatment="bg"] {
    background-color: var(--ddd-theme-primary, var(--ddd-primary-0));
    color: var(--ddd-theme-bgContrast);
    padding: var(--ddd-spacing-3);
  }

  [data-instructional-action][data-design-treatment="bg"] {
    padding: var(--ddd-spacing-2);
  }

  [data-instructional-action][data-design-treatment="bg"]::before {
    background-color: var(--ddd-theme-bgContrast, black);
    margin-right: var(--ddd-spacing-3);
    margin-left: var(--ddd-spacing-1);
  }

  [data-instructional-action]::before {
    content: "";
    display: inline-flex;
    position: relative;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 12px 0 0;
    margin: 8px 4px 0 0;
    z-index: 2;
    background-color: var(
      --lowContrast-override,
      var(--ddd-theme-primary, var(--instructional-action-color, blue))
    );
    mask-repeat: no-repeat;
    mask-size: contain;
    -webkit-mask-repeat: no-repeat;
    -webkit-mask-size: contain;
    height: var(--ddd-icon-sm);
    width: var(--ddd-icon-sm);
  }

  [data-design-treatment] {
    transition:
      0.3s ease-in-out margin,
      0.3s ease-in-out background-color,
      0.3s ease-in-out padding,
      0.3s ease-in-out border;
  }

  [data-accent] [data-design-treatment^="dropCap"] {
    min-height: calc(
      (var(--initialLetter) * var(--ddd-theme-body-font-size) + 20px)
    );
  }

  [data-design-treatment^="dropCap"] {
    --initialLetter: 6;
    min-height: calc(
      (var(--initialLetter) * var(--ddd-theme-body-font-size) * 1.5) + 20px
    );
  }

  [data-design-treatment^="dropCap"]::first-letter {
    -webkit-initial-letter: var(--initialLetter);
    text-transform: uppercase;
    initial-letter: var(--initialLetter);
    color: var(--ddd-theme-primary);
    font-weight: var(--ddd-font-weight-bold);
    margin-right: var(--ddd-spacing-3);
    padding: 0 var(--ddd-spacing-1);
    text-shadow:
      -3px -3px 0 #000,
      3px -3px 0 #000,
      -3px 3px 0 #000,
      3px 3px 0 #000,
      -3px 0 0 #000,
      3px 0 0 #000,
      0 -3px 0 #000,
      0 3px 0 #000;
  }
  [data-design-treatment="dropCap-xs"] {
    --initialLetter: 2;
  }

  [data-design-treatment="dropCap-sm"] {
    --initialLetter: 4;
  }

  [data-design-treatment="dropCap-md"] {
    --initialLetter: 6;
  }

  [data-design-treatment="dropCap-lg"] {
    --initialLetter: 8;
  }

  [data-design-treatment="dropCap-xl"] {
    --initialLetter: 10;
  }

  [data-design-treatment="dropCap-xs"]::first-letter {
    margin-right: var(--ddd-spacing-1);
  }

  [data-design-treatment="dropCap-sm"]::first-letter {
    margin-right: var(--ddd-spacing-2);
  }

  [data-design-treatment="dropCap-md"]::first-letter {
    margin-right: var(--ddd-spacing-3);
  }

  [data-design-treatment="dropCap-lg"]::first-letter {
    margin-right: var(--ddd-spacing-4);
  }

  [data-design-treatment="dropCap-xl"]::first-letter {
    margin-right: var(--ddd-spacing-5);
  }

  /* dropCap outline for low contrasting colors 
  [data-design-treatment^="dropCap"][data-primary="0"]::first-letter,
  [data-design-treatment^="dropCap"][data-primary="5"]::first-letter,
  [data-design-treatment^="dropCap"][data-accent][data-primary="7"]::first-letter,
  [data-design-treatment^="dropCap"][data-accent][data-primary="8"]::first-letter,
  [data-design-treatment^="dropCap"][data-accent][data-primary="9"]::first-letter,
  [data-design-treatment^="dropCap"][data-accent][data-primary="10"]::first-letter,
  [data-design-treatment^="dropCap"][data-accent][data-primary="12"]::first-letter,
  [data-design-treatment^="dropCap"][data-primary="14"]::first-letter,
  [data-design-treatment^="dropCap"][data-primary="15"]::first-letter,
  [data-design-treatment^="dropCap"][data-primary="16"]::first-letter,
  [data-design-treatment^="dropCap"][data-primary="18"]::first-letter,
  [data-design-treatment^="dropCap"][data-primary="21"]::first-letter
  */

  /** These are for Firefox / browsers not supporting dropcap in order to fake support */

  .dropCap-noSupport [data-design-treatment^="dropCap"]::first-letter {
    font-size: 180px;
    float: left;
    padding: 8px 0px 0px 0px;
  }

  .dropCap-noSupport [data-design-treatment^="dropCap-xs"]::first-letter {
    font-size: 56px;
    float: left;
    padding: 4px 0px 0px 0px;
  }

  .dropCap-noSupport [data-design-treatment^="dropCap-sm"]::first-letter {
    font-size: 112px;
    float: left;
    padding: 4px 0px 0px 0px;
  }

  .dropCap-noSupport [data-design-treatment^="dropCap-md"]::first-letter {
    font-size: 168px;
    float: left;
    padding: 8px 0px 0px 0px;
  }

  .dropCap-noSupport [data-design-treatment^="dropCap-lg"]::first-letter {
    font-size: 230px;
    float: left;
    padding: 12px 0px 0px 0px;
  }

  .dropCap-noSupport [data-design-treatment^="dropCap-xl"]::first-letter {
    font-size: 300px;
    float: left;
    padding: 12px 0px 0px 0px;
  }

  h2 > hr {
    margin-top: var(--ddd-spacing-4);
  }

  .ddd-theme-header-border-thickness-0 {
    --ddd-theme-header-border-thickness: var(
      --ddd-theme-header-border-thickness-0
    );
  }
  .ddd-theme-header-border-thickness-xs {
    --ddd-theme-header-border-thickness: var(
      --ddd-theme-header-border-thickness-xs
    );
  }
  .ddd-theme-header-border-thickness-sm {
    --ddd-theme-header-border-thickness: var(
      --ddd-theme-header-border-thickness-sm
    );
  }
  .ddd-theme-header-border-thickness-md {
    --ddd-theme-header-border-thickness: var(
      --ddd-theme-header-border-thickness-md
    );
  }
  .ddd-theme-header-border-thickness-lg {
    --ddd-theme-header-border-thickness: var(
      --ddd-theme-header-border-thickness-lg
    );
  }

  .ddd-theme-header-border-treatment-0 {
    --ddd-theme-header-border-treatment: var(
      --ddd-theme-header-border-treatment-0
    );
  }
  .ddd-theme-header-border-treatment-sm {
    --ddd-theme-header-border-treatment: var(
      --ddd-theme-header-border-treatment-sm
    );
  }
  .ddd-theme-header-border-treatment-md {
    --ddd-theme-header-border-treatment: var(
      --ddd-theme-header-border-treatment-md
    );
  }
  .ddd-theme-header-border-treatment-lg {
    --ddd-theme-header-border-treatment: var(
      --ddd-theme-header-border-treatment-lg
    );
  }
  .ddd-theme-header-border-treatment-10p {
    --ddd-theme-header-border-treatment: var(
      --ddd-theme-header-border-treatment-10p
    );
  }
  .ddd-theme-header-border-treatment-25p {
    --ddd-theme-header-border-treatment: var(
      --ddd-theme-header-border-treatment-25p
    );
  }
  .ddd-theme-header-border-treatment-50p {
    --ddd-theme-header-border-treatment: var(
      --ddd-theme-header-border-treatment-50p
    );
  }
  .ddd-theme-header-border-treatment-75p {
    --ddd-theme-header-border-treatment: var(
      --ddd-theme-header-border-treatment-75p
    );
  }
  .ddd-theme-header-border-treatment-full {
    --ddd-theme-header-border-treatment: var(
      --ddd-theme-header-border-treatment-full
    );
  }
  summary {
    display: flex;
    font-size: var(--ddd-theme-h4-font-size);
    font-weight: var(--ddd-font-weight-bold);
    color: light-dark(
      var(
        --lowContrast-override,
        var(--ddd-theme-primary, var(--ddd-theme-default-nittanyNavy))
      ),
      var(--ddd-theme-default-linkLight)
    );
    cursor: pointer;
    text-wrap: wrap;
    align-items: center;
    padding: var(--ddd-spacing-5) var(--ddd-spacing-4);
    user-select: none;
    transition: all 0.3s ease-in-out;
  }
  summary::marker {
    content: "";
  }
  summary::after {
    content: "+";
    margin-left: auto;
    text-align: right;
    color: light-dark(
      var(
        --lowContrast-override,
        var(--ddd-theme-primary, var(--ddd-theme-default-nittanyNavy))
      ),
      var(--ddd-theme-default-linkLight)
    );
    font-weight: var(--ddd-font-weight-regular);
    font-size: var(--ddd-font-size-m);
    line-height: 1;
  }
  details {
    overflow: hidden;
    display: flex;
    position: relative;
    max-width: 650px;
    padding: 0;
    color: light-dark(black, white);
    margin: 0;
  }
  details[disabled] {
    cursor: not-allowed;
    pointer-events: none;
    opacity: 0.5;
  }
  details[open] > summary::after {
    content: "-";
  }
  details[open] > summary {
    color: light-dark(
      var(
        --lowContrast-override,
        var(--ddd-theme-primary, var(--ddd-theme-default-nittanyNavy))
      ),
      var(--ddd-theme-default-linkLight)
    );
    filter: saturate(1.5);
  }
  details[open] > summary {
    background-color: light-dark(
      var(--ddd-theme-default-limestoneMaxLight),
      var(--ddd-theme-default-potentialMidnight)
    );
  }
  details summary:focus,
  details summary:hover {
    background-color: light-dark(
      var(--ddd-theme-default-limestoneLight),
      var(--ddd-theme-default-nittanyNavy)
    );
  }

  code {
    transition: all 0.3s ease 0s;
    display: inline-block;
    padding: 2px var(--ddd-spacing-1); /* breaking DDD spacing sys on purpose for code */
    margin: 0 var(--ddd-spacing-1);
    font-size: calc(var(--ddd-theme-body-font-size) - var(--ddd-spacing-1));
    background-color: var(
      --ddd-theme-code-background-color,
      light-dark(var(--ddd-theme-default-limestoneLight), black)
    );
    color: var(
      --ddd-theme-code-color,
      light-dark(black, var(--ddd-theme-default-limestoneLight))
    );
    line-height: 1;
    border-radius: var(--ddd-radius-xs);
    border: var(--ddd-border-md);
    border-style: groove;
    border-color: light-dark(var(--ddd-theme-default-limestoneMaxLight), black);
    font-family: monospace;
    letter-spacing: var(--ddd-ls-16-lg);
    pointer-events: auto;
  }
  code.block-code {
    padding: var(--ddd-spacing-2);
    margin: var(--ddd-spacing-5) 0;
  }
  code::-moz-selection {
    /* Code for Firefox */
    background: var(--ddd-theme-default-keystoneYellow);
  }
  code::selection {
    background: var(--ddd-theme-default-keystoneYellow);
  }

  pre {
    display: inline-block;
    padding: var(--ddd-spacing-4);
    overflow: auto;
    background-color: var(
      --ddd-theme-default-limestoneMaxLight,
      rgba(175, 184, 193, 0.2)
    );
    border-radius: var(--ddd-radius-sm);
    margin: var(--ddd-spacing-1) 0;
    word-break: normal;
    word-wrap: normal;
    font-size: var(--ddd-theme-body-font-size);
  }
  mark {
    font-weight: var(--ddd-font-weight-medium);
    padding: var(--ddd-spacing-1) var(--ddd-spacing-2);
    border-radius: var(--ddd-radius-xs);
    background-color: var(
      --ddd-theme-primary,
      var(--ddd-theme-default-keystoneYellow)
    );
    color: var(--ddd-theme-bgContrast, black);
  }
  abbr {
    background-color: var(
      --ddd-theme-primary,
      var(--ddd-theme-default-keystoneYellow)
    );
    transition: all 0.3s ease 0s;
    padding: var(--ddd-spacing-1) var(--ddd-spacing-2);
    font-style: italic;
    text-decoration: underline;
    pointer-events: auto;
    cursor: pointer;
    outline-color: var(
      --ddd-theme-primary,
      var(--ddd-theme-default-keystoneYellow)
    );
    color: var(--ddd-theme-bgContrast, black);
    position: relative;
  }
  abbr:focus,
  abbr:active,
  abbr:hover {
    text-decoration: none;
    background-color: var(
      --ddd-theme-primary,
      var(--ddd-theme-default-keystoneYellow)
    );
    outline-offset: 2px;
    outline-style: dotted;
    outline-width: 2px;
  }
  abbr:focus::after,
  abbr:active::after,
  abbr:hover::after {
    content: attr(title);
    position: absolute;
    white-space: nowrap;
    font-style: normal;
    position: absolute;
    bottom: 100%;
    left: 0;
    width: fit-content;
    height: fit-content;
    padding: var(--ddd-spacing-1) var(--ddd-spacing-2);
    color: var(--ddd-theme-font-color, var(--ddd-theme-default-white, #fff));
    background-color: var(--ddd-theme-default-info, rgba(175, 184, 193, 0.2));
    font-size: var(--ddd-theme-body-font-size);
    font-weight: var(--ddd-font-weight-regular);
    border-radius: var(--ddd-radius-xs);
  }
  div[slot="citation"] {
    font-size: var(--ddd-font-size-4xs);
  }
  *::selection {
    background-color: var(--ddd-theme-default-linkLight);
  }
  select {
    display: flex;
    box-sizing: border-box;
    transition: all 0.3s ease 0s;
    cursor: pointer;
    color: var(--ddd-theme-default-coalyGray);
    width: fit-content;
    border: var(--ddd-border-xs);
    background-color: var(--ddd-theme-default-white);
    font-family: var(--ddd-font-primary);
    font-weight: var(--ddd-font-weight-regular);
    font-size: var(--ddd-theme-body-font-size);
    line-height: 150%;
    letter-spacing: normal;
    padding: var(--ddd-spacing-2);
    border-radius: var(--ddd-radius-xs);
    border-color: var(--ddd-theme-default-potential50);
  }
  hax-body,
  .haxcms-theme-element {
    line-height: var(--ddd-lh-150);
    font-size: var(--ddd-theme-body-font-size);
    font-family: var(--ddd-font-primary);
    letter-spacing: normal;
    text-align: justify;
  }
`;
/* border & shadows */
const DDDBorders = i$2`
  .b-0 {
    border: none;
  }
  .b-xs {
    border: var(--ddd-border-xs);
  }
  .b-sm {
    border: var(--ddd-border-sm);
  }
  .b-md {
    border: var(--ddd-border-md);
  }
  .b-lg {
    border: var(--ddd-border-lg);
  }
  .bt-0 {
    border-top: none;
  }
  .bt-xs {
    border-top: var(--ddd-border-xs);
  }
  .bt-sm {
    border-top: var(--ddd-border-sm);
  }
  .bt-md {
    border-top: 3px solid var(--ddd-theme-default-limestoneLight);
  }
  .bt-lg {
    border-top: 4px solid var(--ddd-theme-default-limestoneLight);
  }
  .br-0 {
    border-right: none;
  }
  .br-xs {
    border-right: var(--ddd-border-xs);
  }
  .br-sm {
    border-right: var(--ddd-border-sm);
  }
  .br-md {
    border-right: 3px solid var(--ddd-theme-default-limestoneLight);
  }
  .br-lg {
    border-right: 4px solid var(--ddd-theme-default-limestoneLight);
  }
  .bb-0 {
    border-bottom: none;
  }
  .bb-xs {
    border-bottom: var(--ddd-border-xs);
  }
  .bb-sm {
    border-bottom: var(--ddd-border-sm);
  }
  .bb-md {
    border-bottom: 3px solid var(--ddd-theme-default-limestoneLight);
  }
  .bb-lg {
    border-bottom: 4px solid var(--ddd-theme-default-limestoneLight);
  }
  .bl-0 {
    border-left: none;
  }
  .bl-xs {
    border-left: var(--ddd-border-xs);
  }
  .bl-sm {
    border-left: var(--ddd-border-sm);
  }
  .bl-md {
    border-left: 3px solid var(--ddd-theme-default-limestoneLight);
  }
  .bl-lg {
    border-left: 4px solid var(--ddd-theme-default-limestoneLight);
  }
`;
/* margin & padding */
const DDDMarginPadding = i$2`
  .m-auto {
    margin: auto;
  }
  .m-0 {
    margin: var(--ddd-spacing-0);
  }
  .m-1 {
    margin: var(--ddd-spacing-1);
  }
  .m-2 {
    margin: var(--ddd-spacing-2);
  }
  .m-3 {
    margin: var(--ddd-spacing-3);
  }
  .m-4 {
    margin: var(--ddd-spacing-4);
  }
  .m-5 {
    margin: var(--ddd-spacing-5);
  }
  .m-6 {
    margin: var(--ddd-spacing-6);
  }
  .m-7 {
    margin: var(--ddd-spacing-7);
  }
  .m-8 {
    margin: var(--ddd-spacing-8);
  }
  .m-9 {
    margin: var(--ddd-spacing-9);
  }
  .m-10 {
    margin: var(--ddd-spacing-10);
  }
  .m-11 {
    margin: var(--ddd-spacing-11);
  }
  .m-12 {
    margin: var(--ddd-spacing-12);
  }
  .m-13 {
    margin: var(--ddd-spacing-13);
  }
  .m-14 {
    margin: var(--ddd-spacing-14);
  }
  .m-15 {
    margin: var(--ddd-spacing-15);
  }
  .m-16 {
    margin: var(--ddd-spacing-16);
  }
  .m-17 {
    margin: var(--ddd-spacing-17);
  }
  .m-18 {
    margin: var(--ddd-spacing-18);
  }
  .m-19 {
    margin: var(--ddd-spacing-19);
  }
  .m-20 {
    margin: var(--ddd-spacing-20);
  }
  .m-21 {
    margin: var(--ddd-spacing-21);
  }
  .m-22 {
    margin: var(--ddd-spacing-22);
  }
  .m-23 {
    margin: var(--ddd-spacing-23);
  }
  .m-24 {
    margin: var(--ddd-spacing-24);
  }
  .m-25 {
    margin: var(--ddd-spacing-25);
  }
  .m-26 {
    margin: var(--ddd-spacing-26);
  }
  .m-27 {
    margin: var(--ddd-spacing-27);
  }
  .m-28 {
    margin: var(--ddd-spacing-28);
  }
  .m-29 {
    margin: var(--ddd-spacing-29);
  }
  .m-30 {
    margin: var(--ddd-spacing-30);
  }
  .mt-auto {
    margin-top: auto;
  }
  .mt-0 {
    margin-top: var(--ddd-spacing-0);
  }
  .mt-1 {
    margin-top: var(--ddd-spacing-1);
  }
  .mt-2 {
    margin-top: var(--ddd-spacing-2);
  }
  .mt-3 {
    margin-top: var(--ddd-spacing-3);
  }
  .mt-4 {
    margin-top: var(--ddd-spacing-4);
  }
  .mt-5 {
    margin-top: var(--ddd-spacing-5);
  }
  .mt-6 {
    margin-top: var(--ddd-spacing-6);
  }
  .mt-7 {
    margin-top: var(--ddd-spacing-7);
  }
  .mt-8 {
    margin-top: var(--ddd-spacing-8);
  }
  .mt-9 {
    margin-top: var(--ddd-spacing-9);
  }
  .mt-10 {
    margin-top: var(--ddd-spacing-10);
  }
  .mt-11 {
    margin-top: var(--ddd-spacing-11);
  }
  .mt-12 {
    margin-top: var(--ddd-spacing-12);
  }
  .mt-13 {
    margin-top: var(--ddd-spacing-13);
  }
  .mt-14 {
    margin-top: var(--ddd-spacing-14);
  }
  .mt-15 {
    margin-top: var(--ddd-spacing-15);
  }
  .mt-16 {
    margin-top: var(--ddd-spacing-16);
  }
  .mt-17 {
    margin-top: var(--ddd-spacing-17);
  }
  .mt-18 {
    margin-top: var(--ddd-spacing-18);
  }
  .mt-19 {
    margin-top: var(--ddd-spacing-19);
  }
  .mt-20 {
    margin-top: var(--ddd-spacing-20);
  }
  .mt-21 {
    margin-top: var(--ddd-spacing-21);
  }
  .mt-22 {
    margin-top: var(--ddd-spacing-22);
  }
  .mt-23 {
    margin-top: var(--ddd-spacing-23);
  }
  .mt-24 {
    margin-top: var(--ddd-spacing-24);
  }
  .mt-25 {
    margin-top: var(--ddd-spacing-25);
  }
  .mt-26 {
    margin-top: var(--ddd-spacing-26);
  }
  .mt-27 {
    margin-top: var(--ddd-spacing-27);
  }
  .mt-28 {
    margin-top: var(--ddd-spacing-28);
  }
  .mt-29 {
    margin-top: var(--ddd-spacing-29);
  }
  .mt-30 {
    margin-top: var(--ddd-spacing-30);
  }
  .mb-auto {
    margin-bottom: auto;
  }
  .mb-0 {
    margin-bottom: var(--ddd-spacing-0);
  }
  .mb-1 {
    margin-bottom: var(--ddd-spacing-1);
  }
  .mb-2 {
    margin-bottom: var(--ddd-spacing-2);
  }
  .mb-3 {
    margin-bottom: var(--ddd-spacing-3);
  }
  .mb-4 {
    margin-bottom: var(--ddd-spacing-4);
  }
  .mb-5 {
    margin-bottom: var(--ddd-spacing-5);
  }
  .mb-6 {
    margin-bottom: var(--ddd-spacing-6);
  }
  .mb-7 {
    margin-bottom: var(--ddd-spacing-7);
  }
  .mb-8 {
    margin-bottom: var(--ddd-spacing-8);
  }
  .mb-9 {
    margin-bottom: var(--ddd-spacing-9);
  }
  .mb-10 {
    margin-bottom: var(--ddd-spacing-10);
  }
  .mb-11 {
    margin-bottom: var(--ddd-spacing-11);
  }
  .mb-12 {
    margin-bottom: var(--ddd-spacing-12);
  }
  .mb-13 {
    margin-bottom: var(--ddd-spacing-13);
  }
  .mb-14 {
    margin-bottom: var(--ddd-spacing-14);
  }
  .mb-15 {
    margin-bottom: var(--ddd-spacing-15);
  }
  .mb-16 {
    margin-bottom: var(--ddd-spacing-16);
  }
  .mb-17 {
    margin-bottom: var(--ddd-spacing-17);
  }
  .mb-18 {
    margin-bottom: var(--ddd-spacing-18);
  }
  .mb-19 {
    margin-bottom: var(--ddd-spacing-19);
  }
  .mb-20 {
    margin-bottom: var(--ddd-spacing-20);
  }
  .mb-21 {
    margin-bottom: var(--ddd-spacing-21);
  }
  .mb-22 {
    margin-bottom: var(--ddd-spacing-22);
  }
  .mb-23 {
    margin-bottom: var(--ddd-spacing-23);
  }
  .mb-24 {
    margin-bottom: var(--ddd-spacing-24);
  }
  .mb-25 {
    margin-bottom: var(--ddd-spacing-25);
  }
  .mb-26 {
    margin-bottom: var(--ddd-spacing-26);
  }
  .mb-27 {
    margin-bottom: var(--ddd-spacing-27);
  }
  .mb-28 {
    margin-bottom: var(--ddd-spacing-28);
  }
  .mb-29 {
    margin-bottom: var(--ddd-spacing-29);
  }
  .mb-30 {
    margin-bottom: var(--ddd-spacing-30);
  }
  .ml-auto {
    margin-left: auto;
  }
  .ml-0 {
    margin-left: var(--ddd-spacing-0);
  }
  .ml-1 {
    margin-left: var(--ddd-spacing-1);
  }
  .ml-2 {
    margin-left: var(--ddd-spacing-2);
  }
  .ml-3 {
    margin-left: var(--ddd-spacing-3);
  }
  .ml-4 {
    margin-left: var(--ddd-spacing-4);
  }
  .ml-5 {
    margin-left: var(--ddd-spacing-5);
  }
  .ml-6 {
    margin-left: var(--ddd-spacing-6);
  }
  .ml-7 {
    margin-left: var(--ddd-spacing-7);
  }
  .ml-8 {
    margin-left: var(--ddd-spacing-8);
  }
  .ml-9 {
    margin-left: var(--ddd-spacing-9);
  }
  .ml-10 {
    margin-left: var(--ddd-spacing-10);
  }
  .ml-11 {
    margin-left: var(--ddd-spacing-11);
  }
  .ml-12 {
    margin-left: var(--ddd-spacing-12);
  }
  .ml-13 {
    margin-left: var(--ddd-spacing-13);
  }
  .ml-14 {
    margin-left: var(--ddd-spacing-14);
  }
  .ml-15 {
    margin-left: var(--ddd-spacing-15);
  }
  .ml-16 {
    margin-left: var(--ddd-spacing-16);
  }
  .ml-17 {
    margin-left: var(--ddd-spacing-17);
  }
  .ml-18 {
    margin-left: var(--ddd-spacing-18);
  }
  .ml-19 {
    margin-left: var(--ddd-spacing-19);
  }
  .ml-20 {
    margin-left: var(--ddd-spacing-20);
  }
  .ml-21 {
    margin-left: var(--ddd-spacing-21);
  }
  .ml-22 {
    margin-left: var(--ddd-spacing-22);
  }
  .ml-23 {
    margin-left: var(--ddd-spacing-23);
  }
  .ml-24 {
    margin-left: var(--ddd-spacing-24);
  }
  .ml-25 {
    margin-left: var(--ddd-spacing-25);
  }
  .ml-26 {
    margin-left: var(--ddd-spacing-26);
  }
  .ml-27 {
    margin-left: var(--ddd-spacing-27);
  }
  .ml-28 {
    margin-left: var(--ddd-spacing-28);
  }
  .ml-29 {
    margin-left: var(--ddd-spacing-29);
  }
  .ml-30 {
    margin-left: var(--ddd-spacing-30);
  }
  .mr-auto {
    margin-right: auto;
  }
  .mr-0 {
    margin-right: var(--ddd-spacing-0);
  }
  .mr-1 {
    margin-right: var(--ddd-spacing-1);
  }
  .mr-2 {
    margin-right: var(--ddd-spacing-2);
  }
  .mr-3 {
    margin-right: var(--ddd-spacing-3);
  }
  .mr-4 {
    margin-right: var(--ddd-spacing-4);
  }
  .mr-5 {
    margin-right: var(--ddd-spacing-5);
  }
  .mr-6 {
    margin-right: var(--ddd-spacing-6);
  }
  .mr-7 {
    margin-right: var(--ddd-spacing-7);
  }
  .mr-8 {
    margin-right: var(--ddd-spacing-8);
  }
  .mr-9 {
    margin-right: var(--ddd-spacing-9);
  }
  .mr-10 {
    margin-right: var(--ddd-spacing-10);
  }
  .mr-11 {
    margin-right: var(--ddd-spacing-11);
  }
  .mr-12 {
    margin-right: var(--ddd-spacing-12);
  }
  .mr-13 {
    margin-right: var(--ddd-spacing-13);
  }
  .mr-14 {
    margin-right: var(--ddd-spacing-14);
  }
  .mr-15 {
    margin-right: var(--ddd-spacing-15);
  }
  .mr-16 {
    margin-right: var(--ddd-spacing-16);
  }
  .mr-17 {
    margin-right: var(--ddd-spacing-17);
  }
  .mr-18 {
    margin-right: var(--ddd-spacing-18);
  }
  .mr-19 {
    margin-right: var(--ddd-spacing-19);
  }
  .mr-20 {
    margin-right: var(--ddd-spacing-20);
  }
  .mr-21 {
    margin-right: var(--ddd-spacing-21);
  }
  .mr-22 {
    margin-right: var(--ddd-spacing-22);
  }
  .mr-23 {
    margin-right: var(--ddd-spacing-23);
  }
  .mr-24 {
    margin-right: var(--ddd-spacing-24);
  }
  .mr-25 {
    margin-right: var(--ddd-spacing-25);
  }
  .mr-26 {
    margin-right: var(--ddd-spacing-26);
  }
  .mr-27 {
    margin-right: var(--ddd-spacing-27);
  }
  .mr-28 {
    margin-right: var(--ddd-spacing-28);
  }
  .mr-29 {
    margin-right: var(--ddd-spacing-29);
  }
  .mr-30 {
    margin-right: var(--ddd-spacing-30);
  }
  .mx-auto {
    margin-left: auto;
    margin-right: auto;
  }
  .mx-0 {
    margin-left: var(--ddd-spacing-0);
    margin-right: var(--ddd-spacing-0);
  }
  .mx-1 {
    margin-left: var(--ddd-spacing-1);
    margin-right: var(--ddd-spacing-1);
  }
  .mx-2 {
    margin-left: var(--ddd-spacing-2);
    margin-right: var(--ddd-spacing-2);
  }
  .mx-3 {
    margin-left: var(--ddd-spacing-3);
    margin-right: var(--ddd-spacing-3);
  }
  .mx-4 {
    margin-left: var(--ddd-spacing-4);
    margin-right: var(--ddd-spacing-4);
  }
  .mx-5 {
    margin-left: var(--ddd-spacing-5);
    margin-right: var(--ddd-spacing-5);
  }
  .mx-6 {
    margin-left: var(--ddd-spacing-6);
    margin-right: var(--ddd-spacing-6);
  }
  .mx-7 {
    margin-left: var(--ddd-spacing-7);
    margin-right: var(--ddd-spacing-7);
  }
  .mx-8 {
    margin-left: var(--ddd-spacing-8);
    margin-right: var(--ddd-spacing-8);
  }
  .mx-9 {
    margin-left: var(--ddd-spacing-9);
    margin-right: var(--ddd-spacing-9);
  }
  .mx-10 {
    margin-left: var(--ddd-spacing-10);
    margin-right: var(--ddd-spacing-10);
  }
  .mx-11 {
    margin-left: var(--ddd-spacing-11);
    margin-right: var(--ddd-spacing-11);
  }
  .mx-12 {
    margin-left: var(--ddd-spacing-12);
    margin-right: var(--ddd-spacing-12);
  }
  .mx-13 {
    margin-left: var(--ddd-spacing-13);
    margin-right: var(--ddd-spacing-13);
  }
  .mx-14 {
    margin-left: var(--ddd-spacing-14);
    margin-right: var(--ddd-spacing-14);
  }
  .mx-15 {
    margin-left: var(--ddd-spacing-15);
    margin-right: var(--ddd-spacing-15);
  }
  .mx-16 {
    margin-left: var(--ddd-spacing-16);
    margin-right: var(--ddd-spacing-16);
  }
  .mx-17 {
    margin-left: var(--ddd-spacing-17);
    margin-right: var(--ddd-spacing-17);
  }
  .mx-18 {
    margin-left: var(--ddd-spacing-18);
    margin-right: var(--ddd-spacing-18);
  }
  .mx-19 {
    margin-left: var(--ddd-spacing-19);
    margin-right: var(--ddd-spacing-19);
  }
  .mx-20 {
    margin-left: var(--ddd-spacing-20);
    margin-right: var(--ddd-spacing-20);
  }
  .mx-21 {
    margin-left: var(--ddd-spacing-21);
    margin-right: var(--ddd-spacing-21);
  }
  .mx-22 {
    margin-left: var(--ddd-spacing-22);
    margin-right: var(--ddd-spacing-22);
  }
  .mx-23 {
    margin-left: var(--ddd-spacing-23);
    margin-right: var(--ddd-spacing-23);
  }
  .mx-24 {
    margin-left: var(--ddd-spacing-24);
    margin-right: var(--ddd-spacing-24);
  }
  .mx-25 {
    margin-left: var(--ddd-spacing-25);
    margin-right: var(--ddd-spacing-25);
  }
  .mx-26 {
    margin-left: var(--ddd-spacing-26);
    margin-right: var(--ddd-spacing-26);
  }
  .mx-27 {
    margin-left: var(--ddd-spacing-27);
    margin-right: var(--ddd-spacing-27);
  }
  .mx-28 {
    margin-left: var(--ddd-spacing-28);
    margin-right: var(--ddd-spacing-28);
  }
  .mx-29 {
    margin-left: var(--ddd-spacing-29);
    margin-right: var(--ddd-spacing-29);
  }
  .mx-30 {
    margin-left: var(--ddd-spacing-30);
    margin-right: var(--ddd-spacing-30);
  }
  .my-auto {
    margin-top: auto;
    margin-bottom: auto;
  }
  .my-0 {
    margin-top: var(--ddd-spacing-0);
    margin-bottom: var(--ddd-spacing-0);
  }
  .my-1 {
    margin-top: var(--ddd-spacing-1);
    margin-bottom: var(--ddd-spacing-1);
  }
  .my-2 {
    margin-top: var(--ddd-spacing-2);
    margin-bottom: var(--ddd-spacing-2);
  }
  .my-3 {
    margin-top: var(--ddd-spacing-3);
    margin-bottom: var(--ddd-spacing-3);
  }
  .my-4 {
    margin-top: var(--ddd-spacing-4);
    margin-bottom: var(--ddd-spacing-4);
  }
  .my-5 {
    margin-top: var(--ddd-spacing-5);
    margin-bottom: var(--ddd-spacing-5);
  }
  .my-6 {
    margin-top: var(--ddd-spacing-6);
    margin-bottom: var(--ddd-spacing-6);
  }
  .my-7 {
    margin-top: var(--ddd-spacing-7);
    margin-bottom: var(--ddd-spacing-7);
  }
  .my-8 {
    margin-top: var(--ddd-spacing-8);
    margin-bottom: var(--ddd-spacing-8);
  }
  .my-9 {
    margin-top: var(--ddd-spacing-9);
    margin-bottom: var(--ddd-spacing-9);
  }
  .my-10 {
    margin-top: var(--ddd-spacing-10);
    margin-bottom: var(--ddd-spacing-10);
  }
  .my-11 {
    margin-top: var(--ddd-spacing-11);
    margin-bottom: var(--ddd-spacing-11);
  }
  .my-12 {
    margin-top: var(--ddd-spacing-12);
    margin-bottom: var(--ddd-spacing-12);
  }
  .my-13 {
    margin-top: var(--ddd-spacing-13);
    margin-bottom: var(--ddd-spacing-13);
  }
  .my-14 {
    margin-top: var(--ddd-spacing-14);
    margin-bottom: var(--ddd-spacing-14);
  }
  .my-15 {
    margin-top: var(--ddd-spacing-15);
    margin-bottom: var(--ddd-spacing-15);
  }
  .my-16 {
    margin-top: var(--ddd-spacing-16);
    margin-bottom: var(--ddd-spacing-16);
  }
  .my-17 {
    margin-top: var(--ddd-spacing-17);
    margin-bottom: var(--ddd-spacing-17);
  }
  .my-18 {
    margin-top: var(--ddd-spacing-18);
    margin-bottom: var(--ddd-spacing-18);
  }
  .my-19 {
    margin-top: var(--ddd-spacing-19);
    margin-bottom: var(--ddd-spacing-19);
  }
  .my-20 {
    margin-top: var(--ddd-spacing-20);
    margin-bottom: var(--ddd-spacing-20);
  }
  .my-21 {
    margin-top: var(--ddd-spacing-21);
    margin-bottom: var(--ddd-spacing-21);
  }
  .my-22 {
    margin-top: var(--ddd-spacing-22);
    margin-bottom: var(--ddd-spacing-22);
  }
  .my-23 {
    margin-top: var(--ddd-spacing-23);
    margin-bottom: var(--ddd-spacing-23);
  }
  .my-24 {
    margin-top: var(--ddd-spacing-24);
    margin-bottom: var(--ddd-spacing-24);
  }
  .my-25 {
    margin-top: var(--ddd-spacing-25);
    margin-bottom: var(--ddd-spacing-25);
  }
  .my-26 {
    margin-top: var(--ddd-spacing-26);
    margin-bottom: var(--ddd-spacing-26);
  }
  .my-27 {
    margin-top: var(--ddd-spacing-27);
    margin-bottom: var(--ddd-spacing-27);
  }
  .my-28 {
    margin-top: var(--ddd-spacing-28);
    margin-bottom: var(--ddd-spacing-28);
  }
  .my-29 {
    margin-top: var(--ddd-spacing-29);
    margin-bottom: var(--ddd-spacing-29);
  }
  .my-30 {
    margin-top: var(--ddd-spacing-30);
    margin-bottom: var(--ddd-spacing-30);
  }
  .p-auto {
    padding: auto;
  }
  .p-0 {
    padding: var(--ddd-spacing-0);
  }
  .p-1 {
    padding: var(--ddd-spacing-1);
  }
  .p-2 {
    padding: var(--ddd-spacing-2);
  }
  .p-3 {
    padding: var(--ddd-spacing-3);
  }
  .p-4 {
    padding: var(--ddd-spacing-4);
  }
  .p-5 {
    padding: var(--ddd-spacing-5);
  }
  .p-6 {
    padding: var(--ddd-spacing-6);
  }
  .p-7 {
    padding: var(--ddd-spacing-7);
  }
  .p-8 {
    padding: var(--ddd-spacing-8);
  }
  .p-9 {
    padding: var(--ddd-spacing-9);
  }
  .p-10 {
    padding: var(--ddd-spacing-10);
  }
  .p-11 {
    padding: var(--ddd-spacing-11);
  }
  .p-12 {
    padding: var(--ddd-spacing-12);
  }
  .p-13 {
    padding: var(--ddd-spacing-13);
  }
  .p-14 {
    padding: var(--ddd-spacing-14);
  }
  .p-15 {
    padding: var(--ddd-spacing-15);
  }
  .p-16 {
    padding: var(--ddd-spacing-16);
  }
  .p-17 {
    padding: var(--ddd-spacing-17);
  }
  .p-18 {
    padding: var(--ddd-spacing-18);
  }
  .p-19 {
    padding: var(--ddd-spacing-19);
  }
  .p-20 {
    padding: var(--ddd-spacing-20);
  }
  .p-21 {
    padding: var(--ddd-spacing-21);
  }
  .p-22 {
    padding: var(--ddd-spacing-22);
  }
  .p-23 {
    padding: var(--ddd-spacing-23);
  }
  .p-24 {
    padding: var(--ddd-spacing-24);
  }
  .p-25 {
    padding: var(--ddd-spacing-25);
  }
  .p-26 {
    padding: var(--ddd-spacing-26);
  }
  .p-27 {
    padding: var(--ddd-spacing-27);
  }
  .p-28 {
    padding: var(--ddd-spacing-28);
  }
  .p-29 {
    padding: var(--ddd-spacing-29);
  }
  .p-30 {
    padding: var(--ddd-spacing-30);
  }
  .pt-auto {
    padding-top: auto;
  }
  .pt-0 {
    padding-top: var(--ddd-spacing-0);
  }
  .pt-1 {
    padding-top: var(--ddd-spacing-1);
  }
  .pt-2 {
    padding-top: var(--ddd-spacing-2);
  }
  .pt-3 {
    padding-top: var(--ddd-spacing-3);
  }
  .pt-4 {
    padding-top: var(--ddd-spacing-4);
  }
  .pt-5 {
    padding-top: var(--ddd-spacing-5);
  }
  .pt-6 {
    padding-top: var(--ddd-spacing-6);
  }
  .pt-7 {
    padding-top: var(--ddd-spacing-7);
  }
  .pt-8 {
    padding-top: var(--ddd-spacing-8);
  }
  .pt-9 {
    padding-top: var(--ddd-spacing-9);
  }
  .pt-10 {
    padding-top: var(--ddd-spacing-10);
  }
  .pt-11 {
    padding-top: var(--ddd-spacing-11);
  }
  .pt-12 {
    padding-top: var(--ddd-spacing-12);
  }
  .pt-13 {
    padding-top: var(--ddd-spacing-13);
  }
  .pt-14 {
    padding-top: var(--ddd-spacing-14);
  }
  .pt-15 {
    padding-top: var(--ddd-spacing-15);
  }
  .pt-16 {
    padding-top: var(--ddd-spacing-16);
  }
  .pt-17 {
    padding-top: var(--ddd-spacing-17);
  }
  .pt-18 {
    padding-top: var(--ddd-spacing-18);
  }
  .pt-19 {
    padding-top: var(--ddd-spacing-19);
  }
  .pt-20 {
    padding-top: var(--ddd-spacing-20);
  }
  .pt-21 {
    padding-top: var(--ddd-spacing-21);
  }
  .pt-22 {
    padding-top: var(--ddd-spacing-22);
  }
  .pt-23 {
    padding-top: var(--ddd-spacing-23);
  }
  .pt-24 {
    padding-top: var(--ddd-spacing-24);
  }
  .pt-25 {
    padding-top: var(--ddd-spacing-25);
  }
  .pt-26 {
    padding-top: var(--ddd-spacing-26);
  }
  .pt-27 {
    padding-top: var(--ddd-spacing-27);
  }
  .pt-28 {
    padding-top: var(--ddd-spacing-28);
  }
  .pt-29 {
    padding-top: var(--ddd-spacing-29);
  }
  .pt-30 {
    padding-top: var(--ddd-spacing-30);
  }
  .pb-auto {
    padding-bottom: auto;
  }
  .pb-0 {
    padding-bottom: var(--ddd-spacing-0);
  }
  .pb-1 {
    padding-bottom: var(--ddd-spacing-1);
  }
  .pb-2 {
    padding-bottom: var(--ddd-spacing-2);
  }
  .pb-3 {
    padding-bottom: var(--ddd-spacing-3);
  }
  .pb-4 {
    padding-bottom: var(--ddd-spacing-4);
  }
  .pb-5 {
    padding-bottom: var(--ddd-spacing-5);
  }
  .pb-6 {
    padding-bottom: var(--ddd-spacing-6);
  }
  .pb-7 {
    padding-bottom: var(--ddd-spacing-7);
  }
  .pb-8 {
    padding-bottom: var(--ddd-spacing-8);
  }
  .pb-9 {
    padding-bottom: var(--ddd-spacing-9);
  }
  .pb-10 {
    padding-bottom: var(--ddd-spacing-10);
  }
  .pb-11 {
    padding-bottom: var(--ddd-spacing-11);
  }
  .pb-12 {
    padding-bottom: var(--ddd-spacing-12);
  }
  .pb-13 {
    padding-bottom: var(--ddd-spacing-13);
  }
  .pb-14 {
    padding-bottom: var(--ddd-spacing-14);
  }
  .pb-15 {
    padding-bottom: var(--ddd-spacing-15);
  }
  .pb-16 {
    padding-bottom: var(--ddd-spacing-16);
  }
  .pb-17 {
    padding-bottom: var(--ddd-spacing-17);
  }
  .pb-18 {
    padding-bottom: var(--ddd-spacing-18);
  }
  .pb-19 {
    padding-bottom: var(--ddd-spacing-19);
  }
  .pb-20 {
    padding-bottom: var(--ddd-spacing-20);
  }
  .pb-21 {
    padding-bottom: var(--ddd-spacing-21);
  }
  .pb-22 {
    padding-bottom: var(--ddd-spacing-22);
  }
  .pb-23 {
    padding-bottom: var(--ddd-spacing-23);
  }
  .pb-24 {
    padding-bottom: var(--ddd-spacing-24);
  }
  .pb-25 {
    padding-bottom: var(--ddd-spacing-25);
  }
  .pb-26 {
    padding-bottom: var(--ddd-spacing-26);
  }
  .pb-27 {
    padding-bottom: var(--ddd-spacing-27);
  }
  .pb-28 {
    padding-bottom: var(--ddd-spacing-28);
  }
  .pb-29 {
    padding-bottom: var(--ddd-spacing-29);
  }
  .pb-30 {
    padding-bottom: var(--ddd-spacing-30);
  }
  .pl-auto {
    padding-left: auto;
  }
  .pl-0 {
    padding-left: var(--ddd-spacing-0);
  }
  .pl-1 {
    padding-left: var(--ddd-spacing-1);
  }
  .pl-2 {
    padding-left: var(--ddd-spacing-2);
  }
  .pl-3 {
    padding-left: var(--ddd-spacing-3);
  }
  .pl-4 {
    padding-left: var(--ddd-spacing-4);
  }
  .pl-5 {
    padding-left: var(--ddd-spacing-5);
  }
  .pl-6 {
    padding-left: var(--ddd-spacing-6);
  }
  .pl-7 {
    padding-left: var(--ddd-spacing-7);
  }
  .pl-8 {
    padding-left: var(--ddd-spacing-8);
  }
  .pl-9 {
    padding-left: var(--ddd-spacing-9);
  }
  .pl-10 {
    padding-left: var(--ddd-spacing-10);
  }
  .pl-11 {
    padding-left: var(--ddd-spacing-11);
  }
  .pl-12 {
    padding-left: var(--ddd-spacing-12);
  }
  .pl-13 {
    padding-left: var(--ddd-spacing-13);
  }
  .pl-14 {
    padding-left: var(--ddd-spacing-14);
  }
  .pl-15 {
    padding-left: var(--ddd-spacing-15);
  }
  .pl-16 {
    padding-left: var(--ddd-spacing-16);
  }
  .pl-17 {
    padding-left: var(--ddd-spacing-17);
  }
  .pl-18 {
    padding-left: var(--ddd-spacing-18);
  }
  .pl-19 {
    padding-left: var(--ddd-spacing-19);
  }
  .pl-20 {
    padding-left: var(--ddd-spacing-20);
  }
  .pl-21 {
    padding-left: var(--ddd-spacing-21);
  }
  .pl-22 {
    padding-left: var(--ddd-spacing-22);
  }
  .pl-23 {
    padding-left: var(--ddd-spacing-23);
  }
  .pl-24 {
    padding-left: var(--ddd-spacing-24);
  }
  .pl-25 {
    padding-left: var(--ddd-spacing-25);
  }
  .pl-26 {
    padding-left: var(--ddd-spacing-26);
  }
  .pl-27 {
    padding-left: var(--ddd-spacing-27);
  }
  .pl-28 {
    padding-left: var(--ddd-spacing-28);
  }
  .pl-29 {
    padding-left: var(--ddd-spacing-29);
  }
  .pl-30 {
    padding-left: var(--ddd-spacing-30);
  }
  .pr-auto {
    padding-right: auto;
  }
  .pr-0 {
    padding-right: var(--ddd-spacing-0);
  }
  .pr-1 {
    padding-right: var(--ddd-spacing-1);
  }
  .pr-2 {
    padding-right: var(--ddd-spacing-2);
  }
  .pr-3 {
    padding-right: var(--ddd-spacing-3);
  }
  .pr-4 {
    padding-right: var(--ddd-spacing-4);
  }
  .pr-5 {
    padding-right: var(--ddd-spacing-5);
  }
  .pr-6 {
    padding-right: var(--ddd-spacing-6);
  }
  .pr-7 {
    padding-right: var(--ddd-spacing-7);
  }
  .pr-8 {
    padding-right: var(--ddd-spacing-8);
  }
  .pr-9 {
    padding-right: var(--ddd-spacing-9);
  }
  .pr-10 {
    padding-right: var(--ddd-spacing-10);
  }
  .pr-11 {
    padding-right: var(--ddd-spacing-11);
  }
  .pr-12 {
    padding-right: var(--ddd-spacing-12);
  }
  .pr-13 {
    padding-right: var(--ddd-spacing-13);
  }
  .pr-14 {
    padding-right: var(--ddd-spacing-14);
  }
  .pr-15 {
    padding-right: var(--ddd-spacing-15);
  }
  .pr-16 {
    padding-right: var(--ddd-spacing-16);
  }
  .pr-17 {
    padding-right: var(--ddd-spacing-17);
  }
  .pr-18 {
    padding-right: var(--ddd-spacing-18);
  }
  .pr-19 {
    padding-right: var(--ddd-spacing-19);
  }
  .pr-20 {
    padding-right: var(--ddd-spacing-20);
  }
  .pr-21 {
    padding-right: var(--ddd-spacing-21);
  }
  .pr-22 {
    padding-right: var(--ddd-spacing-22);
  }
  .pr-23 {
    padding-right: var(--ddd-spacing-23);
  }
  .pr-24 {
    padding-right: var(--ddd-spacing-24);
  }
  .pr-25 {
    padding-right: var(--ddd-spacing-25);
  }
  .pr-26 {
    padding-right: var(--ddd-spacing-26);
  }
  .pr-27 {
    padding-right: var(--ddd-spacing-27);
  }
  .pr-28 {
    padding-right: var(--ddd-spacing-28);
  }
  .pr-29 {
    padding-right: var(--ddd-spacing-29);
  }
  .pr-30 {
    padding-right: var(--ddd-spacing-30);
  }
  .px-auto {
    padding-left: auto;
    padding-right: auto;
  }
  .px-0 {
    padding-left: var(--ddd-spacing-0);
    padding-right: var(--ddd-spacing-0);
  }
  .px-1 {
    padding-left: var(--ddd-spacing-1);
    padding-right: var(--ddd-spacing-1);
  }
  .px-2 {
    padding-left: var(--ddd-spacing-2);
    padding-right: var(--ddd-spacing-2);
  }
  .px-3 {
    padding-left: var(--ddd-spacing-3);
    padding-right: var(--ddd-spacing-3);
  }
  .px-4 {
    padding-left: var(--ddd-spacing-4);
    padding-right: var(--ddd-spacing-4);
  }
  .px-5 {
    padding-left: var(--ddd-spacing-5);
    padding-right: var(--ddd-spacing-5);
  }
  .px-6 {
    padding-left: var(--ddd-spacing-6);
    padding-right: var(--ddd-spacing-6);
  }
  .px-7 {
    padding-left: var(--ddd-spacing-7);
    padding-right: var(--ddd-spacing-7);
  }
  .px-8 {
    padding-left: var(--ddd-spacing-8);
    padding-right: var(--ddd-spacing-8);
  }
  .px-9 {
    padding-left: var(--ddd-spacing-9);
    padding-right: var(--ddd-spacing-9);
  }
  .px-10 {
    padding-left: var(--ddd-spacing-10);
    padding-right: var(--ddd-spacing-10);
  }
  .px-11 {
    padding-left: var(--ddd-spacing-11);
    padding-right: var(--ddd-spacing-11);
  }
  .px-12 {
    padding-left: var(--ddd-spacing-12);
    padding-right: var(--ddd-spacing-12);
  }
  .px-13 {
    padding-left: var(--ddd-spacing-13);
    padding-right: var(--ddd-spacing-13);
  }
  .px-14 {
    padding-left: var(--ddd-spacing-14);
    padding-right: var(--ddd-spacing-14);
  }
  .px-15 {
    padding-left: var(--ddd-spacing-15);
    padding-right: var(--ddd-spacing-15);
  }
  .px-16 {
    padding-left: var(--ddd-spacing-16);
    padding-right: var(--ddd-spacing-16);
  }
  .px-17 {
    padding-left: var(--ddd-spacing-17);
    padding-right: var(--ddd-spacing-17);
  }
  .px-18 {
    padding-left: var(--ddd-spacing-18);
    padding-right: var(--ddd-spacing-18);
  }
  .px-19 {
    padding-left: var(--ddd-spacing-19);
    padding-right: var(--ddd-spacing-19);
  }
  .px-20 {
    padding-left: var(--ddd-spacing-20);
    padding-right: var(--ddd-spacing-20);
  }
  .px-21 {
    padding-left: var(--ddd-spacing-21);
    padding-right: var(--ddd-spacing-21);
  }
  .px-22 {
    padding-left: var(--ddd-spacing-22);
    padding-right: var(--ddd-spacing-22);
  }
  .px-23 {
    padding-left: var(--ddd-spacing-23);
    padding-right: var(--ddd-spacing-23);
  }
  .px-24 {
    padding-left: var(--ddd-spacing-24);
    padding-right: var(--ddd-spacing-24);
  }
  .px-25 {
    padding-left: var(--ddd-spacing-25);
    padding-right: var(--ddd-spacing-25);
  }
  .px-26 {
    padding-left: var(--ddd-spacing-26);
    padding-right: var(--ddd-spacing-26);
  }
  .px-27 {
    padding-left: var(--ddd-spacing-27);
    padding-right: var(--ddd-spacing-27);
  }
  .px-28 {
    padding-left: var(--ddd-spacing-28);
    padding-right: var(--ddd-spacing-28);
  }
  .px-29 {
    padding-left: var(--ddd-spacing-29);
    padding-right: var(--ddd-spacing-29);
  }
  .px-30 {
    padding-left: var(--ddd-spacing-30);
    padding-right: var(--ddd-spacing-30);
  }
  .py-auto {
    padding-top: auto;
    padding-bottom: auto;
  }
  .py-0 {
    padding-top: var(--ddd-spacing-0);
    padding-bottom: var(--ddd-spacing-0);
  }
  .py-1 {
    padding-top: var(--ddd-spacing-1);
    padding-bottom: var(--ddd-spacing-1);
  }
  .py-2 {
    padding-top: var(--ddd-spacing-2);
    padding-bottom: var(--ddd-spacing-2);
  }
  .py-3 {
    padding-top: var(--ddd-spacing-3);
    padding-bottom: var(--ddd-spacing-3);
  }
  .py-4 {
    padding-top: var(--ddd-spacing-4);
    padding-bottom: var(--ddd-spacing-4);
  }
  .py-5 {
    padding-top: var(--ddd-spacing-5);
    padding-bottom: var(--ddd-spacing-5);
  }
  .py-6 {
    padding-top: var(--ddd-spacing-6);
    padding-bottom: var(--ddd-spacing-6);
  }
  .py-7 {
    padding-top: var(--ddd-spacing-7);
    padding-bottom: var(--ddd-spacing-7);
  }
  .py-8 {
    padding-top: var(--ddd-spacing-8);
    padding-bottom: var(--ddd-spacing-8);
  }
  .py-9 {
    padding-top: var(--ddd-spacing-9);
    padding-bottom: var(--ddd-spacing-9);
  }
  .py-10 {
    padding-top: var(--ddd-spacing-10);
    padding-bottom: var(--ddd-spacing-10);
  }
  .py-11 {
    padding-top: var(--ddd-spacing-11);
    padding-bottom: var(--ddd-spacing-11);
  }
  .py-12 {
    padding-top: var(--ddd-spacing-12);
    padding-bottom: var(--ddd-spacing-12);
  }
  .py-13 {
    padding-top: var(--ddd-spacing-13);
    padding-bottom: var(--ddd-spacing-13);
  }
  .py-14 {
    padding-top: var(--ddd-spacing-14);
    padding-bottom: var(--ddd-spacing-14);
  }
  .py-15 {
    padding-top: var(--ddd-spacing-15);
    padding-bottom: var(--ddd-spacing-15);
  }
  .py-16 {
    padding-top: var(--ddd-spacing-16);
    padding-bottom: var(--ddd-spacing-16);
  }
  .py-17 {
    padding-top: var(--ddd-spacing-17);
    padding-bottom: var(--ddd-spacing-17);
  }
  .py-18 {
    padding-top: var(--ddd-spacing-18);
    padding-bottom: var(--ddd-spacing-18);
  }
  .py-19 {
    padding-top: var(--ddd-spacing-19);
    padding-bottom: var(--ddd-spacing-19);
  }
  .py-20 {
    padding-top: var(--ddd-spacing-20);
    padding-bottom: var(--ddd-spacing-20);
  }
  .py-21 {
    padding-top: var(--ddd-spacing-21);
    padding-bottom: var(--ddd-spacing-21);
  }
  .py-22 {
    padding-top: var(--ddd-spacing-22);
    padding-bottom: var(--ddd-spacing-22);
  }
  .py-23 {
    padding-top: var(--ddd-spacing-23);
    padding-bottom: var(--ddd-spacing-23);
  }
  .py-24 {
    padding-top: var(--ddd-spacing-24);
    padding-bottom: var(--ddd-spacing-24);
  }
  .py-25 {
    padding-top: var(--ddd-spacing-25);
    padding-bottom: var(--ddd-spacing-25);
  }
  .py-26 {
    padding-top: var(--ddd-spacing-26);
    padding-bottom: var(--ddd-spacing-26);
  }
  .py-27 {
    padding-top: var(--ddd-spacing-27);
    padding-bottom: var(--ddd-spacing-27);
  }
  .py-28 {
    padding-top: var(--ddd-spacing-28);
    padding-bottom: var(--ddd-spacing-28);
  }
  .py-29 {
    padding-top: var(--ddd-spacing-29);
    padding-bottom: var(--ddd-spacing-29);
  }
  .py-30 {
    padding-top: var(--ddd-spacing-30);
    padding-bottom: var(--ddd-spacing-30);
  }
  .gap-0 {
    gap: var(--ddd-spacing-0);
  }
  .gap-1 {
    gap: var(--ddd-spacing-1);
  }
  .gap-2 {
    gap: var(--ddd-spacing-2);
  }
  .gap-3 {
    gap: var(--ddd-spacing-3);
  }
  .gap-4 {
    gap: var(--ddd-spacing-4);
  }
  .gap-5 {
    gap: var(--ddd-spacing-5);
  }
  .gap-6 {
    gap: var(--ddd-spacing-6);
  }
  .gap-7 {
    gap: var(--ddd-spacing-7);
  }
  .gap-8 {
    gap: var(--ddd-spacing-8);
  }
  .gap-9 {
    gap: var(--ddd-spacing-9);
  }
  .gap-10 {
    gap: var(--ddd-spacing-10);
  }
  .gap-11 {
    gap: var(--ddd-spacing-11);
  }
  .gap-12 {
    gap: var(--ddd-spacing-12);
  }
  .gap-13 {
    gap: var(--ddd-spacing-13);
  }
  .gap-14 {
    gap: var(--ddd-spacing-14);
  }
  .gap-15 {
    gap: var(--ddd-spacing-15);
  }
  .gap-16 {
    gap: var(--ddd-spacing-16);
  }
  .gap-17 {
    gap: var(--ddd-spacing-17);
  }
  .gap-18 {
    gap: var(--ddd-spacing-18);
  }
  .gap-19 {
    gap: var(--ddd-spacing-19);
  }
  .gap-20 {
    gap: var(--ddd-spacing-20);
  }
  .gap-21 {
    gap: var(--ddd-spacing-21);
  }
  .gap-22 {
    gap: var(--ddd-spacing-22);
  }
  .gap-23 {
    gap: var(--ddd-spacing-23);
  }
  .gap-24 {
    gap: var(--ddd-spacing-24);
  }
  .gap-25 {
    gap: var(--ddd-spacing-25);
  }
  .gap-26 {
    gap: var(--ddd-spacing-26);
  }
  .gap-27 {
    gap: var(--ddd-spacing-27);
  }
  .gap-28 {
    gap: var(--ddd-spacing-28);
  }
  .gap-29 {
    gap: var(--ddd-spacing-29);
  }
  .gap-30 {
    gap: var(--ddd-spacing-30);
  }
`;
/* font sizing */
const DDDFontSizing = i$2`
  .fs-4xs {
    font-size: var(--ddd-font-size-4xs);
  }
  .fs-3xs {
    font-size: var(--ddd-font-size-3xs);
  }
  .fs-xxs {
    font-size: var(--ddd-font-size-xxs);
  }
  .fs-xs {
    font-size: var(--ddd-font-size-xs);
  }
  .fs-s {
    font-size: var(--ddd-font-size-s);
  }
  .fs-ms {
    font-size: var(--ddd-font-size-ms);
  }
  .fs-m {
    font-size: var(--ddd-font-size-m);
  }
  .fs-ml {
    font-size: var(--ddd-font-size-ml);
  }
  .fs-l {
    font-size: var(--ddd-font-size-l);
  }
  .fs-xl {
    font-size: var(--ddd-font-size-xl);
  }
  .fs-xxl {
    font-size: var(--ddd-font-size-xxl);
  }
  .fs-3xl {
    font-size: var(--ddd-font-size-3xl);
  }
  .fs-4xl {
    font-size: var(--ddd-font-size-4xl);
  }
`;
/* font sizing */
const DDDLetterSpacing = i$2`
  .ls-16-sm {
    letter-spacing: var(--ddd-ls-16-sm);
  }
  .ls-18-sm {
    letter-spacing: var(--ddd-ls-18-sm);
  }
  .ls-20-sm {
    letter-spacing: var(--ddd-ls-20-sm);
  }
  .ls-22-sm {
    letter-spacing: var(--ddd-ls-22-sm);
  }
  .ls-24-sm {
    letter-spacing: var(--ddd-ls-24-sm);
  }
  .ls-28-sm {
    letter-spacing: var(--ddd-ls-28-sm);
  }
  .ls-32-sm {
    letter-spacing: var(--ddd-ls-32-sm);
  }
  .ls-36-sm {
    letter-spacing: var(--ddd-ls-36-sm);
  }
  .ls-40-sm {
    letter-spacing: var(--ddd-ls-40-sm);
  }
  .ls-48-sm {
    letter-spacing: var(--ddd-ls-48-sm);
  }
  .ls-56-sm {
    letter-spacing: var(--ddd-ls-56-sm);
  }
  .ls-64-sm {
    letter-spacing: var(--ddd-ls-64-sm);
  }
  .ls-72-sm {
    letter-spacing: var(--ddd-ls-72-sm);
  }
  .ls-16-lg {
    letter-spacing: var(--ddd-ls-16-lg);
  }
  .ls-18-lg {
    letter-spacing: var(--ddd-ls-18-lg);
  }
  .ls-20-lg {
    letter-spacing: var(--ddd-ls-20-lg);
  }
  .ls-22-lg {
    letter-spacing: var(--ddd-ls-22-lg);
  }
  .ls-24-lg {
    letter-spacing: var(--ddd-ls-24-lg);
  }
  .ls-28-lg {
    letter-spacing: var(--ddd-ls-28-lg);
  }
  .ls-32-lg {
    letter-spacing: var(--ddd-ls-32-lg);
  }
  .ls-36-lg {
    letter-spacing: var(--ddd-ls-36-lg);
  }
  .ls-40-lg {
    letter-spacing: var(--ddd-ls-40-lg);
  }
  .ls-48-lg {
    letter-spacing: var(--ddd-ls-48-lg);
  }
  .ls-56-lg {
    letter-spacing: var(--ddd-ls-56-lg);
  }
  .ls-64-lg {
    letter-spacing: var(--ddd-ls-64-lg);
  }
  .ls-72-lg {
    letter-spacing: var(--ddd-ls-72-lg);
  }
`;
/* line height sizing */
const DDDLineHeight = i$2`
  .lh-120 {
    line-height: var(--ddd-lh-120);
  }
  .lh-140 {
    line-height: var(--ddd-lh-140);
  }
  .lh-150 {
    line-height: var(--ddd-lh-150);
  }
  .lh-auto {
    line-height: normal;
  }
`;
/* Box shadows */
const DDDBoxShadow = i$2`
  .bs-0 {
    box-shadow: none;
  }
  .bs-xs {
    box-shadow: var(--ddd-boxShadow-sm);
  }
  .bs-sm {
    box-shadow: var(--ddd-boxShadow-sm);
  }
  .bs-md {
    box-shadow: var(--ddd-boxShadow-md);
  }
  .bs-lg {
    box-shadow: var(--ddd-boxShadow-lg);
  }
  .bs-xl {
    box-shadow: var(--ddd-boxShadow-xl);
  }
`;
/* Border Radius */
const DDDBorderRadius = i$2`
  .r-0 {
    border-radius: var(--ddd-radius-0);
  }
  .r-xs {
    border-radius: var(--ddd-radius-xs);
  }
  .r-sm {
    border-radius: var(--ddd-radius-sm);
  }
  .r-md {
    border-radius: var(--ddd-radius-md);
  }
  .r-lg {
    border-radius: var(--ddd-radius-lg);
  }
  .r-xl {
    border-radius: var(--ddd-radius-xl);
  }
  .r-rounded {
    border-radius: var(--ddd-radius-rounded);
  }
  .r-circle {
    border-radius: var(--ddd-radius-circle);
  }
`;
/* Background colors / gradients */
const DDDBackground = i$2`
  .bg-transparent {
    background-color: transparent;
  }
  .bg-white {
    background-color: var(--ddd-theme-default-white);
  }
  .bg-gradient-navBar {
    background: var(--ddd-theme-default-gradient-navBar);
  }
  .bg-gradient-footer {
    background: var(--ddd-theme-default-gradient-footer);
  }
  .bg-gradient-newsFeature {
    background: var(--ddd-theme-default-gradient-newsFeature);
  }
  .bg-gradient-buttons {
    background: var(--ddd-theme-default-gradient-buttons);
  }
  .bg-gradient-hero {
    background: var(--ddd-theme-default-gradient-hero);
  }
  .bg-gradient-hero2 {
    background: var(--ddd-theme-default-gradient-hero2);
  }
`;
/* Font weight */
const DDDFontWeight = i$2`
  .fw-0 {
    font-weight: var(--ddd-font-weight-regular); /* available for navigation */
  }
  .fw-1 {
    font-weight: var(--ddd-font-weight-medium); /* available for headers */
  }
  .fw-2 {
    font-weight: var(--ddd-font-weight-bold); /* available for headers */
  }
  .fw-3 {
    font-weight: var(
      --ddd-font-weight-black
    ); /* default for headers, body & navigation */
  }
`;
/* Font classes */
const DDDFontClasses = i$2`
  .ddd-font-navigation {
    font-family: var(--ddd-font-navigation);
    font-size: var(--ddd-theme-h4-font-size);
    font-weight: var(--ddd-font-weight-bold);
  }
  .ddd-font-primary {
    font-family: var(--ddd-font-primary);
  }
  .ddd-font-secondary {
    font-family: var(--ddd-font-secondary);
  }
`;

/* Breadcrumb */
const DDDBreadcrumb = i$2`
  .breadcrumb {
    font-weight: var(--ddd-font-weight-light);
    margin: var(--ddd-spacing-6) 0;
    padding: 0;
    pointer-events: auto;
    list-style: "/ ";
    gap: var(--ddd-spacing-5);
    display: flex;
    flex-flow: row;
    color: light-dark(
      var(--ddd-theme-default-link),
      var(--ddd-theme-default-linkLight)
    );
  }
  .breadcrumb li::marker {
    color: light-dark(black, white);
    font-weight: var(--ddd-font-weight-regular);
  }
  .breadcrumb li:first-child {
    list-style: none;
  }
  .breadcrumb li:last-child a {
    color: light-dark(black, white);
    pointer-events: none;
  }
  .breadcrumb li a {
    padding-left: var(--ddd-spacing-1);
    font-family: var(--ddd-font-navigation);
    font-weight: var(--ddd-font-weight-regular);
    text-decoration: none;
  }
  .breadcrumb li a:hover {
    text-decoration: underline;
    pointer-events: auto;
  }
`;
/* Extra things */
const DDDExtra = i$2`
  /* helper class for accessibility of screen reader only content */
  .sr-only {
    position: absolute;
    left: -10000px;
    inset-inline-start: -10000px;
    inset-inline-end: initial;
    top: auto;
    width: 1px;
    height: 1px;
    overflow: hidden;
  }
`;

i$2`
  /* Apply primary color as pulse effect using CSS variable */
  :host([data-primary="0"]) {
    --ddd-animation-pulse-color: var(--ddd-primary-0-rgb);
  }
  :host([data-primary="1"]) {
    --ddd-animation-pulse-color: var(--ddd-primary-1-rgb);
  }
  :host([data-primary="2"]) {
    --ddd-animation-pulse-color: var(--ddd-primary-2-rgb);
  }
  :host([data-primary="3"]) {
    --ddd-animation-pulse-color: var(--ddd-primary-3-rgb);
  }
  :host([data-primary="4"]) {
    --ddd-animation-pulse-color: var(--ddd-primary-4-rgb);
  }
  :host([data-primary="5"]) {
    --ddd-animation-pulse-color: var(--ddd-primary-5-rgb);
  }
  :host([data-primary="6"]) {
    --ddd-animation-pulse-color: var(--ddd-primary-6-rgb);
  }
  :host([data-primary="7"]) {
    --ddd-animation-pulse-color: var(--ddd-primary-7-rgb);
  }
  :host([data-primary="8"]) {
    --ddd-animation-pulse-color: var(--ddd-primary-8-rgb);
  }
  :host([data-primary="9"]) {
    --ddd-animation-pulse-color: var(--ddd-primary-9-rgb);
  }
  :host([data-primary="10"]) {
    --ddd-animation-pulse-color: var(--ddd-primary-10-rgb);
  }
  :host([data-primary="11"]) {
    --ddd-animation-pulse-color: var(--ddd-primary-11-rgb);
  }
  :host([data-primary="12"]) {
    --ddd-animation-pulse-color: var(--ddd-primary-12-rgb);
  }
  :host([data-primary="13"]) {
    --ddd-animation-pulse-color: var(--ddd-primary-13-rgb);
  }
  :host([data-primary="14"]) {
    --ddd-animation-pulse-color: var(--ddd-primary-14-rgb);
  }
  :host([data-primary="15"]) {
    --ddd-animation-pulse-color: var(--ddd-primary-15-rgb);
  }
  :host([data-primary="16"]) {
    --ddd-animation-pulse-color: var(--ddd-primary-16-rgb);
  }
  :host([data-primary="17"]) {
    --ddd-animation-pulse-color: var(--ddd-primary-17-rgb);
  }
  :host([data-primary="18"]) {
    --ddd-animation-pulse-color: var(--ddd-primary-18-rgb);
  }
  :host([data-primary="19"]) {
    --ddd-animation-pulse-color: var(--ddd-primary-19-rgb);
  }
  :host([data-primary="20"]) {
    --ddd-animation-pulse-color: var(--ddd-primary-20-rgb);
  }
  :host([data-primary="21"]) {
    --ddd-animation-pulse-color: var(--ddd-primary-21-rgb);
  }
  :host([data-primary="22"]) {
    --ddd-animation-pulse-color: var(--ddd-primary-22-rgb);
  }
  :host([data-primary="23"]) {
    --ddd-animation-pulse-color: var(--ddd-primary-23-rgb);
  }
  :host([data-primary="24"]) {
    --ddd-animation-pulse-color: var(--ddd-primary-24-rgb);
  }
  :host([data-primary="25"]) {
    --ddd-animation-pulse-color: var(--ddd-primary-25-rgb);
  }

  :host([data-pulse]) {
    --ddd-animation-pulse-size: var(--ddd-spacing-4);
    animation-delay: 2.8s;
    animation-name: pulse;
    animation-duration: 2s;
    animation-iteration-count: infinite;
    z-index: 10000;
  }
  :host([data-pulse="1"]) {
    --ddd-animation-pulse-size: var(--ddd-spacing-6);
  }
  :host([data-pulse="2"]) {
    --ddd-animation-pulse-size: var(--ddd-spacing-10);
  }
  :host([data-pulse]:not([data-primary])) {
    --ddd-animation-pulse-color: var(--ddd-primary-1-rgb);
  }
`;

const DDDAnimations = i$2`
  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(var(--ddd-animation-pulse-color));
    }
    70% {
      box-shadow: 0 0 0 var(--ddd-animation-pulse-size) rgba(0, 0, 0, 0); /* Use a transparent color derived from the original color */
    }
    100% {
      box-shadow: 0 0 0 0 rgba(0, 0, 0, 0); /* Same here */
    }
  }
`;

// export that has all of them for easy stamping as a single sheet
const DDDAllStyles = [
  DDDVariables,
  ...DDDDataAttributes,
  DDDReset,
  DDDBreadcrumb,
  DDDExtra,
  DDDBorders,
  DDDMarginPadding,
  DDDLetterSpacing,
  DDDLineHeight,
  DDDBoxShadow,
  DDDBorderRadius,
  DDDBackground,
  DDDFontClasses,
  DDDFontWeight,
  DDDFontSizing,
  DDDAnimations,
];

/**
 * Copyright 2024
 * @license Apache-2.0, see License.md for full details.
 */

/**
 * `d-d-d`
 * `design, develop, destroy the competition`
 * @demo demo/index.html
 */

// call this to load all the fonts that are official
function loadDDDFonts() {
  if (
    globalThis &&
    globalThis.document &&
    !globalThis.document.querySelector('[data-ddd="font"]')
  ) {
    DDDFonts.forEach((font) => {
      const link = globalThis.document.createElement("link");
      link.setAttribute("href", font);
      link.setAttribute("rel", "stylesheet");
      link.setAttribute("fetchpriority", "low");
      link.setAttribute("data-ddd", "font");
      globalThis.document.head.appendChild(link);
    });
  }
}

function dddCSSFeatureDetection() {
  // check for css feature support
  if (!CSS.supports("initial-letter", "1")) {
    console.warn("CSS feature: initial-letter not supported");
    console.warn("Adding dropCap-noSupport class");
    document.body.classList.add("dropCap-noSupport");
  }
}

// super class so we can mix styles into other things more easily
const DDDSuper = function (SuperClass) {
  return class extends SuperClass {
    constructor() {
      super();
      globalThis.DDDSharedStyles.requestAvailability();
    }
    /**
     * LitElement style callback
     */
    static get styles() {
      // support for using in other classes
      let styles = [];
      if (super.styles) {
        styles = super.styles;
      }
      return [styles, DDDReset];
    }
  };
};

// autoloads fonts and gives it a tag name; this is useful
class DDD extends DDDSuper(SimpleColorsSuper(s)) {
  constructor() {
    super();
  }
  static get tag() {
    return "d-d-d";
  }
}

globalThis.customElements.define(DDD.tag, DDD);

/**
 * Checks to see if there is an instance available, and if not appends one.
 * then it injects the styles into the global document scope so that they can be used anywhere
 */
globalThis.DDDSharedStyles = globalThis.DDDSharedStyles || {};
globalThis.DDDSharedStyles.requestAvailability = () => {
  if (globalThis.DDDSharedStyles.instance == null) {
    // convert css into text content of arrays mashed together
    // this way we can inject it into a global style sheet
    let globalStyles = DDDAllStyles.map((st) =>
      st.cssText ? st.cssText : "",
    ).join("");
    const adoptableDDD = new CSSStyleSheet();
    adoptableDDD.replaceSync(globalStyles);
    // THIS FLAG MAKES HAX LOAD IT IN ITS SHADOW ROOT!!!!
    adoptableDDD.hax = true;
    // Combine the existing adopted sheets if we need to but these will work everywhere
    // and are very fast
    globalThis.document.adoptedStyleSheets = [
      ...globalThis.document.adoptedStyleSheets,
      adoptableDDD,
    ];
    loadDDDFonts();
    globalThis.document.onload = dddCSSFeatureDetection();
    globalThis.DDDSharedStyles.instance = adoptableDDD;
  }
  return globalThis.DDDSharedStyles.instance;
};
// self-appending on call
globalThis.DDDSharedStyles.requestAvailability();

/**
 * Copyright 2020 The Pennsylvania State University
 * @license Apache-2.0, see License.md for full text.
 */

const SimpleIconBehaviors = function (SuperClass) {
  return class extends SuperClass {
    static get styles() {
      return [
        ...[super.styles || []],
        i$2`
          :host {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            position: relative;
            vertical-align: middle;
            height: var(--simple-icon-height, 24px);
            width: var(--simple-icon-width, 24px);
            color: var(--simple-icon-color, currentColor);
          }
          :host([dir="rtl"]) svg {
            direction: rtl;
          }
          :host([hidden]) {
            display: none;
          }
          #svg-polyfill {
            background-color: var(--simple-icon-color, currentColor);
            height: var(--simple-icon-height, 24px);
            width: var(--simple-icon-width, 24px);
          }
          svg {
            height: var(--simple-icon-height, 24px);
            width: var(--simple-icon-width, 24px);
            max-height: var(--simple-icon-height, 24px);
            max-width: var(--simple-icon-width, 24px);
            filter: var(--simple-icon-color, initial);
            pointer-events: none;
          }
          feFlood {
            flood-color: var(--simple-icon-color, currentColor);
          }
        `,
      ];
    }
    // render function
    render() {
      return this.useSafariPolyfill
        ? x`
            <div
              id="svg-polyfill"
              style="mask:${this.safariMask};-webkit-mask:${this.safariMask}"
            ></div>
          `
        : b`
        <svg xmlns="http://www.w3.org/2000/svg" part="simple-icon-svg" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet">
          <filter
            color-interpolation-filters="sRGB"
            x="0"
            y="0"
            height="24px"
            width="24px"
          >
            ${this.feFlood}
            <feComposite operator="in" in="COLOR" in2="SourceAlpha" />
          </filter>
          <image
            xlink:href=""
            width="24px"
            height="24px"
            focusable="false"
            preserveAspectRatio="xMidYMid meet"
          ></image>
        </svg>
      `;
    }

    get feFlood() {
      return !this.noColorize ? b`<feFlood result="COLOR"/>` : ``;
    }

    // properties available to the custom element for data binding
    static get properties() {
      return {
        ...super.properties,
        dir: {
          type: String,
          reflect: true,
        },
        src: {
          type: String,
        },
        noColorize: {
          type: Boolean,
          attribute: "no-colorize",
        },
        icon: {
          type: String,
          attribute: "icon",
          reflect: true,
        },
      };
    }
    constructor() {
      super();
      this.noColorize = false;
      this.dir = this.documentDir;
    }
    get documentDir() {
      return (
        globalThis.document.body.getAttribute("xml:dir") ||
        globalThis.document.body.getAttribute("dir") ||
        globalThis.document.documentElement.getAttribute("xml:dir") ||
        globalThis.document.documentElement.getAttribute("dir") ||
        "ltr"
      );
    }
    get useSafariPolyfill() {
      return navigator.userAgent.indexOf("Safari") > -1;
    }
    get safariMask() {
      return this.src && this.useSafariPolyfill
        ? `url(${this.src}) no-repeat center / contain`
        : "";
    }
    firstUpdated(changedProperties) {
      if (super.firstUpdated) {
        super.firstUpdated(changedProperties);
      }
      if (this.useSafariPolyfill) return;
      const randomId = "f-" + Math.random().toString().slice(2, 10);
      this.shadowRoot.querySelector("image").style.filter = `url(#${randomId})`;
      this.shadowRoot.querySelector("filter").setAttribute("id", randomId);
    }
    /**
     * Set the src by the icon property
     */
    setSrcByIcon(context) {
      this.src = SimpleIconsetStore.getIcon(this.icon, context);
      return this.src;
    }
    updated(changedProperties) {
      if (super.updated) {
        super.updated(changedProperties);
      }
      changedProperties.forEach((oldValue, propName) => {
        if (propName === "icon") {
          if (this[propName]) {
            this.setSrcByIcon(this);
          } else {
            this.src = null;
          }
        }
        if (propName === "src") {
          // look this up in the registry
          if (this[propName] && !this.useSafariPolyfill) {
            this.shadowRoot
              .querySelector("image")
              .setAttribute("xlink:href", `${this[propName]}`);
          }
        }
      });
    }
  };
};
/**
 * `simple-icon-lite`
 * `Render an SVG based icon`
 *
 * @microcopy - language worth noting:
 *  -
 *
 * @customElement
 * @extends LitElement
 * @extends SimpleIconBehaviors
 * @demo demo/lite.html
 * @demo demo/button-lite.html Button (Lite)
 * @element simple-icon-lite
 */
class SimpleIconLite extends SimpleIconBehaviors(s) {
  /**
   * This is a convention, not the standard
   */
  static get tag() {
    return "simple-icon-lite";
  }
}
customElements.define(SimpleIconLite.tag, SimpleIconLite);

/**
 * Copyright 2020 The Pennsylvania State University
 * @license Apache-2.0, see License.md for full text.
 */

/**
 *
 * @class SimpleIconButtonBehaviors
 */
const SimpleIconButtonBehaviors = function (SuperClass) {
  return class extends SuperClass {
    constructor() {
      super();
      this.ariaLabelledby = "";
      this.controls = "";
      this.disabled = false;
      this.form = "";
      this.label = "";
      this.fieldName = "";
      this.type = "";
      this.value = "";
      this.icon = "";
    }

    static get styles() {
      return [
        ...[super.styles || []],
        i$2`
          :host([hidden]) {
            display: none;
          }
          :host([icon=""]) simple-icon-lite {
            display: none;
          }
          :host {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            position: relative;
            vertical-align: middle;
            border-radius: var(--simple-icon-button-border-radius, 50%);
            background-color: var(
              --simple-icon-button-background-color,
              transparent
            );
            padding: 0;
            margin: 0;
            color: inherit;
          }
          button {
            color: inherit;
            cursor: pointer;
            opacity: var(--simple-icon-button-opacity, 1);
            border: var(--simple-icon-button-border, 0);
            border-radius: var(--simple-icon-button-border-radius, 50%);
            background-color: var(
              --simple-icon-button-background-color,
              transparent
            );
            padding: var(--simple-icon-button-padding, 0px);
            margin: 0px;
            width: 100%;
            height: 100%;
          }
          button[aria-pressed] {
            opacity: var(--simple-icon-button-toggled-opacity, 1);
            --simple-icon-button-border: var(
              --simple-icon-toggled-button-border
            );
            --simple-icon-color: var(--simple-icon-button-toggled-color);
            --simple-icon-button-background-color: var(
              --simple-icon-button-toggled-background-color
            );
          }
          button:focus,
          button:hover {
            opacity: var(--simple-icon-button-focus-opacity, 0.8);
            --simple-icon-button-border: var(--simple-icon-button-focus-border);
            --simple-icon-color: var(--simple-icon-button-focus-color);
            --simple-icon-button-background-color: var(
              --simple-icon-button-focus-background-color
            );
          }
          button:disabled,
          button[disabled] {
            opacity: var(--simple-icon-button-disabled-opacity, 0.5);
            --simple-icon-button-border: var(
              --simple-icon-button-disabled-border
            );
            --simple-icon-color: var(--simple-icon-button-disabled-color);
            --simple-icon-button-background-color: var(
              --simple-icon-button-disabled-background-color
            );
            cursor: not-allowed;
          }

          simple-icon-lite {
            color: inherit;
            height: calc(
              var(--simple-icon-height, 24px) - 2 *
                var(--simple-icon-button-padding, 0px)
            );
            width: calc(
              var(--simple-icon-width, 24px) - 2 *
                var(--simple-icon-button-padding, 0px)
            );
          }
        `,
      ];
    }

    // render function
    render() {
      return x`
        <button
          ?autofocus="${this.autofocus}"
          aria-labelledby="${this.ariaLabelledby}"
          .aria-pressed="${this.toggles || this.toggled
            ? "true"
            : this.toggles
              ? "false"
              : undefined}"
          controls="${this.controls}"
          part="button"
          ?disabled="${this.disabled}"
          form="${this.form}"
          label="${this.label}"
          aria-label="${this.label}"
          name="${this.fieldName}"
          .type="${this.type}"
          value="${this.value}"
        >
          <simple-icon-lite
            icon="${this.icon}"
            part="icon"
            ?no-colorize="${this.noColorize}"
          ></simple-icon-lite>
          <slot></slot>
        </button>
      `;
    }

    // properties available to the custom element for data binding
    static get properties() {
      return {
        ...super.properties,
        autofocus: {
          type: Boolean,
        },
        ariaLabelledby: {
          attribute: "aria-labelledby",
          type: String,
        },
        controls: {
          type: String,
        },
        disabled: {
          type: Boolean,
        },
        fieldName: {
          attribute: "field-name",
          type: String,
        },
        form: {
          type: String,
        },
        icon: {
          type: String,
          reflect: true,
        },
        label: {
          type: String,
        },
        type: {
          type: String,
        },
        value: {
          type: String,
          reflect: true,
        },
        toggles: {
          type: Boolean,
          reflect: true,
        },
        toggled: {
          type: Boolean,
          reflect: true,
        },
      };
    }
  };
};
/**
 * `simple-icon`
 * `Render an SVG based icon`
 *
 * @microcopy - language worth noting:
 *  -
 *
 * @customElement
 * @extends LitElement
 * @extends SimpleIconButtonBehaviors
 * @demo demo/button-lite.html
 * @element simple-icon
 */
class SimpleIconButtonLite extends SimpleIconButtonBehaviors(s) {
  /**
   * This is a convention, not the standard
   */
  static get tag() {
    return "simple-icon-button-lite";
  }
  constructor() {
    super();
    this.type = "button";
  }
}
customElements.define(SimpleIconButtonLite.tag, SimpleIconButtonLite);

/**
 * Copyright 2020 The Pennsylvania State University
 * @license Apache-2.0, see License.md for full text.
 */

/**
  * `simple-tooltip`
  * `a simple tooltip forked from paper-tooltip with the same api minus apply removal`
     ### Styling
     The following custom properties and mixins are available for styling:
 
     Custom property | Description | Default
     ----------------|-------------|----------
     `--simple-tooltip-background` | The background color of the tooltip | `#616161`
     `--simple-tooltip-opacity` | The opacity of the tooltip | `0.9`
     `--simple-tooltip-text-color` | The text color of the tooltip | `white`
     `--simple-tooltip-delay-in` | Delay before tooltip starts to fade in | `500`
     `--simple-tooltip-delay-out` | Delay before tooltip starts to fade out | `0`
     `--simple-tooltip-duration-in` | Timing for animation when showing tooltip | `500`
     `--simple-tooltip-duration-out` | Timing for animation when hiding tooltip | `0`
  * @demo demo/index.html
  * @element simple-tooltip
  */
class SimpleTooltip extends s {
  //styles function
  static get styles() {
    return [
      i$2`
        :host {
          display: block;
          position: absolute;
          outline: none;
          z-index: 1002;
          -moz-user-select: none;
          -ms-user-select: none;
          -webkit-user-select: none;
          user-select: none;
          cursor: default;
          pointer-events: none;
        }

        #tooltip {
          display: block;
          outline: none;
          font-size: var(--simple-tooltip-font-size, 10px);
          line-height: 1;
          background-color: var(--simple-tooltip-background, #616161);
          color: var(--simple-tooltip-text-color, white);
          padding: 8px;
          border-radius: var(--simple-tooltip-border-radius, 2px);
          width: var(--simple-tooltip-width);
        }

        @keyframes keyFrameScaleUp {
          0% {
            transform: scale(0);
          }

          100% {
            transform: scale(1);
          }
        }

        @keyframes keyFrameScaleDown {
          0% {
            transform: scale(1);
          }

          100% {
            transform: scale(0);
          }
        }

        @keyframes keyFrameFadeInOpacity {
          0% {
            opacity: 0;
          }

          100% {
            opacity: var(--simple-tooltip-opacity, 0.9);
          }
        }

        @keyframes keyFrameFadeOutOpacity {
          0% {
            opacity: var(--simple-tooltip-opacity, 0.9);
          }

          100% {
            opacity: 0;
          }
        }

        @keyframes keyFrameSlideDownIn {
          0% {
            transform: translateY(-2000px);
            opacity: 0;
          }

          10% {
            opacity: 0.2;
          }

          100% {
            transform: translateY(0);
            opacity: var(--simple-tooltip-opacity, 0.9);
          }
        }

        @keyframes keyFrameSlideDownOut {
          0% {
            transform: translateY(0);
            opacity: var(--simple-tooltip-opacity, 0.9);
          }

          10% {
            opacity: 0.2;
          }

          100% {
            transform: translateY(-2000px);
            opacity: 0;
          }
        }

        .fade-in-animation {
          opacity: 0;
          animation-delay: var(--simple-tooltip-delay-in, 500ms);
          animation-name: keyFrameFadeInOpacity;
          animation-iteration-count: 1;
          animation-timing-function: ease-in;
          animation-duration: var(--simple-tooltip-duration-in, 500ms);
          animation-fill-mode: forwards;
        }

        .fade-out-animation {
          opacity: var(--simple-tooltip-opacity, 0.9);
          animation-delay: var(--simple-tooltip-delay-out, 0ms);
          animation-name: keyFrameFadeOutOpacity;
          animation-iteration-count: 1;
          animation-timing-function: ease-in;
          animation-duration: var(--simple-tooltip-duration-out, 500ms);
          animation-fill-mode: forwards;
        }

        .scale-up-animation {
          transform: scale(0);
          opacity: var(--simple-tooltip-opacity, 0.9);
          animation-delay: var(--simple-tooltip-delay-in, 500ms);
          animation-name: keyFrameScaleUp;
          animation-iteration-count: 1;
          animation-timing-function: ease-in;
          animation-duration: var(--simple-tooltip-duration-in, 500ms);
          animation-fill-mode: forwards;
        }

        .scale-down-animation {
          transform: scale(1);
          opacity: var(--simple-tooltip-opacity, 0.9);
          animation-delay: var(--simple-tooltip-delay-out, 500ms);
          animation-name: keyFrameScaleDown;
          animation-iteration-count: 1;
          animation-timing-function: ease-in;
          animation-duration: var(--simple-tooltip-duration-out, 500ms);
          animation-fill-mode: forwards;
        }

        .slide-down-animation {
          transform: translateY(-2000px);
          opacity: 0;
          animation-delay: var(--simple-tooltip-delay-out, 500ms);
          animation-name: keyFrameSlideDownIn;
          animation-iteration-count: 1;
          animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
          animation-duration: var(--simple-tooltip-duration-out, 500ms);
          animation-fill-mode: forwards;
        }

        .slide-down-animation-out {
          transform: translateY(0);
          opacity: var(--simple-tooltip-opacity, 0.9);
          animation-delay: var(--simple-tooltip-delay-out, 500ms);
          animation-name: keyFrameSlideDownOut;
          animation-iteration-count: 1;
          animation-timing-function: cubic-bezier(0.4, 0, 1, 1);
          animation-duration: var(--simple-tooltip-duration-out, 500ms);
          animation-fill-mode: forwards;
        }

        .cancel-animation {
          animation-delay: -30s !important;
        }

        .hidden {
          position: absolute;
          left: -10000px;
          inset-inline-start: -10000px;
          inset-inline-end: initial;
          top: auto;
          width: 1px;
          height: 1px;
          overflow: hidden;
        }
      `,
    ];
  }

  // render function
  render() {
    return x` <div
      id="tooltip"
      class="hidden"
      @animationend="${this._onAnimationEnd}"
    >
      <slot></slot>
    </div>`;
  }

  // properties available to the custom element for data binding
  static get properties() {
    return {
      ...super.properties,

      /**
       * The id of the element that the tooltip is anchored to. This element
       * must be a sibling of the tooltip. If this property is not set,
       * then the tooltip will be centered to the parent node containing it.
       */
      for: { type: String },
      /**
       * Set this to true if you want to manually control when the tooltip
       * is shown or hidden.
       */
      manualMode: { type: Boolean, attribute: "manual-mode" },
      /**
       * Positions the tooltip to the top, right, bottom, left of its content.
       */
      position: { type: String },
      /**
       * If true, no parts of the tooltip will ever be shown offscreen.
       */
      fitToVisibleBounds: {
        type: Boolean,
        attribute: "fit-to-visible-bounds",
      },
      /**
       * The spacing between the top of the tooltip and the element it is
       * anchored to.
       */
      offset: { type: Number },
      /**
       * This property is deprecated, but left over so that it doesn't
       * break exiting code. Please use `offset` instead. If both `offset` and
       * `marginTop` are provided, `marginTop` will be ignored.
       * @deprecated since version 1.0.3
       */
      marginTop: { type: Number, attribute: "margin-top" },
      /**
       * The delay that will be applied before the `entry` animation is
       * played when showing the tooltip.
       */
      animationDelay: { type: Number, attribute: "animation-delay" },
      /**
       * The animation that will be played on entry.  This replaces the
       * deprecated animationConfig.  Entries here will override the
       * animationConfig settings.  You can enter your own animation
       * by setting it to the css class name.
       */
      animationEntry: { type: String, attribute: "animation-entry" },
      /**
       * The animation that will be played on exit.  This replaces the
       * deprecated animationConfig.  Entries here will override the
       * animationConfig settings.  You can enter your own animation
       * by setting it to the css class name.
       */
      animationExit: { type: String, attribute: "animation-exit" },
      _showing: { type: Boolean },
    };
  }

  /**
   * Convention we use
   */
  static get tag() {
    return "simple-tooltip";
  }

  /**
   * HTMLElement
   */
  constructor() {
    super();
    this.manualMode = false;
    this.position = "bottom";
    this.fitToVisibleBounds = false;
    this.offset = 14;
    this.marginTop = 14;
    this.animationEntry = "";
    this.animationExit = "";
    this.animationConfig = {
      entry: [{ name: "fade-in-animation", node: this, timing: { delay: 0 } }],
      exit: [{ name: "fade-out-animation", node: this }],
    };
    setTimeout(() => {
      this.addEventListener(
        "webkitAnimationEnd",
        this._onAnimationEnd.bind(this),
      );
      this.addEventListener("mouseenter", this.hide.bind(this));
    }, 0);
  }
  /**
   * Returns the target element that this tooltip is anchored to. It is
   * either the element given by the `for` attribute, or the immediate parent
   * of the tooltip.
   *
   * @type {Node}
   */
  get target() {
    var parentNode = this.parentNode;
    // If the parentNode is a document fragment, then we need to use the host.
    var ownerRoot = this.getRootNode();
    var target;
    if (this.for) {
      target = ownerRoot.querySelector("#" + this.for);
    } else {
      target =
        parentNode.nodeType == Node.DOCUMENT_FRAGMENT_NODE
          ? ownerRoot.host
          : parentNode;
    }
    return target;
  }
  /**
   * @return {void}
   * @override
   */
  disconnectedCallback() {
    if (!this.manualMode) {
      this._removeListeners();
    }
    super.disconnectedCallback();
  }

  /**
   * @deprecated Use show and hide instead.
   * @param {string} type Either `entry` or `exit`
   */
  playAnimation(type) {
    if (type === "entry") {
      this.show();
    } else if (type === "exit") {
      this.hide();
    }
  }

  /**
   * Cancels the animation and either fully shows or fully hides tooltip
   */
  cancelAnimation() {
    // Short-cut and cancel all animations and hide
    this.shadowRoot.querySelector("#tooltip").classList.add("cancel-animation");
  }

  /**
   * Shows the tooltip programatically
   * @return {void}
   */
  show() {
    // If the tooltip is already showing, there's nothing to do.
    if (this._showing) return;

    if (this.textContent.trim() === "") {
      // Check if effective children are also empty
      var allChildrenEmpty = true;
      var effectiveChildren = this.children;
      for (var i = 0; i < effectiveChildren.length; i++) {
        if (effectiveChildren[i].textContent.trim() !== "") {
          allChildrenEmpty = false;
          break;
        }
      }
      if (allChildrenEmpty) {
        return;
      }
    }

    this._showing = true;
    this.shadowRoot.querySelector("#tooltip").classList.remove("hidden");
    this.shadowRoot
      .querySelector("#tooltip")
      .classList.remove("cancel-animation");
    this.shadowRoot
      .querySelector("#tooltip")
      .classList.remove(this._getAnimationType("exit"));
    this.updatePosition();
    this._animationPlaying = true;
    this.shadowRoot
      .querySelector("#tooltip")
      .classList.add(this._getAnimationType("entry"));
  }

  /**
   * Hides the tooltip programatically
   * @return {void}
   */
  hide() {
    // If the tooltip is already hidden, there's nothing to do.
    if (!this._showing) {
      return;
    }

    // If the entry animation is still playing, don't try to play the exit
    // animation since this will reset the opacity to 1. Just end the animation.
    if (this._animationPlaying) {
      this._showing = false;
      this._cancelAnimation();
      return;
    } else {
      // Play Exit Animation
      this._onAnimationFinish();
    }
    this._showing = false;
    this._animationPlaying = true;
    // force hide if we are open too long
    // helps older platforms and the monster known as Safari
    clearTimeout(this.__debounceCancel);
    this.__debounceCancel = setTimeout(() => {
      this._cancelAnimation();
    }, 5000);
  }

  /**
   * @return {void}
   */
  updatePosition() {
    if (!this._target || !this.offsetParent) return;
    var offset = this.offset;
    // If a marginTop has been provided by the user (pre 1.0.3), use it.
    if (this.marginTop != 14 && this.offset == 14) offset = this.marginTop;
    var parentRect = this.offsetParent.getBoundingClientRect();
    var targetRect = this._target.getBoundingClientRect();
    var thisRect = this.getBoundingClientRect();
    var horizontalCenterOffset = (targetRect.width - thisRect.width) / 2;
    var verticalCenterOffset = (targetRect.height - thisRect.height) / 2;
    var targetLeft = targetRect.left - parentRect.left;
    var targetTop = targetRect.top - parentRect.top;
    var tooltipLeft, tooltipTop;
    switch (this.position) {
      case "top":
        tooltipLeft = targetLeft + horizontalCenterOffset;
        tooltipTop = targetTop - thisRect.height - offset;
        break;
      case "bottom":
        tooltipLeft = targetLeft + horizontalCenterOffset;
        tooltipTop = targetTop + targetRect.height + offset;
        break;
      case "left":
        tooltipLeft = targetLeft - thisRect.width - offset;
        tooltipTop = targetTop + verticalCenterOffset;
        break;
      case "right":
        tooltipLeft = targetLeft + targetRect.width + offset;
        tooltipTop = targetTop + verticalCenterOffset;
        break;
    }
    // TODO(noms): This should use IronFitBehavior if possible.
    if (this.fitToVisibleBounds) {
      // Clip the left/right side
      if (parentRect.left + tooltipLeft + thisRect.width > window.innerWidth) {
        this.style.right = "0px";
        this.style.left = "auto";
      } else {
        this.style.left = Math.max(0, tooltipLeft) + "px";
        this.style.right = "auto";
      }
      // Clip the top/bottom side.
      if (parentRect.top + tooltipTop + thisRect.height > window.innerHeight) {
        this.style.bottom = parentRect.height - targetTop + offset + "px";
        this.style.top = "auto";
      } else {
        this.style.top = Math.max(-parentRect.top, tooltipTop) + "px";
        this.style.bottom = "auto";
      }
    } else {
      this.style.left = tooltipLeft + "px";
      this.style.top = tooltipTop + "px";
    }
  }

  _addListeners() {
    if (this._target) {
      this._target.addEventListener("mouseenter", this.show.bind(this));
      this._target.addEventListener("focus", this.show.bind(this));
      this._target.addEventListener("mouseleave", this.hide.bind(this));
      this._target.addEventListener("blur", this.hide.bind(this));
      this._target.addEventListener("tap", this.hide.bind(this));
    }
  }

  _findTarget() {
    if (!this.manualMode) this._removeListeners();
    this._target = this.target;
    if (!this.manualMode) this._addListeners();
  }

  _manualModeChanged() {
    if (this.manualMode) this._removeListeners();
    else this._addListeners();
  }

  _cancelAnimation() {
    // Short-cut and cancel all animations and hide
    this.shadowRoot
      .querySelector("#tooltip")
      .classList.remove(this._getAnimationType("entry"));
    this.shadowRoot
      .querySelector("#tooltip")
      .classList.remove(this._getAnimationType("exit"));
    this.shadowRoot
      .querySelector("#tooltip")
      .classList.remove("cancel-animation");
    this.shadowRoot.querySelector("#tooltip").classList.add("hidden");
  }

  _onAnimationFinish() {
    if (this._showing) {
      this.shadowRoot
        .querySelector("#tooltip")
        .classList.remove(this._getAnimationType("entry"));
      this.shadowRoot
        .querySelector("#tooltip")
        .classList.remove("cancel-animation");
      this.shadowRoot
        .querySelector("#tooltip")
        .classList.add(this._getAnimationType("exit"));
    }
  }

  _onAnimationEnd() {
    // If no longer showing add class hidden to completely hide tooltip
    this._animationPlaying = false;
    if (!this._showing) {
      this.shadowRoot
        .querySelector("#tooltip")
        .classList.remove(this._getAnimationType("exit"));
      this.shadowRoot.querySelector("#tooltip").classList.add("hidden");
    }
  }

  _getAnimationType(type) {
    // These properties have priority over animationConfig values
    if (type === "entry" && this.animationEntry !== "") {
      return this.animationEntry;
    }
    if (type === "exit" && this.animationExit !== "") {
      return this.animationExit;
    }
    // If no results then return the legacy value from animationConfig
    if (
      this.animationConfig[type] &&
      typeof this.animationConfig[type][0].name === "string"
    ) {
      // Checking Timing and Update if necessary - Legacy for animationConfig
      if (
        this.animationConfig[type][0].timing &&
        this.animationConfig[type][0].timing.delay &&
        this.animationConfig[type][0].timing.delay !== 0
      ) {
        var timingDelay = this.animationConfig[type][0].timing.delay;
        // Has Timing Change - Update CSS
        if (type === "entry") {
          document.documentElement.style.setProperty(
            "--simple-tooltip-delay-in",
            timingDelay + "ms",
          );
        } else if (type === "exit") {
          document.documentElement.style.setProperty(
            "--simple-tooltip-delay-out",
            timingDelay + "ms",
          );
        }
      }
      return this.animationConfig[type][0].name;
    }
  }

  _removeListeners() {
    if (this._target) {
      this._target.removeEventListener("mouseover", this.show.bind(this));
      this._target.removeEventListener("focusin", this.show.bind(this));
      this._target.removeEventListener("mouseout", this.hide.bind(this));
      this._target.removeEventListener("focusout", this.hide.bind(this));
      this._target.removeEventListener("click", this.hide.bind(this));
    }
  }
  /**
   * LitElement ready
   */
  firstUpdated(changedProperties) {
    this.setAttribute("role", "tooltip");
    this.setAttribute("tabindex", -1);
    this._findTarget();
  }
  /**
   * LitElement life cycle - property changed
   */
  updated(changedProperties) {
    changedProperties.forEach((oldValue, propName) => {
      if (propName == "for") {
        this._findTarget(this[propName], oldValue);
      }
      if (propName == "manualMode") {
        this._manualModeChanged(this[propName], oldValue);
      }
      if (propName == "animationDelay") {
        this._delayChange(this[propName], oldValue);
      }
    });
  }
  _delayChange(newValue) {
    // Only Update delay if different value set
    if (newValue !== 500) {
      document.documentElement.style.setProperty(
        "--simple-tooltip-delay-in",
        newValue + "ms",
      );
    }
  }
}
customElements.define(SimpleTooltip.tag, SimpleTooltip);

/**
 * `a11y-collapse`
 * an accessible expand collapse
 * 
### Styling

`<a11y-collapse>` provides the following custom properties
for styling:

Custom property | Description | Default
----------------|-------------|----------
`--a11y-collapse-margin` | margin around a11y-collapse | 15px 0
`--a11y-collapse-border` | border around a11y-collapse | 1px solid
`--a11y-collapse-horizontal-padding` | horizontal padding inside a11y-collapse | 16px
`--a11y-collapse-horizontal-padding-left` | left padding inside a11y-collapse | `--a11y-collapse-horizontal-padding`
`--a11y-collapse-horizontal-padding-right` | right padding inside a11y-collapse | `--a11y-collapse-horizontal-padding`
`--a11y-collapse-vertical-padding` | vertical padding inside a11y-collapse | 16px
`--a11y-collapse-horizontal-padding-top` | top padding inside a11y-collapse | `--a11y-collapse-vertical-padding`
`--a11y-collapse-horizontal-padding-bottom` | bottom padding inside a11y-collapse | --a11y-collapse-vertical-padding
`--a11y-collapse-border-between` | border between a11y-collapse heading and content | --a11y-collapse-border
`--a11y-collapse-heading-font-weight` | font-weight for a11y-collapse heading | bold
`--a11y-collapse-heading-color` | text color for a11y-collapse heading | unset
`--a11y-collapse-heading-background-color` | background-color for a11y-collapse heading | unset
`--a11y-collapse-overflow-y` | override default overflow behavior | hidden
`--a11y-collapse-max-height` | override maximum height of collapse section | 200000000000vh, so that aanimation effect works
 *
 * @customElement
 * @extends LitElement
 * @demo demo/index.html
 * @demo ./demo/group.html collapse groups
 */
class A11yCollapse extends DDD {
  static get styles() {
    return [
      i$2`
        :host {
          display: block;
          margin: var(--a11y-collapse-margin, var(--ddd-spacing-4) 0);
          border: var(--a11y-collapse-border, var(--ddd-border-sm));
          border-color: var(
            --a11y-collapse-border-color,
            var(--ddd-theme-default-coalyGray)
          );
          transition: all 0.5s cubic-bezier(0.075, 0.82, 0.165, 1);
        }
        :host([heading-button]) #heading {
          cursor: pointer;
        }
        :host(:not(:first-of-type)) {
          border-top: var(
            --a11y-collapse-border-between,
            var(--a11y-collapse-border, var(--ddd-border-xs))
          );
        }
        :host([disabled]) {
          opacity: 0.5;
        }
        *[aria-controls="content"][disabled] {
          cursor: not-allowed;
        }
        button {
          background: transparent;
          border: 0;
          padding: 0;
          margin: 0;
          width: 100%;
          text-align: left;
          font-size: var(--ddd-theme-body-font-size);
          font-family: var(--ddd-font-primary);
        }
        #heading {
          display: flex;
          justify-content: stretch;
          align-items: center;
          padding: 0
            var(
              --a11y-collapse-padding-right,
              var(--a11y-collapse-horizontal-padding, var(--ddd-spacing-4))
            )
            0
            var(
              --a11y-collapse-padding-left,
              var(--a11y-collapse-horizontal-padding, var(--ddd-spacing-4))
            );
          font-weight: var(
            --a11y-collapse-heading-font-weight,
            var(--ddd-font-weight-bold)
          );
          margin: var(--a11y-collapse-margin);
          color: var(--a11y-collapse-heading-color);

          background-color: var(--a11y-collapse-heading-background-color);
        }
        :host([disabled]) #heading {
          color: var(--a11y-collapse-disabled-heading-color);
          background-color: var(
            --a11y-collapse-heading-disabled-background-color
          );
        }
        #text {
          flex-grow: 1;
          overflow: hidden;
        }
        #expand {
          transform: rotate(0deg);
          transition: transform 0.75s ease;
        }
        #content {
          padding: var(
              --a11y-collapse-padding-top,
              var(--a11y-collapse-vertical-padding, var(--ddd-spacing-4))
            )
            var(
              --a11y-collapse-padding-right,
              var(--a11y-collapse-horizontal-padding, var(--ddd-spacing-4))
            )
            var(
              --a11y-collapse-padding-bottom,
              var(--a11y-collapse-vertical-padding, var(--ddd-spacing-4))
            )
            var(
              --a11y-collapse-padding-left,
              var(--a11y-collapse-horizontal-padding, var(--ddd-spacing-4))
            );
          border-top: var(--a11y-collapse-border, var(--ddd-border-xs));
          border-color: var(
            --a11y-collapse-border-color,
            var(--ddd-theme-default-coalyGray)
          );
        }
        @media screen {
          #expand.rotated {
            transform: rotate(-90deg);
            transition: transform 0.75s ease;
          }
          :host #content {
            padding: 0
              var(
                --a11y-collapse-padding-right,
                var(--a11y-collapse-horizontal-padding, var(--ddd-spacing-4))
              )
              0
              var(
                --a11y-collapse-padding-left,
                var(--a11y-collapse-horizontal-padding, var(--ddd-spacing-4))
              );
            border-top: none;
            border-color: var(--a11y-collapse-border-color);
            max-height: 0;
            transition:
              visibility 0.75s ease,
              opacity 0.75s ease,
              max-height 0.75s ease;
            overflow-y: hidden;
            opacity: 1;
            visibility: visible;
          }
          :host #content-inner {
            max-height: 0;
            overflow-y: var(--a11y-collapse-overflow-y, hidden);
          }
          :host([expanded]) #content {
            padding: var(
                --a11y-collapse-padding-top,
                var(--a11y-collapse-vertical-padding, var(--ddd-spacing-4))
              )
              var(
                --a11y-collapse-padding-right,
                var(--a11y-collapse-horizontal-padding, var(--ddd-spacing-4))
              )
              var(
                --a11y-collapse-padding-bottom,
                var(--a11y-collapse-vertical-padding, var(--ddd-spacing-4))
              )
              var(
                --a11y-collapse-padding-left,
                var(--a11y-collapse-horizontal-padding, var(--ddd-spacing-4))
              );
            border-top: var(--a11y-collapse-border, var(--ddd-border-xs));
            border-color: var(
              --a11y-collapse-border-color,
              var(--ddd-theme-default-coalyGray)
            );
            max-height: 200000000000vh; /* why is this needed? */
          }
          :host([expanded]) #content-inner {
            max-height: var(--a11y-collapse-max-height, 200000000000vh);
            transition: max-height 0.75s ease;
          }
          :host(:not([expanded])) #content {
            visibility: hidden;
            opacity: 0;
            height: 0;
          }
        }
      `,
    ];
  }
  render() {
    return x`
      ${this.headingButton || this.accordion
        ? this._makeHeadingButton()
        : this._makeIconButton()}
      <div
        id="content"
        aria-hidden="${this.expanded ? "false" : "true"}"
        aria-labelledby="heading"
        aria-live="polite"
      >
        <div id="content-inner">
          ${this.expanded
            ? x`<slot name="content"></slot><slot></slot>`
            : ``}
        </div>
      </div>
    `;
  }

  static get tag() {
    return "a11y-collapse";
  }

  static get properties() {
    return {
      /**
       * Heading is the expand button.
       */
      headingButton: {
        type: Boolean,
        reflect: true,
        attribute: "heading-button",
      },
      /**
       * disbled
       */
      disabled: {
        type: Boolean,
        reflect: true,
        attribute: "disabled",
      },
      /**
       * hidden
       */
      hidden: {
        type: Boolean,
        reflect: true,
        attribute: "hidden",
      },
      /**
       * icon when expanded
       */
      expanded: {
        type: Boolean,
        reflect: true,
      },
      /**
       * icon for the button
       */
      icon: {
        type: String,
      },
      /**
       * icon when expanded
       */
      iconExpanded: {
        type: String,
        attribute: "icon-expanded",
      },
      /**
       * label for the button
       */
      label: {
        type: String,
      },
      /**
       * heading / title for the button
       */
      heading: {
        type: String,
      },
      /**
       * optional label for the button when expanded
       */
      labelExpanded: {
        type: String,
        attribute: "label-expanded",
      },
      /**
       * tooltip for the button
       */
      tooltip: {
        type: String,
      },
      /**
       * optional tooltip for the button when expanded
       */
      tooltipExpanded: {
        type: String,
        attribute: "tooltip-expanded",
      },
      /**
       * @deprecated Use {@link headingButton} instead
       */
      accordion: {
        type: Boolean,
        reflect: true,
        attribute: "accordion",
      },
    };
  }

  constructor() {
    super();
    this.headingButton = false;
    this.accordion = false;
    this.disabled = false;
    this.hidden = false;
    this.expanded = false;
    this.heading = null;
    this.icon = "icons:expand-more";
    this.label = "expand";
    this.tooltip = "expand";
  }
  /**
   * haxProperties integration via file reference
   */
  static get haxProperties() {
    return new URL(`./lib/${this.tag}.haxProperties.json`, import.meta.url)
      .href;
  }
  connectedCallback() {
    super.connectedCallback();
    setTimeout(() => {
      /**
       * Fires when constructed, so that parent radio group can listen for it.
       *
       * @event a11y-collapse-attached
       */
      this.dispatchEvent(
        new CustomEvent("a11y-collapse-attached", {
          bubbles: true,
          cancelable: true,
          composed: true,
          detail: this,
        }),
      );
    }, 0);
  }

  /**
   * Let the group know that this is gone.
   */
  disconnectedCallback() {
    /**
     * Fires when detatched, so that parent radio group will no longer listen for it.
     *
     * @event a11y-collapse-detached
     */
    this.dispatchEvent(
      new CustomEvent("a11y-collapse-detached", {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: this,
      }),
    );
    super.disconnectedCallback();
  }
  /**
   * Collapses the content
   */
  collapse() {
    this.toggle(false);
  }

  /**button

  /**
   * Toggles based on mode
   * @param {boolean} open whether to toggle open
   */
  toggle(open = !this.expanded) {
    this.expanded = open;
  }

  updated(changedProperties) {
    changedProperties.forEach((oldValue, propName) => {
      if (propName === "expanded") this._fireToggleEvents();
    });
  }

  /**
   * Fires toggling events
   */
  _fireToggleEvents() {
    /**
     * Fires when toggled.
     *
     * @event toggle
     */
    this.dispatchEvent(
      new CustomEvent("toggle", {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: this,
      }),
    );
    /**
     * Fires when toggled. @deprecated Use `toggle` instead
     *
     * @event a11y-collapse-toggle
     */
    this.dispatchEvent(
      new CustomEvent("a11y-collapse-toggle", {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: this,
      }),
    );
    if (this.expanded) {
      /**
       * Fires when expanded.
       *
       * @event expand
       */
      this.dispatchEvent(
        new CustomEvent("expand", {
          bubbles: true,
          cancelable: true,
          composed: true,
          detail: this,
        }),
      );
      this.label = "collapse";
      this.tooltip = "collapse";
    } else {
      /**
       * Fires when collapsed.
       *
       * @event collapse
       */
      this.dispatchEvent(
        new CustomEvent("collapse", {
          bubbles: true,
          cancelable: true,
          composed: true,
          detail: this,
        }),
      );
      this.label = "expand";
      this.tooltip = "expand";
    }
  }
  /**
   * determines the property based on expanded state
   * @param {string} defaultProp default property
   * @param {string} expandedProp property when expanded
   * @param {boolean} expanded whether a11y-collapse is expanded
   * @returns {string} property based on expanded state
   */
  _getExpanded(defaultProp, expandedProp, expanded) {
    return expanded && expandedProp ? expandedProp : defaultProp;
  }
  /**
   * renders collapse item where only entire heading is clickable button
   * @returns {object} html template for a heading as a clickable button
   */
  _makeHeadingButton() {
    return x`
      <button
        @click="${this._onClick}"
        aria-controls="content"
        aria-expanded="${this.expanded ? "true" : "false"}"
      >
        <div
          id="heading"
          part="heading-id"
          ?disabled="${this.disabled}"
          .label="${this._getExpanded(
            this.label,
            this.labelExpanded,
            this.expanded,
          )}"
        >
          <div id="text">
            ${this.heading
              ? x`<p part="heading">${this.heading}</p>`
              : ``}<slot name="heading"></slot>
          </div>
          <simple-icon-lite
            id="expand"
            class="${!this.expanded && !this.iconExpanded ? "rotated" : ""}"
            .icon="${this._getExpanded(
              this.icon || "icons:expand-more",
              this.iconExpanded,
              this.expanded,
            )}"
            aria-hidden="true"
          >
          </simple-icon-lite>
        </div>
      </button>
      <simple-tooltip for="heading"
        >${this._getExpanded(
          this.tooltip,
          this.tooltipExpanded,
          this.expanded,
        )}</simple-tooltip
      >
    `;
  }
  /**
   * renders collapse item where only icon is a clickable button
   * @returns {object} html template for a heading with an icon button
   */
  _makeIconButton() {
    return x`
      <div id="heading" part="heading-id">
        <div id="text">
          ${this.heading
            ? x`<p part="heading">${this.heading}</p>`
            : ``}<slot name="heading"></slot>
        </div>
        <simple-icon-button-lite
          id="expand"
          class="${!this.expanded && !this.iconExpanded ? "rotated" : ""}"
          @click="${this._onClick}"
          ?disabled="${this.disabled}"
          .label="${this._getExpanded(
            this.label,
            this.labelExpanded,
            this.expanded,
          )}"
          .icon="${this._getExpanded(
            this.icon || "icons:expand-more",
            this.iconExpanded,
            this.expanded,
          )}"
          aria-controls="content"
          aria-expanded="${this.expanded ? "true" : "false"}"
        >
        </simple-icon-button-lite>
        <simple-tooltip for="expand"
          >${this._getExpanded(
            this.tooltip,
            this.tooltipExpanded,
            this.expanded,
          )}</simple-tooltip
        >
      </div>
    `;
  }

  /**
   * Handle click
   */
  _onClick() {
    if (!this.disabled) {
      this.toggle();
      /**
       * Fires when clicked.
       *
       * @event a11y-collapse-click
       */
      this.dispatchEvent(
        new CustomEvent("a11y-collapse-click", {
          bubbles: true,
          cancelable: true,
          composed: true,
          detail: this,
        }),
      );
    }
  }
  /**
   *  @deprecated Use  {@link _makeHeadingButton} instead
   *
   * @memberof A11yCollapse
   */
  _makeAccordionButton() {
    this._makeHeadingButton();
  }
}
customElements.define(A11yCollapse.tag, A11yCollapse);

class Collapse extends A11yCollapse {
  static elementProperties = new Map([
    ...A11yCollapse.elementProperties,
    ['ki', Object]
  ])
  static get _styleSheet() {
    return stylesheet$8;
  }
  get expanded () {
    const { items={}, ki } = this.elementState;
    return items[ki].expanded || false;
  }
  set expanded (v) {
    const { items={}, ki } = this.elementState;
    if (items && ki in items) {
      items[ki].expanded = v;
      this.requestUpdate();
    }
    return true;
  }
}

class Panel extends HTMLElement {
  static get _styleSheet() {
    return stylesheet$9;
  }
  get elementTemplate() {
    const { items } = this.elementContents;
    const { itemsTemplate } = this.elementContents;
    return itemsTemplate(items || []);
  }
  get elementContents() {
    const itemsTemplate = (items) => {
      const details = this.defineElement(Collapse, {
        constants: { items }, 
        defaults: { ki: 0 }
      });
      return items.map((item, i) => {
        const paragraphs = item.content.map(text => {
          return toElement('p')`${() => text}`({});
        });
        return toElement(details)`
          <p slot="heading">${() => item.summary}</p>
          <div>${() => paragraphs}</div>
        `({
          accordion: true, ki: i,
          expanded: () => {
            return item.expanded
          },
          class: () => {
            if (i+1 == items.length) {
              return 'end';
            }
            return ''
          }
        });
      });
    };
    return { itemsTemplate };
  }
}

class StoryPanel extends Panel {
  get elementContents() {
    const { stories } = this.elementState.metadata_config;
    return {
      ...super.elementContents, items: stories 
    };
  }
}

class PanelContent extends HTMLElement {

  static get _styleSheet() {
    return stylesheet$9;
  }

  get elementTemplate() {
    const { heading, content } = this.elementContents;
    return toElement('div')`
      <h2 class="indent">${heading}</h2>
      ${content}
    `({
      'class': 'start grid wrapper'
    });
  }

  get elementContents() {
    const default_panel = this.defineElement(Panel);
    const story_panel = this.defineElement(StoryPanel);
    const { nav_config } = this.elementState;
    return {
      heading: () => {
        const { tab } = this.elementState;
        if (tab == 'STORY') {
          const { metadata_config } = this.elementState;
          return metadata_config['name'];
        }
        return nav_config.get(tab).heading
      },
      content: () => {
        const { tab } = this.elementState;
        if (tab == 'STORY') {
          return toElement(story_panel)``({});
        }
        return toElement(default_panel)``({});
      }
    }
  }
}

const stylesheet$7 = new CSSStyleSheet();
stylesheet$7.replaceSync(`:host {
  --dialog-border-radius: var(--radius-inner-0010);
  --dialog-bg: var(--dark-glass);
  --dialog-container-padding: 0;
  --dialog-width: auto;
  #backdrop {
    border-radius: var(--radius-outer-0010);
    backdrop-filter: var(--glass-filter);
    background-color: var(--dark-main-glass);
    position: static;
    grid-column: 1;
    grid-row: 1;
  }
  #dialog {
    backdrop-filter: var(--glass-filter);
    border-top: var(--thin-glass-border);
    border: var(--thin-glass-border);
    grid-column: 1;
    grid-row: 1;
    margin: 0;
  }
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 1fr;
  position: static;
  padding: 0;
  height: 100%;
}
`);

/**
 * Traverses the slots of the open shadowroots and returns all children matching the query.
 * @param {ShadowRoot | HTMLElement} root
 * @param skipNode
 * @param isMatch
 * @param {number} maxDepth
 * @param {number} depth
 * @returns {HTMLElement[]}
 */
function queryShadowRoot(root, skipNode, isMatch, maxDepth = 20, depth = 0) {
    let matches = [];
    // If the depth is above the max depth, abort the searching here.
    if (depth >= maxDepth) {
        return matches;
    }
    // Traverses a slot element
    const traverseSlot = ($slot) => {
        // Only check nodes that are of the type Node.ELEMENT_NODE
        // Read more here https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType
        const assignedNodes = $slot.assignedNodes().filter(node => node.nodeType === 1);
        if (assignedNodes.length > 0) {
            return queryShadowRoot(assignedNodes[0].parentElement, skipNode, isMatch, maxDepth, depth + 1);
        }
        return [];
    };
    // Go through each child and continue the traversing if necessary
    // Even though the typing says that children can't be undefined, Edge 15 sometimes gives an undefined value.
    // Therefore we fallback to an empty array if it is undefined.
    const children = Array.from(root.children || []);
    for (const $child of children) {
        // Check if the node and its descendants should be skipped
        if (skipNode($child)) {
            continue;
        }
        // If the child matches we always add it
        if (isMatch($child)) {
            matches.push($child);
        }
        if ($child.shadowRoot != null) {
            matches.push(...queryShadowRoot($child.shadowRoot, skipNode, isMatch, maxDepth, depth + 1));
        }
        else if ($child.tagName === "SLOT") {
            matches.push(...traverseSlot($child));
        }
        else {
            matches.push(...queryShadowRoot($child, skipNode, isMatch, maxDepth, depth + 1));
        }
    }
    return matches;
}

/**
 * Returns whether the element is hidden.
 * @param $elem
 */
function isHidden($elem) {
    return $elem.hasAttribute("hidden")
        || ($elem.hasAttribute("aria-hidden") && $elem.getAttribute("aria-hidden") !== "false")
        // A quick and dirty way to check whether the element is hidden.
        // For a more fine-grained check we could use "window.getComputedStyle" but we don't because of bad performance.
        // If the element has visibility set to "hidden" or "collapse", display set to "none" or opacity set to "0" through CSS
        // we won't be able to catch it here. We accept it due to the huge performance benefits.
        || $elem.style.display === `none`
        || $elem.style.opacity === `0`
        || $elem.style.visibility === `hidden`
        || $elem.style.visibility === `collapse`;
    // If offsetParent is null we can assume that the element is hidden
    // https://stackoverflow.com/questions/306305/what-would-make-offsetparent-null
    //|| $elem.offsetParent == null;
}
/**
 * Returns whether the element is disabled.
 * @param $elem
 */
function isDisabled($elem) {
    return $elem.hasAttribute("disabled")
        || ($elem.hasAttribute("aria-disabled") && $elem.getAttribute("aria-disabled") !== "false");
}
/**
 * Determines whether an element is focusable.
 * Read more here: https://stackoverflow.com/questions/1599660/which-html-elements-can-receive-focus/1600194#1600194
 * Or here: https://stackoverflow.com/questions/18261595/how-to-check-if-a-dom-element-is-focusable
 * @param $elem
 */
function isFocusable($elem) {
    // Discard elements that are removed from the tab order.
    if ($elem.getAttribute("tabindex") === "-1" || isHidden($elem) || isDisabled($elem)) {
        return false;
    }
    return (
    // At this point we know that the element can have focus (eg. won't be -1) if the tabindex attribute exists
    $elem.hasAttribute("tabindex")
        // Anchor tags or area tags with a href set
        || ($elem instanceof HTMLAnchorElement || $elem instanceof HTMLAreaElement) && $elem.hasAttribute("href")
        // Form elements which are not disabled
        || ($elem instanceof HTMLButtonElement
            || $elem instanceof HTMLInputElement
            || $elem instanceof HTMLTextAreaElement
            || $elem instanceof HTMLSelectElement)
        // IFrames
        || $elem instanceof HTMLIFrameElement);
}

const timeouts = new Map();
/**
 * Debounces a callback.
 * @param cb
 * @param ms
 * @param id
 */
function debounce(cb, ms, id) {
    // Clear current timeout for id
    const timeout = timeouts.get(id);
    if (timeout != null) {
        window.clearTimeout(timeout);
    }
    // Set new timeout
    timeouts.set(id, window.setTimeout(() => {
        cb();
        timeouts.delete(id);
    }, ms));
}

/**
 * Template for the focus trap.
 */
const template$1 = document.createElement("template");
template$1.innerHTML = `
	<div id="start"></div>
	<div id="backup"></div>
	<slot></slot>
	<div id="end"></div>
`;
/**
 * Focus trap web component.
 * @customElement focus-trap
 * @slot - Default content.
 */
class FocusTrap extends HTMLElement {
    /**
     * Attaches the shadow root.
     */
    constructor() {
        super();
        // The debounce id is used to distinguish this focus trap from others when debouncing
        this.debounceId = Math.random().toString();
        this._focused = false;
        const shadow = this.attachShadow({ mode: "open" });
        shadow.appendChild(template$1.content.cloneNode(true));
        this.$backup = shadow.querySelector("#backup");
        this.$start = shadow.querySelector("#start");
        this.$end = shadow.querySelector("#end");
        this.focusLastElement = this.focusLastElement.bind(this);
        this.focusFirstElement = this.focusFirstElement.bind(this);
        this.onFocusIn = this.onFocusIn.bind(this);
        this.onFocusOut = this.onFocusOut.bind(this);
    }
    // Whenever one of these attributes changes we need to render the template again.
    static get observedAttributes() {
        return [
            "inactive"
        ];
    }
    /**
     * Determines whether the focus trap is active or not.
     * @attr
     */
    get inactive() {
        return this.hasAttribute("inactive");
    }
    set inactive(value) {
        value ? this.setAttribute("inactive", "") : this.removeAttribute("inactive");
    }
    /**
     * Returns whether the element currently has focus.
     */
    get focused() {
        return this._focused;
    }
    /**
     * Hooks up the element.
     */
    connectedCallback() {
        this.$start.addEventListener("focus", this.focusLastElement);
        this.$end.addEventListener("focus", this.focusFirstElement);
        // Focus out is called every time the user tabs around inside the element
        this.addEventListener("focusin", this.onFocusIn);
        this.addEventListener("focusout", this.onFocusOut);
        this.render();
    }
    /**
     * Tears down the element.
     */
    disconnectedCallback() {
        this.$start.removeEventListener("focus", this.focusLastElement);
        this.$end.removeEventListener("focus", this.focusFirstElement);
        this.removeEventListener("focusin", this.onFocusIn);
        this.removeEventListener("focusout", this.onFocusOut);
    }
    /**
     * When the attributes changes we need to re-render the template.
     */
    attributeChangedCallback() {
        this.render();
    }
    /**
     * Focuses the first focusable element in the focus trap.
     */
    focusFirstElement() {
        this.trapFocus();
    }
    /**
     * Focuses the last focusable element in the focus trap.
     */
    focusLastElement() {
        this.trapFocus(true);
    }
    /**
     * Returns a list of the focusable children found within the element.
     */
    getFocusableElements() {
        return queryShadowRoot(this, isHidden, isFocusable);
    }
    /**
     * Focuses on either the last or first focusable element.
     * @param {boolean} trapToEnd
     */
    trapFocus(trapToEnd) {
        if (this.inactive)
            return;
        let focusableChildren = this.getFocusableElements();
        if (focusableChildren.length > 0) {
            if (trapToEnd) {
                focusableChildren[focusableChildren.length - 1].focus();
            }
            else {
                focusableChildren[0].focus();
            }
            this.$backup.setAttribute("tabindex", "-1");
        }
        else {
            // If there are no focusable children we need to focus on the backup
            // to trap the focus. This is a useful behavior if the focus trap is
            // for example used in a dialog and we don't want the user to tab
            // outside the dialog even though there are no focusable children
            // in the dialog.
            this.$backup.setAttribute("tabindex", "0");
            this.$backup.focus();
        }
    }
    /**
     * When the element gains focus this function is called.
     */
    onFocusIn() {
        this.updateFocused(true);
    }
    /**
     * When the element looses its focus this function is called.
     */
    onFocusOut() {
        this.updateFocused(false);
    }
    /**
     * Updates the focused property and updates the view.
     * The update is debounced because the focusin and focusout out
     * might fire multiple times in a row. We only want to render
     * the element once, therefore waiting until the focus is "stable".
     * @param value
     */
    updateFocused(value) {
        debounce(() => {
            if (this.focused !== value) {
                this._focused = value;
                this.render();
            }
        }, 0, this.debounceId);
    }
    /**
     * Updates the template.
     */
    render() {
        this.$start.setAttribute("tabindex", !this.focused || this.inactive ? `-1` : `0`);
        this.$end.setAttribute("tabindex", !this.focused || this.inactive ? `-1` : `0`);
        this.focused ? this.setAttribute("focused", "") : this.removeAttribute("focused");
    }
}
window.customElements.define("focus-trap", FocusTrap);

/**
 * Returns the data dialog count for an element.
 * @param $elem
 */
function getDialogCount($elem) {
    return Number($elem.getAttribute(`data-dialog-count`)) || 0;
}
/**
 * Sets the data dialog count for an element.
 * @param $elem
 * @param count
 */
function setDialogCount($elem, count) {
    $elem.setAttribute(`data-dialog-count`, count.toString());
}
/**
 * Traverses the tree of active elements down the shadow tree.
 * @param activeElement
 */
function traverseActiveElements(activeElement = document.activeElement) {
    if (activeElement != null && activeElement.shadowRoot != null && activeElement.shadowRoot.activeElement != null) {
        return traverseActiveElements(activeElement.shadowRoot.activeElement);
    }
    return activeElement;
}

var styles = `*{box-sizing:border-box}:host{padding:var(--dialog-container-padding,5vw 24px);z-index:var(--dialog-z-index,12345678);outline:none}#backdrop,:host{position:fixed;top:0;left:0;bottom:0;right:0}:host,:host([center]) #dialog{overflow-x:var(--dialog-overflow-x,hidden);overflow-y:var(--dialog-overflow-y,auto);overscroll-behavior:contain;-webkit-overflow-scrolling:touch}:host([center]){display:flex;align-items:center;justify-content:center;overflow:hidden}:host([center]) #dialog{max-height:var(--dialog-max-height,100%)}:host(:not(:defined)),:host(:not([open])){display:none}#backdrop{background:var(--dialog-backdrop-bg,rgba(0,0,0,.6));animation:fadeIn var(--dialog-animation-duration,.1s) var(--dialog-animation-easing,ease-out);z-index:-1}#dialog{animation:scaleIn var(--dialog-animation-duration,.1s) var(--dialog-animation-easing,ease-out);border-radius:var(--dialog-border-radius,12px);box-shadow:var(--dialog-box-shadow,0 2px 10px -5px rgba(0,0,0,.6));max-width:var(--dialog-max-width,700px);width:var(--dialog-width,100%);padding:var(--dialog-padding,24px);max-height:var(--dialog-max-height,unset);height:var(--dialog-height,auto);color:var(--dialog-color,currentColor);background:var(--dialog-bg,#fff);z-index:1;position:relative;display:flex;flex-direction:column;margin:0 auto;border:none}::slotted(article),article{flex-grow:1;overflow-y:auto;-webkit-overflow-scrolling:touch}::slotted(footer),::slotted(header),footer,header{flex-shrink:0}@keyframes scaleIn{0%{transform:scale(.9) translateY(30px);opacity:0}to{transform:scale(1) translateY(0);opacity:1}}@keyframes fadeIn{0%{opacity:0}to{opacity:1}}`;

const template = document.createElement("template");
template.innerHTML = `
  <style>${styles}</style>
  <div id="backdrop" part="backdrop"></div>
  <focus-trap id="dialog" part="dialog">
    <slot></slot>
  </focus-trap>
`;
/**
 * A dialog web component that can be used to display highly interruptive messages.
 * @fires open - This event is fired when the dialog opens.
 * @fires close - This event is fired when the dialog closes.
 * @fires closing - This event is fired before the dialog is closed by clicking escape or on the backdrop. The event is cancellable which means `event.preventDefault()` can cancel the closing of the dialog.
 * @cssprop --dialog-container-padding - Padding of the host container of the dialog.
 * @cssprop --dialog-z-index - Z-index of the dialog.
 * @cssprop --dialog-overflow-x - Overflow of the x-axis.
 * @cssprop --dialog-overflow-y - Overflow of the y-axis.
 * @cssprop --dialog-max-height - Max height of the dialog.
 * @cssprop --dialog-height - Height of the dialog.
 * @cssprop --dialog-backdrop-bg - Background of the backdrop.
 * @cssprop --dialog-animation-duration - Duration of the dialog animation.
 * @cssprop --dialog-animation-easing - Easing of the dialog animation.
 * @cssprop --dialog-border-radius - Border radius of the dialog.
 * @cssprop --dialog-box-shadow - Box shadow of the dialog.
 * @cssprop --dialog-max-width - Max width of the dialog.
 * @cssprop --dialog-width - Width of the dialog.
 * @cssprop --dialog-padding - Padding of the dialog.
 * @cssprop --dialog-color - Color of the dialog.
 * @cssprop --dialog-bg - Background of the dialog.
 * @csspart backdrop - Backdrop part.
 * @csspart dialog - Dialog part.
 */
class WebDialog extends HTMLElement {
    /**
     * Attaches the shadow root.
     */
    constructor() {
        super();
        this.$scrollContainer = document.documentElement;
        this.$previousActiveElement = null;
        const shadow = this.attachShadow({ mode: "open" });
        shadow.appendChild(template.content.cloneNode(true));
        this.$dialog = shadow.querySelector("#dialog");
        this.$backdrop = shadow.querySelector("#backdrop");
        this.onBackdropClick = this.onBackdropClick.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        // Set aria attributes
        this.setAttribute("aria-modal", "true");
        this.$dialog.setAttribute("role", "alertdialog");
    }
    static get observedAttributes() {
        return ["open", "center"];
    }
    /**
     * Whether the dialog is opened.
     * @attr
     */
    get open() {
        return this.hasAttribute("open");
    }
    set open(value) {
        value ? this.setAttribute("open", "") : this.removeAttribute("open");
    }
    /**
     * Whether the dialog is centered on the page.
     * @attr
     */
    get center() {
        return this.hasAttribute("center");
    }
    set center(value) {
        value ? this.setAttribute("center", "") : this.removeAttribute("center");
    }
    /**
     * Attaches event listeners when connected.
     */
    connectedCallback() {
        this.$backdrop.addEventListener("click", this.onBackdropClick);
    }
    /**
     * Removes event listeners when disconnected.
     */
    disconnectedCallback() {
        this.$backdrop.removeEventListener("click", this.onBackdropClick);
        // If the dialog is open when it is removed from the DOM
        // we need to cleanup the event listeners and side effects.
        if (this.open) {
            this.didClose();
        }
    }
    /**
     * Shows the dialog.
     */
    show() {
        this.open = true;
    }
    /**
     * Closes the dialog with a result.
     * @param result
     */
    close(result) {
        this.result = result;
        this.open = false;
    }
    /**
     * Closes the dialog when the backdrop is clicked.
     */
    onBackdropClick() {
        if (this.assertClosing()) {
            this.close();
        }
    }
    /**
     * Closes the dialog when escape is pressed.
     */
    onKeyDown(e) {
        switch (e.code) {
            case "Escape":
                if (this.assertClosing()) {
                    this.close();
                    // If there are more dialogs, we don't want to close those also :-)
                    e.stopImmediatePropagation();
                }
                break;
        }
    }
    /**
     * Dispatches an event that, if asserts whether the dialog can be closed.
     * If "preventDefault()" is called on the event, assertClosing will return true
     * if the event was not cancelled. It will return false if the event was cancelled.
     */
    assertClosing() {
        return this.dispatchEvent(new CustomEvent("closing", { cancelable: true }));
    }
    /**
     * Setup the dialog after it has opened.
     */
    didOpen() {
        // Save the current active element so we have a way of restoring the focus when the dialog is closed.
        this.$previousActiveElement = traverseActiveElements(document.activeElement);
        // Focus the first element in the focus trap.
        // Wait for the dialog to show its content before we try to focus inside it.
        // We request an animation frame to make sure the content is now visible.
        requestAnimationFrame(() => {
            this.$dialog.focusFirstElement();
        });
        // Make the dialog focusable
        this.tabIndex = 0;
        // Block the scrolling on the scroll container to avoid the outside content to scroll.
        this.$scrollContainer.style.overflow = `hidden`;
        // Listen for key down events to close the dialog when escape is pressed.
        this.addEventListener("keydown", this.onKeyDown, { capture: true, passive: true });
        // Increment the dialog count with one to keep track of how many dialogs are currently nested.
        setDialogCount(this.$scrollContainer, getDialogCount(this.$scrollContainer) + 1);
        // Dispatch an event so the rest of the world knows the dialog opened.
        this.dispatchEvent(new CustomEvent("open"));
    }
    /**
     * Clean up the dialog after it has closed.
     */
    didClose() {
        // Remove the listener listening for key events
        this.removeEventListener("keydown", this.onKeyDown, { capture: true });
        // Decrement the dialog count with one to keep track of how many dialogs are currently nested.
        setDialogCount(this.$scrollContainer, Math.max(0, getDialogCount(this.$scrollContainer) - 1));
        // If there are now 0 active dialogs we unblock the scrolling from the scroll container.
        // This is because we know that no other dialogs are currently nested within the scroll container.
        if (getDialogCount(this.$scrollContainer) <= 0) {
            this.$scrollContainer.style.overflow = ``;
        }
        // Make the dialog unfocusable.
        this.tabIndex = -1;
        // Restore previous active element.
        if (this.$previousActiveElement != null) {
            this.$previousActiveElement.focus();
            this.$previousActiveElement = null;
        }
        // Dispatch an event so the rest of the world knows the dialog closed.
        // If a result has been set, the result is added to the detail property of the event.
        this.dispatchEvent(new CustomEvent("close", { detail: this.result }));
    }
    /**
     * Reacts when an observed attribute changes.
     */
    attributeChangedCallback(name, newValue, oldValue) {
        switch (name) {
            case "open":
                this.open ? this.didOpen() : this.didClose();
                break;
        }
    }
}
customElements.define("web-dialog", WebDialog);

class StyledDialog extends WebDialog {
  static get _styleSheet() {
    return stylesheet$7;
  }
}

const stylesheet$6 = new CSSStyleSheet();
stylesheet$6.replaceSync(`input.button[type='submit'] {
  background-color: var(--dark-accept-color);
  margin-top: var(--gap-medium);
  padding: var(--gap-small);
}
`);

const stylesheet$5 = new CSSStyleSheet();
stylesheet$5.replaceSync(`:host {
  --vaadin-input-field-label-color: var(--light-main-color);
  --vaadin-input-field-value-color: var(--light-focus-color);
  --vaadin-input-field-focused-label-color: var(--light-focus-color);
  --vaadin-input-field-hovered-label-color: var(--light-focus-color);
}
`);

/**
 * @license
 * Copyright (c) 2021 - 2024 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */

function defineCustomElement(CustomElement) {
  const defined = customElements.get(CustomElement.is);
  if (!defined) {
    Object.defineProperty(CustomElement, 'version', {
      get() {
        return '24.4.3';
      },
    });

    customElements.define(CustomElement.is, CustomElement);
  } else {
    const definedVersion = defined.version;
    if (definedVersion && CustomElement.version && definedVersion === CustomElement.version) {
      // Just loading the same thing again
      console.warn(`The component ${CustomElement.is} has been loaded twice`);
    } else {
      console.error(
        `Tried to define ${CustomElement.is} version ${CustomElement.version} when version ${defined.version} is already in use. Something will probably break.`,
      );
    }
  }
}

/**
 * @license
 * Copyright (c) 2017 - 2024 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */

/**
 * Dummy custom element used for collecting
 * development time usage statistics.
 *
 * @private
 */
class Lumo extends HTMLElement {
  static get is() {
    return 'vaadin-lumo-styles';
  }
}

defineCustomElement(Lumo);

/**
 * @license
 * Copyright (c) 2017 - 2024 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */
/**
 * @polymerMixin
 */
const ThemePropertyMixin = (superClass) =>
  class VaadinThemePropertyMixin extends superClass {
    static get properties() {
      return {
        /**
         * Helper property with theme attribute value facilitating propagation
         * in shadow DOM.
         *
         * Enables the component implementation to propagate the `theme`
         * attribute value to the sub-components in Shadow DOM by binding
         * the sub-component's "theme" attribute to the `theme` property of
         * the host.
         *
         * **NOTE:** Extending the mixin only provides the property for binding,
         * and does not make the propagation alone.
         *
         * See [Styling Components: Sub-components](https://vaadin.com/docs/latest/styling/styling-components/#sub-components).
         * page for more information.
         *
         * @protected
         */
        _theme: {
          type: String,
          readOnly: true,
        },
      };
    }

    static get observedAttributes() {
      return [...super.observedAttributes, 'theme'];
    }

    /** @protected */
    attributeChangedCallback(name, oldValue, newValue) {
      super.attributeChangedCallback(name, oldValue, newValue);

      if (name === 'theme') {
        this._set_theme(newValue);
      }
    }
  };

/**
 * @license
 * Copyright (c) 2017 - 2024 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */

/**
 * @typedef {Object} Theme
 * @property {string} themeFor
 * @property {CSSResult[]} styles
 * @property {string | string[]} [include]
 * @property {string} [moduleId]
 *
 * @typedef {CSSResult[] | CSSResult} CSSResultGroup
 */

/**
 * @type {Theme[]}
 */
const themeRegistry = [];

/**
 * @type {WeakRef<HTMLElement>[]}
 */
const themableInstances = new Set();

/**
 * @type {string[]}
 */
const themableTagNames = new Set();

/**
 * Check if the custom element type has themes applied.
 * @param {Function} elementClass
 * @returns {boolean}
 */
function classHasThemes(elementClass) {
  return elementClass && Object.prototype.hasOwnProperty.call(elementClass, '__themes');
}

/**
 * Check if the custom element type has themes applied.
 * @param {string} tagName
 * @returns {boolean}
 */
function hasThemes(tagName) {
  return classHasThemes(customElements.get(tagName));
}

/**
 * Flattens the styles into a single array of styles.
 * @param {CSSResultGroup} styles
 * @param {CSSResult[]} result
 * @returns {CSSResult[]}
 */
function flattenStyles(styles = []) {
  return [styles].flat(Infinity).filter((style) => {
    if (style instanceof n$2) {
      return true;
    }
    console.warn('An item in styles is not of type CSSResult. Use `unsafeCSS` or `css`.');
    return false;
  });
}

/**
 * Returns true if the themeFor string matches the tag name
 * @param {string} themeFor
 * @param {string} tagName
 * @returns {boolean}
 */
function matchesThemeFor(themeFor, tagName) {
  return (themeFor || '').split(' ').some((themeForToken) => {
    return new RegExp(`^${themeForToken.split('*').join('.*')}$`, 'u').test(tagName);
  });
}

/**
 * Returns the CSS text content from an array of CSSResults
 * @param {CSSResult[]} styles
 * @returns {string}
 */
function getCssText(styles) {
  return styles.map((style) => style.cssText).join('\n');
}

const STYLE_ID = 'vaadin-themable-mixin-style';

/**
 * Includes the styles to the template.
 * @param {CSSResult[]} styles
 * @param {HTMLTemplateElement} template
 */
function addStylesToTemplate(styles, template) {
  const styleEl = document.createElement('style');
  styleEl.id = STYLE_ID;
  styleEl.textContent = getCssText(styles);
  template.content.appendChild(styleEl);
}

/**
 * Dynamically updates the styles of the given component instance.
 * @param {HTMLElement} instance
 */
function updateInstanceStyles(instance) {
  if (!instance.shadowRoot) {
    return;
  }

  const componentClass = instance.constructor;

  if (instance instanceof s) {
    // LitElement

    // The adoptStyles function may fall back to appending style elements to shadow root.
    // Remove them first to avoid duplicates.
    [...instance.shadowRoot.querySelectorAll('style')].forEach((style) => style.remove());

    // Adopt the updated styles
    S$1(instance.shadowRoot, componentClass.elementStyles);
  } else {
    // PolymerElement

    // Update style element content in the shadow root
    const style = instance.shadowRoot.getElementById(STYLE_ID);
    const template = componentClass.prototype._template;
    style.textContent = template.content.getElementById(STYLE_ID).textContent;
  }
}

/**
 * Dynamically updates the styles of the instances matching the given component type.
 * @param {Function} componentClass
 */
function updateInstanceStylesOfType(componentClass) {
  // Iterate over component instances and update their styles if needed
  themableInstances.forEach((ref) => {
    const instance = ref.deref();
    if (instance instanceof componentClass) {
      updateInstanceStyles(instance);
    } else if (!instance) {
      // Clean up the weak reference to a GC'd instance
      themableInstances.delete(ref);
    }
  });
}

/**
 * Dynamically updates the styles of the given component type.
 * @param {Function} componentClass
 */
function updateComponentStyles(componentClass) {
  if (componentClass.prototype instanceof s) {
    // Update LitElement-based component's elementStyles
    componentClass.elementStyles = componentClass.finalizeStyles(componentClass.styles);
  } else {
    // Update Polymer-based component's template
    const template = componentClass.prototype._template;
    template.content.getElementById(STYLE_ID).textContent = getCssText(componentClass.getStylesForThis());
  }

  // Update the styles of inheriting types
  themableTagNames.forEach((inheritingTagName) => {
    const inheritingClass = customElements.get(inheritingTagName);
    if (inheritingClass !== componentClass && inheritingClass.prototype instanceof componentClass) {
      updateComponentStyles(inheritingClass);
    }
  });
}

/**
 * Check if the component type already has a style matching the given styles.
 *
 * @param {Function} componentClass
 * @param {CSSResultGroup} styles
 * @returns {boolean}
 */
function hasMatchingStyle(componentClass, styles) {
  const themes = componentClass.__themes;
  if (!themes || !styles) {
    return false;
  }

  return themes.some((theme) =>
    theme.styles.some((themeStyle) => styles.some((style) => style.cssText === themeStyle.cssText)),
  );
}

/**
 * Registers CSS styles for a component type. Make sure to register the styles before
 * the first instance of a component of the type is attached to DOM.
 *
 * @param {string} themeFor The local/tag name of the component type to register the styles for
 * @param {CSSResultGroup} styles The CSS style rules to be registered for the component type
 * matching themeFor and included in the local scope of each component instance
 * @param {{moduleId?: string, include?: string | string[]}} options Additional options
 * @return {void}
 */
function registerStyles(themeFor, styles, options = {}) {
  styles = flattenStyles(styles);

  if (window.Vaadin && window.Vaadin.styleModules) {
    window.Vaadin.styleModules.registerStyles(themeFor, styles, options);
  } else {
    themeRegistry.push({
      themeFor,
      styles,
      include: options.include,
      moduleId: options.moduleId,
    });
  }

  if (themeFor) {
    // Update styles of the component types that match themeFor and have already been finalized
    themableTagNames.forEach((tagName) => {
      if (matchesThemeFor(themeFor, tagName) && hasThemes(tagName)) {
        const componentClass = customElements.get(tagName);

        if (hasMatchingStyle(componentClass, styles)) {
          // Show a warning if the component type already has some of the given styles
          console.warn(`Registering styles that already exist for ${tagName}`);
        } else if (!window.Vaadin || !window.Vaadin.suppressPostFinalizeStylesWarning) {
          // Show a warning if the component type has already been finalized
          console.warn(
            `The custom element definition for "${tagName}" ` +
              `was finalized before a style module was registered. ` +
              `Ideally, import component specific style modules before ` +
              `importing the corresponding custom element. ` +
              `This warning can be suppressed by setting "window.Vaadin.suppressPostFinalizeStylesWarning = true".`,
          );
        }

        // Update the styles of the component type
        updateComponentStyles(componentClass);
        // Update the styles of the component instances matching the component type
        updateInstanceStylesOfType(componentClass);
      }
    });
  }
}

/**
 * Returns all registered themes. By default the themeRegistry is returned as is.
 * In case the style-modules adapter is imported, the themes are obtained from there instead
 * @returns {Theme[]}
 */
function getAllThemes() {
  if (window.Vaadin && window.Vaadin.styleModules) {
    return window.Vaadin.styleModules.getAllThemes();
  }
  return themeRegistry;
}

/**
 * Maps the moduleName to an include priority number which is used for
 * determining the order in which styles are applied.
 * @param {string} moduleName
 * @returns {number}
 */
function getIncludePriority(moduleName = '') {
  let includePriority = 0;
  if (moduleName.startsWith('lumo-') || moduleName.startsWith('material-')) {
    includePriority = 1;
  } else if (moduleName.startsWith('vaadin-')) {
    includePriority = 2;
  }
  return includePriority;
}

/**
 * Gets an array of CSSResults matching the include property of the theme.
 * @param {Theme} theme
 * @returns {CSSResult[]}
 */
function getIncludedStyles(theme) {
  const includedStyles = [];
  if (theme.include) {
    [].concat(theme.include).forEach((includeModuleId) => {
      const includedTheme = getAllThemes().find((s) => s.moduleId === includeModuleId);
      if (includedTheme) {
        includedStyles.push(...getIncludedStyles(includedTheme), ...includedTheme.styles);
      } else {
        console.warn(`Included moduleId ${includeModuleId} not found in style registry`);
      }
    }, theme.styles);
  }
  return includedStyles;
}

/**
 * Returns an array of themes that should be used for styling a component matching
 * the tag name. The array is sorted by the include order.
 * @param {string} tagName
 * @returns {Theme[]}
 */
function getThemes(tagName) {
  const defaultModuleName = `${tagName}-default-theme`;

  const themes = getAllThemes()
    // Filter by matching themeFor properties
    .filter((theme) => theme.moduleId !== defaultModuleName && matchesThemeFor(theme.themeFor, tagName))
    .map((theme) => ({
      ...theme,
      // Prepend styles from included themes
      styles: [...getIncludedStyles(theme), ...theme.styles],
      // Map moduleId to includePriority
      includePriority: getIncludePriority(theme.moduleId),
    }))
    // Sort by includePriority
    .sort((themeA, themeB) => themeB.includePriority - themeA.includePriority);

  if (themes.length > 0) {
    return themes;
  }
  // No theme modules found, return the default module if it exists
  return getAllThemes().filter((theme) => theme.moduleId === defaultModuleName);
}

/**
 * @polymerMixin
 * @mixes ThemePropertyMixin
 */
const ThemableMixin = (superClass) =>
  class VaadinThemableMixin extends ThemePropertyMixin(superClass) {
    constructor() {
      super();
      // Store a weak reference to the instance
      themableInstances.add(new WeakRef(this));
    }

    /**
     * Covers PolymerElement based component styling
     * @protected
     */
    static finalize() {
      super.finalize();

      if (this.is) {
        themableTagNames.add(this.is);
      }

      // Make sure not to run the logic intended for PolymerElement when LitElement is used.
      if (this.elementStyles) {
        return;
      }

      const template = this.prototype._template;
      if (!template || classHasThemes(this)) {
        return;
      }

      addStylesToTemplate(this.getStylesForThis(), template);
    }

    /**
     * Covers LitElement based component styling
     *
     * @protected
     */
    static finalizeStyles(styles) {
      // The "styles" object originates from the "static get styles()" function of
      // a LitElement based component. The theme styles are added after it
      // so that they can override the component styles.
      const themeStyles = this.getStylesForThis();
      return styles ? [...[styles].flat(Infinity), ...themeStyles] : themeStyles;
    }

    /**
     * Get styles for the component type
     *
     * @private
     */
    static getStylesForThis() {
      const superClassThemes = superClass.__themes || [];
      const parent = Object.getPrototypeOf(this.prototype);
      const inheritedThemes = (parent ? parent.constructor.__themes : []) || [];
      this.__themes = [...superClassThemes, ...inheritedThemes, ...getThemes(this.is)];
      const themeStyles = this.__themes.flatMap((theme) => theme.styles);
      // Remove duplicates
      return themeStyles.filter((style, index) => index === themeStyles.lastIndexOf(style));
    }
  };

/**
 * @license
 * Copyright (c) 2017 - 2024 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */

/**
 * This is for use internally by Lumo and Material styles.
 *
 * @param {string} id the id to set on the created element, only for informational purposes
 * @param  {CSSResultGroup[]} styles the styles to add
 */
const addGlobalThemeStyles = (id, ...styles) => {
  const styleTag = document.createElement('style');
  styleTag.id = id;
  styleTag.textContent = styles
    .map((style) => style.toString())
    .join('\n')
    .replace(':host', 'html');

  document.head.insertAdjacentElement('afterbegin', styleTag);
};

const addLumoGlobalStyles = (id, ...styles) => {
  addGlobalThemeStyles(`lumo-${id}`, styles);
};

/**
 * @license
 * Copyright (c) 2017 - 2024 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */

const spacing = i$2`
  :host {
    /* Square */
    --lumo-space-xs: 0.25rem;
    --lumo-space-s: 0.5rem;
    --lumo-space-m: 1rem;
    --lumo-space-l: 1.5rem;
    --lumo-space-xl: 2.5rem;

    /* Wide */
    --lumo-space-wide-xs: calc(var(--lumo-space-xs) / 2) var(--lumo-space-xs);
    --lumo-space-wide-s: calc(var(--lumo-space-s) / 2) var(--lumo-space-s);
    --lumo-space-wide-m: calc(var(--lumo-space-m) / 2) var(--lumo-space-m);
    --lumo-space-wide-l: calc(var(--lumo-space-l) / 2) var(--lumo-space-l);
    --lumo-space-wide-xl: calc(var(--lumo-space-xl) / 2) var(--lumo-space-xl);

    /* Tall */
    --lumo-space-tall-xs: var(--lumo-space-xs) calc(var(--lumo-space-xs) / 2);
    --lumo-space-tall-s: var(--lumo-space-s) calc(var(--lumo-space-s) / 2);
    --lumo-space-tall-m: var(--lumo-space-m) calc(var(--lumo-space-m) / 2);
    --lumo-space-tall-l: var(--lumo-space-l) calc(var(--lumo-space-l) / 2);
    --lumo-space-tall-xl: var(--lumo-space-xl) calc(var(--lumo-space-xl) / 2);
  }
`;

addLumoGlobalStyles('spacing-props', spacing);

registerStyles(
  'vaadin-form-layout',
  i$2`
    :host {
      --vaadin-form-layout-column-spacing: var(--lumo-space-l);
    }
  `,
  { moduleId: 'lumo-form-layout' },
);

/**
@license
Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

/* eslint-disable no-unused-vars */
/**
 * When using Closure Compiler, JSCompiler_renameProperty(property, object) is replaced by the munged name for object[property]
 * We cannot alias this function, so we have to use a small shim that has the same behavior when not compiling.
 *
 * @param {?} prop Property name
 * @param {*} obj Reference object
 * @return {string} Potentially renamed property name
 */
window.JSCompiler_renameProperty = function(prop, obj) {
  return prop;
};

/**
@license
Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

let CSS_URL_RX = /(url\()([^)]*)(\))/g;
let ABS_URL = /(^\/[^\/])|(^#)|(^[\w-\d]*:)/;
let workingURL;
let resolveDoc;
/**
 * Resolves the given URL against the provided `baseUri'.
 *
 * Note that this function performs no resolution for URLs that start
 * with `/` (absolute URLs) or `#` (hash identifiers).  For general purpose
 * URL resolution, use `window.URL`.
 *
 * @param {string} url Input URL to resolve
 * @param {?string=} baseURI Base URI to resolve the URL against
 * @return {string} resolved URL
 */
function resolveUrl(url, baseURI) {
  if (url && ABS_URL.test(url)) {
    return url;
  }
  if (url === '//') {
    return url;
  }
  // Lazy feature detection.
  if (workingURL === undefined) {
    workingURL = false;
    try {
      const u = new URL('b', 'http://a');
      u.pathname = 'c%20d';
      workingURL = (u.href === 'http://a/c%20d');
    } catch (e) {
      // silently fail
    }
  }
  if (!baseURI) {
    baseURI = document.baseURI || window.location.href;
  }
  if (workingURL) {
    try {
      return (new URL(url, baseURI)).href;
    } catch (e) {
      // Bad url or baseURI structure. Do not attempt to resolve.
      return url;
    }
  }
  // Fallback to creating an anchor into a disconnected document.
  if (!resolveDoc) {
    resolveDoc = document.implementation.createHTMLDocument('temp');
    resolveDoc.base = resolveDoc.createElement('base');
    resolveDoc.head.appendChild(resolveDoc.base);
    resolveDoc.anchor = resolveDoc.createElement('a');
    resolveDoc.body.appendChild(resolveDoc.anchor);
  }
  resolveDoc.base.href = baseURI;
  resolveDoc.anchor.href = url;
  return resolveDoc.anchor.href || url;

}

/**
 * Resolves any relative URL's in the given CSS text against the provided
 * `ownerDocument`'s `baseURI`.
 *
 * @param {string} cssText CSS text to process
 * @param {string} baseURI Base URI to resolve the URL against
 * @return {string} Processed CSS text with resolved URL's
 */
function resolveCss(cssText, baseURI) {
  return cssText.replace(CSS_URL_RX, function(m, pre, url, post) {
    return pre + '\'' +
      resolveUrl(url.replace(/["']/g, ''), baseURI) +
      '\'' + post;
  });
}

/**
 * Returns a path from a given `url`. The path includes the trailing
 * `/` from the url.
 *
 * @param {string} url Input URL to transform
 * @return {string} resolved path
 */
function pathFromUrl(url) {
  return url.substring(0, url.lastIndexOf('/') + 1);
}

/**
@license
Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/
const useShadow = !(window.ShadyDOM) || !(window.ShadyDOM.inUse);
Boolean(!window.ShadyCSS || window.ShadyCSS.nativeCss);
const supportsAdoptingStyleSheets = useShadow &&
    ('adoptedStyleSheets' in Document.prototype) &&
    ('replaceSync' in CSSStyleSheet.prototype) &&
    // Since spec may change, feature detect exact API we need
    (() => {
      try {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync('');
        const host = document.createElement('div');
        host.attachShadow({mode: 'open'});
        host.shadowRoot.adoptedStyleSheets = [sheet];
        return (host.shadowRoot.adoptedStyleSheets[0] === sheet);
      } catch(e) {
        return false;
      }
    })();

/**
 * Globally settable property that is automatically assigned to
 * `ElementMixin` instances, useful for binding in templates to
 * make URL's relative to an application's root.  Defaults to the main
 * document URL, but can be overridden by users.  It may be useful to set
 * `rootPath` to provide a stable application mount path when
 * using client side routing.
 */
let rootPath = window.Polymer && window.Polymer.rootPath ||
  pathFromUrl(document.baseURI || window.location.href);

/**
 * A global callback used to sanitize any value before inserting it into the DOM.
 * The callback signature is:
 *
 *  function sanitizeDOMValue(value, name, type, node) { ... }
 *
 * Where:
 *
 * `value` is the value to sanitize.
 * `name` is the name of an attribute or property (for example, href).
 * `type` indicates where the value is being inserted: one of property, attribute, or text.
 * `node` is the node where the value is being inserted.
 *
 * @type {(function(*,string,string,?Node):*)|undefined}
 */
let sanitizeDOMValue =
  window.Polymer && window.Polymer.sanitizeDOMValue || undefined;

/**
 * Globally settable property to make Polymer Gestures use passive TouchEvent listeners when recognizing gestures.
 * When set to `true`, gestures made from touch will not be able to prevent scrolling, allowing for smoother
 * scrolling performance.
 * Defaults to `false` for backwards compatibility.
 */
window.Polymer && window.Polymer.setPassiveTouchGestures || false;

/**
 * Setting to ensure Polymer template evaluation only occurs based on tempates
 * defined in trusted script.  When true, `<dom-module>` re-registration is
 * disallowed, `<dom-bind>` is disabled, and `<dom-if>`/`<dom-repeat>`
 * templates will only evaluate in the context of a trusted element template.
 */
let strictTemplatePolicy =
  window.Polymer && window.Polymer.strictTemplatePolicy || false;

/**
 * Setting to enable dom-module lookup from Polymer.Element.  By default,
 * templates must be defined in script using the `static get template()`
 * getter and the `html` tag function.  To enable legacy loading of templates
 * via dom-module, set this flag to true.
 */
let allowTemplateFromDomModule =
  window.Polymer && window.Polymer.allowTemplateFromDomModule || false;

/**
 * Setting to skip processing style includes and re-writing urls in css styles.
 * Normally "included" styles are pulled into the element and all urls in styles
 * are re-written to be relative to the containing script url.
 * If no includes or relative urls are used in styles, these steps can be
 * skipped as an optimization.
 */
let legacyOptimizations =
  window.Polymer && window.Polymer.legacyOptimizations || false;

/**
 * Setting to add warnings useful when migrating from Polymer 1.x to 2.x.
 */
let legacyWarnings =
  window.Polymer && window.Polymer.legacyWarnings || false;

/**
 * Setting to perform initial rendering synchronously when running under ShadyDOM.
 * This matches the behavior of Polymer 1.
 */
let syncInitialRender =
  window.Polymer && window.Polymer.syncInitialRender || false;

/**
 * Setting to retain the legacy Polymer 1 behavior for multi-property
 * observers around undefined values. Observers and computed property methods
 * are not called until no argument is undefined.
 */
let legacyUndefined =
  window.Polymer && window.Polymer.legacyUndefined || false;

/**
 * Setting to ensure computed properties are computed in order to ensure
 * re-computation never occurs in a given turn.
 */
let orderedComputed =
  window.Polymer && window.Polymer.orderedComputed || false;

/**
 * Setting to remove nested templates inside `dom-if` and `dom-repeat` as
 * part of element template parsing.  This is a performance optimization that
 * eliminates most of the tax of needing two elements due to the loss of
 * type-extended templates as a result of the V1 specification changes.
 */
let removeNestedTemplates =
  window.Polymer && window.Polymer.removeNestedTemplates || false;

/**
 * Setting to place `dom-if` elements in a performance-optimized mode that takes
 * advantage of lighter-weight host runtime template stamping to eliminate the
 * need for an intermediate Templatizer `TemplateInstance` to mange the nodes
 * stamped by `dom-if`.  Under this setting, any Templatizer-provided API's
 * such as `modelForElement` will not be available for nodes stamped by
 * `dom-if`.
 */
let fastDomIf = window.Polymer && window.Polymer.fastDomIf || false;

/**
 * Setting to disable `dom-change` and `rendered-item-count` events from
 * `dom-if` and `dom-repeat`. Users can opt back into `dom-change` events by
 * setting the `notify-dom-change` attribute (`notifyDomChange: true` property)
 * to `dom-if`/`don-repeat` instances.
 */
window.Polymer && window.Polymer.suppressTemplateNotifications || false;

/**
 * Setting to disable use of dynamic attributes. This is an optimization
 * to avoid setting `observedAttributes`. Instead attributes are read
 * once at create time and set/removeAttribute are patched.
 */
window.Polymer && window.Polymer.legacyNoObservedAttributes || false;

/**
 * Setting to enable use of `adoptedStyleSheets` for sharing style sheets
 * between component instances' shadow roots, if the app uses built Shady CSS
 * styles.
 */
let useAdoptedStyleSheetsWithBuiltCSS =
  window.Polymer && window.Polymer.useAdoptedStyleSheetsWithBuiltCSS || false;

/**
@license
Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

// unique global id for deduping mixins.
let dedupeId$1 = 0;

/* eslint-disable valid-jsdoc */
/**
 * Wraps an ES6 class expression mixin such that the mixin is only applied
 * if it has not already been applied its base argument. Also memoizes mixin
 * applications.
 *
 * @template T
 * @param {T} mixin ES6 class expression mixin to wrap
 * @return {T}
 * @suppress {invalidCasts}
 */
const dedupingMixin = function(mixin) {
  let mixinApplications = /** @type {!MixinFunction} */(mixin).__mixinApplications;
  if (!mixinApplications) {
    mixinApplications = new WeakMap();
    /** @type {!MixinFunction} */(mixin).__mixinApplications = mixinApplications;
  }
  // maintain a unique id for each mixin
  let mixinDedupeId = dedupeId$1++;
  function dedupingMixin(base) {
    let baseSet = /** @type {!MixinFunction} */(base).__mixinSet;
    if (baseSet && baseSet[mixinDedupeId]) {
      return base;
    }
    let map = mixinApplications;
    let extended = map.get(base);
    if (!extended) {
      extended = /** @type {!Function} */(mixin)(base);
      map.set(base, extended);
      // copy inherited mixin set from the extended class, or the base class
      // NOTE: we avoid use of Set here because some browser (IE11)
      // cannot extend a base Set via the constructor.
      let mixinSet = Object.create(/** @type {!MixinFunction} */(extended).__mixinSet || baseSet || null);
      mixinSet[mixinDedupeId] = true;
      /** @type {!MixinFunction} */(extended).__mixinSet = mixinSet;
    }
    return extended;
  }

  return dedupingMixin;
};
/* eslint-enable valid-jsdoc */

/**
@license
Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

let modules = {};
let lcModules = {};
/**
 * Sets a dom-module into the global registry by id.
 *
 * @param {string} id dom-module id
 * @param {DomModule} module dom-module instance
 * @return {void}
 */
function setModule(id, module) {
  // store id separate from lowercased id so that
  // in all cases mixedCase id will stored distinctly
  // and lowercase version is a fallback
  modules[id] = lcModules[id.toLowerCase()] = module;
}
/**
 * Retrieves a dom-module from the global registry by id.
 *
 * @param {string} id dom-module id
 * @return {DomModule!} dom-module instance
 */
function findModule(id) {
  return modules[id] || lcModules[id.toLowerCase()];
}

function styleOutsideTemplateCheck(inst) {
  if (inst.querySelector('style')) {
    console.warn('dom-module %s has style outside template', inst.id);
  }
}

/**
 * The `dom-module` element registers the dom it contains to the name given
 * by the module's id attribute. It provides a unified database of dom
 * accessible via its static `import` API.
 *
 * A key use case of `dom-module` is for providing custom element `<template>`s
 * via HTML imports that are parsed by the native HTML parser, that can be
 * relocated during a bundling pass and still looked up by `id`.
 *
 * Example:
 *
 *     <dom-module id="foo">
 *       <img src="stuff.png">
 *     </dom-module>
 *
 * Then in code in some other location that cannot access the dom-module above
 *
 *     let img = customElements.get('dom-module').import('foo', 'img');
 *
 * @customElement
 * @extends HTMLElement
 * @summary Custom element that provides a registry of relocatable DOM content
 *   by `id` that is agnostic to bundling.
 * @unrestricted
 */
class DomModule extends HTMLElement {

  /** @override */
  static get observedAttributes() { return ['id']; }

  /**
   * Retrieves the element specified by the css `selector` in the module
   * registered by `id`. For example, this.import('foo', 'img');
   * @param {string} id The id of the dom-module in which to search.
   * @param {string=} selector The css selector by which to find the element.
   * @return {Element} Returns the element which matches `selector` in the
   * module registered at the specified `id`.
   *
   * @export
   * @nocollapse Referred to indirectly in style-gather.js
   */
  static import(id, selector) {
    if (id) {
      let m = findModule(id);
      if (m && selector) {
        return m.querySelector(selector);
      }
      return m;
    }
    return null;
  }

  /* eslint-disable no-unused-vars */
  /**
   * @param {string} name Name of attribute.
   * @param {?string} old Old value of attribute.
   * @param {?string} value Current value of attribute.
   * @param {?string} namespace Attribute namespace.
   * @return {void}
   * @override
   */
  attributeChangedCallback(name, old, value, namespace) {
    if (old !== value) {
      this.register();
    }
  }
  /* eslint-enable no-unused-args */

  /**
   * The absolute URL of the original location of this `dom-module`.
   *
   * This value will differ from this element's `ownerDocument` in the
   * following ways:
   * - Takes into account any `assetpath` attribute added during bundling
   *   to indicate the original location relative to the bundled location
   * - Uses the HTMLImports polyfill's `importForElement` API to ensure
   *   the path is relative to the import document's location since
   *   `ownerDocument` is not currently polyfilled
   */
  get assetpath() {
    // Don't override existing assetpath.
    if (!this.__assetpath) {
      // note: assetpath set via an attribute must be relative to this
      // element's location; accommodate polyfilled HTMLImports
      const owner = window.HTMLImports && HTMLImports.importForElement ?
        HTMLImports.importForElement(this) || document : this.ownerDocument;
      const url = resolveUrl(
        this.getAttribute('assetpath') || '', owner.baseURI);
      this.__assetpath = pathFromUrl(url);
    }
    return this.__assetpath;
  }

  /**
   * Registers the dom-module at a given id. This method should only be called
   * when a dom-module is imperatively created. For
   * example, `document.createElement('dom-module').register('foo')`.
   * @param {string=} id The id at which to register the dom-module.
   * @return {void}
   */
  register(id) {
    id = id || this.id;
    if (id) {
      // Under strictTemplatePolicy, reject and null out any re-registered
      // dom-module since it is ambiguous whether first-in or last-in is trusted
      if (strictTemplatePolicy && findModule(id) !== undefined) {
        setModule(id, null);
        throw new Error(`strictTemplatePolicy: dom-module ${id} re-registered`);
      }
      this.id = id;
      setModule(id, this);
      styleOutsideTemplateCheck(this);
    }
  }
}

DomModule.prototype['modules'] = modules;

customElements.define('dom-module', DomModule);

/**
@license
Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/


const MODULE_STYLE_LINK_SELECTOR = 'link[rel=import][type~=css]';
const INCLUDE_ATTR = 'include';
const SHADY_UNSCOPED_ATTR = 'shady-unscoped';

/**
 * @param {string} moduleId .
 * @return {?DomModule} .
 */
function importModule(moduleId) {
  return /** @type {?DomModule} */(DomModule.import(moduleId));
}

function styleForImport(importDoc) {
  // NOTE: polyfill affordance.
  // under the HTMLImports polyfill, there will be no 'body',
  // but the import pseudo-doc can be used directly.
  let container = importDoc.body ? importDoc.body : importDoc;
  const importCss = resolveCss(container.textContent,
    importDoc.baseURI);
  const style = document.createElement('style');
  style.textContent = importCss;
  return style;
}


/**
 * Returns a list of <style> elements in a space-separated list of `dom-module`s.
 *
 * @function
 * @param {string} moduleIds List of dom-module id's within which to
 * search for css.
 * @return {!Array<!HTMLStyleElement>} Array of contained <style> elements
 */
function stylesFromModules(moduleIds) {
 const modules = moduleIds.trim().split(/\s+/);
 const styles = [];
 for (let i=0; i < modules.length; i++) {
   styles.push(...stylesFromModule(modules[i]));
 }
 return styles;
}

/**
 * Returns a list of <style> elements in a given `dom-module`.
 * Styles in a `dom-module` can come either from `<style>`s within the
 * first `<template>`, or else from one or more
 * `<link rel="import" type="css">` links outside the template.
 *
 * @param {string} moduleId dom-module id to gather styles from
 * @return {!Array<!HTMLStyleElement>} Array of contained styles.
 */
function stylesFromModule(moduleId) {
  const m = importModule(moduleId);

  if (!m) {
    console.warn('Could not find style data in module named', moduleId);
    return [];
  }

  if (m._styles === undefined) {
    const styles = [];
    // module imports: <link rel="import" type="css">
    styles.push(..._stylesFromModuleImports(m));
    // include css from the first template in the module
    const template = /** @type {?HTMLTemplateElement} */(
        m.querySelector('template'));
    if (template) {
      styles.push(...stylesFromTemplate(template,
        /** @type {templateWithAssetPath} */(m).assetpath));
    }

    m._styles = styles;
  }

  return m._styles;
}

/**
 * Returns the `<style>` elements within a given template.
 *
 * @param {!HTMLTemplateElement} template Template to gather styles from
 * @param {string=} baseURI baseURI for style content
 * @return {!Array<!HTMLStyleElement>} Array of styles
 */
function stylesFromTemplate(template, baseURI) {
  if (!template._styles) {
    const styles = [];
    // if element is a template, get content from its .content
    const e$ = template.content.querySelectorAll('style');
    for (let i=0; i < e$.length; i++) {
      let e = e$[i];
      // support style sharing by allowing styles to "include"
      // other dom-modules that contain styling
      let include = e.getAttribute(INCLUDE_ATTR);
      if (include) {
        styles.push(...stylesFromModules(include).filter(function(item, index, self) {
          return self.indexOf(item) === index;
        }));
      }
      if (baseURI) {
        e.textContent =
            resolveCss(e.textContent, /** @type {string} */ (baseURI));
      }
      styles.push(e);
    }
    template._styles = styles;
  }
  return template._styles;
}

/**
 * Returns a list of <style> elements  from stylesheets loaded via `<link rel="import" type="css">` links within the specified `dom-module`.
 *
 * @param {string} moduleId Id of `dom-module` to gather CSS from
 * @return {!Array<!HTMLStyleElement>} Array of contained styles.
 */
function stylesFromModuleImports(moduleId) {
 let m = importModule(moduleId);
 return m ? _stylesFromModuleImports(m) : [];
}

/**
 * @param {!HTMLElement} module dom-module element that could contain `<link rel="import" type="css">` styles
 * @return {!Array<!HTMLStyleElement>} Array of contained styles
 */
function _stylesFromModuleImports(module) {
  const styles = [];
  const p$ = module.querySelectorAll(MODULE_STYLE_LINK_SELECTOR);
  for (let i=0; i < p$.length; i++) {
    let p = p$[i];
    if (p.import) {
      const importDoc = p.import;
      const unscoped = p.hasAttribute(SHADY_UNSCOPED_ATTR);
      if (unscoped && !importDoc._unscopedStyle) {
        const style = styleForImport(importDoc);
        style.setAttribute(SHADY_UNSCOPED_ATTR, '');
        importDoc._unscopedStyle = style;
      } else if (!importDoc._style) {
        importDoc._style = styleForImport(importDoc);
      }
      styles.push(unscoped ? importDoc._unscopedStyle : importDoc._style);
    }
  }
  return styles;
}

/**
@license
Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

/* eslint-disable valid-jsdoc */
/**
 * Node wrapper to ensure ShadowDOM safe operation regardless of polyfill
 * presence or mode. Note that with the introduction of `ShadyDOM.noPatch`,
 * a node wrapper must be used to access ShadowDOM API.
 * This is similar to using `Polymer.dom` but relies exclusively
 * on the presence of the ShadyDOM polyfill rather than requiring the loading
 * of legacy (Polymer.dom) API.
 * @type {function(Node):Node}
 */
const wrap = (window['ShadyDOM'] && window['ShadyDOM']['noPatch'] && window['ShadyDOM']['wrap']) ?
  window['ShadyDOM']['wrap'] :
  (window['ShadyDOM'] ? (n) => ShadyDOM['patch'](n) : (n) => n);

/**
@license
Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

/**
 * Module with utilities for manipulating structured data path strings.
 *
 * @summary Module with utilities for manipulating structured data path strings.
 */

/**
 * Returns true if the given string is a structured data path (has dots).
 *
 * Example:
 *
 * ```
 * isPath('foo.bar.baz') // true
 * isPath('foo')         // false
 * ```
 *
 * @param {string} path Path string
 * @return {boolean} True if the string contained one or more dots
 */
function isPath(path) {
  return path.indexOf('.') >= 0;
}

/**
 * Returns the root property name for the given path.
 *
 * Example:
 *
 * ```
 * root('foo.bar.baz') // 'foo'
 * root('foo')         // 'foo'
 * ```
 *
 * @param {string} path Path string
 * @return {string} Root property name
 */
function root(path) {
  let dotIndex = path.indexOf('.');
  if (dotIndex === -1) {
    return path;
  }
  return path.slice(0, dotIndex);
}

/**
 * Given `base` is `foo.bar`, `foo` is an ancestor, `foo.bar` is not
 * Returns true if the given path is an ancestor of the base path.
 *
 * Example:
 *
 * ```
 * isAncestor('foo.bar', 'foo')         // true
 * isAncestor('foo.bar', 'foo.bar')     // false
 * isAncestor('foo.bar', 'foo.bar.baz') // false
 * ```
 *
 * @param {string} base Path string to test against.
 * @param {string} path Path string to test.
 * @return {boolean} True if `path` is an ancestor of `base`.
 */
function isAncestor(base, path) {
  //     base.startsWith(path + '.');
  return base.indexOf(path + '.') === 0;
}

/**
 * Given `base` is `foo.bar`, `foo.bar.baz` is an descendant
 *
 * Example:
 *
 * ```
 * isDescendant('foo.bar', 'foo.bar.baz') // true
 * isDescendant('foo.bar', 'foo.bar')     // false
 * isDescendant('foo.bar', 'foo')         // false
 * ```
 *
 * @param {string} base Path string to test against.
 * @param {string} path Path string to test.
 * @return {boolean} True if `path` is a descendant of `base`.
 */
function isDescendant(base, path) {
  //     path.startsWith(base + '.');
  return path.indexOf(base + '.') === 0;
}

/**
 * Replaces a previous base path with a new base path, preserving the
 * remainder of the path.
 *
 * User must ensure `path` has a prefix of `base`.
 *
 * Example:
 *
 * ```
 * translate('foo.bar', 'zot', 'foo.bar.baz') // 'zot.baz'
 * ```
 *
 * @param {string} base Current base string to remove
 * @param {string} newBase New base string to replace with
 * @param {string} path Path to translate
 * @return {string} Translated string
 */
function translate(base, newBase, path) {
  return newBase + path.slice(base.length);
}

/**
 * Converts array-based paths to flattened path.  String-based paths
 * are returned as-is.
 *
 * Example:
 *
 * ```
 * normalize(['foo.bar', 0, 'baz'])  // 'foo.bar.0.baz'
 * normalize('foo.bar.0.baz')        // 'foo.bar.0.baz'
 * ```
 *
 * @param {string | !Array<string|number>} path Input path
 * @return {string} Flattened path
 */
function normalize(path) {
  if (Array.isArray(path)) {
    let parts = [];
    for (let i=0; i<path.length; i++) {
      let args = path[i].toString().split('.');
      for (let j=0; j<args.length; j++) {
        parts.push(args[j]);
      }
    }
    return parts.join('.');
  } else {
    return path;
  }
}

/**
 * Splits a path into an array of property names. Accepts either arrays
 * of path parts or strings.
 *
 * Example:
 *
 * ```
 * split(['foo.bar', 0, 'baz'])  // ['foo', 'bar', '0', 'baz']
 * split('foo.bar.0.baz')        // ['foo', 'bar', '0', 'baz']
 * ```
 *
 * @param {string | !Array<string|number>} path Input path
 * @return {!Array<string>} Array of path parts
 * @suppress {checkTypes}
 */
function split(path) {
  if (Array.isArray(path)) {
    return normalize(path).split('.');
  }
  return path.toString().split('.');
}

/**
 * Reads a value from a path.  If any sub-property in the path is `undefined`,
 * this method returns `undefined` (will never throw.
 *
 * @param {Object} root Object from which to dereference path from
 * @param {string | !Array<string|number>} path Path to read
 * @param {Object=} info If an object is provided to `info`, the normalized
 *  (flattened) path will be set to `info.path`.
 * @return {*} Value at path, or `undefined` if the path could not be
 *  fully dereferenced.
 */
function get(root, path, info) {
  let prop = root;
  let parts = split(path);
  // Loop over path parts[0..n-1] and dereference
  for (let i=0; i<parts.length; i++) {
    if (!prop) {
      return;
    }
    let part = parts[i];
    prop = prop[part];
  }
  if (info) {
    info.path = parts.join('.');
  }
  return prop;
}

/**
 * Sets a value to a path.  If any sub-property in the path is `undefined`,
 * this method will no-op.
 *
 * @param {Object} root Object from which to dereference path from
 * @param {string | !Array<string|number>} path Path to set
 * @param {*} value Value to set to path
 * @return {string | undefined} The normalized version of the input path
 */
function set(root, path, value) {
  let prop = root;
  let parts = split(path);
  let last = parts[parts.length-1];
  if (parts.length > 1) {
    // Loop over path parts[0..n-2] and dereference
    for (let i=0; i<parts.length-1; i++) {
      let part = parts[i];
      prop = prop[part];
      if (!prop) {
        return;
      }
    }
    // Set value to object at end of path
    prop[last] = value;
  } else {
    // Simple property set
    prop[path] = value;
  }
  return parts.join('.');
}

/**
@license
Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

const caseMap = {};
const DASH_TO_CAMEL = /-[a-z]/g;
const CAMEL_TO_DASH = /([A-Z])/g;

/**
 * @fileoverview Module with utilities for converting between "dash-case" and
 * "camelCase" identifiers.
 */

/**
 * Converts "dash-case" identifier (e.g. `foo-bar-baz`) to "camelCase"
 * (e.g. `fooBarBaz`).
 *
 * @param {string} dash Dash-case identifier
 * @return {string} Camel-case representation of the identifier
 */
function dashToCamelCase(dash) {
  return caseMap[dash] || (
    caseMap[dash] = dash.indexOf('-') < 0 ? dash : dash.replace(DASH_TO_CAMEL,
      (m) => m[1].toUpperCase()
    )
  );
}

/**
 * Converts "camelCase" identifier (e.g. `fooBarBaz`) to "dash-case"
 * (e.g. `foo-bar-baz`).
 *
 * @param {string} camel Camel-case identifier
 * @return {string} Dash-case representation of the identifier
 */
function camelToDashCase(camel) {
  return caseMap[camel] || (
    caseMap[camel] = camel.replace(CAMEL_TO_DASH, '-$1').toLowerCase()
  );
}

/**
@license
Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/


// Microtask implemented using Mutation Observer
let microtaskCurrHandle = 0;
let microtaskLastHandle = 0;
let microtaskCallbacks = [];
let microtaskNodeContent = 0;
let microtaskScheduled = false;
let microtaskNode = document.createTextNode('');
new window.MutationObserver(microtaskFlush).observe(microtaskNode, {characterData: true});

function microtaskFlush() {
  microtaskScheduled = false;
  const len = microtaskCallbacks.length;
  for (let i = 0; i < len; i++) {
    let cb = microtaskCallbacks[i];
    if (cb) {
      try {
        cb();
      } catch (e) {
        setTimeout(() => { throw e; });
      }
    }
  }
  microtaskCallbacks.splice(0, len);
  microtaskLastHandle += len;
}

/**
 * Async interface for enqueuing callbacks that run at microtask timing.
 *
 * Note that microtask timing is achieved via a single `MutationObserver`,
 * and thus callbacks enqueued with this API will all run in a single
 * batch, and not interleaved with other microtasks such as promises.
 * Promises are avoided as an implementation choice for the time being
 * due to Safari bugs that cause Promises to lack microtask guarantees.
 *
 * @namespace
 * @summary Async interface for enqueuing callbacks that run at microtask
 *   timing.
 */
const microTask = {

  /**
   * Enqueues a function called at microtask timing.
   *
   * @memberof microTask
   * @param {!Function=} callback Callback to run
   * @return {number} Handle used for canceling task
   */
  run(callback) {
    if (!microtaskScheduled) {
      microtaskScheduled = true;
      microtaskNode.textContent = microtaskNodeContent++;
    }
    microtaskCallbacks.push(callback);
    return microtaskCurrHandle++;
  },

  /**
   * Cancels a previously enqueued `microTask` callback.
   *
   * @memberof microTask
   * @param {number} handle Handle returned from `run` of callback to cancel
   * @return {void}
   */
  cancel(handle) {
    const idx = handle - microtaskLastHandle;
    if (idx >= 0) {
      if (!microtaskCallbacks[idx]) {
        throw new Error('invalid async handle: ' + handle);
      }
      microtaskCallbacks[idx] = null;
    }
  }

};

/**
@license
Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

/** @const {!AsyncInterface} */
const microtask = microTask;

/**
 * Element class mixin that provides basic meta-programming for creating one
 * or more property accessors (getter/setter pair) that enqueue an async
 * (batched) `_propertiesChanged` callback.
 *
 * For basic usage of this mixin, call `MyClass.createProperties(props)`
 * once at class definition time to create property accessors for properties
 * named in props, implement `_propertiesChanged` to react as desired to
 * property changes, and implement `static get observedAttributes()` and
 * include lowercase versions of any property names that should be set from
 * attributes. Last, call `this._enableProperties()` in the element's
 * `connectedCallback` to enable the accessors.
 *
 * @mixinFunction
 * @polymer
 * @summary Element class mixin for reacting to property changes from
 *   generated property accessors.
 * @template T
 * @param {function(new:T)} superClass Class to apply mixin to.
 * @return {function(new:T)} superClass with mixin applied.
 */
const PropertiesChanged = dedupingMixin(
    /**
     * @template T
     * @param {function(new:T)} superClass Class to apply mixin to.
     * @return {function(new:T)} superClass with mixin applied.
     */
    (superClass) => {

  /**
   * @polymer
   * @mixinClass
   * @implements {Polymer_PropertiesChanged}
   * @unrestricted
   */
  class PropertiesChanged extends superClass {

    /**
     * Creates property accessors for the given property names.
     * @param {!Object} props Object whose keys are names of accessors.
     * @return {void}
     * @protected
     * @nocollapse
     */
    static createProperties(props) {
      const proto = this.prototype;
      for (let prop in props) {
        // don't stomp an existing accessor
        if (!(prop in proto)) {
          proto._createPropertyAccessor(prop);
        }
      }
    }

    /**
     * Returns an attribute name that corresponds to the given property.
     * The attribute name is the lowercased property name. Override to
     * customize this mapping.
     * @param {string} property Property to convert
     * @return {string} Attribute name corresponding to the given property.
     *
     * @protected
     * @nocollapse
     */
    static attributeNameForProperty(property) {
      return property.toLowerCase();
    }

    /**
     * Override point to provide a type to which to deserialize a value to
     * a given property.
     * @param {string} name Name of property
     *
     * @protected
     * @nocollapse
     */
    static typeForProperty(name) { } //eslint-disable-line no-unused-vars

    /**
     * Creates a setter/getter pair for the named property with its own
     * local storage.  The getter returns the value in the local storage,
     * and the setter calls `_setProperty`, which updates the local storage
     * for the property and enqueues a `_propertiesChanged` callback.
     *
     * This method may be called on a prototype or an instance.  Calling
     * this method may overwrite a property value that already exists on
     * the prototype/instance by creating the accessor.
     *
     * @param {string} property Name of the property
     * @param {boolean=} readOnly When true, no setter is created; the
     *   protected `_setProperty` function must be used to set the property
     * @return {void}
     * @protected
     * @override
     */
    _createPropertyAccessor(property, readOnly) {
      this._addPropertyToAttributeMap(property);
      if (!this.hasOwnProperty(JSCompiler_renameProperty('__dataHasAccessor', this))) {
        this.__dataHasAccessor = Object.assign({}, this.__dataHasAccessor);
      }
      if (!this.__dataHasAccessor[property]) {
        this.__dataHasAccessor[property] = true;
        this._definePropertyAccessor(property, readOnly);
      }
    }

    /**
     * Adds the given `property` to a map matching attribute names
     * to property names, using `attributeNameForProperty`. This map is
     * used when deserializing attribute values to properties.
     *
     * @param {string} property Name of the property
     * @override
     */
    _addPropertyToAttributeMap(property) {
      if (!this.hasOwnProperty(JSCompiler_renameProperty('__dataAttributes', this))) {
        this.__dataAttributes = Object.assign({}, this.__dataAttributes);
      }
      // This check is technically not correct; it's an optimization that
      // assumes that if a _property_ name is already in the map (note this is
      // an attr->property map), the property mapped directly to the attribute
      // and it has already been mapped.  This would fail if
      // `attributeNameForProperty` were overridden such that this was not the
      // case.
      let attr = this.__dataAttributes[property];
      if (!attr) {
        attr = this.constructor.attributeNameForProperty(property);
        this.__dataAttributes[attr] = property;
      }
      return attr;
    }

    /**
     * Defines a property accessor for the given property.
     * @param {string} property Name of the property
     * @param {boolean=} readOnly When true, no setter is created
     * @return {void}
     * @override
     */
     _definePropertyAccessor(property, readOnly) {
      Object.defineProperty(this, property, {
        /* eslint-disable valid-jsdoc */
        /** @this {PropertiesChanged} */
        get() {
          // Inline for perf instead of using `_getProperty`
          return this.__data[property];
        },
        /** @this {PropertiesChanged} */
        set: readOnly ? function () {} : function (value) {
          // Inline for perf instead of using `_setProperty`
          if (this._setPendingProperty(property, value, true)) {
            this._invalidateProperties();
          }
        }
        /* eslint-enable */
      });
    }

    constructor() {
      super();
      /** @type {boolean} */
      this.__dataEnabled = false;
      this.__dataReady = false;
      this.__dataInvalid = false;
      this.__data = {};
      this.__dataPending = null;
      this.__dataOld = null;
      this.__dataInstanceProps = null;
      /** @type {number} */
      // NOTE: used to track re-entrant calls to `_flushProperties`
      this.__dataCounter = 0;
      this.__serializing = false;
      this._initializeProperties();
    }

    /**
     * Lifecycle callback called when properties are enabled via
     * `_enableProperties`.
     *
     * Users may override this function to implement behavior that is
     * dependent on the element having its property data initialized, e.g.
     * from defaults (initialized from `constructor`, `_initializeProperties`),
     * `attributeChangedCallback`, or values propagated from host e.g. via
     * bindings.  `super.ready()` must be called to ensure the data system
     * becomes enabled.
     *
     * @return {void}
     * @public
     * @override
     */
    ready() {
      this.__dataReady = true;
      this._flushProperties();
    }

    /**
     * Initializes the local storage for property accessors.
     *
     * Provided as an override point for performing any setup work prior
     * to initializing the property accessor system.
     *
     * @return {void}
     * @protected
     * @override
     */
    _initializeProperties() {
      // Capture instance properties; these will be set into accessors
      // during first flush. Don't set them here, since we want
      // these to overwrite defaults/constructor assignments
      for (let p in this.__dataHasAccessor) {
        if (this.hasOwnProperty(p)) {
          this.__dataInstanceProps = this.__dataInstanceProps || {};
          this.__dataInstanceProps[p] = this[p];
          delete this[p];
        }
      }
    }

    /**
     * Called at ready time with bag of instance properties that overwrote
     * accessors when the element upgraded.
     *
     * The default implementation sets these properties back into the
     * setter at ready time.  This method is provided as an override
     * point for customizing or providing more efficient initialization.
     *
     * @param {Object} props Bag of property values that were overwritten
     *   when creating property accessors.
     * @return {void}
     * @protected
     * @override
     */
    _initializeInstanceProperties(props) {
      Object.assign(this, props);
    }

    /**
     * Updates the local storage for a property (via `_setPendingProperty`)
     * and enqueues a `_proeprtiesChanged` callback.
     *
     * @param {string} property Name of the property
     * @param {*} value Value to set
     * @return {void}
     * @protected
     * @override
     */
    _setProperty(property, value) {
      if (this._setPendingProperty(property, value)) {
        this._invalidateProperties();
      }
    }

    /**
     * Returns the value for the given property.
     * @param {string} property Name of property
     * @return {*} Value for the given property
     * @protected
     * @override
     */
    _getProperty(property) {
      return this.__data[property];
    }

    /* eslint-disable no-unused-vars */
    /**
     * Updates the local storage for a property, records the previous value,
     * and adds it to the set of "pending changes" that will be passed to the
     * `_propertiesChanged` callback.  This method does not enqueue the
     * `_propertiesChanged` callback.
     *
     * @param {string} property Name of the property
     * @param {*} value Value to set
     * @param {boolean=} ext Not used here; affordance for closure
     * @return {boolean} Returns true if the property changed
     * @protected
     * @override
     */
    _setPendingProperty(property, value, ext) {
      let old = this.__data[property];
      let changed = this._shouldPropertyChange(property, value, old);
      if (changed) {
        if (!this.__dataPending) {
          this.__dataPending = {};
          this.__dataOld = {};
        }
        // Ensure old is captured from the last turn
        if (this.__dataOld && !(property in this.__dataOld)) {
          this.__dataOld[property] = old;
        }
        this.__data[property] = value;
        this.__dataPending[property] = value;
      }
      return changed;
    }
    /* eslint-enable */

    /**
     * @param {string} property Name of the property
     * @return {boolean} Returns true if the property is pending.
     */
    _isPropertyPending(property) {
      return !!(this.__dataPending && this.__dataPending.hasOwnProperty(property));
    }

    /**
     * Marks the properties as invalid, and enqueues an async
     * `_propertiesChanged` callback.
     *
     * @return {void}
     * @protected
     * @override
     */
    _invalidateProperties() {
      if (!this.__dataInvalid && this.__dataReady) {
        this.__dataInvalid = true;
        microtask.run(() => {
          if (this.__dataInvalid) {
            this.__dataInvalid = false;
            this._flushProperties();
          }
        });
      }
    }

    /**
     * Call to enable property accessor processing. Before this method is
     * called accessor values will be set but side effects are
     * queued. When called, any pending side effects occur immediately.
     * For elements, generally `connectedCallback` is a normal spot to do so.
     * It is safe to call this method multiple times as it only turns on
     * property accessors once.
     *
     * @return {void}
     * @protected
     * @override
     */
    _enableProperties() {
      if (!this.__dataEnabled) {
        this.__dataEnabled = true;
        if (this.__dataInstanceProps) {
          this._initializeInstanceProperties(this.__dataInstanceProps);
          this.__dataInstanceProps = null;
        }
        this.ready();
      }
    }

    /**
     * Calls the `_propertiesChanged` callback with the current set of
     * pending changes (and old values recorded when pending changes were
     * set), and resets the pending set of changes. Generally, this method
     * should not be called in user code.
     *
     * @return {void}
     * @protected
     * @override
     */
    _flushProperties() {
      this.__dataCounter++;
      const props = this.__data;
      const changedProps = this.__dataPending;
      const old = this.__dataOld;
      if (this._shouldPropertiesChange(props, changedProps, old)) {
        this.__dataPending = null;
        this.__dataOld = null;
        this._propertiesChanged(props, changedProps, old);
      }
      this.__dataCounter--;
    }

    /**
     * Called in `_flushProperties` to determine if `_propertiesChanged`
     * should be called. The default implementation returns true if
     * properties are pending. Override to customize when
     * `_propertiesChanged` is called.
     * @param {!Object} currentProps Bag of all current accessor values
     * @param {?Object} changedProps Bag of properties changed since the last
     *   call to `_propertiesChanged`
     * @param {?Object} oldProps Bag of previous values for each property
     *   in `changedProps`
     * @return {boolean} true if changedProps is truthy
     * @override
     */
    _shouldPropertiesChange(currentProps, changedProps, oldProps) { // eslint-disable-line no-unused-vars
      return Boolean(changedProps);
    }

    /**
     * Callback called when any properties with accessors created via
     * `_createPropertyAccessor` have been set.
     *
     * @param {!Object} currentProps Bag of all current accessor values
     * @param {?Object} changedProps Bag of properties changed since the last
     *   call to `_propertiesChanged`
     * @param {?Object} oldProps Bag of previous values for each property
     *   in `changedProps`
     * @return {void}
     * @protected
     * @override
     */
    _propertiesChanged(currentProps, changedProps, oldProps) { // eslint-disable-line no-unused-vars
    }

    /**
     * Method called to determine whether a property value should be
     * considered as a change and cause the `_propertiesChanged` callback
     * to be enqueued.
     *
     * The default implementation returns `true` if a strict equality
     * check fails. The method always returns false for `NaN`.
     *
     * Override this method to e.g. provide stricter checking for
     * Objects/Arrays when using immutable patterns.
     *
     * @param {string} property Property name
     * @param {*} value New property value
     * @param {*} old Previous property value
     * @return {boolean} Whether the property should be considered a change
     *   and enqueue a `_proeprtiesChanged` callback
     * @protected
     * @override
     */
    _shouldPropertyChange(property, value, old) {
      return (
        // Strict equality check
        (old !== value &&
          // This ensures (old==NaN, value==NaN) always returns false
          (old === old || value === value))
      );
    }

    /**
     * Implements native Custom Elements `attributeChangedCallback` to
     * set an attribute value to a property via `_attributeToProperty`.
     *
     * @param {string} name Name of attribute that changed
     * @param {?string} old Old attribute value
     * @param {?string} value New attribute value
     * @param {?string} namespace Attribute namespace.
     * @return {void}
     * @suppress {missingProperties} Super may or may not implement the callback
     * @override
     */
    attributeChangedCallback(name, old, value, namespace) {
      if (old !== value) {
        this._attributeToProperty(name, value);
      }
      if (super.attributeChangedCallback) {
        super.attributeChangedCallback(name, old, value, namespace);
      }
    }

    /**
     * Deserializes an attribute to its associated property.
     *
     * This method calls the `_deserializeValue` method to convert the string to
     * a typed value.
     *
     * @param {string} attribute Name of attribute to deserialize.
     * @param {?string} value of the attribute.
     * @param {*=} type type to deserialize to, defaults to the value
     * returned from `typeForProperty`
     * @return {void}
     * @override
     */
    _attributeToProperty(attribute, value, type) {
      if (!this.__serializing) {
        const map = this.__dataAttributes;
        const property = map && map[attribute] || attribute;
        this[property] = this._deserializeValue(value, type ||
          this.constructor.typeForProperty(property));
      }
    }

    /**
     * Serializes a property to its associated attribute.
     *
     * @suppress {invalidCasts} Closure can't figure out `this` is an element.
     *
     * @param {string} property Property name to reflect.
     * @param {string=} attribute Attribute name to reflect to.
     * @param {*=} value Property value to refect.
     * @return {void}
     * @override
     */
    _propertyToAttribute(property, attribute, value) {
      this.__serializing = true;
      value = (arguments.length < 3) ? this[property] : value;
      this._valueToNodeAttribute(/** @type {!HTMLElement} */(this), value,
        attribute || this.constructor.attributeNameForProperty(property));
      this.__serializing = false;
    }

    /**
     * Sets a typed value to an HTML attribute on a node.
     *
     * This method calls the `_serializeValue` method to convert the typed
     * value to a string.  If the `_serializeValue` method returns `undefined`,
     * the attribute will be removed (this is the default for boolean
     * type `false`).
     *
     * @param {Element} node Element to set attribute to.
     * @param {*} value Value to serialize.
     * @param {string} attribute Attribute name to serialize to.
     * @return {void}
     * @override
     */
    _valueToNodeAttribute(node, value, attribute) {
      const str = this._serializeValue(value);
      if (attribute === 'class' || attribute === 'name' || attribute === 'slot') {
        node = /** @type {?Element} */(wrap(node));
      }
      if (str === undefined) {
        node.removeAttribute(attribute);
      } else {
        node.setAttribute(
            attribute,
            // Closure's type for `setAttribute`'s second parameter incorrectly
            // excludes `TrustedScript`.
            (str === '' && window.trustedTypes) ?
                /** @type {?} */ (window.trustedTypes.emptyScript) :
                str);
      }
    }

    /**
     * Converts a typed JavaScript value to a string.
     *
     * This method is called when setting JS property values to
     * HTML attributes.  Users may override this method to provide
     * serialization for custom types.
     *
     * @param {*} value Property value to serialize.
     * @return {string | undefined} String serialized from the provided
     * property  value.
     * @override
     */
    _serializeValue(value) {
      switch (typeof value) {
        case 'boolean':
          return value ? '' : undefined;
        default:
          return value != null ? value.toString() : undefined;
      }
    }

    /**
     * Converts a string to a typed JavaScript value.
     *
     * This method is called when reading HTML attribute values to
     * JS properties.  Users may override this method to provide
     * deserialization for custom `type`s. Types for `Boolean`, `String`,
     * and `Number` convert attributes to the expected types.
     *
     * @param {?string} value Value to deserialize.
     * @param {*=} type Type to deserialize the string to.
     * @return {*} Typed value deserialized from the provided string.
     * @override
     */
    _deserializeValue(value, type) {
      switch (type) {
        case Boolean:
          return (value !== null);
        case Number:
          return Number(value);
        default:
          return value;
      }
    }

  }

  return PropertiesChanged;
});

/**
@license
Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

// Save map of native properties; this forms a blacklist or properties
// that won't have their values "saved" by `saveAccessorValue`, since
// reading from an HTMLElement accessor from the context of a prototype throws
const nativeProperties = {};
let proto = HTMLElement.prototype;
while (proto) {
  let props = Object.getOwnPropertyNames(proto);
  for (let i=0; i<props.length; i++) {
    nativeProperties[props[i]] = true;
  }
  proto = Object.getPrototypeOf(proto);
}

const isTrustedType = (() => {
  if (!window.trustedTypes) {
    return () => false;
  }
  return (val) => trustedTypes.isHTML(val) ||
        trustedTypes.isScript(val) || trustedTypes.isScriptURL(val);
})();

/**
 * Used to save the value of a property that will be overridden with
 * an accessor. If the `model` is a prototype, the values will be saved
 * in `__dataProto`, and it's up to the user (or downstream mixin) to
 * decide how/when to set these values back into the accessors.
 * If `model` is already an instance (it has a `__data` property), then
 * the value will be set as a pending property, meaning the user should
 * call `_invalidateProperties` or `_flushProperties` to take effect
 *
 * @param {Object} model Prototype or instance
 * @param {string} property Name of property
 * @return {void}
 * @private
 */
function saveAccessorValue(model, property) {
  // Don't read/store value for any native properties since they could throw
  if (!nativeProperties[property]) {
    let value = model[property];
    if (value !== undefined) {
      if (model.__data) {
        // Adding accessor to instance; update the property
        // It is the user's responsibility to call _flushProperties
        model._setPendingProperty(property, value);
      } else {
        // Adding accessor to proto; save proto's value for instance-time use
        if (!model.__dataProto) {
          model.__dataProto = {};
        } else if (!model.hasOwnProperty(JSCompiler_renameProperty('__dataProto', model))) {
          model.__dataProto = Object.create(model.__dataProto);
        }
        model.__dataProto[property] = value;
      }
    }
  }
}

/**
 * Element class mixin that provides basic meta-programming for creating one
 * or more property accessors (getter/setter pair) that enqueue an async
 * (batched) `_propertiesChanged` callback.
 *
 * For basic usage of this mixin:
 *
 * -   Declare attributes to observe via the standard `static get
 *     observedAttributes()`. Use `dash-case` attribute names to represent
 *     `camelCase` property names.
 * -   Implement the `_propertiesChanged` callback on the class.
 * -   Call `MyClass.createPropertiesForAttributes()` **once** on the class to
 *     generate property accessors for each observed attribute. This must be
 *     called before the first instance is created, for example, by calling it
 *     before calling `customElements.define`. It can also be called lazily from
 *     the element's `constructor`, as long as it's guarded so that the call is
 *     only made once, when the first instance is created.
 * -   Call `this._enableProperties()` in the element's `connectedCallback` to
 *     enable the accessors.
 *
 * Any `observedAttributes` will automatically be
 * deserialized via `attributeChangedCallback` and set to the associated
 * property using `dash-case`-to-`camelCase` convention.
 *
 * @mixinFunction
 * @polymer
 * @appliesMixin PropertiesChanged
 * @summary Element class mixin for reacting to property changes from
 *   generated property accessors.
 * @template T
 * @param {function(new:T)} superClass Class to apply mixin to.
 * @return {function(new:T)} superClass with mixin applied.
 */
const PropertyAccessors = dedupingMixin(superClass => {

  /**
   * @constructor
   * @implements {Polymer_PropertiesChanged}
   * @unrestricted
   * @private
   */
   const base = PropertiesChanged(superClass);

  /**
   * @polymer
   * @mixinClass
   * @implements {Polymer_PropertyAccessors}
   * @extends {base}
   * @unrestricted
   */
  class PropertyAccessors extends base {

    /**
     * Generates property accessors for all attributes in the standard
     * static `observedAttributes` array.
     *
     * Attribute names are mapped to property names using the `dash-case` to
     * `camelCase` convention
     *
     * @return {void}
     * @nocollapse
     */
    static createPropertiesForAttributes() {
      let a$ =  /** @type {?} */ (this).observedAttributes;
      for (let i=0; i < a$.length; i++) {
        this.prototype._createPropertyAccessor(dashToCamelCase(a$[i]));
      }
    }

    /**
     * Returns an attribute name that corresponds to the given property.
     * By default, converts camel to dash case, e.g. `fooBar` to `foo-bar`.
     * @param {string} property Property to convert
     * @return {string} Attribute name corresponding to the given property.
     *
     * @protected
     * @nocollapse
     */
    static attributeNameForProperty(property) {
      return camelToDashCase(property);
    }

    /**
     * Overrides PropertiesChanged implementation to initialize values for
     * accessors created for values that already existed on the element
     * prototype.
     *
     * @return {void}
     * @protected
     * @override
     */
    _initializeProperties() {
      if (this.__dataProto) {
        this._initializeProtoProperties(this.__dataProto);
        this.__dataProto = null;
      }
      super._initializeProperties();
    }

    /**
     * Called at instance time with bag of properties that were overwritten
     * by accessors on the prototype when accessors were created.
     *
     * The default implementation sets these properties back into the
     * setter at instance time.  This method is provided as an override
     * point for customizing or providing more efficient initialization.
     *
     * @param {Object} props Bag of property values that were overwritten
     *   when creating property accessors.
     * @return {void}
     * @protected
     * @override
     */
    _initializeProtoProperties(props) {
      for (let p in props) {
        this._setProperty(p, props[p]);
      }
    }

    /**
     * Ensures the element has the given attribute. If it does not,
     * assigns the given value to the attribute.
     *
     * @suppress {invalidCasts} Closure can't figure out `this` is infact an
     *     element
     *
     * @param {string} attribute Name of attribute to ensure is set.
     * @param {string} value of the attribute.
     * @return {void}
     * @override
     */
    _ensureAttribute(attribute, value) {
      const el = /** @type {!HTMLElement} */(this);
      if (!el.hasAttribute(attribute)) {
        this._valueToNodeAttribute(el, value, attribute);
      }
    }

    /**
     * Overrides PropertiesChanged implemention to serialize objects as JSON.
     *
     * @param {*} value Property value to serialize.
     * @return {string | undefined} String serialized from the provided property
     *     value.
     * @override
     */
    _serializeValue(value) {
      /* eslint-disable no-fallthrough */
      switch (typeof value) {
        case 'object':
          if (value instanceof Date) {
            return value.toString();
          } else if (value) {
            if (isTrustedType(value)) {
              /**
               * Here `value` isn't actually a string, but it should be
               * passed into APIs that normally expect a string, like
               * elem.setAttribute.
               */
              return /** @type {?} */ (value);
            }
            try {
              return JSON.stringify(value);
            } catch(x) {
              return '';
            }
          }

        default:
          return super._serializeValue(value);
      }
    }

    /**
     * Converts a string to a typed JavaScript value.
     *
     * This method is called by Polymer when reading HTML attribute values to
     * JS properties.  Users may override this method on Polymer element
     * prototypes to provide deserialization for custom `type`s.  Note,
     * the `type` argument is the value of the `type` field provided in the
     * `properties` configuration object for a given property, and is
     * by convention the constructor for the type to deserialize.
     *
     *
     * @param {?string} value Attribute value to deserialize.
     * @param {*=} type Type to deserialize the string to.
     * @return {*} Typed value deserialized from the provided string.
     * @override
     */
    _deserializeValue(value, type) {
      /**
       * @type {*}
       */
      let outValue;
      switch (type) {
        case Object:
          try {
            outValue = JSON.parse(/** @type {string} */(value));
          } catch(x) {
            // allow non-JSON literals like Strings and Numbers
            outValue = value;
          }
          break;
        case Array:
          try {
            outValue = JSON.parse(/** @type {string} */(value));
          } catch(x) {
            outValue = null;
            console.warn(`Polymer::Attributes: couldn't decode Array as JSON: ${value}`);
          }
          break;
        case Date:
          outValue = isNaN(value) ? String(value) : Number(value);
          outValue = new Date(outValue);
          break;
        default:
          outValue = super._deserializeValue(value, type);
          break;
      }
      return outValue;
    }
    /* eslint-enable no-fallthrough */

    /**
     * Overrides PropertiesChanged implementation to save existing prototype
     * property value so that it can be reset.
     * @param {string} property Name of the property
     * @param {boolean=} readOnly When true, no setter is created
     *
     * When calling on a prototype, any overwritten values are saved in
     * `__dataProto`, and it is up to the subclasser to decide how/when
     * to set those properties back into the accessor.  When calling on an
     * instance, the overwritten value is set via `_setPendingProperty`,
     * and the user should call `_invalidateProperties` or `_flushProperties`
     * for the values to take effect.
     * @protected
     * @return {void}
     * @override
     */
    _definePropertyAccessor(property, readOnly) {
      saveAccessorValue(this, property);
      super._definePropertyAccessor(property, readOnly);
    }

    /**
     * Returns true if this library created an accessor for the given property.
     *
     * @param {string} property Property name
     * @return {boolean} True if an accessor was created
     * @override
     */
    _hasAccessor(property) {
      return this.__dataHasAccessor && this.__dataHasAccessor[property];
    }

    /**
     * Returns true if the specified property has a pending change.
     *
     * @param {string} prop Property name
     * @return {boolean} True if property has a pending change
     * @protected
     * @override
     */
    _isPropertyPending(prop) {
      return Boolean(this.__dataPending && (prop in this.__dataPending));
    }

  }

  return PropertyAccessors;

});

/**
@license
Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

// 1.x backwards-compatible auto-wrapper for template type extensions
// This is a clear layering violation and gives favored-nation status to
// dom-if and dom-repeat templates.  This is a conceit we're choosing to keep
// a.) to ease 1.x backwards-compatibility due to loss of `is`, and
// b.) to maintain if/repeat capability in parser-constrained elements
//     (e.g. table, select) in lieu of native CE type extensions without
//     massive new invention in this space (e.g. directive system)
const templateExtensions = {
  'dom-if': true,
  'dom-repeat': true
};

let placeholderBugDetect = false;
let placeholderBug = false;

function hasPlaceholderBug() {
  if (!placeholderBugDetect) {
    placeholderBugDetect = true;
    const t = document.createElement('textarea');
    t.placeholder = 'a';
    placeholderBug = t.placeholder === t.textContent;
  }
  return placeholderBug;
}

/**
 * Some browsers have a bug with textarea, where placeholder text is copied as
 * a textnode child of the textarea.
 *
 * If the placeholder is a binding, this can break template stamping in two
 * ways.
 *
 * One issue is that when the `placeholder` attribute is removed when the
 * binding is processed, the textnode child of the textarea is deleted, and the
 * template info tries to bind into that node.
 *
 * With `legacyOptimizations` in use, when the template is stamped and the
 * `textarea.textContent` binding is processed, no corresponding node is found
 * because it was removed during parsing. An exception is generated when this
 * binding is updated.
 *
 * With `legacyOptimizations` not in use, the template is cloned before
 * processing and this changes the above behavior. The cloned template also has
 * a value property set to the placeholder and textContent. This prevents the
 * removal of the textContent when the placeholder attribute is removed.
 * Therefore the exception does not occur. However, there is an extra
 * unnecessary binding.
 *
 * @param {!Node} node Check node for placeholder bug
 * @return {void}
 */
function fixPlaceholder(node) {
  if (hasPlaceholderBug() && node.localName === 'textarea' && node.placeholder
        && node.placeholder === node.textContent) {
    node.textContent = null;
  }
}

/**
 * Copies an attribute from one element to another, converting the value to a
 * `TrustedScript` if it is named like a Polymer template event listener.
 *
 * @param {!Element} dest The element to set the attribute on
 * @param {!Element} src The element to read the attribute from
 * @param {string} name The name of the attribute
 */
const copyAttributeWithTemplateEventPolicy = (() => {
  /**
   * This `TrustedTypePolicy` is used to work around a Chrome bug in the Trusted
   * Types API where any attribute that starts with `on` may only be set to a
   * `TrustedScript` value, even if that attribute would not cause an event
   * listener to be created. (See https://crbug.com/993268 for details.)
   *
   * Polymer's template system allows `<dom-if>` and `<dom-repeat>` to be
   * written using the `<template is="...">` syntax, even if there is no UA
   * support for custom element extensions of built-in elements. In doing so, it
   * copies attributes from the original `<template>` to a newly created
   * `<dom-if>` or `<dom-repeat>`, which can trigger the bug mentioned above if
   * any of those attributes uses Polymer's `on-` syntax for event listeners.
   * (Note, the value of these `on-` listeners is not evaluated as script: it is
   * the name of a member function of a component that will be used as the event
   * listener.)
   *
   * @type {!TrustedTypePolicy|undefined}
   */
  const polymerTemplateEventAttributePolicy = window.trustedTypes &&
      window.trustedTypes.createPolicy(
          'polymer-template-event-attribute-policy', {
            createScript: x => x,
          });

  return (dest, src, name) => {
    const value = src.getAttribute(name);

    if (polymerTemplateEventAttributePolicy && name.startsWith('on-')) {
      dest.setAttribute(
          name, polymerTemplateEventAttributePolicy.createScript(value, name));
      return;
    }

    dest.setAttribute(name, value);
  };
})();

function wrapTemplateExtension(node) {
  let is = node.getAttribute('is');
  if (is && templateExtensions[is]) {
    let t = node;
    t.removeAttribute('is');
    node = t.ownerDocument.createElement(is);
    t.parentNode.replaceChild(node, t);
    node.appendChild(t);
    while(t.attributes.length) {
      const {name} = t.attributes[0];
      copyAttributeWithTemplateEventPolicy(node, t, name);
      t.removeAttribute(name);
    }
  }
  return node;
}

function findTemplateNode(root, nodeInfo) {
  // recursively ascend tree until we hit root
  let parent = nodeInfo.parentInfo && findTemplateNode(root, nodeInfo.parentInfo);
  // unwind the stack, returning the indexed node at each level
  if (parent) {
    // note: marginally faster than indexing via childNodes
    // (http://jsperf.com/childnodes-lookup)
    for (let n=parent.firstChild, i=0; n; n=n.nextSibling) {
      if (nodeInfo.parentIndex === i++) {
        return n;
      }
    }
  } else {
    return root;
  }
}

// construct `$` map (from id annotations)
function applyIdToMap(inst, map, node, nodeInfo) {
  if (nodeInfo.id) {
    map[nodeInfo.id] = node;
  }
}

// install event listeners (from event annotations)
function applyEventListener(inst, node, nodeInfo) {
  if (nodeInfo.events && nodeInfo.events.length) {
    for (let j=0, e$=nodeInfo.events, e; (j<e$.length) && (e=e$[j]); j++) {
      inst._addMethodEventListenerToNode(node, e.name, e.value, inst);
    }
  }
}

// push configuration references at configure time
function applyTemplateInfo(inst, node, nodeInfo, parentTemplateInfo) {
  if (nodeInfo.templateInfo) {
    // Give the node an instance of this templateInfo and set its parent
    node._templateInfo = nodeInfo.templateInfo;
    node._parentTemplateInfo = parentTemplateInfo;
  }
}

function createNodeEventHandler(context, eventName, methodName) {
  // Instances can optionally have a _methodHost which allows redirecting where
  // to find methods. Currently used by `templatize`.
  context = context._methodHost || context;
  let handler = function(e) {
    if (context[methodName]) {
      context[methodName](e, e.detail);
    } else {
      console.warn('listener method `' + methodName + '` not defined');
    }
  };
  return handler;
}

/**
 * Element mixin that provides basic template parsing and stamping, including
 * the following template-related features for stamped templates:
 *
 * - Declarative event listeners (`on-eventname="listener"`)
 * - Map of node id's to stamped node instances (`this.$.id`)
 * - Nested template content caching/removal and re-installation (performance
 *   optimization)
 *
 * @mixinFunction
 * @polymer
 * @summary Element class mixin that provides basic template parsing and stamping
 */
const TemplateStamp = dedupingMixin(
    /**
     * @template T
     * @param {function(new:T)} superClass Class to apply mixin to.
     * @return {function(new:T)} superClass with mixin applied.
     */
    (superClass) => {

  /**
   * @polymer
   * @mixinClass
   * @implements {Polymer_TemplateStamp}
   */
  class TemplateStamp extends superClass {

    /**
     * Scans a template to produce template metadata.
     *
     * Template-specific metadata are stored in the object returned, and node-
     * specific metadata are stored in objects in its flattened `nodeInfoList`
     * array.  Only nodes in the template that were parsed as nodes of
     * interest contain an object in `nodeInfoList`.  Each `nodeInfo` object
     * contains an `index` (`childNodes` index in parent) and optionally
     * `parent`, which points to node info of its parent (including its index).
     *
     * The template metadata object returned from this method has the following
     * structure (many fields optional):
     *
     * ```js
     *   {
     *     // Flattened list of node metadata (for nodes that generated metadata)
     *     nodeInfoList: [
     *       {
     *         // `id` attribute for any nodes with id's for generating `$` map
     *         id: {string},
     *         // `on-event="handler"` metadata
     *         events: [
     *           {
     *             name: {string},   // event name
     *             value: {string},  // handler method name
     *           }, ...
     *         ],
     *         // Notes when the template contained a `<slot>` for shady DOM
     *         // optimization purposes
     *         hasInsertionPoint: {boolean},
     *         // For nested `<template>`` nodes, nested template metadata
     *         templateInfo: {object}, // nested template metadata
     *         // Metadata to allow efficient retrieval of instanced node
     *         // corresponding to this metadata
     *         parentInfo: {number},   // reference to parent nodeInfo>
     *         parentIndex: {number},  // index in parent's `childNodes` collection
     *         infoIndex: {number},    // index of this `nodeInfo` in `templateInfo.nodeInfoList`
     *       },
     *       ...
     *     ],
     *     // When true, the template had the `strip-whitespace` attribute
     *     // or was nested in a template with that setting
     *     stripWhitespace: {boolean},
     *     // For nested templates, nested template content is moved into
     *     // a document fragment stored here; this is an optimization to
     *     // avoid the cost of nested template cloning
     *     content: {DocumentFragment}
     *   }
     * ```
     *
     * This method kicks off a recursive treewalk as follows:
     *
     * ```
     *    _parseTemplate <---------------------+
     *      _parseTemplateContent              |
     *        _parseTemplateNode  <------------|--+
     *          _parseTemplateNestedTemplate --+  |
     *          _parseTemplateChildNodes ---------+
     *          _parseTemplateNodeAttributes
     *            _parseTemplateNodeAttribute
     *
     * ```
     *
     * These methods may be overridden to add custom metadata about templates
     * to either `templateInfo` or `nodeInfo`.
     *
     * Note that this method may be destructive to the template, in that
     * e.g. event annotations may be removed after being noted in the
     * template metadata.
     *
     * @param {!HTMLTemplateElement} template Template to parse
     * @param {TemplateInfo=} outerTemplateInfo Template metadata from the outer
     *   template, for parsing nested templates
     * @return {!TemplateInfo} Parsed template metadata
     * @nocollapse
     */
    static _parseTemplate(template, outerTemplateInfo) {
      // since a template may be re-used, memo-ize metadata
      if (!template._templateInfo) {
        // TODO(rictic): fix typing
        let /** ? */ templateInfo = template._templateInfo = {};
        templateInfo.nodeInfoList = [];
        templateInfo.nestedTemplate = Boolean(outerTemplateInfo);
        templateInfo.stripWhiteSpace =
          (outerTemplateInfo && outerTemplateInfo.stripWhiteSpace) ||
          (template.hasAttribute && template.hasAttribute('strip-whitespace'));
         // TODO(rictic): fix typing
         this._parseTemplateContent(
             template, templateInfo, /** @type {?} */ ({parent: null}));
      }
      return template._templateInfo;
    }

    /**
     * See docs for _parseTemplateNode.
     *
     * @param {!HTMLTemplateElement} template .
     * @param {!TemplateInfo} templateInfo .
     * @param {!NodeInfo} nodeInfo .
     * @return {boolean} .
     * @nocollapse
     */
    static _parseTemplateContent(template, templateInfo, nodeInfo) {
      return this._parseTemplateNode(template.content, templateInfo, nodeInfo);
    }

    /**
     * Parses template node and adds template and node metadata based on
     * the current node, and its `childNodes` and `attributes`.
     *
     * This method may be overridden to add custom node or template specific
     * metadata based on this node.
     *
     * @param {Node} node Node to parse
     * @param {!TemplateInfo} templateInfo Template metadata for current template
     * @param {!NodeInfo} nodeInfo Node metadata for current template.
     * @return {boolean} `true` if the visited node added node-specific
     *   metadata to `nodeInfo`
     * @nocollapse
     */
    static _parseTemplateNode(node, templateInfo, nodeInfo) {
      let noted = false;
      let element = /** @type {!HTMLTemplateElement} */ (node);
      if (element.localName == 'template' && !element.hasAttribute('preserve-content')) {
        noted = this._parseTemplateNestedTemplate(element, templateInfo, nodeInfo) || noted;
      } else if (element.localName === 'slot') {
        // For ShadyDom optimization, indicating there is an insertion point
        templateInfo.hasInsertionPoint = true;
      }
      fixPlaceholder(element);
      if (element.firstChild) {
        this._parseTemplateChildNodes(element, templateInfo, nodeInfo);
      }
      if (element.hasAttributes && element.hasAttributes()) {
        noted = this._parseTemplateNodeAttributes(element, templateInfo, nodeInfo) || noted;
      }
      // Checking `nodeInfo.noted` allows a child node of this node (who gets
      // access to `parentInfo`) to cause the parent to be noted, which
      // otherwise has no return path via `_parseTemplateChildNodes` (used by
      // some optimizations)
      return noted || nodeInfo.noted;
    }

    /**
     * Parses template child nodes for the given root node.
     *
     * This method also wraps whitelisted legacy template extensions
     * (`is="dom-if"` and `is="dom-repeat"`) with their equivalent element
     * wrappers, collapses text nodes, and strips whitespace from the template
     * if the `templateInfo.stripWhitespace` setting was provided.
     *
     * @param {Node} root Root node whose `childNodes` will be parsed
     * @param {!TemplateInfo} templateInfo Template metadata for current template
     * @param {!NodeInfo} nodeInfo Node metadata for current template.
     * @return {void}
     */
    static _parseTemplateChildNodes(root, templateInfo, nodeInfo) {
      if (root.localName === 'script' || root.localName === 'style') {
        return;
      }
      for (let node=root.firstChild, parentIndex=0, next; node; node=next) {
        // Wrap templates
        if (node.localName == 'template') {
          node = wrapTemplateExtension(node);
        }
        // collapse adjacent textNodes: fixes an IE issue that can cause
        // text nodes to be inexplicably split =(
        // note that root.normalize() should work but does not so we do this
        // manually.
        next = node.nextSibling;
        if (node.nodeType === Node.TEXT_NODE) {
          let /** Node */ n = next;
          while (n && (n.nodeType === Node.TEXT_NODE)) {
            node.textContent += n.textContent;
            next = n.nextSibling;
            root.removeChild(n);
            n = next;
          }
          // optionally strip whitespace
          if (templateInfo.stripWhiteSpace && !node.textContent.trim()) {
            root.removeChild(node);
            continue;
          }
        }
        let childInfo =
            /** @type {!NodeInfo} */ ({parentIndex, parentInfo: nodeInfo});
        if (this._parseTemplateNode(node, templateInfo, childInfo)) {
          childInfo.infoIndex = templateInfo.nodeInfoList.push(childInfo) - 1;
        }
        // Increment if not removed
        if (node.parentNode) {
          parentIndex++;
        }
      }
    }

    /**
     * Parses template content for the given nested `<template>`.
     *
     * Nested template info is stored as `templateInfo` in the current node's
     * `nodeInfo`. `template.content` is removed and stored in `templateInfo`.
     * It will then be the responsibility of the host to set it back to the
     * template and for users stamping nested templates to use the
     * `_contentForTemplate` method to retrieve the content for this template
     * (an optimization to avoid the cost of cloning nested template content).
     *
     * @param {HTMLTemplateElement} node Node to parse (a <template>)
     * @param {TemplateInfo} outerTemplateInfo Template metadata for current template
     *   that includes the template `node`
     * @param {!NodeInfo} nodeInfo Node metadata for current template.
     * @return {boolean} `true` if the visited node added node-specific
     *   metadata to `nodeInfo`
     * @nocollapse
     */
    static _parseTemplateNestedTemplate(node, outerTemplateInfo, nodeInfo) {
      // TODO(rictic): the type of node should be non-null
      let element = /** @type {!HTMLTemplateElement} */ (node);
      let templateInfo = this._parseTemplate(element, outerTemplateInfo);
      let content = templateInfo.content =
          element.content.ownerDocument.createDocumentFragment();
      content.appendChild(element.content);
      nodeInfo.templateInfo = templateInfo;
      return true;
    }

    /**
     * Parses template node attributes and adds node metadata to `nodeInfo`
     * for nodes of interest.
     *
     * @param {Element} node Node to parse
     * @param {!TemplateInfo} templateInfo Template metadata for current
     *     template
     * @param {!NodeInfo} nodeInfo Node metadata for current template.
     * @return {boolean} `true` if the visited node added node-specific
     *   metadata to `nodeInfo`
     * @nocollapse
     */
    static _parseTemplateNodeAttributes(node, templateInfo, nodeInfo) {
      // Make copy of original attribute list, since the order may change
      // as attributes are added and removed
      let noted = false;
      let attrs = Array.from(node.attributes);
      for (let i=attrs.length-1, a; (a=attrs[i]); i--) {
        noted = this._parseTemplateNodeAttribute(node, templateInfo, nodeInfo, a.name, a.value) || noted;
      }
      return noted;
    }

    /**
     * Parses a single template node attribute and adds node metadata to
     * `nodeInfo` for attributes of interest.
     *
     * This implementation adds metadata for `on-event="handler"` attributes
     * and `id` attributes.
     *
     * @param {Element} node Node to parse
     * @param {!TemplateInfo} templateInfo Template metadata for current template
     * @param {!NodeInfo} nodeInfo Node metadata for current template.
     * @param {string} name Attribute name
     * @param {string} value Attribute value
     * @return {boolean} `true` if the visited node added node-specific
     *   metadata to `nodeInfo`
     * @nocollapse
     */
    static _parseTemplateNodeAttribute(node, templateInfo, nodeInfo, name, value) {
      // events (on-*)
      if (name.slice(0, 3) === 'on-') {
        node.removeAttribute(name);
        nodeInfo.events = nodeInfo.events || [];
        nodeInfo.events.push({
          name: name.slice(3),
          value
        });
        return true;
      }
      // static id
      else if (name === 'id') {
        nodeInfo.id = value;
        return true;
      }
      return false;
    }

    /**
     * Returns the `content` document fragment for a given template.
     *
     * For nested templates, Polymer performs an optimization to cache nested
     * template content to avoid the cost of cloning deeply nested templates.
     * This method retrieves the cached content for a given template.
     *
     * @param {HTMLTemplateElement} template Template to retrieve `content` for
     * @return {DocumentFragment} Content fragment
     * @nocollapse
     */
    static _contentForTemplate(template) {
      let templateInfo = /** @type {HTMLTemplateElementWithInfo} */ (template)._templateInfo;
      return (templateInfo && templateInfo.content) || template.content;
    }

    /**
     * Clones the provided template content and returns a document fragment
     * containing the cloned dom.
     *
     * The template is parsed (once and memoized) using this library's
     * template parsing features, and provides the following value-added
     * features:
     * * Adds declarative event listeners for `on-event="handler"` attributes
     * * Generates an "id map" for all nodes with id's under `$` on returned
     *   document fragment
     * * Passes template info including `content` back to templates as
     *   `_templateInfo` (a performance optimization to avoid deep template
     *   cloning)
     *
     * Note that the memoized template parsing process is destructive to the
     * template: attributes for bindings and declarative event listeners are
     * removed after being noted in notes, and any nested `<template>.content`
     * is removed and stored in notes as well.
     *
     * @param {!HTMLTemplateElement} template Template to stamp
     * @param {TemplateInfo=} templateInfo Optional template info associated
     *   with the template to be stamped; if omitted the template will be
     *   automatically parsed.
     * @return {!StampedTemplate} Cloned template content
     * @override
     */
    _stampTemplate(template, templateInfo) {
      // Polyfill support: bootstrap the template if it has not already been
      if (template && !template.content &&
          window.HTMLTemplateElement && HTMLTemplateElement.decorate) {
        HTMLTemplateElement.decorate(template);
      }
      // Accepting the `templateInfo` via an argument allows for creating
      // instances of the `templateInfo` by the caller, useful for adding
      // instance-time information to the prototypical data
      templateInfo = templateInfo || this.constructor._parseTemplate(template);
      let nodeInfo = templateInfo.nodeInfoList;
      let content = templateInfo.content || template.content;
      let dom = /** @type {DocumentFragment} */ (document.importNode(content, true));
      // NOTE: ShadyDom optimization indicating there is an insertion point
      dom.__noInsertionPoint = !templateInfo.hasInsertionPoint;
      let nodes = dom.nodeList = new Array(nodeInfo.length);
      dom.$ = {};
      for (let i=0, l=nodeInfo.length, info; (i<l) && (info=nodeInfo[i]); i++) {
        let node = nodes[i] = findTemplateNode(dom, info);
        applyIdToMap(this, dom.$, node, info);
        applyTemplateInfo(this, node, info, templateInfo);
        applyEventListener(this, node, info);
      }
      dom = /** @type {!StampedTemplate} */(dom); // eslint-disable-line no-self-assign
      return dom;
    }

    /**
     * Adds an event listener by method name for the event provided.
     *
     * This method generates a handler function that looks up the method
     * name at handling time.
     *
     * @param {!EventTarget} node Node to add listener on
     * @param {string} eventName Name of event
     * @param {string} methodName Name of method
     * @param {*=} context Context the method will be called on (defaults
     *   to `node`)
     * @return {Function} Generated handler function
     * @override
     */
    _addMethodEventListenerToNode(node, eventName, methodName, context) {
      context = context || node;
      let handler = createNodeEventHandler(context, eventName, methodName);
      this._addEventListenerToNode(node, eventName, handler);
      return handler;
    }

    /**
     * Override point for adding custom or simulated event handling.
     *
     * @param {!EventTarget} node Node to add event listener to
     * @param {string} eventName Name of event
     * @param {function(!Event):void} handler Listener function to add
     * @return {void}
     * @override
     */
    _addEventListenerToNode(node, eventName, handler) {
      node.addEventListener(eventName, handler);
    }

    /**
     * Override point for adding custom or simulated event handling.
     *
     * @param {!EventTarget} node Node to remove event listener from
     * @param {string} eventName Name of event
     * @param {function(!Event):void} handler Listener function to remove
     * @return {void}
     * @override
     */
    _removeEventListenerFromNode(node, eventName, handler) {
      node.removeEventListener(eventName, handler);
    }

  }

  return TemplateStamp;

});

/**
 * @fileoverview
 * @suppress {checkPrototypalTypes}
 * @license Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt The complete set of authors may be found
 * at http://polymer.github.io/AUTHORS.txt The complete set of contributors may
 * be found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by
 * Google as part of the polymer project is also subject to an additional IP
 * rights grant found at http://polymer.github.io/PATENTS.txt
 */


// Monotonically increasing unique ID used for de-duping effects triggered
// from multiple properties in the same turn
let dedupeId = 0;

const NOOP = [];

/**
 * Property effect types; effects are stored on the prototype using these keys
 * @enum {string}
 */
const TYPES = {
  COMPUTE: '__computeEffects',
  REFLECT: '__reflectEffects',
  NOTIFY: '__notifyEffects',
  PROPAGATE: '__propagateEffects',
  OBSERVE: '__observeEffects',
  READ_ONLY: '__readOnly'
};

const COMPUTE_INFO = '__computeInfo';

/** @const {!RegExp} */
const capitalAttributeRegex = /[A-Z]/;

/**
 * Ensures that the model has an own-property map of effects for the given type.
 * The model may be a prototype or an instance.
 *
 * Property effects are stored as arrays of effects by property in a map,
 * by named type on the model. e.g.
 *
 *   __computeEffects: {
 *     foo: [ ... ],
 *     bar: [ ... ]
 *   }
 *
 * If the model does not yet have an effect map for the type, one is created
 * and returned.  If it does, but it is not an own property (i.e. the
 * prototype had effects), the the map is deeply cloned and the copy is
 * set on the model and returned, ready for new effects to be added.
 *
 * @param {Object} model Prototype or instance
 * @param {string} type Property effect type
 * @param {boolean=} cloneArrays Clone any arrays assigned to the map when
 *   extending a superclass map onto this subclass
 * @return {Object} The own-property map of effects for the given type
 * @private
 */
function ensureOwnEffectMap(model, type, cloneArrays) {
  let effects = model[type];
  if (!effects) {
    effects = model[type] = {};
  } else if (!model.hasOwnProperty(type)) {
    effects = model[type] = Object.create(model[type]);
    if (cloneArrays) {
      for (let p in effects) {
        let protoFx = effects[p];
        // Perf optimization over Array.slice
        let instFx = effects[p] = Array(protoFx.length);
        for (let i=0; i<protoFx.length; i++) {
          instFx[i] = protoFx[i];
        }
      }
    }
  }
  return effects;
}

// -- effects ----------------------------------------------

/**
 * Runs all effects of a given type for the given set of property changes
 * on an instance.
 *
 * @param {!Polymer_PropertyEffects} inst The instance with effects to run
 * @param {?Object} effects Object map of property-to-Array of effects
 * @param {?Object} props Bag of current property changes
 * @param {?Object=} oldProps Bag of previous values for changed properties
 * @param {boolean=} hasPaths True with `props` contains one or more paths
 * @param {*=} extraArgs Additional metadata to pass to effect function
 * @return {boolean} True if an effect ran for this property
 * @private
 */
function runEffects(inst, effects, props, oldProps, hasPaths, extraArgs) {
  if (effects) {
    let ran = false;
    const id = dedupeId++;
    for (let prop in props) {
      // Inline `runEffectsForProperty` for perf.
      let rootProperty = hasPaths ? root(prop) : prop;
      let fxs = effects[rootProperty];
      if (fxs) {
        for (let i=0, l=fxs.length, fx; (i<l) && (fx=fxs[i]); i++) {
          if ((!fx.info || fx.info.lastRun !== id) &&
              (!hasPaths || pathMatchesTrigger(prop, fx.trigger))) {
            if (fx.info) {
              fx.info.lastRun = id;
            }
            fx.fn(inst, prop, props, oldProps, fx.info, hasPaths, extraArgs);
            ran = true;
          }
        }
      }
    }
    return ran;
  }
  return false;
}

/**
 * Runs a list of effects for a given property.
 *
 * @param {!Polymer_PropertyEffects} inst The instance with effects to run
 * @param {!Object} effects Object map of property-to-Array of effects
 * @param {number} dedupeId Counter used for de-duping effects
 * @param {string} prop Name of changed property
 * @param {*} props Changed properties
 * @param {*} oldProps Old properties
 * @param {boolean=} hasPaths True with `props` contains one or more paths
 * @param {*=} extraArgs Additional metadata to pass to effect function
 * @return {boolean} True if an effect ran for this property
 * @private
 */
function runEffectsForProperty(inst, effects, dedupeId, prop, props, oldProps, hasPaths, extraArgs) {
  let ran = false;
  let rootProperty = hasPaths ? root(prop) : prop;
  let fxs = effects[rootProperty];
  if (fxs) {
    for (let i=0, l=fxs.length, fx; (i<l) && (fx=fxs[i]); i++) {
      if ((!fx.info || fx.info.lastRun !== dedupeId) &&
          (!hasPaths || pathMatchesTrigger(prop, fx.trigger))) {
        if (fx.info) {
          fx.info.lastRun = dedupeId;
        }
        fx.fn(inst, prop, props, oldProps, fx.info, hasPaths, extraArgs);
        ran = true;
      }
    }
  }
  return ran;
}

/**
 * Determines whether a property/path that has changed matches the trigger
 * criteria for an effect.  A trigger is a descriptor with the following
 * structure, which matches the descriptors returned from `parseArg`.
 * e.g. for `foo.bar.*`:
 * ```
 * trigger: {
 *   name: 'a.b',
 *   structured: true,
 *   wildcard: true
 * }
 * ```
 * If no trigger is given, the path is deemed to match.
 *
 * @param {string} path Path or property that changed
 * @param {?DataTrigger} trigger Descriptor
 * @return {boolean} Whether the path matched the trigger
 */
function pathMatchesTrigger(path, trigger) {
  if (trigger) {
    let triggerPath = /** @type {string} */ (trigger.name);
    return (triggerPath == path) ||
        !!(trigger.structured && isAncestor(triggerPath, path)) ||
        !!(trigger.wildcard && isDescendant(triggerPath, path));
  } else {
    return true;
  }
}

/**
 * Implements the "observer" effect.
 *
 * Calls the method with `info.methodName` on the instance, passing the
 * new and old values.
 *
 * @param {!Polymer_PropertyEffects} inst The instance the effect will be run on
 * @param {string} property Name of property
 * @param {Object} props Bag of current property changes
 * @param {Object} oldProps Bag of previous values for changed properties
 * @param {?} info Effect metadata
 * @return {void}
 * @private
 */
function runObserverEffect(inst, property, props, oldProps, info) {
  let fn = typeof info.method === "string" ? inst[info.method] : info.method;
  let changedProp = info.property;
  if (fn) {
    fn.call(inst, inst.__data[changedProp], oldProps[changedProp]);
  } else if (!info.dynamicFn) {
    console.warn('observer method `' + info.method + '` not defined');
  }
}

/**
 * Runs "notify" effects for a set of changed properties.
 *
 * This method differs from the generic `runEffects` method in that it
 * will dispatch path notification events in the case that the property
 * changed was a path and the root property for that path didn't have a
 * "notify" effect.  This is to maintain 1.0 behavior that did not require
 * `notify: true` to ensure object sub-property notifications were
 * sent.
 *
 * @param {!Polymer_PropertyEffects} inst The instance with effects to run
 * @param {Object} notifyProps Bag of properties to notify
 * @param {Object} props Bag of current property changes
 * @param {Object} oldProps Bag of previous values for changed properties
 * @param {boolean} hasPaths True with `props` contains one or more paths
 * @return {void}
 * @private
 */
function runNotifyEffects(inst, notifyProps, props, oldProps, hasPaths) {
  // Notify
  let fxs = inst[TYPES.NOTIFY];
  let notified;
  let id = dedupeId++;
  // Try normal notify effects; if none, fall back to try path notification
  for (let prop in notifyProps) {
    if (notifyProps[prop]) {
      if (fxs && runEffectsForProperty(inst, fxs, id, prop, props, oldProps, hasPaths)) {
        notified = true;
      } else if (hasPaths && notifyPath(inst, prop, props)) {
        notified = true;
      }
    }
  }
  // Flush host if we actually notified and host was batching
  // And the host has already initialized clients; this prevents
  // an issue with a host observing data changes before clients are ready.
  let host;
  if (notified && (host = inst.__dataHost) && host._invalidateProperties) {
    host._invalidateProperties();
  }
}

/**
 * Dispatches {property}-changed events with path information in the detail
 * object to indicate a sub-path of the property was changed.
 *
 * @param {!Polymer_PropertyEffects} inst The element from which to fire the
 *     event
 * @param {string} path The path that was changed
 * @param {Object} props Bag of current property changes
 * @return {boolean} Returns true if the path was notified
 * @private
 */
function notifyPath(inst, path, props) {
  let rootProperty = root(path);
  if (rootProperty !== path) {
    let eventName = camelToDashCase(rootProperty) + '-changed';
    dispatchNotifyEvent(inst, eventName, props[path], path);
    return true;
  }
  return false;
}

/**
 * Dispatches {property}-changed events to indicate a property (or path)
 * changed.
 *
 * @param {!Polymer_PropertyEffects} inst The element from which to fire the
 *     event
 * @param {string} eventName The name of the event to send
 *     ('{property}-changed')
 * @param {*} value The value of the changed property
 * @param {string | null | undefined} path If a sub-path of this property
 *     changed, the path that changed (optional).
 * @return {void}
 * @private
 * @suppress {invalidCasts}
 */
function dispatchNotifyEvent(inst, eventName, value, path) {
  let detail = {
    value: value,
    queueProperty: true
  };
  if (path) {
    detail.path = path;
  }
  // As a performance optimization, we could elide the wrap here since notifying
  // events are non-bubbling and shouldn't need retargeting. However, a very
  // small number of internal tests failed in obscure ways, which may indicate
  // user code relied on timing differences resulting from ShadyDOM flushing
  // as a result of the wrapped `dispatchEvent`.
  wrap(/** @type {!HTMLElement} */(inst)).dispatchEvent(new CustomEvent(eventName, { detail }));
}

/**
 * Implements the "notify" effect.
 *
 * Dispatches a non-bubbling event named `info.eventName` on the instance
 * with a detail object containing the new `value`.
 *
 * @param {!Polymer_PropertyEffects} inst The instance the effect will be run on
 * @param {string} property Name of property
 * @param {Object} props Bag of current property changes
 * @param {Object} oldProps Bag of previous values for changed properties
 * @param {?} info Effect metadata
 * @param {boolean} hasPaths True with `props` contains one or more paths
 * @return {void}
 * @private
 */
function runNotifyEffect(inst, property, props, oldProps, info, hasPaths) {
  let rootProperty = hasPaths ? root(property) : property;
  let path = rootProperty != property ? property : null;
  let value = path ? get(inst, path) : inst.__data[property];
  if (path && value === undefined) {
    value = props[property];  // specifically for .splices
  }
  dispatchNotifyEvent(inst, info.eventName, value, path);
}

/**
 * Handler function for 2-way notification events. Receives context
 * information captured in the `addNotifyListener` closure from the
 * `__notifyListeners` metadata.
 *
 * Sets the value of the notified property to the host property or path.  If
 * the event contained path information, translate that path to the host
 * scope's name for that path first.
 *
 * @param {CustomEvent} event Notification event (e.g. '<property>-changed')
 * @param {!Polymer_PropertyEffects} inst Host element instance handling the
 *     notification event
 * @param {string} fromProp Child element property that was bound
 * @param {string} toPath Host property/path that was bound
 * @param {boolean} negate Whether the binding was negated
 * @return {void}
 * @private
 */
function handleNotification(event, inst, fromProp, toPath, negate) {
  let value;
  let detail = /** @type {Object} */(event.detail);
  let fromPath = detail && detail.path;
  if (fromPath) {
    toPath = translate(fromProp, toPath, fromPath);
    value = detail && detail.value;
  } else {
    value = event.currentTarget[fromProp];
  }
  value = negate ? !value : value;
  if (!inst[TYPES.READ_ONLY] || !inst[TYPES.READ_ONLY][toPath]) {
    if (inst._setPendingPropertyOrPath(toPath, value, true, Boolean(fromPath))
      && (!detail || !detail.queueProperty)) {
      inst._invalidateProperties();
    }
  }
}

/**
 * Implements the "reflect" effect.
 *
 * Sets the attribute named `info.attrName` to the given property value.
 *
 * @param {!Polymer_PropertyEffects} inst The instance the effect will be run on
 * @param {string} property Name of property
 * @param {Object} props Bag of current property changes
 * @param {Object} oldProps Bag of previous values for changed properties
 * @param {?} info Effect metadata
 * @return {void}
 * @private
 */
function runReflectEffect(inst, property, props, oldProps, info) {
  let value = inst.__data[property];
  if (sanitizeDOMValue) {
    value = sanitizeDOMValue(value, info.attrName, 'attribute', /** @type {Node} */(inst));
  }
  inst._propertyToAttribute(property, info.attrName, value);
}

/**
 * Runs "computed" effects for a set of changed properties.
 *
 * This method differs from the generic `runEffects` method in that it
 * continues to run computed effects based on the output of each pass until
 * there are no more newly computed properties.  This ensures that all
 * properties that will be computed by the initial set of changes are
 * computed before other effects (binding propagation, observers, and notify)
 * run.
 *
 * @param {!Polymer_PropertyEffects} inst The instance the effect will be run on
 * @param {?Object} changedProps Bag of changed properties
 * @param {?Object} oldProps Bag of previous values for changed properties
 * @param {boolean} hasPaths True with `props` contains one or more paths
 * @return {void}
 * @private
 */
function runComputedEffects(inst, changedProps, oldProps, hasPaths) {
  let computeEffects = inst[TYPES.COMPUTE];
  if (computeEffects) {
    if (orderedComputed) {
      // Runs computed effects in efficient order by keeping a topologically-
      // sorted queue of compute effects to run, and inserting subsequently
      // invalidated effects as they are run
      dedupeId++;
      const order = getComputedOrder(inst);
      const queue = [];
      for (let p in changedProps) {
        enqueueEffectsFor(p, computeEffects, queue, order, hasPaths);
      }
      let info;
      while ((info = queue.shift())) {
        if (runComputedEffect(inst, '', changedProps, oldProps, info)) {
          enqueueEffectsFor(info.methodInfo, computeEffects, queue, order, hasPaths);
        }
      }
      Object.assign(/** @type {!Object} */ (oldProps), inst.__dataOld);
      Object.assign(/** @type {!Object} */ (changedProps), inst.__dataPending);
      inst.__dataPending = null;
    } else {
      // Original Polymer 2.x computed effects order, which continues running
      // effects until no further computed properties have been invalidated
      let inputProps = changedProps;
      while (runEffects(inst, computeEffects, inputProps, oldProps, hasPaths)) {
        Object.assign(/** @type {!Object} */ (oldProps), inst.__dataOld);
        Object.assign(/** @type {!Object} */ (changedProps), inst.__dataPending);
        inputProps = inst.__dataPending;
        inst.__dataPending = null;
      }
    }
  }
}

/**
 * Inserts a computed effect into a queue, given the specified order. Performs
 * the insert using a binary search.
 *
 * Used by `orderedComputed: true` computed property algorithm.
 *
 * @param {Object} info Property effects metadata
 * @param {Array<Object>} queue Ordered queue of effects
 * @param {Map<string,number>} order Map of computed property name->topological
 *   sort order
 */
const insertEffect = (info, queue, order) => {
  let start = 0;
  let end = queue.length - 1;
  let idx = -1;
  while (start <= end) {
    const mid = (start + end) >> 1;
    // Note `methodInfo` is where the computed property name is stored in
    // the effect metadata
    const cmp = order.get(queue[mid].methodInfo) - order.get(info.methodInfo);
    if (cmp < 0) {
      start = mid + 1;
    } else if (cmp > 0) {
      end = mid - 1;
    } else {
      idx = mid;
      break;
    }
  }
  if (idx < 0) {
    idx = end + 1;
  }
  queue.splice(idx, 0, info);
};

/**
 * Inserts all downstream computed effects invalidated by the specified property
 * into the topologically-sorted queue of effects to be run.
 *
 * Used by `orderedComputed: true` computed property algorithm.
 *
 * @param {string} prop Property name
 * @param {Object} computeEffects Computed effects for this element
 * @param {Array<Object>} queue Topologically-sorted queue of computed effects
 *   to be run
 * @param {Map<string,number>} order Map of computed property name->topological
 *   sort order
 * @param {boolean} hasPaths True with `changedProps` contains one or more paths
 */
const enqueueEffectsFor = (prop, computeEffects, queue, order, hasPaths) => {
  const rootProperty = hasPaths ? root(prop) : prop;
  const fxs = computeEffects[rootProperty];
  if (fxs) {
    for (let i=0; i<fxs.length; i++) {
      const fx = fxs[i];
      if ((fx.info.lastRun !== dedupeId) &&
          (!hasPaths || pathMatchesTrigger(prop, fx.trigger))) {
        fx.info.lastRun = dedupeId;
        insertEffect(fx.info, queue, order);
      }
    }
  }
};

/**
 * Generates and retrieves a memoized map of computed property name to its
 * topologically-sorted order.
 *
 * The map is generated by first assigning a "dependency count" to each property
 * (defined as number properties it depends on, including its method for
 * "dynamic functions"). Any properties that have no dependencies are added to
 * the `ready` queue, which are properties whose order can be added to the final
 * order map. Properties are popped off the `ready` queue one by one and a.) added as
 * the next property in the order map, and b.) each property that it is a
 * dependency for has its dep count decremented (and if that property's dep
 * count goes to zero, it is added to the `ready` queue), until all properties
 * have been visited and ordered.
 *
 * Used by `orderedComputed: true` computed property algorithm.
 *
 * @param {!Polymer_PropertyEffects} inst The instance to retrieve the computed
 *   effect order for.
 * @return {Map<string,number>} Map of computed property name->topological sort
 *   order
 */
function getComputedOrder(inst) {
  let ordered = inst.constructor.__orderedComputedDeps;
  if (!ordered) {
    ordered = new Map();
    const effects = inst[TYPES.COMPUTE];
    let {counts, ready, total} = dependencyCounts(inst);
    let curr;
    while ((curr = ready.shift())) {
      ordered.set(curr, ordered.size);
      const computedByCurr = effects[curr];
      if (computedByCurr) {
        computedByCurr.forEach(fx => {
          // Note `methodInfo` is where the computed property name is stored
          const computedProp = fx.info.methodInfo;
          --total;
          if (--counts[computedProp] === 0) {
            ready.push(computedProp);
          }
        });
      }
    }
    if (total !== 0) {
      const el = /** @type {HTMLElement} */ (inst);
      console.warn(`Computed graph for ${el.localName} incomplete; circular?`);
    }
    inst.constructor.__orderedComputedDeps = ordered;
  }
  return ordered;
}

/**
 * Generates a map of property-to-dependency count (`counts`, where "dependency
 * count" is the number of dependencies a given property has assuming it is a
 * computed property, otherwise 0).  It also returns a pre-populated list of
 * `ready` properties that have no dependencies and a `total` count, which is
 * used for error-checking the graph.
 *
 * Used by `orderedComputed: true` computed property algorithm.
 *
 * @param {!Polymer_PropertyEffects} inst The instance to generate dependency
 *   counts for.
 * @return {!Object} Object containing `counts` map (property-to-dependency
 *   count) and pre-populated `ready` array of properties that had zero
 *   dependencies.
 */
function dependencyCounts(inst) {
  const infoForComputed = inst[COMPUTE_INFO];
  const counts = {};
  const computedDeps = inst[TYPES.COMPUTE];
  const ready = [];
  let total = 0;
  // Count dependencies for each computed property
  for (let p in infoForComputed) {
    const info = infoForComputed[p];
    // Be sure to add the method name itself in case of "dynamic functions"
    total += counts[p] =
      info.args.filter(a => !a.literal).length + (info.dynamicFn ? 1 : 0);
  }
  // Build list of ready properties (that aren't themselves computed)
  for (let p in computedDeps) {
    if (!infoForComputed[p]) {
      ready.push(p);
    }
  }
  return {counts, ready, total};
}

/**
 * Implements the "computed property" effect by running the method with the
 * values of the arguments specified in the `info` object and setting the
 * return value to the computed property specified.
 *
 * @param {!Polymer_PropertyEffects} inst The instance the effect will be run on
 * @param {string} property Name of property
 * @param {?Object} changedProps Bag of current property changes
 * @param {?Object} oldProps Bag of previous values for changed properties
 * @param {?} info Effect metadata
 * @return {boolean} True when the property being computed changed
 * @private
 */
function runComputedEffect(inst, property, changedProps, oldProps, info) {
  // Dirty check dependencies and run if any invalid
  let result = runMethodEffect(inst, property, changedProps, oldProps, info);
  // Abort if method returns a no-op result
  if (result === NOOP) {
    return false;
  }
  let computedProp = info.methodInfo;
  if (inst.__dataHasAccessor && inst.__dataHasAccessor[computedProp]) {
    return inst._setPendingProperty(computedProp, result, true);
  } else {
    inst[computedProp] = result;
    return false;
  }
}

/**
 * Computes path changes based on path links set up using the `linkPaths`
 * API.
 *
 * @param {!Polymer_PropertyEffects} inst The instance whose props are changing
 * @param {string} path Path that has changed
 * @param {*} value Value of changed path
 * @return {void}
 * @private
 */
function computeLinkedPaths(inst, path, value) {
  let links = inst.__dataLinkedPaths;
  if (links) {
    let link;
    for (let a in links) {
      let b = links[a];
      if (isDescendant(a, path)) {
        link = translate(a, b, path);
        inst._setPendingPropertyOrPath(link, value, true, true);
      } else if (isDescendant(b, path)) {
        link = translate(b, a, path);
        inst._setPendingPropertyOrPath(link, value, true, true);
      }
    }
  }
}

// -- bindings ----------------------------------------------

/**
 * Adds binding metadata to the current `nodeInfo`, and binding effects
 * for all part dependencies to `templateInfo`.
 *
 * @param {Function} constructor Class that `_parseTemplate` is currently
 *   running on
 * @param {TemplateInfo} templateInfo Template metadata for current template
 * @param {NodeInfo} nodeInfo Node metadata for current template node
 * @param {string} kind Binding kind, either 'property', 'attribute', or 'text'
 * @param {string} target Target property name
 * @param {!Array<!BindingPart>} parts Array of binding part metadata
 * @param {string=} literal Literal text surrounding binding parts (specified
 *   only for 'property' bindings, since these must be initialized as part
 *   of boot-up)
 * @return {void}
 * @private
 */
function addBinding(constructor, templateInfo, nodeInfo, kind, target, parts, literal) {
  // Create binding metadata and add to nodeInfo
  nodeInfo.bindings = nodeInfo.bindings || [];
  let /** Binding */ binding = { kind, target, parts, literal, isCompound: (parts.length !== 1) };
  nodeInfo.bindings.push(binding);
  // Add listener info to binding metadata
  if (shouldAddListener(binding)) {
    let {event, negate} = binding.parts[0];
    binding.listenerEvent = event || (camelToDashCase(target) + '-changed');
    binding.listenerNegate = negate;
  }
  // Add "propagate" property effects to templateInfo
  let index = templateInfo.nodeInfoList.length;
  for (let i=0; i<binding.parts.length; i++) {
    let part = binding.parts[i];
    part.compoundIndex = i;
    addEffectForBindingPart(constructor, templateInfo, binding, part, index);
  }
}

/**
 * Adds property effects to the given `templateInfo` for the given binding
 * part.
 *
 * @param {Function} constructor Class that `_parseTemplate` is currently
 *   running on
 * @param {TemplateInfo} templateInfo Template metadata for current template
 * @param {!Binding} binding Binding metadata
 * @param {!BindingPart} part Binding part metadata
 * @param {number} index Index into `nodeInfoList` for this node
 * @return {void}
 */
function addEffectForBindingPart(constructor, templateInfo, binding, part, index) {
  if (!part.literal) {
    if (binding.kind === 'attribute' && binding.target[0] === '-') {
      console.warn('Cannot set attribute ' + binding.target +
        ' because "-" is not a valid attribute starting character');
    } else {
      let dependencies = part.dependencies;
      let info = { index, binding, part, evaluator: constructor };
      for (let j=0; j<dependencies.length; j++) {
        let trigger = dependencies[j];
        if (typeof trigger == 'string') {
          trigger = parseArg(trigger);
          trigger.wildcard = true;
        }
        constructor._addTemplatePropertyEffect(templateInfo, trigger.rootProperty, {
          fn: runBindingEffect,
          info, trigger
        });
      }
    }
  }
}

/**
 * Implements the "binding" (property/path binding) effect.
 *
 * Note that binding syntax is overridable via `_parseBindings` and
 * `_evaluateBinding`.  This method will call `_evaluateBinding` for any
 * non-literal parts returned from `_parseBindings`.  However,
 * there is no support for _path_ bindings via custom binding parts,
 * as this is specific to Polymer's path binding syntax.
 *
 * @param {!Polymer_PropertyEffects} inst The instance the effect will be run on
 * @param {string} path Name of property
 * @param {Object} props Bag of current property changes
 * @param {Object} oldProps Bag of previous values for changed properties
 * @param {?} info Effect metadata
 * @param {boolean} hasPaths True with `props` contains one or more paths
 * @param {Array} nodeList List of nodes associated with `nodeInfoList` template
 *   metadata
 * @return {void}
 * @private
 */
function runBindingEffect(inst, path, props, oldProps, info, hasPaths, nodeList) {
  let node = nodeList[info.index];
  let binding = info.binding;
  let part = info.part;
  // Subpath notification: transform path and set to client
  // e.g.: foo="{{obj.sub}}", path: 'obj.sub.prop', set 'foo.prop'=obj.sub.prop
  if (hasPaths && part.source && (path.length > part.source.length) &&
      (binding.kind == 'property') && !binding.isCompound &&
      node.__isPropertyEffectsClient &&
      node.__dataHasAccessor && node.__dataHasAccessor[binding.target]) {
    let value = props[path];
    path = translate(part.source, binding.target, path);
    if (node._setPendingPropertyOrPath(path, value, false, true)) {
      inst._enqueueClient(node);
    }
  } else {
    let value = info.evaluator._evaluateBinding(inst, part, path, props, oldProps, hasPaths);
    // Propagate value to child
    // Abort if value is a no-op result
    if (value !== NOOP) {
      applyBindingValue(inst, node, binding, part, value);
    }
  }
}

/**
 * Sets the value for an "binding" (binding) effect to a node,
 * either as a property or attribute.
 *
 * @param {!Polymer_PropertyEffects} inst The instance owning the binding effect
 * @param {Node} node Target node for binding
 * @param {!Binding} binding Binding metadata
 * @param {!BindingPart} part Binding part metadata
 * @param {*} value Value to set
 * @return {void}
 * @private
 */
function applyBindingValue(inst, node, binding, part, value) {
  value = computeBindingValue(node, value, binding, part);
  if (sanitizeDOMValue) {
    value = sanitizeDOMValue(value, binding.target, binding.kind, node);
  }
  if (binding.kind == 'attribute') {
    // Attribute binding
    inst._valueToNodeAttribute(/** @type {Element} */(node), value, binding.target);
  } else {
    // Property binding
    let prop = binding.target;
    if (node.__isPropertyEffectsClient &&
        node.__dataHasAccessor && node.__dataHasAccessor[prop]) {
      if (!node[TYPES.READ_ONLY] || !node[TYPES.READ_ONLY][prop]) {
        if (node._setPendingProperty(prop, value)) {
          inst._enqueueClient(node);
        }
      }
    } else {
      // In legacy no-batching mode, bindings applied before dataReady are
      // equivalent to the "apply config" phase, which only set managed props
      inst._setUnmanagedPropertyToNode(node, prop, value);
    }
  }
}

/**
 * Transforms an "binding" effect value based on compound & negation
 * effect metadata, as well as handling for special-case properties
 *
 * @param {Node} node Node the value will be set to
 * @param {*} value Value to set
 * @param {!Binding} binding Binding metadata
 * @param {!BindingPart} part Binding part metadata
 * @return {*} Transformed value to set
 * @private
 */
function computeBindingValue(node, value, binding, part) {
  if (binding.isCompound) {
    let storage = node.__dataCompoundStorage[binding.target];
    storage[part.compoundIndex] = value;
    value = storage.join('');
  }
  if (binding.kind !== 'attribute') {
    // Some browsers serialize `undefined` to `"undefined"`
    if (binding.target === 'textContent' ||
        (binding.target === 'value' &&
          (node.localName === 'input' || node.localName === 'textarea'))) {
      value = value == undefined ? '' : value;
    }
  }
  return value;
}

/**
 * Returns true if a binding's metadata meets all the requirements to allow
 * 2-way binding, and therefore a `<property>-changed` event listener should be
 * added:
 * - used curly braces
 * - is a property (not attribute) binding
 * - is not a textContent binding
 * - is not compound
 *
 * @param {!Binding} binding Binding metadata
 * @return {boolean} True if 2-way listener should be added
 * @private
 */
function shouldAddListener(binding) {
  return Boolean(binding.target) &&
         binding.kind != 'attribute' &&
         binding.kind != 'text' &&
         !binding.isCompound &&
         binding.parts[0].mode === '{';
}

/**
 * Setup compound binding storage structures, notify listeners, and dataHost
 * references onto the bound nodeList.
 *
 * @param {!Polymer_PropertyEffects} inst Instance that bas been previously
 *     bound
 * @param {TemplateInfo} templateInfo Template metadata
 * @return {void}
 * @private
 */
function setupBindings(inst, templateInfo) {
  // Setup compound storage, dataHost, and notify listeners
  let {nodeList, nodeInfoList} = templateInfo;
  if (nodeInfoList.length) {
    for (let i=0; i < nodeInfoList.length; i++) {
      let info = nodeInfoList[i];
      let node = nodeList[i];
      let bindings = info.bindings;
      if (bindings) {
        for (let i=0; i<bindings.length; i++) {
          let binding = bindings[i];
          setupCompoundStorage(node, binding);
          addNotifyListener(node, inst, binding);
        }
      }
      // This ensures all bound elements have a host set, regardless
      // of whether they upgrade synchronous to creation
      node.__dataHost = inst;
    }
  }
}

/**
 * Initializes `__dataCompoundStorage` local storage on a bound node with
 * initial literal data for compound bindings, and sets the joined
 * literal parts to the bound property.
 *
 * When changes to compound parts occur, they are first set into the compound
 * storage array for that property, and then the array is joined to result in
 * the final value set to the property/attribute.
 *
 * @param {Node} node Bound node to initialize
 * @param {Binding} binding Binding metadata
 * @return {void}
 * @private
 */
function setupCompoundStorage(node, binding) {
  if (binding.isCompound) {
    // Create compound storage map
    let storage = node.__dataCompoundStorage ||
      (node.__dataCompoundStorage = {});
    let parts = binding.parts;
    // Copy literals from parts into storage for this binding
    let literals = new Array(parts.length);
    for (let j=0; j<parts.length; j++) {
      literals[j] = parts[j].literal;
    }
    let target = binding.target;
    storage[target] = literals;
    // Configure properties with their literal parts
    if (binding.literal && binding.kind == 'property') {
      // Note, className needs style scoping so this needs wrapping.
      // We may also want to consider doing this for `textContent` and
      // `innerHTML`.
      if (target === 'className') {
        node = wrap(node);
      }
      node[target] = binding.literal;
    }
  }
}

/**
 * Adds a 2-way binding notification event listener to the node specified
 *
 * @param {Object} node Child element to add listener to
 * @param {!Polymer_PropertyEffects} inst Host element instance to handle
 *     notification event
 * @param {Binding} binding Binding metadata
 * @return {void}
 * @private
 */
function addNotifyListener(node, inst, binding) {
  if (binding.listenerEvent) {
    let part = binding.parts[0];
    node.addEventListener(binding.listenerEvent, function(e) {
      handleNotification(e, inst, binding.target, part.source, part.negate);
    });
  }
}

// -- for method-based effects (complexObserver & computed) --------------

/**
 * Adds property effects for each argument in the method signature (and
 * optionally, for the method name if `dynamic` is true) that calls the
 * provided effect function.
 *
 * @param {Element | Object} model Prototype or instance
 * @param {!MethodSignature} sig Method signature metadata
 * @param {string} type Type of property effect to add
 * @param {Function} effectFn Function to run when arguments change
 * @param {*=} methodInfo Effect-specific information to be included in
 *   method effect metadata
 * @param {boolean|Object=} dynamicFn Boolean or object map indicating whether
 *   method names should be included as a dependency to the effect. Note,
 *   defaults to true if the signature is static (sig.static is true).
 * @return {!Object} Effect metadata for this method effect
 * @private
 */
function createMethodEffect(model, sig, type, effectFn, methodInfo, dynamicFn) {
  dynamicFn = sig.static || (dynamicFn &&
    (typeof dynamicFn !== 'object' || dynamicFn[sig.methodName]));
  let info = {
    methodName: sig.methodName,
    args: sig.args,
    methodInfo,
    dynamicFn
  };
  for (let i=0, arg; (i<sig.args.length) && (arg=sig.args[i]); i++) {
    if (!arg.literal) {
      model._addPropertyEffect(arg.rootProperty, type, {
        fn: effectFn, info: info, trigger: arg
      });
    }
  }
  if (dynamicFn) {
    model._addPropertyEffect(sig.methodName, type, {
      fn: effectFn, info: info
    });
  }
  return info;
}

/**
 * Calls a method with arguments marshaled from properties on the instance
 * based on the method signature contained in the effect metadata.
 *
 * Multi-property observers, computed properties, and inline computing
 * functions call this function to invoke the method, then use the return
 * value accordingly.
 *
 * @param {!Polymer_PropertyEffects} inst The instance the effect will be run on
 * @param {string} property Name of property
 * @param {Object} props Bag of current property changes
 * @param {Object} oldProps Bag of previous values for changed properties
 * @param {?} info Effect metadata
 * @return {*} Returns the return value from the method invocation
 * @private
 */
function runMethodEffect(inst, property, props, oldProps, info) {
  // Instances can optionally have a _methodHost which allows redirecting where
  // to find methods. Currently used by `templatize`.
  let context = inst._methodHost || inst;
  let fn = context[info.methodName];
  if (fn) {
    let args = inst._marshalArgs(info.args, property, props);
    return args === NOOP ? NOOP : fn.apply(context, args);
  } else if (!info.dynamicFn) {
    console.warn('method `' + info.methodName + '` not defined');
  }
}

const emptyArray = [];

// Regular expressions used for binding
const IDENT  = '(?:' + '[a-zA-Z_$][\\w.:$\\-*]*' + ')';
const NUMBER = '(?:' + '[-+]?[0-9]*\\.?[0-9]+(?:[eE][-+]?[0-9]+)?' + ')';
const SQUOTE_STRING = '(?:' + '\'(?:[^\'\\\\]|\\\\.)*\'' + ')';
const DQUOTE_STRING = '(?:' + '"(?:[^"\\\\]|\\\\.)*"' + ')';
const STRING = '(?:' + SQUOTE_STRING + '|' + DQUOTE_STRING + ')';
const ARGUMENT = '(?:(' + IDENT + '|' + NUMBER + '|' +  STRING + ')\\s*' + ')';
const ARGUMENTS = '(?:' + ARGUMENT + '(?:,\\s*' + ARGUMENT + ')*' + ')';
const ARGUMENT_LIST = '(?:' + '\\(\\s*' +
                              '(?:' + ARGUMENTS + '?' + ')' +
                            '\\)\\s*' + ')';
const BINDING = '(' + IDENT + '\\s*' + ARGUMENT_LIST + '?' + ')'; // Group 3
const OPEN_BRACKET = '(\\[\\[|{{)' + '\\s*';
const CLOSE_BRACKET = '(?:]]|}})';
const NEGATE = '(?:(!)\\s*)?'; // Group 2
const EXPRESSION = OPEN_BRACKET + NEGATE + BINDING + CLOSE_BRACKET;
const bindingRegex = new RegExp(EXPRESSION, "g");

/**
 * Create a string from binding parts of all the literal parts
 *
 * @param {!Array<BindingPart>} parts All parts to stringify
 * @return {string} String made from the literal parts
 */
function literalFromParts(parts) {
  let s = '';
  for (let i=0; i<parts.length; i++) {
    let literal = parts[i].literal;
    s += literal || '';
  }
  return s;
}

/**
 * Parses an expression string for a method signature, and returns a metadata
 * describing the method in terms of `methodName`, `static` (whether all the
 * arguments are literals), and an array of `args`
 *
 * @param {string} expression The expression to parse
 * @return {?MethodSignature} The method metadata object if a method expression was
 *   found, otherwise `undefined`
 * @private
 */
function parseMethod(expression) {
  // tries to match valid javascript property names
  let m = expression.match(/([^\s]+?)\(([\s\S]*)\)/);
  if (m) {
    let methodName = m[1];
    let sig = { methodName, static: true, args: emptyArray };
    if (m[2].trim()) {
      // replace escaped commas with comma entity, split on un-escaped commas
      let args = m[2].replace(/\\,/g, '&comma;').split(',');
      return parseArgs(args, sig);
    } else {
      return sig;
    }
  }
  return null;
}

/**
 * Parses an array of arguments and sets the `args` property of the supplied
 * signature metadata object. Sets the `static` property to false if any
 * argument is a non-literal.
 *
 * @param {!Array<string>} argList Array of argument names
 * @param {!MethodSignature} sig Method signature metadata object
 * @return {!MethodSignature} The updated signature metadata object
 * @private
 */
function parseArgs(argList, sig) {
  sig.args = argList.map(function(rawArg) {
    let arg = parseArg(rawArg);
    if (!arg.literal) {
      sig.static = false;
    }
    return arg;
  }, this);
  return sig;
}

/**
 * Parses an individual argument, and returns an argument metadata object
 * with the following fields:
 *
 *   {
 *     value: 'prop',        // property/path or literal value
 *     literal: false,       // whether argument is a literal
 *     structured: false,    // whether the property is a path
 *     rootProperty: 'prop', // the root property of the path
 *     wildcard: false       // whether the argument was a wildcard '.*' path
 *   }
 *
 * @param {string} rawArg The string value of the argument
 * @return {!MethodArg} Argument metadata object
 * @private
 */
function parseArg(rawArg) {
  // clean up whitespace
  let arg = rawArg.trim()
    // replace comma entity with comma
    .replace(/&comma;/g, ',')
    // repair extra escape sequences; note only commas strictly need
    // escaping, but we allow any other char to be escaped since its
    // likely users will do this
    .replace(/\\(.)/g, '$1')
    ;
  // basic argument descriptor
  let a = {
    name: arg,
    value: '',
    literal: false
  };
  // detect literal value (must be String or Number)
  let fc = arg[0];
  if (fc === '-') {
    fc = arg[1];
  }
  if (fc >= '0' && fc <= '9') {
    fc = '#';
  }
  switch(fc) {
    case "'":
    case '"':
      a.value = arg.slice(1, -1);
      a.literal = true;
      break;
    case '#':
      a.value = Number(arg);
      a.literal = true;
      break;
  }
  // if not literal, look for structured path
  if (!a.literal) {
    a.rootProperty = root(arg);
    // detect structured path (has dots)
    a.structured = isPath(arg);
    if (a.structured) {
      a.wildcard = (arg.slice(-2) == '.*');
      if (a.wildcard) {
        a.name = arg.slice(0, -2);
      }
    }
  }
  return a;
}

function getArgValue(data, props, path) {
  let value = get(data, path);
  // when data is not stored e.g. `splices`, get the value from changedProps
  // TODO(kschaaf): Note, this can cause a rare issue where the wildcard
  // info.value could pull a stale value out of changedProps during a reentrant
  // change that sets the value back to undefined.
  // https://github.com/Polymer/polymer/issues/5479
  if (value === undefined) {
    value = props[path];
  }
  return value;
}

// data api

/**
 * Sends array splice notifications (`.splices` and `.length`)
 *
 * Note: this implementation only accepts normalized paths
 *
 * @param {!Polymer_PropertyEffects} inst Instance to send notifications to
 * @param {Array} array The array the mutations occurred on
 * @param {string} path The path to the array that was mutated
 * @param {Array} splices Array of splice records
 * @return {void}
 * @private
 */
function notifySplices(inst, array, path, splices) {
  const splicesData = { indexSplices: splices };
  // Legacy behavior stored splices in `__data__` so it was *not* ephemeral.
  // To match this behavior, we store splices directly on the array.
  if (legacyUndefined && !inst._overrideLegacyUndefined) {
    array.splices = splicesData;
  }
  inst.notifyPath(path + '.splices', splicesData);
  inst.notifyPath(path + '.length', array.length);
  // Clear splice data only when it's stored on the array.
  if (legacyUndefined && !inst._overrideLegacyUndefined) {
    splicesData.indexSplices = [];
  }
}

/**
 * Creates a splice record and sends an array splice notification for
 * the described mutation
 *
 * Note: this implementation only accepts normalized paths
 *
 * @param {!Polymer_PropertyEffects} inst Instance to send notifications to
 * @param {Array} array The array the mutations occurred on
 * @param {string} path The path to the array that was mutated
 * @param {number} index Index at which the array mutation occurred
 * @param {number} addedCount Number of added items
 * @param {Array} removed Array of removed items
 * @return {void}
 * @private
 */
function notifySplice(inst, array, path, index, addedCount, removed) {
  notifySplices(inst, array, path, [{
    index: index,
    addedCount: addedCount,
    removed: removed,
    object: array,
    type: 'splice'
  }]);
}

/**
 * Returns an upper-cased version of the string.
 *
 * @param {string} name String to uppercase
 * @return {string} Uppercased string
 * @private
 */
function upper(name) {
  return name[0].toUpperCase() + name.substring(1);
}

/**
 * Element class mixin that provides meta-programming for Polymer's template
 * binding and data observation (collectively, "property effects") system.
 *
 * This mixin uses provides the following key static methods for adding
 * property effects to an element class:
 * - `addPropertyEffect`
 * - `createPropertyObserver`
 * - `createMethodObserver`
 * - `createNotifyingProperty`
 * - `createReadOnlyProperty`
 * - `createReflectedProperty`
 * - `createComputedProperty`
 * - `bindTemplate`
 *
 * Each method creates one or more property accessors, along with metadata
 * used by this mixin's implementation of `_propertiesChanged` to perform
 * the property effects.
 *
 * Underscored versions of the above methods also exist on the element
 * prototype for adding property effects on instances at runtime.
 *
 * Note that this mixin overrides several `PropertyAccessors` methods, in
 * many cases to maintain guarantees provided by the Polymer 1.x features;
 * notably it changes property accessors to be synchronous by default
 * whereas the default when using `PropertyAccessors` standalone is to be
 * async by default.
 *
 * @mixinFunction
 * @polymer
 * @appliesMixin TemplateStamp
 * @appliesMixin PropertyAccessors
 * @summary Element class mixin that provides meta-programming for Polymer's
 * template binding and data observation system.
 */
const PropertyEffects = dedupingMixin(superClass => {

  /**
   * @constructor
   * @implements {Polymer_PropertyAccessors}
   * @implements {Polymer_TemplateStamp}
   * @unrestricted
   * @private
   */
  const propertyEffectsBase = TemplateStamp(PropertyAccessors(superClass));

  /**
   * @polymer
   * @mixinClass
   * @implements {Polymer_PropertyEffects}
   * @extends {propertyEffectsBase}
   * @unrestricted
   */
  class PropertyEffects extends propertyEffectsBase {

    constructor() {
      super();
      /** @type {boolean} */
      // Used to identify users of this mixin, ala instanceof
      this.__isPropertyEffectsClient = true;
      /** @type {boolean} */
      this.__dataClientsReady;
      /** @type {Array} */
      this.__dataPendingClients;
      /** @type {Object} */
      this.__dataToNotify;
      /** @type {Object} */
      this.__dataLinkedPaths;
      /** @type {boolean} */
      this.__dataHasPaths;
      /** @type {Object} */
      this.__dataCompoundStorage;
      /** @type {Polymer_PropertyEffects} */
      this.__dataHost;
      /** @type {!Object} */
      this.__dataTemp;
      /** @type {boolean} */
      this.__dataClientsInitialized;
      /** @type {!Object} */
      this.__data;
      /** @type {!Object|null} */
      this.__dataPending;
      /** @type {!Object} */
      this.__dataOld;
      /** @type {Object} */
      this.__computeEffects;
      /** @type {Object} */
      this.__computeInfo;
      /** @type {Object} */
      this.__reflectEffects;
      /** @type {Object} */
      this.__notifyEffects;
      /** @type {Object} */
      this.__propagateEffects;
      /** @type {Object} */
      this.__observeEffects;
      /** @type {Object} */
      this.__readOnly;
      /** @type {!TemplateInfo} */
      this.__templateInfo;
      /** @type {boolean} */
      this._overrideLegacyUndefined;
    }

    get PROPERTY_EFFECT_TYPES() {
      return TYPES;
    }

    /**
     * @override
     * @return {void}
     */
    _initializeProperties() {
      super._initializeProperties();
      this._registerHost();
      this.__dataClientsReady = false;
      this.__dataPendingClients = null;
      this.__dataToNotify = null;
      this.__dataLinkedPaths = null;
      this.__dataHasPaths = false;
      // May be set on instance prior to upgrade
      this.__dataCompoundStorage = this.__dataCompoundStorage || null;
      this.__dataHost = this.__dataHost || null;
      this.__dataTemp = {};
      this.__dataClientsInitialized = false;
    }

    _registerHost() {
      if (hostStack.length) {
        let host = hostStack[hostStack.length-1];
        host._enqueueClient(this);
        // This ensures even non-bound elements have a host set, as
        // long as they upgrade synchronously
        this.__dataHost = host;
      }
    }

    /**
     * Overrides `PropertyAccessors` implementation to provide a
     * more efficient implementation of initializing properties from
     * the prototype on the instance.
     *
     * @override
     * @param {Object} props Properties to initialize on the prototype
     * @return {void}
     */
    _initializeProtoProperties(props) {
      this.__data = Object.create(props);
      this.__dataPending = Object.create(props);
      this.__dataOld = {};
    }

    /**
     * Overrides `PropertyAccessors` implementation to avoid setting
     * `_setProperty`'s `shouldNotify: true`.
     *
     * @override
     * @param {Object} props Properties to initialize on the instance
     * @return {void}
     */
    _initializeInstanceProperties(props) {
      let readOnly = this[TYPES.READ_ONLY];
      for (let prop in props) {
        if (!readOnly || !readOnly[prop]) {
          this.__dataPending = this.__dataPending || {};
          this.__dataOld = this.__dataOld || {};
          this.__data[prop] = this.__dataPending[prop] = props[prop];
        }
      }
    }

    // Prototype setup ----------------------------------------

    /**
     * Equivalent to static `addPropertyEffect` API but can be called on
     * an instance to add effects at runtime.  See that method for
     * full API docs.
     *
     * @override
     * @param {string} property Property that should trigger the effect
     * @param {string} type Effect type, from this.PROPERTY_EFFECT_TYPES
     * @param {Object=} effect Effect metadata object
     * @return {void}
     * @protected
     */
    _addPropertyEffect(property, type, effect) {
      this._createPropertyAccessor(property, type == TYPES.READ_ONLY);
      // effects are accumulated into arrays per property based on type
      let effects = ensureOwnEffectMap(this, type, true)[property];
      if (!effects) {
        effects = this[type][property] = [];
      }
      effects.push(effect);
    }

    /**
     * Removes the given property effect.
     *
     * @override
     * @param {string} property Property the effect was associated with
     * @param {string} type Effect type, from this.PROPERTY_EFFECT_TYPES
     * @param {Object=} effect Effect metadata object to remove
     * @return {void}
     */
    _removePropertyEffect(property, type, effect) {
      let effects = ensureOwnEffectMap(this, type, true)[property];
      let idx = effects.indexOf(effect);
      if (idx >= 0) {
        effects.splice(idx, 1);
      }
    }

    /**
     * Returns whether the current prototype/instance has a property effect
     * of a certain type.
     *
     * @override
     * @param {string} property Property name
     * @param {string=} type Effect type, from this.PROPERTY_EFFECT_TYPES
     * @return {boolean} True if the prototype/instance has an effect of this
     *     type
     * @protected
     */
    _hasPropertyEffect(property, type) {
      let effects = this[type];
      return Boolean(effects && effects[property]);
    }

    /**
     * Returns whether the current prototype/instance has a "read only"
     * accessor for the given property.
     *
     * @override
     * @param {string} property Property name
     * @return {boolean} True if the prototype/instance has an effect of this
     *     type
     * @protected
     */
    _hasReadOnlyEffect(property) {
      return this._hasPropertyEffect(property, TYPES.READ_ONLY);
    }

    /**
     * Returns whether the current prototype/instance has a "notify"
     * property effect for the given property.
     *
     * @override
     * @param {string} property Property name
     * @return {boolean} True if the prototype/instance has an effect of this
     *     type
     * @protected
     */
    _hasNotifyEffect(property) {
      return this._hasPropertyEffect(property, TYPES.NOTIFY);
    }

    /**
     * Returns whether the current prototype/instance has a "reflect to
     * attribute" property effect for the given property.
     *
     * @override
     * @param {string} property Property name
     * @return {boolean} True if the prototype/instance has an effect of this
     *     type
     * @protected
     */
    _hasReflectEffect(property) {
      return this._hasPropertyEffect(property, TYPES.REFLECT);
    }

    /**
     * Returns whether the current prototype/instance has a "computed"
     * property effect for the given property.
     *
     * @override
     * @param {string} property Property name
     * @return {boolean} True if the prototype/instance has an effect of this
     *     type
     * @protected
     */
    _hasComputedEffect(property) {
      return this._hasPropertyEffect(property, TYPES.COMPUTE);
    }

    // Runtime ----------------------------------------

    /**
     * Sets a pending property or path.  If the root property of the path in
     * question had no accessor, the path is set, otherwise it is enqueued
     * via `_setPendingProperty`.
     *
     * This function isolates relatively expensive functionality necessary
     * for the public API (`set`, `setProperties`, `notifyPath`, and property
     * change listeners via {{...}} bindings), such that it is only done
     * when paths enter the system, and not at every propagation step.  It
     * also sets a `__dataHasPaths` flag on the instance which is used to
     * fast-path slower path-matching code in the property effects host paths.
     *
     * `path` can be a path string or array of path parts as accepted by the
     * public API.
     *
     * @override
     * @param {string | !Array<number|string>} path Path to set
     * @param {*} value Value to set
     * @param {boolean=} shouldNotify Set to true if this change should
     *  cause a property notification event dispatch
     * @param {boolean=} isPathNotification If the path being set is a path
     *   notification of an already changed value, as opposed to a request
     *   to set and notify the change.  In the latter `false` case, a dirty
     *   check is performed and then the value is set to the path before
     *   enqueuing the pending property change.
     * @return {boolean} Returns true if the property/path was enqueued in
     *   the pending changes bag.
     * @protected
     */
    _setPendingPropertyOrPath(path, value, shouldNotify, isPathNotification) {
      if (isPathNotification ||
          root(Array.isArray(path) ? path[0] : path) !== path) {
        // Dirty check changes being set to a path against the actual object,
        // since this is the entry point for paths into the system; from here
        // the only dirty checks are against the `__dataTemp` cache to prevent
        // duplicate work in the same turn only. Note, if this was a notification
        // of a change already set to a path (isPathNotification: true),
        // we always let the change through and skip the `set` since it was
        // already dirty checked at the point of entry and the underlying
        // object has already been updated
        if (!isPathNotification) {
          let old = get(this, path);
          path = /** @type {string} */ (set(this, path, value));
          // Use property-accessor's simpler dirty check
          if (!path || !super._shouldPropertyChange(path, value, old)) {
            return false;
          }
        }
        this.__dataHasPaths = true;
        if (this._setPendingProperty(/**@type{string}*/(path), value, shouldNotify)) {
          computeLinkedPaths(this, /**@type{string}*/ (path), value);
          return true;
        }
      } else {
        if (this.__dataHasAccessor && this.__dataHasAccessor[path]) {
          return this._setPendingProperty(/**@type{string}*/(path), value, shouldNotify);
        } else {
          this[path] = value;
        }
      }
      return false;
    }

    /**
     * Applies a value to a non-Polymer element/node's property.
     *
     * The implementation makes a best-effort at binding interop:
     * Some native element properties have side-effects when
     * re-setting the same value (e.g. setting `<input>.value` resets the
     * cursor position), so we do a dirty-check before setting the value.
     * However, for better interop with non-Polymer custom elements that
     * accept objects, we explicitly re-set object changes coming from the
     * Polymer world (which may include deep object changes without the
     * top reference changing), erring on the side of providing more
     * information.
     *
     * Users may override this method to provide alternate approaches.
     *
     * @override
     * @param {!Node} node The node to set a property on
     * @param {string} prop The property to set
     * @param {*} value The value to set
     * @return {void}
     * @protected
     */
    _setUnmanagedPropertyToNode(node, prop, value) {
      // It is a judgment call that resetting primitives is
      // "bad" and resettings objects is also "good"; alternatively we could
      // implement a whitelist of tag & property values that should never
      // be reset (e.g. <input>.value && <select>.value)
      if (value !== node[prop] || typeof value == 'object') {
        // Note, className needs style scoping so this needs wrapping.
        if (prop === 'className') {
          node = /** @type {!Node} */(wrap(node));
        }
        node[prop] = value;
      }
    }

    /**
     * Overrides the `PropertiesChanged` implementation to introduce special
     * dirty check logic depending on the property & value being set:
     *
     * 1. Any value set to a path (e.g. 'obj.prop': 42 or 'obj.prop': {...})
     *    Stored in `__dataTemp`, dirty checked against `__dataTemp`
     * 2. Object set to simple property (e.g. 'prop': {...})
     *    Stored in `__dataTemp` and `__data`, dirty checked against
     *    `__dataTemp` by default implementation of `_shouldPropertyChange`
     * 3. Primitive value set to simple property (e.g. 'prop': 42)
     *    Stored in `__data`, dirty checked against `__data`
     *
     * The dirty-check is important to prevent cycles due to two-way
     * notification, but paths and objects are only dirty checked against any
     * previous value set during this turn via a "temporary cache" that is
     * cleared when the last `_propertiesChanged` exits. This is so:
     * a. any cached array paths (e.g. 'array.3.prop') may be invalidated
     *    due to array mutations like shift/unshift/splice; this is fine
     *    since path changes are dirty-checked at user entry points like `set`
     * b. dirty-checking for objects only lasts one turn to allow the user
     *    to mutate the object in-place and re-set it with the same identity
     *    and have all sub-properties re-propagated in a subsequent turn.
     *
     * The temp cache is not necessarily sufficient to prevent invalid array
     * paths, since a splice can happen during the same turn (with pathological
     * user code); we could introduce a "fixup" for temporarily cached array
     * paths if needed: https://github.com/Polymer/polymer/issues/4227
     *
     * @override
     * @param {string} property Name of the property
     * @param {*} value Value to set
     * @param {boolean=} shouldNotify True if property should fire notification
     *   event (applies only for `notify: true` properties)
     * @return {boolean} Returns true if the property changed
     */
    _setPendingProperty(property, value, shouldNotify) {
      let propIsPath = this.__dataHasPaths && isPath(property);
      let prevProps = propIsPath ? this.__dataTemp : this.__data;
      if (this._shouldPropertyChange(property, value, prevProps[property])) {
        if (!this.__dataPending) {
          this.__dataPending = {};
          this.__dataOld = {};
        }
        // Ensure old is captured from the last turn
        if (!(property in this.__dataOld)) {
          this.__dataOld[property] = this.__data[property];
        }
        // Paths are stored in temporary cache (cleared at end of turn),
        // which is used for dirty-checking, all others stored in __data
        if (propIsPath) {
          this.__dataTemp[property] = value;
        } else {
          this.__data[property] = value;
        }
        // All changes go into pending property bag, passed to _propertiesChanged
        this.__dataPending[property] = value;
        // Track properties that should notify separately
        if (propIsPath || (this[TYPES.NOTIFY] && this[TYPES.NOTIFY][property])) {
          this.__dataToNotify = this.__dataToNotify || {};
          this.__dataToNotify[property] = shouldNotify;
        }
        return true;
      }
      return false;
    }

    /**
     * Overrides base implementation to ensure all accessors set `shouldNotify`
     * to true, for per-property notification tracking.
     *
     * @override
     * @param {string} property Name of the property
     * @param {*} value Value to set
     * @return {void}
     */
    _setProperty(property, value) {
      if (this._setPendingProperty(property, value, true)) {
        this._invalidateProperties();
      }
    }

    /**
     * Overrides `PropertyAccessor`'s default async queuing of
     * `_propertiesChanged`: if `__dataReady` is false (has not yet been
     * manually flushed), the function no-ops; otherwise flushes
     * `_propertiesChanged` synchronously.
     *
     * @override
     * @return {void}
     */
    _invalidateProperties() {
      if (this.__dataReady) {
        this._flushProperties();
      }
    }

    /**
     * Enqueues the given client on a list of pending clients, whose
     * pending property changes can later be flushed via a call to
     * `_flushClients`.
     *
     * @override
     * @param {Object} client PropertyEffects client to enqueue
     * @return {void}
     * @protected
     */
    _enqueueClient(client) {
      this.__dataPendingClients = this.__dataPendingClients || [];
      if (client !== this) {
        this.__dataPendingClients.push(client);
      }
    }

    /**
     * Flushes any clients previously enqueued via `_enqueueClient`, causing
     * their `_flushProperties` method to run.
     *
     * @override
     * @return {void}
     * @protected
     */
    _flushClients() {
      if (!this.__dataClientsReady) {
        this.__dataClientsReady = true;
        this._readyClients();
        // Override point where accessors are turned on; importantly,
        // this is after clients have fully readied, providing a guarantee
        // that any property effects occur only after all clients are ready.
        this.__dataReady = true;
      } else {
        this.__enableOrFlushClients();
      }
    }

    // NOTE: We ensure clients either enable or flush as appropriate. This
    // handles two corner cases:
    // (1) clients flush properly when connected/enabled before the host
    // enables; e.g.
    //   (a) Templatize stamps with no properties and does not flush and
    //   (b) the instance is inserted into dom and
    //   (c) then the instance flushes.
    // (2) clients enable properly when not connected/enabled when the host
    // flushes; e.g.
    //   (a) a template is runtime stamped and not yet connected/enabled
    //   (b) a host sets a property, causing stamped dom to flush
    //   (c) the stamped dom enables.
    __enableOrFlushClients() {
      let clients = this.__dataPendingClients;
      if (clients) {
        this.__dataPendingClients = null;
        for (let i=0; i < clients.length; i++) {
          let client = clients[i];
          if (!client.__dataEnabled) {
            client._enableProperties();
          } else if (client.__dataPending) {
            client._flushProperties();
          }
        }
      }
    }

    /**
     * Perform any initial setup on client dom. Called before the first
     * `_flushProperties` call on client dom and before any element
     * observers are called.
     *
     * @override
     * @return {void}
     * @protected
     */
    _readyClients() {
      this.__enableOrFlushClients();
    }

    /**
     * Sets a bag of property changes to this instance, and
     * synchronously processes all effects of the properties as a batch.
     *
     * Property names must be simple properties, not paths.  Batched
     * path propagation is not supported.
     *
     * @override
     * @param {Object} props Bag of one or more key-value pairs whose key is
     *   a property and value is the new value to set for that property.
     * @param {boolean=} setReadOnly When true, any private values set in
     *   `props` will be set. By default, `setProperties` will not set
     *   `readOnly: true` root properties.
     * @return {void}
     * @public
     */
    setProperties(props, setReadOnly) {
      for (let path in props) {
        if (setReadOnly || !this[TYPES.READ_ONLY] || !this[TYPES.READ_ONLY][path]) {
          //TODO(kschaaf): explicitly disallow paths in setProperty?
          // wildcard observers currently only pass the first changed path
          // in the `info` object, and you could do some odd things batching
          // paths, e.g. {'foo.bar': {...}, 'foo': null}
          this._setPendingPropertyOrPath(path, props[path], true);
        }
      }
      this._invalidateProperties();
    }

    /**
     * Overrides `PropertyAccessors` so that property accessor
     * side effects are not enabled until after client dom is fully ready.
     * Also calls `_flushClients` callback to ensure client dom is enabled
     * that was not enabled as a result of flushing properties.
     *
     * @override
     * @return {void}
     */
    ready() {
      // It is important that `super.ready()` is not called here as it
      // immediately turns on accessors. Instead, we wait until `readyClients`
      // to enable accessors to provide a guarantee that clients are ready
      // before processing any accessors side effects.
      this._flushProperties();
      // If no data was pending, `_flushProperties` will not `flushClients`
      // so ensure this is done.
      if (!this.__dataClientsReady) {
        this._flushClients();
      }
      // Before ready, client notifications do not trigger _flushProperties.
      // Therefore a flush is necessary here if data has been set.
      if (this.__dataPending) {
        this._flushProperties();
      }
    }

    /**
     * Implements `PropertyAccessors`'s properties changed callback.
     *
     * Runs each class of effects for the batch of changed properties in
     * a specific order (compute, propagate, reflect, observe, notify).
     *
     * @override
     * @param {!Object} currentProps Bag of all current accessor values
     * @param {?Object} changedProps Bag of properties changed since the last
     *   call to `_propertiesChanged`
     * @param {?Object} oldProps Bag of previous values for each property
     *   in `changedProps`
     * @return {void}
     */
    _propertiesChanged(currentProps, changedProps, oldProps) {
      // ----------------------------
      // let c = Object.getOwnPropertyNames(changedProps || {});
      // window.debug && console.group(this.localName + '#' + this.id + ': ' + c);
      // if (window.debug) { debugger; }
      // ----------------------------
      let hasPaths = this.__dataHasPaths;
      this.__dataHasPaths = false;
      let notifyProps;
      // Compute properties
      runComputedEffects(this, changedProps, oldProps, hasPaths);
      // Clear notify properties prior to possible reentry (propagate, observe),
      // but after computing effects have a chance to add to them
      notifyProps = this.__dataToNotify;
      this.__dataToNotify = null;
      // Propagate properties to clients
      this._propagatePropertyChanges(changedProps, oldProps, hasPaths);
      // Flush clients
      this._flushClients();
      // Reflect properties
      runEffects(this, this[TYPES.REFLECT], changedProps, oldProps, hasPaths);
      // Observe properties
      runEffects(this, this[TYPES.OBSERVE], changedProps, oldProps, hasPaths);
      // Notify properties to host
      if (notifyProps) {
        runNotifyEffects(this, notifyProps, changedProps, oldProps, hasPaths);
      }
      // Clear temporary cache at end of turn
      if (this.__dataCounter == 1) {
        this.__dataTemp = {};
      }
      // ----------------------------
      // window.debug && console.groupEnd(this.localName + '#' + this.id + ': ' + c);
      // ----------------------------
    }

    /**
     * Called to propagate any property changes to stamped template nodes
     * managed by this element.
     *
     * @override
     * @param {Object} changedProps Bag of changed properties
     * @param {Object} oldProps Bag of previous values for changed properties
     * @param {boolean} hasPaths True with `props` contains one or more paths
     * @return {void}
     * @protected
     */
    _propagatePropertyChanges(changedProps, oldProps, hasPaths) {
      if (this[TYPES.PROPAGATE]) {
        runEffects(this, this[TYPES.PROPAGATE], changedProps, oldProps, hasPaths);
      }
      if (this.__templateInfo) {
        this._runEffectsForTemplate(this.__templateInfo, changedProps, oldProps, hasPaths);
      }
    }

    _runEffectsForTemplate(templateInfo, changedProps, oldProps, hasPaths) {
      const baseRunEffects = (changedProps, hasPaths) => {
        runEffects(this, templateInfo.propertyEffects, changedProps, oldProps,
          hasPaths, templateInfo.nodeList);
        for (let info=templateInfo.firstChild; info; info=info.nextSibling) {
          this._runEffectsForTemplate(info, changedProps, oldProps, hasPaths);
        }
      };
      if (templateInfo.runEffects) {
        templateInfo.runEffects(baseRunEffects, changedProps, hasPaths);
      } else {
        baseRunEffects(changedProps, hasPaths);
      }
    }

    /**
     * Aliases one data path as another, such that path notifications from one
     * are routed to the other.
     *
     * @override
     * @param {string | !Array<string|number>} to Target path to link.
     * @param {string | !Array<string|number>} from Source path to link.
     * @return {void}
     * @public
     */
    linkPaths(to, from) {
      to = normalize(to);
      from = normalize(from);
      this.__dataLinkedPaths = this.__dataLinkedPaths || {};
      this.__dataLinkedPaths[to] = from;
    }

    /**
     * Removes a data path alias previously established with `_linkPaths`.
     *
     * Note, the path to unlink should be the target (`to`) used when
     * linking the paths.
     *
     * @override
     * @param {string | !Array<string|number>} path Target path to unlink.
     * @return {void}
     * @public
     */
    unlinkPaths(path) {
      path = normalize(path);
      if (this.__dataLinkedPaths) {
        delete this.__dataLinkedPaths[path];
      }
    }

    /**
     * Notify that an array has changed.
     *
     * Example:
     *
     *     this.items = [ {name: 'Jim'}, {name: 'Todd'}, {name: 'Bill'} ];
     *     ...
     *     this.items.splice(1, 1, {name: 'Sam'});
     *     this.items.push({name: 'Bob'});
     *     this.notifySplices('items', [
     *       { index: 1, removed: [{name: 'Todd'}], addedCount: 1,
     *         object: this.items, type: 'splice' },
     *       { index: 3, removed: [], addedCount: 1,
     *         object: this.items, type: 'splice'}
     *     ]);
     *
     * @param {string} path Path that should be notified.
     * @param {Array} splices Array of splice records indicating ordered
     *   changes that occurred to the array. Each record should have the
     *   following fields:
     *    * index: index at which the change occurred
     *    * removed: array of items that were removed from this index
     *    * addedCount: number of new items added at this index
     *    * object: a reference to the array in question
     *    * type: the string literal 'splice'
     *
     *   Note that splice records _must_ be normalized such that they are
     *   reported in index order (raw results from `Object.observe` are not
     *   ordered and must be normalized/merged before notifying).
     *
     * @override
     * @return {void}
     * @public
     */
    notifySplices(path, splices) {
      let info = {path: ''};
      let array = /** @type {Array} */(get(this, path, info));
      notifySplices(this, array, info.path, splices);
    }

    /**
     * Convenience method for reading a value from a path.
     *
     * Note, if any part in the path is undefined, this method returns
     * `undefined` (this method does not throw when dereferencing undefined
     * paths).
     *
     * @override
     * @param {(string|!Array<(string|number)>)} path Path to the value
     *   to read.  The path may be specified as a string (e.g. `foo.bar.baz`)
     *   or an array of path parts (e.g. `['foo.bar', 'baz']`).  Note that
     *   bracketed expressions are not supported; string-based path parts
     *   *must* be separated by dots.  Note that when dereferencing array
     *   indices, the index may be used as a dotted part directly
     *   (e.g. `users.12.name` or `['users', 12, 'name']`).
     * @param {Object=} root Root object from which the path is evaluated.
     * @return {*} Value at the path, or `undefined` if any part of the path
     *   is undefined.
     * @public
     */
    get(path, root) {
      return get(root || this, path);
    }

    /**
     * Convenience method for setting a value to a path and notifying any
     * elements bound to the same path.
     *
     * Note, if any part in the path except for the last is undefined,
     * this method does nothing (this method does not throw when
     * dereferencing undefined paths).
     *
     * @override
     * @param {(string|!Array<(string|number)>)} path Path to the value
     *   to write.  The path may be specified as a string (e.g. `'foo.bar.baz'`)
     *   or an array of path parts (e.g. `['foo.bar', 'baz']`).  Note that
     *   bracketed expressions are not supported; string-based path parts
     *   *must* be separated by dots.  Note that when dereferencing array
     *   indices, the index may be used as a dotted part directly
     *   (e.g. `'users.12.name'` or `['users', 12, 'name']`).
     * @param {*} value Value to set at the specified path.
     * @param {Object=} root Root object from which the path is evaluated.
     *   When specified, no notification will occur.
     * @return {void}
     * @public
     */
    set(path, value, root) {
      if (root) {
        set(root, path, value);
      } else {
        if (!this[TYPES.READ_ONLY] || !this[TYPES.READ_ONLY][/** @type {string} */(path)]) {
          if (this._setPendingPropertyOrPath(path, value, true)) {
            this._invalidateProperties();
          }
        }
      }
    }

    /**
     * Adds items onto the end of the array at the path specified.
     *
     * The arguments after `path` and return value match that of
     * `Array.prototype.push`.
     *
     * This method notifies other paths to the same array that a
     * splice occurred to the array.
     *
     * @override
     * @param {string | !Array<string|number>} path Path to array.
     * @param {...*} items Items to push onto array
     * @return {number} New length of the array.
     * @public
     */
    push(path, ...items) {
      let info = {path: ''};
      let array = /** @type {Array}*/(get(this, path, info));
      let len = array.length;
      let ret = array.push(...items);
      if (items.length) {
        notifySplice(this, array, info.path, len, items.length, []);
      }
      return ret;
    }

    /**
     * Removes an item from the end of array at the path specified.
     *
     * The arguments after `path` and return value match that of
     * `Array.prototype.pop`.
     *
     * This method notifies other paths to the same array that a
     * splice occurred to the array.
     *
     * @override
     * @param {string | !Array<string|number>} path Path to array.
     * @return {*} Item that was removed.
     * @public
     */
    pop(path) {
      let info = {path: ''};
      let array = /** @type {Array} */(get(this, path, info));
      let hadLength = Boolean(array.length);
      let ret = array.pop();
      if (hadLength) {
        notifySplice(this, array, info.path, array.length, 0, [ret]);
      }
      return ret;
    }

    /**
     * Starting from the start index specified, removes 0 or more items
     * from the array and inserts 0 or more new items in their place.
     *
     * The arguments after `path` and return value match that of
     * `Array.prototype.splice`.
     *
     * This method notifies other paths to the same array that a
     * splice occurred to the array.
     *
     * @override
     * @param {string | !Array<string|number>} path Path to array.
     * @param {number} start Index from which to start removing/inserting.
     * @param {number=} deleteCount Number of items to remove.
     * @param {...*} items Items to insert into array.
     * @return {!Array} Array of removed items.
     * @public
     */
    splice(path, start, deleteCount, ...items) {
      let info = {path : ''};
      let array = /** @type {Array} */(get(this, path, info));
      // Normalize fancy native splice handling of crazy start values
      if (start < 0) {
        start = array.length - Math.floor(-start);
      } else if (start) {
        start = Math.floor(start);
      }
      // array.splice does different things based on the number of arguments
      // you pass in. Therefore, array.splice(0) and array.splice(0, undefined)
      // do different things. In the former, the whole array is cleared. In the
      // latter, no items are removed.
      // This means that we need to detect whether 1. one of the arguments
      // is actually passed in and then 2. determine how many arguments
      // we should pass on to the native array.splice
      //
      let ret;
      // Omit any additional arguments if they were not passed in
      if (arguments.length === 2) {
        ret = array.splice(start);
      // Either start was undefined and the others were defined, but in this
      // case we can safely pass on all arguments
      //
      // Note: this includes the case where none of the arguments were passed in,
      // e.g. this.splice('array'). However, if both start and deleteCount
      // are undefined, array.splice will not modify the array (as expected)
      } else {
        ret = array.splice(start, deleteCount, ...items);
      }
      // At the end, check whether any items were passed in (e.g. insertions)
      // or if the return array contains items (e.g. deletions).
      // Only notify if items were added or deleted.
      if (items.length || ret.length) {
        notifySplice(this, array, info.path, start, items.length, ret);
      }
      return ret;
    }

    /**
     * Removes an item from the beginning of array at the path specified.
     *
     * The arguments after `path` and return value match that of
     * `Array.prototype.pop`.
     *
     * This method notifies other paths to the same array that a
     * splice occurred to the array.
     *
     * @override
     * @param {string | !Array<string|number>} path Path to array.
     * @return {*} Item that was removed.
     * @public
     */
    shift(path) {
      let info = {path: ''};
      let array = /** @type {Array} */(get(this, path, info));
      let hadLength = Boolean(array.length);
      let ret = array.shift();
      if (hadLength) {
        notifySplice(this, array, info.path, 0, 0, [ret]);
      }
      return ret;
    }

    /**
     * Adds items onto the beginning of the array at the path specified.
     *
     * The arguments after `path` and return value match that of
     * `Array.prototype.push`.
     *
     * This method notifies other paths to the same array that a
     * splice occurred to the array.
     *
     * @override
     * @param {string | !Array<string|number>} path Path to array.
     * @param {...*} items Items to insert info array
     * @return {number} New length of the array.
     * @public
     */
    unshift(path, ...items) {
      let info = {path: ''};
      let array = /** @type {Array} */(get(this, path, info));
      let ret = array.unshift(...items);
      if (items.length) {
        notifySplice(this, array, info.path, 0, items.length, []);
      }
      return ret;
    }

    /**
     * Notify that a path has changed.
     *
     * Example:
     *
     *     this.item.user.name = 'Bob';
     *     this.notifyPath('item.user.name');
     *
     * @override
     * @param {string} path Path that should be notified.
     * @param {*=} value Value at the path (optional).
     * @return {void}
     * @public
     */
    notifyPath(path, value) {
      /** @type {string} */
      let propPath;
      if (arguments.length == 1) {
        // Get value if not supplied
        let info = {path: ''};
        value = get(this, path, info);
        propPath = info.path;
      } else if (Array.isArray(path)) {
        // Normalize path if needed
        propPath = normalize(path);
      } else {
        propPath = /** @type{string} */(path);
      }
      if (this._setPendingPropertyOrPath(propPath, value, true, true)) {
        this._invalidateProperties();
      }
    }

    /**
     * Equivalent to static `createReadOnlyProperty` API but can be called on
     * an instance to add effects at runtime.  See that method for
     * full API docs.
     *
     * @override
     * @param {string} property Property name
     * @param {boolean=} protectedSetter Creates a custom protected setter
     *   when `true`.
     * @return {void}
     * @protected
     */
    _createReadOnlyProperty(property, protectedSetter) {
      this._addPropertyEffect(property, TYPES.READ_ONLY);
      if (protectedSetter) {
        this['_set' + upper(property)] = /** @this {PropertyEffects} */function(value) {
          this._setProperty(property, value);
        };
      }
    }

    /**
     * Equivalent to static `createPropertyObserver` API but can be called on
     * an instance to add effects at runtime.  See that method for
     * full API docs.
     *
     * @override
     * @param {string} property Property name
     * @param {string|function(*,*)} method Function or name of observer method
     *     to call
     * @param {boolean=} dynamicFn Whether the method name should be included as
     *   a dependency to the effect.
     * @return {void}
     * @protected
     */
    _createPropertyObserver(property, method, dynamicFn) {
      let info = { property, method, dynamicFn: Boolean(dynamicFn) };
      this._addPropertyEffect(property, TYPES.OBSERVE, {
        fn: runObserverEffect, info, trigger: {name: property}
      });
      if (dynamicFn) {
        this._addPropertyEffect(/** @type {string} */(method), TYPES.OBSERVE, {
          fn: runObserverEffect, info, trigger: {name: method}
        });
      }
    }

    /**
     * Equivalent to static `createMethodObserver` API but can be called on
     * an instance to add effects at runtime.  See that method for
     * full API docs.
     *
     * @override
     * @param {string} expression Method expression
     * @param {boolean|Object=} dynamicFn Boolean or object map indicating
     *   whether method names should be included as a dependency to the effect.
     * @return {void}
     * @protected
     */
    _createMethodObserver(expression, dynamicFn) {
      let sig = parseMethod(expression);
      if (!sig) {
        throw new Error("Malformed observer expression '" + expression + "'");
      }
      createMethodEffect(this, sig, TYPES.OBSERVE, runMethodEffect, null, dynamicFn);
    }

    /**
     * Equivalent to static `createNotifyingProperty` API but can be called on
     * an instance to add effects at runtime.  See that method for
     * full API docs.
     *
     * @override
     * @param {string} property Property name
     * @return {void}
     * @protected
     */
    _createNotifyingProperty(property) {
      this._addPropertyEffect(property, TYPES.NOTIFY, {
        fn: runNotifyEffect,
        info: {
          eventName: camelToDashCase(property) + '-changed',
          property: property
        }
      });
    }

    /**
     * Equivalent to static `createReflectedProperty` API but can be called on
     * an instance to add effects at runtime.  See that method for
     * full API docs.
     *
     * @override
     * @param {string} property Property name
     * @return {void}
     * @protected
     * @suppress {missingProperties} go/missingfnprops
     */
    _createReflectedProperty(property) {
      let attr = this.constructor.attributeNameForProperty(property);
      if (attr[0] === '-') {
        console.warn('Property ' + property + ' cannot be reflected to attribute ' +
          attr + ' because "-" is not a valid starting attribute name. Use a lowercase first letter for the property instead.');
      } else {
        this._addPropertyEffect(property, TYPES.REFLECT, {
          fn: runReflectEffect,
          info: {
            attrName: attr
          }
        });
      }
    }

    /**
     * Equivalent to static `createComputedProperty` API but can be called on
     * an instance to add effects at runtime.  See that method for
     * full API docs.
     *
     * @override
     * @param {string} property Name of computed property to set
     * @param {string} expression Method expression
     * @param {boolean|Object=} dynamicFn Boolean or object map indicating
     *   whether method names should be included as a dependency to the effect.
     * @return {void}
     * @protected
     */
    _createComputedProperty(property, expression, dynamicFn) {
      let sig = parseMethod(expression);
      if (!sig) {
        throw new Error("Malformed computed expression '" + expression + "'");
      }
      const info = createMethodEffect(this, sig, TYPES.COMPUTE, runComputedEffect, property, dynamicFn);
      // Effects are normally stored as map of dependency->effect, but for
      // ordered computation, we also need tree of computedProp->dependencies
      ensureOwnEffectMap(this, COMPUTE_INFO)[property] = info;
    }

    /**
     * Gather the argument values for a method specified in the provided array
     * of argument metadata.
     *
     * The `path` and `value` arguments are used to fill in wildcard descriptor
     * when the method is being called as a result of a path notification.
     *
     * @param {!Array<!MethodArg>} args Array of argument metadata
     * @param {string} path Property/path name that triggered the method effect
     * @param {Object} props Bag of current property changes
     * @return {!Array<*>} Array of argument values
     * @private
     */
    _marshalArgs(args, path, props) {
      const data = this.__data;
      const values = [];
      for (let i=0, l=args.length; i<l; i++) {
        let {name, structured, wildcard, value, literal} = args[i];
        if (!literal) {
          if (wildcard) {
            const matches = isDescendant(name, path);
            const pathValue = getArgValue(data, props, matches ? path : name);
            value = {
              path: matches ? path : name,
              value: pathValue,
              base: matches ? get(data, name) : pathValue
            };
          } else {
            value = structured ? getArgValue(data, props, name) : data[name];
          }
        }
        // When the `legacyUndefined` flag is enabled, pass a no-op value
        // so that the observer, computed property, or compound binding is aborted.
        if (legacyUndefined && !this._overrideLegacyUndefined && value === undefined && args.length > 1) {
          return NOOP;
        }
        values[i] = value;
      }
      return values;
    }

    // -- static class methods ------------

    /**
     * Ensures an accessor exists for the specified property, and adds
     * to a list of "property effects" that will run when the accessor for
     * the specified property is set.  Effects are grouped by "type", which
     * roughly corresponds to a phase in effect processing.  The effect
     * metadata should be in the following form:
     *
     *     {
     *       fn: effectFunction, // Reference to function to call to perform effect
     *       info: { ... }       // Effect metadata passed to function
     *       trigger: {          // Optional triggering metadata; if not provided
     *         name: string      // the property is treated as a wildcard
     *         structured: boolean
     *         wildcard: boolean
     *       }
     *     }
     *
     * Effects are called from `_propertiesChanged` in the following order by
     * type:
     *
     * 1. COMPUTE
     * 2. PROPAGATE
     * 3. REFLECT
     * 4. OBSERVE
     * 5. NOTIFY
     *
     * Effect functions are called with the following signature:
     *
     *     effectFunction(inst, path, props, oldProps, info, hasPaths)
     *
     * @param {string} property Property that should trigger the effect
     * @param {string} type Effect type, from this.PROPERTY_EFFECT_TYPES
     * @param {Object=} effect Effect metadata object
     * @return {void}
     * @protected
     * @nocollapse
     */
    static addPropertyEffect(property, type, effect) {
      this.prototype._addPropertyEffect(property, type, effect);
    }

    /**
     * Creates a single-property observer for the given property.
     *
     * @param {string} property Property name
     * @param {string|function(*,*)} method Function or name of observer method to call
     * @param {boolean=} dynamicFn Whether the method name should be included as
     *   a dependency to the effect.
     * @return {void}
     * @protected
     * @nocollapse
     */
    static createPropertyObserver(property, method, dynamicFn) {
      this.prototype._createPropertyObserver(property, method, dynamicFn);
    }

    /**
     * Creates a multi-property "method observer" based on the provided
     * expression, which should be a string in the form of a normal JavaScript
     * function signature: `'methodName(arg1, [..., argn])'`.  Each argument
     * should correspond to a property or path in the context of this
     * prototype (or instance), or may be a literal string or number.
     *
     * @param {string} expression Method expression
     * @param {boolean|Object=} dynamicFn Boolean or object map indicating
     * @return {void}
     *   whether method names should be included as a dependency to the effect.
     * @protected
     * @nocollapse
     */
    static createMethodObserver(expression, dynamicFn) {
      this.prototype._createMethodObserver(expression, dynamicFn);
    }

    /**
     * Causes the setter for the given property to dispatch `<property>-changed`
     * events to notify of changes to the property.
     *
     * @param {string} property Property name
     * @return {void}
     * @protected
     * @nocollapse
     */
    static createNotifyingProperty(property) {
      this.prototype._createNotifyingProperty(property);
    }

    /**
     * Creates a read-only accessor for the given property.
     *
     * To set the property, use the protected `_setProperty` API.
     * To create a custom protected setter (e.g. `_setMyProp()` for
     * property `myProp`), pass `true` for `protectedSetter`.
     *
     * Note, if the property will have other property effects, this method
     * should be called first, before adding other effects.
     *
     * @param {string} property Property name
     * @param {boolean=} protectedSetter Creates a custom protected setter
     *   when `true`.
     * @return {void}
     * @protected
     * @nocollapse
     */
    static createReadOnlyProperty(property, protectedSetter) {
      this.prototype._createReadOnlyProperty(property, protectedSetter);
    }

    /**
     * Causes the setter for the given property to reflect the property value
     * to a (dash-cased) attribute of the same name.
     *
     * @param {string} property Property name
     * @return {void}
     * @protected
     * @nocollapse
     */
    static createReflectedProperty(property) {
      this.prototype._createReflectedProperty(property);
    }

    /**
     * Creates a computed property whose value is set to the result of the
     * method described by the given `expression` each time one or more
     * arguments to the method changes.  The expression should be a string
     * in the form of a normal JavaScript function signature:
     * `'methodName(arg1, [..., argn])'`
     *
     * @param {string} property Name of computed property to set
     * @param {string} expression Method expression
     * @param {boolean|Object=} dynamicFn Boolean or object map indicating whether
     *   method names should be included as a dependency to the effect.
     * @return {void}
     * @protected
     * @nocollapse
     */
    static createComputedProperty(property, expression, dynamicFn) {
      this.prototype._createComputedProperty(property, expression, dynamicFn);
    }

    /**
     * Parses the provided template to ensure binding effects are created
     * for them, and then ensures property accessors are created for any
     * dependent properties in the template.  Binding effects for bound
     * templates are stored in a linked list on the instance so that
     * templates can be efficiently stamped and unstamped.
     *
     * @param {!HTMLTemplateElement} template Template containing binding
     *   bindings
     * @return {!TemplateInfo} Template metadata object
     * @protected
     * @nocollapse
     */
    static bindTemplate(template) {
      return this.prototype._bindTemplate(template);
    }

    // -- binding ----------------------------------------------

    /*
     * Overview of binding flow:
     *
     * During finalization (`instanceBinding==false`, `wasPreBound==false`):
     *  `_bindTemplate(t, false)` called directly during finalization - parses
     *  the template (for the first time), and then assigns that _prototypical_
     *  template info to `__preboundTemplateInfo` _on the prototype_; note in
     *  this case `wasPreBound` is false; this is the first time we're binding
     *  it, thus we create accessors.
     *
     * During first stamping (`instanceBinding==true`, `wasPreBound==true`):
     *   `_stampTemplate` calls `_bindTemplate(t, true)`: the `templateInfo`
     *   returned matches the prebound one, and so this is `wasPreBound == true`
     *   state; thus we _skip_ creating accessors, but _do_ create an instance
     *   of the template info to serve as the start of our linked list (needs to
     *   be an instance, not the prototypical one, so that we can add `nodeList`
     *   to it to contain the `nodeInfo`-ordered list of instance nodes for
     *   bindings, and so we can chain runtime-stamped template infos off of
     *   it). At this point, the call to `_stampTemplate` calls
     *   `applyTemplateInfo` for each nested `<template>` found during parsing
     *   to hand prototypical `_templateInfo` to them; we also pass the _parent_
     *   `templateInfo` to the `<template>` so that we have the instance-time
     *   parent to link the `templateInfo` under in the case it was
     *   runtime-stamped.
     *
     * During subsequent runtime stamping (`instanceBinding==true`,
     *   `wasPreBound==false`): `_stampTemplate` calls `_bindTemplate(t, true)`
     *   - here `templateInfo` is guaranteed to _not_ match the prebound one,
     *   because it was either a different template altogether, or even if it
     *   was the same template, the step above created a instance of the info;
     *   in this case `wasPreBound == false`, so we _do_ create accessors, _and_
     *   link a instance into the linked list.
     */

    /**
     * Equivalent to static `bindTemplate` API but can be called on an instance
     * to add effects at runtime.  See that method for full API docs.
     *
     * This method may be called on the prototype (for prototypical template
     * binding, to avoid creating accessors every instance) once per prototype,
     * and will be called with `runtimeBinding: true` by `_stampTemplate` to
     * create and link an instance of the template metadata associated with a
     * particular stamping.
     *
     * @override
     * @param {!HTMLTemplateElement} template Template containing binding
     * bindings
     * @param {boolean=} instanceBinding When false (default), performs
     * "prototypical" binding of the template and overwrites any previously
     * bound template for the class. When true (as passed from
     * `_stampTemplate`), the template info is instanced and linked into the
     * list of bound templates.
     * @return {!TemplateInfo} Template metadata object; for `runtimeBinding`,
     * this is an instance of the prototypical template info
     * @protected
     * @suppress {missingProperties} go/missingfnprops
     */
    _bindTemplate(template, instanceBinding) {
      let templateInfo = this.constructor._parseTemplate(template);
      let wasPreBound = this.__preBoundTemplateInfo == templateInfo;
      // Optimization: since this is called twice for proto-bound templates,
      // don't attempt to recreate accessors if this template was pre-bound
      if (!wasPreBound) {
        for (let prop in templateInfo.propertyEffects) {
          this._createPropertyAccessor(prop);
        }
      }
      if (instanceBinding) {
        // For instance-time binding, create instance of template metadata
        // and link into tree of templates if necessary
        templateInfo = /** @type {!TemplateInfo} */(Object.create(templateInfo));
        templateInfo.wasPreBound = wasPreBound;
        if (!this.__templateInfo) {
          // Set the info to the root of the tree
          this.__templateInfo = templateInfo;
        } else {
          // Append this template info onto the end of its parent template's
          // list, which will determine the tree structure via which property
          // effects are run; if this template was not nested in another
          // template, use the root template (the first stamped one) as the
          // parent. Note, `parent` is the `templateInfo` instance for this
          // template's parent (containing) template, which was set up in
          // `applyTemplateInfo`.  While a given template's `parent` is set
          // apriori, it is only added to the parent's child list at the point
          // that it is being bound, since a template may or may not ever be
          // stamped, and may be stamped more than once (in which case instances
          // of the template info will be in the tree under its parent more than
          // once).
          const parent = template._parentTemplateInfo || this.__templateInfo;
          const previous = parent.lastChild;
          templateInfo.parent = parent;
          parent.lastChild = templateInfo;
          templateInfo.previousSibling = previous;
          if (previous) {
            previous.nextSibling = templateInfo;
          } else {
            parent.firstChild = templateInfo;
          }
        }
      } else {
        this.__preBoundTemplateInfo = templateInfo;
      }
      return templateInfo;
    }

    /**
     * Adds a property effect to the given template metadata, which is run
     * at the "propagate" stage of `_propertiesChanged` when the template
     * has been bound to the element via `_bindTemplate`.
     *
     * The `effect` object should match the format in `_addPropertyEffect`.
     *
     * @param {Object} templateInfo Template metadata to add effect to
     * @param {string} prop Property that should trigger the effect
     * @param {Object=} effect Effect metadata object
     * @return {void}
     * @protected
     * @nocollapse
     */
    static _addTemplatePropertyEffect(templateInfo, prop, effect) {
      let hostProps = templateInfo.hostProps = templateInfo.hostProps || {};
      hostProps[prop] = true;
      let effects = templateInfo.propertyEffects = templateInfo.propertyEffects || {};
      let propEffects = effects[prop] = effects[prop] || [];
      propEffects.push(effect);
    }

    /**
     * Stamps the provided template and performs instance-time setup for
     * Polymer template features, including data bindings, declarative event
     * listeners, and the `this.$` map of `id`'s to nodes.  A document fragment
     * is returned containing the stamped DOM, ready for insertion into the
     * DOM.
     *
     * This method may be called more than once; however note that due to
     * `shadycss` polyfill limitations, only styles from templates prepared
     * using `ShadyCSS.prepareTemplate` will be correctly polyfilled (scoped
     * to the shadow root and support CSS custom properties), and note that
     * `ShadyCSS.prepareTemplate` may only be called once per element. As such,
     * any styles required by in runtime-stamped templates must be included
     * in the main element template.
     *
     * @param {!HTMLTemplateElement} template Template to stamp
     * @param {TemplateInfo=} templateInfo Optional bound template info associated
     *   with the template to be stamped; if omitted the template will be
     *   automatically bound.
     * @return {!StampedTemplate} Cloned template content
     * @override
     * @protected
     */
    _stampTemplate(template, templateInfo) {
      templateInfo =  templateInfo || /** @type {!TemplateInfo} */(this._bindTemplate(template, true));
      // Ensures that created dom is `_enqueueClient`'d to this element so
      // that it can be flushed on next call to `_flushProperties`
      hostStack.push(this);
      let dom = super._stampTemplate(template, templateInfo);
      hostStack.pop();
      // Add template-instance-specific data to instanced templateInfo
      templateInfo.nodeList = dom.nodeList;
      // Capture child nodes to allow unstamping of non-prototypical templates
      if (!templateInfo.wasPreBound) {
        let nodes = templateInfo.childNodes = [];
        for (let n=dom.firstChild; n; n=n.nextSibling) {
          nodes.push(n);
        }
      }
      dom.templateInfo = templateInfo;
      // Setup compound storage, 2-way listeners, and dataHost for bindings
      setupBindings(this, templateInfo);
      // Flush properties into template nodes; the check on `__dataClientsReady`
      // ensures we don't needlessly run effects for an element's initial
      // prototypical template stamping since they will happen as a part of the
      // first call to `_propertiesChanged`. This flag is set to true
      // after running the initial propagate effects, and immediately before
      // flushing clients. Since downstream clients could cause stamping on
      // this host (e.g. a fastDomIf `dom-if` being forced to render
      // synchronously), this flag ensures effects for runtime-stamped templates
      // are run at this point during the initial element boot-up.
      if (this.__dataClientsReady) {
        this._runEffectsForTemplate(templateInfo, this.__data, null, false);
        this._flushClients();
      }
      return dom;
    }

    /**
     * Removes and unbinds the nodes previously contained in the provided
     * DocumentFragment returned from `_stampTemplate`.
     *
     * @override
     * @param {!StampedTemplate} dom DocumentFragment previously returned
     *   from `_stampTemplate` associated with the nodes to be removed
     * @return {void}
     * @protected
     */
    _removeBoundDom(dom) {
      // Unlink template info; Note that while the child is unlinked from its
      // parent list, a template's `parent` reference is never removed, since
      // this is is determined by the tree structure and applied at
      // `applyTemplateInfo` time.
      const templateInfo = dom.templateInfo;
      const {previousSibling, nextSibling, parent} = templateInfo;
      if (previousSibling) {
        previousSibling.nextSibling = nextSibling;
      } else if (parent) {
        parent.firstChild = nextSibling;
      }
      if (nextSibling) {
        nextSibling.previousSibling = previousSibling;
      } else if (parent) {
        parent.lastChild = previousSibling;
      }
      templateInfo.nextSibling = templateInfo.previousSibling = null;
      // Remove stamped nodes
      let nodes = templateInfo.childNodes;
      for (let i=0; i<nodes.length; i++) {
        let node = nodes[i];
        wrap(wrap(node).parentNode).removeChild(node);
      }
    }

    /**
     * Overrides default `TemplateStamp` implementation to add support for
     * parsing bindings from `TextNode`'s' `textContent`.  A `bindings`
     * array is added to `nodeInfo` and populated with binding metadata
     * with information capturing the binding target, and a `parts` array
     * with one or more metadata objects capturing the source(s) of the
     * binding.
     *
     * @param {Node} node Node to parse
     * @param {TemplateInfo} templateInfo Template metadata for current template
     * @param {NodeInfo} nodeInfo Node metadata for current template node
     * @return {boolean} `true` if the visited node added node-specific
     *   metadata to `nodeInfo`
     * @protected
     * @suppress {missingProperties} Interfaces in closure do not inherit statics, but classes do
     * @nocollapse
     */
    static _parseTemplateNode(node, templateInfo, nodeInfo) {
      // TODO(https://github.com/google/closure-compiler/issues/3240):
      //     Change back to just super.methodCall()
      let noted = propertyEffectsBase._parseTemplateNode.call(
        this, node, templateInfo, nodeInfo);
      if (node.nodeType === Node.TEXT_NODE) {
        let parts = this._parseBindings(node.textContent, templateInfo);
        if (parts) {
          // Initialize the textContent with any literal parts
          // NOTE: default to a space here so the textNode remains; some browsers
          // (IE) omit an empty textNode following cloneNode/importNode.
          node.textContent = literalFromParts(parts) || ' ';
          addBinding(this, templateInfo, nodeInfo, 'text', 'textContent', parts);
          noted = true;
        }
      }
      return noted;
    }

    /**
     * Overrides default `TemplateStamp` implementation to add support for
     * parsing bindings from attributes.  A `bindings`
     * array is added to `nodeInfo` and populated with binding metadata
     * with information capturing the binding target, and a `parts` array
     * with one or more metadata objects capturing the source(s) of the
     * binding.
     *
     * @param {Element} node Node to parse
     * @param {TemplateInfo} templateInfo Template metadata for current template
     * @param {NodeInfo} nodeInfo Node metadata for current template node
     * @param {string} name Attribute name
     * @param {string} value Attribute value
     * @return {boolean} `true` if the visited node added node-specific
     *   metadata to `nodeInfo`
     * @protected
     * @suppress {missingProperties} Interfaces in closure do not inherit statics, but classes do
     * @nocollapse
     */
    static _parseTemplateNodeAttribute(node, templateInfo, nodeInfo, name, value) {
      let parts = this._parseBindings(value, templateInfo);
      if (parts) {
        // Attribute or property
        let origName = name;
        let kind = 'property';
        // The only way we see a capital letter here is if the attr has
        // a capital letter in it per spec. In this case, to make sure
        // this binding works, we go ahead and make the binding to the attribute.
        if (capitalAttributeRegex.test(name)) {
          kind = 'attribute';
        } else if (name[name.length-1] == '$') {
          name = name.slice(0, -1);
          kind = 'attribute';
        }
        // Initialize attribute bindings with any literal parts
        let literal = literalFromParts(parts);
        if (literal && kind == 'attribute') {
          // Ensure a ShadyCSS template scoped style is not removed
          // when a class$ binding's initial literal value is set.
          if (name == 'class' && node.hasAttribute('class')) {
            literal += ' ' + node.getAttribute(name);
          }
          node.setAttribute(name, literal);
        }
        // support disable-upgrade
        if (kind == 'attribute' && origName == 'disable-upgrade$') {
          node.setAttribute(name, '');
        }
        // Clear attribute before removing, since IE won't allow removing
        // `value` attribute if it previously had a value (can't
        // unconditionally set '' before removing since attributes with `$`
        // can't be set using setAttribute)
        if (node.localName === 'input' && origName === 'value') {
          node.setAttribute(origName, '');
        }
        // Remove annotation
        node.removeAttribute(origName);
        // Case hackery: attributes are lower-case, but bind targets
        // (properties) are case sensitive. Gambit is to map dash-case to
        // camel-case: `foo-bar` becomes `fooBar`.
        // Attribute bindings are excepted.
        if (kind === 'property') {
          name = dashToCamelCase(name);
        }
        addBinding(this, templateInfo, nodeInfo, kind, name, parts, literal);
        return true;
      } else {
        // TODO(https://github.com/google/closure-compiler/issues/3240):
        //     Change back to just super.methodCall()
        return propertyEffectsBase._parseTemplateNodeAttribute.call(
          this, node, templateInfo, nodeInfo, name, value);
      }
    }

    /**
     * Overrides default `TemplateStamp` implementation to add support for
     * binding the properties that a nested template depends on to the template
     * as `_host_<property>`.
     *
     * @param {Node} node Node to parse
     * @param {TemplateInfo} templateInfo Template metadata for current template
     * @param {NodeInfo} nodeInfo Node metadata for current template node
     * @return {boolean} `true` if the visited node added node-specific
     *   metadata to `nodeInfo`
     * @protected
     * @suppress {missingProperties} Interfaces in closure do not inherit statics, but classes do
     * @nocollapse
     */
    static _parseTemplateNestedTemplate(node, templateInfo, nodeInfo) {
      // TODO(https://github.com/google/closure-compiler/issues/3240):
      //     Change back to just super.methodCall()
      let noted = propertyEffectsBase._parseTemplateNestedTemplate.call(
        this, node, templateInfo, nodeInfo);
      const parent = node.parentNode;
      const nestedTemplateInfo = nodeInfo.templateInfo;
      const isDomIf = parent.localName === 'dom-if';
      const isDomRepeat = parent.localName === 'dom-repeat';
      // Remove nested template and redirect its host bindings & templateInfo
      // onto the parent (dom-if/repeat element)'s nodeInfo
      if (removeNestedTemplates && (isDomIf || isDomRepeat)) {
        parent.removeChild(node);
        // Use the parent's nodeInfo (for the dom-if/repeat) to record the
        // templateInfo, and use that for any host property bindings below
        nodeInfo = nodeInfo.parentInfo;
        nodeInfo.templateInfo = nestedTemplateInfo;
        // Ensure the parent dom-if/repeat is noted since it now may have host
        // bindings; it may not have been if it did not have its own bindings
        nodeInfo.noted = true;
        noted = false;
      }
      // Merge host props into outer template and add bindings
      let hostProps = nestedTemplateInfo.hostProps;
      if (fastDomIf && isDomIf) {
        // `fastDomIf` mode uses runtime-template stamping to add accessors/
        // effects to properties used in its template; as such we don't need to
        // tax the host element with `_host_` bindings for the `dom-if`.
        // However, in the event it is nested in a `dom-repeat`, it is still
        // important that its host properties are added to the
        // TemplateInstance's `hostProps` so that they are forwarded to the
        // TemplateInstance.
        if (hostProps) {
          templateInfo.hostProps =
            Object.assign(templateInfo.hostProps || {}, hostProps);
          // Ensure the dom-if is noted so that it has a __dataHost, since
          // `fastDomIf` uses the host for runtime template stamping; note this
          // was already ensured above in the `removeNestedTemplates` case
          if (!removeNestedTemplates) {
            nodeInfo.parentInfo.noted = true;
          }
        }
      } else {
        let mode = '{';
        for (let source in hostProps) {
          let parts = [{ mode, source, dependencies: [source], hostProp: true }];
          addBinding(this, templateInfo, nodeInfo, 'property', '_host_' + source, parts);
        }
      }
      return noted;
    }

    /**
     * Called to parse text in a template (either attribute values or
     * textContent) into binding metadata.
     *
     * Any overrides of this method should return an array of binding part
     * metadata  representing one or more bindings found in the provided text
     * and any "literal" text in between.  Any non-literal parts will be passed
     * to `_evaluateBinding` when any dependencies change.  The only required
     * fields of each "part" in the returned array are as follows:
     *
     * - `dependencies` - Array containing trigger metadata for each property
     *   that should trigger the binding to update
     * - `literal` - String containing text if the part represents a literal;
     *   in this case no `dependencies` are needed
     *
     * Additional metadata for use by `_evaluateBinding` may be provided in
     * each part object as needed.
     *
     * The default implementation handles the following types of bindings
     * (one or more may be intermixed with literal strings):
     * - Property binding: `[[prop]]`
     * - Path binding: `[[object.prop]]`
     * - Negated property or path bindings: `[[!prop]]` or `[[!object.prop]]`
     * - Two-way property or path bindings (supports negation):
     *   `{{prop}}`, `{{object.prop}}`, `{{!prop}}` or `{{!object.prop}}`
     * - Inline computed method (supports negation):
     *   `[[compute(a, 'literal', b)]]`, `[[!compute(a, 'literal', b)]]`
     *
     * The default implementation uses a regular expression for best
     * performance. However, the regular expression uses a white-list of
     * allowed characters in a data-binding, which causes problems for
     * data-bindings that do use characters not in this white-list.
     *
     * Instead of updating the white-list with all allowed characters,
     * there is a StrictBindingParser (see lib/mixins/strict-binding-parser)
     * that uses a state machine instead. This state machine is able to handle
     * all characters. However, it is slightly less performant, therefore we
     * extracted it into a separate optional mixin.
     *
     * @param {string} text Text to parse from attribute or textContent
     * @param {Object} templateInfo Current template metadata
     * @return {Array<!BindingPart>} Array of binding part metadata
     * @protected
     * @nocollapse
     */
    static _parseBindings(text, templateInfo) {
      let parts = [];
      let lastIndex = 0;
      let m;
      // Example: "literal1{{prop}}literal2[[!compute(foo,bar)]]final"
      // Regex matches:
      //        Iteration 1:  Iteration 2:
      // m[1]: '{{'          '[['
      // m[2]: ''            '!'
      // m[3]: 'prop'        'compute(foo,bar)'
      while ((m = bindingRegex.exec(text)) !== null) {
        // Add literal part
        if (m.index > lastIndex) {
          parts.push({literal: text.slice(lastIndex, m.index)});
        }
        // Add binding part
        let mode = m[1][0];
        let negate = Boolean(m[2]);
        let source = m[3].trim();
        let customEvent = false, notifyEvent = '', colon = -1;
        if (mode == '{' && (colon = source.indexOf('::')) > 0) {
          notifyEvent = source.substring(colon + 2);
          source = source.substring(0, colon);
          customEvent = true;
        }
        let signature = parseMethod(source);
        let dependencies = [];
        if (signature) {
          // Inline computed function
          let {args, methodName} = signature;
          for (let i=0; i<args.length; i++) {
            let arg = args[i];
            if (!arg.literal) {
              dependencies.push(arg);
            }
          }
          let dynamicFns = templateInfo.dynamicFns;
          if (dynamicFns && dynamicFns[methodName] || signature.static) {
            dependencies.push(methodName);
            signature.dynamicFn = true;
          }
        } else {
          // Property or path
          dependencies.push(source);
        }
        parts.push({
          source, mode, negate, customEvent, signature, dependencies,
          event: notifyEvent
        });
        lastIndex = bindingRegex.lastIndex;
      }
      // Add a final literal part
      if (lastIndex && lastIndex < text.length) {
        let literal = text.substring(lastIndex);
        if (literal) {
          parts.push({
            literal: literal
          });
        }
      }
      if (parts.length) {
        return parts;
      } else {
        return null;
      }
    }

    /**
     * Called to evaluate a previously parsed binding part based on a set of
     * one or more changed dependencies.
     *
     * @param {!Polymer_PropertyEffects} inst Element that should be used as
     *     scope for binding dependencies
     * @param {BindingPart} part Binding part metadata
     * @param {string} path Property/path that triggered this effect
     * @param {Object} props Bag of current property changes
     * @param {Object} oldProps Bag of previous values for changed properties
     * @param {boolean} hasPaths True with `props` contains one or more paths
     * @return {*} Value the binding part evaluated to
     * @protected
     * @nocollapse
     */
    static _evaluateBinding(inst, part, path, props, oldProps, hasPaths) {
      let value;
      if (part.signature) {
        value = runMethodEffect(inst, path, props, oldProps, part.signature);
      } else if (path != part.source) {
        value = get(inst, part.source);
      } else {
        if (hasPaths && isPath(path)) {
          value = get(inst, path);
        } else {
          value = inst.__data[path];
        }
      }
      if (part.negate) {
        value = !value;
      }
      return value;
    }

  }

  return PropertyEffects;
});

/**
 * Stack for enqueuing client dom created by a host element.
 *
 * By default elements are flushed via `_flushProperties` when
 * `connectedCallback` is called. Elements attach their client dom to
 * themselves at `ready` time which results from this first flush.
 * This provides an ordering guarantee that the client dom an element
 * creates is flushed before the element itself (i.e. client `ready`
 * fires before host `ready`).
 *
 * However, if `_flushProperties` is called *before* an element is connected,
 * as for example `Templatize` does, this ordering guarantee cannot be
 * satisfied because no elements are connected. (Note: Bound elements that
 * receive data do become enqueued clients and are properly ordered but
 * unbound elements are not.)
 *
 * To maintain the desired "client before host" ordering guarantee for this
 * case we rely on the "host stack. Client nodes registers themselves with
 * the creating host element when created. This ensures that all client dom
 * is readied in the proper order, maintaining the desired guarantee.
 *
 * @private
 */
const hostStack = [];

/**
@license
Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/


/**
 * Registers a class prototype for telemetry purposes.
 * @param {!PolymerElementConstructor} prototype Element prototype to register
 * @protected
 */
function register(prototype) {
}

/**
@license
Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

/**
 * Creates a copy of `props` with each property normalized such that
 * upgraded it is an object with at least a type property { type: Type}.
 *
 * @param {!Object} props Properties to normalize
 * @return {!Object} Copy of input `props` with normalized properties that
 * are in the form {type: Type}
 * @private
 */
function normalizeProperties(props) {
  const output = {};
  for (let p in props) {
    const o = props[p];
    output[p] = (typeof o === 'function') ? {type: o} : o;
  }
  return output;
}

/**
 * Mixin that provides a minimal starting point to using the PropertiesChanged
 * mixin by providing a mechanism to declare properties in a static
 * getter (e.g. static get properties() { return { foo: String } }). Changes
 * are reported via the `_propertiesChanged` method.
 *
 * This mixin provides no specific support for rendering. Users are expected
 * to create a ShadowRoot and put content into it and update it in whatever
 * way makes sense. This can be done in reaction to properties changing by
 * implementing `_propertiesChanged`.
 *
 * @mixinFunction
 * @polymer
 * @appliesMixin PropertiesChanged
 * @summary Mixin that provides a minimal starting point for using
 * the PropertiesChanged mixin by providing a declarative `properties` object.
 * @template T
 * @param {function(new:T)} superClass Class to apply mixin to.
 * @return {function(new:T)} superClass with mixin applied.
 */
const PropertiesMixin = dedupingMixin(superClass => {

 /**
  * @constructor
  * @implements {Polymer_PropertiesChanged}
  * @private
  */
 const base = PropertiesChanged(superClass);

 /**
  * Returns the super class constructor for the given class, if it is an
  * instance of the PropertiesMixin.
  *
  * @param {!PropertiesMixinConstructor} constructor PropertiesMixin constructor
  * @return {?PropertiesMixinConstructor} Super class constructor
  */
 function superPropertiesClass(constructor) {
   const superCtor = Object.getPrototypeOf(constructor);

   // Note, the `PropertiesMixin` class below only refers to the class
   // generated by this call to the mixin; the instanceof test only works
   // because the mixin is deduped and guaranteed only to apply once, hence
   // all constructors in a proto chain will see the same `PropertiesMixin`
   return (superCtor.prototype instanceof PropertiesMixin) ?
     /** @type {!PropertiesMixinConstructor} */ (superCtor) : null;
 }

 /**
  * Returns a memoized version of the `properties` object for the
  * given class. Properties not in object format are converted to at
  * least {type}.
  *
  * @param {PropertiesMixinConstructor} constructor PropertiesMixin constructor
  * @return {Object} Memoized properties object
  */
 function ownProperties(constructor) {
   if (!constructor.hasOwnProperty(JSCompiler_renameProperty('__ownProperties', constructor))) {
     let props = null;

     if (constructor.hasOwnProperty(JSCompiler_renameProperty('properties', constructor))) {
       const properties = constructor.properties;

       if (properties) {
        props = normalizeProperties(properties);
       }
     }

     constructor.__ownProperties = props;
   }
   return constructor.__ownProperties;
 }

 /**
  * @polymer
  * @mixinClass
  * @extends {base}
  * @implements {Polymer_PropertiesMixin}
  * @unrestricted
  */
 class PropertiesMixin extends base {

   /**
    * Implements standard custom elements getter to observes the attributes
    * listed in `properties`.
    * @suppress {missingProperties} Interfaces in closure do not inherit statics, but classes do
    * @nocollapse
    */
   static get observedAttributes() {
     if (!this.hasOwnProperty(JSCompiler_renameProperty('__observedAttributes', this))) {
       register(this.prototype);
       const props = this._properties;
       this.__observedAttributes = props ? Object.keys(props).map(p => this.prototype._addPropertyToAttributeMap(p)) : [];
     }
     return this.__observedAttributes;
   }

   /**
    * Finalizes an element definition, including ensuring any super classes
    * are also finalized. This includes ensuring property
    * accessors exist on the element prototype. This method calls
    * `_finalizeClass` to finalize each constructor in the prototype chain.
    * @return {void}
    * @nocollapse
    */
   static finalize() {
     if (!this.hasOwnProperty(JSCompiler_renameProperty('__finalized', this))) {
       const superCtor = superPropertiesClass(/** @type {!PropertiesMixinConstructor} */(this));
       if (superCtor) {
         superCtor.finalize();
       }
       this.__finalized = true;
       this._finalizeClass();
     }
   }

   /**
    * Finalize an element class. This includes ensuring property
    * accessors exist on the element prototype. This method is called by
    * `finalize` and finalizes the class constructor.
    *
    * @protected
    * @nocollapse
    */
   static _finalizeClass() {
     const props = ownProperties(/** @type {!PropertiesMixinConstructor} */(this));
     if (props) {
       /** @type {?} */ (this).createProperties(props);
     }
   }

   /**
    * Returns a memoized version of all properties, including those inherited
    * from super classes. Properties not in object format are converted to
    * at least {type}.
    *
    * @return {Object} Object containing properties for this class
    * @protected
    * @nocollapse
    */
   static get _properties() {
     if (!this.hasOwnProperty(
       JSCompiler_renameProperty('__properties', this))) {
       const superCtor = superPropertiesClass(/** @type {!PropertiesMixinConstructor} */(this));
       this.__properties = Object.assign({},
         superCtor && superCtor._properties,
         ownProperties(/** @type {PropertiesMixinConstructor} */(this)));
     }
     return this.__properties;
   }

   /**
    * Overrides `PropertiesChanged` method to return type specified in the
    * static `properties` object for the given property.
    * @param {string} name Name of property
    * @return {*} Type to which to deserialize attribute
    *
    * @protected
    * @nocollapse
    */
   static typeForProperty(name) {
     const info = this._properties[name];
     return info && info.type;
   }

   /**
    * Overrides `PropertiesChanged` method and adds a call to
    * `finalize` which lazily configures the element's property accessors.
    * @override
    * @return {void}
    */
   _initializeProperties() {
     this.constructor.finalize();
     super._initializeProperties();
   }

   /**
    * Called when the element is added to a document.
    * Calls `_enableProperties` to turn on property system from
    * `PropertiesChanged`.
    * @suppress {missingProperties} Super may or may not implement the callback
    * @return {void}
    * @override
    */
   connectedCallback() {
     if (super.connectedCallback) {
       super.connectedCallback();
     }
     this._enableProperties();
   }

   /**
    * Called when the element is removed from a document
    * @suppress {missingProperties} Super may or may not implement the callback
    * @return {void}
    * @override
    */
   disconnectedCallback() {
     if (super.disconnectedCallback) {
       super.disconnectedCallback();
     }
   }

 }

 return PropertiesMixin;

});

/**
 * @fileoverview
 * @suppress {checkPrototypalTypes}
 * @license Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt The complete set of authors may be found
 * at http://polymer.github.io/AUTHORS.txt The complete set of contributors may
 * be found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by
 * Google as part of the polymer project is also subject to an additional IP
 * rights grant found at http://polymer.github.io/PATENTS.txt
 */

/**
 * Current Polymer version in Semver notation.
 * @type {string} Semver notation of the current version of Polymer.
 */
const version = '3.5.1';

const builtCSS = window.ShadyCSS && window.ShadyCSS['cssBuild'];

/**
 * Element class mixin that provides the core API for Polymer's meta-programming
 * features including template stamping, data-binding, attribute deserialization,
 * and property change observation.
 *
 * Subclassers may provide the following static getters to return metadata
 * used to configure Polymer's features for the class:
 *
 * - `static get is()`: When the template is provided via a `dom-module`,
 *   users should return the `dom-module` id from a static `is` getter.  If
 *   no template is needed or the template is provided directly via the
 *   `template` getter, there is no need to define `is` for the element.
 *
 * - `static get template()`: Users may provide the template directly (as
 *   opposed to via `dom-module`) by implementing a static `template` getter.
 *   The getter must return an `HTMLTemplateElement`.
 *
 * - `static get properties()`: Should return an object describing
 *   property-related metadata used by Polymer features (key: property name
 *   value: object containing property metadata). Valid keys in per-property
 *   metadata include:
 *   - `type` (String|Number|Object|Array|...): Used by
 *     `attributeChangedCallback` to determine how string-based attributes
 *     are deserialized to JavaScript property values.
 *   - `notify` (boolean): Causes a change in the property to fire a
 *     non-bubbling event called `<property>-changed`. Elements that have
 *     enabled two-way binding to the property use this event to observe changes.
 *   - `readOnly` (boolean): Creates a getter for the property, but no setter.
 *     To set a read-only property, use the private setter method
 *     `_setProperty(property, value)`.
 *   - `observer` (string): Observer method name that will be called when
 *     the property changes. The arguments of the method are
 *     `(value, previousValue)`.
 *   - `computed` (string): String describing method and dependent properties
 *     for computing the value of this property (e.g. `'computeFoo(bar, zot)'`).
 *     Computed properties are read-only by default and can only be changed
 *     via the return value of the computing method.
 *
 * - `static get observers()`: Array of strings describing multi-property
 *   observer methods and their dependent properties (e.g.
 *   `'observeABC(a, b, c)'`).
 *
 * The base class provides default implementations for the following standard
 * custom element lifecycle callbacks; users may override these, but should
 * call the super method to ensure
 * - `constructor`: Run when the element is created or upgraded
 * - `connectedCallback`: Run each time the element is connected to the
 *   document
 * - `disconnectedCallback`: Run each time the element is disconnected from
 *   the document
 * - `attributeChangedCallback`: Run each time an attribute in
 *   `observedAttributes` is set or removed (note: this element's default
 *   `observedAttributes` implementation will automatically return an array
 *   of dash-cased attributes based on `properties`)
 *
 * @mixinFunction
 * @polymer
 * @appliesMixin PropertyEffects
 * @appliesMixin PropertiesMixin
 * @property rootPath {string} Set to the value of `rootPath`,
 *   which defaults to the main document path
 * @property importPath {string} Set to the value of the class's static
 *   `importPath` property, which defaults to the path of this element's
 *   `dom-module` (when `is` is used), but can be overridden for other
 *   import strategies.
 * @summary Element class mixin that provides the core API for Polymer's
 * meta-programming features.
 * @template T
 * @param {function(new:T)} superClass Class to apply mixin to.
 * @return {function(new:T)} superClass with mixin applied.
 */
const ElementMixin$1 = dedupingMixin(base => {
  /**
   * @constructor
   * @implements {Polymer_PropertyEffects}
   * @implements {Polymer_PropertiesMixin}
   * @extends {HTMLElement}
   * @private
   */
  const polymerElementBase = PropertiesMixin(PropertyEffects(base));

  /**
   * Returns a list of properties with default values.
   * This list is created as an optimization since it is a subset of
   * the list returned from `_properties`.
   * This list is used in `_initializeProperties` to set property defaults.
   *
   * @param {PolymerElementConstructor} constructor Element class
   * @return {PolymerElementProperties} Flattened properties for this class
   *   that have default values
   * @private
   */
  function propertyDefaults(constructor) {
    if (!constructor.hasOwnProperty(
      JSCompiler_renameProperty('__propertyDefaults', constructor))) {
      constructor.__propertyDefaults = null;
      let props = constructor._properties;
      for (let p in props) {
        let info = props[p];
        if ('value' in info) {
          constructor.__propertyDefaults = constructor.__propertyDefaults || {};
          constructor.__propertyDefaults[p] = info;
        }
      }
    }
    return constructor.__propertyDefaults;
  }

  /**
   * Returns a memoized version of the `observers` array.
   * @param {PolymerElementConstructor} constructor Element class
   * @return {Array} Array containing own observers for the given class
   * @protected
   */
  function ownObservers(constructor) {
    if (!constructor.hasOwnProperty(
      JSCompiler_renameProperty('__ownObservers', constructor))) {
      constructor.__ownObservers =
          constructor.hasOwnProperty(
              JSCompiler_renameProperty('observers', constructor)) ?
          /** @type {PolymerElementConstructor} */ (constructor).observers :
          null;
    }
    return constructor.__ownObservers;
  }

  /**
   * Creates effects for a property.
   *
   * Note, once a property has been set to
   * `readOnly`, `computed`, `reflectToAttribute`, or `notify`
   * these values may not be changed. For example, a subclass cannot
   * alter these settings. However, additional `observers` may be added
   * by subclasses.
   *
   * The info object should contain property metadata as follows:
   *
   * * `type`: {function} type to which an attribute matching the property
   * is deserialized. Note the property is camel-cased from a dash-cased
   * attribute. For example, 'foo-bar' attribute is deserialized to a
   * property named 'fooBar'.
   *
   * * `readOnly`: {boolean} creates a readOnly property and
   * makes a private setter for the private of the form '_setFoo' for a
   * property 'foo',
   *
   * * `computed`: {string} creates a computed property. A computed property
   * is also automatically set to `readOnly: true`. The value is calculated
   * by running a method and arguments parsed from the given string. For
   * example 'compute(foo)' will compute a given property when the
   * 'foo' property changes by executing the 'compute' method. This method
   * must return the computed value.
   *
   * * `reflectToAttribute`: {boolean} If true, the property value is reflected
   * to an attribute of the same name. Note, the attribute is dash-cased
   * so a property named 'fooBar' is reflected as 'foo-bar'.
   *
   * * `notify`: {boolean} sends a non-bubbling notification event when
   * the property changes. For example, a property named 'foo' sends an
   * event named 'foo-changed' with `event.detail` set to the value of
   * the property.
   *
   * * observer: {string} name of a method that runs when the property
   * changes. The arguments of the method are (value, previousValue).
   *
   * Note: Users may want control over modifying property
   * effects via subclassing. For example, a user might want to make a
   * reflectToAttribute property not do so in a subclass. We've chosen to
   * disable this because it leads to additional complication.
   * For example, a readOnly effect generates a special setter. If a subclass
   * disables the effect, the setter would fail unexpectedly.
   * Based on feedback, we may want to try to make effects more malleable
   * and/or provide an advanced api for manipulating them.
   *
   * @param {!PolymerElement} proto Element class prototype to add accessors
   *   and effects to
   * @param {string} name Name of the property.
   * @param {Object} info Info object from which to create property effects.
   * Supported keys:
   * @param {Object} allProps Flattened map of all properties defined in this
   *   element (including inherited properties)
   * @return {void}
   * @private
   */
  function createPropertyFromConfig(proto, name, info, allProps) {
    // computed forces readOnly...
    if (info.computed) {
      info.readOnly = true;
    }
    // Note, since all computed properties are readOnly, this prevents
    // adding additional computed property effects (which leads to a confusing
    // setup where multiple triggers for setting a property)
    // While we do have `hasComputedEffect` this is set on the property's
    // dependencies rather than itself.
    if (info.computed) {
      if (proto._hasReadOnlyEffect(name)) {
        console.warn(`Cannot redefine computed property '${name}'.`);
      } else {
        proto._createComputedProperty(name, info.computed, allProps);
      }
    }
    if (info.readOnly && !proto._hasReadOnlyEffect(name)) {
      proto._createReadOnlyProperty(name, !info.computed);
    } else if (info.readOnly === false && proto._hasReadOnlyEffect(name)) {
      console.warn(`Cannot make readOnly property '${name}' non-readOnly.`);
    }
    if (info.reflectToAttribute && !proto._hasReflectEffect(name)) {
      proto._createReflectedProperty(name);
    } else if (info.reflectToAttribute === false && proto._hasReflectEffect(name)) {
      console.warn(`Cannot make reflected property '${name}' non-reflected.`);
    }
    if (info.notify && !proto._hasNotifyEffect(name)) {
      proto._createNotifyingProperty(name);
    } else if (info.notify === false && proto._hasNotifyEffect(name)) {
      console.warn(`Cannot make notify property '${name}' non-notify.`);
    }
    // always add observer
    if (info.observer) {
      proto._createPropertyObserver(name, info.observer, allProps[info.observer]);
    }
    // always create the mapping from attribute back to property for deserialization.
    proto._addPropertyToAttributeMap(name);
  }

  /**
   * Process all style elements in the element template. Styles with the
   * `include` attribute are processed such that any styles in
   * the associated "style modules" are included in the element template.
   * @param {PolymerElementConstructor} klass Element class
   * @param {!HTMLTemplateElement} template Template to process
   * @param {string} is Name of element
   * @param {string} baseURI Base URI for element
   * @private
   */
  function processElementStyles(klass, template, is, baseURI) {
    if (!builtCSS) {
      const templateStyles = template.content.querySelectorAll('style');
      const stylesWithImports = stylesFromTemplate(template);
      // insert styles from <link rel="import" type="css"> at the top of the template
      const linkedStyles = stylesFromModuleImports(is);
      const firstTemplateChild = template.content.firstElementChild;
      for (let idx = 0; idx < linkedStyles.length; idx++) {
        let s = linkedStyles[idx];
        s.textContent = klass._processStyleText(s.textContent, baseURI);
        template.content.insertBefore(s, firstTemplateChild);
      }
      // keep track of the last "concrete" style in the template we have encountered
      let templateStyleIndex = 0;
      // ensure all gathered styles are actually in this template.
      for (let i = 0; i < stylesWithImports.length; i++) {
        let s = stylesWithImports[i];
        let templateStyle = templateStyles[templateStyleIndex];
        // if the style is not in this template, it's been "included" and
        // we put a clone of it in the template before the style that included it
        if (templateStyle !== s) {
          s = s.cloneNode(true);
          templateStyle.parentNode.insertBefore(s, templateStyle);
        } else {
          templateStyleIndex++;
        }
        s.textContent = klass._processStyleText(s.textContent, baseURI);
      }
    }
    if (window.ShadyCSS) {
      window.ShadyCSS.prepareTemplate(template, is);
    }
    // Support for `adoptedStylesheets` relies on using native Shadow DOM
    // and built CSS. Built CSS is required because runtime transformation of
    // `@apply` is not supported. This is because ShadyCSS relies on being able
    // to update a `style` element in the element template and this is
    // removed when using `adoptedStyleSheets`.
    // Note, it would be more efficient to allow style includes to become
    // separate stylesheets; however, because of `@apply` these are
    // potentially not shareable and sharing the ones that could be shared
    // would require some coordination. To keep it simple, all the includes
    // and styles are collapsed into a single shareable stylesheet.
    if (useAdoptedStyleSheetsWithBuiltCSS && builtCSS &&
        supportsAdoptingStyleSheets) {
      // Remove styles in template and make a shareable stylesheet
      const styles = template.content.querySelectorAll('style');
      if (styles) {
        let css = '';
        Array.from(styles).forEach(s => {
          css += s.textContent;
          s.parentNode.removeChild(s);
        });
        klass._styleSheet = new CSSStyleSheet();
        klass._styleSheet.replaceSync(css);
      }
    }
  }

  /**
   * Look up template from dom-module for element
   *
   * @param {string} is Element name to look up
   * @return {?HTMLTemplateElement|undefined} Template found in dom module, or
   *   undefined if not found
   * @protected
   */
  function getTemplateFromDomModule(is) {
    let template = null;
    // Under strictTemplatePolicy in 3.x+, dom-module lookup is only allowed
    // when opted-in via allowTemplateFromDomModule
    if (is && (!strictTemplatePolicy || allowTemplateFromDomModule)) {
      template = /** @type {?HTMLTemplateElement} */ (
          DomModule.import(is, 'template'));
      // Under strictTemplatePolicy, require any element with an `is`
      // specified to have a dom-module
      if (strictTemplatePolicy && !template) {
        throw new Error(`strictTemplatePolicy: expecting dom-module or null template for ${is}`);
      }
    }
    return template;
  }

  /**
   * @polymer
   * @mixinClass
   * @unrestricted
   * @implements {Polymer_ElementMixin}
   * @extends {polymerElementBase}
   */
  class PolymerElement extends polymerElementBase {

    /**
     * Current Polymer version in Semver notation.
     * @type {string} Semver notation of the current version of Polymer.
     * @nocollapse
     */
    static get polymerElementVersion() {
      return version;
    }

    /**
     * Override of PropertiesMixin _finalizeClass to create observers and
     * find the template.
     * @return {void}
     * @protected
     * @suppress {missingProperties} Interfaces in closure do not inherit statics, but classes do
     * @nocollapse
     */
    static _finalizeClass() {
      // TODO(https://github.com/google/closure-compiler/issues/3240):
      //     Change back to just super.methodCall()
      polymerElementBase._finalizeClass.call(this);
      const observers = ownObservers(this);
      if (observers) {
        this.createObservers(observers, this._properties);
      }
      this._prepareTemplate();
    }

    /** @nocollapse */
    static _prepareTemplate() {
      // note: create "working" template that is finalized at instance time
      let template = /** @type {PolymerElementConstructor} */ (this).template;
      if (template) {
        if (typeof template === 'string') {
          console.error('template getter must return HTMLTemplateElement');
          template = null;
        } else if (!legacyOptimizations) {
          template = template.cloneNode(true);
        }
      }

      /** @override */
      this.prototype._template = template;
    }

    /**
     * Override of PropertiesChanged createProperties to create accessors
     * and property effects for all of the properties.
     * @param {!Object} props .
     * @return {void}
     * @protected
     * @nocollapse
     */
    static createProperties(props) {
      for (let p in props) {
        createPropertyFromConfig(
            /** @type {?} */ (this.prototype), p, props[p], props);
      }
    }

    /**
     * Creates observers for the given `observers` array.
     * Leverages `PropertyEffects` to create observers.
     * @param {Object} observers Array of observer descriptors for
     *   this class
     * @param {Object} dynamicFns Object containing keys for any properties
     *   that are functions and should trigger the effect when the function
     *   reference is changed
     * @return {void}
     * @protected
     * @nocollapse
     */
    static createObservers(observers, dynamicFns) {
      const proto = this.prototype;
      for (let i=0; i < observers.length; i++) {
        proto._createMethodObserver(observers[i], dynamicFns);
      }
    }

    /**
     * Returns the template that will be stamped into this element's shadow root.
     *
     * If a `static get is()` getter is defined, the default implementation will
     * return the first `<template>` in a `dom-module` whose `id` matches this
     * element's `is` (note that a `_template` property on the class prototype
     * takes precedence over the `dom-module` template, to maintain legacy
     * element semantics; a subclass will subsequently fall back to its super
     * class template if neither a `prototype._template` or a `dom-module` for
     * the class's `is` was found).
     *
     * Users may override this getter to return an arbitrary template
     * (in which case the `is` getter is unnecessary). The template returned
     * must be an `HTMLTemplateElement`.
     *
     * Note that when subclassing, if the super class overrode the default
     * implementation and the subclass would like to provide an alternate
     * template via a `dom-module`, it should override this getter and
     * return `DomModule.import(this.is, 'template')`.
     *
     * If a subclass would like to modify the super class template, it should
     * clone it rather than modify it in place.  If the getter does expensive
     * work such as cloning/modifying a template, it should memoize the
     * template for maximum performance:
     *
     *   let memoizedTemplate;
     *   class MySubClass extends MySuperClass {
     *     static get template() {
     *       if (!memoizedTemplate) {
     *         memoizedTemplate = super.template.cloneNode(true);
     *         let subContent = document.createElement('div');
     *         subContent.textContent = 'This came from MySubClass';
     *         memoizedTemplate.content.appendChild(subContent);
     *       }
     *       return memoizedTemplate;
     *     }
     *   }
     *
     * @return {!HTMLTemplateElement|string} Template to be stamped
     * @nocollapse
     */
    static get template() {
      // Explanation of template-related properties:
      // - constructor.template (this getter): the template for the class.
      //     This can come from the prototype (for legacy elements), from a
      //     dom-module, or from the super class's template (or can be overridden
      //     altogether by the user)
      // - constructor._template: memoized version of constructor.template
      // - prototype._template: working template for the element, which will be
      //     parsed and modified in place. It is a cloned version of
      //     constructor.template, saved in _finalizeClass(). Note that before
      //     this getter is called, for legacy elements this could be from a
      //     _template field on the info object passed to Polymer(), a behavior,
      //     or set in registered(); once the static getter runs, a clone of it
      //     will overwrite it on the prototype as the working template.
      if (!this.hasOwnProperty(JSCompiler_renameProperty('_template', this))) {
        let protoTemplate = this.prototype.hasOwnProperty(
          JSCompiler_renameProperty('_template', this.prototype)) ?
          this.prototype._template : undefined;
        // Accept a function for the legacy Polymer({_template:...}) field for
        // lazy parsing
        if (typeof protoTemplate === 'function') {
          protoTemplate = protoTemplate();
        }
        this._template =
          // If user has put template on prototype (e.g. in legacy via registered
          // callback or info object), prefer that first. Note that `null` is
          // used as a sentinel to indicate "no template" and can be used to
          // override a super template, whereas `undefined` is used as a
          // sentinel to mean "fall-back to default template lookup" via
          // dom-module and/or super.template.
          protoTemplate !== undefined ? protoTemplate :
          // Look in dom-module associated with this element's is
          ((this.hasOwnProperty(JSCompiler_renameProperty('is', this)) &&
          (getTemplateFromDomModule(/** @type {PolymerElementConstructor}*/ (this).is))) ||
          // Next look for superclass template (call the super impl this
          // way so that `this` points to the superclass)
          Object.getPrototypeOf(/** @type {PolymerElementConstructor}*/ (this).prototype).constructor.template);
      }
      return this._template;
    }

    /**
     * Set the template.
     *
     * @param {!HTMLTemplateElement|string} value Template to set.
     * @nocollapse
     */
    static set template(value) {
      this._template = value;
    }

    /**
     * Path matching the url from which the element was imported.
     *
     * This path is used to resolve url's in template style cssText.
     * The `importPath` property is also set on element instances and can be
     * used to create bindings relative to the import path.
     *
     * For elements defined in ES modules, users should implement
     * `static get importMeta() { return import.meta; }`, and the default
     * implementation of `importPath` will  return `import.meta.url`'s path.
     * For elements defined in HTML imports, this getter will return the path
     * to the document containing a `dom-module` element matching this
     * element's static `is` property.
     *
     * Note, this path should contain a trailing `/`.
     *
     * @return {string} The import path for this element class
     * @suppress {missingProperties}
     * @nocollapse
     */
    static get importPath() {
      if (!this.hasOwnProperty(JSCompiler_renameProperty('_importPath', this))) {
        const meta = this.importMeta;
        if (meta) {
          this._importPath = pathFromUrl(meta.url);
        } else {
          const module = DomModule.import(/** @type {PolymerElementConstructor} */ (this).is);
          this._importPath = (module && module.assetpath) ||
            Object.getPrototypeOf(/** @type {PolymerElementConstructor}*/ (this).prototype).constructor.importPath;
        }
      }
      return this._importPath;
    }

    constructor() {
      super();
      /** @type {HTMLTemplateElement} */
      this._template;
      /** @type {string} */
      this._importPath;
      /** @type {string} */
      this.rootPath;
      /** @type {string} */
      this.importPath;
      /** @type {StampedTemplate | HTMLElement | ShadowRoot} */
      this.root;
      /** @type {!Object<string, !Element>} */
      this.$;
    }

    /**
     * Overrides the default `PropertyAccessors` to ensure class
     * metaprogramming related to property accessors and effects has
     * completed (calls `finalize`).
     *
     * It also initializes any property defaults provided via `value` in
     * `properties` metadata.
     *
     * @return {void}
     * @override
     * @suppress {invalidCasts,missingProperties} go/missingfnprops
     */
    _initializeProperties() {
      this.constructor.finalize();
      // note: finalize template when we have access to `localName` to
      // avoid dependence on `is` for polyfilling styling.
      this.constructor._finalizeTemplate(/** @type {!HTMLElement} */(this).localName);
      super._initializeProperties();
      // set path defaults
      this.rootPath = rootPath;
      this.importPath = this.constructor.importPath;
      // apply property defaults...
      let p$ = propertyDefaults(this.constructor);
      if (!p$) {
        return;
      }
      for (let p in p$) {
        let info = p$[p];
        if (this._canApplyPropertyDefault(p)) {
          let value = typeof info.value == 'function' ?
            info.value.call(this) :
            info.value;
          // Set via `_setProperty` if there is an accessor, to enable
          // initializing readOnly property defaults
          if (this._hasAccessor(p)) {
            this._setPendingProperty(p, value, true);
          } else {
            this[p] = value;
          }
        }
      }
    }

    /**
     * Determines if a property dfeault can be applied. For example, this
     * prevents a default from being applied when a property that has no
     * accessor is overridden by its host before upgrade (e.g. via a binding).
     * @override
     * @param {string} property Name of the property
     * @return {boolean} Returns true if the property default can be applied.
     */
    _canApplyPropertyDefault(property) {
      return !this.hasOwnProperty(property);
    }

    /**
     * Gather style text for a style element in the template.
     *
     * @param {string} cssText Text containing styling to process
     * @param {string} baseURI Base URI to rebase CSS paths against
     * @return {string} The processed CSS text
     * @protected
     * @nocollapse
     */
    static _processStyleText(cssText, baseURI) {
      return resolveCss(cssText, baseURI);
    }

    /**
    * Configures an element `proto` to function with a given `template`.
    * The element name `is` and extends `ext` must be specified for ShadyCSS
    * style scoping.
    *
    * @param {string} is Tag name (or type extension name) for this element
    * @return {void}
    * @protected
    * @nocollapse
    */
    static _finalizeTemplate(is) {
      /** @const {HTMLTemplateElement} */
      const template = this.prototype._template;
      if (template && !template.__polymerFinalized) {
        template.__polymerFinalized = true;
        const importPath = this.importPath;
        const baseURI = importPath ? resolveUrl(importPath) : '';
        // e.g. support `include="module-name"`, and ShadyCSS
        processElementStyles(this, template, is, baseURI);
        this.prototype._bindTemplate(template);
      }
    }

    /**
     * Provides a default implementation of the standard Custom Elements
     * `connectedCallback`.
     *
     * The default implementation enables the property effects system and
     * flushes any pending properties, and updates shimmed CSS properties
     * when using the ShadyCSS scoping/custom properties polyfill.
     *
     * @override
     * @suppress {missingProperties, invalidCasts} Super may or may not
     *     implement the callback
     * @return {void}
     */
    connectedCallback() {
      if (window.ShadyCSS && this._template) {
        window.ShadyCSS.styleElement(/** @type {!HTMLElement} */(this));
      }
      super.connectedCallback();
    }

    /**
     * Stamps the element template.
     *
     * @return {void}
     * @override
     */
    ready() {
      if (this._template) {
        this.root = this._stampTemplate(this._template);
        this.$ = this.root.$;
      }
      super.ready();
    }

    /**
     * Implements `PropertyEffects`'s `_readyClients` call. Attaches
     * element dom by calling `_attachDom` with the dom stamped from the
     * element's template via `_stampTemplate`. Note that this allows
     * client dom to be attached to the element prior to any observers
     * running.
     *
     * @return {void}
     * @override
     */
    _readyClients() {
      if (this._template) {
        this.root = this._attachDom(/** @type {StampedTemplate} */(this.root));
      }
      // The super._readyClients here sets the clients initialized flag.
      // We must wait to do this until after client dom is created/attached
      // so that this flag can be checked to prevent notifications fired
      // during this process from being handled before clients are ready.
      super._readyClients();
    }


    /**
     * Attaches an element's stamped dom to itself. By default,
     * this method creates a `shadowRoot` and adds the dom to it.
     * However, this method may be overridden to allow an element
     * to put its dom in another location.
     *
     * @override
     * @throws {Error}
     * @suppress {missingReturn}
     * @param {StampedTemplate} dom to attach to the element.
     * @return {ShadowRoot} node to which the dom has been attached.
     */
    _attachDom(dom) {
      const n = wrap(this);
      if (n.attachShadow) {
        if (dom) {
          if (!n.shadowRoot) {
            n.attachShadow({mode: 'open', shadyUpgradeFragment: dom});
            n.shadowRoot.appendChild(dom);
            // When `adoptedStyleSheets` is supported a stylesheet is made
            // available on the element constructor.
            if (this.constructor._styleSheet) {
              n.shadowRoot.adoptedStyleSheets = [this.constructor._styleSheet];
            }
          }
          if (syncInitialRender && window.ShadyDOM) {
            window.ShadyDOM.flushInitial(n.shadowRoot);
          }
          return n.shadowRoot;
        }
        return null;
      } else {
        throw new Error('ShadowDOM not available. ' +
          // TODO(sorvell): move to compile-time conditional when supported
        'PolymerElement can create dom as children instead of in ' +
        'ShadowDOM by setting `this.root = this;\` before \`ready\`.');
      }
    }

    /**
     * When using the ShadyCSS scoping and custom property shim, causes all
     * shimmed styles in this element (and its subtree) to be updated
     * based on current custom property values.
     *
     * The optional parameter overrides inline custom property styles with an
     * object of properties where the keys are CSS properties, and the values
     * are strings.
     *
     * Example: `this.updateStyles({'--color': 'blue'})`
     *
     * These properties are retained unless a value of `null` is set.
     *
     * Note: This function does not support updating CSS mixins.
     * You can not dynamically change the value of an `@apply`.
     *
     * @override
     * @param {Object=} properties Bag of custom property key/values to
     *   apply to this element.
     * @return {void}
     * @suppress {invalidCasts}
     */
    updateStyles(properties) {
      if (window.ShadyCSS) {
        window.ShadyCSS.styleSubtree(/** @type {!HTMLElement} */(this), properties);
      }
    }

    /**
     * Rewrites a given URL relative to a base URL. The base URL defaults to
     * the original location of the document containing the `dom-module` for
     * this element. This method will return the same URL before and after
     * bundling.
     *
     * Note that this function performs no resolution for URLs that start
     * with `/` (absolute URLs) or `#` (hash identifiers).  For general purpose
     * URL resolution, use `window.URL`.
     *
     * @override
     * @param {string} url URL to resolve.
     * @param {string=} base Optional base URL to resolve against, defaults
     * to the element's `importPath`
     * @return {string} Rewritten URL relative to base
     */
    resolveUrl(url, base) {
      if (!base && this.importPath) {
        base = resolveUrl(this.importPath);
      }
      return resolveUrl(url, base);
    }

    /**
     * Overrides `PropertyEffects` to add map of dynamic functions on
     * template info, for consumption by `PropertyEffects` template binding
     * code. This map determines which method templates should have accessors
     * created for them.
     *
     * @param {!HTMLTemplateElement} template Template
     * @param {!TemplateInfo} templateInfo Template metadata for current template
     * @param {!NodeInfo} nodeInfo Node metadata for current template.
     * @return {boolean} .
     * @suppress {missingProperties} Interfaces in closure do not inherit statics, but classes do
     * @nocollapse
     */
    static _parseTemplateContent(template, templateInfo, nodeInfo) {
      templateInfo.dynamicFns = templateInfo.dynamicFns || this._properties;
      // TODO(https://github.com/google/closure-compiler/issues/3240):
      //     Change back to just super.methodCall()
      return polymerElementBase._parseTemplateContent.call(
        this, template, templateInfo, nodeInfo);
    }

    /**
     * Overrides `PropertyEffects` to warn on use of undeclared properties in
     * template.
     *
     * @param {Object} templateInfo Template metadata to add effect to
     * @param {string} prop Property that should trigger the effect
     * @param {Object=} effect Effect metadata object
     * @return {void}
     * @protected
     * @suppress {missingProperties} Interfaces in closure do not inherit statics, but classes do
     * @nocollapse
     */
    static _addTemplatePropertyEffect(templateInfo, prop, effect) {
      // Warn if properties are used in template without being declared.
      // Properties must be listed in `properties` to be included in
      // `observedAttributes` since CE V1 reads that at registration time, and
      // since we want to keep template parsing lazy, we can't automatically
      // add undeclared properties used in templates to `observedAttributes`.
      // The warning is only enabled in `legacyOptimizations` mode, since
      // we don't want to spam existing users who might have adopted the
      // shorthand when attribute deserialization is not important.
      if (legacyWarnings && !(prop in this._properties) &&
          // Methods used in templates with no dependencies (or only literal
          // dependencies) become accessors with template effects; ignore these
          !(effect.info.part.signature && effect.info.part.signature.static) &&
          // Warnings for bindings added to nested templates are handled by
          // templatizer so ignore both the host-to-template bindings
          // (`hostProp`) and TemplateInstance-to-child bindings
          // (`nestedTemplate`)
          !effect.info.part.hostProp && !templateInfo.nestedTemplate) {
        console.warn(`Property '${prop}' used in template but not declared in 'properties'; ` +
          `attribute will not be observed.`);
      }
      // TODO(https://github.com/google/closure-compiler/issues/3240):
      //     Change back to just super.methodCall()
      return polymerElementBase._addTemplatePropertyEffect.call(
        this, templateInfo, prop, effect);
    }

  }

  return PolymerElement;
});

/**
@license
Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

/**
 * Our TrustedTypePolicy for HTML which is declared using the Polymer html
 * template tag function.
 *
 * That HTML is a developer-authored constant, and is parsed with innerHTML
 * before any untrusted expressions have been mixed in. Therefor it is
 * considered safe by construction.
 *
 * @type {!TrustedTypePolicy|undefined}
 */
const policy = window.trustedTypes &&
    trustedTypes.createPolicy('polymer-html-literal', {createHTML: (s) => s});

/**
 * Class representing a static string value which can be used to filter
 * strings by asseting that they have been created via this class. The
 * `value` property returns the string passed to the constructor.
 */
class LiteralString {
  /**
   * @param {!ITemplateArray} strings Constant parts of tagged template literal
   * @param {!Array<*>} values Variable parts of tagged template literal
   */
  constructor(strings, values) {
    assertValidTemplateStringParameters(strings, values);
    const string = values.reduce(
        (acc, v, idx) => acc + literalValue(v) + strings[idx + 1], strings[0]);
    /** @type {string} */
    this.value = string.toString();
  }
  /**
   * @return {string} LiteralString string value
   * @override
   */
  toString() {
    return this.value;
  }
}

/**
 * @param {*} value Object to stringify into HTML
 * @return {string} HTML stringified form of `obj`
 */
function literalValue(value) {
  if (value instanceof LiteralString) {
    return /** @type {!LiteralString} */(value).value;
  } else {
    throw new Error(
        `non-literal value passed to Polymer's htmlLiteral function: ${value}`
    );
  }
}

/**
 * @param {*} value Object to stringify into HTML
 * @return {string} HTML stringified form of `obj`
 */
function htmlValue(value) {
  if (value instanceof HTMLTemplateElement) {
    // This might be an mXSS risk – mainly in the case where this template
    // contains untrusted content that was believed to be sanitized.
    // However we can't just use the XMLSerializer here because it misencodes
    // `>` characters inside style tags.
    // For an example of an actual case that hit this encoding issue,
    // see b/198592167
    return /** @type {!HTMLTemplateElement } */(value).innerHTML;
  } else if (value instanceof LiteralString) {
    return literalValue(value);
  } else {
    throw new Error(
        `non-template value passed to Polymer's html function: ${value}`);
  }
}

/**
 * A template literal tag that creates an HTML <template> element from the
 * contents of the string.
 *
 * This allows you to write a Polymer Template in JavaScript.
 *
 * Templates can be composed by interpolating `HTMLTemplateElement`s in
 * expressions in the JavaScript template literal. The nested template's
 * `innerHTML` is included in the containing template.  The only other
 * values allowed in expressions are those returned from `htmlLiteral`
 * which ensures only literal values from JS source ever reach the HTML, to
 * guard against XSS risks.
 *
 * All other values are disallowed in expressions to help prevent XSS
 * attacks; however, `htmlLiteral` can be used to compose static
 * string values into templates. This is useful to compose strings into
 * places that do not accept html, like the css text of a `style`
 * element.
 *
 * Example:
 *
 *     static get template() {
 *       return html`
 *         <style>:host{ content:"..." }</style>
 *         <div class="shadowed">${this.partialTemplate}</div>
 *         ${super.template}
 *       `;
 *     }
 *     static get partialTemplate() { return html`<span>Partial!</span>`; }
 *
 * @param {!ITemplateArray} strings Constant parts of tagged template literal
 * @param {...*} values Variable parts of tagged template literal
 * @return {!HTMLTemplateElement} Constructed HTMLTemplateElement
 */
const html = function html(strings, ...values) {
  assertValidTemplateStringParameters(strings, values);
  const template =
      /** @type {!HTMLTemplateElement} */ (document.createElement('template'));
  let value = values.reduce(
      (acc, v, idx) => acc + htmlValue(v) + strings[idx + 1], strings[0]);
  if (policy) {
    value = policy.createHTML(value);
  }
  template.innerHTML = value;
  return template;
};

/**
 * @param {!ITemplateArray} strings Constant parts of tagged template literal
 * @param {!Array<*>} values Array of values from quasis
 */
const assertValidTemplateStringParameters = (strings, values) => {
  // Note: if/when https://github.com/tc39/proposal-array-is-template-object
  // is standardized, use that instead when available, as it can perform an
  // unforgable check (though of course, the function itself can be forged).
  if (!Array.isArray(strings) || !Array.isArray(strings.raw) ||
      (values.length !== strings.length - 1)) {
    // This is either caused by a browser bug, a compiler bug, or someone
    // calling the html template tag function as a regular function.
    //
    throw new TypeError('Invalid call to the html template tag');
  }
};

/**
@license
Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/


/**
 * Base class that provides the core API for Polymer's meta-programming
 * features including template stamping, data-binding, attribute deserialization,
 * and property change observation.
 *
 * @customElement
 * @polymer
 * @constructor
 * @implements {Polymer_ElementMixin}
 * @extends HTMLElement
 * @appliesMixin ElementMixin
 * @summary Custom element base class that provides the core API for Polymer's
 *   key meta-programming features including template stamping, data-binding,
 *   attribute deserialization, and property change observation
 */
const PolymerElement = ElementMixin$1(HTMLElement);

const DEV_MODE_CODE_REGEXP =
  /\/\*[\*!]\s+vaadin-dev-mode:start([\s\S]*)vaadin-dev-mode:end\s+\*\*\//i;

const FlowClients = window.Vaadin && window.Vaadin.Flow && window.Vaadin.Flow.clients;

function isMinified() {
  function test() {
    /** vaadin-dev-mode:start
    return false;
    vaadin-dev-mode:end **/
    return true;
  }
  return uncommentAndRun(test);
}

function isDevelopmentMode() {
  try {
    if (isForcedDevelopmentMode()) {
      return true;
    }

    if (!isLocalhost()) {
      return false;
    }

    if (FlowClients) {
      return !isFlowProductionMode();
    }

    return !isMinified();
  } catch (e) {
    // Some error in this code, assume production so no further actions will be taken
    return false;
  }
}

function isForcedDevelopmentMode() {
  return localStorage.getItem("vaadin.developmentmode.force");
}

function isLocalhost() {
  return (["localhost","127.0.0.1"].indexOf(window.location.hostname) >= 0);
}

function isFlowProductionMode() {
  if (FlowClients) {
    const productionModeApps = Object.keys(FlowClients)
      .map(key => FlowClients[key])
      .filter(client => client.productionMode);
    if (productionModeApps.length > 0) {
      return true;
    }
  }
  return false;
}

function uncommentAndRun(callback, args) {
  if (typeof callback !== 'function') {
    return;
  }

  const match = DEV_MODE_CODE_REGEXP.exec(callback.toString());
  if (match) {
    try {
      // requires CSP: script-src 'unsafe-eval'
      callback = new Function(match[1]);
    } catch (e) {
      // eat the exception
      console.log('vaadin-development-mode-detector: uncommentAndRun() failed', e);
    }
  }

  return callback(args);
}

// A guard against polymer-modulizer removing the window.Vaadin
// initialization above.
window['Vaadin'] = window['Vaadin'] || {};

/**
 * Inspects the source code of the given `callback` function for
 * specially-marked _commented_ code. If such commented code is found in the
 * callback source, uncomments and runs that code instead of the callback
 * itself. Otherwise runs the callback as is.
 *
 * The optional arguments are passed into the callback / uncommented code,
 * the result is returned.
 *
 * See the `isMinified()` function source code in this file for an example.
 *
 */
const runIfDevelopmentMode = function(callback, args) {
  if (window.Vaadin.developmentMode) {
    return uncommentAndRun(callback, args);
  }
};

if (window.Vaadin.developmentMode === undefined) {
  window.Vaadin.developmentMode = isDevelopmentMode();
}

/* This file is autogenerated from src/vaadin-usage-statistics.tpl.html */
/*

This script gathers usage statistics from the application running in development mode.

Statistics gathering is automatically disabled and excluded from production builds.

For details and to opt-out, see https://github.com/vaadin/vaadin-usage-statistics.

*/
/*
  FIXME(polymer-modulizer): the above comments were extracted
  from HTML and may be out of place here. Review them and
  then delete this comment!
*/

function maybeGatherAndSendStats() {
  /** vaadin-dev-mode:start
  (function () {
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

var getPolymerVersion = function getPolymerVersion() {
  return window.Polymer && window.Polymer.version;
};

var StatisticsGatherer = function () {
  function StatisticsGatherer(logger) {
    classCallCheck(this, StatisticsGatherer);

    this.now = new Date().getTime();
    this.logger = logger;
  }

  createClass(StatisticsGatherer, [{
    key: 'frameworkVersionDetectors',
    value: function frameworkVersionDetectors() {
      return {
        'Flow': function Flow() {
          if (window.Vaadin && window.Vaadin.Flow && window.Vaadin.Flow.clients) {
            var flowVersions = Object.keys(window.Vaadin.Flow.clients).map(function (key) {
              return window.Vaadin.Flow.clients[key];
            }).filter(function (client) {
              return client.getVersionInfo;
            }).map(function (client) {
              return client.getVersionInfo().flow;
            });
            if (flowVersions.length > 0) {
              return flowVersions[0];
            }
          }
        },
        'Vaadin Framework': function VaadinFramework() {
          if (window.vaadin && window.vaadin.clients) {
            var frameworkVersions = Object.values(window.vaadin.clients).filter(function (client) {
              return client.getVersionInfo;
            }).map(function (client) {
              return client.getVersionInfo().vaadinVersion;
            });
            if (frameworkVersions.length > 0) {
              return frameworkVersions[0];
            }
          }
        },
        'AngularJs': function AngularJs() {
          if (window.angular && window.angular.version && window.angular.version) {
            return window.angular.version.full;
          }
        },
        'Angular': function Angular() {
          if (window.ng) {
            var tags = document.querySelectorAll("[ng-version]");
            if (tags.length > 0) {
              return tags[0].getAttribute("ng-version");
            }
            return "Unknown";
          }
        },
        'Backbone.js': function BackboneJs() {
          if (window.Backbone) {
            return window.Backbone.VERSION;
          }
        },
        'React': function React() {
          var reactSelector = '[data-reactroot], [data-reactid]';
          if (!!document.querySelector(reactSelector)) {
            // React does not publish the version by default
            return "unknown";
          }
        },
        'Ember': function Ember() {
          if (window.Em && window.Em.VERSION) {
            return window.Em.VERSION;
          } else if (window.Ember && window.Ember.VERSION) {
            return window.Ember.VERSION;
          }
        },
        'jQuery': function (_jQuery) {
          function jQuery() {
            return _jQuery.apply(this, arguments);
          }

          jQuery.toString = function () {
            return _jQuery.toString();
          };

          return jQuery;
        }(function () {
          if (typeof jQuery === 'function' && jQuery.prototype.jquery !== undefined) {
            return jQuery.prototype.jquery;
          }
        }),
        'Polymer': function Polymer() {
          var version = getPolymerVersion();
          if (version) {
            return version;
          }
        },
        'LitElement': function LitElement() {
          var version = window.litElementVersions && window.litElementVersions[0];
          if (version) {
            return version;
          }
        },
        'LitHtml': function LitHtml() {
          var version = window.litHtmlVersions && window.litHtmlVersions[0];
          if (version) {
            return version;
          }
        },
        'Vue.js': function VueJs() {
          if (window.Vue) {
            return window.Vue.version;
          }
        }
      };
    }
  }, {
    key: 'getUsedVaadinElements',
    value: function getUsedVaadinElements(elements) {
      var version = getPolymerVersion();
      var elementClasses = void 0;
      // NOTE: In case you edit the code here, YOU MUST UPDATE any statistics reporting code in Flow.
      // Check all locations calling the method getEntries() in
      // https://github.com/vaadin/flow/blob/master/flow-server/src/main/java/com/vaadin/flow/internal/UsageStatistics.java#L106
      // Currently it is only used by BootstrapHandler.
      if (version && version.indexOf('2') === 0) {
        // Polymer 2: components classes are stored in window.Vaadin
        elementClasses = Object.keys(window.Vaadin).map(function (c) {
          return window.Vaadin[c];
        }).filter(function (c) {
          return c.is;
        });
      } else {
        // Polymer 3: components classes are stored in window.Vaadin.registrations
        elementClasses = window.Vaadin.registrations || [];
      }
      elementClasses.forEach(function (klass) {
        var version = klass.version ? klass.version : "0.0.0";
        elements[klass.is] = { version: version };
      });
    }
  }, {
    key: 'getUsedVaadinThemes',
    value: function getUsedVaadinThemes(themes) {
      ['Lumo', 'Material'].forEach(function (themeName) {
        var theme;
        var version = getPolymerVersion();
        if (version && version.indexOf('2') === 0) {
          // Polymer 2: themes are stored in window.Vaadin
          theme = window.Vaadin[themeName];
        } else {
          // Polymer 3: themes are stored in custom element registry
          theme = customElements.get('vaadin-' + themeName.toLowerCase() + '-styles');
        }
        if (theme && theme.version) {
          themes[themeName] = { version: theme.version };
        }
      });
    }
  }, {
    key: 'getFrameworks',
    value: function getFrameworks(frameworks) {
      var detectors = this.frameworkVersionDetectors();
      Object.keys(detectors).forEach(function (framework) {
        var detector = detectors[framework];
        try {
          var version = detector();
          if (version) {
            frameworks[framework] = { version: version };
          }
        } catch (e) {}
      });
    }
  }, {
    key: 'gather',
    value: function gather(storage) {
      var storedStats = storage.read();
      var gatheredStats = {};
      var types = ["elements", "frameworks", "themes"];

      types.forEach(function (type) {
        gatheredStats[type] = {};
        if (!storedStats[type]) {
          storedStats[type] = {};
        }
      });

      var previousStats = JSON.stringify(storedStats);

      this.getUsedVaadinElements(gatheredStats.elements);
      this.getFrameworks(gatheredStats.frameworks);
      this.getUsedVaadinThemes(gatheredStats.themes);

      var now = this.now;
      types.forEach(function (type) {
        var keys = Object.keys(gatheredStats[type]);
        keys.forEach(function (key) {
          if (!storedStats[type][key] || _typeof(storedStats[type][key]) != _typeof({})) {
            storedStats[type][key] = { firstUsed: now };
          }
          // Discards any previously logged version number
          storedStats[type][key].version = gatheredStats[type][key].version;
          storedStats[type][key].lastUsed = now;
        });
      });

      var newStats = JSON.stringify(storedStats);
      storage.write(newStats);
      if (newStats != previousStats && Object.keys(storedStats).length > 0) {
        this.logger.debug("New stats: " + newStats);
      }
    }
  }]);
  return StatisticsGatherer;
}();

var StatisticsStorage = function () {
  function StatisticsStorage(key) {
    classCallCheck(this, StatisticsStorage);

    this.key = key;
  }

  createClass(StatisticsStorage, [{
    key: 'read',
    value: function read() {
      var localStorageStatsString = localStorage.getItem(this.key);
      try {
        return JSON.parse(localStorageStatsString ? localStorageStatsString : '{}');
      } catch (e) {
        return {};
      }
    }
  }, {
    key: 'write',
    value: function write(data) {
      localStorage.setItem(this.key, data);
    }
  }, {
    key: 'clear',
    value: function clear() {
      localStorage.removeItem(this.key);
    }
  }, {
    key: 'isEmpty',
    value: function isEmpty() {
      var storedStats = this.read();
      var empty = true;
      Object.keys(storedStats).forEach(function (key) {
        if (Object.keys(storedStats[key]).length > 0) {
          empty = false;
        }
      });

      return empty;
    }
  }]);
  return StatisticsStorage;
}();

var StatisticsSender = function () {
  function StatisticsSender(url, logger) {
    classCallCheck(this, StatisticsSender);

    this.url = url;
    this.logger = logger;
  }

  createClass(StatisticsSender, [{
    key: 'send',
    value: function send(data, errorHandler) {
      var logger = this.logger;

      if (navigator.onLine === false) {
        logger.debug("Offline, can't send");
        errorHandler();
        return;
      }
      logger.debug("Sending data to " + this.url);

      var req = new XMLHttpRequest();
      req.withCredentials = true;
      req.addEventListener("load", function () {
        // Stats sent, nothing more to do
        logger.debug("Response: " + req.responseText);
      });
      req.addEventListener("error", function () {
        logger.debug("Send failed");
        errorHandler();
      });
      req.addEventListener("abort", function () {
        logger.debug("Send aborted");
        errorHandler();
      });
      req.open("POST", this.url);
      req.setRequestHeader("Content-Type", "application/json");
      req.send(data);
    }
  }]);
  return StatisticsSender;
}();

var StatisticsLogger = function () {
  function StatisticsLogger(id) {
    classCallCheck(this, StatisticsLogger);

    this.id = id;
  }

  createClass(StatisticsLogger, [{
    key: '_isDebug',
    value: function _isDebug() {
      return localStorage.getItem("vaadin." + this.id + ".debug");
    }
  }, {
    key: 'debug',
    value: function debug(msg) {
      if (this._isDebug()) {
        console.info(this.id + ": " + msg);
      }
    }
  }]);
  return StatisticsLogger;
}();

var UsageStatistics = function () {
  function UsageStatistics() {
    classCallCheck(this, UsageStatistics);

    this.now = new Date();
    this.timeNow = this.now.getTime();
    this.gatherDelay = 10; // Delay between loading this file and gathering stats
    this.initialDelay = 24 * 60 * 60;

    this.logger = new StatisticsLogger("statistics");
    this.storage = new StatisticsStorage("vaadin.statistics.basket");
    this.gatherer = new StatisticsGatherer(this.logger);
    this.sender = new StatisticsSender("https://tools.vaadin.com/usage-stats/submit", this.logger);
  }

  createClass(UsageStatistics, [{
    key: 'maybeGatherAndSend',
    value: function maybeGatherAndSend() {
      var _this = this;

      if (localStorage.getItem(UsageStatistics.optOutKey)) {
        return;
      }
      this.gatherer.gather(this.storage);
      setTimeout(function () {
        _this.maybeSend();
      }, this.gatherDelay * 1000);
    }
  }, {
    key: 'lottery',
    value: function lottery() {
      return true;
    }
  }, {
    key: 'currentMonth',
    value: function currentMonth() {
      return this.now.getYear() * 12 + this.now.getMonth();
    }
  }, {
    key: 'maybeSend',
    value: function maybeSend() {
      var firstUse = Number(localStorage.getItem(UsageStatistics.firstUseKey));
      var monthProcessed = Number(localStorage.getItem(UsageStatistics.monthProcessedKey));

      if (!firstUse) {
        // Use a grace period to avoid interfering with tests, incognito mode etc
        firstUse = this.timeNow;
        localStorage.setItem(UsageStatistics.firstUseKey, firstUse);
      }

      if (this.timeNow < firstUse + this.initialDelay * 1000) {
        this.logger.debug("No statistics will be sent until the initial delay of " + this.initialDelay + "s has passed");
        return;
      }
      if (this.currentMonth() <= monthProcessed) {
        this.logger.debug("This month has already been processed");
        return;
      }
      localStorage.setItem(UsageStatistics.monthProcessedKey, this.currentMonth());
      // Use random sampling
      if (this.lottery()) {
        this.logger.debug("Congratulations, we have a winner!");
      } else {
        this.logger.debug("Sorry, no stats from you this time");
        return;
      }

      this.send();
    }
  }, {
    key: 'send',
    value: function send() {
      // Ensure we have the latest data
      this.gatherer.gather(this.storage);

      // Read, send and clean up
      var data = this.storage.read();
      data["firstUse"] = Number(localStorage.getItem(UsageStatistics.firstUseKey));
      data["usageStatisticsVersion"] = UsageStatistics.version;
      var info = 'This request contains usage statistics gathered from the application running in development mode. \n\nStatistics gathering is automatically disabled and excluded from production builds.\n\nFor details and to opt-out, see https://github.com/vaadin/vaadin-usage-statistics.\n\n\n\n';
      var self = this;
      this.sender.send(info + JSON.stringify(data), function () {
        // Revert the 'month processed' flag
        localStorage.setItem(UsageStatistics.monthProcessedKey, self.currentMonth() - 1);
      });
    }
  }], [{
    key: 'version',
    get: function get$1() {
      return '2.1.2';
    }
  }, {
    key: 'firstUseKey',
    get: function get$1() {
      return 'vaadin.statistics.firstuse';
    }
  }, {
    key: 'monthProcessedKey',
    get: function get$1() {
      return 'vaadin.statistics.monthProcessed';
    }
  }, {
    key: 'optOutKey',
    get: function get$1() {
      return 'vaadin.statistics.optout';
    }
  }]);
  return UsageStatistics;
}();

try {
  window.Vaadin = window.Vaadin || {};
  window.Vaadin.usageStatsChecker = window.Vaadin.usageStatsChecker || new UsageStatistics();
  window.Vaadin.usageStatsChecker.maybeGatherAndSend();
} catch (e) {
  // Intentionally ignored as this is not a problem in the app being developed
}

}());

  vaadin-dev-mode:end **/
}

const usageStatistics = function() {
  if (typeof runIfDevelopmentMode === 'function') {
    return runIfDevelopmentMode(maybeGatherAndSendStats);
  }
};

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */


/**
 * Async interface wrapper around `setTimeout`.
 *
 * @namespace
 * @summary Async interface wrapper around `setTimeout`.
 */
const timeOut = {
  /**
   * Returns a sub-module with the async interface providing the provided
   * delay.
   *
   * @memberof timeOut
   * @param {number=} delay Time to wait before calling callbacks in ms
   * @return {!AsyncInterface} An async timeout interface
   */
  after(delay) {
    return {
      run(fn) {
        return window.setTimeout(fn, delay);
      },
      cancel(handle) {
        window.clearTimeout(handle);
      },
    };
  },
  /**
   * Enqueues a function called in the next task.
   *
   * @memberof timeOut
   * @param {!Function} fn Callback to run
   * @param {number=} delay Delay in milliseconds
   * @return {number} Handle used for canceling task
   */
  run(fn, delay) {
    return window.setTimeout(fn, delay);
  },
  /**
   * Cancels a previously enqueued `timeOut` callback.
   *
   * @memberof timeOut
   * @param {number} handle Handle returned from `run` of callback to cancel
   * @return {void}
   */
  cancel(handle) {
    window.clearTimeout(handle);
  },
};

/**
 * Async interface wrapper around `requestIdleCallback`.  Falls back to
 * `setTimeout` on browsers that do not support `requestIdleCallback`.
 *
 * @namespace
 * @summary Async interface wrapper around `requestIdleCallback`.
 */
const idlePeriod = {
  /**
   * Enqueues a function called at `requestIdleCallback` timing.
   *
   * @memberof idlePeriod
   * @param {function(!IdleDeadline):void} fn Callback to run
   * @return {number} Handle used for canceling task
   */
  run(fn) {
    return window.requestIdleCallback ? window.requestIdleCallback(fn) : window.setTimeout(fn, 16);
  },
  /**
   * Cancels a previously enqueued `idlePeriod` callback.
   *
   * @memberof idlePeriod
   * @param {number} handle Handle returned from `run` of callback to cancel
   * @return {void}
   */
  cancel(handle) {
    if (window.cancelIdleCallback) {
      window.cancelIdleCallback(handle);
    } else {
      window.clearTimeout(handle);
    }
  },
};

/**
@license
Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

const debouncerQueue = new Set();

/**
 * @summary Collapse multiple callbacks into one invocation after a timer.
 */
class Debouncer {
  /**
   * Creates a debouncer if no debouncer is passed as a parameter
   * or it cancels an active debouncer otherwise. The following
   * example shows how a debouncer can be called multiple times within a
   * microtask and "debounced" such that the provided callback function is
   * called once. Add this method to a custom element:
   *
   * ```js
   * import {microTask} from '@vaadin/component-base/src/async.js';
   * import {Debouncer} from '@vaadin/component-base/src/debounce.js';
   * // ...
   *
   * _debounceWork() {
   *   this._debounceJob = Debouncer.debounce(this._debounceJob,
   *       microTask, () => this._doWork());
   * }
   * ```
   *
   * If the `_debounceWork` method is called multiple times within the same
   * microtask, the `_doWork` function will be called only once at the next
   * microtask checkpoint.
   *
   * Note: In testing it is often convenient to avoid asynchrony. To accomplish
   * this with a debouncer, you can use `enqueueDebouncer` and
   * `flush`. For example, extend the above example by adding
   * `enqueueDebouncer(this._debounceJob)` at the end of the
   * `_debounceWork` method. Then in a test, call `flush` to ensure
   * the debouncer has completed.
   *
   * @param {Debouncer?} debouncer Debouncer object.
   * @param {!AsyncInterface} asyncModule Object with Async interface
   * @param {function()} callback Callback to run.
   * @return {!Debouncer} Returns a debouncer object.
   */
  static debounce(debouncer, asyncModule, callback) {
    if (debouncer instanceof Debouncer) {
      // Cancel the async callback, but leave in debouncerQueue if it was
      // enqueued, to maintain 1.x flush order
      debouncer._cancelAsync();
    } else {
      debouncer = new Debouncer();
    }
    debouncer.setConfig(asyncModule, callback);
    return debouncer;
  }

  constructor() {
    this._asyncModule = null;
    this._callback = null;
    this._timer = null;
  }

  /**
   * Sets the scheduler; that is, a module with the Async interface,
   * a callback and optional arguments to be passed to the run function
   * from the async module.
   *
   * @param {!AsyncInterface} asyncModule Object with Async interface.
   * @param {function()} callback Callback to run.
   * @return {void}
   */
  setConfig(asyncModule, callback) {
    this._asyncModule = asyncModule;
    this._callback = callback;
    this._timer = this._asyncModule.run(() => {
      this._timer = null;
      debouncerQueue.delete(this);
      this._callback();
    });
  }

  /**
   * Cancels an active debouncer and returns a reference to itself.
   *
   * @return {void}
   */
  cancel() {
    if (this.isActive()) {
      this._cancelAsync();
      // Canceling a debouncer removes its spot from the flush queue,
      // so if a debouncer is manually canceled and re-debounced, it
      // will reset its flush order (this is a very minor difference from 1.x)
      // Re-debouncing via the `debounce` API retains the 1.x FIFO flush order
      debouncerQueue.delete(this);
    }
  }

  /**
   * Cancels a debouncer's async callback.
   *
   * @return {void}
   */
  _cancelAsync() {
    if (this.isActive()) {
      this._asyncModule.cancel(/** @type {number} */ (this._timer));
      this._timer = null;
    }
  }

  /**
   * Flushes an active debouncer and returns a reference to itself.
   *
   * @return {void}
   */
  flush() {
    if (this.isActive()) {
      this.cancel();
      this._callback();
    }
  }

  /**
   * Returns true if the debouncer is active.
   *
   * @return {boolean} True if active.
   */
  isActive() {
    return this._timer != null;
  }
}

/**
 * Adds a `Debouncer` to a list of globally flushable tasks.
 *
 * @param {!Debouncer} debouncer Debouncer to enqueue
 * @return {void}
 */
function enqueueDebouncer(debouncer) {
  debouncerQueue.add(debouncer);
}

/**
 * @license
 * Copyright (c) 2021 - 2024 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */

/**
 * Array of Vaadin custom element classes that have been subscribed to the dir changes.
 */
const directionSubscribers = [];

function alignDirs(element, documentDir, elementDir = element.getAttribute('dir')) {
  if (documentDir) {
    element.setAttribute('dir', documentDir);
  } else if (elementDir != null) {
    element.removeAttribute('dir');
  }
}

function getDocumentDir() {
  return document.documentElement.getAttribute('dir');
}

function directionUpdater() {
  const documentDir = getDocumentDir();
  directionSubscribers.forEach((element) => {
    alignDirs(element, documentDir);
  });
}

const directionObserver = new MutationObserver(directionUpdater);
directionObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['dir'] });

/**
 * A mixin to handle `dir` attribute based on the one set on the `<html>` element.
 *
 * @polymerMixin
 */
const DirMixin = (superClass) =>
  class VaadinDirMixin extends superClass {
    static get properties() {
      return {
        /**
         * @protected
         */
        dir: {
          type: String,
          value: '',
          reflectToAttribute: true,
          converter: {
            fromAttribute: (attr) => {
              return !attr ? '' : attr;
            },
            toAttribute: (prop) => {
              return prop === '' ? null : prop;
            },
          },
        },
      };
    }

    /**
     * @return {boolean}
     * @protected
     */
    get __isRTL() {
      return this.getAttribute('dir') === 'rtl';
    }

    /** @protected */
    connectedCallback() {
      super.connectedCallback();

      if (!this.hasAttribute('dir') || this.__restoreSubscription) {
        this.__subscribe();
        alignDirs(this, getDocumentDir(), null);
      }
    }

    /** @protected */
    attributeChangedCallback(name, oldValue, newValue) {
      super.attributeChangedCallback(name, oldValue, newValue);
      if (name !== 'dir') {
        return;
      }

      const documentDir = getDocumentDir();

      // New value equals to the document direction and the element is not subscribed to the changes
      const newValueEqlDocDir = newValue === documentDir && directionSubscribers.indexOf(this) === -1;
      // Value was emptied and the element is not subscribed to the changes
      const newValueEmptied = !newValue && oldValue && directionSubscribers.indexOf(this) === -1;
      // New value is different and the old equals to document direction and the element is not subscribed to the changes
      const newDiffValue = newValue !== documentDir && oldValue === documentDir;

      if (newValueEqlDocDir || newValueEmptied) {
        this.__subscribe();
        alignDirs(this, documentDir, newValue);
      } else if (newDiffValue) {
        this.__unsubscribe();
      }
    }

    /** @protected */
    disconnectedCallback() {
      super.disconnectedCallback();
      this.__restoreSubscription = directionSubscribers.includes(this);
      this.__unsubscribe();
    }

    /** @protected */
    _valueToNodeAttribute(node, value, attribute) {
      // Override default Polymer attribute reflection to match native behavior of HTMLElement.dir property
      // If the property contains an empty string then it should not create an empty attribute
      if (attribute === 'dir' && value === '' && !node.hasAttribute('dir')) {
        return;
      }
      super._valueToNodeAttribute(node, value, attribute);
    }

    /** @protected */
    _attributeToProperty(attribute, value, type) {
      // Override default Polymer attribute reflection to match native behavior of HTMLElement.dir property
      // If the attribute is removed, then the dir property should contain an empty string instead of null
      if (attribute === 'dir' && !value) {
        this.dir = '';
      } else {
        super._attributeToProperty(attribute, value, type);
      }
    }

    /** @private */
    __subscribe() {
      if (!directionSubscribers.includes(this)) {
        directionSubscribers.push(this);
      }
    }

    /** @private */
    __unsubscribe() {
      if (directionSubscribers.includes(this)) {
        directionSubscribers.splice(directionSubscribers.indexOf(this), 1);
      }
    }
  };

/**
 * @license
 * Copyright (c) 2021 - 2024 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */

if (!window.Vaadin) {
  window.Vaadin = {};
}

/**
 * Array of Vaadin custom element classes that have been finalized.
 */
if (!window.Vaadin.registrations) {
  window.Vaadin.registrations = [];
}

if (!window.Vaadin.developmentModeCallback) {
  window.Vaadin.developmentModeCallback = {};
}

window.Vaadin.developmentModeCallback['vaadin-usage-statistics'] = function () {
  usageStatistics();
};

let statsJob;

const registered = new Set();

/**
 * @polymerMixin
 * @mixes DirMixin
 */
const ElementMixin = (superClass) =>
  class VaadinElementMixin extends DirMixin(superClass) {
    /** @protected */
    static finalize() {
      super.finalize();

      const { is } = this;

      // Registers a class prototype for telemetry purposes.
      if (is && !registered.has(is)) {
        window.Vaadin.registrations.push(this);
        registered.add(is);

        if (window.Vaadin.developmentModeCallback) {
          statsJob = Debouncer.debounce(statsJob, idlePeriod, () => {
            window.Vaadin.developmentModeCallback['vaadin-usage-statistics']();
          });
          enqueueDebouncer(statsJob);
        }
      }
    }

    constructor() {
      super();

      if (document.doctype === null) {
        console.warn(
          'Vaadin components require the "standards mode" declaration. Please add <!DOCTYPE html> to the HTML document.',
        );
      }
    }
  };

/**
 * @license
 * Copyright (c) 2021 - 2024 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */

const observer = new ResizeObserver((entries) => {
  setTimeout(() => {
    entries.forEach((entry) => {
      // Notify child resizables, if any
      if (entry.target.resizables) {
        entry.target.resizables.forEach((resizable) => {
          resizable._onResize(entry.contentRect);
        });
      } else {
        entry.target._onResize(entry.contentRect);
      }
    });
  });
});

/**
 * A mixin that uses a ResizeObserver to listen to host size changes.
 *
 * @polymerMixin
 */
const ResizeMixin = dedupingMixin(
  (superclass) =>
    class ResizeMixinClass extends superclass {
      /**
       * When true, the parent element resize will be also observed.
       * Override this getter and return `true` to enable this.
       *
       * @protected
       */
      get _observeParent() {
        return false;
      }

      /** @protected */
      connectedCallback() {
        super.connectedCallback();
        observer.observe(this);

        if (this._observeParent) {
          const parent = this.parentNode instanceof ShadowRoot ? this.parentNode.host : this.parentNode;

          if (!parent.resizables) {
            parent.resizables = new Set();
            observer.observe(parent);
          }

          parent.resizables.add(this);
          this.__parent = parent;
        }
      }

      /** @protected */
      disconnectedCallback() {
        super.disconnectedCallback();
        observer.unobserve(this);

        const parent = this.__parent;
        if (this._observeParent && parent) {
          const resizables = parent.resizables;

          if (resizables) {
            resizables.delete(this);

            if (resizables.size === 0) {
              observer.unobserve(parent);
            }
          }

          this.__parent = null;
        }
      }

      /**
       * A handler invoked on host resize. By default, it does nothing.
       * Override the method to implement your own behavior.
       *
       * @protected
       */
      _onResize(_contentRect) {
        // To be implemented.
      }
    },
);

/**
 * @license
 * Copyright (c) 2017 - 2024 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */

/**
 * `<vaadin-form-layout>` is a Web Component providing configurable responsive
 * layout for form elements.
 *
 * ```html
 * <vaadin-form-layout>
 *
 *   <vaadin-form-item>
 *     <label slot="label">First Name</label>
 *     <input class="full-width" value="Jane">
 *   </vaadin-form-item>
 *
 *   <vaadin-form-item>
 *     <label slot="label">Last Name</label>
 *     <input class="full-width" value="Doe">
 *   </vaadin-form-item>
 *
 *   <vaadin-form-item>
 *     <label slot="label">Email</label>
 *     <input class="full-width" value="jane.doe@example.com">
 *   </vaadin-form-item>
 *
 * </vaadin-form-layout>
 * ```
 *
 * It supports any child elements as layout items.
 *
 * By default, it makes a layout of two columns if the element width is equal or
 * wider than 40em, and a single column layout otherwise.
 *
 * The number of columns and the responsive behavior are customizable with
 * the `responsiveSteps` property.
 *
 * ### Spanning Items on Multiple Columns
 *
 * You can use `colspan` or `data-colspan` attribute on the items.
 * In the example below, the first text field spans on two columns:
 *
 * ```html
 * <vaadin-form-layout>
 *
 *   <vaadin-form-item colspan="2">
 *     <label slot="label">Address</label>
 *     <input class="full-width">
 *   </vaadin-form-item>
 *
 *   <vaadin-form-item>
 *     <label slot="label">First Name</label>
 *     <input class="full-width" value="Jane">
 *   </vaadin-form-item>
 *
 *   <vaadin-form-item>
 *     <label slot="label">Last Name</label>
 *     <input class="full-width" value="Doe">
 *   </vaadin-form-item>
 *
 * </vaadin-form-layout>
 * ```
 *
 * ### Explicit New Row
 *
 * Use the `<br>` line break element to wrap the items on a new row:
 *
 * ```html
 * <vaadin-form-layout>
 *
 *   <vaadin-form-item>
 *     <label slot="label">Email</label>
 *     <input class="full-width">
 *   </vaadin-form-item>
 *
 *   <br>
 *
 *   <vaadin-form-item>
 *     <label slot="label">Confirm Email</label>
 *     <input class="full-width">
 *   </vaadin-form-item>
 *
 * </vaadin-form-layout>
 * ```
 *
 * ### CSS Properties Reference
 *
 * The following custom CSS properties are available on the `<vaadin-form-layout>`
 * element:
 *
 * Custom CSS property | Description | Default
 * ---|---|---
 * `--vaadin-form-layout-column-spacing` | Length of the spacing between columns | `2em`
 *
 * @customElement
 * @extends HTMLElement
 * @mixes ElementMixin
 * @mixes ThemableMixin
 * @mixes ResizeMixin
 */
class FormLayout extends ResizeMixin(ElementMixin(ThemableMixin(PolymerElement))) {
  static get template() {
    return html`
      <style>
        :host {
          display: block;
          max-width: 100%;
          animation: 1ms vaadin-form-layout-appear;
          /* CSS API for host */
          --vaadin-form-item-label-width: 8em;
          --vaadin-form-item-label-spacing: 1em;
          --vaadin-form-item-row-spacing: 1em;
          --vaadin-form-layout-column-spacing: 2em; /* (default) */
          align-self: stretch;
        }

        @keyframes vaadin-form-layout-appear {
          to {
            opacity: 1 !important; /* stylelint-disable-line keyframe-declaration-no-important */
          }
        }

        :host([hidden]) {
          display: none !important;
        }

        #layout {
          display: flex;

          align-items: baseline; /* default \`stretch\` is not appropriate */

          flex-wrap: wrap; /* the items should wrap */
        }

        #layout ::slotted(*) {
          /* Items should neither grow nor shrink. */
          flex-grow: 0;
          flex-shrink: 0;

          /* Margins make spacing between the columns */
          margin-left: calc(0.5 * var(--vaadin-form-layout-column-spacing));
          margin-right: calc(0.5 * var(--vaadin-form-layout-column-spacing));
        }

        #layout ::slotted(br) {
          display: none;
        }
      </style>
      <div id="layout">
        <slot id="slot"></slot>
      </div>
    `;
  }

  static get is() {
    return 'vaadin-form-layout';
  }

  static get properties() {
    return {
      /**
       * @typedef FormLayoutResponsiveStep
       * @type {object}
       * @property {string} minWidth - The threshold value for this step in CSS length units.
       * @property {number} columns - Number of columns. Only natural numbers are valid.
       * @property {string} labelsPosition - Labels position option, valid values: `"aside"` (default), `"top"`.
       */

      /**
       * Allows specifying a responsive behavior with the number of columns
       * and the label position depending on the layout width.
       *
       * Format: array of objects, each object defines one responsive step
       * with `minWidth` CSS length, `columns` number, and optional
       * `labelsPosition` string of `"aside"` or `"top"`. At least one item is required.
       *
       * #### Examples
       *
       * ```javascript
       * formLayout.responsiveSteps = [{columns: 1}];
       * // The layout is always a single column, labels aside.
       * ```
       *
       * ```javascript
       * formLayout.responsiveSteps = [
       *   {minWidth: 0, columns: 1},
       *   {minWidth: '40em', columns: 2}
       * ];
       * // Sets two responsive steps:
       * // 1. When the layout width is < 40em, one column, labels aside.
       * // 2. Width >= 40em, two columns, labels aside.
       * ```
       *
       * ```javascript
       * formLayout.responsiveSteps = [
       *   {minWidth: 0, columns: 1, labelsPosition: 'top'},
       *   {minWidth: '20em', columns: 1},
       *   {minWidth: '40em', columns: 2}
       * ];
       * // Default value. Three responsive steps:
       * // 1. Width < 20em, one column, labels on top.
       * // 2. 20em <= width < 40em, one column, labels aside.
       * // 3. Width >= 40em, two columns, labels aside.
       * ```
       *
       * @type {!Array<!FormLayoutResponsiveStep>}
       */
      responsiveSteps: {
        type: Array,
        value() {
          return [
            { minWidth: 0, columns: 1, labelsPosition: 'top' },
            { minWidth: '20em', columns: 1 },
            { minWidth: '40em', columns: 2 },
          ];
        },
        observer: '_responsiveStepsChanged',
      },

      /**
       * Current number of columns in the layout
       * @private
       */
      _columnCount: {
        type: Number,
      },

      /**
       * Indicates that labels are on top
       * @private
       */
      _labelsOnTop: {
        type: Boolean,
      },
    };
  }

  static get observers() {
    return ['_invokeUpdateLayout(_columnCount, _labelsOnTop)'];
  }

  /** @protected */
  ready() {
    // Here we create and attach a style element that we use for validating
    // CSS values in `responsiveSteps`. We can't add this to the `<template>`,
    // because Polymer will throw it away. We need to create this before
    // `super.ready()`, because `super.ready()` invokes property observers,
    // and the observer for `responsiveSteps` does CSS value validation.
    this._styleElement = document.createElement('style');
    this.appendChild(this._styleElement);
    // Ensure there is a child text node in the style element
    this._styleElement.textContent = ' ';

    super.ready();

    this.addEventListener('animationend', this.__onAnimationEnd);
  }

  /** @protected */
  connectedCallback() {
    super.connectedCallback();

    requestAnimationFrame(() => this._selectResponsiveStep());
    requestAnimationFrame(() => this._updateLayout());

    this._observeChildrenColspanChange();
  }

  /** @protected */
  disconnectedCallback() {
    super.disconnectedCallback();

    this.__mutationObserver.disconnect();
    this.__childObserver.disconnect();
  }

  /** @private */
  _observeChildrenColspanChange() {
    // Observe changes in form items' `colspan` attribute and update styles
    const mutationObserverConfig = { attributes: true };

    this.__mutationObserver = new MutationObserver((mutationRecord) => {
      mutationRecord.forEach((mutation) => {
        if (
          mutation.type === 'attributes' &&
          (mutation.attributeName === 'colspan' ||
            mutation.attributeName === 'data-colspan' ||
            mutation.attributeName === 'hidden')
        ) {
          this._updateLayout();
        }
      });
    });

    // Observe changes to initial children
    [...this.children].forEach((child) => {
      this.__mutationObserver.observe(child, mutationObserverConfig);
    });

    // Observe changes to lazily added nodes
    this.__childObserver = new MutationObserver((mutations) => {
      const addedNodes = [];
      const removedNodes = [];

      mutations.forEach((mutation) => {
        addedNodes.push(...this._getObservableNodes(mutation.addedNodes));
        removedNodes.push(...this._getObservableNodes(mutation.removedNodes));
      });

      addedNodes.forEach((child) => {
        this.__mutationObserver.observe(child, mutationObserverConfig);
      });

      if (addedNodes.length > 0 || removedNodes.length > 0) {
        this._updateLayout();
      }
    });

    this.__childObserver.observe(this, { childList: true });
  }

  /** @private */
  _getObservableNodes(nodeList) {
    const ignore = ['template', 'style', 'dom-repeat', 'dom-if'];
    return Array.from(nodeList).filter(
      (node) => node.nodeType === Node.ELEMENT_NODE && ignore.indexOf(node.localName.toLowerCase()) === -1,
    );
  }

  /** @private */
  _naturalNumberOrOne(n) {
    if (typeof n === 'number' && n >= 1 && n < Infinity) {
      return Math.floor(n);
    }
    return 1;
  }

  /** @private */
  _isValidCSSLength(value) {
    // Let us choose a CSS property for validating CSS <length> values:
    // - `border-spacing` accepts `<length> | inherit`, it's the best! But
    //   it does not disallow invalid values at all in MSIE :-(
    // - `letter-spacing` and `word-spacing` accept
    //   `<length> | normal | inherit`, and disallows everything else, like
    //   `<percentage>`, `auto` and such, good enough.
    // - `word-spacing` is used since its shorter.

    // Disallow known keywords allowed as the `word-spacing` value
    if (value === 'inherit' || value === 'normal') {
      return false;
    }

    // Use the value in a stylesheet and check the parsed value. Invalid
    // input value results in empty parsed value.
    this._styleElement.firstChild.nodeValue = `#styleElement { word-spacing: ${value}; }`;

    if (!this._styleElement.sheet) {
      // Stylesheet is not ready, probably not attached to the document yet.
      return true;
    }

    // Safari 9 sets invalid CSS rules' value to `null`
    return ['', null].indexOf(this._styleElement.sheet.cssRules[0].style.getPropertyValue('word-spacing')) < 0;
  }

  /** @private */
  _responsiveStepsChanged(responsiveSteps, oldResponsiveSteps) {
    try {
      if (!Array.isArray(responsiveSteps)) {
        throw new Error('Invalid "responsiveSteps" type, an Array is required.');
      }

      if (responsiveSteps.length < 1) {
        throw new Error('Invalid empty "responsiveSteps" array, at least one item is required.');
      }

      responsiveSteps.forEach((step) => {
        if (this._naturalNumberOrOne(step.columns) !== step.columns) {
          throw new Error(`Invalid 'columns' value of ${step.columns}, a natural number is required.`);
        }

        if (step.minWidth !== undefined && !this._isValidCSSLength(step.minWidth)) {
          throw new Error(`Invalid 'minWidth' value of ${step.minWidth}, a valid CSS length required.`);
        }

        if (step.labelsPosition !== undefined && ['aside', 'top'].indexOf(step.labelsPosition) === -1) {
          throw new Error(
            `Invalid 'labelsPosition' value of ${step.labelsPosition}, 'aside' or 'top' string is required.`,
          );
        }
      });
    } catch (e) {
      if (oldResponsiveSteps && oldResponsiveSteps !== responsiveSteps) {
        console.warn(`${e.message} Using previously set 'responsiveSteps' instead.`);
        this.responsiveSteps = oldResponsiveSteps;
      } else {
        console.warn(`${e.message} Using default 'responsiveSteps' instead.`);
        this.responsiveSteps = [
          { minWidth: 0, columns: 1, labelsPosition: 'top' },
          { minWidth: '20em', columns: 1 },
          { minWidth: '40em', columns: 2 },
        ];
      }
    }

    this._selectResponsiveStep();
  }

  /** @private */
  __onAnimationEnd(e) {
    if (e.animationName.indexOf('vaadin-form-layout-appear') === 0) {
      this._selectResponsiveStep();
    }
  }

  /** @private */
  _selectResponsiveStep() {
    // Iterate through responsiveSteps and choose the step
    let selectedStep;
    const tmpStyleProp = 'background-position';
    this.responsiveSteps.forEach((step) => {
      // Convert minWidth to px units for comparison
      this.$.layout.style.setProperty(tmpStyleProp, step.minWidth);
      const stepMinWidthPx = parseFloat(getComputedStyle(this.$.layout).getPropertyValue(tmpStyleProp));

      // Compare step min-width with the host width, select the passed step
      if (stepMinWidthPx <= this.offsetWidth) {
        selectedStep = step;
      }
    });
    this.$.layout.style.removeProperty(tmpStyleProp);

    // Sometimes converting units is not possible, e.g, when element is
    // not connected. Then the `selectedStep` stays `undefined`.
    if (selectedStep) {
      // Apply the chosen responsive step's properties
      this._columnCount = selectedStep.columns;
      this._labelsOnTop = selectedStep.labelsPosition === 'top';
    }
  }

  /** @private */
  _invokeUpdateLayout() {
    this._updateLayout();
  }

  /**
   * Update the layout.
   * @protected
   */
  _updateLayout() {
    /*
      The item width formula:

          itemWidth = colspan / columnCount * 100% - columnSpacing

      We have to subtract columnSpacing, because the column spacing space is taken
      by item margins of 1/2 * spacing on both sides
    */

    const style = getComputedStyle(this);
    const columnSpacing = style.getPropertyValue('--vaadin-form-layout-column-spacing');

    const direction = style.direction;
    const marginStartProp = `margin-${direction === 'ltr' ? 'left' : 'right'}`;
    const marginEndProp = `margin-${direction === 'ltr' ? 'right' : 'left'}`;

    const containerWidth = this.offsetWidth;

    let col = 0;
    Array.from(this.children)
      .filter((child) => child.localName === 'br' || getComputedStyle(child).display !== 'none')
      .forEach((child, index, children) => {
        if (child.localName === 'br') {
          // Reset column count on line break
          col = 0;
          return;
        }

        const attrColspan = child.getAttribute('colspan') || child.getAttribute('data-colspan');
        let colspan;
        colspan = this._naturalNumberOrOne(parseFloat(attrColspan));

        // Never span further than the number of columns
        colspan = Math.min(colspan, this._columnCount);

        const childRatio = colspan / this._columnCount;

        // Note: using 99.9% for 100% fixes rounding errors in MS Edge
        // (< v16), otherwise the items might wrap, resizing is wobbly.
        child.style.width = `calc(${childRatio * 99.9}% - ${1 - childRatio} * ${columnSpacing})`;

        if (col + colspan > this._columnCount) {
          // Too big to fit on this row, let's wrap it
          col = 0;
        }

        // At the start edge
        if (col === 0) {
          child.style.setProperty(marginStartProp, '0px');
        } else {
          child.style.removeProperty(marginStartProp);
        }

        const nextIndex = index + 1;
        const nextLineBreak = nextIndex < children.length && children[nextIndex].localName === 'br';

        // At the end edge
        if (col + colspan === this._columnCount) {
          child.style.setProperty(marginEndProp, '0px');
        } else if (nextLineBreak) {
          const colspanRatio = (this._columnCount - col - colspan) / this._columnCount;
          child.style.setProperty(
            marginEndProp,
            `calc(${colspanRatio * containerWidth}px + ${colspanRatio} * ${columnSpacing})`,
          );
        } else {
          child.style.removeProperty(marginEndProp);
        }

        // Move the column counter
        col = (col + colspan) % this._columnCount;

        if (child.localName === 'vaadin-form-item') {
          if (this._labelsOnTop) {
            if (child.getAttribute('label-position') !== 'top') {
              child.__useLayoutLabelPosition = true;
              child.setAttribute('label-position', 'top');
            }
          } else if (child.__useLayoutLabelPosition) {
            delete child.__useLayoutLabelPosition;
            child.removeAttribute('label-position');
          }
        }
      });
  }

  /**
   * @protected
   * @override
   */
  _onResize() {
    this._selectResponsiveStep();
  }
}

defineCustomElement(FormLayout);

class Form extends FormLayout {
  constructor() {
    super();
  }
  static get _styleSheet() {
    return stylesheet$5;
  }
}

const stylesheet$4 = new CSSStyleSheet();
stylesheet$4.replaceSync(`::slotted(input) {
  background-color: var(--dark-glass);
  border-radius: var(--radius-field-1111);
  border-bottom: var(--thin-glass-border);
  border-top: var(--thin-glass-border);
  margin-top: var(--gap-small);
}
`);

/**
 * @license
 * Copyright (c) 2017 - 2024 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */

const colorBase = i$2`
  :host {
    /* Base (background) */
    --lumo-base-color: #fff;

    /* Tint */
    --lumo-tint-5pct: hsla(0, 0%, 100%, 0.3);
    --lumo-tint-10pct: hsla(0, 0%, 100%, 0.37);
    --lumo-tint-20pct: hsla(0, 0%, 100%, 0.44);
    --lumo-tint-30pct: hsla(0, 0%, 100%, 0.5);
    --lumo-tint-40pct: hsla(0, 0%, 100%, 0.57);
    --lumo-tint-50pct: hsla(0, 0%, 100%, 0.64);
    --lumo-tint-60pct: hsla(0, 0%, 100%, 0.7);
    --lumo-tint-70pct: hsla(0, 0%, 100%, 0.77);
    --lumo-tint-80pct: hsla(0, 0%, 100%, 0.84);
    --lumo-tint-90pct: hsla(0, 0%, 100%, 0.9);
    --lumo-tint: #fff;

    /* Shade */
    --lumo-shade-5pct: hsla(214, 61%, 25%, 0.05);
    --lumo-shade-10pct: hsla(214, 57%, 24%, 0.1);
    --lumo-shade-20pct: hsla(214, 53%, 23%, 0.16);
    --lumo-shade-30pct: hsla(214, 50%, 22%, 0.26);
    --lumo-shade-40pct: hsla(214, 47%, 21%, 0.38);
    --lumo-shade-50pct: hsla(214, 45%, 20%, 0.52);
    --lumo-shade-60pct: hsla(214, 43%, 19%, 0.6);
    --lumo-shade-70pct: hsla(214, 42%, 18%, 0.69);
    --lumo-shade-80pct: hsla(214, 41%, 17%, 0.83);
    --lumo-shade-90pct: hsla(214, 40%, 16%, 0.94);
    --lumo-shade: hsl(214, 35%, 15%);

    /* Contrast */
    --lumo-contrast-5pct: var(--lumo-shade-5pct);
    --lumo-contrast-10pct: var(--lumo-shade-10pct);
    --lumo-contrast-20pct: var(--lumo-shade-20pct);
    --lumo-contrast-30pct: var(--lumo-shade-30pct);
    --lumo-contrast-40pct: var(--lumo-shade-40pct);
    --lumo-contrast-50pct: var(--lumo-shade-50pct);
    --lumo-contrast-60pct: var(--lumo-shade-60pct);
    --lumo-contrast-70pct: var(--lumo-shade-70pct);
    --lumo-contrast-80pct: var(--lumo-shade-80pct);
    --lumo-contrast-90pct: var(--lumo-shade-90pct);
    --lumo-contrast: var(--lumo-shade);

    /* Text */
    --lumo-header-text-color: var(--lumo-contrast);
    --lumo-body-text-color: var(--lumo-contrast-90pct);
    --lumo-secondary-text-color: var(--lumo-contrast-70pct);
    --lumo-tertiary-text-color: var(--lumo-contrast-50pct);
    --lumo-disabled-text-color: var(--lumo-contrast-30pct);

    /* Primary */
    --lumo-primary-color: hsl(214, 100%, 48%);
    --lumo-primary-color-50pct: hsla(214, 100%, 49%, 0.76);
    --lumo-primary-color-10pct: hsla(214, 100%, 60%, 0.13);
    --lumo-primary-text-color: hsl(214, 100%, 43%);
    --lumo-primary-contrast-color: #fff;

    /* Error */
    --lumo-error-color: hsl(3, 85%, 48%);
    --lumo-error-color-50pct: hsla(3, 85%, 49%, 0.5);
    --lumo-error-color-10pct: hsla(3, 85%, 49%, 0.1);
    --lumo-error-text-color: hsl(3, 89%, 42%);
    --lumo-error-contrast-color: #fff;

    /* Success */
    --lumo-success-color: hsl(145, 72%, 30%);
    --lumo-success-color-50pct: hsla(145, 72%, 31%, 0.5);
    --lumo-success-color-10pct: hsla(145, 72%, 31%, 0.1);
    --lumo-success-text-color: hsl(145, 85%, 25%);
    --lumo-success-contrast-color: #fff;

    /* Warning */
    --lumo-warning-color: hsl(48, 100%, 50%);
    --lumo-warning-color-10pct: hsla(48, 100%, 50%, 0.25);
    --lumo-warning-text-color: hsl(32, 100%, 30%);
    --lumo-warning-contrast-color: var(--lumo-shade-90pct);
  }

  /* forced-colors mode adjustments */
  @media (forced-colors: active) {
    html {
      --lumo-disabled-text-color: GrayText;
    }
  }
`;

addLumoGlobalStyles('color-props', colorBase);

const color = i$2`
  [theme~='dark'] {
    /* Base (background) */
    --lumo-base-color: hsl(214, 35%, 21%);

    /* Tint */
    --lumo-tint-5pct: hsla(214, 65%, 85%, 0.06);
    --lumo-tint-10pct: hsla(214, 60%, 80%, 0.14);
    --lumo-tint-20pct: hsla(214, 64%, 82%, 0.23);
    --lumo-tint-30pct: hsla(214, 69%, 84%, 0.32);
    --lumo-tint-40pct: hsla(214, 73%, 86%, 0.41);
    --lumo-tint-50pct: hsla(214, 78%, 88%, 0.5);
    --lumo-tint-60pct: hsla(214, 82%, 90%, 0.58);
    --lumo-tint-70pct: hsla(214, 87%, 92%, 0.69);
    --lumo-tint-80pct: hsla(214, 91%, 94%, 0.8);
    --lumo-tint-90pct: hsla(214, 96%, 96%, 0.9);
    --lumo-tint: hsl(214, 100%, 98%);

    /* Shade */
    --lumo-shade-5pct: hsla(214, 0%, 0%, 0.07);
    --lumo-shade-10pct: hsla(214, 4%, 2%, 0.15);
    --lumo-shade-20pct: hsla(214, 8%, 4%, 0.23);
    --lumo-shade-30pct: hsla(214, 12%, 6%, 0.32);
    --lumo-shade-40pct: hsla(214, 16%, 8%, 0.41);
    --lumo-shade-50pct: hsla(214, 20%, 10%, 0.5);
    --lumo-shade-60pct: hsla(214, 24%, 12%, 0.6);
    --lumo-shade-70pct: hsla(214, 28%, 13%, 0.7);
    --lumo-shade-80pct: hsla(214, 32%, 13%, 0.8);
    --lumo-shade-90pct: hsla(214, 33%, 13%, 0.9);
    --lumo-shade: hsl(214, 33%, 13%);

    /* Contrast */
    --lumo-contrast-5pct: var(--lumo-tint-5pct);
    --lumo-contrast-10pct: var(--lumo-tint-10pct);
    --lumo-contrast-20pct: var(--lumo-tint-20pct);
    --lumo-contrast-30pct: var(--lumo-tint-30pct);
    --lumo-contrast-40pct: var(--lumo-tint-40pct);
    --lumo-contrast-50pct: var(--lumo-tint-50pct);
    --lumo-contrast-60pct: var(--lumo-tint-60pct);
    --lumo-contrast-70pct: var(--lumo-tint-70pct);
    --lumo-contrast-80pct: var(--lumo-tint-80pct);
    --lumo-contrast-90pct: var(--lumo-tint-90pct);
    --lumo-contrast: var(--lumo-tint);

    /* Text */
    --lumo-header-text-color: var(--lumo-contrast);
    --lumo-body-text-color: var(--lumo-contrast-90pct);
    --lumo-secondary-text-color: var(--lumo-contrast-70pct);
    --lumo-tertiary-text-color: var(--lumo-contrast-50pct);
    --lumo-disabled-text-color: var(--lumo-contrast-30pct);

    /* Primary */
    --lumo-primary-color: hsl(214, 90%, 48%);
    --lumo-primary-color-50pct: hsla(214, 90%, 70%, 0.69);
    --lumo-primary-color-10pct: hsla(214, 90%, 55%, 0.13);
    --lumo-primary-text-color: hsl(214, 90%, 77%);
    --lumo-primary-contrast-color: #fff;

    /* Error */
    --lumo-error-color: hsl(3, 79%, 49%);
    --lumo-error-color-50pct: hsla(3, 75%, 62%, 0.5);
    --lumo-error-color-10pct: hsla(3, 75%, 62%, 0.14);
    --lumo-error-text-color: hsl(3, 100%, 80%);

    /* Success */
    --lumo-success-color: hsl(145, 72%, 30%);
    --lumo-success-color-50pct: hsla(145, 92%, 51%, 0.5);
    --lumo-success-color-10pct: hsla(145, 92%, 51%, 0.1);
    --lumo-success-text-color: hsl(145, 85%, 46%);

    /* Warning */
    --lumo-warning-color: hsl(43, 100%, 48%);
    --lumo-warning-color-10pct: hsla(40, 100%, 50%, 0.2);
    --lumo-warning-text-color: hsl(45, 100%, 60%);
    --lumo-warning-contrast-color: var(--lumo-shade-90pct);
  }

  html {
    color: var(--lumo-body-text-color);
    background-color: var(--lumo-base-color);
    color-scheme: light;
  }

  [theme~='dark'] {
    color: var(--lumo-body-text-color);
    background-color: var(--lumo-base-color);
    color-scheme: dark;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    color: var(--lumo-header-text-color);
  }

  a:where(:any-link) {
    color: var(--lumo-primary-text-color);
  }

  a:not(:any-link) {
    color: var(--lumo-disabled-text-color);
  }

  blockquote {
    color: var(--lumo-secondary-text-color);
  }

  code,
  pre {
    background-color: var(--lumo-contrast-10pct);
    border-radius: var(--lumo-border-radius-m);
  }
  pre code {
    background: transparent;
  }
`;

registerStyles('', color, { moduleId: 'lumo-color' });

/**
 * @license
 * Copyright (c) 2017 - 2024 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */

const sizing = i$2`
  :host {
    --lumo-size-xs: 1.625rem;
    --lumo-size-s: 1.875rem;
    --lumo-size-m: 2.25rem;
    --lumo-size-l: 2.75rem;
    --lumo-size-xl: 3.5rem;

    /* Icons */
    --lumo-icon-size-s: 1.25em;
    --lumo-icon-size-m: 1.5em;
    --lumo-icon-size-l: 2.25em;
    /* For backwards compatibility */
    --lumo-icon-size: var(--lumo-icon-size-m);
  }
`;

addLumoGlobalStyles('sizing-props', sizing);

/**
 * @license
 * Copyright (c) 2017 - 2024 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */

const style = i$2`
  :host {
    /* Border radius */
    --lumo-border-radius-s: 0.25em; /* Checkbox, badge, date-picker year indicator, etc */
    --lumo-border-radius-m: var(--lumo-border-radius, 0.25em); /* Button, text field, menu overlay, etc */
    --lumo-border-radius-l: 0.5em; /* Dialog, notification, etc */

    /* Shadow */
    --lumo-box-shadow-xs: 0 1px 4px -1px var(--lumo-shade-50pct);
    --lumo-box-shadow-s: 0 2px 4px -1px var(--lumo-shade-20pct), 0 3px 12px -1px var(--lumo-shade-30pct);
    --lumo-box-shadow-m: 0 2px 6px -1px var(--lumo-shade-20pct), 0 8px 24px -4px var(--lumo-shade-40pct);
    --lumo-box-shadow-l: 0 3px 18px -2px var(--lumo-shade-20pct), 0 12px 48px -6px var(--lumo-shade-40pct);
    --lumo-box-shadow-xl: 0 4px 24px -3px var(--lumo-shade-20pct), 0 18px 64px -8px var(--lumo-shade-40pct);

    /* Clickable element cursor */
    --lumo-clickable-cursor: default;
  }
`;

/**
 * Default values for component-specific custom properties.
 */
i$2`
  html {
    /* Button */
    --vaadin-button-background: var(--lumo-contrast-5pct);
    --vaadin-button-border: none;
    --vaadin-button-border-radius: var(--lumo-border-radius-m);
    --vaadin-button-font-size: var(--lumo-font-size-m);
    --vaadin-button-font-weight: 500;
    --vaadin-button-height: var(--lumo-size-m);
    --vaadin-button-margin: var(--lumo-space-xs) 0;
    --vaadin-button-min-width: calc(var(--vaadin-button-height) * 2);
    --vaadin-button-padding: 0 calc(var(--vaadin-button-height) / 3 + var(--lumo-border-radius-m) / 2);
    --vaadin-button-text-color: var(--lumo-primary-text-color);
    --vaadin-button-primary-background: var(--lumo-primary-color);
    --vaadin-button-primary-border: none;
    --vaadin-button-primary-font-weight: 600;
    --vaadin-button-primary-text-color: var(--lumo-primary-contrast-color);
    --vaadin-button-tertiary-background: transparent !important;
    --vaadin-button-tertiary-text-color: var(--lumo-primary-text-color);
    --vaadin-button-tertiary-font-weight: 500;
    --vaadin-button-tertiary-padding: 0 calc(var(--vaadin-button-height) / 6);
    /* Checkbox */
    --vaadin-checkbox-background: var(--lumo-contrast-20pct);
    --vaadin-checkbox-background-hover: var(--lumo-contrast-30pct);
    --vaadin-checkbox-border-radius: var(--lumo-border-radius-s);
    --vaadin-checkbox-checkmark-char: var(--lumo-icons-checkmark);
    --vaadin-checkbox-checkmark-char-indeterminate: '';
    --vaadin-checkbox-checkmark-color: var(--lumo-primary-contrast-color);
    --vaadin-checkbox-checkmark-size: calc(var(--vaadin-checkbox-size) + 2px);
    --vaadin-checkbox-label-color: var(--lumo-body-text-color);
    --vaadin-checkbox-label-font-size: var(--lumo-font-size-m);
    --vaadin-checkbox-label-padding: var(--lumo-space-xs) var(--lumo-space-s) var(--lumo-space-xs) var(--lumo-space-xs);
    --vaadin-checkbox-size: calc(var(--lumo-size-m) / 2);
    /* Radio button */
    --vaadin-radio-button-background: var(--lumo-contrast-20pct);
    --vaadin-radio-button-background-hover: var(--lumo-contrast-30pct);
    --vaadin-radio-button-dot-color: var(--lumo-primary-contrast-color);
    --vaadin-radio-button-dot-size: 3px;
    --vaadin-radio-button-label-color: var(--lumo-body-text-color);
    --vaadin-radio-button-label-font-size: var(--lumo-font-size-m);
    --vaadin-radio-button-label-padding: var(--lumo-space-xs) var(--lumo-space-s) var(--lumo-space-xs)
      var(--lumo-space-xs);
    --vaadin-radio-button-size: calc(var(--lumo-size-m) / 2);
    --vaadin-selection-color: var(--lumo-primary-color);
    --vaadin-selection-color-text: var(--lumo-primary-text-color);
    --vaadin-input-field-border-radius: var(--lumo-border-radius-m);
    --vaadin-focus-ring-color: var(--lumo-primary-color-50pct);
    --vaadin-focus-ring-width: 2px;
    /* Label */
    --vaadin-input-field-label-color: var(--lumo-secondary-text-color);
    --vaadin-input-field-focused-label-color: var(--lumo-primary-text-color);
    --vaadin-input-field-hovered-label-color: var(--lumo-body-text-color);
    --vaadin-input-field-label-font-size: var(--lumo-font-size-s);
    --vaadin-input-field-label-font-weight: 500;
    /* Helper */
    --vaadin-input-field-helper-color: var(--lumo-secondary-text-color);
    --vaadin-input-field-helper-font-size: var(--lumo-font-size-xs);
    --vaadin-input-field-helper-font-weight: 400;
    --vaadin-input-field-helper-spacing: 0.4em;
    /* Error message */
    --vaadin-input-field-error-color: var(--lumo-error-text-color);
    --vaadin-input-field-error-font-size: var(--lumo-font-size-xs);
    --vaadin-input-field-error-font-weight: 400;
    /* Input field */
    --vaadin-input-field-background: var(--lumo-contrast-10pct);
    --vaadin-input-field-icon-color: var(--lumo-contrast-60pct);
    --vaadin-input-field-icon-size: var(--lumo-icon-size-m);
    --vaadin-input-field-invalid-background: var(--lumo-error-color-10pct);
    --vaadin-input-field-invalid-hover-highlight: var(--lumo-error-color-50pct);
    --vaadin-input-field-height: var(--lumo-size-m);
    --vaadin-input-field-hover-highlight: var(--lumo-contrast-50pct);
    --vaadin-input-field-placeholder-color: var(--lumo-secondary-text-color);
    --vaadin-input-field-readonly-border: 1px dashed var(--lumo-contrast-30pct);
    --vaadin-input-field-value-color: var(--lumo-body-text-color);
    --vaadin-input-field-value-font-size: var(--lumo-font-size-m);
    --vaadin-input-field-value-font-weight: 400;
  }
`;

addLumoGlobalStyles('style-props', style);

/**
 * @license
 * Copyright (c) 2017 - 2024 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */

const font = i$2`
  :host {
    /* prettier-ignore */
    --lumo-font-family: -apple-system, BlinkMacSystemFont, 'Roboto', 'Segoe UI', Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';

    /* Font sizes */
    --lumo-font-size-xxs: 0.75rem;
    --lumo-font-size-xs: 0.8125rem;
    --lumo-font-size-s: 0.875rem;
    --lumo-font-size-m: 1rem;
    --lumo-font-size-l: 1.125rem;
    --lumo-font-size-xl: 1.375rem;
    --lumo-font-size-xxl: 1.75rem;
    --lumo-font-size-xxxl: 2.5rem;

    /* Line heights */
    --lumo-line-height-xs: 1.25;
    --lumo-line-height-s: 1.375;
    --lumo-line-height-m: 1.625;
  }
`;

const typography = i$2`
  body,
  :host {
    font-family: var(--lumo-font-family);
    font-size: var(--lumo-font-size-m);
    line-height: var(--lumo-line-height-m);
    -webkit-text-size-adjust: 100%;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  small,
  [theme~='font-size-s'] {
    font-size: var(--lumo-font-size-s);
    line-height: var(--lumo-line-height-s);
  }

  [theme~='font-size-xs'] {
    font-size: var(--lumo-font-size-xs);
    line-height: var(--lumo-line-height-xs);
  }

  :where(h1, h2, h3, h4, h5, h6) {
    font-weight: 600;
    line-height: var(--lumo-line-height-xs);
    margin-block: 0;
  }

  :where(h1) {
    font-size: var(--lumo-font-size-xxxl);
  }

  :where(h2) {
    font-size: var(--lumo-font-size-xxl);
  }

  :where(h3) {
    font-size: var(--lumo-font-size-xl);
  }

  :where(h4) {
    font-size: var(--lumo-font-size-l);
  }

  :where(h5) {
    font-size: var(--lumo-font-size-m);
  }

  :where(h6) {
    font-size: var(--lumo-font-size-xs);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  p,
  blockquote {
    margin-top: 0.5em;
    margin-bottom: 0.75em;
  }

  a {
    text-decoration: none;
  }

  a:where(:any-link):hover {
    text-decoration: underline;
  }

  hr {
    display: block;
    align-self: stretch;
    height: 1px;
    border: 0;
    padding: 0;
    margin: var(--lumo-space-s) calc(var(--lumo-border-radius-m) / 2);
    background-color: var(--lumo-contrast-10pct);
  }

  blockquote {
    border-left: 2px solid var(--lumo-contrast-30pct);
  }

  b,
  strong {
    font-weight: 600;
  }

  /* RTL specific styles */
  blockquote[dir='rtl'] {
    border-left: none;
    border-right: 2px solid var(--lumo-contrast-30pct);
  }
`;

registerStyles('', typography, { moduleId: 'lumo-typography' });
addLumoGlobalStyles('typography-props', font);

registerStyles(
  'vaadin-input-container',
  i$2`
    :host {
      background: var(--_background);
      padding: 0 calc(0.375em + var(--_input-container-radius) / 4 - 1px);
      font-weight: 500;
      line-height: 1;
      position: relative;
      cursor: text;
      box-sizing: border-box;
      border-radius:
        /* See https://developer.mozilla.org/en-US/docs/Web/CSS/border-radius#syntax */
        var(--vaadin-input-field-top-start-radius, var(--_input-container-radius))
        var(--vaadin-input-field-top-end-radius, var(--_input-container-radius))
        var(--vaadin-input-field-bottom-end-radius, var(--_input-container-radius))
        var(--vaadin-input-field-bottom-start-radius, var(--_input-container-radius));
      /* Fallback */
      --_input-container-radius: var(--vaadin-input-field-border-radius, var(--lumo-border-radius-m));
      --_input-height: var(--lumo-text-field-size, var(--lumo-size-m));
      /* Default values */
      --_background: var(--vaadin-input-field-background, var(--lumo-contrast-10pct));
      --_hover-highlight: var(--vaadin-input-field-hover-highlight, var(--lumo-contrast-50pct));
      --_input-border-color: var(--vaadin-input-field-border-color, var(--lumo-contrast-50pct));
      --_icon-color: var(--vaadin-input-field-icon-color, var(--lumo-contrast-60pct));
      --_icon-size: var(--vaadin-input-field-icon-size, var(--lumo-icon-size-m));
      --_invalid-background: var(--vaadin-input-field-invalid-background, var(--lumo-error-color-10pct));
      --_invalid-hover-highlight: var(--vaadin-input-field-invalid-hover-highlight, var(--lumo-error-color-50pct));
    }

    :host([dir='rtl']) {
      border-radius:
        /* Don't use logical props, see https://github.com/vaadin/vaadin-time-picker/issues/145 */
        var(--vaadin-input-field-top-end-radius, var(--_input-container-radius))
        var(--vaadin-input-field-top-start-radius, var(--_input-container-radius))
        var(--vaadin-input-field-bottom-start-radius, var(--_input-container-radius))
        var(--vaadin-input-field-bottom-end-radius, var(--_input-container-radius));
    }

    /* Used for hover and activation effects */
    :host::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      pointer-events: none;
      background: var(--_hover-highlight);
      opacity: 0;
      transition: transform 0.15s, opacity 0.2s;
      transform-origin: 100% 0;
    }

    ::slotted(:not([slot$='fix'])) {
      cursor: inherit;
      min-height: var(--vaadin-input-field-height, var(--_input-height));
      padding: 0 0.25em;
      --_lumo-text-field-overflow-mask-image: linear-gradient(to left, transparent, #000 1.25em);
      -webkit-mask-image: var(--_lumo-text-field-overflow-mask-image);
      mask-image: var(--_lumo-text-field-overflow-mask-image);
    }

    /* Read-only */
    :host([readonly]) {
      color: var(--lumo-secondary-text-color);
      background-color: transparent;
      cursor: default;
    }

    :host([readonly])::after {
      background-color: transparent;
      opacity: 1;
      border: var(--vaadin-input-field-readonly-border, 1px dashed var(--lumo-contrast-30pct));
    }

    /* Disabled */
    :host([disabled]) {
      background-color: var(--lumo-contrast-5pct);
    }

    :host([disabled]) ::slotted(*) {
      color: var(--lumo-disabled-text-color);
      -webkit-text-fill-color: var(--lumo-disabled-text-color);
    }

    /* Invalid */
    :host([invalid]) {
      background: var(--_invalid-background);
    }

    :host([invalid]:not([readonly]))::after {
      background: var(--_invalid-hover-highlight);
    }

    /* Slotted icons */
    ::slotted(vaadin-icon) {
      color: var(--_icon-color);
      width: var(--_icon-size);
      height: var(--_icon-size);
    }

    /* Vaadin icons are based on a 16x16 grid (unlike Lumo and Material icons with 24x24), so they look too big by default */
    ::slotted(vaadin-icon[icon^='vaadin:']) {
      padding: 0.25em;
      box-sizing: border-box !important;
    }

    /* Text align */
    :host([dir='rtl']) ::slotted(:not([slot$='fix'])) {
      --_lumo-text-field-overflow-mask-image: linear-gradient(to right, transparent, #000 1.25em);
    }

    @-moz-document url-prefix() {
      :host([dir='rtl']) ::slotted(:not([slot$='fix'])) {
        mask-image: var(--_lumo-text-field-overflow-mask-image);
      }
    }

    :host([theme~='align-left']) ::slotted(:not([slot$='fix'])) {
      text-align: start;
      --_lumo-text-field-overflow-mask-image: none;
    }

    :host([theme~='align-center']) ::slotted(:not([slot$='fix'])) {
      text-align: center;
      --_lumo-text-field-overflow-mask-image: none;
    }

    :host([theme~='align-right']) ::slotted(:not([slot$='fix'])) {
      text-align: end;
      --_lumo-text-field-overflow-mask-image: none;
    }

    @-moz-document url-prefix() {
      /* Firefox is smart enough to align overflowing text to right */
      :host([theme~='align-right']) ::slotted(:not([slot$='fix'])) {
        --_lumo-text-field-overflow-mask-image: linear-gradient(to right, transparent 0.25em, #000 1.5em);
      }
    }

    @-moz-document url-prefix() {
      /* Firefox is smart enough to align overflowing text to right */
      :host([theme~='align-left']) ::slotted(:not([slot$='fix'])) {
        --_lumo-text-field-overflow-mask-image: linear-gradient(to left, transparent 0.25em, #000 1.5em);
      }
    }

    /* RTL specific styles */
    :host([dir='rtl'])::after {
      transform-origin: 0% 0;
    }

    :host([theme~='align-left'][dir='rtl']) ::slotted(:not([slot$='fix'])) {
      --_lumo-text-field-overflow-mask-image: none;
    }

    :host([theme~='align-center'][dir='rtl']) ::slotted(:not([slot$='fix'])) {
      --_lumo-text-field-overflow-mask-image: none;
    }

    :host([theme~='align-right'][dir='rtl']) ::slotted(:not([slot$='fix'])) {
      --_lumo-text-field-overflow-mask-image: none;
    }

    @-moz-document url-prefix() {
      /* Firefox is smart enough to align overflowing text to right */
      :host([theme~='align-right'][dir='rtl']) ::slotted(:not([slot$='fix'])) {
        --_lumo-text-field-overflow-mask-image: linear-gradient(to right, transparent 0.25em, #000 1.5em);
      }
    }

    @-moz-document url-prefix() {
      /* Firefox is smart enough to align overflowing text to right */
      :host([theme~='align-left'][dir='rtl']) ::slotted(:not([slot$='fix'])) {
        --_lumo-text-field-overflow-mask-image: linear-gradient(to left, transparent 0.25em, #000 1.5em);
      }
    }
  `,
  { moduleId: 'lumo-input-container' },
);

/**
 * @license
 * Copyright (c) 2017 - 2024 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */

const fontIcons = i$2`
  @font-face {
    font-family: 'lumo-icons';
    src: url(data:application/font-woff;charset=utf-8;base64,d09GRgABAAAAABEgAAsAAAAAIjQAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAABHU1VCAAABCAAAADsAAABUIIslek9TLzIAAAFEAAAAQwAAAFZAIUuKY21hcAAAAYgAAAD4AAADrsCU8d5nbHlmAAACgAAAC2cAABeAWri7U2hlYWQAAA3oAAAAMAAAADZa/6SsaGhlYQAADhgAAAAdAAAAJAbpA35obXR4AAAOOAAAABAAAACspBAAAGxvY2EAAA5IAAAAWAAAAFh57oA4bWF4cAAADqAAAAAfAAAAIAFKAXBuYW1lAAAOwAAAATEAAAIuUUJZCHBvc3QAAA/0AAABKwAAAelm8SzVeJxjYGRgYOBiMGCwY2BycfMJYeDLSSzJY5BiYGGAAJA8MpsxJzM9kYEDxgPKsYBpDiBmg4gCACY7BUgAeJxjYGS+yDiBgZWBgamKaQ8DA0MPhGZ8wGDIyAQUZWBlZsAKAtJcUxgcXjG+0mIO+p/FEMUcxDANKMwIkgMABn8MLQB4nO3SWW6DMABF0UtwCEnIPM/zhLK8LqhfXRybSP14XUYtHV9hGYQwQBNIo3cUIPkhQeM7rib1ekqnXg981XuC1qvy84lzojleh3puxL0hPjGjRU473teloEefAUNGjJkwZcacBUtWrNmwZceeA0dOnLlw5cadB09elPGhGf+j0NTI/65KfXerT6JhqKnpRKtgOpuqaTrtKjPUlqHmhto21I7pL6i6hlqY3q7qGWrfUAeGOjTUkaGODXViqFNDnRnq3FAXhro01JWhrg11Y6hbQ90Z6t5QD4Z6NNSToZ4N9WKoV0O9GerdUB+G+jTUl6GWRvkL24BkEXictVh9bFvVFb/nxvbz+7Rf/N6zHcd2bCfP+Wic1Z9N0jpNHCD9SNqqoVBgbQoMjY+pjA4hNnWa2pV1rHSIif0DGkyT2k10Kmu1Cag6huj4ZpqYBHSqJsTEJgZCG3TaVBFv595nO3ZIv4RIrPPuvefe884599zzO/cRF8G/tgn6CFFImNgkR0ggX8wlspbhSSWSdrC5ozd30s2dw5afzvgtyz9/zG9t1hV4RtF1pXolowvtzc2z6L2aYUQM45jKH9WDTvd1LRDoDASYWhfTzTyvboXz6uZX4ARX5wrF39y+HM2+CJ8d0pkyqBIqoze3D12ez4DrFoYzxI8dWwMrDlZ2DMqQAR9AROsJU+2smlTPaTTco52BVxXa2a2+I8vvqd2dVHm1LoPeTn/AZPRYGthDYOeZjBjKoFsVGulR3lGU95SeCK44oHU7MhWUGUKZDT3oSUcG2GWuh+EDDfUYA/jhIhl0TOsJNYSEu7mQmi3UzfXwZKA4BsVsHLXQYGgJW95qEtpJ1VcW9HiTriZBlFEqxsDjA09yCNUoQxxwd7KWSTt2y3GTKifkqHRCoWZc3m11Wa/dKdFgXD4kSYfkeJBKd8KMz7J8dZn/cGRCcLGDnA2Ge3bKzcvlnTDNthFWLH7Xt80ua5FMjA4WKelWv5Xo16vHuYzpRbJhhdVlftuRK0VlR27D9lu5TF0DPBi60OrHNO0AfP/uRWvhn/U3LXICE+nh+3IHPUJ8JE6GyBjZQLbjGchlrSgYngF8zyrIF4NJD3atUcgWsWunGN/UHX5B5/yg7uF87Nqp4Gf52F3gH73DjEZNRoqCKAr9giQJp5rGJABpiVE2htNhW9R8nw0jqYjCYcY4LIjwYNScf4WN06IZnZCEqsI4cFaQbo4Z1TsZBx40YhXkHOecaYE5oY37IIQ+iJJ+UsDYSun5MuRSBRZRUUhlY2DqOGajOR6zrSU/5My6l2DnusH1GQgnw5BZP7iuYM/ahcfQ7Z8y51ddfutvuwNqWQ0cBYr8fj0U0vsHpwerVaB2sWhXT2NExi2r1KUE2tUuVMnkepVQrxTmpQrZTG4iu8he8iPyM3KcPE/+RP5KPoE2CEAKclCBzXATxkYOtUY/o961PWRqsj0chRrHFBbtrjP9/P0ven5pcbRdpL94vfsy33e5+izuwz3nFLFPVNayPZx/jdG1fOChflFRvYzsW6L18efgLrSWIgvcqnGJYi4skO4xREURjbDuxKke5v0T3Mrzkt2fi31uyZlLLrqIpEuXXsMlgw442Jb0GAxjS1DM20kBoCzHLXm/jEm0IltdcvU0fEW24jgiwwRjVd9u4NJHcIyoHJcwvyVqgqj5hqBJ1ZWSJryh9p56UWhX1XbhRbW2ZopuZWsQd5y8mEQ8M+C6xjRYxZbDKWf5AgY+Qq/l6wSPk16zDFjowYuu+wjx13mfkxbyDDxadYT/LijZyI0THB+6yfLaWsRcO82zo9mWTNtpO18qlorZoIVMwSN40tky5DOQ1MCIAe24mvlsuwIIxPb10+uXDQ4uWz/9m3rj+ql7p6bufZARuPVq5tXtsn6KwfP8Jy0TeWOyNhUJN6mhX5rkUTtUppQWEMNTqEdaCGKFYKJaQrCE4JtDLYOlNEKmO5kBTPGY2A0N2sY3+dVlo1N9ycBsIGtOjQ2p/tlZvzo0ur4v6cOh8NTospB7U/X40KahoU3bGIH97dnwmtHlYffVG3R1YOwKM2vNhrPhCT5zk64sG53oS4b31aYjqe/B7+kQiXBN+b6h21hNUPMq29B8CU4elINdygMPKF1B+WBTG7Z9ZshpN/xwEuuDQZR+nuoo4CDaAiiwXmLpmukMQyPf/JMclqgL1ixZQ/nnP2VbdUODFGt2fgBvL123rlLYu/6A9ckb7F3K0/CyBMEu6aQoPscroCcacVehvyQyCZAsizsWWBkoLC+WAiWnOksLKaeuQDzGuqSk42aiYTiJ4zf9afl17SrqaTO1f+XlZAfIuYcq7/IqYMaMrksOJ6vHkOCPDq943xcCnHqVD9pHFRpMqSPXrIua1WNs+tOz1U+ciTCDpPk+c4QYJIHnYhxP/kVPAq+ahFpVhPcHp8qyarhiF+HsBU9Hrl+UZa876fbKipL0KqB6OdUveErgtOI97fZ63ae9SvWU6k2w1JfwqnUbHsYcFCJFrC/W12zIMMirWYEHxMPs6LGYSdkSZ5TsNP9PCpwnWC3HKZ1lydNjWHC2Mn3l6vL0dHn1ldP3LTSrX+vKrBqv7KmMr8p0SR6P1NqF63or6XRlIyO90f7+kf7+myOhvt4tq7f09oUiTc2/dycGgqFQcCDRLYmi1NL7fk0CknVMxEg/cdfs/TnpJMNkgqwj17B8beVazSrVbU4lG67IZYOCnWrYy3yBR9cyWcChywos3LJBEdhhFoAdYjiw0rLGm0xU5OzoGm5/ZfmHjVZpNNg6SznzGKDdwv2cCtVn6Eaxo12cfxLprpVtTcZ6hVx6dow7Yq7e8LXO8PY9Jgjoze9yCtU5FNbegcKkQMdCbt9au/te4Ebe0jkc0ukUL32eYnTpNs20h0KpUOhZPYwVcfhZnfdqeCvDfXiuCbAoYWcXERPc/mDQD3/hdF+wK4i/xv3kYfprIpAuMkk2kW3kdtS0kBIKpZwp8KxmsCyfM1MFzAss9LBkDxRyThiaqTLwKYKJVTwmWTudMyz+yks09346MDh4m72yOxCKrt1XMlQ1qPVlTEVVQ1ofdK/sCWjtZu9qGwZ8YZ9PPWlo1IV3eW3+U0aXblP39zrt+JPf6UhEQ1rUjNBULN+utyuaDNW34kpAVuSOeMTyWbSNWnooFu+QFNWQ4d/Ox4IPWx41fP/fB/Rjeoz08ezPA9TysMtmnOXfGN7Ui3xIYLDALrlDLOP09qtJuY2OeL0+QZXdRnR1nxRVBF/SOyKKPpcrn9mWzH4rH9IidE+PTNU2182+hOgSItrE1slByS24vaLvJpxOqe4Pduf3HJkZ+jLqUz9rRzB7p8gKcgWZwV1L8JtUS5Z2JxZSOCuBoMTQihMzLbCPA0KqGMAljRQjONklW/wjnXKy8vxT/Elvm3/KiMUMOoV0/vnDYlhec0SMKtt3/kKMyOt33tj2bqxQLsTjSGLl+EAsNhCnTyRGktW55EgCn/A4PlnWn+Mg8bgZrWqHxTbPwMuyy1u5YeZF2SUM7JRhddwRgiRuxpmgJmxn9ZW7XpcF3ViX/ar6ptRpGJ0S9Adg4qhb9sI3vbL7qNJV/y4i07t5TZBiho1imFoMz3gED+CtjYUxvP4SOxov4bFoNPg5aR1e+G4UgDPoedJTpogyCJ7oYvRqoVS0MQAy+CoNEdTDUjok5ZHZL/WtjV7rFj3PKQE3iKp7ou+rIxN3b9LB1dGjeT4cvKo3FrnWpYpuaFd/h3dtV8UeKN1Y9hpR3dt4p0H/zKuPQq0kZQUIIpuDfoiETsnIk+gCWMJZUXHtE8V9LkUc2TE8vOMbO4ax/MACabzyaGXc7u3FBr11ThBdB8SIeMAlCntG2KThHSPsaj2Dc9KNyY2a0KZ7ODaTHoRiFkeYz+shZBpCS4X6471KKKnuHd84edfk5F37d1XO5bbkcltu2ZLNbvnPXiUVAnVvprJrP+NObryjxrllS65md6Tm6wzFHRR4dY3QUUjb7MgxaIixU8hspi98fl/Xc+IB4iU66eCVL9YfAfahiSUt4TONS8x0D8W7u8vd3fGWx6OXlM/U1IoU/s61PGhpyXRFa3eReq2qG56lvmYtXavCC1iN7lbiBpWxXHU+cSlztVLVz0tVN600fVsLxaVDknhYioeoXP3t4lqV1r79MAw0GCI1FTL1YIGzPL1MMlJ9ZsN9P7lvA2yr9ZFUzwzPrVgxN/x/SS+chwB4nGNgZGBgAOLPrYdY4vltvjJwM78AijDUqG5oRND/XzNPZboF5HIwMIFEAU/lC+J4nGNgZGBgDvqfBSRfMAAB81QGRgZUoA0AVvYDbwAAAHicY2BgYGB+MTQwAM8EJo8AAAAAAE4AmgDoAQoBLAFOAXABmgHEAe4CGgKcAugEmgS8BNYE8gUOBSoFegXQBf4GRAZmBrYHGAeQCBgIUghqCP4JRgm+CdoKBAo+CoQKugr0C1QLmgvAeJxjYGRgYNBmTGEQZQABJiDmAkIGhv9gPgMAGJQBvAB4nG2RPU7DMBiG3/QP0UoIBGJh8QILavozdmRo9w7d09RpUzlx5LgVvQMn4BAcgoEzcAgOwVvzSZVQbcnf48fvFysJgGt8IcJxROiG9TgauODuj5ukG+EW+UG4jR4ehTv0Q+EunjER7uEWmk+IWpc0d3gVbuAKb8JN+nfhFvlDuI17fAp36L+Fu1jgR7iHp+jF7Arbz1Nb1nO93pnEncSJFtrVuS3VKB6e5EyX2iVer9TyoOr9eux9pjJnCzW1pdfGWFU5u9WpjzfeV5PBIBMfp7aAwQ4FLPrIkbKWqDHn+67pDRK4s4lzbsEux5qHvcIIMb/nueSMyTKkE3jWFdNLHLjW2PPmMa1Hxn3GjGW/wjT0HtOG09JU4WxLk9LH2ISuiv9twJn9y8fh9uIXI+BknAAAAHicbY7ZboMwEEW5CVBCSLrv+76kfJRjTwHFsdGAG+Xvy5JUfehIHp0rnxmNN/D6ir3/a4YBhvARIMQOIowQY4wEE0yxiz3s4wCHOMIxTnCKM5zjApe4wjVucIs73OMBj3jCM17wije84wMzfHqJ0EVmUkmmJo77oOmrHvfIRZbXsTCZplTZldlgb3TYGVHProwFs11t1A57tcON2rErR3PBqcwF1/6ctI6k0GSU4JHMSS6WghdJQ99sTbfuN7QLJ9vQ37dNrgyktnIxlDYLJNuqitpRbYWKFNuyDT6pog6oOYKHtKakeakqKjHXpPwlGRcsC+OqxLIiJpXqoqqDMreG2l5bv9Ri3TRX+c23DZna9WFFgmXuO6Ps1Jm/w6ErW8N3FbHn/QC444j0AA==)
      format('woff');
    font-weight: normal;
    font-style: normal;
  }

  html {
    --lumo-icons-align-center: '\\ea01';
    --lumo-icons-align-left: '\\ea02';
    --lumo-icons-align-right: '\\ea03';
    --lumo-icons-angle-down: '\\ea04';
    --lumo-icons-angle-left: '\\ea05';
    --lumo-icons-angle-right: '\\ea06';
    --lumo-icons-angle-up: '\\ea07';
    --lumo-icons-arrow-down: '\\ea08';
    --lumo-icons-arrow-left: '\\ea09';
    --lumo-icons-arrow-right: '\\ea0a';
    --lumo-icons-arrow-up: '\\ea0b';
    --lumo-icons-bar-chart: '\\ea0c';
    --lumo-icons-bell: '\\ea0d';
    --lumo-icons-calendar: '\\ea0e';
    --lumo-icons-checkmark: '\\ea0f';
    --lumo-icons-chevron-down: '\\ea10';
    --lumo-icons-chevron-left: '\\ea11';
    --lumo-icons-chevron-right: '\\ea12';
    --lumo-icons-chevron-up: '\\ea13';
    --lumo-icons-clock: '\\ea14';
    --lumo-icons-cog: '\\ea15';
    --lumo-icons-cross: '\\ea16';
    --lumo-icons-download: '\\ea17';
    --lumo-icons-dropdown: '\\ea18';
    --lumo-icons-edit: '\\ea19';
    --lumo-icons-error: '\\ea1a';
    --lumo-icons-eye: '\\ea1b';
    --lumo-icons-eye-disabled: '\\ea1c';
    --lumo-icons-menu: '\\ea1d';
    --lumo-icons-minus: '\\ea1e';
    --lumo-icons-ordered-list: '\\ea1f';
    --lumo-icons-phone: '\\ea20';
    --lumo-icons-photo: '\\ea21';
    --lumo-icons-play: '\\ea22';
    --lumo-icons-plus: '\\ea23';
    --lumo-icons-redo: '\\ea24';
    --lumo-icons-reload: '\\ea25';
    --lumo-icons-search: '\\ea26';
    --lumo-icons-undo: '\\ea27';
    --lumo-icons-unordered-list: '\\ea28';
    --lumo-icons-upload: '\\ea29';
    --lumo-icons-user: '\\ea2a';
  }
`;

addLumoGlobalStyles('font-icons', fontIcons);

/**
 * @license
 * Copyright (c) 2017 - 2024 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */

const fieldButton = i$2`
  [part$='button'] {
    flex: none;
    width: 1em;
    height: 1em;
    line-height: 1;
    font-size: var(--lumo-icon-size-m);
    text-align: center;
    color: var(--lumo-contrast-60pct);
    transition: 0.2s color;
    cursor: var(--lumo-clickable-cursor);
  }

  [part$='button']:hover {
    color: var(--lumo-contrast-90pct);
  }

  :host([disabled]) [part$='button'],
  :host([readonly]) [part$='button'] {
    color: var(--lumo-contrast-20pct);
    cursor: default;
  }

  [part$='button']::before {
    font-family: 'lumo-icons';
    display: block;
  }
`;
registerStyles('', fieldButton, { moduleId: 'lumo-field-button' });

/**
 * @license
 * Copyright (c) 2017 - 2024 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */

const helper = i$2`
  :host {
    --_helper-spacing: var(--vaadin-input-field-helper-spacing, 0.4em);
  }

  :host([has-helper]) [part='helper-text']::before {
    content: '';
    display: block;
    height: var(--_helper-spacing);
  }

  [part='helper-text'] {
    display: block;
    color: var(--vaadin-input-field-helper-color, var(--lumo-secondary-text-color));
    font-size: var(--vaadin-input-field-helper-font-size, var(--lumo-font-size-xs));
    line-height: var(--lumo-line-height-xs);
    font-weight: var(--vaadin-input-field-helper-font-weight, 400);
    margin-left: calc(var(--lumo-border-radius-m) / 4);
    transition: color 0.2s;
  }

  :host(:hover:not([readonly])) [part='helper-text'] {
    color: var(--lumo-body-text-color);
  }

  :host([disabled]) [part='helper-text'] {
    color: var(--lumo-disabled-text-color);
    -webkit-text-fill-color: var(--lumo-disabled-text-color);
  }

  :host([has-helper][theme~='helper-above-field']) [part='helper-text']::before {
    display: none;
  }

  :host([has-helper][theme~='helper-above-field']) [part='helper-text']::after {
    content: '';
    display: block;
    height: var(--_helper-spacing);
  }

  :host([has-helper][theme~='helper-above-field']) [part='label'] {
    order: 0;
    padding-bottom: var(--_helper-spacing);
  }

  :host([has-helper][theme~='helper-above-field']) [part='helper-text'] {
    order: 1;
  }

  :host([has-helper][theme~='helper-above-field']) [part='label'] + * {
    order: 2;
  }

  :host([has-helper][theme~='helper-above-field']) [part='error-message'] {
    order: 3;
  }
`;

/**
 * @license
 * Copyright (c) 2017 - 2024 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */

const requiredField = i$2`
  [part='label'] {
    align-self: flex-start;
    color: var(--vaadin-input-field-label-color, var(--lumo-secondary-text-color));
    font-weight: var(--vaadin-input-field-label-font-weight, 500);
    font-size: var(--vaadin-input-field-label-font-size, var(--lumo-font-size-s));
    margin-left: calc(var(--lumo-border-radius-m) / 4);
    transition: color 0.2s;
    line-height: 1;
    padding-right: 1em;
    padding-bottom: 0.5em;
    /* As a workaround for diacritics being cut off, add a top padding and a
    negative margin to compensate */
    padding-top: 0.25em;
    margin-top: -0.25em;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    position: relative;
    max-width: 100%;
    box-sizing: border-box;
  }

  :host([focused]:not([readonly])) [part='label'] {
    color: var(--vaadin-input-field-focused-label-color, var(--lumo-primary-text-color));
  }

  :host(:hover:not([readonly]):not([focused])) [part='label'] {
    color: var(--vaadin-input-field-hovered-label-color, var(--lumo-body-text-color));
  }

  /* Touch device adjustment */
  @media (pointer: coarse) {
    :host(:hover:not([readonly]):not([focused])) [part='label'] {
      color: var(--vaadin-input-field-label-color, var(--lumo-secondary-text-color));
    }
  }

  :host([has-label])::before {
    margin-top: calc(var(--lumo-font-size-s) * 1.5);
  }

  :host([has-label][theme~='small'])::before {
    margin-top: calc(var(--lumo-font-size-xs) * 1.5);
  }

  :host([has-label]) {
    padding-top: var(--lumo-space-m);
  }

  :host([has-label]) ::slotted([slot='tooltip']) {
    --vaadin-tooltip-offset-bottom: calc((var(--lumo-space-m) - var(--lumo-space-xs)) * -1);
  }

  :host([required]) [part='required-indicator']::after {
    content: var(--lumo-required-field-indicator, '\\2022');
    transition: opacity 0.2s;
    color: var(--lumo-required-field-indicator-color, var(--lumo-primary-text-color));
    position: absolute;
    right: 0;
    width: 1em;
    text-align: center;
  }

  :host([invalid]) [part='required-indicator']::after {
    color: var(--lumo-required-field-indicator-color, var(--lumo-error-text-color));
  }

  [part='error-message'] {
    margin-left: calc(var(--lumo-border-radius-m) / 4);
    font-size: var(--vaadin-input-field-error-font-size, var(--lumo-font-size-xs));
    line-height: var(--lumo-line-height-xs);
    font-weight: var(--vaadin-input-field-error-font-weight, 400);
    color: var(--vaadin-input-field-error-color, var(--lumo-error-text-color));
    will-change: max-height;
    transition: 0.4s max-height;
    max-height: 5em;
  }

  :host([has-error-message]) [part='error-message']::before,
  :host([has-error-message]) [part='error-message']::after {
    content: '';
    display: block;
    height: 0.4em;
  }

  :host(:not([invalid])) [part='error-message'] {
    max-height: 0;
    overflow: hidden;
  }

  /* RTL specific styles */

  :host([dir='rtl']) [part='label'] {
    margin-left: 0;
    margin-right: calc(var(--lumo-border-radius-m) / 4);
  }

  :host([dir='rtl']) [part='label'] {
    padding-left: 1em;
    padding-right: 0;
  }

  :host([dir='rtl']) [part='required-indicator']::after {
    right: auto;
    left: 0;
  }

  :host([dir='rtl']) [part='error-message'] {
    margin-left: 0;
    margin-right: calc(var(--lumo-border-radius-m) / 4);
  }
`;

registerStyles('', requiredField, { moduleId: 'lumo-required-field' });

/**
 * @license
 * Copyright (c) 2017 - 2024 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */

const inputField = i$2`
  :host {
    --lumo-text-field-size: var(--lumo-size-m);
    color: var(--vaadin-input-field-value-color, var(--lumo-body-text-color));
    font-size: var(--vaadin-input-field-value-font-size, var(--lumo-font-size-m));
    font-weight: var(--vaadin-input-field-value-font-weight, 400);
    font-family: var(--lumo-font-family);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    -webkit-tap-highlight-color: transparent;
    padding: var(--lumo-space-xs) 0;
    --_focus-ring-color: var(--vaadin-focus-ring-color, var(--lumo-primary-color-50pct));
    --_focus-ring-width: var(--vaadin-focus-ring-width, 2px);
    --_input-height: var(--vaadin-input-field-height, var(--lumo-text-field-size));
  }

  :host::before {
    height: var(--_input-height);
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
  }

  :host([focused]) [part='input-field'] ::slotted(:is(input, textarea)) {
    -webkit-mask-image: none;
    mask-image: none;
  }

  ::slotted(:is(input, textarea):placeholder-shown) {
    color: var(--vaadin-input-field-placeholder-color, var(--lumo-secondary-text-color));
  }

  /* Hover */
  :host(:hover:not([readonly]):not([focused])) [part='input-field']::after {
    opacity: var(--vaadin-input-field-hover-highlight-opacity, 0.1);
  }

  /* Touch device adjustment */
  @media (pointer: coarse) {
    :host(:hover:not([readonly]):not([focused])) [part='input-field']::after {
      opacity: 0;
    }

    :host(:active:not([readonly]):not([focused])) [part='input-field']::after {
      opacity: 0.2;
    }
  }

  /* Trigger when not focusing using the keyboard */
  :host([focused]:not([focus-ring]):not([readonly])) [part='input-field']::after {
    transform: scaleX(0);
    transition-duration: 0.15s, 1s;
  }

  /* Focus-ring */
  :host([focus-ring]) [part='input-field'] {
    box-shadow: 0 0 0 var(--_focus-ring-width) var(--_focus-ring-color);
  }

  /* Read-only and disabled */
  :host(:is([readonly], [disabled])) ::slotted(:is(input, textarea):placeholder-shown) {
    opacity: 0;
  }

  /* Read-only style */
  :host([readonly]) {
    --vaadin-input-field-border-color: transparent;
  }

  /* Disabled style */
  :host([disabled]) {
    pointer-events: none;
    --vaadin-input-field-border-color: var(--lumo-contrast-20pct);
  }

  :host([disabled]) [part='label'],
  :host([disabled]) [part='input-field'] ::slotted(*) {
    color: var(--lumo-disabled-text-color);
    -webkit-text-fill-color: var(--lumo-disabled-text-color);
  }

  /* Invalid style */
  :host([invalid]) {
    --vaadin-input-field-border-color: var(--lumo-error-color);
  }

  :host([invalid][focus-ring]) [part='input-field'] {
    box-shadow: 0 0 0 2px var(--lumo-error-color-50pct);
  }

  :host([input-prevented]) [part='input-field'] {
    animation: shake 0.15s infinite;
  }

  @keyframes shake {
    25% {
      transform: translateX(4px);
    }
    75% {
      transform: translateX(-4px);
    }
  }

  /* Small theme */
  :host([theme~='small']) {
    font-size: var(--lumo-font-size-s);
    --lumo-text-field-size: var(--lumo-size-s);
  }

  :host([theme~='small']) [part='label'] {
    font-size: var(--lumo-font-size-xs);
  }

  :host([theme~='small']) [part='error-message'] {
    font-size: var(--lumo-font-size-xxs);
  }

  /* Slotted content */
  [part='input-field'] ::slotted(:not(vaadin-icon):not(input):not(textarea)) {
    color: var(--lumo-secondary-text-color);
    font-weight: 400;
  }

  [part='clear-button']::before {
    content: var(--lumo-icons-cross);
  }
`;

const inputFieldShared$1 = [requiredField, fieldButton, helper, inputField];

registerStyles('', inputFieldShared$1, {
  moduleId: 'lumo-input-field-shared-styles',
});

/**
 * @license
 * Copyright (c) 2017 - 2024 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */

registerStyles('vaadin-text-field', inputFieldShared$1, {
  moduleId: 'lumo-text-field-styles',
});

/**
 * @license
 * Copyright (c) 2021 - 2024 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */

/**
 * @polymerMixin
 */
const InputContainerMixin = (superClass) =>
  class InputContainerMixinClass extends superClass {
    static get properties() {
      return {
        /**
         * If true, the user cannot interact with this element.
         */
        disabled: {
          type: Boolean,
          reflectToAttribute: true,
        },

        /**
         * Set to true to make this element read-only.
         */
        readonly: {
          type: Boolean,
          reflectToAttribute: true,
        },

        /**
         * Set to true when the element is invalid.
         */
        invalid: {
          type: Boolean,
          reflectToAttribute: true,
        },
      };
    }

    /** @protected */
    ready() {
      super.ready();

      this.addEventListener('pointerdown', (event) => {
        if (event.target === this) {
          // Prevent direct clicks to the input container from blurring the input
          event.preventDefault();
        }
      });

      this.addEventListener('click', (event) => {
        if (event.target === this) {
          // The vaadin-input-container element was directly clicked,
          // focus any focusable child element from the default slot
          this.shadowRoot
            .querySelector('slot:not([name])')
            .assignedNodes({ flatten: true })
            .forEach((node) => node.focus && node.focus());
        }
      });
    }
  };

/**
 * @license
 * Copyright (c) 2021 - 2024 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */

const inputContainerStyles = i$2`
  :host {
    display: flex;
    align-items: center;
    flex: 0 1 auto;
    border-radius:
            /* See https://developer.mozilla.org/en-US/docs/Web/CSS/border-radius */
      var(--vaadin-input-field-top-start-radius, var(--__border-radius))
      var(--vaadin-input-field-top-end-radius, var(--__border-radius))
      var(--vaadin-input-field-bottom-end-radius, var(--__border-radius))
      var(--vaadin-input-field-bottom-start-radius, var(--__border-radius));
    --_border-radius: var(--vaadin-input-field-border-radius, 0);
    --_input-border-width: var(--vaadin-input-field-border-width, 0);
    --_input-border-color: var(--vaadin-input-field-border-color, transparent);
    box-shadow: inset 0 0 0 var(--_input-border-width, 0) var(--_input-border-color);
  }

  :host([dir='rtl']) {
    border-radius:
            /* Don't use logical props, see https://github.com/vaadin/vaadin-time-picker/issues/145 */
      var(--vaadin-input-field-top-end-radius, var(--_border-radius))
      var(--vaadin-input-field-top-start-radius, var(--_border-radius))
      var(--vaadin-input-field-bottom-start-radius, var(--_border-radius))
      var(--vaadin-input-field-bottom-end-radius, var(--_border-radius));
  }

  :host([hidden]) {
    display: none !important;
  }

  /* Reset the native input styles */
  ::slotted(input) {
    -webkit-appearance: none;
    -moz-appearance: none;
    flex: auto;
    white-space: nowrap;
    overflow: hidden;
    width: 100%;
    height: 100%;
    outline: none;
    margin: 0;
    padding: 0;
    border: 0;
    border-radius: 0;
    min-width: 0;
    font: inherit;
    line-height: normal;
    color: inherit;
    background-color: transparent;
    /* Disable default invalid style in Firefox */
    box-shadow: none;
  }

  ::slotted(*) {
    flex: none;
  }

  ::slotted(:is(input, textarea))::placeholder {
    /* Use ::slotted(input:placeholder-shown) in themes to style the placeholder. */
    /* because ::slotted(...)::placeholder does not work in Safari. */
    font: inherit;
    color: inherit;
    /* Override default opacity in Firefox */
    opacity: 1;
  }
`;

/**
 * @license
 * Copyright (c) 2021 - 2024 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */

registerStyles('vaadin-input-container', inputContainerStyles, { moduleId: 'vaadin-input-container-styles' });

/**
 * @customElement
 * @extends HTMLElement
 * @mixes ThemableMixin
 * @mixes DirMixin
 * @mixes InputContainerMixin
 */
class InputContainer extends InputContainerMixin(ThemableMixin(DirMixin(PolymerElement))) {
  static get is() {
    return 'vaadin-input-container';
  }

  static get template() {
    return html`
      <slot name="prefix"></slot>
      <slot></slot>
      <slot name="suffix"></slot>
    `;
  }
}

defineCustomElement(InputContainer);

/**
 * @license
 * Copyright (c) 2021 - 2024 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */


/**
 * Takes a string with values separated by space and returns a set the values
 *
 * @param {string} value
 * @return {Set<string>}
 */
function deserializeAttributeValue(value) {
  if (!value) {
    return new Set();
  }

  return new Set(value.split(' '));
}

/**
 * Takes a set of string values and returns a string with values separated by space
 *
 * @param {Set<string>} values
 * @return {string}
 */
function serializeAttributeValue(values) {
  return values ? [...values].join(' ') : '';
}

/**
 * Adds a value to an attribute containing space-delimited values.
 *
 * @param {HTMLElement} element
 * @param {string} attr
 * @param {string} value
 */
function addValueToAttribute(element, attr, value) {
  const values = deserializeAttributeValue(element.getAttribute(attr));
  values.add(value);
  element.setAttribute(attr, serializeAttributeValue(values));
}

/**
 * Removes a value from an attribute containing space-delimited values.
 * If the value is the last one, the whole attribute is removed.
 *
 * @param {HTMLElement} element
 * @param {string} attr
 * @param {string} value
 */
function removeValueFromAttribute(element, attr, value) {
  const values = deserializeAttributeValue(element.getAttribute(attr));
  values.delete(value);
  if (values.size === 0) {
    element.removeAttribute(attr);
    return;
  }
  element.setAttribute(attr, serializeAttributeValue(values));
}

/**
 * Returns true if the given node is an empty text node, false otherwise.
 *
 * @param {Node} node
 * @return {boolean}
 */
function isEmptyTextNode(node) {
  return node.nodeType === Node.TEXT_NODE && node.textContent.trim() === '';
}

/**
 * @license
 * Copyright (c) 2023 - 2024 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */

/**
 * A helper for observing slot changes.
 */
class SlotObserver {
  constructor(slot, callback) {
    /** @type HTMLSlotElement */
    this.slot = slot;

    /** @type Function */
    this.callback = callback;

    /** @type {Node[]} */
    this._storedNodes = [];

    this._connected = false;
    this._scheduled = false;

    this._boundSchedule = () => {
      this._schedule();
    };

    this.connect();
    this._schedule();
  }

  /**
   * Activates an observer. This method is automatically called when
   * a `SlotObserver` is created. It should only be called to  re-activate
   * an observer that has been deactivated via the `disconnect` method.
   */
  connect() {
    this.slot.addEventListener('slotchange', this._boundSchedule);
    this._connected = true;
  }

  /**
   * Deactivates the observer. After calling this method the observer callback
   * will not be called when changes to slotted nodes occur. The `connect` method
   * may be subsequently called to reactivate the observer.
   */
  disconnect() {
    this.slot.removeEventListener('slotchange', this._boundSchedule);
    this._connected = false;
  }

  /** @private */
  _schedule() {
    if (!this._scheduled) {
      this._scheduled = true;

      queueMicrotask(() => {
        this.flush();
      });
    }
  }

  /**
   * Run the observer callback synchronously.
   */
  flush() {
    if (!this._connected) {
      return;
    }

    this._scheduled = false;

    this._processNodes();
  }

  /** @private */
  _processNodes() {
    const currentNodes = this.slot.assignedNodes({ flatten: true });

    let addedNodes = [];
    const removedNodes = [];
    const movedNodes = [];

    if (currentNodes.length) {
      addedNodes = currentNodes.filter((node) => !this._storedNodes.includes(node));
    }

    if (this._storedNodes.length) {
      this._storedNodes.forEach((node, index) => {
        const idx = currentNodes.indexOf(node);
        if (idx === -1) {
          removedNodes.push(node);
        } else if (idx !== index) {
          movedNodes.push(node);
        }
      });
    }

    if (addedNodes.length || removedNodes.length || movedNodes.length) {
      this.callback({ addedNodes, movedNodes, removedNodes });
    }

    this._storedNodes = currentNodes;
  }
}

/**
 * @license
 * Copyright (c) 2021 - 2024 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */

let uniqueId = 0;

/**
 * Returns a unique integer id.
 *
 * @return {number}
 */
function generateUniqueId() {
  // eslint-disable-next-line no-plusplus
  return uniqueId++;
}

/**
 * @license
 * Copyright (c) 2021 - 2024 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */

/**
 * A controller for providing content to slot element and observing changes.
 */
class SlotController extends EventTarget {
  /**
   * Ensure that every instance has unique ID.
   *
   * @param {HTMLElement} host
   * @param {string} slotName
   * @return {string}
   * @protected
   */
  static generateId(host, slotName) {
    const prefix = slotName || 'default';
    return `${prefix}-${host.localName}-${generateUniqueId()}`;
  }

  constructor(host, slotName, tagName, config = {}) {
    super();

    const { initializer, multiple, observe, useUniqueId } = config;

    this.host = host;
    this.slotName = slotName;
    this.tagName = tagName;
    this.observe = typeof observe === 'boolean' ? observe : true;
    this.multiple = typeof multiple === 'boolean' ? multiple : false;
    this.slotInitializer = initializer;

    if (multiple) {
      this.nodes = [];
    }

    // Only generate the default ID if requested by the controller.
    if (useUniqueId) {
      this.defaultId = this.constructor.generateId(host, slotName);
    }
  }

  hostConnected() {
    if (!this.initialized) {
      if (this.multiple) {
        this.initMultiple();
      } else {
        this.initSingle();
      }

      if (this.observe) {
        this.observeSlot();
      }

      this.initialized = true;
    }
  }

  /** @protected */
  initSingle() {
    let node = this.getSlotChild();

    if (!node) {
      node = this.attachDefaultNode();
      this.initNode(node);
    } else {
      this.node = node;
      this.initAddedNode(node);
    }
  }

  /** @protected */
  initMultiple() {
    const children = this.getSlotChildren();

    if (children.length === 0) {
      const defaultNode = this.attachDefaultNode();
      if (defaultNode) {
        this.nodes = [defaultNode];
        this.initNode(defaultNode);
      }
    } else {
      this.nodes = children;
      children.forEach((node) => {
        this.initAddedNode(node);
      });
    }
  }

  /**
   * Create and attach default node using the provided tag name, if any.
   * @return {Node | undefined}
   * @protected
   */
  attachDefaultNode() {
    const { host, slotName, tagName } = this;

    // Check if the node was created previously and if so, reuse it.
    let node = this.defaultNode;

    // Tag name is optional, sometimes we don't init default content.
    if (!node && tagName) {
      node = document.createElement(tagName);
      if (node instanceof Element) {
        if (slotName !== '') {
          node.setAttribute('slot', slotName);
        }
        this.defaultNode = node;
      }
    }

    if (node) {
      this.node = node;
      host.appendChild(node);
    }

    return node;
  }

  /**
   * Return the list of nodes matching the slot managed by the controller.
   * @return {Node}
   */
  getSlotChildren() {
    const { slotName } = this;
    return Array.from(this.host.childNodes).filter((node) => {
      // Either an element (any slot) or a text node (only un-named slot).
      return (
        (node.nodeType === Node.ELEMENT_NODE && node.slot === slotName) ||
        (node.nodeType === Node.TEXT_NODE && node.textContent.trim() && slotName === '')
      );
    });
  }

  /**
   * Return a reference to the node managed by the controller.
   * @return {Node}
   */
  getSlotChild() {
    return this.getSlotChildren()[0];
  }

  /**
   * Run `slotInitializer` for the node managed by the controller.
   *
   * @param {Node} node
   * @protected
   */
  initNode(node) {
    const { slotInitializer } = this;
    // Don't try to bind `this` to initializer (normally it's arrow function).
    // Instead, pass the host as a first argument to access component's state.
    if (slotInitializer) {
      slotInitializer(node, this.host);
    }
  }

  /**
   * Override to initialize the newly added custom node.
   *
   * @param {Node} _node
   * @protected
   */
  initCustomNode(_node) {}

  /**
   * Override to teardown slotted node when it's removed.
   *
   * @param {Node} _node
   * @protected
   */
  teardownNode(_node) {}

  /**
   * Run both `initCustomNode` and `initNode` for a custom slotted node.
   *
   * @param {Node} node
   * @protected
   */
  initAddedNode(node) {
    if (node !== this.defaultNode) {
      this.initCustomNode(node);
      this.initNode(node);
    }
  }

  /**
   * Setup the observer to manage slot content changes.
   * @protected
   */
  observeSlot() {
    const { slotName } = this;
    const selector = slotName === '' ? 'slot:not([name])' : `slot[name=${slotName}]`;
    const slot = this.host.shadowRoot.querySelector(selector);

    this.__slotObserver = new SlotObserver(slot, ({ addedNodes, removedNodes }) => {
      const current = this.multiple ? this.nodes : [this.node];

      // Calling `slot.assignedNodes()` includes whitespace text nodes in case of default slot:
      // unlike comment nodes, they are not filtered out. So we need to manually ignore them.
      const newNodes = addedNodes.filter((node) => !isEmptyTextNode(node) && !current.includes(node));

      if (removedNodes.length) {
        this.nodes = current.filter((node) => !removedNodes.includes(node));

        removedNodes.forEach((node) => {
          this.teardownNode(node);
        });
      }

      if (newNodes && newNodes.length > 0) {
        if (this.multiple) {
          // Remove default node if exists
          if (this.defaultNode) {
            this.defaultNode.remove();
          }
          this.nodes = [...current, ...newNodes].filter((node) => node !== this.defaultNode);
          newNodes.forEach((node) => {
            this.initAddedNode(node);
          });
        } else {
          // Remove previous node if exists
          if (this.node) {
            this.node.remove();
          }
          this.node = newNodes[0];
          this.initAddedNode(this.node);
        }
      }
    });
  }
}

/**
 * @license
 * Copyright (c) 2022 - 2024 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */

/**
 * A controller that manages the slotted tooltip element.
 */
class TooltipController extends SlotController {
  constructor(host) {
    // Do not provide slot factory to create tooltip lazily.
    super(host, 'tooltip');

    this.setTarget(host);
  }

  /**
   * Override to initialize the newly added custom tooltip.
   *
   * @param {Node} tooltipNode
   * @protected
   * @override
   */
  initCustomNode(tooltipNode) {
    tooltipNode.target = this.target;

    if (this.ariaTarget !== undefined) {
      tooltipNode.ariaTarget = this.ariaTarget;
    }

    if (this.context !== undefined) {
      tooltipNode.context = this.context;
    }

    if (this.manual !== undefined) {
      tooltipNode.manual = this.manual;
    }

    if (this.opened !== undefined) {
      tooltipNode.opened = this.opened;
    }

    if (this.position !== undefined) {
      tooltipNode._position = this.position;
    }

    if (this.shouldShow !== undefined) {
      tooltipNode.shouldShow = this.shouldShow;
    }

    this.__notifyChange();
  }

  /**
   * Override to notify the host when the tooltip is removed.
   *
   * @param {Node} tooltipNode
   * @protected
   * @override
   */
  teardownNode() {
    this.__notifyChange();
  }

  /**
   * Set an HTML element for linking with the tooltip overlay
   * via `aria-describedby` attribute used by screen readers.
   * @param {HTMLElement} ariaTarget
   */
  setAriaTarget(ariaTarget) {
    this.ariaTarget = ariaTarget;

    const tooltipNode = this.node;
    if (tooltipNode) {
      tooltipNode.ariaTarget = ariaTarget;
    }
  }

  /**
   * Set a context object to be used by generator.
   * @param {object} context
   */
  setContext(context) {
    this.context = context;

    const tooltipNode = this.node;
    if (tooltipNode) {
      tooltipNode.context = context;
    }
  }

  /**
   * Toggle manual state on the slotted tooltip.
   * @param {boolean} manual
   */
  setManual(manual) {
    this.manual = manual;

    const tooltipNode = this.node;
    if (tooltipNode) {
      tooltipNode.manual = manual;
    }
  }

  /**
   * Toggle opened state on the slotted tooltip.
   * @param {boolean} opened
   */
  setOpened(opened) {
    this.opened = opened;

    const tooltipNode = this.node;
    if (tooltipNode) {
      tooltipNode.opened = opened;
    }
  }

  /**
   * Set default position for the slotted tooltip.
   * This can be overridden by setting the position
   * using corresponding property or attribute.
   * @param {string} position
   */
  setPosition(position) {
    this.position = position;

    const tooltipNode = this.node;
    if (tooltipNode) {
      tooltipNode._position = position;
    }
  }

  /**
   * Set function used to detect whether to show
   * the tooltip based on a condition.
   * @param {Function} shouldShow
   */
  setShouldShow(shouldShow) {
    this.shouldShow = shouldShow;

    const tooltipNode = this.node;
    if (tooltipNode) {
      tooltipNode.shouldShow = shouldShow;
    }
  }

  /**
   * Set an HTML element to attach the tooltip to.
   * @param {HTMLElement} target
   */
  setTarget(target) {
    this.target = target;

    const tooltipNode = this.node;
    if (tooltipNode) {
      tooltipNode.target = target;
    }
  }

  /** @private */
  __notifyChange() {
    this.dispatchEvent(new CustomEvent('tooltip-changed', { detail: { node: this.node } }));
  }
}

/**
 * @license
 * Copyright (c) 2021 - 2024 Vaadin Ltd..
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */

const clearButton = i$2`
  [part='clear-button'] {
    display: none;
    cursor: default;
  }

  [part='clear-button']::before {
    content: '\\2715';
  }

  :host([clear-button-visible][has-value]:not([disabled]):not([readonly])) [part='clear-button'] {
    display: block;
  }
`;

/**
 * @license
 * Copyright (c) 2021 - 2024 Vaadin Ltd..
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */

const fieldShared = i$2`
  :host {
    display: inline-flex;
    outline: none;
  }

  :host::before {
    content: '\\2003';
    width: 0;
    display: inline-block;
    /* Size and position this element on the same vertical position as the input-field element
          to make vertical align for the host element work as expected */
  }

  :host([hidden]) {
    display: none !important;
  }

  :host(:not([has-label])) [part='label'] {
    display: none;
  }

  @media (forced-colors: active) {
    :host(:not([readonly])) [part='input-field'] {
      outline: 1px solid;
      outline-offset: -1px;
    }
    :host([focused]) [part='input-field'] {
      outline-width: 2px;
    }
    :host([disabled]) [part='input-field'] {
      outline-color: GrayText;
    }
  }
`;

/**
 * @license
 * Copyright (c) 2021 - 2024 Vaadin Ltd..
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */

const inputFieldContainer = i$2`
  [class$='container'] {
    display: flex;
    flex-direction: column;
    min-width: 100%;
    max-width: 100%;
    width: var(--vaadin-field-default-width, 12em);
  }
`;

/**
 * @license
 * Copyright (c) 2021 - 2024 Vaadin Ltd..
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */

const inputFieldShared = [fieldShared, inputFieldContainer, clearButton];

/**
 * @license
 * Copyright (c) 2021 - 2024 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */

/**
 * A controller to create and initialize slotted `<input>` element.
 */
class InputController extends SlotController {
  constructor(host, callback) {
    super(host, 'input', 'input', {
      initializer: (node, host) => {
        if (host.value) {
          node.value = host.value;
        }
        if (host.type) {
          node.setAttribute('type', host.type);
        }

        // Ensure every instance has unique ID
        node.id = this.defaultId;

        if (typeof callback === 'function') {
          callback(node);
        }
      },
      useUniqueId: true,
    });
  }
}

/**
 * @license
 * Copyright (c) 2021 - 2024 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */

// We consider the keyboard to be active if the window has received a keydown
// event since the last mousedown event.
let keyboardActive = false;

// Listen for top-level keydown and mousedown events.
// Use capture phase so we detect events even if they're handled.
window.addEventListener(
  'keydown',
  () => {
    keyboardActive = true;
  },
  { capture: true },
);

window.addEventListener(
  'mousedown',
  () => {
    keyboardActive = false;
  },
  { capture: true },
);

/**
 * Returns true if the window has received a keydown
 * event since the last mousedown event.
 *
 * @return {boolean}
 */
function isKeyboardActive() {
  return keyboardActive;
}

/**
 * @license
 * Copyright (c) 2021 - 2024 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */

/**
 * A mixin to handle `focused` and `focus-ring` attributes based on focus.
 *
 * @polymerMixin
 */
const FocusMixin = dedupingMixin(
  (superclass) =>
    class FocusMixinClass extends superclass {
      /**
       * @protected
       * @return {boolean}
       */
      get _keyboardActive() {
        return isKeyboardActive();
      }

      /** @protected */
      ready() {
        this.addEventListener('focusin', (e) => {
          if (this._shouldSetFocus(e)) {
            this._setFocused(true);
          }
        });

        this.addEventListener('focusout', (e) => {
          if (this._shouldRemoveFocus(e)) {
            this._setFocused(false);
          }
        });

        // In super.ready() other 'focusin' and 'focusout' listeners might be
        // added, so we call it after our own ones to ensure they execute first.
        // Issue to watch out: when incorrect, <vaadin-combo-box> refocuses the
        // input field on iOS after "Done" is pressed.
        super.ready();
      }

      /** @protected */
      disconnectedCallback() {
        super.disconnectedCallback();

        // In non-Chrome browsers, blur does not fire on the element when it is disconnected.
        // reproducible in `<vaadin-date-picker>` when closing on `Cancel` or `Today` click.
        if (this.hasAttribute('focused')) {
          this._setFocused(false);
        }
      }

      /**
       * Override to change how focused and focus-ring attributes are set.
       *
       * @param {boolean} focused
       * @protected
       */
      _setFocused(focused) {
        this.toggleAttribute('focused', focused);

        // Focus-ring is true when the element was focused from the keyboard.
        // Focus Ring [A11ycasts]: https://youtu.be/ilj2P5-5CjI
        this.toggleAttribute('focus-ring', focused && this._keyboardActive);
      }

      /**
       * Override to define if the field receives focus based on the event.
       *
       * @param {FocusEvent} _event
       * @return {boolean}
       * @protected
       */
      _shouldSetFocus(_event) {
        return true;
      }

      /**
       * Override to define if the field loses focus based on the event.
       *
       * @param {FocusEvent} _event
       * @return {boolean}
       * @protected
       */
      _shouldRemoveFocus(_event) {
        return true;
      }
    },
);

/**
 * @license
 * Copyright (c) 2021 - 2024 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */

/**
 * A mixin to provide disabled property for field components.
 *
 * @polymerMixin
 */
const DisabledMixin = dedupingMixin(
  (superclass) =>
    class DisabledMixinClass extends superclass {
      static get properties() {
        return {
          /**
           * If true, the user cannot interact with this element.
           */
          disabled: {
            type: Boolean,
            value: false,
            observer: '_disabledChanged',
            reflectToAttribute: true,
          },
        };
      }

      /**
       * @param {boolean} disabled
       * @protected
       */
      _disabledChanged(disabled) {
        this._setAriaDisabled(disabled);
      }

      /**
       * @param {boolean} disabled
       * @protected
       */
      _setAriaDisabled(disabled) {
        if (disabled) {
          this.setAttribute('aria-disabled', 'true');
        } else {
          this.removeAttribute('aria-disabled');
        }
      }

      /**
       * Overrides the default element `click` method in order to prevent
       * firing the `click` event when the element is disabled.
       * @protected
       * @override
       */
      click() {
        if (!this.disabled) {
          super.click();
        }
      }
    },
);

/**
 * @license
 * Copyright (c) 2021 - 2024 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */

/**
 * A mixin to toggle the `tabindex` attribute.
 *
 * The attribute is set to -1 whenever the user disables the element
 * and restored with the last known value once the element is enabled.
 *
 * @polymerMixin
 * @mixes DisabledMixin
 */
const TabindexMixin = (superclass) =>
  class TabindexMixinClass extends DisabledMixin(superclass) {
    static get properties() {
      return {
        /**
         * Indicates whether the element can be focused and where it participates in sequential keyboard navigation.
         *
         * @protected
         */
        tabindex: {
          type: Number,
          reflectToAttribute: true,
          observer: '_tabindexChanged',
        },

        /**
         * Stores the last known tabindex since the element has been disabled.
         *
         * @protected
         */
        _lastTabIndex: {
          type: Number,
        },
      };
    }

    /**
     * When the element gets disabled, the observer saves the last known tabindex
     * and makes the element not focusable by setting tabindex to -1.
     * As soon as the element gets enabled, the observer restores the last known tabindex
     * so that the element can be focusable again.
     *
     * @protected
     * @override
     */
    _disabledChanged(disabled, oldDisabled) {
      super._disabledChanged(disabled, oldDisabled);

      if (disabled) {
        if (this.tabindex !== undefined) {
          this._lastTabIndex = this.tabindex;
        }
        this.tabindex = -1;
      } else if (oldDisabled) {
        this.tabindex = this._lastTabIndex;
      }
    }

    /**
     * When the user has changed tabindex while the element is disabled,
     * the observer reverts tabindex to -1 and rather saves the new tabindex value to apply it later.
     * The new value will be applied as soon as the element becomes enabled.
     *
     * @protected
     */
    _tabindexChanged(tabindex) {
      if (this.disabled && tabindex !== -1) {
        this._lastTabIndex = tabindex;
        this.tabindex = -1;
      }
    }
  };

/**
 * @license
 * Copyright (c) 2021 - 2024 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */

/**
 * A mixin to forward focus to an element in the light DOM.
 *
 * @polymerMixin
 * @mixes FocusMixin
 * @mixes TabindexMixin
 */
const DelegateFocusMixin = dedupingMixin(
  (superclass) =>
    class DelegateFocusMixinClass extends FocusMixin(TabindexMixin(superclass)) {
      static get properties() {
        return {
          /**
           * Specify that this control should have input focus when the page loads.
           */
          autofocus: {
            type: Boolean,
          },

          /**
           * A reference to the focusable element controlled by the mixin.
           * It can be an input, textarea, button or any element with tabindex > -1.
           *
           * Any component implementing this mixin is expected to provide it
           * by using `this._setFocusElement(input)` Polymer API.
           *
           * Toggling `tabindex` attribute on the host element propagates its value to `focusElement`.
           *
           * @protected
           * @type {!HTMLElement}
           */
          focusElement: {
            type: Object,
            readOnly: true,
            observer: '_focusElementChanged',
          },

          /**
           * Override the property from `TabIndexMixin`
           * to ensure the `tabindex` attribute of the focus element
           * will be restored to `0` after re-enabling the element.
           *
           * @protected
           * @override
           */
          _lastTabIndex: {
            value: 0,
          },
        };
      }

      constructor() {
        super();

        this._boundOnBlur = this._onBlur.bind(this);
        this._boundOnFocus = this._onFocus.bind(this);
      }

      /** @protected */
      ready() {
        super.ready();

        if (this.autofocus && !this.disabled) {
          requestAnimationFrame(() => {
            this.focus();
            this.setAttribute('focus-ring', '');
          });
        }
      }

      /**
       * @protected
       * @override
       */
      focus() {
        if (this.focusElement && !this.disabled) {
          this.focusElement.focus();
        }
      }

      /**
       * @protected
       * @override
       */
      blur() {
        if (this.focusElement) {
          this.focusElement.blur();
        }
      }

      /**
       * @protected
       * @override
       */
      click() {
        if (this.focusElement && !this.disabled) {
          this.focusElement.click();
        }
      }

      /** @protected */
      _focusElementChanged(element, oldElement) {
        if (element) {
          element.disabled = this.disabled;
          this._addFocusListeners(element);
          this.__forwardTabIndex(this.tabindex);
        } else if (oldElement) {
          this._removeFocusListeners(oldElement);
        }
      }

      /**
       * @param {HTMLElement} element
       * @protected
       */
      _addFocusListeners(element) {
        element.addEventListener('blur', this._boundOnBlur);
        element.addEventListener('focus', this._boundOnFocus);
      }

      /**
       * @param {HTMLElement} element
       * @protected
       */
      _removeFocusListeners(element) {
        element.removeEventListener('blur', this._boundOnBlur);
        element.removeEventListener('focus', this._boundOnFocus);
      }

      /**
       * Focus event does not bubble, so we dispatch it manually
       * on the host element to support adding focus listeners
       * when the focusable element is placed in light DOM.
       * @param {FocusEvent} event
       * @protected
       */
      _onFocus(event) {
        event.stopPropagation();
        this.dispatchEvent(new Event('focus'));
      }

      /**
       * Blur event does not bubble, so we dispatch it manually
       * on the host element to support adding blur listeners
       * when the focusable element is placed in light DOM.
       * @param {FocusEvent} event
       * @protected
       */
      _onBlur(event) {
        event.stopPropagation();
        this.dispatchEvent(new Event('blur'));
      }

      /**
       * @param {FocusEvent} event
       * @return {boolean}
       * @protected
       * @override
       */
      _shouldSetFocus(event) {
        return event.target === this.focusElement;
      }

      /**
       * @param {FocusEvent} event
       * @return {boolean}
       * @protected
       * @override
       */
      _shouldRemoveFocus(event) {
        return event.target === this.focusElement;
      }

      /**
       * @param {boolean} disabled
       * @param {boolean} oldDisabled
       * @protected
       * @override
       */
      _disabledChanged(disabled, oldDisabled) {
        super._disabledChanged(disabled, oldDisabled);

        if (this.focusElement) {
          this.focusElement.disabled = disabled;
        }

        if (disabled) {
          this.blur();
        }
      }

      /**
       * Override an observer from `TabindexMixin`.
       * Do not call super to remove tabindex attribute
       * from the host after it has been forwarded.
       * @param {string} tabindex
       * @protected
       * @override
       */
      _tabindexChanged(tabindex) {
        this.__forwardTabIndex(tabindex);
      }

      /** @private */
      __forwardTabIndex(tabindex) {
        if (tabindex !== undefined && this.focusElement) {
          this.focusElement.tabIndex = tabindex;

          // Preserve tabindex="-1" on the host element
          if (tabindex !== -1) {
            this.tabindex = undefined;
          }
        }

        if (this.disabled && tabindex) {
          // If tabindex attribute was changed while component was disabled
          if (tabindex !== -1) {
            this._lastTabIndex = tabindex;
          }
          this.tabindex = undefined;
        }
      }
    },
);

/**
 * @license
 * Copyright (c) 2021 - 2024 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */

/**
 * A mixin that manages keyboard handling.
 * The mixin subscribes to the keyboard events while an actual implementation
 * for the event handlers is left to the client (a component or another mixin).
 *
 * @polymerMixin
 */
const KeyboardMixin = dedupingMixin(
  (superclass) =>
    class KeyboardMixinClass extends superclass {
      /** @protected */
      ready() {
        super.ready();

        this.addEventListener('keydown', (event) => {
          this._onKeyDown(event);
        });

        this.addEventListener('keyup', (event) => {
          this._onKeyUp(event);
        });
      }

      /**
       * A handler for the `keydown` event. By default, it calls
       * separate methods for handling "Enter" and "Escape" keys.
       * Override the method to implement your own behavior.
       *
       * @param {KeyboardEvent} event
       * @protected
       */
      _onKeyDown(event) {
        switch (event.key) {
          case 'Enter':
            this._onEnter(event);
            break;
          case 'Escape':
            this._onEscape(event);
            break;
        }
      }

      /**
       * A handler for the `keyup` event. By default, it does nothing.
       * Override the method to implement your own behavior.
       *
       * @param {KeyboardEvent} _event
       * @protected
       */
      _onKeyUp(_event) {
        // To be implemented.
      }

      /**
       * A handler for the "Enter" key. By default, it does nothing.
       * Override the method to implement your own behavior.
       *
       * @param {KeyboardEvent} _event
       * @protected
       */
      _onEnter(_event) {
        // To be implemented.
      }

      /**
       * A handler for the "Escape" key. By default, it does nothing.
       * Override the method to implement your own behavior.
       *
       * @param {KeyboardEvent} _event
       * @protected
       */
      _onEscape(_event) {
        // To be implemented.
      }
    },
);

/**
 * @license
 * Copyright (c) 2021 - 2024 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */

const stylesMap = new WeakMap();

/**
 * Get all the styles inserted into root.
 * @param {DocumentOrShadowRoot} root
 * @return {Set<string>}
 */
function getRootStyles(root) {
  if (!stylesMap.has(root)) {
    stylesMap.set(root, new Set());
  }

  return stylesMap.get(root);
}

/**
 * Insert styles into the root.
 * @param {string} styles
 * @param {DocumentOrShadowRoot} root
 */
function insertStyles(styles, root) {
  const style = document.createElement('style');
  style.textContent = styles;

  if (root === document) {
    document.head.appendChild(style);
  } else {
    root.insertBefore(style, root.firstChild);
  }
}

/**
 * Mixin to insert styles into the outer scope to handle slotted components.
 * This is useful e.g. to hide native `<input type="number">` controls.
 *
 * @polymerMixin
 */
const SlotStylesMixin = dedupingMixin(
  (superclass) =>
    class SlotStylesMixinClass extends superclass {
      /**
       * List of styles to insert into root.
       * @protected
       */
      get slotStyles() {
        return {};
      }

      /** @protected */
      connectedCallback() {
        super.connectedCallback();

        this.__applySlotStyles();
      }

      /** @private */
      __applySlotStyles() {
        const root = this.getRootNode();
        const rootStyles = getRootStyles(root);

        this.slotStyles.forEach((styles) => {
          if (!rootStyles.has(styles)) {
            insertStyles(styles, root);
            rootStyles.add(styles);
          }
        });
      }
    },
);

/**
 * @license
 * Copyright (c) 2021 - 2024 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */

const testUserAgent = (regexp) => regexp.test(navigator.userAgent);

const testPlatform = (regexp) => regexp.test(navigator.platform);

const testVendor = (regexp) => regexp.test(navigator.vendor);

testUserAgent(/Android/u);

testUserAgent(/Chrome/u) && testVendor(/Google Inc/u);

testUserAgent(/Firefox/u);

// IPadOS 13 lies and says it's a Mac, but we can distinguish by detecting touch support.
testPlatform(/^iPad/u) || (testPlatform(/^Mac/u) && navigator.maxTouchPoints > 1);

testPlatform(/^iPhone/u);

testUserAgent(/^((?!chrome|android).)*safari/iu);

const isTouch = (() => {
  try {
    document.createEvent('TouchEvent');
    return true;
  } catch (e) {
    return false;
  }
})();

/**
 * @license
 * Copyright (c) 2021 - 2024 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */

/**
 * A mixin to store the reference to an input element
 * and add input and change event listeners to it.
 *
 * @polymerMixin
 */
const InputMixin = dedupingMixin(
  (superclass) =>
    class InputMixinClass extends superclass {
      static get properties() {
        return {
          /**
           * A reference to the input element controlled by the mixin.
           * Any component implementing this mixin is expected to provide it
           * by using `this._setInputElement(input)` Polymer API.
           *
           * A typical case is using `InputController` that does this automatically.
           * However, the input element does not have to always be native <input>:
           * as an example, <vaadin-combo-box-light> accepts other components.
           *
           * @protected
           * @type {!HTMLElement}
           */
          inputElement: {
            type: Object,
            readOnly: true,
            observer: '_inputElementChanged',
          },

          /**
           * String used to define input type.
           * @protected
           */
          type: {
            type: String,
            readOnly: true,
          },

          /**
           * The value of the field.
           */
          value: {
            type: String,
            value: '',
            observer: '_valueChanged',
            notify: true,
            sync: true,
          },

          /**
           * Whether the input element has a non-empty value.
           *
           * @protected
           */
          _hasInputValue: {
            type: Boolean,
            value: false,
            observer: '_hasInputValueChanged',
          },
        };
      }

      constructor() {
        super();

        this._boundOnInput = this.__onInput.bind(this);
        this._boundOnChange = this._onChange.bind(this);
      }

      /**
       * Indicates whether the value is different from the default one.
       * Override if the `value` property has a type other than `string`.
       *
       * @protected
       */
      get _hasValue() {
        return this.value != null && this.value !== '';
      }

      /**
       * A property for accessing the input element's value.
       *
       * Override this getter if the property is different from the default `value` one.
       *
       * @protected
       * @return {string}
       */
      get _inputElementValueProperty() {
        return 'value';
      }

      /**
       * The input element's value.
       *
       * @protected
       * @return {string}
       */
      get _inputElementValue() {
        return this.inputElement ? this.inputElement[this._inputElementValueProperty] : undefined;
      }

      /**
       * The input element's value.
       *
       * @protected
       */
      set _inputElementValue(value) {
        if (this.inputElement) {
          this.inputElement[this._inputElementValueProperty] = value;
        }
      }

      /**
       * Clear the value of the field.
       */
      clear() {
        this._hasInputValue = false;

        this.value = '';

        // Clear the input immediately without waiting for the observer.
        // Otherwise, when using Lit, the old value would be restored.
        this._inputElementValue = '';
      }

      /**
       * Add event listeners to the input element instance.
       * Override this method to add custom listeners.
       * @param {!HTMLElement} input
       * @protected
       */
      _addInputListeners(input) {
        input.addEventListener('input', this._boundOnInput);
        input.addEventListener('change', this._boundOnChange);
      }

      /**
       * Remove event listeners from the input element instance.
       * @param {!HTMLElement} input
       * @protected
       */
      _removeInputListeners(input) {
        input.removeEventListener('input', this._boundOnInput);
        input.removeEventListener('change', this._boundOnChange);
      }

      /**
       * A method to forward the value property set on the field
       * programmatically back to the input element value.
       * Override this method to perform additional checks,
       * for example to skip this in certain conditions.
       * @param {string} value
       * @protected
       */
      _forwardInputValue(value) {
        // Value might be set before an input element is initialized.
        // This case should be handled separately by a component that
        // implements this mixin, for example in `connectedCallback`.
        if (!this.inputElement) {
          return;
        }

        this._inputElementValue = value != null ? value : '';
      }

      /**
       * @param {HTMLElement | undefined} input
       * @param {HTMLElement | undefined} oldInput
       * @protected
       */
      _inputElementChanged(input, oldInput) {
        if (input) {
          this._addInputListeners(input);
        } else if (oldInput) {
          this._removeInputListeners(oldInput);
        }
      }

      /**
       * Observer to notify about the change of private property.
       *
       * @private
       */
      _hasInputValueChanged(hasValue, oldHasValue) {
        if (hasValue || oldHasValue) {
          this.dispatchEvent(new CustomEvent('has-input-value-changed'));
        }
      }

      /**
       * An input event listener used to update `_hasInputValue` property.
       * Do not override this method.
       *
       * @param {Event} event
       * @private
       */
      __onInput(event) {
        this._setHasInputValue(event);
        this._onInput(event);
      }

      /**
       * An input event listener used to update the field value.
       *
       * @param {Event} event
       * @protected
       */
      _onInput(event) {
        // In the case a custom web component is passed as `inputElement`,
        // the actual native input element, on which the event occurred,
        // can be inside shadow trees.
        const target = event.composedPath()[0];
        // Ignore fake input events e.g. used by clear button.
        this.__userInput = event.isTrusted;
        this.value = target.value;
        this.__userInput = false;
      }

      /**
       * A change event listener.
       * Override this method with an actual implementation.
       * @param {Event} _event
       * @protected
       */
      _onChange(_event) {}

      /**
       * Toggle the has-value attribute based on the value property.
       *
       * @param {boolean} hasValue
       * @protected
       */
      _toggleHasValue(hasValue) {
        this.toggleAttribute('has-value', hasValue);
      }

      /**
       * Observer called when a value property changes.
       * @param {string | undefined} newVal
       * @param {string | undefined} oldVal
       * @protected
       */
      _valueChanged(newVal, oldVal) {
        this._toggleHasValue(this._hasValue);

        // Setting initial value to empty string, do nothing.
        if (newVal === '' && oldVal === undefined) {
          return;
        }

        // Value is set by the user, no need to sync it back to input.
        if (this.__userInput) {
          return;
        }

        // Setting a value programmatically, sync it to input element.
        this._forwardInputValue(newVal);
      }

      /**
       * Sets the `_hasInputValue` property based on the `input` event.
       *
       * @param {InputEvent} event
       * @protected
       */
      _setHasInputValue(event) {
        // In the case a custom web component is passed as `inputElement`,
        // the actual native input element, on which the event occurred,
        // can be inside shadow trees.
        const target = event.composedPath()[0];
        this._hasInputValue = target.value.length > 0;
      }
    },
);

/**
 * @license
 * Copyright (c) 2021 - 2024 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */

/**
 * A mixin that manages the clear button.
 *
 * @polymerMixin
 * @mixes InputMixin
 * @mixes KeyboardMixin
 */
const ClearButtonMixin = (superclass) =>
  class ClearButtonMixinClass extends InputMixin(KeyboardMixin(superclass)) {
    static get properties() {
      return {
        /**
         * Set to true to display the clear icon which clears the input.
         *
         * It is up to the component to choose where to place the clear icon:
         * in the Shadow DOM or in the light DOM. In any way, a reference to
         * the clear icon element should be provided via the `clearElement` getter.
         *
         * @attr {boolean} clear-button-visible
         */
        clearButtonVisible: {
          type: Boolean,
          reflectToAttribute: true,
          value: false,
        },
      };
    }

    /**
     * Any element extending this mixin is required to implement this getter.
     * It returns the reference to the clear button element.
     *
     * @protected
     * @return {Element | null | undefined}
     */
    get clearElement() {
      console.warn(`Please implement the 'clearElement' property in <${this.localName}>`);
      return null;
    }

    /** @protected */
    ready() {
      super.ready();

      if (this.clearElement) {
        this.clearElement.addEventListener('mousedown', (event) => this._onClearButtonMouseDown(event));
        this.clearElement.addEventListener('click', (event) => this._onClearButtonClick(event));
      }
    }

    /**
     * @param {Event} event
     * @protected
     */
    _onClearButtonClick(event) {
      event.preventDefault();
      this._onClearAction();
    }

    /**
     * @param {MouseEvent} event
     * @protected
     */
    _onClearButtonMouseDown(event) {
      event.preventDefault();
      if (!isTouch) {
        this.inputElement.focus();
      }
    }

    /**
     * Override an event listener inherited from `KeydownMixin` to clear on Esc.
     * Components that extend this mixin can prevent this behavior by overriding
     * this method without calling `super._onEscape` to provide custom logic.
     *
     * @param {KeyboardEvent} event
     * @protected
     * @override
     */
    _onEscape(event) {
      super._onEscape(event);

      if (this.clearButtonVisible && !!this.value) {
        event.stopPropagation();
        this._onClearAction();
      }
    }

    /**
     * Clears the value and dispatches `input` and `change` events
     * on the input element. This method should be called
     * when the clear action originates from the user.
     *
     * @protected
     */
    _onClearAction() {
      this._inputElementValue = '';
      // Note, according to the HTML spec, the native change event isn't composed
      // while the input event is composed.
      this.inputElement.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      this.inputElement.dispatchEvent(new Event('change', { bubbles: true }));
    }
  };

/**
 * @license
 * Copyright (c) 2023 - 2024 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */

const attributeToTargets = new Map();

/**
 * Gets or creates a Set with the stored values for each element controlled by this helper
 *
 * @param {string} attr the attribute name used as key in the map
 *
 * @returns {WeakMap<HTMLElement, Set<string>} a weak map with the stored values for the elements being controlled by the helper
 */
function getAttrMap(attr) {
  if (!attributeToTargets.has(attr)) {
    attributeToTargets.set(attr, new WeakMap());
  }
  return attributeToTargets.get(attr);
}

/**
 * Cleans the values set on the attribute to the given element.
 * It also stores the current values in the map, if `storeValue` is `true`.
 *
 * @param {HTMLElement} target
 * @param {string} attr the attribute to be cleared
 * @param {boolean} storeValue whether or not the current value of the attribute should be stored on the map
 * @returns
 */
function cleanAriaIDReference(target, attr) {
  if (!target) {
    return;
  }

  target.removeAttribute(attr);
}

/**
 * Storing values of the accessible attributes in a Set inside of the WeakMap.
 *
 * @param {HTMLElement} target
 * @param {string} attr the attribute to be stored
 */
function storeAriaIDReference(target, attr) {
  if (!target || !attr) {
    return;
  }
  const attributeMap = getAttrMap(attr);
  if (attributeMap.has(target)) {
    return;
  }
  const values = deserializeAttributeValue(target.getAttribute(attr));
  attributeMap.set(target, new Set(values));
}

/**
 * Restores the generated values of the attribute to the given element.
 *
 * @param {HTMLElement} target
 * @param {string} attr
 */
function restoreGeneratedAriaIDReference(target, attr) {
  if (!target || !attr) {
    return;
  }
  const attributeMap = getAttrMap(attr);
  const values = attributeMap.get(target);
  if (!values || values.size === 0) {
    target.removeAttribute(attr);
  } else {
    addValueToAttribute(target, attr, serializeAttributeValue(values));
  }
  attributeMap.delete(target);
}

/**
 * Sets a new ID reference for a target element and an ARIA attribute.
 *
 * @typedef {Object} AriaIdReferenceConfig
 * @property {string | null | undefined} newId
 * @property {string | null | undefined} oldId
 * @property {boolean | null | undefined} fromUser
 * @param {HTMLElement} target
 * @param {string} attr
 * @param {AriaIdReferenceConfig | null | undefined} config
 * @param config.newId The new ARIA ID reference to set. If `null`, the attribute is removed,
 * and `config.fromUser` is true, any stored values are restored. If there are stored values
 * and `config.fromUser` is `false`, then `config.newId` is added to the stored values set.
 * @param config.oldId The ARIA ID reference to be removed from the attribute. If there are
 * stored values and `config.fromUser` is `false`, then `config.oldId` is removed from the
 * stored values set.
 * @param config.fromUser Indicates whether the function is called by the user or internally.
 * When `config.fromUser` is called with `true` for the first time, the function will clear
 * and store the attribute value for the given element.
 */
function setAriaIDReference(target, attr, config = { newId: null, oldId: null, fromUser: false }) {
  if (!target || !attr) {
    return;
  }

  const { newId, oldId, fromUser } = config;

  const attributeMap = getAttrMap(attr);
  const storedValues = attributeMap.get(target);

  if (!fromUser && !!storedValues) {
    // If there's any stored values, it means the attribute is being handled by the user
    // Replace the "oldId" with "newId" on the stored values set and leave
    oldId && storedValues.delete(oldId);
    newId && storedValues.add(newId);
    return;
  }

  if (fromUser) {
    if (!storedValues) {
      // If it's called from user and there's no stored values for the attribute,
      // then store the current value
      storeAriaIDReference(target, attr);
    } else if (!newId) {
      // If called from user with newId == null, it means the attribute will no longer
      // be in control of the user and the stored values should be restored
      // Removing the entry on the map for this target
      attributeMap.delete(target);
    }

    // If it's from user, then clear the attribute value before setting newId
    cleanAriaIDReference(target, attr);
  }

  removeValueFromAttribute(target, attr, oldId);

  const attributeValue = !newId ? serializeAttributeValue(storedValues) : newId;
  if (attributeValue) {
    addValueToAttribute(target, attr, attributeValue);
  }
}

/**
 * Removes the {@link attr | attribute} value of the given {@link target} element.
 * It also stores the current value, if no stored values are present.
 *
 * @param {HTMLElement} target
 * @param {string} attr
 */
function removeAriaIDReference(target, attr) {
  storeAriaIDReference(target, attr);
  cleanAriaIDReference(target, attr);
}

/**
 * @license
 * Copyright (c) 2021 - 2024 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */

/**
 * A controller for managing ARIA attributes for a field element:
 * either the component itself or slotted `<input>` element.
 */
class FieldAriaController {
  constructor(host) {
    this.host = host;
    this.__required = false;
  }

  /**
   * Sets a target element to which ARIA attributes are added.
   *
   * @param {HTMLElement} target
   */
  setTarget(target) {
    this.__target = target;
    this.__setAriaRequiredAttribute(this.__required);
    // We need to make sure that value in __labelId is stored
    this.__setLabelIdToAriaAttribute(this.__labelId, this.__labelId);
    if (this.__labelIdFromUser != null) {
      this.__setLabelIdToAriaAttribute(this.__labelIdFromUser, this.__labelIdFromUser, true);
    }
    this.__setErrorIdToAriaAttribute(this.__errorId);
    this.__setHelperIdToAriaAttribute(this.__helperId);
    this.setAriaLabel(this.__label);
  }

  /**
   * Toggles the `aria-required` attribute on the target element
   * if the target is the host component (e.g. a field group).
   * Otherwise, it does nothing.
   *
   * @param {boolean} required
   */
  setRequired(required) {
    this.__setAriaRequiredAttribute(required);
    this.__required = required;
  }

  /**
   * Defines the `aria-label` attribute of the target element.
   *
   * To remove the attribute, pass `null` as `label`.
   *
   * @param {string | null | undefined} label
   */
  setAriaLabel(label) {
    this.__setAriaLabelToAttribute(label);
    this.__label = label;
  }

  /**
   * Links the target element with a slotted label element
   * via the target's attribute `aria-labelledby`.
   *
   * To unlink the previous slotted label element, pass `null` as `labelId`.
   *
   * @param {string | null} labelId
   */
  setLabelId(labelId, fromUser = false) {
    const oldLabelId = fromUser ? this.__labelIdFromUser : this.__labelId;
    this.__setLabelIdToAriaAttribute(labelId, oldLabelId, fromUser);
    if (fromUser) {
      this.__labelIdFromUser = labelId;
    } else {
      this.__labelId = labelId;
    }
  }

  /**
   * Links the target element with a slotted error element via the target's attribute:
   * - `aria-labelledby` if the target is the host component (e.g a field group).
   * - `aria-describedby` otherwise.
   *
   * To unlink the previous slotted error element, pass `null` as `errorId`.
   *
   * @param {string | null} errorId
   */
  setErrorId(errorId) {
    this.__setErrorIdToAriaAttribute(errorId, this.__errorId);
    this.__errorId = errorId;
  }

  /**
   * Links the target element with a slotted helper element via the target's attribute:
   * - `aria-labelledby` if the target is the host component (e.g a field group).
   * - `aria-describedby` otherwise.
   *
   * To unlink the previous slotted helper element, pass `null` as `helperId`.
   *
   * @param {string | null} helperId
   */
  setHelperId(helperId) {
    this.__setHelperIdToAriaAttribute(helperId, this.__helperId);
    this.__helperId = helperId;
  }

  /**
   * @param {string | null | undefined} label
   * @private
   * */
  __setAriaLabelToAttribute(label) {
    if (!this.__target) {
      return;
    }
    if (label) {
      removeAriaIDReference(this.__target, 'aria-labelledby');
      this.__target.setAttribute('aria-label', label);
    } else if (this.__label) {
      restoreGeneratedAriaIDReference(this.__target, 'aria-labelledby');
      this.__target.removeAttribute('aria-label');
    }
  }

  /**
   * @param {string | null | undefined} labelId
   * @param {string | null | undefined} oldLabelId
   * @param {boolean | null | undefined} fromUser
   * @private
   */
  __setLabelIdToAriaAttribute(labelId, oldLabelId, fromUser) {
    setAriaIDReference(this.__target, 'aria-labelledby', { newId: labelId, oldId: oldLabelId, fromUser });
  }

  /**
   * @param {string | null | undefined} errorId
   * @param {string | null | undefined} oldErrorId
   * @private
   */
  __setErrorIdToAriaAttribute(errorId, oldErrorId) {
    setAriaIDReference(this.__target, 'aria-describedby', { newId: errorId, oldId: oldErrorId, fromUser: false });
  }

  /**
   * @param {string | null | undefined} helperId
   * @param {string | null | undefined} oldHelperId
   * @private
   */
  __setHelperIdToAriaAttribute(helperId, oldHelperId) {
    setAriaIDReference(this.__target, 'aria-describedby', { newId: helperId, oldId: oldHelperId, fromUser: false });
  }

  /**
   * @param {boolean} required
   * @private
   */
  __setAriaRequiredAttribute(required) {
    if (!this.__target) {
      return;
    }

    if (['input', 'textarea'].includes(this.__target.localName)) {
      // Native <input> or <textarea>, required is enough
      return;
    }

    if (required) {
      this.__target.setAttribute('aria-required', 'true');
    } else {
      this.__target.removeAttribute('aria-required');
    }
  }
}

/**
 * @license
 * Copyright (c) 2021 - 2024 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */

/**
 * @typedef ReactiveController
 * @type {import('lit').ReactiveController}
 */

/**
 * A mixin for connecting controllers to the element.
 *
 * @polymerMixin
 */
const ControllerMixin = dedupingMixin((superClass) => {
  // If the superclass extends from LitElement,
  // use its own controllers implementation.
  if (typeof superClass.prototype.addController === 'function') {
    return superClass;
  }

  return class ControllerMixinClass extends superClass {
    constructor() {
      super();

      /**
       * @type {Set<ReactiveController>}
       */
      this.__controllers = new Set();
    }

    /** @protected */
    connectedCallback() {
      super.connectedCallback();

      this.__controllers.forEach((c) => {
        if (c.hostConnected) {
          c.hostConnected();
        }
      });
    }

    /** @protected */
    disconnectedCallback() {
      super.disconnectedCallback();

      this.__controllers.forEach((c) => {
        if (c.hostDisconnected) {
          c.hostDisconnected();
        }
      });
    }

    /**
     * Registers a controller to participate in the element update cycle.
     *
     * @param {ReactiveController} controller
     * @protected
     */
    addController(controller) {
      this.__controllers.add(controller);
      // Call hostConnected if a controller is added after the element is attached.
      if (this.$ !== undefined && this.isConnected && controller.hostConnected) {
        controller.hostConnected();
      }
    }

    /**
     * Removes a controller from the element.
     *
     * @param {ReactiveController} controller
     * @protected
     */
    removeController(controller) {
      this.__controllers.delete(controller);
    }
  };
});

/**
 * @license
 * Copyright (c) 2022 - 2024 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */

/**
 * A controller that observes slotted element mutations, especially ID attribute
 * and the text content, and fires an event to notify host element about those.
 */
class SlotChildObserveController extends SlotController {
  constructor(host, slot, tagName, config = {}) {
    super(host, slot, tagName, { ...config, useUniqueId: true });
  }

  /**
   * Override to initialize the newly added custom node.
   *
   * @param {Node} node
   * @protected
   * @override
   */
  initCustomNode(node) {
    this.__updateNodeId(node);
    this.__notifyChange(node);
  }

  /**
   * Override to notify the controller host about removal of
   * the custom node, and to apply the default one if needed.
   *
   * @param {Node} _node
   * @protected
   * @override
   */
  teardownNode(_node) {
    const node = this.getSlotChild();

    // Custom node is added to the slot
    if (node && node !== this.defaultNode) {
      this.__notifyChange(node);
    } else {
      this.restoreDefaultNode();
      this.updateDefaultNode(this.node);
    }
  }

  /**
   * Override method inherited from `SlotMixin`
   * to set ID attribute on the default node.
   *
   * @return {Node}
   * @protected
   * @override
   */
  attachDefaultNode() {
    const node = super.attachDefaultNode();

    if (node) {
      this.__updateNodeId(node);
    }

    return node;
  }

  /**
   * Override to restore default node when a custom one is removed.
   *
   * @protected
   */
  restoreDefaultNode() {
    // To be implemented
  }

  /**
   * Override to update default node text on property change.
   *
   * @param {Node} node
   * @protected
   */
  updateDefaultNode(node) {
    this.__notifyChange(node);
  }

  /**
   * Setup the mutation observer on the node to update ID and notify host.
   * Node doesn't get observed automatically until this method is called.
   *
   * @param {Node} node
   * @protected
   */
  observeNode(node) {
    // Stop observing the previous node, if any.
    if (this.__nodeObserver) {
      this.__nodeObserver.disconnect();
    }

    this.__nodeObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        const target = mutation.target;

        // Ensure the mutation target is the currently connected node
        // to ignore async mutations dispatched for removed element.
        const isCurrentNodeMutation = target === this.node;

        if (mutation.type === 'attributes') {
          // We use attributeFilter to only observe ID mutation,
          // no need to check for attribute name separately.
          if (isCurrentNodeMutation) {
            this.__updateNodeId(target);
          }
        } else if (isCurrentNodeMutation || target.parentElement === this.node) {
          // Node text content has changed.
          this.__notifyChange(this.node);
        }
      });
    });

    // Observe changes to node ID attribute, text content and children.
    this.__nodeObserver.observe(node, {
      attributes: true,
      attributeFilter: ['id'],
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  /**
   * Returns true if a node is an HTML element with children,
   * or is a defined custom element, or has non-empty text.
   *
   * @param {Node} node
   * @return {boolean}
   * @private
   */
  __hasContent(node) {
    if (!node) {
      return false;
    }

    return (
      (node.nodeType === Node.ELEMENT_NODE && (customElements.get(node.localName) || node.children.length > 0)) ||
      (node.textContent && node.textContent.trim() !== '')
    );
  }

  /**
   * Fire an event to notify the controller host about node changes.
   *
   * @param {Node} node
   * @private
   */
  __notifyChange(node) {
    this.dispatchEvent(
      new CustomEvent('slot-content-changed', {
        detail: { hasContent: this.__hasContent(node), node },
      }),
    );
  }

  /**
   * Set default ID on the node in case it is an HTML element.
   *
   * @param {Node} node
   * @private
   */
  __updateNodeId(node) {
    // When in multiple mode, only set ID attribute on the element in default slot.
    const isFirstNode = !this.nodes || node === this.nodes[0];
    if (node.nodeType === Node.ELEMENT_NODE && (!this.multiple || isFirstNode) && !node.id) {
      node.id = this.defaultId;
    }
  }
}

/**
 * @license
 * Copyright (c) 2021 - 2024 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */

/**
 * A controller that manages the error message node content.
 */
class ErrorController extends SlotChildObserveController {
  constructor(host) {
    super(host, 'error-message', 'div');
  }

  /**
   * Set the error message element text content.
   *
   * @param {string} errorMessage
   */
  setErrorMessage(errorMessage) {
    this.errorMessage = errorMessage;

    this.updateDefaultNode(this.node);
  }

  /**
   * Set invalid state for detecting whether to show error message.
   *
   * @param {boolean} invalid
   */
  setInvalid(invalid) {
    this.invalid = invalid;

    this.updateDefaultNode(this.node);
  }

  /**
   * Override method inherited from `SlotController` to not run
   * initializer on the custom slotted node unnecessarily.
   *
   * @param {Node} node
   * @protected
   * @override
   */
  initAddedNode(node) {
    if (node !== this.defaultNode) {
      // There is no need to run `initNode`.
      this.initCustomNode(node);
    }
  }

  /**
   * Override to initialize the newly added default error message.
   *
   * @param {Node} errorNode
   * @protected
   * @override
   */
  initNode(errorNode) {
    this.updateDefaultNode(errorNode);
  }

  /**
   * Override to initialize the newly added custom error message.
   *
   * @param {Node} errorNode
   * @protected
   * @override
   */
  initCustomNode(errorNode) {
    // Save the custom error message content on the host.
    if (errorNode.textContent && !this.errorMessage) {
      this.errorMessage = errorNode.textContent.trim();
    }

    // Notify the host about custom node.
    super.initCustomNode(errorNode);
  }

  /**
   * Override method inherited from `SlotChildObserveController`
   * to restore the default error message element.
   *
   * @protected
   * @override
   */
  restoreDefaultNode() {
    this.attachDefaultNode();
  }

  /**
   * Override method inherited from `SlotChildObserveController`
   * to update the error message text and hidden state.
   *
   * Note: unlike with other controllers, this method is
   * called for both default and custom error message.
   *
   * @param {Node | undefined} node
   * @protected
   * @override
   */
  updateDefaultNode(errorNode) {
    const { errorMessage, invalid } = this;
    const hasError = Boolean(invalid && errorMessage && errorMessage.trim() !== '');

    if (errorNode) {
      errorNode.textContent = hasError ? errorMessage : '';
      errorNode.hidden = !hasError;

      // Role alert will make the error message announce immediately
      // as the field becomes invalid
      if (hasError) {
        errorNode.setAttribute('role', 'alert');
      } else {
        errorNode.removeAttribute('role');
      }
    }

    // Notify the host after update.
    super.updateDefaultNode(errorNode);
  }
}

/**
 * @license
 * Copyright (c) 2021 - 2024 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */

/**
 * A controller that manages the helper node content.
 */
class HelperController extends SlotChildObserveController {
  constructor(host) {
    // Do not provide tag name, as we create helper lazily.
    super(host, 'helper', null);
  }

  /**
   * Set helper text based on corresponding host property.
   *
   * @param {string} helperText
   */
  setHelperText(helperText) {
    this.helperText = helperText;

    // Restore the default helper, if needed.
    const helperNode = this.getSlotChild();
    if (!helperNode) {
      this.restoreDefaultNode();
    }

    // When default helper is used, update it.
    if (this.node === this.defaultNode) {
      this.updateDefaultNode(this.node);
    }
  }

  /**
   * Override method inherited from `SlotChildObserveController`
   * to create the default helper element lazily as needed.
   *
   * @param {Node | undefined} node
   * @protected
   * @override
   */
  restoreDefaultNode() {
    const { helperText } = this;

    // No helper yet, create one.
    if (helperText && helperText.trim() !== '') {
      this.tagName = 'div';

      const helperNode = this.attachDefaultNode();

      // Observe the default node.
      this.observeNode(helperNode);
    }
  }

  /**
   * Override method inherited from `SlotChildObserveController`
   * to update the default helper element text content.
   *
   * @param {Node | undefined} node
   * @protected
   * @override
   */
  updateDefaultNode(node) {
    if (node) {
      node.textContent = this.helperText;
    }

    // Notify the host after update.
    super.updateDefaultNode(node);
  }

  /**
   * Override to observe the newly added custom node.
   *
   * @param {Node} node
   * @protected
   * @override
   */
  initCustomNode(node) {
    // Notify the host about a custom slotted helper.
    super.initCustomNode(node);

    this.observeNode(node);
  }
}

/**
 * @license
 * Copyright (c) 2021 - 2024 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */

/**
 * A controller to manage the label element.
 */
class LabelController extends SlotChildObserveController {
  constructor(host) {
    super(host, 'label', 'label');
  }

  /**
   * Set label based on corresponding host property.
   *
   * @param {string} label
   */
  setLabel(label) {
    this.label = label;

    // Restore the default label, if needed.
    const labelNode = this.getSlotChild();
    if (!labelNode) {
      this.restoreDefaultNode();
    }

    // When default label is used, update it.
    if (this.node === this.defaultNode) {
      this.updateDefaultNode(this.node);
    }
  }

  /**
   * Override method inherited from `SlotChildObserveController`
   * to restore and observe the default label element.
   *
   * @protected
   * @override
   */
  restoreDefaultNode() {
    const { label } = this;

    // Restore the default label.
    if (label && label.trim() !== '') {
      const labelNode = this.attachDefaultNode();

      // Observe the default label.
      this.observeNode(labelNode);
    }
  }

  /**
   * Override method inherited from `SlotChildObserveController`
   * to update the default label element text content.
   *
   * @param {Node | undefined} node
   * @protected
   * @override
   */
  updateDefaultNode(node) {
    if (node) {
      node.textContent = this.label;
    }

    // Notify the host after update.
    super.updateDefaultNode(node);
  }

  /**
   * Override to observe the newly added custom node.
   *
   * @param {Node} node
   * @protected
   * @override
   */
  initCustomNode(node) {
    // Notify the host about adding a custom node.
    super.initCustomNode(node);

    this.observeNode(node);
  }
}

/**
 * @license
 * Copyright (c) 2021 - 2024 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */

/**
 * A mixin to provide label via corresponding property or named slot.
 *
 * @polymerMixin
 * @mixes ControllerMixin
 */
const LabelMixin = dedupingMixin(
  (superclass) =>
    class LabelMixinClass extends ControllerMixin(superclass) {
      static get properties() {
        return {
          /**
           * The label text for the input node.
           * When no light dom defined via [slot=label], this value will be used.
           */
          label: {
            type: String,
            observer: '_labelChanged',
          },
        };
      }

      constructor() {
        super();

        this._labelController = new LabelController(this);

        this._labelController.addEventListener('slot-content-changed', (event) => {
          this.toggleAttribute('has-label', event.detail.hasContent);
        });
      }

      /** @protected */
      get _labelId() {
        const node = this._labelNode;
        return node && node.id;
      }

      /** @protected */
      get _labelNode() {
        return this._labelController.node;
      }

      /** @protected */
      ready() {
        super.ready();

        this.addController(this._labelController);
      }

      /** @protected */
      _labelChanged(label) {
        this._labelController.setLabel(label);
      }
    },
);

/**
 * @license
 * Copyright (c) 2021 - 2024 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */

/**
 * A mixin to provide required state and validation logic.
 *
 * @polymerMixin
 */
const ValidateMixin = dedupingMixin(
  (superclass) =>
    class ValidateMixinClass extends superclass {
      static get properties() {
        return {
          /**
           * Set to true when the field is invalid.
           */
          invalid: {
            type: Boolean,
            reflectToAttribute: true,
            notify: true,
            value: false,
          },

          /**
           * Specifies that the user must fill in a value.
           */
          required: {
            type: Boolean,
            reflectToAttribute: true,
          },
        };
      }

      /**
       * Validates the field and sets the `invalid` property based on the result.
       *
       * The method fires a `validated` event with the result of the validation.
       *
       * @return {boolean} True if the value is valid.
       */
      validate() {
        const isValid = this.checkValidity();
        this._setInvalid(!isValid);
        this.dispatchEvent(new CustomEvent('validated', { detail: { valid: isValid } }));
        return isValid;
      }

      /**
       * Returns true if the field value satisfies all constraints (if any).
       *
       * @return {boolean}
       */
      checkValidity() {
        return !this.required || !!this.value;
      }

      /**
       * @param {boolean} invalid
       * @protected
       */
      _setInvalid(invalid) {
        if (this._shouldSetInvalid(invalid)) {
          this.invalid = invalid;
        }
      }

      /**
       * Override this method to define whether the given `invalid` state should be set.
       *
       * @param {boolean} _invalid
       * @return {boolean}
       * @protected
       */
      _shouldSetInvalid(_invalid) {
        return true;
      }

      /**
       * Fired whenever the field is validated.
       *
       * @event validated
       * @param {Object} detail
       * @param {boolean} detail.valid the result of the validation.
       */
    },
);

/**
 * @license
 * Copyright (c) 2021 - 2024 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */

/**
 * A mixin to provide common field logic: label, error message and helper text.
 *
 * @polymerMixin
 * @mixes ControllerMixin
 * @mixes LabelMixin
 * @mixes ValidateMixin
 */
const FieldMixin = (superclass) =>
  class FieldMixinClass extends ValidateMixin(LabelMixin(ControllerMixin(superclass))) {
    static get properties() {
      return {
        /**
         * A target element to which ARIA attributes are set.
         * @protected
         */
        ariaTarget: {
          type: Object,
          observer: '_ariaTargetChanged',
        },

        /**
         * Error to show when the field is invalid.
         *
         * @attr {string} error-message
         */
        errorMessage: {
          type: String,
          observer: '_errorMessageChanged',
        },

        /**
         * String used for the helper text.
         * @attr {string} helper-text
         */
        helperText: {
          type: String,
          observer: '_helperTextChanged',
        },

        /**
         * String used to label the component to screen reader users.
         * @attr {string} accessible-name
         */
        accessibleName: {
          type: String,
          observer: '_accessibleNameChanged',
        },

        /**
         * Id of the element used as label of the component to screen reader users.
         * @attr {string} accessible-name-ref
         */
        accessibleNameRef: {
          type: String,
          observer: '_accessibleNameRefChanged',
        },
      };
    }

    static get observers() {
      return ['_invalidChanged(invalid)', '_requiredChanged(required)'];
    }

    constructor() {
      super();

      this._fieldAriaController = new FieldAriaController(this);
      this._helperController = new HelperController(this);
      this._errorController = new ErrorController(this);

      this._errorController.addEventListener('slot-content-changed', (event) => {
        this.toggleAttribute('has-error-message', event.detail.hasContent);
      });

      this._labelController.addEventListener('slot-content-changed', (event) => {
        const { hasContent, node } = event.detail;
        this.__labelChanged(hasContent, node);
      });

      this._helperController.addEventListener('slot-content-changed', (event) => {
        const { hasContent, node } = event.detail;
        this.toggleAttribute('has-helper', hasContent);
        this.__helperChanged(hasContent, node);
      });
    }

    /**
     * @protected
     * @return {HTMLElement}
     */
    get _errorNode() {
      return this._errorController.node;
    }

    /**
     * @protected
     * @return {HTMLElement}
     */
    get _helperNode() {
      return this._helperController.node;
    }

    /** @protected */
    ready() {
      super.ready();

      this.addController(this._fieldAriaController);
      this.addController(this._helperController);
      this.addController(this._errorController);
    }

    /** @private */
    __helperChanged(hasHelper, helperNode) {
      if (hasHelper) {
        this._fieldAriaController.setHelperId(helperNode.id);
      } else {
        this._fieldAriaController.setHelperId(null);
      }
    }

    /** @protected */
    _accessibleNameChanged(accessibleName) {
      this._fieldAriaController.setAriaLabel(accessibleName);
    }

    /** @protected */
    _accessibleNameRefChanged(accessibleNameRef) {
      this._fieldAriaController.setLabelId(accessibleNameRef, true);
    }

    /** @private */
    __labelChanged(hasLabel, labelNode) {
      // Label ID should be only added when the label content is present.
      // Otherwise, it may conflict with an `aria-label` attribute possibly added by the user.
      if (hasLabel) {
        this._fieldAriaController.setLabelId(labelNode.id);
      } else {
        this._fieldAriaController.setLabelId(null);
      }
    }

    /**
     * @param {string | null | undefined} errorMessage
     * @protected
     */
    _errorMessageChanged(errorMessage) {
      this._errorController.setErrorMessage(errorMessage);
    }

    /**
     * @param {string} helperText
     * @protected
     */
    _helperTextChanged(helperText) {
      this._helperController.setHelperText(helperText);
    }

    /**
     * @param {HTMLElement | null | undefined} target
     * @protected
     */
    _ariaTargetChanged(target) {
      if (target) {
        this._fieldAriaController.setTarget(target);
      }
    }

    /**
     * @param {boolean} required
     * @protected
     */
    _requiredChanged(required) {
      this._fieldAriaController.setRequired(required);
    }

    /**
     * @param {boolean} invalid
     * @protected
     */
    _invalidChanged(invalid) {
      this._errorController.setInvalid(invalid);

      // This timeout is needed to prevent NVDA from announcing the error message twice:
      // 1. Once adding the `[role=alert]` attribute when updating `has-error-message` (OK).
      // 2. Once linking the error ID with the ARIA target here (unwanted).
      // Related issue: https://github.com/vaadin/web-components/issues/3061.
      setTimeout(() => {
        // Error message ID needs to be dynamically added / removed based on the validity
        // Otherwise assistive technologies would announce the error, even if we hide it.
        if (invalid) {
          const node = this._errorNode;
          this._fieldAriaController.setErrorId(node && node.id);
        } else {
          this._fieldAriaController.setErrorId(null);
        }
      });
    }
  };

/**
 * @license
 * Copyright (c) 2021 - 2024 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */

/**
 * A mixin to delegate properties and attributes to a target element.
 *
 * @polymerMixin
 */
const DelegateStateMixin = dedupingMixin(
  (superclass) =>
    class DelegateStateMixinClass extends superclass {
      static get properties() {
        return {
          /**
           * A target element to which attributes and properties are delegated.
           * @protected
           */
          stateTarget: {
            type: Object,
            observer: '_stateTargetChanged',
          },
        };
      }

      /**
       * An array of the host attributes to delegate to the target element.
       */
      static get delegateAttrs() {
        return [];
      }

      /**
       * An array of the host properties to delegate to the target element.
       */
      static get delegateProps() {
        return [];
      }

      /** @protected */
      ready() {
        super.ready();

        this._createDelegateAttrsObserver();
        this._createDelegatePropsObserver();
      }

      /** @protected */
      _stateTargetChanged(target) {
        if (target) {
          this._ensureAttrsDelegated();
          this._ensurePropsDelegated();
        }
      }

      /** @protected */
      _createDelegateAttrsObserver() {
        this._createMethodObserver(`_delegateAttrsChanged(${this.constructor.delegateAttrs.join(', ')})`);
      }

      /** @protected */
      _createDelegatePropsObserver() {
        this._createMethodObserver(`_delegatePropsChanged(${this.constructor.delegateProps.join(', ')})`);
      }

      /** @protected */
      _ensureAttrsDelegated() {
        this.constructor.delegateAttrs.forEach((name) => {
          this._delegateAttribute(name, this[name]);
        });
      }

      /** @protected */
      _ensurePropsDelegated() {
        this.constructor.delegateProps.forEach((name) => {
          this._delegateProperty(name, this[name]);
        });
      }

      /** @protected */
      _delegateAttrsChanged(...values) {
        this.constructor.delegateAttrs.forEach((name, index) => {
          this._delegateAttribute(name, values[index]);
        });
      }

      /** @protected */
      _delegatePropsChanged(...values) {
        this.constructor.delegateProps.forEach((name, index) => {
          this._delegateProperty(name, values[index]);
        });
      }

      /** @protected */
      _delegateAttribute(name, value) {
        if (!this.stateTarget) {
          return;
        }

        if (name === 'invalid') {
          this._delegateAttribute('aria-invalid', value ? 'true' : false);
        }

        if (typeof value === 'boolean') {
          this.stateTarget.toggleAttribute(name, value);
        } else if (value) {
          this.stateTarget.setAttribute(name, value);
        } else {
          this.stateTarget.removeAttribute(name);
        }
      }

      /** @protected */
      _delegateProperty(name, value) {
        if (!this.stateTarget) {
          return;
        }

        this.stateTarget[name] = value;
      }
    },
);

/**
 * @license
 * Copyright (c) 2021 - 2024 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */

/**
 * A mixin to combine multiple input validation constraints.
 *
 * @polymerMixin
 * @mixes DelegateStateMixin
 * @mixes InputMixin
 * @mixes ValidateMixin
 */
const InputConstraintsMixin = dedupingMixin(
  (superclass) =>
    class InputConstraintsMixinClass extends DelegateStateMixin(ValidateMixin(InputMixin(superclass))) {
      /**
       * An array of attributes which participate in the input validation.
       * Changing these attributes will cause the input to re-validate.
       *
       * IMPORTANT: The attributes should be properly delegated to the input element
       * from the host using `delegateAttrs` getter (see `DelegateStateMixin`).
       * The `required` attribute is already delegated.
       */
      static get constraints() {
        return ['required'];
      }

      static get delegateAttrs() {
        return [...super.delegateAttrs, 'required'];
      }

      /** @protected */
      ready() {
        super.ready();

        this._createConstraintsObserver();
      }

      /**
       * Returns true if the current input value satisfies all constraints (if any).
       * @return {boolean}
       */
      checkValidity() {
        if (this.inputElement && this._hasValidConstraints(this.constructor.constraints.map((c) => this[c]))) {
          return this.inputElement.checkValidity();
        }
        return !this.invalid;
      }

      /**
       * Returns true if some of the provided set of constraints are valid.
       * @param {Array} constraints
       * @return {boolean}
       * @protected
       */
      _hasValidConstraints(constraints) {
        return constraints.some((c) => this.__isValidConstraint(c));
      }

      /**
       * Override this method to customize setting up constraints observer.
       * @protected
       */
      _createConstraintsObserver() {
        // This complex observer needs to be added dynamically instead of using `static get observers()`
        // to make it possible to tweak this behavior in classes that apply this mixin.
        this._createMethodObserver(`_constraintsChanged(stateTarget, ${this.constructor.constraints.join(', ')})`);
      }

      /**
       * Override this method to implement custom validation constraints.
       * @param {HTMLElement | undefined} stateTarget
       * @param {unknown[]} constraints
       * @protected
       */
      _constraintsChanged(stateTarget, ...constraints) {
        // The input element's validity cannot be determined until
        // all the necessary constraint attributes aren't set on it.
        if (!stateTarget) {
          return;
        }

        const hasConstraints = this._hasValidConstraints(constraints);
        const isLastConstraintRemoved = this.__previousHasConstraints && !hasConstraints;

        if ((this._hasValue || this.invalid) && hasConstraints) {
          this.validate();
        } else if (isLastConstraintRemoved) {
          this._setInvalid(false);
        }

        this.__previousHasConstraints = hasConstraints;
      }

      /**
       * Override an event listener inherited from `InputMixin`
       * to capture native `change` event and make sure that
       * a new one is dispatched after validation runs.
       * @param {Event} event
       * @protected
       * @override
       */
      _onChange(event) {
        event.stopPropagation();

        this.validate();

        this.dispatchEvent(
          new CustomEvent('change', {
            detail: {
              sourceEvent: event,
            },
            bubbles: event.bubbles,
            cancelable: event.cancelable,
          }),
        );
      }

      /** @private */
      __isValidConstraint(constraint) {
        // 0 is valid for `minlength` and `maxlength`
        return Boolean(constraint) || constraint === 0;
      }
    },
);

/**
 * @license
 * Copyright (c) 2021 - 2024 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */

/**
 * A mixin to provide shared logic for the editable form input controls.
 *
 * @polymerMixin
 * @mixes DelegateFocusMixin
 * @mixes FieldMixin
 * @mixes InputConstraintsMixin
 * @mixes KeyboardMixin
 * @mixes ClearButtonMixin
 * @mixes SlotStylesMixin
 */
const InputControlMixin = (superclass) =>
  class InputControlMixinClass extends SlotStylesMixin(
    DelegateFocusMixin(InputConstraintsMixin(FieldMixin(ClearButtonMixin(KeyboardMixin(superclass))))),
  ) {
    static get properties() {
      return {
        /**
         * A pattern matched against individual characters the user inputs.
         *
         * When set, the field will prevent:
         * - `keydown` events if the entered key doesn't match `/^allowedCharPattern$/`
         * - `paste` events if the pasted text doesn't match `/^allowedCharPattern*$/`
         * - `drop` events if the dropped text doesn't match `/^allowedCharPattern*$/`
         *
         * For example, to allow entering only numbers and minus signs, use:
         * `allowedCharPattern = "[\\d-]"`
         * @attr {string} allowed-char-pattern
         */
        allowedCharPattern: {
          type: String,
          observer: '_allowedCharPatternChanged',
        },

        /**
         * If true, the input text gets fully selected when the field is focused using click or touch / tap.
         */
        autoselect: {
          type: Boolean,
          value: false,
        },

        /**
         * The name of this field.
         */
        name: {
          type: String,
          reflectToAttribute: true,
        },

        /**
         * A hint to the user of what can be entered in the field.
         */
        placeholder: {
          type: String,
          reflectToAttribute: true,
        },

        /**
         * When present, it specifies that the field is read-only.
         */
        readonly: {
          type: Boolean,
          value: false,
          reflectToAttribute: true,
        },

        /**
         * The text usually displayed in a tooltip popup when the mouse is over the field.
         */
        title: {
          type: String,
          reflectToAttribute: true,
        },
      };
    }

    static get delegateAttrs() {
      return [...super.delegateAttrs, 'name', 'type', 'placeholder', 'readonly', 'invalid', 'title'];
    }

    constructor() {
      super();

      this._boundOnPaste = this._onPaste.bind(this);
      this._boundOnDrop = this._onDrop.bind(this);
      this._boundOnBeforeInput = this._onBeforeInput.bind(this);
    }

    /** @protected */
    get slotStyles() {
      // Needed for Safari, where ::slotted(...)::placeholder does not work
      return [
        `
          :is(input[slot='input'], textarea[slot='textarea'])::placeholder {
            font: inherit;
            color: inherit;
          }
        `,
      ];
    }

    /**
     * Override an event listener from `DelegateFocusMixin`.
     * @param {FocusEvent} event
     * @protected
     * @override
     */
    _onFocus(event) {
      super._onFocus(event);

      if (this.autoselect && this.inputElement) {
        this.inputElement.select();
      }
    }

    /**
     * Override an event listener inherited from `InputMixin`
     * to capture native `change` event and make sure that
     * a new one is dispatched after validation runs.
     * @param {Event} event
     * @protected
     * @override
     */
    _onChange(event) {
      event.stopPropagation();

      this.validate();

      this.dispatchEvent(
        new CustomEvent('change', {
          detail: {
            sourceEvent: event,
          },
          bubbles: event.bubbles,
          cancelable: event.cancelable,
        }),
      );
    }

    /**
     * Override a method from `InputMixin`.
     * @param {!HTMLElement} input
     * @protected
     * @override
     */
    _addInputListeners(input) {
      super._addInputListeners(input);

      input.addEventListener('paste', this._boundOnPaste);
      input.addEventListener('drop', this._boundOnDrop);
      input.addEventListener('beforeinput', this._boundOnBeforeInput);
    }

    /**
     * Override a method from `InputMixin`.
     * @param {!HTMLElement} input
     * @protected
     * @override
     */
    _removeInputListeners(input) {
      super._removeInputListeners(input);

      input.removeEventListener('paste', this._boundOnPaste);
      input.removeEventListener('drop', this._boundOnDrop);
      input.removeEventListener('beforeinput', this._boundOnBeforeInput);
    }

    /**
     * Override an event listener from `KeyboardMixin`.
     * @param {!KeyboardEvent} event
     * @protected
     * @override
     */
    _onKeyDown(event) {
      super._onKeyDown(event);

      if (this.allowedCharPattern && !this.__shouldAcceptKey(event) && event.target === this.inputElement) {
        event.preventDefault();
        this._markInputPrevented();
      }
    }

    /** @protected */
    _markInputPrevented() {
      // Add input-prevented attribute for 200ms
      this.setAttribute('input-prevented', '');
      this._preventInputDebouncer = Debouncer.debounce(this._preventInputDebouncer, timeOut.after(200), () => {
        this.removeAttribute('input-prevented');
      });
    }

    /** @private */
    __shouldAcceptKey(event) {
      return (
        event.metaKey ||
        event.ctrlKey ||
        !event.key || // Allow typing anything if event.key is not supported
        event.key.length !== 1 || // Allow "Backspace", "ArrowLeft" etc.
        this.__allowedCharRegExp.test(event.key)
      );
    }

    /** @private */
    _onPaste(e) {
      if (this.allowedCharPattern) {
        const pastedText = e.clipboardData.getData('text');
        if (!this.__allowedTextRegExp.test(pastedText)) {
          e.preventDefault();
          this._markInputPrevented();
        }
      }
    }

    /** @private */
    _onDrop(e) {
      if (this.allowedCharPattern) {
        const draggedText = e.dataTransfer.getData('text');
        if (!this.__allowedTextRegExp.test(draggedText)) {
          e.preventDefault();
          this._markInputPrevented();
        }
      }
    }

    /** @private */
    _onBeforeInput(e) {
      // The `beforeinput` event covers all the cases for `allowedCharPattern`: keyboard, pasting and dropping,
      // but it is still experimental technology so we can't rely on it. It's used here just as an additional check,
      // because it seems to be the only way to detect and prevent specific keys on mobile devices.
      // See https://github.com/vaadin/vaadin-text-field/issues/429
      if (this.allowedCharPattern && e.data && !this.__allowedTextRegExp.test(e.data)) {
        e.preventDefault();
        this._markInputPrevented();
      }
    }

    /** @private */
    _allowedCharPatternChanged(charPattern) {
      if (charPattern) {
        try {
          this.__allowedCharRegExp = new RegExp(`^${charPattern}$`, 'u');
          this.__allowedTextRegExp = new RegExp(`^${charPattern}*$`, 'u');
        } catch (e) {
          console.error(e);
        }
      }
    }

    /**
     * Fired when the user commits a value change.
     *
     * @event change
     */

    /**
     * Fired when the value is changed by the user: on every typing keystroke,
     * and the value is cleared using the clear button.
     *
     * @event input
     */
  };

/**
 * @license
 * Copyright (c) 2021 - 2024 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */

/**
 * A mixin to provide logic for vaadin-text-field and related components.
 *
 * @polymerMixin
 * @mixes InputControlMixin
 */
const InputFieldMixin = (superclass) =>
  class InputFieldMixinClass extends InputControlMixin(superclass) {
    static get properties() {
      return {
        /**
         * Whether the value of the control can be automatically completed by the browser.
         * List of available options at:
         * https://developer.mozilla.org/en/docs/Web/HTML/Element/input#attr-autocomplete
         */
        autocomplete: {
          type: String,
        },

        /**
         * This is a property supported by Safari that is used to control whether
         * autocorrection should be enabled when the user is entering/editing the text.
         * Possible values are:
         * on: Enable autocorrection.
         * off: Disable autocorrection.
         */
        autocorrect: {
          type: String,
        },

        /**
         * This is a property supported by Safari and Chrome that is used to control whether
         * autocapitalization should be enabled when the user is entering/editing the text.
         * Possible values are:
         * characters: Characters capitalization.
         * words: Words capitalization.
         * sentences: Sentences capitalization.
         * none: No capitalization.
         */
        autocapitalize: {
          type: String,
          reflectToAttribute: true,
        },
      };
    }

    static get delegateAttrs() {
      return [...super.delegateAttrs, 'autocapitalize', 'autocomplete', 'autocorrect'];
    }

    // Workaround for https://github.com/Polymer/polymer/issues/5259
    get __data() {
      return this.__dataValue || {};
    }

    set __data(value) {
      this.__dataValue = value;
    }

    /**
     * @param {HTMLElement} input
     * @protected
     * @override
     */
    _inputElementChanged(input) {
      super._inputElementChanged(input);

      if (input) {
        // Discard value set on the custom slotted input.
        if (input.value && input.value !== this.value) {
          console.warn(`Please define value on the <${this.localName}> component!`);
          input.value = '';
        }

        if (this.value) {
          input.value = this.value;
        }
      }
    }

    /**
     * Override an event listener from `FocusMixin`.
     * @param {boolean} focused
     * @protected
     * @override
     */
    _setFocused(focused) {
      super._setFocused(focused);

      // Do not validate when focusout is caused by document
      // losing focus, which happens on browser tab switch.
      if (!focused && document.hasFocus()) {
        this.validate();
      }
    }

    /**
     * Override an event listener from `InputMixin`
     * to mark as valid after user started typing.
     * @param {Event} event
     * @protected
     * @override
     */
    _onInput(event) {
      super._onInput(event);

      if (this.invalid) {
        this.validate();
      }
    }

    /**
     * Override an observer from `InputMixin` to validate the field
     * when a new value is set programmatically.
     *
     * @param {string | undefined} newValue
     * @param {string | undefined} oldValue
     * @protected
     * @override
     */
    _valueChanged(newValue, oldValue) {
      super._valueChanged(newValue, oldValue);

      if (oldValue === undefined) {
        return;
      }

      if (this.invalid) {
        this.validate();
      }
    }
  };

/**
 * @license
 * Copyright (c) 2021 - 2024 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */

/**
 * A controller for linking a `<label>` element with an `<input>` element.
 */
class LabelledInputController {
  constructor(input, labelController) {
    this.input = input;
    this.__preventDuplicateLabelClick = this.__preventDuplicateLabelClick.bind(this);

    labelController.addEventListener('slot-content-changed', (event) => {
      this.__initLabel(event.detail.node);
    });

    // Initialize the default label element
    this.__initLabel(labelController.node);
  }

  /**
   * @param {HTMLElement} label
   * @private
   */
  __initLabel(label) {
    if (label) {
      label.addEventListener('click', this.__preventDuplicateLabelClick);

      if (this.input) {
        label.setAttribute('for', this.input.id);
      }
    }
  }

  /**
   * The native platform fires an event for both the click on the label, and also
   * the subsequent click on the native input element caused by label click.
   * This results in two click events arriving at the host, but we only want one.
   * This method prevents the duplicate click and ensures the correct isTrusted event
   * with the correct event.target arrives at the host.
   * @private
   */
  __preventDuplicateLabelClick() {
    const inputClickHandler = (e) => {
      e.stopImmediatePropagation();
      this.input.removeEventListener('click', inputClickHandler);
    };
    this.input.addEventListener('click', inputClickHandler);
  }
}

/**
 * @license
 * Copyright (c) 2021 - 2024 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */

/**
 * A mixin providing common text field functionality.
 *
 * @polymerMixin
 * @mixes InputFieldMixin
 */
const TextFieldMixin = (superClass) =>
  class TextFieldMixinClass extends InputFieldMixin(superClass) {
    static get properties() {
      return {
        /**
         * Maximum number of characters (in Unicode code points) that the user can enter.
         */
        maxlength: {
          type: Number,
        },

        /**
         * Minimum number of characters (in Unicode code points) that the user can enter.
         */
        minlength: {
          type: Number,
        },

        /**
         * A regular expression that the value is checked against.
         * The pattern must match the entire value, not just some subset.
         */
        pattern: {
          type: String,
        },
      };
    }

    static get delegateAttrs() {
      return [...super.delegateAttrs, 'maxlength', 'minlength', 'pattern'];
    }

    static get constraints() {
      return [...super.constraints, 'maxlength', 'minlength', 'pattern'];
    }

    constructor() {
      super();
      this._setType('text');
    }

    /** @protected */
    get clearElement() {
      return this.$.clearButton;
    }

    /** @protected */
    ready() {
      super.ready();

      this.addController(
        new InputController(this, (input) => {
          this._setInputElement(input);
          this._setFocusElement(input);
          this.stateTarget = input;
          this.ariaTarget = input;
        }),
      );
      this.addController(new LabelledInputController(this.inputElement, this._labelController));
    }
  };

/**
 * @license
 * Copyright (c) 2017 - 2024 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */

registerStyles('vaadin-text-field', inputFieldShared, { moduleId: 'vaadin-text-field-styles' });

/**
 * `<vaadin-text-field>` is a web component that allows the user to input and edit text.
 *
 * ```html
 * <vaadin-text-field label="First Name"></vaadin-text-field>
 * ```
 *
 * ### Prefixes and suffixes
 *
 * These are child elements of a `<vaadin-text-field>` that are displayed
 * inline with the input, before or after.
 * In order for an element to be considered as a prefix, it must have the slot
 * attribute set to `prefix` (and similarly for `suffix`).
 *
 * ```html
 * <vaadin-text-field label="Email address">
 *   <div slot="prefix">Sent to:</div>
 *   <div slot="suffix">@vaadin.com</div>
 * </vaadin-text-field>
 * ```
 *
 * ### Styling
 *
 * The following custom properties are available for styling:
 *
 * Custom property                | Description                | Default
 * -------------------------------|----------------------------|---------
 * `--vaadin-field-default-width` | Default width of the field | `12em`
 *
 * The following shadow DOM parts are available for styling:
 *
 * Part name            | Description
 * ---------------------|----------------
 * `label`              | The label element
 * `input-field`        | The element that wraps prefix, value and suffix
 * `clear-button`       | The clear button
 * `error-message`      | The error message element
 * `helper-text`        | The helper text element wrapper
 * `required-indicator` | The `required` state indicator element
 *
 * The following state attributes are available for styling:
 *
 * Attribute           | Description | Part name
 * --------------------|-------------|------------
 * `disabled`          | Set to a disabled text field | :host
 * `has-value`         | Set when the element has a value | :host
 * `has-label`         | Set when the element has a label | :host
 * `has-helper`        | Set when the element has helper text or slot | :host
 * `has-error-message` | Set when the element has an error message | :host
 * `invalid`           | Set when the element is invalid | :host
 * `input-prevented`   | Temporarily set when invalid input is prevented | :host
 * `focused`           | Set when the element is focused | :host
 * `focus-ring`        | Set when the element is keyboard focused | :host
 * `readonly`          | Set to a readonly text field | :host
 *
 * See [Styling Components](https://vaadin.com/docs/latest/styling/styling-components) documentation.
 *
 * @fires {Event} input - Fired when the value is changed by the user: on every typing keystroke, and the value is cleared using the clear button.
 * @fires {Event} change - Fired when the user commits a value change.
 * @fires {CustomEvent} invalid-changed - Fired when the `invalid` property changes.
 * @fires {CustomEvent} value-changed - Fired when the `value` property changes.
 * @fires {CustomEvent} validated - Fired whenever the field is validated.
 *
 * @customElement
 * @extends HTMLElement
 * @mixes ElementMixin
 * @mixes ThemableMixin
 * @mixes TextFieldMixin
 */
class TextField extends TextFieldMixin(ThemableMixin(ElementMixin(PolymerElement))) {
  static get is() {
    return 'vaadin-text-field';
  }

  static get template() {
    return html`
      <div class="vaadin-field-container">
        <div part="label">
          <slot name="label"></slot>
          <span part="required-indicator" aria-hidden="true" on-click="focus"></span>
        </div>

        <vaadin-input-container
          part="input-field"
          readonly="[[readonly]]"
          disabled="[[disabled]]"
          invalid="[[invalid]]"
          theme$="[[_theme]]"
        >
          <slot name="prefix" slot="prefix"></slot>
          <slot name="input"></slot>
          <slot name="suffix" slot="suffix"></slot>
          <div id="clearButton" part="clear-button" slot="suffix" aria-hidden="true"></div>
        </vaadin-input-container>

        <div part="helper-text">
          <slot name="helper"></slot>
        </div>

        <div part="error-message">
          <slot name="error-message"></slot>
        </div>
      </div>
      <slot name="tooltip"></slot>
    `;
  }

  static get properties() {
    return {
      /**
       * Maximum number of characters (in Unicode code points) that the user can enter.
       */
      maxlength: {
        type: Number,
      },

      /**
       * Minimum number of characters (in Unicode code points) that the user can enter.
       */
      minlength: {
        type: Number,
      },
    };
  }

  /** @protected */
  ready() {
    super.ready();

    this._tooltipController = new TooltipController(this);
    this._tooltipController.setPosition('top');
    this._tooltipController.setAriaTarget(this.inputElement);
    this.addController(this._tooltipController);
  }
}

defineCustomElement(TextField);

class Field extends TextField {
  constructor() {
    super();
  }
  static get _styleSheet() {
    return stylesheet$4;
  }
}

class DialogContent extends HTMLElement {

  static get _styleSheet() {
    return stylesheet$6;
  }

  get elementTemplate() {
    return toElement('div')`
      ${() => this.formTemplate}
    `({});
  }

  get formTemplate() {
    const form = this.defineElement(Form);
    const field = this.defineElement(Field);
    const { nav_config, dialog } = this.elementState;
    const config = nav_config.get(dialog) || {};
    if (!('fields' in config)) {
      return '';
    }
    const fields = config.fields.map((x) => {
      return toElement(field)``({
        label: x.label, value: x.placeholder || ''
      })
    });
    const submit = toElement('input')``({
      value: () => config.submit,
      '@click': () => {
        this.elementState.dialog = '';
        if (config.notice) {
          this.elementState.notice = config.id;
        }
      },
      class: 'button',
      type: 'submit'
    });
    return toElement(form)`
      ${() => fields}
      <div class='start left grid'>
        ${() => submit}
      </div>
    `({});
  }
}

class DialogGrid extends HTMLElement {

  get elementTemplate() {
    const dialog_element = this.defineElement(DialogContent);
    const dialog_title = () => {
      const { nav_config, dialog } = this.elementState;
      const config = nav_config.get(dialog) || {};
      return config.dialog;
    };
    return toElement(this.defineElement(StyledDialog))`
      <span>${dialog_title}</span>
      <${dialog_element}></${dialog_element}>
    `({
      open: () => {
        return this.elementState.dialog != '';
      },
      class: 'dialog',
      '@close': () => {
        this.elementState;
        this.elementState.dialog = '';
      }
    })
  }
}

const stylesheet$3 = new CSSStyleSheet();
stylesheet$3.replaceSync(`:host {
  align-items: start;
  cursor: pointer;
  button {
    background-color: var(--dark-accept-color);
    transform: scaleX(-1) rotate(90deg);
    border: var(--thin-glass-border);
    padding: var(--gap-tiny);
    border-radius: 50%;
    height: unset;
  }
}
:host([expanded='true']) {
  button {
    background-color: var(--dark-main-glass);
    transform: scaleX(1) rotate(90deg);
  }
}
:host([close='true']) {
  button {
    background-color: var(--dark-reject-color);
  }
}
`);

class IconButton extends SimpleIconButtonLite {
  static get _styleSheet() {
    return stylesheet$3;
  }
}

const stylesheet$2 = new CSSStyleSheet();
stylesheet$2.replaceSync(`:host {
  font-size: var(--menu-font-size);
  > div > .grid:first-child {
    grid-row: 1;
    grid-column: 1;
    padding-top: var(--gap-small);
    padding-bottom: var(--gap-small);
    grid-template-columns: repeat(auto-fill, 100px);
  }
  > div > .grid.tabs {
    grid-row: 2;
    grid-column: 1;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  }
  > div > .grid > .grid {
    grid-template-columns: auto 1fr auto;
  }
  > div > .grid > .grid > button {
    background-color: var(--dark-main-glass);
    color: inherit;
  }
  > div > .grid > .grid[chosen="true"] > button {
    color: var(--light-focus-color);
    box-shadow: var(--white-highlight);
    text-shadow: var(--dark-focus-shadow);
    background-color: var(--gray-glass);
  }
  > div > .grid.tabs > .grid::before,
  > div > .grid.tabs > .grid::after {
    box-shadow: var(--thin-white-shadow);
  }
  > div > .grid > .grid::before,
  > div > .grid > .grid::after {
    width: var(--gap-tiny);
    content: '';
  }
  > div > .grid > .grid:first-child::before,
  > div > .grid > .grid:last-child::after {
    width: 0;
  }
}
`);

class Nav extends HTMLElement {

  get elementTemplate() {
    const {
      menu_order, tab_order,
    } = this.elementState;
    const menu_items = this.itemsTemplate(
      menu_order, 'button'
    );
    const tab_items = this.itemsTemplate(
      tab_order, 'tab'
    );
    return toElement('div')`
      <div class="stretch grid menu">
        ${() => menu_items}
      </div>
      <div class="stretch grid menu tabs">
        ${() => tab_items}
      </div>
    `({
      'class': 'contents'
    });
  }
  itemsTemplate(item_list, role) {
    const { nav_config } = this.elementState;
    return item_list.map((item_id, i) => {
      const item = nav_config.get(item_id);
      const item_class = () => {
        return `center grid menu ${role}`;
      };
      return toElement('div')`
      <button class="${item_class}" role="${role}">
        <span>${() => item.heading}</span>
      </button>`({
        'class': 'stretch grid menu',
        'chosen': () => {
          const { tab, dialog } = this.elementState;
          return [tab, dialog].includes(item.id);
        },
        '@click': () => {
          const { nav_config } = this.elementState;
          if ('dialog' in nav_config.get(item.id)) {
            this.elementState.dialog = item.id;
          }
          else if (role == 'tab') {
            this.elementState.tab = item.id;
          }
          else {
            this.elementState.notice = item.id;
          }
        },
      });
    })
  }

  static get _styleSheet() {
    return stylesheet$2;
  }
}

class PanelGrid extends HTMLElement {

  get iconTemplate() {
    const button = this.defineElement(IconButton);
    return toElement(button)``({
      class: 'icon',
      icon: () => {
        const { dialog } = this.elementState;
        if (dialog != '') {
          return 'icons:close';
        }
        return 'icons:expand-more';
      },
      '@click': (event) => {
        const { dialog } = this.elementState;
        if (dialog != '') {
          this.elementState.dialog = '';
          return;
        }
        this.elementState.expanded = (
          !this.elementState.expanded
        );
      },
      close: () => this.elementState.dialog != '',
      expanded: () => this.elementState.expanded
    })
  }
  get elementTemplate() {
    const nav = this.defineElement(Nav);
    const panel = this.defineElement(PanelContent);
    const dialog = this.defineElement(DialogGrid);
    return toElement('div')`
      <${nav} class="contents"></${nav}>
      <${panel} class="stretch panel grid inner"></${panel}>
      <${dialog} class="dialog" open="${
        () => this.elementState.dialog != ''
      }"></${dialog}>
      ${this.iconTemplate}
    `({
      'class': 'wrapper start grid',
      'expanded': () => this.elementState.expanded
    });
  }

  static get _styleSheet() {
    return stylesheet$a;
  }
}

const stylesheet$1 = new CSSStyleSheet();
stylesheet$1.replaceSync(`:host {
  --dialog-animation-duration: 0.2s;
  --dialog-border-radius: var(--radius-notice-1111);
  --dialog-bg: var(--dark-main-glass);
  --dialog-padding: var(--gap-medium);
  --dialog-container-padding: 0;
  --dialog-width: auto;
  #backdrop {
    backdrop-filter: var(--glass-filter);
    background-color: var(--gray-glass);
    grid-column: 1 / -1;
    grid-row: 1 / -1;
    z-index: 1;
    position: static;
    cursor: pointer;
  }
  #dialog {
    box-shadow: var(--floating-box-shadow);
    backdrop-filter: var(--glass-filter);
    border-top: var(--thin-glass-border);
    border: var(--thin-glass-border);
    grid-column: 2;
    grid-row: 2;
    margin: 0;
  }
  display: grid;
  grid-template-columns: 1fr 250px 1fr;
  grid-template-rows: 1fr 150px 3fr;
  position: static;
  padding: 0;
  height: 100%;
}
`);

class StyledNotice extends WebDialog {
  static get _styleSheet() {
    return stylesheet$1;
  }
}

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(`div.grid {
  grid-template-rows: auto 1fr; 
  grid-template-columns: 1fr auto;
  > h2 {
    margin-top: var(--gap-small);
    margin-bottom: 0;
  }
}
`);

class NoticeContent extends HTMLElement {

  static get _styleSheet() {
    return stylesheet;
  }

  get elementTemplate() {
    return toElement('div')`
      ${() => this.elementTemplateContent}
    `({});
  }

  get elementTemplateContent() {
    this.defineElement(IconButton);
    const { nav_config, notice } = this.elementState;
    const config = nav_config.get(notice) || {};
    if (!config.notice) {
      return '';
    }
    return toElement('div')`
      <h2>${() => config.notice}</h2>
      ${this.iconTemplate} 
      <p>${() => config.success}</p>
    `({
       class: 'grid'
     });
  }

  get iconTemplate() {
    const button = this.defineElement(IconButton);
    return toElement(button)``({
      icon: 'icons:close',
      class: 'icon', close: true,
      '@click': (event) => {
        this.elementState.notice = '';
      }
    })
  }
}

class NoticeGrid extends HTMLElement {

  static allNoticeTimer = new Set();

  get elementTemplate() {
    const notice_element = this.defineElement(NoticeContent);
    return toElement(this.defineElement(StyledNotice))`
      <${notice_element}></${notice_element}>
    `({
      open: () => {
        return this.elementState.notice != '';
      },
      class: 'notice',
      '@close': () => {
        this.clearAllNotices(0);
      }
    })
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name != 'open') return;
    if (oldValue != null) return;
    if (newValue == null) return;
    const { nav_config, notice } = this.elementState;
    const config = nav_config.get(notice) || {};
    if (config.timeout) {
      this.clearAllNotices(config.timeout);
    }
  }

  clearAllNotices (timeout=0) {
    clearTimeout(this.constructor.allNoticeTimer);
    this.constructor.allNoticeTimer = setTimeout(
      () => this.elementState.notice = '', timeout
    );
  }
}

class IndexGrid extends HTMLElement {
  static get _styleSheet() {
    return stylesheet$b;
  }

  get elementTemplate() {
    const notice_grid = this.defineElement(NoticeGrid, {
      attributes: ['open']
    });
    const panel_grid = this.defineElement(PanelGrid, {
      attributes: ['expanded'],
      defaults: { expanded: true }
    });
    return toElement('div')`
      <img src="data/background.png"/>
      <${panel_grid} class="stretch grid panel outer">
      </${panel_grid}>
      <${notice_grid} class="notice" open="${
        () => this.elementState.notice != ''
      }"></${notice_grid}>
    `({
      class: 'root stretch grid'
    });
  }
}

const configure = (id) => {
  switch (id) {
    case 'EXPORT':
      return { 
        id, heading: 'Export',
        submit: 'Export', notice: 'Exported Story',
        success: 'Exported Minerva Story',
        dialog: 'Export as Minerva Story',
        fields: [{
          label: 'Path for the exported story'
        }]
      }
    case 'SAVEAS':
      return { 
        id, heading: 'Save As',
        submit: 'Save as a copy', notice: 'Saved copy',
        success: 'Saved copy successfully',
        dialog: 'Save as an editable copy',
        fields: [{
          label: 'Path for the new copy',
          placeholder: '/'
        }]
      }
    case 'SAVE':
      return { 
        id, heading: 'Save', notice: 'Saved',
        success: 'Saved successfully',
        timeout: 3000
      }
    case 'STORY':
      return { id, heading: 'Story' }
    case 'GROUP':
      return { id, heading: 'Channels' }
    case 'IMAGE':
      return { id, heading: 'Images' }
    case 'OVERLAY':
      return { id, heading: 'Overlays' }
    default:
      return { id }
  }
};

const nav_config = new Map([
  ["EXPORT",configure('EXPORT')],
  ["SAVEAS",configure('SAVEAS')],
  ["SAVE",configure('SAVE')],
  ["STORY",configure('STORY')],
  ["GROUP",configure('GROUP')],
  ["IMAGE",configure('IMAGE')],
  ["OVERLAY",configure('OVERLAY')]
]);

(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("foobarIpsum", [], factory);
	else if(typeof exports === 'object')
		exports["foobarIpsum"] = factory();
	else
		root["foobarIpsum"] = factory();
})(typeof self !== 'undefined' ? self : undefined, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "dist/";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _dictionary = __webpack_require__(1);

var _dictionary2 = _interopRequireDefault(_dictionary);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _class = function () {

  /**
   * Represents the core text generator.
   * @param {object} opts - Options for generator to consume.
   * @returns {string}
   */
  function _class(opts) {
    _classCallCheck(this, _class);

    opts = Object.assign({}, opts);
    opts.size = opts.size || {};
    opts.size.sentence = opts.size.sentence || 15;
    opts.size.paragraph = opts.size.paragraph || 3;
    opts.dictionary = opts.dictionary || _dictionary2.default.words;
    this.opts = opts;
  }

  /**
   * Generate a random word given the provided dictionary.
   * @returns {string}
   */


  _createClass(_class, [{
    key: 'word',
    value: function word() {
      return this.opts.dictionary[Math.floor(Math.random() * this.opts.dictionary.length)];
    }

    /**
     * Generate a random sentence given the provided dictionary and sentence bounds.
     * @returns {string}
     */

  }, {
    key: 'sentence',
    value: function sentence() {
      var _this = this;

      var size = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

      var sentence = [].concat(_toConsumableArray(Array(size || this.opts.size.sentence))).map(function () {
        return ' ' + _this.word();
      }).join('').slice(1);
      return sentence.charAt(0).toUpperCase() + sentence.slice(1);
    }

    /**
     * Generate a random paragraph given the provided dictionary and paragraph bounds.
     * @param {int} size - Optional paragraph size specification in number of sentences.
     * @param {string} eoc - End of character for each paragraph.
     * @returns {string}
     */

  }, {
    key: 'paragraph',
    value: function paragraph() {
      var _this2 = this;

      var size = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
      var eoc = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

      size = size || this.opts.size.paragraph;
      return [].concat(_toConsumableArray(Array(size))).map(function () {
        return _this2.sentence() + '. ';
      }).map(function (sentence, index) {
        if (!((index + 1) % 4)) return '' + eoc + sentence;else return sentence;
      }).join('').trim();
    }
  }]);

  return _class;
}();

exports.default = _class;
module.exports = exports['default'];

/***/ }),
/* 1 */
/***/ (function(module, exports) {

module.exports = {"words":["ad","adipisicing","Aenean","aliqua","aliquip","amet","anim","aute","bar","barfoo","cillum","commodo","consectetur","consequat","culpa","cupidatat","deserunt","do","dolor","dolore","duis","ea","eget","eiusmod","eleifend","elit","enim","esse","est","et","eu","ex","excepteur","exercitation","foo","foobar","fugiat","id","in","incididunt","ipsum","irure","labore","laboris","laborum","leo","Lorem","magna","minim","mollit","nam","nec","nisi","non","nostrud","nulla","occaecat","officia","pariatur","parturient","proident","qui","quis","reprehenderit","sint","sit","sunt","tellus","tempor","tempus","ullamco","ut","velit","veniam","Vivamus","voluptate"]};

/***/ })
/******/ ]);
});

const lorem = new foobarIpsum({
  size: {
    sentence: 5,
    paragraph: 6
  }
});

const to_story = (expanded, length=1) => {
  return {
    expanded,
    summary: lorem.sentence(3),
    content: [...new Array(length)].map(() => {
      return lorem.paragraph()
    })
  }
};

const metadata_config = {
  "name": "Nullam et luctus",
  "stories": [
    to_story(true, 1),
    to_story(false, 2),
    to_story(true, 3),
    to_story(false, 4)
  ]
};

const main = async (customSuffix) => {
  document.adoptedStyleSheets = [
    stylesheet$c
  ];
  const defineElement = toElementState(customSuffix, {
    defaults: {
      content_map: 'content_map',
      metadata_config
    },
    constants: {
      nav_config,
      tab_order: (
        [ 'IMAGE', 'OVERLAY', 'GROUP', 'STORY' ]
      ),
      menu_order: (
        [ 'EXPORT', 'SAVEAS', 'SAVE' ]
      )
    },
    styleSheet: stylesheet$c
  });
  const index = defineElement(IndexGrid, {
    defaults: {
      notice: '', dialog: '', tab: 'STORY'
    }
  });
  toElement(index)``({
    class: 'contents'
  })(document.body);
};

export { main as default };
