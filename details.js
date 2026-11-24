// Click an experience row to open its details (content/<slug>.md rendered as Markdown).
(function () {
    var dlg = document.getElementById('detail');
    if (!dlg || !window.marked || !window.DOMPurify) return;
    var $ = function (id) { return document.getElementById(id); };
    var cache = {};

    function load(slug) {
        if (slug in cache) return Promise.resolve(cache[slug]);
        return fetch('content/' + slug + '.md', { cache: 'no-cache' })
            .then(function (r) { return r.ok ? r.text() : ''; })
            .catch(function () { return ''; })
            .then(function (t) { cache[slug] = t; return t; });
    }

    function stripFront(t) { return t.replace(/^---[\s\S]*?\n---\s*/, '').trim(); }

    function render(md) {
        md = md.replace(/^---[\s\S]*?\n---\s*/, '');
        var html = DOMPurify.sanitize(marked.parse(md));
        var box = document.createElement('div');
        box.innerHTML = html;
        box.querySelectorAll('a[href^="http"]').forEach(function (a) {
            a.target = '_blank'; a.rel = 'noopener';
        });
        box.querySelectorAll('img').forEach(function (i) { i.loading = 'lazy'; });
        return box.innerHTML;
    }

    // Rows with no content stay plain; rows with content get a chevron.
    document.querySelectorAll('.item[data-slug]').forEach(function (row) {
        load(row.dataset.slug).then(function (t) {
            if (stripFront(t)) row.classList.add('expandable');
            else row.disabled = true;
        });

        row.addEventListener('click', function () {
            load(row.dataset.slug).then(function (t) {
                if (!stripFront(t)) return;
                $('detail-logo').src = row.querySelector('.logo').src;
                $('detail-title').textContent = row.querySelector('.item-title').textContent;
                $('detail-sub').textContent = row.querySelector('.item-sub').textContent;
                $('detail-date').textContent = row.querySelector('.item-date').textContent;
                $('detail-body').innerHTML = render(t);
                var v = $('detail-visit');
                if (row.dataset.url) { v.href = row.dataset.url; v.hidden = false; } else { v.hidden = true; }
                dlg.showModal();
                dlg.scrollTop = 0;
                $('detail-close').focus();
            });
        });
    });

    $('detail-close').addEventListener('click', function () { dlg.close(); });
    // Click on the dimmed backdrop closes it.
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
})();
