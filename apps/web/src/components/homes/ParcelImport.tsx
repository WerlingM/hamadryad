import { useRef, useState, type ChangeEvent } from "react";
import { useImportParcelMutation } from "../../gql/graphql";
import { errorMessage } from "../../lib/errors";
import { button, errorText, muted } from "../ui/styles";

const MAX_BYTES = 5 * 1024 * 1024;

interface ParcelImportProps {
  homeId: string;
  hasParcel: boolean;
}

/** Upload a GeoJSON file to set or replace the home's lot boundary. */
export function ParcelImport({ homeId, hasParcel }: ParcelImportProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [importParcel, { loading }] = useImportParcelMutation();

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    setError(null);

    if (file.size > MAX_BYTES) {
      setError("That file is larger than 5 MB. Parcel boundaries are usually much smaller.");
      return;
    }
    try {
      await importParcel({ variables: { homeId, geoJson: await file.text() } });
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".geojson,.json,application/geo+json,application/json"
        onChange={handleFile}
        hidden
      />
      <button style={button} onClick={() => inputRef.current?.click()} disabled={loading}>
        {loading ? "Importing…" : hasParcel ? "Replace lot boundary" : "Import lot boundary"}
      </button>
      {!hasParcel && <p style={muted}>Upload a GeoJSON file of your lot, e.g. from your county GIS site.</p>}
      {error && <p style={errorText}>{error}</p>}
    </div>
  );
}
