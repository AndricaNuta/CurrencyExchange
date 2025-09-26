export type Item = { code?: string; name?: string };

export const normalize = (s?: string) =>
  (s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim();

export const filterByQuery = (q: string) => {
  const qn = normalize(q);
  return (i: Item) => {
    if (!i) return false;
    const code = (i.code ?? '').toLowerCase();
    const name = normalize(i.name);
    if (!qn) return true;   // empty query → match all
    return code.includes(qn) || name.includes(qn);
  };
};
