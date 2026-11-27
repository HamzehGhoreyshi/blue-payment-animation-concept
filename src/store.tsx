import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { INITIAL_ACCOUNTS, METHOD, PLACEHOLDER_NUMBER, RECIPIENT, TRANSFER_AMOUNT, type Account, type Recipient } from './lib/data';
import { jalaliDateTime } from './lib/format';

/** Two screens only: review/confirm and the result. */
export type View = 'review' | 'success';

export interface Draft {
  recipient: Recipient;
  amount: number;
  accountId: string;
  note: string;
}

export interface Receipt {
  recipient: Recipient;
  amount: number;
  fee: number;
  methodTitle: string;
  accountName: string;
  note: string;
  tracking: string;
  date: string;
  time: string;
}

const START: Draft = { recipient: RECIPIENT, amount: TRANSFER_AMOUNT, accountId: 'main', note: '' };

function useStoreValue() {
  const [view, setView] = useState<View>('review');
  const [dir, setDir] = useState<1 | -1>(1);
  const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS);
  const [draft, setDraft] = useState<Draft>(START);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [simulateError, setSimulateError] = useState(false);
  const [pendingNotice, setPendingNotice] = useState<Receipt | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  const patch = useCallback((p: Partial<Draft>) => setDraft((d) => ({ ...d, ...p })), []);

  /** Simulated bank call. Resolves after a short delay; nothing leaves the browser. */
  const submit = useCallback(async (): Promise<boolean> => {
    await new Promise((r) => setTimeout(r, 1600));
    if (simulateError) {
      setSimulateError(false); // fail once, so “try again” succeeds
      return false;
    }
    const account = accounts.find((a) => a.id === draft.accountId)!;
    const { date, time } = jalaliDateTime();
    setAccounts((as) => as.map((a) => (a.id === account.id ? { ...a, balance: a.balance - draft.amount - METHOD.fee } : a)));
    setReceipt({ recipient: draft.recipient, amount: draft.amount, fee: METHOD.fee, methodTitle: METHOD.title, accountName: account.name, note: draft.note, tracking: PLACEHOLDER_NUMBER, date, time });
    return true;
  }, [draft, accounts, simulateError]);

  const showSuccess = useCallback(() => {
    setDir(1);
    setView('success');
  }, []);

  /** Back to the review screen for another run; the island shows the last receipt. */
  const finish = useCallback(() => {
    setPendingNotice(receipt);
    setDir(-1);
    setDraft(START);
    setView('review');
  }, [receipt]);

  const account = accounts.find((a) => a.id === draft.accountId)!;

  return {
    view, dir, accounts, account, draft, receipt, simulateError, pendingNotice, helpOpen,
    patch, submit, showSuccess, finish, setSimulateError, setPendingNotice, setHelpOpen,
  };
}

type Store = ReturnType<typeof useStoreValue>;
const Ctx = createContext<Store | null>(null);
export const useStore = () => useContext(Ctx)!;

export function StoreProvider({ children }: { children: ReactNode }) {
  const value = useStoreValue();
  const memo = useMemo(() => value, [value]);
  return <Ctx.Provider value={memo}>{children}</Ctx.Provider>;
}
