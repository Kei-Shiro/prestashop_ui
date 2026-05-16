import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import { arrayExceptions } from './resource-util';

export class Serializer {
  private static parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    parseAttributeValue: true,
    parseTagValue: true,
    isArray: (tagName, jPath) => {
      const parts = (jPath as string).split('.');
      const parent = parts.length >= 2 ? parts[parts.length - 2] : undefined;
      if (arrayExceptions.some(e => e.tag === tagName && e.parent === parent)) return true;
      return parent === tagName + 's';
    },
  });

  private static builder = new XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    format: true,
    indentBy: '  ',
  });

  static toXml(obj: object): string {
    // PrestaShop expects the root to be <prestashop>
    return this.builder.build({ prestashop: obj });
  }

  static fromXml<T>(xml: string): T {
    return this.parser.parse(xml);
  }

}