import { PureComponent } from 'react';

/** Version anglaise facultative d'un contenu ; un champ vide retombe sur le français. */
export default class EnglishFields extends PureComponent {
  set = (key) => (e) =>
    this.props.onChange({ ...this.props.value, [key]: e.target.value });

  render() {
    const { fields, value, idPrefix } = this.props;
    const filled = Object.values(value).some(Boolean);
    return (
      <details className="col-12 pf-en" open={filled}>
        <summary>Version anglaise (facultatif)</summary>
        <div className="row g-3 mt-1">
          {fields.map((f) => {
            const id = `${idPrefix}-en-${f.key}`;
            return (
              <div key={f.key} className={f.rows ? 'col-12' : 'col-md-6'}>
                <label htmlFor={id} className="form-label">
                  Anglais : {f.label}
                </label>
                {f.rows ? (
                  <textarea
                    id={id}
                    className="form-control"
                    rows={f.rows}
                    value={value[f.key] || ''}
                    onChange={this.set(f.key)}
                  />
                ) : (
                  <input
                    id={id}
                    className="form-control"
                    value={value[f.key] || ''}
                    onChange={this.set(f.key)}
                  />
                )}
              </div>
            );
          })}
        </div>
      </details>
    );
  }
}
EnglishFields.defaultProps = { value: {}, idPrefix: 'item' };
