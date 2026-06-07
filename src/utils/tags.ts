import { getCollection, type CollectionEntry } from 'astro:content';

export type DocEntry = CollectionEntry<'docs'>;

export interface TagIndexItem {
	tag: string;
	slug: string;
	entries: DocEntry[];
}

const collator = new Intl.Collator('zh-CN');

export function tagToSlug(tag: string) {
	return tag;
}

export function getDocUrl(entry: DocEntry) {
	const id = entry.id.replace(/(^|\/)index$/, '$1').replace(/\/$/, '');
	return id ? `/${id}/` : '/';
}

export async function getTagIndex(): Promise<TagIndexItem[]> {
	const docs = await getCollection('docs', (entry) => !entry.data.draft);
	const tagMap = new Map<string, DocEntry[]>();

	for (const entry of docs) {
		const tags = new Set(entry.data.tags.map((tag) => tag.trim()).filter(Boolean));

		for (const tag of tags) {
			const entries = tagMap.get(tag) ?? [];
			entries.push(entry);
			tagMap.set(tag, entries);
		}
	}

	return Array.from(tagMap, ([tag, entries]) => ({
		tag,
		slug: tagToSlug(tag),
		entries: entries.sort((a, b) => collator.compare(a.data.title, b.data.title)),
	})).sort((a, b) => collator.compare(a.tag, b.tag));
}
