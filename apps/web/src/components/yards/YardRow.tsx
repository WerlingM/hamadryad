import { useState } from "react";
import { useDeleteYardMutation, useUpdateYardMutation, type YardFieldsFragment } from "../../gql/graphql";
import { errorMessage } from "../../lib/errors";
import { YARD_LOCATION_LABELS } from "../../lib/yardLocation";
import { button, card, dangerButton, errorText, muted, row } from "../ui/styles";
import { YardForm, type YardFormValues } from "./YardForm";

interface YardRowProps {
  yard: YardFieldsFragment;
  editable: boolean;
}

export function YardRow({ yard, editable }: YardRowProps) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updateYard] = useUpdateYardMutation();
  const [deleteYard, { loading: deleting }] = useDeleteYardMutation({
    variables: { id: yard.id },
    update(cache) {
      cache.evict({ id: cache.identify(yard) });
      cache.gc();
    },
  });

  const handleSave = async (values: YardFormValues) => {
    await updateYard({
      variables: {
        id: yard.id,
        input: { name: values.name, location: values.location, description: values.description || null },
      },
    });
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${yard.name}"? This cannot be undone.`)) return;
    setError(null);
    try {
      await deleteYard();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  if (editing) {
    return (
      <li style={card}>
        <YardForm
          initial={{ name: yard.name, location: yard.location, description: yard.description ?? "" }}
          submitLabel="Save"
          onSubmit={handleSave}
          onCancel={() => setEditing(false)}
        />
      </li>
    );
  }

  return (
    <li style={card}>
      <div style={{ ...row, justifyContent: "space-between" }}>
        <div>
          <strong>{yard.name}</strong>
          <p style={muted}>{YARD_LOCATION_LABELS[yard.location]}</p>
          {yard.description && <p style={muted}>{yard.description}</p>}
        </div>
        {editable && (
          <div style={row}>
            <button style={button} onClick={() => setEditing(true)}>
              Edit
            </button>
            <button style={dangerButton} onClick={handleDelete} disabled={deleting}>
              Delete
            </button>
          </div>
        )}
      </div>
      {error && <p style={errorText}>{error}</p>}
    </li>
  );
}
