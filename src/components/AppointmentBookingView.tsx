import React, { useState } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Mail,
  Phone,
  CheckCircle2,
  FileCheck,
  Box,
  Key,
  Truck,
  HelpCircle,
} from "lucide-react";
import { Appointment, AppointmentServiceType } from "../types";

interface AppointmentBookingViewProps {
  appointments: Appointment[];
  onAddAppointment: (apt: Appointment) => void;
}

const SERVICES = [
  {
    id: "notary_public" as AppointmentServiceType,
    title: "Georgia Notary Public",
    duration: "15 mins",
    price: "$10 / seal",
    icon: FileCheck,
    desc: "Official notarization for deeds, powers of attorney, auto titles, and affidavits. Walk-ins also welcome.",
    checklist:
      "Bring a valid government-issued photo ID (Driver License or Passport) and leave documents unsigned until you arrive.",
  },
  {
    id: "mailbox_rental" as AppointmentServiceType,
    title: "Private Mailbox Setup",
    duration: "15 mins",
    price: "Free setup",
    icon: Key,
    desc: "Activate your private street address, pick your mailbox number, and receive your 24/7 lobby key fob.",
    checklist:
      "Bring 2 forms of identification (e.g., Driver License + Vehicle Registration or Lease Agreement).",
  },
  {
    id: "custom_packing" as AppointmentServiceType,
    title: "Fragile Item & Art Packing",
    duration: "20 mins",
    price: "Free evaluation",
    icon: Box,
    desc: "Bring in delicate art, china, antiques, or electronics for custom box sizing and foam cushioning.",
    checklist:
      "Bring your item(s) to our packing counter. We provide all boxes, bubble cushioning, and tape.",
  },
  {
    id: "freight_consultation" as AppointmentServiceType,
    title: "Business & Freight Shipping",
    duration: "30 mins",
    price: "Free quote",
    icon: Truck,
    desc: "Discuss recurring commercial shipments, pallet freight, or multi-location package distribution.",
    checklist:
      "Bring estimated weight, dimensions, and destination zip codes if available.",
  },
];

const TIME_SLOTS = [
  "09:00 AM",
  "10:00 AM",
  "11:30 AM",
  "01:30 PM",
  "03:00 PM",
  "04:30 PM",
  "05:30 PM",
];

export const AppointmentBookingView: React.FC<AppointmentBookingViewProps> = ({
  appointments,
  onAddAppointment,
}) => {
  const [selectedService, setSelectedService] =
    useState<AppointmentServiceType>("notary_public");
  const [selectedDate, setSelectedDate] = useState("2026-09-08");
  const [selectedSlot, setSelectedSlot] = useState("10:00 AM");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [confirmedTicket, setConfirmedTicket] = useState<Appointment | null>(
    null,
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone) return;

    const newApt: Appointment = {
      id: `apt-${Date.now()}`,
      customerId: `cust-${Math.floor(100 + Math.random() * 900)}`,
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
      serviceType: selectedService,
      appointmentDate: selectedDate,
      timeSlot: selectedSlot,
      notes,
      status: "confirmed",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onAddAppointment(newApt);
    setConfirmedTicket(newApt);
    setName("");
    setEmail("");
    setPhone("");
    setNotes("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const currentServiceObj =
    SERVICES.find((s) => s.id === selectedService) || SERVICES[0];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-xs">
        <div className="max-w-3xl">
          <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200/60 inline-flex items-center gap-1.5">
            <CalendarIcon className="w-3.5 h-3.5" /> Fast In-Store Appointments
          </span>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-gray-900 mt-2">
            Book an In-Store Appointment
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Reserve dedicated one-on-one time with our Georgia Commissioned
            Notary, packing team, or mailbox staff for zero wait time.
          </p>
        </div>
      </div>

      {/* Confirmation Card */}
      {confirmedTicket && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 shadow-xs flex items-start gap-4 animate-in fade-in">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-emerald-950">
              Appointment Confirmed!
            </h3>
            <p className="text-sm text-emerald-800">
              We have reserved your time for{" "}
              <strong>{confirmedTicket.appointmentDate}</strong> at{" "}
              <strong>{confirmedTicket.timeSlot}</strong>.
            </p>
            <p className="text-xs text-emerald-700 pt-1">
              Store Address: 2450 Piedmont Rd NE, Atlanta, GA 30324 •
              Confirmation ID: #{confirmedTicket.id}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Booking Form (7 Cols) */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-7 bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-xs space-y-6"
        >
          {/* Step 1: Select Service */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">
                1
              </span>
              <span>Choose your service</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SERVICES.map((s) => {
                const Icon = s.icon;
                const isSelected = selectedService === s.id;
                return (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => setSelectedService(s.id)}
                    className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "border-blue-600 bg-blue-50/70 shadow-xs ring-2 ring-blue-100"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div
                          className={`p-2 rounded-xl ${isSelected ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-semibold text-gray-700">
                          {s.price}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-gray-900">
                        {s.title}
                      </h4>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        {s.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Date & Time */}
          <div className="space-y-3 pt-3 border-t border-gray-100">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">
                2
              </span>
              <span>Choose date & time</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Appointment Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full sm:w-64 px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Available Time Slots
                </label>
                <div className="flex flex-wrap gap-2">
                  {TIME_SLOTS.map((slot) => (
                    <button
                      type="button"
                      key={slot}
                      onClick={() => setSelectedSlot(slot)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                        selectedSlot === slot
                          ? "bg-blue-600 border-blue-600 text-white shadow-xs"
                          : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: Your Info */}
          <div className="space-y-3 pt-3 border-t border-gray-100">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">
                3
              </span>
              <span>Your contact details</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. David Miller"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="(404) 555-0199"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                placeholder="david@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:bg-white focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-2xl transition shadow-sm flex items-center justify-center gap-2 cursor-pointer mt-4"
          >
            <CalendarIcon className="w-4 h-4" />
            <span>Confirm Appointment</span>
          </button>
        </form>

        {/* Right Help & Checklist Column (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* What to bring card */}
          <div className="bg-blue-50/70 border border-blue-100 rounded-3xl p-6 shadow-xs space-y-3">
            <h4 className="font-bold text-sm text-blue-950 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              <span>What to bring for: {currentServiceObj.title}</span>
            </h4>
            <p className="text-xs text-blue-900 leading-relaxed">
              {currentServiceObj.checklist}
            </p>
          </div>

          {/* Store info card */}
          <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-xs space-y-4">
            <h4 className="font-bold text-base text-gray-900">Store Details</h4>
            <div className="space-y-2 text-xs text-gray-600">
              <p>
                <strong>Address:</strong> 2450 Piedmont Rd NE, Atlanta, GA 30324
              </p>
              <p>
                <strong>Parking:</strong> Free customer parking right in front
                of the store entrance.
              </p>
              <p>
                <strong>Walk-ins:</strong> Walk-ins are always welcomed during
                normal store hours.
              </p>
            </div>
          </div>

          {/* Scheduled Appointments Preview */}
          <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h4 className="font-bold text-sm text-gray-900">
                Upcoming Appointments
              </h4>
              <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full">
                {appointments.length} booked
              </span>
            </div>

            <div className="space-y-3">
              {appointments.slice(0, 3).map((a) => (
                <div
                  key={a.id}
                  className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/60 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between font-bold text-gray-900">
                    <span>{a.customerName}</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] uppercase font-bold">
                      {a.status}
                    </span>
                  </div>
                  <p className="text-gray-500 capitalize">
                    {a.serviceType.replace(/_/g, " ")}
                  </p>
                  <p className="text-gray-400 text-[11px] pt-0.5">
                    {a.appointmentDate} at {a.timeSlot}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
