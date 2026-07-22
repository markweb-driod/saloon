"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Card from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

export default function ProfileForm({
  name,
  email,
  phone,
  preferences,
  allergiesNotes,
}: {
  name: string;
  email: string;
  phone: string | null;
  preferences: string;
  allergiesNotes: string;
}) {
  const router = useRouter();

  const [contactName, setContactName] = useState(name);
  const [contactPhone, setContactPhone] = useState(phone ?? "");
  const [savingContact, setSavingContact] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const [contactSaved, setContactSaved] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaved, setPasswordSaved] = useState(false);

  const [prefs, setPrefs] = useState(preferences);
  const [allergies, setAllergies] = useState(allergiesNotes);
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [notesSaved, setNotesSaved] = useState(false);

  async function saveContact() {
    setSavingContact(true);
    setContactError(null);
    setContactSaved(false);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: contactName, phone: contactPhone || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setContactError(data.error ?? "Could not save changes");
        return;
      }
      setContactSaved(true);
      router.refresh();
    } finally {
      setSavingContact(false);
    }
  }

  async function savePassword() {
    setSavingPassword(true);
    setPasswordError(null);
    setPasswordSaved(false);
    try {
      const res = await fetch("/api/account/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordError(data.error ?? "Could not update password");
        return;
      }
      setPasswordSaved(true);
      setCurrentPassword("");
      setNewPassword("");
    } finally {
      setSavingPassword(false);
    }
  }

  async function saveNotes() {
    setSavingNotes(true);
    setNotesError(null);
    setNotesSaved(false);
    try {
      const res = await fetch("/api/customers/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences: prefs, allergiesNotes: allergies }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNotesError(data.error ?? "Could not save notes");
        return;
      }
      setNotesSaved(true);
    } finally {
      setSavingNotes(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6!" flat>
        <p className="font-serif text-lg font-semibold text-navy-950">Contact info</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Input
            label="Name"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
          />
          <Input label="Email" value={email} disabled />
          <Input
            label="Phone"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder="e.g. (555) 123-4567"
          />
        </div>
        {contactError && <p className="mt-3 text-sm text-red-600">{contactError}</p>}
        {contactSaved && !contactError && (
          <p className="mt-3 text-sm text-emerald-600">Saved.</p>
        )}
        <Button
          variant="outline"
          onClick={saveContact}
          disabled={savingContact || !contactName.trim()}
          className="mt-4 px-5 py-2.5 text-sm"
        >
          {savingContact ? "Saving…" : "Save contact info"}
        </Button>
      </Card>

      <Card className="p-6!" flat>
        <p className="font-serif text-lg font-semibold text-navy-950">Change password</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Input
            label="Current password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <Input
            label="New password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 8 characters"
          />
        </div>
        {passwordError && <p className="mt-3 text-sm text-red-600">{passwordError}</p>}
        {passwordSaved && !passwordError && (
          <p className="mt-3 text-sm text-emerald-600">Password updated.</p>
        )}
        <Button
          variant="outline"
          onClick={savePassword}
          disabled={savingPassword || !currentPassword || newPassword.length < 8}
          className="mt-4 px-5 py-2.5 text-sm"
        >
          {savingPassword ? "Updating…" : "Update password"}
        </Button>
      </Card>

      <Card className="p-6!" flat>
        <p className="font-serif text-lg font-semibold text-navy-950">Preferences & allergies</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Textarea
            label="Preferences"
            rows={3}
            value={prefs}
            onChange={(e) => setPrefs(e.target.value)}
          />
          <Textarea
            label="Allergies / notes"
            rows={3}
            value={allergies}
            onChange={(e) => setAllergies(e.target.value)}
          />
        </div>
        {notesError && <p className="mt-3 text-sm text-red-600">{notesError}</p>}
        {notesSaved && !notesError && <p className="mt-3 text-sm text-emerald-600">Saved.</p>}
        <Button
          variant="outline"
          onClick={saveNotes}
          disabled={savingNotes}
          className="mt-4 px-5 py-2.5 text-sm"
        >
          {savingNotes ? "Saving…" : "Save preferences"}
        </Button>
      </Card>
    </div>
  );
}
