import { useState, type FormEvent } from "react";
import { errorMessage } from "../../lib/errors";
import { button, errorText, field, input, primaryButton, row } from "../ui/styles";

export interface HomeFormValues {
  name: string;
  address: string;
  notes: string;
}

interface HomeFormProps {
  initial?: HomeFormValues;
  submitLabel: string;
  onSubmit: (values: HomeFormValues) => Promise<void>;
  onCancel: () => void;
}

const EMPTY: HomeFormValues = { name: "", address: "", notes: "" };

export function HomeForm({ initial = EMPTY, submitLabel, onSubmit, onCancel }: HomeFormProps) {
  const [values, setValues] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = (key: keyof HomeFormValues) => (e: { target: { value: string } }) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await onSubmit(values);
    } catch (err) {
      setError(errorMessage(err));
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label style={field}>
        Name
        <input style={input} value={values.name} onChange={set("name")} required maxLength={200} />
      </label>
      <label style={field}>
        Address
        <input style={input} value={values.address} onChange={set("address")} required maxLength={500} />
      </label>
      <label style={field}>
        Notes
        <textarea style={{ ...input, minHeight: "80px" }} value={values.notes} onChange={set("notes")} />
      </label>
      {error && <p style={errorText}>{error}</p>}
      <div style={row}>
        <button type="submit" style={primaryButton} disabled={saving}>
          {saving ? "Saving…" : submitLabel}
        </button>
        <button type="button" style={button} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
