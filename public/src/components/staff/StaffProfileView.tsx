import React, { useState } from "react";
import { AuthUser, updateProfile } from "../../lib/api";

interface StaffProfileViewProps {
  user: AuthUser;
  required: boolean;
  onSaved: (user: AuthUser) => void;
}

export const StaffProfileView: React.FC<StaffProfileViewProps> = ({ user, required, onSaved }) => {
  const [name, setName] = useState(user.name || "");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [photo, setPhoto] = useState<File>();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const { user: updated } = await updateProfile({ name, phone: phone || undefined, newPassword: password || undefined, photo });
      onSaved(updated);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to save profile");
    } finally {
      setSaving(false);
    }
  };

  return <main className="mx-auto flex min-h-[calc(100svh-8rem)] max-w-xl items-center px-4 py-10">
    <form onSubmit={submit} className="w-full space-y-5 rounded-3xl border border-gray-200 bg-white p-6 shadow-lg sm:p-8">
      <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Staff profile</p><h1 className="mt-2 text-3xl font-display font-bold text-gray-900">{required ? "Finish your profile" : "Your profile"}</h1><p className="mt-2 text-sm text-gray-500">{required ? "Set a new password and upload your work photo before entering the portal." : "Keep your account details current."}</p></div>
      <label className="block text-sm font-semibold text-gray-700">Full name<input required value={name} onChange={(event) => setName(event.target.value)} className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 font-normal" /></label>
      <label className="block text-sm font-semibold text-gray-700">Phone<input value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 font-normal" /></label>
      <label className="block text-sm font-semibold text-gray-700">New password{required && <span className="ml-1 text-red-600">required</span>}<input required={required} minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 font-normal" /></label>
      <label className="block text-sm font-semibold text-gray-700">Profile photo<input required={required} accept="image/jpeg,image/png,image/webp" type="file" onChange={(event) => setPhoto(event.target.files?.[0])} className="mt-1.5 block w-full text-sm font-normal" /></label>
      {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <button disabled={saving} className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white disabled:opacity-60">{saving ? "Saving..." : required ? "Save profile and continue" : "Save profile"}</button>
    </form>
  </main>;
};