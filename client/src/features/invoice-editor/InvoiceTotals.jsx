import { inr, profitText } from '@/shared/lib';

// Shows totals. Intra-State => CGST + SGST, Inter-State => IGST
export default function InvoiceTotals({ calc, supplyType, discountPercent = 0, showProfit = true }) {
  const intra = supplyType !== 'Inter-State';
  return (
    <div className="totals">
      <div><span>Subtotal</span><b>{inr(calc.subtotal)}</b></div>
      <div><span>Discount ({Number(discountPercent) || 0}%)</span><b>- {inr(calc.discount)}</b></div>
      {intra ? (
        <>
          <div><span>CGST</span><b>{inr(calc.tax / 2)}</b></div>
          <div><span>SGST</span><b>{inr(calc.tax / 2)}</b></div>
        </>
      ) : (
        <div><span>IGST</span><b>{inr(calc.tax)}</b></div>
      )}
      <div className="grand"><span>Grand Total</span><b>{inr(calc.total)}</b></div>
      <div><span>Amount Paid</span><b>{inr(calc.amount_paid)}</b></div>
      <div><span>Balance Due</span><b>{inr(calc.balance)}</b></div>
      {showProfit && (
        <div className={calc.profit < 0 ? 'text-red' : 'text-green'}><span>Cost: {inr(calc.cost)}</span><b>{profitText(calc.profit)}</b></div>
      )}
    </div>
  );
}
