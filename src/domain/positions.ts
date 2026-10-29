export const POSITION_INFO: Record<string, { name: string; description: string }> = {
  MV: { name: 'Målvakt', description: 'Spelar närmast det egna målet.' },
  HB: { name: 'Högerback', description: 'Spelar på höger sida i backlinjen.' },
  MB: { name: 'Mittback', description: 'Spelar centralt i backlinjen.' },
  VB: { name: 'Vänsterback', description: 'Spelar på vänster sida i backlinjen.' },
  DM: { name: 'Defensiv mittfältare', description: 'Spelar på mittfältet framför backlinjen.' },
  CM: { name: 'Central mittfältare', description: 'Spelar centralt på mittfältet.' },
  OM: { name: 'Offensiv mittfältare', description: 'Spelar på mittfältet bakom anfallarna.' },
  HY: { name: 'Högerytter', description: 'Spelar längs högerkanten på mittfältet eller i anfallet.' },
  VY: { name: 'Vänsterytter', description: 'Spelar längs vänsterkanten på mittfältet eller i anfallet.' },
  CF: { name: 'Central anfallare', description: 'Spelar centralt längst fram i laget.' },
};
