"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createReminder } from "@/lib/actions/calendarReminders";

export function AddReminderForm() {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !date) {
      setError("Title and date are required.");
      setSuccess(false);
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await createReminder({
          title: title.trim(),
          date: new Date(`${date}T12:00:00Z`).toISOString(),
          description: description.trim() || null,
        });
        setTitle("");
        setDate("");
        setDescription("");
        setSuccess(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create reminder.");
        setSuccess(false);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2 rounded-md border border-border bg-surface p-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted" htmlFor="reminder-title">
          Title
        </label>
        <input
          id="reminder-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Season finale watch party"
          className="rounded-md border border-border bg-surface px-2 py-1.5 text-sm outline-none focus:border-accent"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted" htmlFor="reminder-date">
          Date
        </label>
        <input
          id="reminder-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-md border border-border bg-surface px-2 py-1.5 text-sm outline-none focus:border-accent"
        />
      </div>
      <div className="flex min-w-40 flex-1 flex-col gap-1">
        <label className="text-xs text-muted" htmlFor="reminder-desc">
          Note (optional)
        </label>
        <input
          id="reminder-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="rounded-md border border-border bg-surface px-2 py-1.5 text-sm outline-none focus:border-accent"
        />
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        <Plus className="h-3.5 w-3.5" /> {pending ? "Adding…" : "Add reminder"}
      </Button>
      {error && <p className="w-full text-xs text-negative">{error}</p>}
      {success && <p className="w-full text-xs text-positive">Reminder added.</p>}
    </form>
  );
}
