// Placeholder data only: one lorem-ipsum name and 1234-pattern numbers. No real people or accounts.

export type BankId = 'blu';

export const BANKS: Record<BankId, { name: string }> = {
  blu: { name: 'بلو (بانک سامان)' },
};

export type Gender = 'f' | 'm';

export interface Recipient {
  id: string;
  name: string;
  gender: Gender;
  bank: BankId;
  /** Display-only placeholder account number. */
  number: string;
}

export const PLACEHOLDER_NUMBER = '123412341234';

export const RECIPIENT: Recipient = { id: 'r1', name: 'لورم ایپسوم', gender: 'f', bank: 'blu', number: PLACEHOLDER_NUMBER };

export const TRANSFER_AMOUNT = 123_412; // rial

export interface Account {
  id: string;
  name: string;
  caption: string;
  balance: number; // rial
}

export const INITIAL_ACCOUNTS: Account[] = [
  { id: 'main', name: 'حساب بلو', caption: 'حساب اصلی', balance: 123_412_341 },
  { id: 'pocket', name: 'جیب سفر', caption: 'جیب پس‌انداز', balance: 12_341_234 },
];

export type MethodId = 'blu';

export interface Method {
  id: MethodId;
  title: string;
  fee: number;
  eta: string;
}

export const METHOD: Method = { id: 'blu', title: 'بلو به بلو', fee: 0, eta: 'در لحظه' };
