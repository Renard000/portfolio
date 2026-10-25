import { PureComponent } from 'react';

const SHAPES = {
  0: [
    ['b', 8, 12, 84, 0, 9],
    ['u', 8, 30, 50, 38],
    ['u', 62, 30, 30, 38],
    ['b', 8, 76, 40, 0, 9],
  ],
  1: [
    ['b', 34, 8, 32, 84, 0, 22],
    ['u', 38, 16, 24, 30],
    ['u', 38, 52, 24, 0, 8],
    ['u', 38, 64, 15, 0, 8],
  ],
  2: [
    ['u', 10, 55, 12, 35],
    ['u', 28, 30, 12, 60],
    ['u', 46, 45, 12, 45],
    ['b', 64, 15, 26, 75],
  ],
};

/** Vignette : vraie image si fournie, sinon petite illustration dessinée en CSS. */
export default class Thumb extends PureComponent {
  render() {
    const { color, kind = 0, height = 220, imageUrl, alt = '' } = this.props;
    return (
      <div className="pf-th pf-th--zoom" style={{ '--c': color, '--h': `${height}px` }}>
        {imageUrl ? (
          <img src={imageUrl} alt={alt} loading="lazy" />
        ) : (
          (SHAPES[kind] || SHAPES[0]).map(([tag, l, t, w, h, r], i) => {
            const style = {
              left: `${l}%`,
              top: `${t}%`,
              width: `${w}%`,
              height: h ? `${h}%` : '9px',
            };
            if (r) style.borderRadius = r;
            return tag === 'b' ? (
              <b key={i} style={style} />
            ) : (
              <u key={i} style={style} />
            );
          })
        )}
      </div>
    );
  }
}
