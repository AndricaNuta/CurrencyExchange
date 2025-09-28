import af from './af.json';
import ar from './ar.json';
import az from './az.json';
import be from './be.json';
import bg from './bg.json';
import bn from './bn.json';
import bs from './bs.json';
import ca from './ca.json';
import cs from './cs.json';
import da from './da.json';
import de from './de.json';
import el from './el.json';
import en from './en.json';
import es from './es.json';
import et from './et.json';
import fa_IR from './fa_IR.json';
import fi from './fi.json';
import fr from './fr.json';
import gu_IN from './gu_IN.json';
import he from './he.json';
import hi from './hi.json';
import hr from './hr.json';
import hu from './hu.json';
import hy from './hy.json';
import id from './id.json';
import is from './is.json';
import it from './it.json';
import ja from './ja.json';
import ka_GE from './ka_GE.json';
import kk from './kk.json';
import kn from './kn.json';
import ko from './ko.json';
import ky from './ky.json';
import lo from './lo.json';
import lt from './lt.json';
import lv from './lv.json';
import mi_MT from './mi_MT.json';
import mk_MK from './mk_MK.json';
import ml from './ml.json';
import mn_MN from './mn_MN.json';
import mr from './mr.json';
import ms_MY from './ms_MY.json';
import my from './my.json';
import ne_NP from './ne_NP.json';
import nl from './nl.json';
import pa from './pa.json';
import pl_PL from './pl_PL.json';
import pt from './pt.json';
import ro from './ro.json';
import ru from './ru.json';
import si from './si.json';
import sk from './sk.json';
import sl from './sl.json';
import sq from './sq.json';
import sr from './sr.json';
import sv from './sv.json';
import sw from './sw.json';
import ta from './ta.json';
import te from './te.json';
import th from './th.json';
import tr from './tr.json';
import uk from './uk.json';
import ur from './ur.json';
import uz from './uz.json';
import vi from './vi.json';
import zh_CN from './zh_CN.json';
import zh_Hant_CN from './zh_Hant_CN.json';
import zh_Hant_HK from './zh_Hant_HK.json';

export const translations = {
  af,
  ar,
  az,
  be,
  bg,
  bn,
  bs,
  ca,
  cs,
  da,
  de,
  el,
  en,
  es,
  et,
  fa_IR,
  fi,
  fr,
  gu_IN,
  he,
  hi,
  hr,
  hu,
  hy,
  id,
  is,
  it,
  ja,
  ka_GE,
  kk,
  kn,
  ko,
  ky,
  lo,
  lt,
  lv,
  mi_MT,
  mk_MK,
  ml,
  mn_MN,
  mr,
  ms_MY,
  my,
  ne_NP,
  nl,
  pa,
  pl_PL,
  pt,
  ro,
  ru,
  si,
  sk,
  sl,
  sq,
  sr,
  sv,
  sw,
  ta,
  te,
  th,
  tr,
  uk,
  ur,
  uz,
  vi,
  zh_CN,
  zh_Hant_CN,
  zh_Hant_HK,
} as const;

export type LocaleKey = keyof typeof translations;

export const i18nResources = Object.fromEntries(
  Object.entries(translations).map(([k, v]) => [k, {
    translation: v
  }])
) as Record<LocaleKey, { translation: Record<string, any> }>;

// Optional: list of supported languages you can pass to i18next
export const supportedLngs = Object.keys(i18nResources) as LocaleKey[];

export default translations;
