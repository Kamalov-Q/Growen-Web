/**
 * Legal copy as DATA, not as JSX.
 *
 * The alternative — writing each policy as a component per language — means
 * the Uzbek and the Russian drift apart the first time somebody edits one of
 * them, and nothing catches it. Here the shape is typed and shared, both
 * languages render through the same component with the same spacing, heading
 * levels and anchor ids, and `assertParity` in ./index.ts fails the BUILD if
 * one language gains or loses a section the other does not.
 *
 * It also keeps these pages at zero client JavaScript: this is plain data
 * read on the server and emitted as HTML.
 */

export type LegalBlock =
  | { readonly kind: "p"; readonly text: string }
  | { readonly kind: "ul"; readonly items: readonly string[] }
  | {
      /**
       * A two-column fact table — "what we keep / for how long". Prose hides
       * this kind of information; a reader scanning for one retention period
       * should not have to read a paragraph to find it.
       */
      readonly kind: "table";
      readonly head: readonly [string, string];
      readonly rows: readonly (readonly [string, string])[];
    }
  | {
      /** A callout for the one or two things a reader must not miss. */
      readonly kind: "note";
      readonly text: string;
    };

export interface LegalSection {
  /** Stable across languages — it is the anchor and the table-of-contents key. */
  readonly id: string;
  readonly heading: string;
  readonly blocks: readonly LegalBlock[];
}

export interface LegalDocument {
  readonly title: string;
  /** One sentence under the title. Also the page's meta description. */
  readonly summary: string;
  readonly sections: readonly LegalSection[];
}
