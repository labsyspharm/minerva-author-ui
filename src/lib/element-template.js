import { html } from '@arrow-js/core';

const mergeTemplates = (templates1, templates2) => {
  const center = [
    templates1.pop() , templates2.shift()
  ].filter(x => x).join('');
  return [...templates1, center, ...templates2];
}

const addAttributes = (
    tag, templates_in, values_in, attributes={}
) => {
  const values = (
      Object.values(attributes).concat(values_in)
  )
  const att_list = Object.keys(attributes).reduce(
    ([...att_list], att) => mergeTemplates(
      att_list, [` ${att}="`, '"']
    ), [`<${tag}`]
  );
  const templates_out = mergeTemplates(
    mergeTemplates(att_list, ['>']),
    mergeTemplates(templates_in, [`</${tag}>`])
  )
  return [ templates_out, ...values ];
}

const toElement = (tag) => {
  return ([...templates_in], ...values_in) => {
    return (attributes) => {
      return html(...addAttributes(
        tag, templates_in, values_in, attributes 
      ));
    }
  }
}

export { toElement }
