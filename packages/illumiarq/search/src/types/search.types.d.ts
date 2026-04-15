/**
 * Core types for @illumiarq/search.
 *
 * SearchableDoc  — the document shape expected by buildSearchIndex()
 * SearchIndex    — the serialisable index written to bootstrap/cache/search.index.json
 * SearchResult   — a single ranked result returned by queryIndex()
 */
/** A document that can be indexed for full-text search. */
export interface SearchableDoc {
    /** URL slug, e.g. "/docs/routing" */
    slug: string;
    /** Page title */
    title: string;
    /** Top-level section label, e.g. "Getting Started" */
    section: string;
    /** Short description / meta summary */
    description: string;
    /** Additional keywords (optional) */
    keywords?: string[];
}
/** The serialisable search index written to disk by buildSearchIndex(). */
export interface SearchIndex {
    /** All indexed documents */
    pages: SearchableDoc[];
    /** ISO-8601 timestamp when the index was built */
    createdAt: string;
}
/** A ranked search result returned by queryIndex(). */
export interface SearchResult {
    slug: string;
    title: string;
    section: string;
    description: string;
    /** Relevance score — higher is better */
    score: number;
}
//# sourceMappingURL=search.types.d.ts.map