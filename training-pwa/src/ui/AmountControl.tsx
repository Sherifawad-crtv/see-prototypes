import type { Amount } from '../domain/types.ts';
import { MAX_AMOUNT, MIN_AMOUNT } from '../store/reducer.ts';
import { IconButton, Toggle } from './controls.tsx';
import { Icon } from './icons.tsx';

interface AmountControlProps {
  amount: Amount;
  lastCount: number;
  onChange: (amount: Amount) => void;
  large?: boolean;
}

export function AmountControl({ amount, lastCount, onChange, large = false }: AmountControlProps) {
  const isBasket = amount.kind === 'basket';
  const n = amount.kind === 'count' ? amount.n : lastCount;
  const set = (value: number) =>
    onChange({ kind: 'count', n: Math.min(MAX_AMOUNT, Math.max(MIN_AMOUNT, value)) });

  return (
    <div className={`amount${large ? ' amount-large' : ''}`}>
      {isBasket ? (
        <span className={`amount-basket ${large ? 't-h3' : 't-body-b'}`}>Until the basket is empty</span>
      ) : (
        <div className="stepper">
          <IconButton label="Fewer shots" disabled={n <= MIN_AMOUNT} onClick={() => set(n - 1)}>
            <Icon name="remove" size={26} />
          </IconButton>
          <output className={`${large ? 't-stat-lg' : 't-stat-sm'} stepper-value`} aria-label="Number of shots">
            {n}
          </output>
          <IconButton label="More shots" disabled={n >= MAX_AMOUNT} onClick={() => set(n + 1)}>
            <Icon name="add" size={26} />
          </IconButton>
        </div>
      )}
      <label className="amount-toggle">
        <span className="t-label-sm">Basket</span>
        <Toggle
          label="Basket"
          checked={isBasket}
          onChange={(on) => (on ? onChange({ kind: 'basket' }) : set(lastCount))}
        />
      </label>
    </div>
  );
}
