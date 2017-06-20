import * as _ from 'lodash';
import { ControlElement } from '../../models/uischema';
import { JsonFormsElement } from '../../json-forms';
import { Renderer } from '../../core/renderer';
import { DataChangeListener} from '../../core/data.service';
import { JsonFormsRenderer } from '../renderer.util';
import { resolveSchema } from '../../path.util';
import { JsonSchema } from '../../models/jsonSchema';
import { getElementLabelObject } from '../label.util';
import { RankedTester, rankWith, and, uiTypeIs, schemaMatches } from '../../core/testers';
import { JsonForms } from '../../core';

/**
 * Default tester for an array control.
 * @type {RankedTester}
 */
export const arrayTester: RankedTester = rankWith(2, and(
    uiTypeIs('Control'),
    schemaMatches(schema =>
        !_.isEmpty(schema)
        && schema.type === 'array'
        && !_.isEmpty(schema.items)
        && !Array.isArray(schema.items) // we don't care about tuples
        && (schema.items as JsonSchema).type === 'object'
    ))
);

/**
 * Default renderer for an array.
 */
@JsonFormsRenderer({
  selector: 'jsonforms-array',
  tester: arrayTester
})
export class ArrayControlRenderer extends Renderer implements DataChangeListener {

  constructor() {
    super();
  }

  /**
   * @inheritDoc
   */
  needsNotificationAbout (controlElement: ControlElement): boolean {
    return controlElement === undefined || controlElement === null
    ? false : (<ControlElement>this.uischema).scope.$ref === controlElement.scope.$ref;
  }

  /**
   * @inheritDoc
   */
  dataChanged(uischema: ControlElement, newValue: any, data: any): void {
    this.render();
  }

  /**
   * @inheritDoc
   */
  connectedCallback(): void {
    super.connectedCallback();
    this.dataService.registerDataChangeListener(this);
  }

  /**
   * @inheritDoc
   */
  disconnectedCallback(): void {
    this.dataService.deregisterDataChangeListener(this);
    super.disconnectedCallback();
  }

  /**
   * @inheritDoc
   */
  dispose(): void {
    // do nothing
  }

  /**
   * @inheritDoc
   */
  render(): HTMLElement {
    this.classList.add('control');
    if (this.lastChild !== null) {
      this.removeChild(this.lastChild);
    }
    const controlElement = <ControlElement> this.uischema;
    const div = document.createElement('fieldset');
    div.className = 'array-layout';

    const header = document.createElement('legend');
    div.appendChild(header);
    const label = document.createElement('label');
    const labelObject = getElementLabelObject(this.dataSchema, controlElement);
    if (labelObject.show) {
      label.textContent = labelObject.text;
    }
    header.appendChild(label);

    const content = document.createElement('div');
    content.classList.add('children');
    let arrayData = this.dataService.getValue(controlElement);

    const renderChild = (element: Object): void => {
      const jsonForms = <JsonFormsElement>document.createElement('json-forms');
      const resolvedSchema = resolveSchema(this.dataSchema, controlElement.scope.$ref + '/items');
      jsonForms.data = element;
      jsonForms.dataSchema = resolvedSchema;
      content.appendChild(jsonForms);
    };

    if (arrayData !== undefined) {
      arrayData.forEach(element => renderChild(element));
    }
    div.appendChild(content);

    const button = document.createElement('button');
    button.className = JsonForms.stylingRegistry.getAsClassName('button');
    button.textContent = `Add to ${labelObject.text}`;
    button.onclick = (ev: Event) => {
      if (arrayData === undefined) {
        arrayData = [];
      }
      const element = {};
      arrayData.push(element);
      renderChild(element);
      this.dataService.notifyAboutDataChange(controlElement, arrayData);
    };

    header.appendChild(button);
    this.appendChild(div);
    return this;
  }
}