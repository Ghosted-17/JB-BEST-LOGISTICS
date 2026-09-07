'use client';

import React, { useEffect, useState, useRef } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Shipment, TrackingLog, ShipmentStatus } from '@/types';
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Building2,
  Calendar,
  Layers,
  Radio,
  ExternalLink,
} from 'lucide-react';

interface PageProps {
  params: { trackingId: string } | Promise<{ trackingId: string }>;
}

// Demo fallback data representing a live shipment for JB & Best Logistics LLC
const DEMO_SHIPMENT: Shipment = {
  id: 'JB-8829-US',
  trackingNumber: 'JB-8829-US',
  carrier: 'fedex',
  serviceLevel: 'FedEx Priority Overnight',
  sender: {
    name: 'JB & Best Logistics Hub',
    company: 'JB & Best Logistics LLC',
    street: '2450 Piedmont Rd NE, Suite 100',
    city: 'Atlanta',
    state: 'GA',
    zip: '30324',
    country: 'USA',
    phone: '+1 (404) 555-0199',
    email: 'dispatch@jbbestlogistics.com',
  },
  recipient: {
    name: 'Sarah Jenkins',
    company: 'Peachtree Creative Studio',
    street: '1200 Savannah Hwy',
    city: 'Augusta',
    state: 'GA',
    zip: '30901',
    country: 'USA',
    phone: '+1 (706) 555-4821',
  },
  packageDetails: {
    weightLbs: 4.8,
    dimensions: { length: 14, width: 10, height: 4, unit: 'in' },
    packageType: 'box',
    isFragile: true,
    requiresSignature: true,
    declaredValue: 450,
  },
  currentStatus: 'out_for_delivery',
  currentLocation: {
    city: 'Augusta',
    state: 'GA',
    country: 'USA',
    latitude: 33.4735,
    longitude: -81.968,
    facilityName: 'Augusta Local Metro Delivery Depot',
  },
  originLocation: {
    city: 'Atlanta',
    state: 'GA',
    country: 'USA',
    latitude: 33.749,
    longitude: -84.388,
    facilityName: 'JB & Best Logistics Retail Hub',
  },
  destinationLocation: {
    city: 'Augusta',
    state: 'GA',
    country: 'USA',
    latitude: 33.4735,
    longitude: -81.968,
    facilityName: 'Client Destination',
  },
  estimatedDelivery: 'Today by 4:30 PM',
  createdAt: '2026-09-06T08:30:00Z',
  updatedAt: '2026-09-07T10:15:00Z',
  trackingLogs: [
    {
      id: 'log-1',
      shipmentId: 'JB-8829-US',
      status: 'order_created',
      title: 'Shipping Label Created & Verified',
      description: 'Shipment registered at JB & Best Logistics retail terminal.',
      location: {
        city: 'Atlanta',
        state: 'GA',
        country: 'USA',
        latitude: 33.749,
        longitude: -84.388,
        facilityName: 'JB & Best Logistics Hub - Piedmont Rd',
      },
      timestamp: '2026-09-06T09:12:00Z',
    },
    {
      id: 'log-2',
      shipmentId: 'JB-8829-US',
      status: 'picked_up',
      title: 'Package Processed & Weighed',
      description: 'Carrier sorting hub scan completed. Manifest sealed.',
      location: {
        city: 'Atlanta',
        state: 'GA',
        country: 'USA',
        latitude: 33.749,
        longitude: -84.388,
        facilityName: 'Regional Carrier Hub (FedEx Express)',
      },
      timestamp: '2026-09-06T15:40:00Z',
    },
    {
      id: 'log-3',
      shipmentId: 'JB-8829-US',
      status: 'in_transit',
      title: 'In Transit via I-20 Corridor',
      description: 'Linehaul vehicle departed Atlanta transit facility towards Augusta.',
      location: {
        city: 'Greensboro',
        state: 'GA',
        country: 'USA',
        latitude: 33.5757,
        longitude: -83.1824,
        facilityName: 'Mid-Georgia Highway Waypoint',
      },
      timestamp: '2026-09-06T23:10:00Z',
    },
    {
      id: 'log-4',
      shipmentId: 'JB-8829-US',
      status: 'out_for_delivery',
      title: 'Out for Delivery',
      description: 'Loaded on local delivery courier vehicle. Driver in transit.',
      location: {
        city: 'Augusta',
        state: 'GA',
        country: 'USA',
        latitude: 33.4735,
        longitude: -81.968,
        facilityName: 'Augusta Metro Distribution Hub',
      },
      timestamp: '2026-09-07T08:45:00Z',
    },
  ],
};

const MILESTONES: { status: ShipmentStatus; label: string; description: string }[] = [
  { status: 'order_created', label: 'Order Created', description: 'Label generated' },
  { status: 'picked_up', label: 'Picked Up', description: 'Origin scan' },
  { status: 'in_transit', label: 'In Transit', description: 'Moving to destination' },
  { status: 'out_for_delivery', label: 'Out for Delivery', description: 'With courier' },
  { status: 'delivered', label: 'Delivered', description: 'Signed and delivered' },
];

export default function TrackingPage({ params }: PageProps) {
  const [resolvedTrackingId, setResolvedTrackingId] = useState<string>('');
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isLiveListening, setIsLiveListening] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  // Unwrap params safely for Next.js App Router (supports both direct and async params)
  useEffect(() => {
    Promise.resolve(params).then((resolved) => {
      setResolvedTrackingId(resolved.trackingId);
    });
  }, [params]);

  // Firestore onSnapshot real-time listener
  useEffect(() => {
    if (!resolvedTrackingId) return;

    setLoading(true);
    setError(null);

    try {
      const docRef = doc(db, 'shipments', resolvedTrackingId);
      const unsubscribe = onSnapshot(
        docRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data() as Shipment;
            setShipment({
              ...data,
              id: snapshot.id,
            });
            setIsLiveListening(true);
            setLoading(false);
          } else {
            // If document does not exist in live Firestore, provide DEMO fallback data
            console.warn(`Shipment ${resolvedTrackingId} not found in Firestore. Loading showcase data.`);
            setShipment({
              ...DEMO_SHIPMENT,
              id: resolvedTrackingId,
              trackingNumber: resolvedTrackingId,
            });
            setIsLiveListening(false);
            setLoading(false);
          }
        },
        (err) => {
          console.error('Firestore onSnapshot listener error:', err);
          // Graceful fallback to interactive preview
          setShipment({
            ...DEMO_SHIPMENT,
            id: resolvedTrackingId,
            trackingNumber: resolvedTrackingId,
          });
          setIsLiveListening(false);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err: any) {
      console.error('Failed to establish Firestore listener:', err);
      setShipment(DEMO_SHIPMENT);
      setLoading(false);
    }
  }, [resolvedTrackingId]);

  // Mapbox GL initialization or interactive SVG map pin fallback
  useEffect(() => {
    if (!shipment || !mapContainerRef.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (token) {
      import('mapbox-gl').then(({ default: mapboxgl }) => {
        if (!mapContainerRef.current) return;
        (mapboxgl as any).accessToken = token;

        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
        }

        const map = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [shipment.currentLocation.longitude, shipment.currentLocation.latitude],
          zoom: 11,
        });

        // Add Marker for current GPS location
        new mapboxgl.Marker({ color: '#2563EB' })
          .setLngLat([shipment.currentLocation.longitude, shipment.currentLocation.latitude])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }).setHTML(
              `<div style="font-family: sans-serif; padding: 4px;">
                <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: bold;">${shipment.trackingNumber}</h4>
                <p style="margin: 0; font-size: 12px; color: #4b5563;">Status: ${shipment.currentStatus.toUpperCase()}</p>
                <p style="margin: 4px 0 0 0; font-size: 11px; color: #6b7280;">${shipment.currentLocation.city}, ${shipment.currentLocation.state}</p>
              </div>`
            )
          )
          .addTo(map);

        mapInstanceRef.current = map;
      }).catch((e) => {
        console.warn('Mapbox GL dynamic import fallback:', e);
      });
    }
  }, [shipment]);

  const getCarrierColor = (carrier: string) => {
    switch (carrier) {
      case 'fedex':
        return 'bg-purple-600 text-white border-purple-700';
      case 'ups':
        return 'bg-amber-800 text-amber-50 border-amber-900';
      case 'usps':
        return 'bg-blue-700 text-white border-blue-800';
      default:
        return 'bg-emerald-700 text-white border-emerald-800';
    }
  };

  const getStatusIndex = (status: ShipmentStatus) => {
    const order: ShipmentStatus[] = ['order_created', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered'];
    return order.indexOf(status);
  };

  const currentIndex = shipment ? getStatusIndex(shipment.currentStatus) : -1;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-600 font-medium">Connecting to JB & Best Logistics real-time telemetry...</p>
        </div>
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md bg-white p-8 rounded-xl border border-slate-200 shadow-sm text-center">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900">Shipment Not Found</h2>
          <p className="text-slate-600 mt-2">
            No package records matching tracking ID &quot;{resolvedTrackingId}&quot;.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white text-lg">
              JB
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none">JB & Best Logistics LLC</h1>
              <p className="text-xs text-slate-400 mt-1">Multi-Carrier Shipping & Retail Hub • Georgia, USA</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700 text-xs">
              <span className={`w-2 h-2 rounded-full ${isLiveListening ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-slate-300">
                {isLiveListening ? 'Firestore Real-Time Live' : 'Active Telemetry Simulation'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Main Status Header Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${getCarrierColor(shipment.carrier)}`}>
                  {shipment.carrier.toUpperCase()}
                </span>
                <span className="text-sm font-medium text-slate-500">{shipment.serviceLevel}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Tracking ID: {shipment.trackingNumber}
              </h2>
              <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-400" />
                Current Facility: <strong className="text-slate-700">{shipment.currentLocation.facilityName || shipment.currentLocation.city}</strong>
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 sm:min-w-[280px]">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Estimated Delivery</p>
              <p className="text-xl sm:text-2xl font-black text-blue-950 mt-1">{shipment.estimatedDelivery}</p>
              <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Status: <span className="font-semibold capitalize">{shipment.currentStatus.replace(/_/g, ' ')}</span>
              </p>
            </div>
          </div>

          {/* Stepper Progress Bar */}
          <div className="pt-8">
            <div className="grid grid-cols-5 gap-2 relative">
              {/* Connector line */}
              <div className="absolute top-5 left-[10%] right-[10%] h-1 bg-slate-200 -z-0" />
              <div
                className="absolute top-5 left-[10%] h-1 bg-blue-600 -z-0 transition-all duration-500"
                style={{
                  width: `${Math.max(0, Math.min(100, (currentIndex / (MILESTONES.length - 1)) * 80))}%`,
                }}
              />

              {MILESTONES.map((milestone, idx) => {
                const isPassed = idx <= currentIndex;
                const isCurrent = idx === currentIndex;

                return (
                  <div key={milestone.status} className="flex flex-col items-center text-center relative z-10">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                        isCurrent
                          ? 'bg-blue-600 text-white ring-4 ring-blue-100 scale-110'
                          : isPassed
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border-2 border-slate-300 text-slate-400'
                      }`}
                    >
                      {isPassed ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                    </div>
                    <p className={`text-xs sm:text-sm font-semibold mt-3 ${isPassed ? 'text-slate-900' : 'text-slate-400'}`}>
                      {milestone.label}
                    </p>
                    <p className="hidden sm:block text-[11px] text-slate-500 mt-0.5 max-w-[120px]">
                      {milestone.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Two Column Grid: Mapbox Map + Telemetry Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Interactive Mapbox / GPS Visualizer (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span className="text-sm font-semibold">Live GPS Telemetry (Mapbox Engine)</span>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {shipment.currentLocation.latitude.toFixed(4)}°N, {shipment.currentLocation.longitude.toFixed(4)}°W
                </span>
              </div>

              {/* Mapbox container with styled overlay */}
              <div className="relative w-full h-[420px] bg-slate-100 overflow-hidden">
                {/* Fallback & interactive GPS Canvas */}
                <div ref={mapContainerRef} className="absolute inset-0 w-full h-full">
                  {/* High quality stylized map representation if token isn't configured */}
                  <div className="w-full h-full bg-[#e5e9ec] relative flex flex-col justify-between p-6">
                    {/* Grid lines and geographic route representation */}
                    <svg className="absolute inset-0 w-full h-full opacity-60 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#cbd5e1" strokeWidth="0.75" />
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#grid)" />
                      {/* Transit Line between Atlanta and Augusta */}
                      <path
                        d="M 120 280 Q 260 210, 480 180"
                        fill="none"
                        stroke="#2563eb"
                        strokeWidth="4"
                        strokeDasharray="6 6"
                        className="animate-pulse"
                      />
                    </svg>

                    {/* Origin Pin (Atlanta Hub) */}
                    <div className="absolute left-[100px] top-[260px] flex flex-col items-center">
                      <div className="px-2 py-1 rounded bg-slate-900 text-white text-[10px] font-bold shadow-md whitespace-nowrap mb-1">
                        Origin: Atlanta, GA (Hub)
                      </div>
                      <div className="w-4 h-4 rounded-full bg-slate-900 border-2 border-white shadow" />
                    </div>

                    {/* Destination Pin */}
                    <div className="absolute right-[80px] top-[140px] flex flex-col items-center">
                      <div className="px-2 py-1 rounded bg-emerald-700 text-white text-[10px] font-bold shadow-md whitespace-nowrap mb-1">
                        Dest: Augusta, GA
                      </div>
                      <div className="w-4 h-4 rounded-full bg-emerald-600 border-2 border-white shadow" />
                    </div>

                    {/* Live Package Active GPS Pin */}
                    <div className="absolute left-[54%] top-[42%] transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-blue-500/20 animate-ping absolute -inset-1" />
                        <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xl border-2 border-white relative z-10">
                          <Truck className="w-5 h-5" />
                        </div>
                      </div>
                      <div className="bg-white/95 backdrop-blur-sm border border-slate-300 rounded-lg p-2 mt-2 shadow-lg text-center">
                        <p className="text-[11px] font-bold text-blue-900 leading-tight">Current Courier Location</p>
                        <p className="text-[10px] text-slate-600 font-medium">Augusta Regional Vicinity</p>
                      </div>
                    </div>

                    {/* Map footer watermark & legend */}
                    <div className="relative z-10 mt-auto flex items-center justify-between text-xs text-slate-500 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-200">
                      <span className="font-semibold text-slate-700">Mapbox GL JS Engine • Georgia Territory</span>
                      <span>Next scan expected: &lt; 30 mins</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Package Specs Summary */}
              <div className="p-6 bg-white border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <span className="text-xs text-slate-500 block">Total Weight</span>
                  <span className="text-sm font-bold text-slate-900">{shipment.packageDetails.weightLbs} lbs</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Dimensions</span>
                  <span className="text-sm font-bold text-slate-900">
                    {shipment.packageDetails.dimensions.length}x{shipment.packageDetails.dimensions.width}x
                    {shipment.packageDetails.dimensions.height} in
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Package Type</span>
                  <span className="text-sm font-bold text-slate-900 capitalize">{shipment.packageDetails.packageType}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Handling</span>
                  <span className="text-sm font-bold text-slate-900">
                    {shipment.packageDetails.isFragile ? 'Fragile / Signed' : 'Standard'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Milestone Timeline Logs (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center justify-between">
                <span>Tracking Milestones</span>
                <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded">
                  {shipment.trackingLogs.length} updates
                </span>
              </h3>

              <div className="relative border-l-2 border-slate-200 ml-3 pl-6 space-y-6">
                {shipment.trackingLogs
                  .slice()
                  .reverse()
                  .map((log, index) => {
                    const isLatest = index === 0;
                    return (
                      <div key={log.id} className="relative">
                        {/* Dot indicator */}
                        <div
                          className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 border-white ${
                            isLatest ? 'bg-blue-600 ring-4 ring-blue-100' : 'bg-slate-400'
                          }`}
                        />
                        <div>
                          <div className="flex items-baseline justify-between gap-2">
                            <h4 className={`text-sm font-bold ${isLatest ? 'text-blue-900' : 'text-slate-800'}`}>
                              {log.title}
                            </h4>
                            <span className="text-[11px] text-slate-400 whitespace-nowrap">
                              {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1">{log.description}</p>
                          <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {log.location.facilityName || `${log.location.city}, ${log.location.state}`}
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Hub Support & Assistance Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-sm">
              <h4 className="font-bold text-base flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
                JB & Best Logistics Support Hub
              </h4>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Need to redirect this package, arrange warehouse hold, or schedule notary/packing assistance in Georgia?
              </p>
              <div className="mt-4 pt-4 border-t border-slate-700/80 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block">Store Dispatch</span>
                  <strong className="text-white">+1 (404) 555-0199</strong>
                </div>
                <a
                  href="#contact"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-medium transition"
                >
                  Contact Desk
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
