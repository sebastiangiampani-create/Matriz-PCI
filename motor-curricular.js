(() => {
  'use strict';

  const AREAS_SOCIALES = ['FEC', 'Geografia', 'Historia', 'Filosofia', 'Economia'];
  const AREAS_NATURALES = ['Biologia', 'Fisico-quimica', 'Fisica', 'Quimica'];
  const AREA_TECNOLOGIA = ['Tecnologias'];

  const normalize = (value) => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

  function canonicalArea(value) {
    const n = normalize(value);
    if (n.includes('social')) return 'Ciencias Sociales';
    if (n.includes('natural')) return 'Ciencias Naturales';
    if (n.includes('tecnolog')) return 'Tecnologias';
    return value || '';
  }

  function safeArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function inferTerm(group, index, area) {
    const explicit = Number(group?.term);
    if (explicit >= 1 && explicit <= 10) return explicit;
    if (['Lengua y Literatura', 'Matematica', 'Lenguas Adicionales'].includes(area)) {
      return Math.min(index * 2 + 1, 10);
    }
    return Math.min(index + 1, 10);
  }

  function flattenOffer(app) {
    const offer = [];
    Object.entries(app?.areas || {}).forEach(([area, areaData]) => {
      safeArray(areaData?.groups).forEach((group, index) => {
        offer.push({
          id: group.id || `${area}-${index}`,
          source: 'obligatorio',
          area: canonicalArea(area),
          originalArea: area,
          name: group.name || `Agrupamiento ${index + 1}`,
          kind: group.format || group.kind || (area.includes('Tecnolog') ? 'Taller' : area.includes('Ciencias') ? 'Laboratorio' : 'Nivel'),
          mandatory: !group.custom,
          elective: !!group.elective || !!group.custom,
          term: inferTerm(group, index, area),
          hours: Number(group.hours || group.weeklyHours || 0),
          items: safeArray(group.items),
          objective: group.objective || '',
          context: group.context || '',
          raw: group
        });
      });
    });

    safeArray(app?.otherFormats).forEach((group, index) => {
      const areas = safeArray(group.areas?.length ? group.areas : [group.sourceArea]).filter(Boolean).map(canonicalArea);
      offer.push({
        id: group.id || `other-${index}`,
        source: 'otro_formato',
        area: areas[0] || '',
        areas,
        originalArea: areas[0] || '',
        name: group.name || `Otro formato ${index + 1}`,
        kind: group.formatType || group.kind || 'Otro formato curricular',
        mandatory: false,
        elective: group.character === 'Electivo',
        term: Number(group.term) || 1,
        hours: Number(group.hours || group.weeklyHours || 0),
        items: safeArray(group.items),
        objective: group.objective || '',
        context: group.context || '',
        raw: group
      });
    });

    return offer;
  }

  function contentCoverage(data, offer) {
    const relevantAreas = ['Ciencias Sociales', 'Ciencias Naturales', 'Tecnologias'];
    const result = {};
    relevantAreas.forEach(area => {
      const contents = safeArray(data).filter(item => canonicalArea(item.area) === area);
      const used = new Map();
      offer.forEach(space => {
        const areas = space.areas?.length ? space.areas : [space.area];
        if (!areas.includes(area)) return;
        space.items.forEach(id => {
          if (!used.has(id)) used.set(id, []);
          used.get(id).push(space.id);
        });
      });
      const pending = contents.filter(item => !used.has(item.id));
      result[area] = {
        total: contents.length,
        covered: contents.length - pending.length,
        pending,
        duplicated: [...used.entries()].filter(([, locations]) => locations.length > 1).map(([id, locations]) => ({ id, locations })),
        percent: contents.length ? Math.round(((contents.length - pending.length) / contents.length) * 100) : 0
      };
    });
    return result;
  }

  function subjectsForArea(area) {
    if (area === 'Ciencias Sociales') return AREAS_SOCIALES;
    if (area === 'Ciencias Naturales') return AREAS_NATURALES;
    if (area === 'Tecnologias') return AREA_TECNOLOGIA;
    return [];
  }

  function expectedHoursByTerm(rules) {
    const hours = {};
    const plan = rules?.carga_horaria_formacion_general || {};
    ['Ciencias Sociales', 'Ciencias Naturales', 'Tecnologias'].forEach(area => {
      hours[area] = {};
      for (let term = 1; term <= 10; term += 1) {
        const yearIndex = Math.ceil(term / 2) - 1;
        hours[area][term] = subjectsForArea(area).reduce((sum, subject) => {
          return sum + Number(safeArray(plan[subject])[yearIndex] || 0);
        }, 0);
      }
    });
    return hours;
  }

  function assignedHoursByTerm(offer) {
    const hours = {};
    ['Ciencias Sociales', 'Ciencias Naturales', 'Tecnologias'].forEach(area => {
      hours[area] = {};
      for (let term = 1; term <= 10; term += 1) hours[area][term] = 0;
    });
    offer.forEach(space => {
      const areas = space.areas?.length ? space.areas : [space.area];
      areas.forEach(area => {
        if (!hours[area]) return;
        hours[area][space.term] += Number(space.hours || 0);
      });
    });
    return hours;
  }

  function hourlyValidation(expected, assigned) {
    const result = {};
    Object.keys(expected).forEach(area => {
      result[area] = {};
      for (let term = 1; term <= 10; term += 1) {
        const planned = Number(expected[area][term] || 0);
        const actual = Number(assigned[area][term] || 0);
        const difference = actual - planned;
        result[area][term] = {
          planned,
          actual,
          difference,
          status: difference === 0 ? 'ok' : difference < 0 ? 'faltan_horas' : 'exceso_horas'
        };
      }
    });
    return result;
  }

  function mandatoryPriority(offer, coverage) {
    const result = {};
    ['Ciencias Sociales', 'Ciencias Naturales', 'Tecnologias'].forEach(area => {
      const mandatory = offer.filter(space => space.area === area && space.mandatory);
      const mandatoryUsed = new Set(mandatory.flatMap(space => space.items));
      const total = coverage[area]?.total || 0;
      result[area] = {
        mandatorySpaces: mandatory.length,
        contentsCoveredInMandatory: mandatoryUsed.size,
        totalContents: total,
        percentInMandatory: total ? Math.round((mandatoryUsed.size / total) * 100) : 0
      };
    });
    return result;
  }

  function recommendations(report) {
    const list = [];
    Object.entries(report.coverage).forEach(([area, value]) => {
      if (value.pending.length) {
        list.push({
          severity: 'error',
          area,
          type: 'contenido',
          message: `${area}: faltan ${value.pending.length} contenidos priorizados por cubrir.`
        });
      }
    });
    Object.entries(report.hours).forEach(([area, terms]) => {
      Object.entries(terms).forEach(([term, value]) => {
        if (value.status === 'faltan_horas') {
          list.push({
            severity: 'warning',
            area,
            term: Number(term),
            type: 'horas',
            message: `${area} C${term}: faltan ${Math.abs(value.difference)} horas semanales.`
          });
        }
        if (value.status === 'exceso_horas') {
          list.push({
            severity: 'error',
            area,
            term: Number(term),
            type: 'horas',
            message: `${area} C${term}: hay un exceso de ${value.difference} horas semanales.`
          });
        }
      });
    });
    return list;
  }

  function evaluate({ app, data, rules }) {
    const offer = flattenOffer(app || {});
    const coverage = contentCoverage(data || [], offer);
    const expected = expectedHoursByTerm(rules || {});
    const assigned = assignedHoursByTerm(offer);
    const hours = hourlyValidation(expected, assigned);
    const priority = mandatoryPriority(offer, coverage);
    const report = { offer, coverage, expectedHours: expected, assignedHours: assigned, hours, priority };
    report.recommendations = recommendations(report);
    report.valid = report.recommendations.every(item => item.severity !== 'error' && item.severity !== 'warning');
    return report;
  }

  window.MotorCurricular = {
    version: '0.1.0',
    evaluate,
    flattenOffer,
    contentCoverage,
    expectedHoursByTerm,
    assignedHoursByTerm,
    hourlyValidation
  };
})();
