import React, { useState } from "react";
import { Navbar } from "./components/Navbar";
import { ServicesHubView } from "./components/ServicesHubView";
import { TrackingView } from "./components/TrackingView";
import { AppointmentBookingView } from "./components/AppointmentBookingView";
import { PickupSchedulerView } from "./components/PickupSchedulerView";
import { InvoiceReceiptView } from "./components/InvoiceReceiptView";
import { StaffDashboard } from "./components/staff/StaffDashboard";
import { AdminDashboard } from "./components/admin/AdminDashboard";
import { ArchitectureModal } from "./components/ArchitectureModal";
import { AuthView } from "./components/AuthView";
import {
  INITIAL_SHIPMENTS,
  INITIAL_INVOICES,
  INITIAL_APPOINTMENTS,
  INITIAL_PICKUPS,
} from "./data/mockData";
import {
  Shipment,
  Invoice,
  Appointment,
  PickupRequest,
  UserRole,
} from "./types";
import {
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Truck,
  Search,
  CheckCircle2,
  Calendar,
  Package,
  Clock,
  ArrowRight,
  Sparkles,
  HelpCircle,
  FileCheck,
  Shield,
  Briefcase,
  Store,
} from "lucide-react";
import { Span } from "next/dist/trace";

export default function App() {
  const [portal, setPortal] = useState<"consumer" | "staff" | "admin">(
    "consumer",
  );
  const [activeTab, setActiveTab] = useState<string>("services");
  const [userRole, setUserRole] = useState<UserRole>("customer");
  const [isArchitectureOpen, setIsArchitectureOpen] = useState<boolean>(false);
  const [heroSearch, setHeroSearch] = useState<string>("");
  const [isAuthPageOpen, setIsAuthPageOpen] = useState(false);

  // Application State
  const [shipments, setShipments] = useState<Shipment[]>(INITIAL_SHIPMENTS);
  const [invoices, setInvoices] = useState<Invoice[]>(INITIAL_INVOICES);
  const [appointments, setAppointments] =
    useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [pickups, setPickups] = useState<PickupRequest[]>(INITIAL_PICKUPS);
  const [activeTrackingNumber, setActiveTrackingNumber] =
    useState<string>("JB-8829-US");

  const handleUpdateShipment = (updated: Shipment) => {
    setShipments((prev) =>
      prev.map((s) => (s.id === updated.id ? updated : s)),
    );
  };

  const handleAddShipment = (newShipment: Shipment) => {
    setShipments((prev) => [newShipment, ...prev]);
  };

  const handleUpdateInvoice = (updated: Invoice) => {
    setInvoices((prev) => {
      const exists = prev.some((inv) => inv.id === updated.id);
      if (exists) {
        return prev.map((inv) => (inv.id === updated.id ? updated : inv));
      }
      return [updated, ...prev];
    });
  };

  const handleAddAppointment = (newApt: Appointment) => {
    setAppointments((prev) => [newApt, ...prev]);
  };

  const handleAddPickup = (newPickup: PickupRequest) => {
    setPickups((prev) => [newPickup, ...prev]);
  };

  const handleUpdatePickup = (updated: PickupRequest) => {
    setPickups((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleQuickTrack = (trackingNo: string) => {
    setPortal("consumer");
    setActiveTrackingNumber(trackingNo.trim());
    setActiveTab("track");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleHeroTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroSearch.trim()) {
      handleQuickTrack(heroSearch);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Header & Navigation with Integrated Role/Dashboard Switcher */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        portal={portal}
        setPortal={(newPortal) => {
          setPortal(newPortal);
          if (newPortal === "consumer") setUserRole("customer");
          else if (newPortal === "staff") setUserRole("associate");
          else setUserRole("admin");
        }}
        userRole={userRole}
        setUserRole={setUserRole}
        onOpenAuth={() => setIsAuthPageOpen(true)}
        onOpenArchitecture={() => setIsArchitectureOpen(true)}
      />

      {isAuthPageOpen && (
        <AuthView
          onBack={() => setIsAuthPageOpen(false)}
          setPortal={setPortal}
          setUserRole={setUserRole}
        />
      )}

      {/* Main Canvas Based on Selected Dashboard */}
      {!isAuthPageOpen && (
        <main
          className={`flex-1 w-full mx-auto ${
            portal === "consumer"
              ? "max-w-none px-0 py-0"
              : "max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
          }`}
        >
          {/* ======================================================================= */}
          {/* 1. STAFF DASHBOARD                                                      */}
          {/* ======================================================================= */}
          {portal === "staff" && (
            <StaffDashboard
              shipments={shipments}
              pickups={pickups}
              appointments={appointments}
              onAddShipment={handleAddShipment}
              onUpdateShipment={handleUpdateShipment}
              onUpdatePickup={handleUpdatePickup}
              onSwitchToConsumer={() => setPortal("consumer")}
              onSwitchToAdmin={() => setPortal("admin")}
            />
          )}

          {/* ======================================================================= */}
          {/* 2. ADMIN DASHBOARD                                                      */}
          {/* ======================================================================= */}
          {portal === "admin" && (
            <AdminDashboard
              shipments={shipments}
              invoices={invoices}
              appointments={appointments}
              pickups={pickups}
              onUpdateInvoice={handleUpdateInvoice}
              onOpenArchitecture={() => setIsArchitectureOpen(true)}
              onSwitchToConsumer={() => setPortal("consumer")}
              onSwitchToStaff={() => setPortal("staff")}
            />
          )}

          {/* ======================================================================= */}
          {/* 3. CONSUMER STOREFRONT DASHBOARD                                        */}
          {/* ======================================================================= */}
          {portal === "consumer" && (
            <>
              {/* Consumer Welcome Hero (Displayed on the Home & Services view) */}
              {activeTab === "services" && (
                <section className="landing-hero relative mb-8 min-h-[560px] overflow-hidden shadow-lg sm:min-h-[620px] lg:min-h-[calc(100svh-4rem)] lg:max-h-[760px]">
                  <img
                    src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1800&q=85"
                    alt="Packages ready for worldwide shipping"
                    className="absolute inset-0 h-full w-full object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-slate-950/70" />
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-slate-950/20" />

                  <div className="relative z-10 flex min-h-[560px] max-w-4xl flex-col justify-center space-y-5 p-6 sm:min-h-[620px] sm:p-10 lg:min-h-[calc(100svh-4rem)] lg:p-14 animate-fade-up">
                    <h1 className="max-w-4xl text-4xl font-display font-bold text-white tracking-tight leading-[1.05] sm:text-5xl lg:text-6xl">
                      Shipping, Packing & Notary{" "}
                      <span className="text-cyan-600">Made Simple</span>.
                    </h1>

                    <p className="max-w-2xl text-base text-slate-200 font-normal leading-7 sm:text-lg">
                      Compare rates and ship with{" "}
                      <strong className="text-white">
                        FedEx, UPS, and USPS
                      </strong>{" "}
                      all under one roof. Rent a private street address mailbox,
                      book a certified notary, or schedule a pickup from
                      wherever you are.
                    </p>

                    {/* Fast Track Package Bar */}
                    <div className="w-full max-w-3xl pt-2">
                      <form
                        onSubmit={handleHeroTrackSubmit}
                        className="flex flex-col gap-3 sm:flex-row"
                      >
                        <div className="relative flex-1">
                          <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            value={heroSearch}
                            onChange={(e) => setHeroSearch(e.target.value)}
                            placeholder="Enter tracking number (e.g. JB-8829-US)..."
                            className="w-full rounded-2xl border border-white/70 bg-white py-4 pl-12 pr-4 text-sm font-medium text-gray-900 shadow-xl outline-none transition placeholder:text-gray-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 sm:text-base"
                          />
                        </div>
                        <button
                          type="submit"
                          className="flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-7 py-4 text-sm font-bold text-white shadow-xl transition hover:bg-blue-700 hover:-translate-y-0.5 cursor-pointer sm:text-base"
                        >
                          <span>Track Package</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </form>

                      {/* Quick Demo Pill buttons */}
                      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-300">
                        <span className="font-medium text-slate-200">
                          Sample tracking:
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQuickTrack("JB-8829-US")}
                          className="px-2.5 py-1 rounded-full bg-white hover:bg-blue-50 text-blue-700 font-medium border border-gray-200 transition cursor-pointer"
                        >
                          JB-8829-US (FedEx)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickTrack("JB-9102-US")}
                          className="px-2.5 py-1 rounded-full bg-white hover:bg-amber-50 text-amber-800 font-medium border border-gray-200 transition cursor-pointer"
                        >
                          JB-9102-US (UPS)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickTrack("JB-4421-US")}
                          className="px-2.5 py-1 rounded-full bg-white hover:bg-blue-50 text-blue-800 font-medium border border-gray-200 transition cursor-pointer"
                        >
                          JB-4421-US (USPS)
                        </button>
                      </div>

                      <div className="mt-6 grid max-w-2xl grid-cols-3 border-y border-white/20 py-3 text-white">
                        <div className="border-r border-white/20 pr-3 sm:pr-6">
                          <strong className="block text-lg font-bold sm:text-2xl">
                            24/7
                          </strong>
                          <span className="text-[10px] uppercase tracking-wider text-slate-300 sm:text-xs">
                            Mailbox access
                          </span>
                        </div>
                        <div className="border-r border-white/20 px-3 sm:px-6">
                          <strong className="block text-lg font-bold sm:text-2xl">
                            3+
                          </strong>
                          <span className="text-[10px] uppercase tracking-wider text-slate-300 sm:text-xs">
                            Global carriers
                          </span>
                        </div>
                        <div className="pl-3 sm:pl-6">
                          <strong className="block text-lg font-bold sm:text-2xl">
                            5:30 PM
                          </strong>
                          <span className="text-[10px] uppercase tracking-wider text-slate-300 sm:text-xs">
                            Daily cutoff
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Dynamic Consumer Views */}
              <div
                key={activeTab}
                className="page-transition max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
              >
                {activeTab === "services" && (
                  <ServicesHubView
                    onSelectService={(s) => {
                      if (s === "pickup") setActiveTab("pickup");
                      else if (s === "notary" || s === "packing")
                        setActiveTab("appointment");
                      else setActiveTab("track");
                    }}
                    onBookAppointment={() => {
                      setActiveTab("appointment");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    onSchedulePickup={() => {
                      setActiveTab("pickup");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  />
                )}

                {activeTab === "track" && (
                  <TrackingView
                    shipments={shipments}
                    initialTrackingId={activeTrackingNumber}
                    onUpdateShipment={handleUpdateShipment}
                  />
                )}

                {activeTab === "appointment" && (
                  <AppointmentBookingView
                    appointments={appointments}
                    onAddAppointment={handleAddAppointment}
                  />
                )}

                {activeTab === "pickup" && (
                  <PickupSchedulerView
                    pickups={pickups}
                    onAddPickup={handleAddPickup}
                  />
                )}

                {activeTab === "invoices" && (
                  <InvoiceReceiptView
                    invoices={invoices}
                    onUpdateInvoice={handleUpdateInvoice}
                  />
                )}
              </div>
            </>
          )}
        </main>
      )}

      {/* Clean, Approachable Consumer Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12 pt-12 pb-8 text-gray-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-10 border-b border-gray-100">
            {/* Column 1: Brand & Bio */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                  JB
                </div>
                <span className="font-display font-bold text-gray-900 text-base">
                  JB & Best Logistics LLC
                </span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed max-w-sm">
                Your trusted shipping store and private mailbox hub for
                worldwide customers. Licensed, bonded, and insured in the State
                of Georgia.
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                <span className="px-2.5 py-1 rounded-full bg-gray-100 font-medium">
                  FedEx Authorized
                </span>
                <span className="px-2.5 py-1 rounded-full bg-gray-100 font-medium">
                  UPS Service Center
                </span>
                <span className="px-2.5 py-1 rounded-full bg-gray-100 font-medium">
                  USPS Approved
                </span>
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div className="space-y-2.5 text-sm">
              <h4 className="font-semibold text-gray-900">Services</h4>
              <ul className="space-y-2 text-gray-500">
                <li>
                  <button
                    onClick={() => {
                      setPortal("consumer");
                      setActiveTab("services");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="hover:text-blue-600 transition cursor-pointer"
                  >
                    Shipping & Carriers
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setPortal("consumer");
                      setActiveTab("services");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="hover:text-blue-600 transition cursor-pointer"
                  >
                    Private Mailbox Rental
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setPortal("consumer");
                      setActiveTab("appointment");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="hover:text-blue-600 transition cursor-pointer"
                  >
                    Georgia Notary Public
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setPortal("consumer");
                      setActiveTab("pickup");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="hover:text-blue-600 transition cursor-pointer"
                  >
                    Schedule Doorstep Pickup
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Store Hours */}
            <div className="space-y-2.5 text-sm">
              <h4 className="font-semibold text-gray-900">Store Hours</h4>
              <div className="space-y-1.5 text-gray-500 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span>Monday – Friday:</span>
                  <span className="font-medium text-gray-800">
                    8:00 AM – 7:00 PM
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Saturday:</span>
                  <span className="font-medium text-gray-800">
                    9:00 AM – 4:00 PM
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Sunday:</span>
                  <span className="text-gray-400">Closed (24/7 Mailbox)</span>
                </div>
                <p className="text-blue-700 font-medium text-xs pt-1.5">
                  Daily Carrier Cutoff: 5:30 PM EST
                </p>
              </div>
            </div>

            {/* Column 4: Location & Portals */}
            <div className="space-y-2.5 text-sm">
              <h4 className="font-semibold text-gray-900">Role Dashboards</h4>
              <ul className="space-y-2 text-xs sm:text-sm">
                <li>
                  <button
                    onClick={() => {
                      setPortal("consumer");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className={`flex items-center gap-1.5 transition cursor-pointer ${portal === "consumer" ? "text-blue-600 font-bold" : "text-gray-500 hover:text-blue-600"}`}
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>Consumer Storefront</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setPortal("staff");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className={`flex items-center gap-1.5 transition cursor-pointer ${portal === "staff" ? "text-amber-600 font-bold" : "text-gray-500 hover:text-amber-600"}`}
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Staff Operations Portal</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setPortal("admin");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className={`flex items-center gap-1.5 transition cursor-pointer ${portal === "admin" ? "text-slate-900 font-bold" : "text-gray-500 hover:text-slate-900"}`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Admin Executive Console</span>
                  </button>
                </li>
              </ul>

              <div className="pt-2 text-xs text-gray-500">
                <p>📍 2450 Piedmont Rd NE, Atlanta GA</p>
                <p>📞 (404) 555-0199</p>
              </div>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
            <p>
              © {new Date().getFullYear()} JB & Best Logistics LLC. All rights
              reserved.
            </p>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsArchitectureOpen(true)}
                className="text-gray-400 hover:text-gray-600 underline cursor-pointer text-xs"
              >
                Developer Info & Architecture
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Code Architecture Explorer Modal */}
      <ArchitectureModal
        isOpen={isArchitectureOpen}
        onClose={() => setIsArchitectureOpen(false)}
      />
    </div>
  );
}
