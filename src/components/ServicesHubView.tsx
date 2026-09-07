import React, { useState } from 'react';
import {
  Truck,
  Box,
  Mail,
  FileCheck,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  Scissors,
  Camera,
  MapPin,
  ChevronDown,
  ChevronUp,
  HelpCircle,
} from 'lucide-react';

interface ServicesHubViewProps {
  onSelectService: (service: string) => void;
  onBookAppointment: () => void;
  onSchedulePickup: () => void;
}

export const ServicesHubView: React.FC<ServicesHubViewProps> = ({
  onSelectService,
  onBookAppointment,
  onSchedulePickup,
}) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Do you accept pre-printed return labels from Amazon, UPS, or FedEx?',
      a: 'Yes! You can drop off pre-labeled packages for FedEx, UPS, and USPS at no extra charge. We provide printed or digital drop-off receipts instantly.',
    },
    {
      q: 'What is the daily cutoff time for packages to ship out today?',
      a: 'Our daily carrier pickups are at 5:30 PM Monday through Friday. Packages dropped off or picked up before 5:30 PM depart on the evening carrier trucks.',
    },
    {
      q: 'Can I use your mailbox service as my official business address?',
      a: 'Absolutely. Unlike a P.O. Box, our private mailboxes provide a real Georgia physical street address (2450 Piedmont Rd NE, Suite #___) approved for Georgia LLC filings, banking, and commercial licensing.',
    },
    {
      q: 'Do I need an appointment for the Notary Public?',
      a: 'Walk-ins are always welcome during business hours! You can also book a guaranteed 15-minute appointment online if you are on a tight schedule.',
    },
  ];

  return (
    <div className="space-y-10">
      {/* 1. Multi-Carrier Shipping Services */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
              Authorized Shipping
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-gray-900 mt-1">
              Compare & Ship with Leading Carriers
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              We compare prices across FedEx, UPS, and USPS to find you the best rate and fastest route.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 shrink-0">
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Daily Pickup Cutoff: 5:30 PM EST</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* FedEx */}
          <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-sm border border-purple-200">
                FedEx
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">FedEx Express & Ground</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Best for guaranteed overnight delivery, priority documents, and global international air.
                </p>
              </div>
              <ul className="text-xs text-gray-600 space-y-2 pt-3 border-t border-gray-100">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span>Next-day morning delivery</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span>Free Express packing envelopes</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span>Drop-off QR code scanning</span>
                </li>
              </ul>
            </div>
            <button
              onClick={onSchedulePickup}
              className="mt-6 w-full py-2.5 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Ship with FedEx</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* UPS */}
          <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-sm border border-amber-200">
                UPS
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">UPS Authorized Service</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Dependable ground shipping across all 50 states, Next Day Air, and fast package returns.
                </p>
              </div>
              <ul className="text-xs text-gray-600 space-y-2 pt-3 border-t border-gray-100">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>1 to 5 business day ground</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>Next Day Air early delivery</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>Easy returns & drop-offs</span>
                </li>
              </ul>
            </div>
            <button
              onClick={onSchedulePickup}
              className="mt-6 w-full py-2.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Ship with UPS</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* USPS */}
          <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-sm border border-blue-200">
                USPS
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">USPS Priority Mail</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Cost-effective flat-rate boxes, certified mail, postage stamps, and residential delivery.
                </p>
              </div>
              <ul className="text-xs text-gray-600 space-y-2 pt-3 border-t border-gray-100">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Free flat-rate boxes</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Certified & registered mail</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Postage stamps & metered mail</span>
                </li>
              </ul>
            </div>
            <button
              onClick={onSchedulePickup}
              className="mt-6 w-full py-2.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Ship with USPS</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Local Courier & Freight */}
          <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm border border-emerald-200">
                Courier
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Doorstep & Heavy Freight</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Same-day Atlanta courier van service, heavy freight, palletizing, and bulk cargo.
                </p>
              </div>
              <ul className="text-xs text-gray-600 space-y-2 pt-3 border-t border-gray-100">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Door-to-door Atlanta delivery</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Pallet wrapping & liftgate</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Commercial & office moves</span>
                </li>
              </ul>
            </div>
            <button
              onClick={onSchedulePickup}
              className="mt-6 w-full py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Book Courier Pickup</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* 2. Private Mailbox Rentals */}
      <section className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-semibold border border-amber-200">
              <Mail className="w-3.5 h-3.5" /> Real Atlanta Street Address (Not a P.O. Box)
            </div>
            <h3 className="text-2xl font-display font-bold text-gray-900 mt-2">
              Private Mailbox Rentals
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Give your business a prestigious Atlanta street address. We accept deliveries from all carriers and send text alerts when packages arrive.
            </p>
          </div>
          <button
            onClick={onBookAppointment}
            className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-semibold transition shrink-0 cursor-pointer shadow-xs"
          >
            Reserve a Mailbox
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Personal */}
          <div className="bg-gray-50 rounded-2xl border border-gray-200/80 p-5 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Personal / Small
            </span>
            <div className="text-3xl font-bold text-gray-900">
              $25 <span className="text-sm font-normal text-gray-500">/ month</span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Great for personal letters, bank statements, and small package deliveries.
            </p>
            <ul className="text-xs text-gray-600 space-y-2 pt-3 border-t border-gray-200/60">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Real street address with Suite #</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Text and email arrival alerts</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Secure hold while you travel</span>
              </li>
            </ul>
          </div>

          {/* Business (Most Popular) */}
          <div className="bg-blue-50/50 rounded-2xl border-2 border-blue-600 p-5 space-y-3 relative shadow-xs">
            <div className="absolute -top-3 right-5 bg-blue-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
              Most Popular
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-800">
              Business / Medium
            </span>
            <div className="text-3xl font-bold text-gray-900">
              $45 <span className="text-sm font-normal text-gray-500">/ month</span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Designed for Georgia LLCs, remote businesses, and regular package deliveries.
            </p>
            <ul className="text-xs text-gray-600 space-y-2 pt-3 border-t border-blue-200/60">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Authorized for Georgia LLC filing</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Unlimited packages from all carriers</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>24/7 key fob lobby access</span>
              </li>
            </ul>
          </div>

          {/* Corporate */}
          <div className="bg-gray-50 rounded-2xl border border-gray-200/80 p-5 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Corporate / Large
            </span>
            <div className="text-3xl font-bold text-gray-900">
              $75 <span className="text-sm font-normal text-gray-500">/ month</span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Ideal for multi-person teams, frequent large boxes, and high-volume mail intake.
            </p>
            <ul className="text-xs text-gray-600 space-y-2 pt-3 border-t border-gray-200/60">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Multiple company recipient names</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Large parcel storage room</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Mail forwarding on demand</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 3. In-Store Walk-In Services */}
      <section className="space-y-4">
        <div>
          <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
            In-Store Services
          </span>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-gray-900 mt-1">
            Walk-In Services Available Daily
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            No appointment required for quick services, or book online for zero wait time.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Notary */}
          <div className="bg-white rounded-3xl border border-gray-200/80 p-5 shadow-xs space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <FileCheck className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-gray-900">Georgia Notary Public</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                Licensed Georgia notary on duty for affidavits, real estate deeds, wills, power of attorney, and vehicle titles.
              </p>
              <p className="text-xs font-bold text-blue-700 pt-1">$10 per signature</p>
            </div>
            <button
              onClick={onBookAppointment}
              className="w-full py-2 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold transition cursor-pointer"
            >
              Book Notary
            </button>
          </div>

          {/* Packing */}
          <div className="bg-white rounded-3xl border border-gray-200/80 p-5 shadow-xs space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <Box className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-gray-900">Custom Packing & Boxes</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                Expert cushioning for fragile items, art, electronics, and heavy machinery. Over 40 standard box sizes in stock.
              </p>
              <p className="text-xs font-bold text-amber-800 pt-1">Boxes from $2.50</p>
            </div>
            <button
              onClick={onBookAppointment}
              className="w-full py-2 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold transition cursor-pointer"
            >
              Get Packing Help
            </button>
          </div>

          {/* Passport Photos */}
          <div className="bg-white rounded-3xl border border-gray-200/80 p-5 shadow-xs space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center">
                <Camera className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-gray-900">Passport & ID Photos</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                State Department compliant 2x2 photos for US Passports, International visas, corporate badges, and concealed permits.
              </p>
              <p className="text-xs font-bold text-purple-800 pt-1">$15 for 2 prints</p>
            </div>
            <button
              onClick={onBookAppointment}
              className="w-full py-2 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold transition cursor-pointer"
            >
              Take Photos
            </button>
          </div>

          {/* Secure Shredding */}
          <div className="bg-white rounded-3xl border border-gray-200/80 p-5 shadow-xs space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center">
                <Scissors className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-gray-900">Secure Document Shredding</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                Locked console disposal for confidential tax records, bank statements, and legal files. HIPAA & FACTA compliant.
              </p>
              <p className="text-xs font-bold text-rose-800 pt-1">$1.49 / lb</p>
            </div>
            <button
              onClick={onBookAppointment}
              className="w-full py-2 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold transition cursor-pointer"
            >
              Drop Off Paper
            </button>
          </div>
        </div>
      </section>

      {/* 4. Frequently Asked Questions */}
      <section className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-blue-600" />
          <h3 className="text-xl font-display font-bold text-gray-900">
            Frequently Asked Questions
          </h3>
        </div>

        <div className="space-y-3 pt-2">
          {faqs.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={faq.q}
                className="rounded-2xl border border-gray-200/80 overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  className="w-full p-4 text-left font-semibold text-sm text-gray-900 flex items-center justify-between gap-3 hover:bg-gray-50 transition cursor-pointer"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-gray-500 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 text-xs sm:text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3 bg-gray-50/50">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
