interface Env {
    DB: D1Database;
}

interface PageViewRequest {
    path?: unknown;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
	try {
		if (!env.DB) {
			return Response.json({ error: 'D1 binding DB is missing' }, { status: 500 });
		}

		let body: PageViewRequest;

		try {
			body = await request.json();
		} catch {
			return Response.json({ error: 'Invalid JSON' }, { status: 400 });
		}

		const path = normalizePath(body.path);

		if (!path) {
			return Response.json({ error: 'Invalid path' }, { status: 400 });
		}

		await env.DB.prepare(`
			INSERT INTO page_views (path, views, updated_at)
			VALUES (?, 1, datetime('now'))
			ON CONFLICT(path) DO UPDATE SET
				views = views + 1,
				updated_at = datetime('now')
		`)
			.bind(path)
			.run();

		const row = await env.DB.prepare(`
			SELECT views FROM page_views WHERE path = ?
		`)
			.bind(path)
			.first<{ views: number }>();

		return Response.json({
			path,
			views: row?.views ?? 0,
		});
	} catch (error) {
		return Response.json(
			{
				error: 'Page view function failed',
				message: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 }
		);
	}
};

function normalizePath(value: unknown) {
    if (typeof value !== 'string') return null;

    try {
        const url = new URL(value, 'https://example.com');
        const path = url.pathname;

        if (!path.startsWith('/')) return null;
        if (path.startsWith('/api/')) return null;
        if (path.length > 300) return null;

        return path.endsWith('/') ? path : `${path}/`;
    } catch {
        return null;
    }
}
