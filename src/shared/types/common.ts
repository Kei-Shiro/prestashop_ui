/**
 * Common primitive types shared across all PrestaShop models.
 * These represent the raw structures returned by the PS API XML parser.
 */

/**
 * Multilingual field as returned by the PS API.
 * A single language returns an object; multiple languages return an array.
 */
export type LangField =
    | string
    | {
          language:
              | { '@_id': number | string; '#text': string }
              | Array<{ '@_id': number | string; '#text': string }>;
      };

/**
 * ID reference with optional xlink attribute (used for association IDs in XML).
 */
export type IdRef =
    | string
    | number
    | { '#text': string | number; '@_xlink:href'?: string };

/**
 * Simple association entry with just an id.
 */
export interface IdOnly {
    id: number | string;
}
