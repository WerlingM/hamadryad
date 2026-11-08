import { useState, type FormEvent } from "react";
import type { YardLocation } from "../../gql/graphql";
import { errorMessage } from "../../lib/errors";
import { YARD_LOCATIONS, YARD_LOCATION_LABELS } from "../../lib/yardLocation";
import { button, errorText, input, primaryButton, row } from "../ui/styles";

export interface YardFormValues {
  name: string;
  location: YardLocation;
  description: string;
}

interface YardFormProps {
  initial?: YardFormValues;
  submitLabel: string;
  onSubmit: (values: YardFormValues) => Promise<void>;
  onCancel?: () => void;
}

const EMPTY: YardFormValues = { name: "", location: "FRONT", description: "" };

/** Shared form for adding and editing a yard. Resets after a successful add. */
export function YardForm({ initial, submitLabel, onSubmit, onCancel }: YardFormProps) {
  const [values, setValues] = useState(initial ?? EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await onSubmit(values);
      if (!initial) setValues(EMPTY);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ ...row, flexWrap: "wrap" }}>
        <input
          style={{ ...input, marginTop: 0, flex: "2 1 160px", width: "auto" }}
          placeholder="Yard name, e.g. Back Yard"
          aria-label="Yard name"
          value={values.name}
          onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
          required
          maxLength={200}
        />
        <select
          style={{ ...input, marginTop: 0, flex: "1 1 120px", width: "auto" }}
          aria-label="Location"
          value={values.location}
          onChange={(e) => setValues((v) => ({ ...v, location: e.target.value as YardLocation }))}
        >
          {YARD_LOCATIONS.map((loc) => (
            <option key={loc} value={loc}>
              {YARD_LOCATION_LABELS[loc]}
            </option>
          ))}
        </select>
        <button type="submit" style={primaryButton} disabled={saving}>
          {saving ? "Saving…" : submitLabel}
        </button>
        {onCancel && (
          <button type="button" style={button} onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
      <input
        style={{ ...input, marginTop: "8px" }}
        placeholder="Description (optional)"
        aria-label="Description"
        value={values.description}
        onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
      />
      {error && <p style={errorText}>{error}</p>}
    </form>
  );
}
