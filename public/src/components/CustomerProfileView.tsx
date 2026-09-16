import React, { useState } from "react";
import { Mail, Phone, User } from "lucide-react";
import { AuthUser, updateProfile } from "../lib/api";

interface CustomerProfileViewProps {
  user: AuthUser;
  onSaved: (user: AuthUser) => void;
}

export const CustomerProfileView: React.FC<CustomerProfileViewProps> = ({
  user,
  onSaved,
}) => {
  const [name, setName] = useState(user.name || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const { user: updated } = await updateProfile({
        name,
        phone: phone || undefined,
        newPassword: password || undefined,
      });
      setPassword("");
      onSaved(updated);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save profile",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-[calc(100svh-8rem)] max-w-xl items-center px-4 py-10">
      <form
        onSubmit={submit}
        className="w-full space-y-5 rounded-3xl border border-gray-200 bg-white p-6 shadow-lg sm:p-8"
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
            Customer profile
          </p>
          <h1 className="mt-2 text-3xl font-display font-bold text-gray-900">
            Your account details
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Keep your contact information current for faster bookings and pickups.
          </p>
        </div>

        <label className="block text-sm font-semibold text-gray-700">
          <span className="flex items-center gap-2"><User className="h-4 w-4" /> Full name</span>
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 font-normal"
          />
        </label>

        <label className="block text-sm font-semibold text-gray-700">
          <span className="flex items-center gap-2"><Phone className="h-4 w-4" /> Phone</span>
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 font-normal"
          />
        </label>

        <div className="rounded-xl bg-gray-50 px-3 py-2.5 text-sm text-gray-600">
          <span className="flex items-center gap-2 font-semibold"><Mail className="h-4 w-4" /> Email</span>
          <span className="mt-1 block">{user.email}</span>
        </div>

        <label className="block text-sm font-semibold text-gray-700">
          New password
          <input
            minLength={8}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Leave blank to keep your password"
            className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 font-normal"
          />
        </label>

        {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button
          disabled={saving}
          className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save profile"}
        </button>
      </form>
    </main>
  );
};
