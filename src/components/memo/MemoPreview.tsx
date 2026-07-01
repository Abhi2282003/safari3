import { format } from 'date-fns';

interface Company {
  name: string;
  address?: string;
  phone?: string;
}

interface BusGroup {
  destination: string;
  rate: number;
  seats: number[];
  totalAmount: number;
  deduction: number;
  netAmount: number;
}

interface BusMemoPreviewProps {
  company: Company;
  date: Date;
  busName: string;
  memoNo: string;
  schedule: { driverName: string; departureTime: string };
  totalSeats: number;
  totalLuggageQty: number;
  groups: BusGroup[];
  mainTotal: number;
  mainDeduction: number;
  mainNet: number;
  otherCommission: number;
  luggageToOwner: number;
  grand: number;
}

const BRAND = '#ea580c';
const BRAND_DARK = '#7c2d12';
const BRAND_SOFT = '#faf5eb';

export function BusMemoPreview(p: BusMemoPreviewProps) {
  return (
    <div className="bg-white text-gray-900 mx-auto shadow-sm" style={{ maxWidth: 820, fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
      <div style={{ height: 6, background: BRAND }} />
      <div className="px-6 pt-5 pb-4 flex items-start justify-between gap-4 border-b" style={{ borderColor: BRAND }}>
        <div>
          <div className="text-2xl font-bold" style={{ color: BRAND_DARK }}>{p.company.name}</div>
          {p.company.address && <div className="text-xs text-gray-500 mt-1">{p.company.address}</div>}
          {p.company.phone && <div className="text-xs text-gray-500">Phone: {p.company.phone}</div>}
        </div>
        <div className="text-right text-xs text-gray-600">
          <div>Memo No: <span className="font-semibold text-gray-800">{p.memoNo}</span></div>
          <div>Date: <span className="font-semibold text-gray-800">{format(p.date, 'dd MMM yyyy')}</span></div>
        </div>
      </div>

      <div className="flex justify-center -mt-3">
        <div className="text-white text-sm font-bold px-5 py-1.5 rounded" style={{ background: BRAND }}>
          BUS SETTLEMENT MEMO
        </div>
      </div>

      <div className="px-6 mt-4">
        <div className="rounded border p-3 flex items-start justify-between gap-3" style={{ background: BRAND_SOFT, borderColor: BRAND }}>
          <div>
            <div className="text-xs font-bold" style={{ color: BRAND_DARK }}>BUS</div>
            <div className="text-base font-semibold">{p.busName}</div>
            {(p.schedule.driverName || p.schedule.departureTime) && (
              <div className="text-xs text-gray-600 mt-1">
                {p.schedule.driverName && <>Driver: {p.schedule.driverName}</>}
                {p.schedule.driverName && p.schedule.departureTime && ' | '}
                {p.schedule.departureTime && <>Time: {p.schedule.departureTime}</>}
              </div>
            )}
          </div>
          <div className="text-xs text-gray-600 text-right">
            <div>Total Seats: <span className="font-semibold text-gray-800">{p.totalSeats}</span></div>
            <div>Luggage Qty: <span className="font-semibold text-gray-800">{p.totalLuggageQty}</span></div>
          </div>
        </div>
      </div>

      {p.groups.length > 0 && (
        <div className="px-6 mt-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ background: BRAND_DARK, color: 'white' }}>
                <th className="text-left px-2 py-2 font-semibold">Destination</th>
                <th className="text-right px-2 py-2 font-semibold">Rate</th>
                <th className="text-center px-2 py-2 font-semibold">Seat No.</th>
                <th className="text-right px-2 py-2 font-semibold">Amount</th>
                <th className="text-right px-2 py-2 font-semibold">Less</th>
                <th className="text-right px-2 py-2 font-semibold">Net</th>
              </tr>
            </thead>
            <tbody>
              {p.groups.map((g, i) => (
                <tr key={i} className="border-b" style={{ background: i % 2 ? '#fcfaf7' : 'white' }}>
                  <td className="px-2 py-2">{g.destination}</td>
                  <td className="px-2 py-2 text-right">{g.rate.toFixed(0)}</td>
                  <td className="px-2 py-2 text-center text-xs">{g.seats.slice().sort((a,b)=>a-b).join(', ')}</td>
                  <td className="px-2 py-2 text-right">{g.totalAmount.toFixed(0)}</td>
                  <td className="px-2 py-2 text-right" style={{ color: '#b41e1e' }}>- {g.deduction.toFixed(0)}</td>
                  <td className="px-2 py-2 text-right font-semibold" style={{ color: BRAND_DARK }}>{g.netAmount.toFixed(0)}</td>
                </tr>
              ))}
              <tr style={{ background: '#ffedd5', color: BRAND_DARK }}>
                <td colSpan={3} className="px-2 py-2 text-right font-bold">TOTAL</td>
                <td className="px-2 py-2 text-right font-bold">{p.mainTotal.toFixed(0)}</td>
                <td className="px-2 py-2 text-right font-bold" style={{ color: '#b41e1e' }}>- {p.mainDeduction.toFixed(0)}</td>
                <td className="px-2 py-2 text-right font-bold">{p.mainNet.toFixed(0)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <div className="px-6 mt-6 pb-6 flex justify-end">
        <div className="w-full sm:w-80 rounded border" style={{ background: BRAND_SOFT, borderColor: BRAND }}>
          <div className="px-3 py-2 text-xs font-bold" style={{ color: BRAND_DARK }}>SETTLEMENT SUMMARY</div>
          <div className="px-3 py-1 text-sm flex justify-between">
            <span className="text-gray-600">Seats Subtotal</span>
            <span>Rs. {p.mainNet.toFixed(0)}</span>
          </div>
          {p.otherCommission > 0 && (
            <div className="px-3 py-1 text-sm flex justify-between" style={{ color: '#b41e1e' }}>
              <span>Less (5%)</span>
              <span>- Rs. {p.otherCommission.toFixed(0)}</span>
            </div>
          )}
          {p.luggageToOwner > 0 && (
            <div className="px-3 py-1 text-sm flex justify-between">
              <span className="text-gray-600">+ Luggage</span>
              <span>+ Rs. {p.luggageToOwner.toFixed(0)}</span>
            </div>
          )}
          <div className="mt-2 px-3 py-2 flex justify-between items-center text-white" style={{ background: BRAND }}>
            <span className="font-bold text-sm">TOTAL PAYABLE</span>
            <span className="font-bold text-base">Rs. {p.grand.toFixed(0)}</span>
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-gray-500 py-2 border-t">Generated by Royal Safari Booking System</div>
    </div>
  );
}

interface LuggageItem {
  partyName?: string | null;
  destination: string;
  itemName?: string | null;
  quantity: number;
  totalAmount: number;
  amountToOwner: number;
}

interface LuggageMemoPreviewProps {
  company: Company;
  date: Date;
  memoNo: string;
  buses: { busName: string; items: LuggageItem[]; busTotal: number; busQty: number }[];
  grandTotal: number;
  grandOwner: number;
}

const LBRAND = '#0d6e50';
const LBRAND_DARK = '#064632';
const LBRAND_SOFT = '#f0faf5';

export function LuggageMemoPreview(p: LuggageMemoPreviewProps) {
  const grandLess = p.grandTotal - p.grandOwner;
  return (
    <div className="bg-white text-gray-900 mx-auto shadow-sm" style={{ maxWidth: 820, fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
      <div style={{ height: 6, background: LBRAND }} />
      <div className="px-6 pt-5 pb-4 flex items-start justify-between gap-4 border-b" style={{ borderColor: LBRAND }}>
        <div>
          <div className="text-2xl font-bold" style={{ color: LBRAND_DARK }}>{p.company.name}</div>
          {p.company.address && <div className="text-xs text-gray-500 mt-1">{p.company.address}</div>}
          {p.company.phone && <div className="text-xs text-gray-500">Phone: {p.company.phone}</div>}
        </div>
        <div className="text-right text-xs text-gray-600">
          <div>Memo No: <span className="font-semibold text-gray-800">{p.memoNo}</span></div>
          <div>Date: <span className="font-semibold text-gray-800">{format(p.date, 'dd MMM yyyy')}</span></div>
        </div>
      </div>

      <div className="flex justify-center -mt-3">
        <div className="text-white text-sm font-bold px-5 py-1.5 rounded" style={{ background: LBRAND }}>
          LUGGAGE MEMO
        </div>
      </div>

      <div className="px-6 mt-4 space-y-5">
        {p.buses.map((b, i) => (
          <div key={i}>
            <div className="rounded border px-3 py-2 flex items-center justify-between text-sm" style={{ background: LBRAND_SOFT, borderColor: LBRAND }}>
              <div className="font-bold" style={{ color: LBRAND_DARK }}>BUS: {b.busName}</div>
              <div className="text-xs text-gray-600">Qty: <span className="font-semibold text-gray-800">{b.busQty}</span> &nbsp;|&nbsp; Amount: <span className="font-semibold text-gray-800">Rs. {b.busTotal.toFixed(0)}</span></div>
            </div>
            <table className="w-full text-sm border-collapse mt-2">
              <thead>
                <tr style={{ background: LBRAND_DARK, color: 'white' }}>
                  <th className="text-center px-2 py-2 font-semibold w-10">#</th>
                  <th className="text-left px-2 py-2 font-semibold">Party</th>
                  <th className="text-left px-2 py-2 font-semibold">Destination</th>
                  <th className="text-left px-2 py-2 font-semibold">Item</th>
                  <th className="text-center px-2 py-2 font-semibold">Qty</th>
                  <th className="text-right px-2 py-2 font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {b.items.map((it, j) => (
                  <tr key={j} className="border-b" style={{ background: j % 2 ? '#f7fcfa' : 'white' }}>
                    <td className="px-2 py-2 text-center">{j + 1}</td>
                    <td className="px-2 py-2">{it.partyName || '-'}</td>
                    <td className="px-2 py-2">{it.destination}</td>
                    <td className="px-2 py-2">{it.itemName || '-'}</td>
                    <td className="px-2 py-2 text-center">{it.quantity}</td>
                    <td className="px-2 py-2 text-right">{it.totalAmount.toFixed(0)}</td>
                  </tr>
                ))}
                <tr style={{ background: '#dcefe4', color: LBRAND_DARK }}>
                  <td colSpan={5} className="px-2 py-2 text-right font-bold">BUS TOTAL</td>
                  <td className="px-2 py-2 text-right font-bold">{b.busTotal.toFixed(0)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        ))}
      </div>

      <div className="px-6 mt-6 pb-6 flex justify-end">
        <div className="w-full sm:w-80 rounded border" style={{ background: LBRAND_SOFT, borderColor: LBRAND }}>
          <div className="px-3 py-2 text-xs font-bold" style={{ color: LBRAND_DARK }}>GRAND SUMMARY</div>
          <div className="px-3 py-1 text-sm flex justify-between">
            <span className="text-gray-600">Total Collected</span>
            <span>Rs. {p.grandTotal.toFixed(0)}</span>
          </div>
          <div className="px-3 py-1 text-sm flex justify-between" style={{ color: '#b41e1e' }}>
            <span>Less</span>
            <span>- Rs. {grandLess.toFixed(0)}</span>
          </div>
          <div className="mt-2 px-3 py-2 flex justify-between items-center text-white" style={{ background: LBRAND }}>
            <span className="font-bold text-sm">NET PAYABLE</span>
            <span className="font-bold text-base">Rs. {p.grandOwner.toFixed(0)}</span>
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-gray-500 py-2 border-t">Generated by Royal Safari Booking System</div>
    </div>
  );
}
