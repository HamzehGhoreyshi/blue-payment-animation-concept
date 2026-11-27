// Persian formatting helpers.

const FA = '۰۱۲۳۴۵۶۷۸۹';

/** Latin / Arabic-Indic digits → Persian digits. */
export const fa = (v: string | number) =>
  String(v).replace(/[0-9]/g, (d) => FA[+d]).replace(/[٠-٩]/g, (d) => FA[d.charCodeAt(0) - 0x0660]);

/** 150000 → «۱۵۰٬۰۰۰» */
export const money = (n: number) => fa(Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '٬'));

/** «۱۲۳۴ ۱۲۳۴ ۱۲۳۴» */
export const group4 = (digits: string) => fa(digits.replace(/(.{4})/g, '$1 ').trim());

export const jalaliDateTime = (d = new Date()) => {
  const date = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { year: 'numeric', month: 'long', day: 'numeric' }).format(d);
  const time = new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit', hour12: false }).format(d);
  return { date, time };
};
