function l_({ title, type, chartData }) {
  const { maxY, ticks, items } = chartData;
  const number = value => value.toLocaleString('es-CO');
  return P.createElement('section', { className: `attendance-card attendance-clean ${type}` },
    P.createElement('h2', null, title),
    P.createElement('div', { className: 'attendance-scroll' },
      P.createElement('div', { className: 'attendance-canvas', style: { '--categories': items.length } },
        P.createElement('div', { className: 'attendance-scale', 'aria-hidden': true },
          ticks.map((tick, index) => P.createElement('span', { key: index }, number(tick)))),
        P.createElement('div', { className: 'attendance-columns' },
          P.createElement('div', { className: 'attendance-guides', 'aria-hidden': true },
            ticks.map((tick, index) => P.createElement('span', { key: index }))),
          items.map((item, index) => P.createElement('div', { className: 'attendance-column', key: index },
            P.createElement('div', { className: 'attendance-reading' },
              P.createElement('strong', null, number(item.total))),
            P.createElement('div', { className: 'attendance-stems', title: `${item.name} ${item.sub}: ${number(item.total)} citas · ${item.percent.toFixed(2)}% del período` },
              P.createElement('div', { className: 'attendance-count-stem', style: { height: `${item.total / maxY * 100}%` } }),
              P.createElement('div', { className: 'attendance-share-track' },
                P.createElement('div', { className: 'attendance-share-stem', style: { height: `${item.percent}%` } }),
                P.createElement('span', {
                  className: `attendance-share ${item.percent < 12 ? 'small-share' : ''}`,
                  style: { bottom: `max(12px, ${item.percent / 2}%)` }
                }, `${item.percent.toFixed(2)}%`))),
            P.createElement('div', { className: 'attendance-caption', title: `${item.name} ${item.sub}` },
              P.createElement('span', null, item.name),
              item.sub && P.createElement('span', null, item.sub))))))),
    P.createElement('div', { className: 'attendance-legend' },
      P.createElement('span', null, P.createElement('i', { className: 'legend-dot primary' }), type === 'yes' ? 'Total Sí' : 'Total No'),
      P.createElement('span', null, P.createElement('i', { className: `legend-dot ${type === 'yes' ? 'cyan' : 'coral'}` }), type === 'yes' ? 'Sí % del período' : 'No % del período')));
}
