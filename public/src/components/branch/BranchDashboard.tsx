import React, { useEffect, useState } from "react";
import { apiRequest, assignShipmentCarrier } from "../../lib/api";

type BranchShipment = {
  _id: string;
  orderId: string;
  trackingId: string;
  status: string;
  carrier?: string;
  receiver?: { name?: string; city?: string; state?: string };
};

export const BranchDashboard: React.FC = () => {
  const [shipments, setShipments] = useState<BranchShipment[]>([]);
  const [error, setError] = useState("");

  const deployCarrier = async (shipment: BranchShipment) => {
    const carrier = window.prompt("Carrier or fleet name:", shipment.carrier || "");
    if (!carrier) return;
    try {
      await assignShipmentCarrier(shipment._id, carrier);
      setShipments((current) => current.map((item) => item._id === shipment._id ? { ...item, carrier } : item));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to deploy carrier");
    }
  };

  useEffect(() => {
    apiRequest<{ shipments: BranchShipment[] }>("/api/shipments?limit=100")
      .then(({ shipments: nextShipments }) => setShipments(nextShipments))
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : "Unable to load branch orders"));
  }, []);

  return (
    <section className="space-y-6">
      <div className="rounded-3xl bg-slate-900 p-6 text-white shadow-lg">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">Branch operations</p>
        <h1 className="mt-2 text-3xl font-display font-bold">Orders and carrier deployment</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">Orders assigned to this branch appear here. Branch managers can coordinate drivers and carrier handoffs from this workspace.</p>
      </div>
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between gap-4">
          <div><h2 className="text-xl font-bold text-gray-900">Branch order queue</h2><p className="mt-1 text-sm text-gray-500">{shipments.length} orders currently assigned.</p></div>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">Live queue</span>
        </div>
        {error && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div className="mt-5 overflow-x-auto rounded-2xl border border-gray-200">
          <table className="w-full min-w-175 text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500"><tr><th className="px-4 py-3">Order</th><th className="px-4 py-3">Tracking</th><th className="px-4 py-3">Destination</th><th className="px-4 py-3">Carrier</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Action</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {shipments.map((shipment) => <tr key={shipment._id}><td className="px-4 py-3 font-mono text-xs">{shipment.orderId}</td><td className="px-4 py-3 font-mono text-xs">{shipment.trackingId}</td><td className="px-4 py-3">{shipment.receiver?.city}, {shipment.receiver?.state}</td><td className="px-4 py-3">{shipment.carrier || "Unassigned"}</td><td className="px-4 py-3 capitalize text-blue-700">{shipment.status.replaceAll("_", " ")}</td><td className="px-4 py-3"><button onClick={() => deployCarrier(shipment)} className="rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white">Deploy</button></td></tr>)}
            </tbody>
          </table>
          {!shipments.length && !error && <p className="p-6 text-sm text-gray-500">No orders have been assigned to this branch.</p>}
        </div>
      </div>
    </section>
  );
};
