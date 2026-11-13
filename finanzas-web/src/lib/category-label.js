const labels = new Map([
  ['Freelance / Proyecto', 'Freelance y proyectos'],
  ['Negocio Propio', 'Negocio propio'],
  ['Inversión / Dividendos', 'Inversiones y dividendos'],
  ['Bono / Extra', 'Bonos y extras'],
  ['Otro Ingreso', 'Otro ingreso'],
  ['Ocio / Entretenimiento', 'Entretenimiento'],
  ['Taxi / Uber', 'Taxi o Uber'],
  ['Otro Egreso', 'Otro egreso'],
])

export function categoryLabel(name) {
  return labels.get(name) ?? name
}
