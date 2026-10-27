// Every route registered on the Express app, with the guards in front of it: [{ method, path, auth, roles, other }].
// Found by walking the router stack (Express 4). A guard mounted with router.use(path, guard, ...) protects the
// routes under that path; a guard listed in the route itself protects that route.
//   auth   true when authMiddleware runs before the handler
//   roles  e.g. ['requireRoles(ADMIN)']  (requireRoles names its guard function)
//   other  other known guards: requireSuperAdmin, requireAdmin, attachFranchiseScope, scopeIfAdmin
const KNOWN_OTHER = new Set(['requireSuperAdmin', 'requireAdmin', 'attachFranchiseScope', 'scopeIfAdmin']);

function mountPath(layer) {
    if (layer.regexp?.fast_slash) return '';
    const m = (layer.regexp?.source || '')
        .replace('\\/?(?=\\/|$)', '')
        .replace(/^\^/, '')
        .replace(/\$$/, '')
        .replace(/\\\//g, '/');
    let i = 0;
    return m.replace(/\(\?:\(\[\^\/\]\+\?\)\)/g, () => `:${layer.keys?.[i++]?.name || 'p'}`);
}

const classify = (name, into) => {
    if (name === 'authMiddleware') into.auth = true;
    else if (name.startsWith('requireRoles(')) into.roles.push(name);
    else if (KNOWN_OTHER.has(name)) into.other.push(name);
};

export function listRoutes(app) {
    const out = [];
    const walk = (stack, prefix, inherited) => {
        const pending = []; // guards mounted earlier in this stack: { at, name }
        for (const layer of stack) {
            if (layer.route) {
                const paths = Array.isArray(layer.route.path) ? layer.route.path : [layer.route.path];
                for (const p of paths) {
                    const guards = { auth: inherited.auth, roles: [...inherited.roles], other: [...inherited.other] };
                    for (const g of pending) if (g.at === '' || String(p).startsWith(g.at)) classify(g.name, guards);
                    for (const l of layer.route.stack) classify(l.name || '', guards);
                    for (const method of Object.keys(layer.route.methods)) out.push({ method: method.toUpperCase(), path: `${prefix}${p}`, ...guards });
                }
            } else if (layer.name === 'router' && layer.handle?.stack) {
                const at = mountPath(layer);
                const guards = { auth: inherited.auth, roles: [...inherited.roles], other: [...inherited.other] };
                for (const g of pending) if (g.at === '' || at.startsWith(g.at) || g.at.startsWith(at)) classify(g.name, guards);
                walk(layer.handle.stack, prefix + at, guards);
            } else {
                pending.push({ at: mountPath(layer), name: layer.handle?.name || '' });
            }
        }
    };
    walk((app._router || app.router).stack, '', { auth: false, roles: [], other: [] });
    return out;
}
