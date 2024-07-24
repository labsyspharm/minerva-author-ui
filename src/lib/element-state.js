import { html, reactive } from '@arrow-js/core';
import { defaultConverter } from '@lit/reactive-element';

const convertToAttribute = (properties, k, v) => {
  const v_type = (properties?.get(k))?.type || String;
  return defaultConverter.toAttribute(v, v_type);
}

const convertFromAttribute = (properties, k, v_att) => {
  const v_type = (properties?.get(k))?.type || String;
  return defaultConverter.fromAttribute(v_att, v_type);
}

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
}

function updateAttribute(k, v_att) {
  this.__reflectingProperty = k;
  if (v_att == null) {
    return this.removeAttribute(k);
  }
  this.setAttribute(k, v_att)
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
        let att_v = this.getAttribute(k);
        if (att_v === 'false') att_v = null;
        const init_v = convertFromAttribute(
          this.constructor.elementProperties, k, att_v
        )
        if (init_v !== null) { 
          this.elementState[k] = init_v
        }
        else {
          this.elementState[k] = this._reactiveState[k];
        }
      }
      if (this.elementTemplate) {
        // For elements that don't use Lit
        this.attachShadow({mode: 'open'});
        html`${this.elementTemplate}`(
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
}

export { toElementState }
