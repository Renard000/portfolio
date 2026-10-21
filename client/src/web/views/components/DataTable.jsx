import { Component } from 'react';

const norm = (s) =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

/** Recherche (toutes colonnes) puis tri. Exporté pour être testé sans rendu. */
export function filterSortRows(
  rows,
  columns,
  { query = '', sortKey = null, sortDir = 'asc' }
) {
  let out = rows;
  if (query.trim()) {
    const needle = norm(query.trim());
    out = out.filter((r) => columns.some((c) => norm(c.value(r)).includes(needle)));
  }
  if (sortKey) {
    const col = columns.find((c) => c.key === sortKey);
    if (col) {
      const dir = sortDir === 'desc' ? -1 : 1;
      out = [...out].sort((a, b) => {
        const x = col.value(a);
        const y = col.value(b);
        if (typeof x === 'number' && typeof y === 'number') return dir * (x - y);
        return (
          dir * String(x ?? '').localeCompare(String(y ?? ''), 'fr', { numeric: true })
        );
      });
    }
  }
  return out;
}

/** Tableau maison : recherche, tri, pagination, export CSV (via onExport). */
export default class DataTable extends Component {
  state = { query: '', sortKey: null, sortDir: 'asc', page: 1 };

  setQuery = (e) => this.setState({ query: e.target.value, page: 1 });

  sortBy = (key) =>
    this.setState((s) => ({
      sortKey: key,
      sortDir: s.sortKey === key && s.sortDir === 'asc' ? 'desc' : 'asc',
      page: 1,
    }));

  render() {
    const { rows, columns, pageSize, renderActions, onExport, emptyMessage, caption } =
      this.props;
    const filtered = filterSortRows(rows, columns, this.state);
    const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const page = Math.min(this.state.page, pages); // si la liste rétrécit (suppression)
    const visible = filtered.slice((page - 1) * pageSize, page * pageSize);

    return (
      <div>
        <div className="d-flex flex-wrap gap-2 justify-content-between mb-2">
          <input
            type="search"
            className="form-control w-auto"
            placeholder="Rechercher…"
            aria-label="Rechercher dans le tableau"
            value={this.state.query}
            onChange={this.setQuery}
          />
          {onExport ? (
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => onExport(filtered)}
              disabled={!filtered.length}
            >
              <i className="fa-solid fa-file-csv me-1" aria-hidden="true" /> Exporter CSV
            </button>
          ) : null}
        </div>
        <div className="table-responsive">
          <table className="table table-sm table-hover align-middle">
            {caption ? <caption className="visually-hidden">{caption}</caption> : null}
            <thead>
              <tr>
                {columns.map((c) => (
                  <th
                    key={c.key}
                    scope="col"
                    aria-sort={
                      this.state.sortKey === c.key
                        ? this.state.sortDir === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : undefined
                    }
                  >
                    {c.sortable === false ? (
                      c.label
                    ) : (
                      <button
                        type="button"
                        className="btn btn-link p-0 text-decoration-none fw-bold"
                        onClick={() => this.sortBy(c.key)}
                      >
                        {c.label}
                        {this.state.sortKey === c.key
                          ? this.state.sortDir === 'asc'
                            ? ' ▲'
                            : ' ▼'
                          : ''}
                      </button>
                    )}
                  </th>
                ))}
                {renderActions ? (
                  <th scope="col">
                    <span className="visually-hidden">Actions</span>
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {visible.length ? (
                visible.map((row) => (
                  <tr key={row.id}>
                    {columns.map((c) => (
                      <td key={c.key}>
                        {c.render ? c.render(row) : String(c.value(row) ?? '')}
                      </td>
                    ))}
                    {renderActions ? (
                      <td className="text-end text-nowrap">{renderActions(row)}</td>
                    ) : null}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length + (renderActions ? 1 : 0)}
                    className="text-muted text-center"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <nav
          className="d-flex justify-content-between align-items-center"
          aria-label="Pagination"
        >
          <span className="small text-muted">
            {filtered.length} ligne{filtered.length > 1 ? 's' : ''}
          </span>
          <div className="btn-group btn-group-sm">
            <button
              type="button"
              className="btn btn-outline-secondary"
              disabled={page <= 1}
              onClick={() => this.setState({ page: page - 1 })}
            >
              Précédent
            </button>
            <span className="btn btn-outline-secondary disabled">
              {page} / {pages}
            </span>
            <button
              type="button"
              className="btn btn-outline-secondary"
              disabled={page >= pages}
              onClick={() => this.setState({ page: page + 1 })}
            >
              Suivant
            </button>
          </div>
        </nav>
      </div>
    );
  }
}

DataTable.defaultProps = { rows: [], pageSize: 10, emptyMessage: 'Aucune donnée.' };
