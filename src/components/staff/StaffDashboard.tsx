import React, { useState } from 'react';
import {
  Truck,
  PlusCircle,
  CheckCircle2,
  Clock,
  MapPin,
  Shield,
  Box,
  Send,
  AlertCircle,
  QrCode,
  Printer,
  Calendar,
  User,
  Search,
  ExternalLink,
} from 'lucide-react';
import {
  Shipment,
  PickupRequest,
  Appointment,
  Carrier,
  ShipmentStatus,
} from '../../types';

interface StaffDashboardProps {
  shipments: Shipment[];
  pickups: PickupRequest[];
  appointments: Appointment[];
  onAddShipment: (shipment: Shipment) => void;
  onUpdateShipment: (shipment: Shipment) => void;
  onUpdatePickup: (pickup: PickupRequest) => void;
  onUpdateAppointment?: (appointment: Appointment) => void;
  onSwitchToConsumer: () => void;
  onSwitchToAdmin: () => void;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({
  shipments,
  pickups,
  appointments,
  onAddShipment,
  onUpdateShipment,
  onUpdatePickup,
  onSwitchToConsumer,
  onSwitchToAdmin,
}) => {
  const [activeStaffTab, setActiveStaffTab] = useState<
    'intake' | 'pickups' | 'scanner' | 'appointments' | 'manifest'
  >('intake');

  // Intake state
  const [newTrackingNum, setNewTrackingNum] = useState('');
  const [carrier, setCarrier] = useState<Carrier>('fedex');
  const [service, setService] = useState('FedEx 2Day Air');
  const [recipientName, setRecipientName] = useState('Georgia Client Recipient');
  const [recipientCity, setRecipientCity] = useState('Savannah');
  const [weight, setWeight] = useState(5.5);
  const [declaredValue, setDeclaredValue] = useState(200);
  const [intakeSuccess, setIntakeSuccess] = useState<string | null>(null);

  // Scanner state
  const [selectedShipmentId, setSelectedShipmentId] = useState<string>(shipments[0]?.id || '');
  const [milestoneStatus, setMilestoneStatus] = useState<ShipmentStatus>('in_transit');
  const [milestoneTitle, setMilestoneTitle] = useState('Linehaul Transit Departure');
  const [milestoneCity, setMilestoneCity] = useState('Atlanta, GA');
  const [milestoneDesc, setMilestoneDesc] = useState('Departed sort facility en route to destination.');

  const handleCreateShipment = (e: React.FormEvent) => {
    e.preventDefault();
    const trackingId = newTrackingNum.trim() || `JB-${Math.floor(1000 + Math.random() * 9000)}-US`;

    const newShipment: Shipment = {
      id: trackingId,
      trackingNumber: trackingId,
      carrier,
      serviceLevel: service,
      sender: {
        name: 'JB & Best Logistics Counter',
        street: '2450 Piedmont Rd NE',
        city: 'Atlanta',
        state: 'GA',
        zip: '30324',
        country: 'USA',
        phone: '+1 (404) 555-0199',
      },
      recipient: {
        name: recipientName,
        street: '100 Main St',
        city: recipientCity,
        state: 'GA',
        zip: '31401',
        country: 'USA',
        phone: '+1 (404) 555-9000',
      },
      packageDetails: {
        weightLbs: Number(weight),
        dimensions: { length: 12, width: 8, height: 6, unit: 'in' },
        packageType: 'box',
        isFragile: false,
        requiresSignature: true,
        declaredValue: Number(declaredValue),
      },
      currentStatus: 'order_created',
      currentLocation: {
        city: 'Atlanta',
        state: 'GA',
        country: 'USA',
        latitude: 33.749,
        longitude: -84.388,
        facilityName: 'Atlanta Counter Intake Register #1',
      },
      originLocation: {
        city: 'Atlanta',
        state: 'GA',
        country: 'USA',
        latitude: 33.749,
        longitude: -84.388,
      },
      destinationLocation: {
        city: recipientCity,
        state: 'GA',
        country: 'USA',
        latitude: 32.0809,
        longitude: -81.0912,
      },
      estimatedDelivery: '2 Business Days',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      trackingLogs: [
        {
          id: `log-${Date.now()}`,
          shipmentId: trackingId,
          status: 'order_created',
          title: 'Registered at Retail Terminal',
          description: 'Package accepted, weighed, and barcoded by associate.',
          location: {
            city: 'Atlanta',
            state: 'GA',
            country: 'USA',
            latitude: 33.749,
            longitude: -84.388,
            facilityName: 'JB & Best Logistics Main Hub',
          },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    onAddShipment(newShipment);
    setIntakeSuccess(trackingId);
    setNewTrackingNum('');
  };

  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    const shipment = shipments.find((s) => s.id === selectedShipmentId);
    if (!shipment) return;

    const newLog = {
      id: `log-${Date.now()}`,
      shipmentId: shipment.id,
      status: milestoneStatus,
      title: milestoneTitle,
      description: milestoneDesc,
      location: {
        city: milestoneCity.split(',')[0]?.trim() || 'Atlanta',
        state: milestoneCity.split(',')[1]?.trim() || 'GA',
        country: 'USA',
        latitude: shipment.currentLocation.latitude,
        longitude: shipment.currentLocation.longitude,
        facilityName: 'Carrier Checkpoint',
      },
      timestamp: new Date().toISOString(),
    };

    const updatedShipment: Shipment = {
      ...shipment,
      currentStatus: milestoneStatus,
      updatedAt: new Date().toISOString(),
      trackingLogs: [newLog, ...shipment.trackingLogs],
    };

    onUpdateShipment(updatedShipment);
    alert(`Added milestone update to ${shipment.trackingNumber}! Check customer tracking view to see the live update.`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Staff Header Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 text-amber-400 text-xs font-semibold border border-amber-400/20">
            <Truck className="w-3.5 h-3.5" />
            <span>Store Counter & Dispatch Console</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
            Staff Operations Terminal
          </h2>
          <p className="text-sm text-slate-400 max-w-2xl">
            Counter package intake, thermal label printing, driver dispatch assignments, and live tracking milestone updates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={onSwitchToAdmin}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition cursor-pointer flex items-center gap-1.5"
          >
            <Shield className="w-3.5 h-3.5 text-blue-400" />
            <span>Switch to Admin Console</span>
          </button>
          <button
            onClick={onSwitchToConsumer}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>View Public Storefront</span>
          </button>
        </div>
      </div>

      {/* Staff Operational Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 overflow-x-auto pb-px">
        {[
          { id: 'intake', label: 'Counter Intake & Labels', icon: Box },
          { id: 'pickups', label: `Doorstep Pickups (${pickups.length})`, icon: Truck },
          { id: 'scanner', label: 'Milestone Scanner', icon: QrCode },
          { id: 'appointments', label: `Appointments (${appointments.length})`, icon: Calendar },
          { id: 'manifest', label: '5:30 PM Carrier Manifest', icon: Clock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeStaffTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveStaffTab(tab.id as any)}
              className={`px-4 py-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Counter Intake */}
      {activeStaffTab === 'intake' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <form
            onSubmit={handleCreateShipment}
            className="lg:col-span-7 bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-xs space-y-5"
          >
            <div>
              <h3 className="text-lg font-bold text-gray-900">New Package Intake</h3>
              <p className="text-xs text-gray-500">
                Weigh package, generate tracking barcode, and assign carrier.
              </p>
            </div>

            {intakeSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between animate-in fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Created shipment <strong>{intakeSuccess}</strong> successfully!</span>
                </div>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3 h-3" /> Print Label
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Carrier</label>
                <select
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value as Carrier)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm bg-gray-50 focus:bg-white focus:outline-none"
                >
                  <option value="fedex">FedEx Express / Ground</option>
                  <option value="ups">UPS Ground / Air</option>
                  <option value="usps">USPS Priority / Express</option>
                  <option value="jb_freight">JB Local Courier Van</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Service Level</label>
                <input
                  type="text"
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm bg-gray-50 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Weight (lbs)</label>
                <input
                  type="number"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm bg-gray-50 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Declared Value ($)</label>
                <input
                  type="number"
                  value={declaredValue}
                  onChange={(e) => setDeclaredValue(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm bg-gray-50 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Recipient Name</label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm bg-gray-50 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Destination City</label>
                <input
                  type="text"
                  value={recipientCity}
                  onChange={(e) => setRecipientCity(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm bg-gray-50 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Custom Barcode ID (Optional)</label>
              <input
                type="text"
                placeholder="Leave blank to auto-generate (e.g. JB-8890-US)"
                value={newTrackingNum}
                onChange={(e) => setNewTrackingNum(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm bg-gray-50 focus:bg-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Register Intake & Generate Barcode</span>
            </button>
          </form>

          {/* Active Store Shipments List */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-gray-200/80 p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-base text-gray-900 flex items-center justify-between">
              <span>Recently Registered Parcels</span>
              <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                {shipments.length} total
              </span>
            </h3>

            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {shipments.map((s) => (
                <div
                  key={s.id}
                  className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-gray-900">{s.trackingNumber}</span>
                    <span className="font-bold text-[10px] uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      {s.carrier}
                    </span>
                  </div>
                  <p className="text-gray-500">To: {s.recipient.name} ({s.recipient.city}, {s.recipient.state})</p>
                  <p className="text-[11px] text-gray-400 capitalize">{s.serviceLevel} • {s.packageDetails.weightLbs} lbs</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Doorstep Pickups & Drivers */}
      {activeStaffTab === 'pickups' && (
        <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Doorstep Collection Dispatch Queue</h3>
              <p className="text-xs text-gray-500">
                Assign pickup requests to local Atlanta courier vans and update pickup completion.
              </p>
            </div>
            <span className="text-xs font-semibold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              {pickups.filter((p) => p.status !== 'completed').length} Pending Dispatch
            </span>
          </div>

          <div className="space-y-4">
            {pickups.map((p) => (
              <div
                key={p.id}
                className="p-5 rounded-2xl border border-gray-200/80 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-gray-900">{p.contactName}</span>
                    {p.businessName && <span className="text-gray-500 font-medium">({p.businessName})</span>}
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-100 text-blue-800">
                      {p.status}
                    </span>
                  </div>
                  <p className="text-gray-600">
                    📍 {p.pickupAddress.street}, {p.pickupAddress.suite ? `${p.pickupAddress.suite}, ` : ''}{p.pickupAddress.city} {p.pickupAddress.zip}
                  </p>
                  <p className="text-gray-500">
                    📞 {p.contactPhone} • Ready: {p.pickupDate} ({p.readyTime} - {p.closeTime}) • {p.estimatedPackagesCount} boxes ({p.totalWeightLbs} lbs)
                  </p>
                  {p.specialInstructions && (
                    <p className="text-amber-800 font-medium bg-amber-50 p-2 rounded-xl mt-1 border border-amber-200/60">
                      ⚠️ Note / Gate Code: {p.specialInstructions}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {p.status === 'scheduled' && (
                    <button
                      onClick={() => onUpdatePickup({ ...p, status: 'in_route', assignedDriverId: 'Driver-Van-01' })}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                    >
                      Assign Van & Dispatch
                    </button>
                  )}
                  {p.status === 'in_route' && (
                    <button
                      onClick={() => onUpdatePickup({ ...p, status: 'completed' })}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                    >
                      Mark Collected
                    </button>
                  )}
                  {p.status === 'completed' && (
                    <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Picked Up
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Milestone Scanner */}
      {activeStaffTab === 'scanner' && (
        <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Waypoint & Milestone Scanner</h3>
            <p className="text-xs text-gray-500">
              Update package status milestones. Changes appear instantaneously in the customer&apos;s live tracking view.
            </p>
          </div>

          <form onSubmit={handleAddMilestone} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div>
              <label className="block text-gray-700 font-semibold mb-1">Select Package</label>
              <select
                value={selectedShipmentId}
                onChange={(e) => setSelectedShipmentId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none"
              >
                {shipments.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.trackingNumber} ({s.carrier.toUpperCase()} to {s.recipient.city})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1">Milestone Status</label>
              <select
                value={milestoneStatus}
                onChange={(e) => setMilestoneStatus(e.target.value as ShipmentStatus)}
                className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none"
              >
                <option value="picked_up">Picked Up by Carrier</option>
                <option value="in_transit">In Transit / Intermediate Sort</option>
                <option value="out_for_delivery">Out for Delivery</option>
                <option value="delivered">Delivered to Recipient</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1">Milestone Headline</label>
              <input
                type="text"
                value={milestoneTitle}
                onChange={(e) => setMilestoneTitle(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1">Checkpoint Location</label>
              <input
                type="text"
                value={milestoneCity}
                onChange={(e) => setMilestoneCity(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-gray-700 font-semibold mb-1">Status Description</label>
              <input
                type="text"
                value={milestoneDesc}
                onChange={(e) => setMilestoneDesc(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2 pt-2">
              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Publish Tracking Update to Customer View</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: Appointments Queue */}
      {activeStaffTab === 'appointments' && (
        <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-xs space-y-4">
          <h3 className="text-lg font-bold text-gray-900">Today&apos;s Store Appointment Check-Ins</h3>
          <div className="space-y-3">
            {appointments.map((a) => (
              <div
                key={a.id}
                className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-gray-900">{a.customerName}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                      {a.status}
                    </span>
                  </div>
                  <p className="text-gray-600 capitalize">{a.serviceType.replace(/_/g, ' ')}</p>
                  <p className="text-gray-400">{a.appointmentDate} at {a.timeSlot} • {a.customerPhone}</p>
                </div>
                <button
                  onClick={() => alert(`Customer ${a.customerName} checked in at store desk.`)}
                  className="px-3 py-1.5 bg-blue-50 text-blue-700 font-semibold rounded-xl hover:bg-blue-100 transition cursor-pointer"
                >
                  Check In Desk
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: Evening Linehaul Manifest */}
      {activeStaffTab === 'manifest' && (
        <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Daily Carrier Manifest Summary</h3>
              <p className="text-xs text-gray-500">Packages staged for 5:30 PM carrier pickup.</p>
            </div>
            <button
              onClick={() => window.print()}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Print Daily Manifest
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1">
              <span className="font-bold text-gray-900">UPS Staging Dock</span>
              <p className="text-amber-800 font-medium">3 Parcels Ready • Driver Arrival: 5:15 PM</p>
            </div>
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-1">
              <span className="font-bold text-gray-900">FedEx Express Air Bin</span>
              <p className="text-blue-800 font-medium">2 Parcels Ready • Driver Arrival: 5:30 PM</p>
            </div>
            <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200/80 space-y-1">
              <span className="font-bold text-gray-900">USPS Mail Sacks</span>
              <p className="text-sky-800 font-medium">1 Sack Ready • Shuttle Arrival: 4:45 PM</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
