import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDeleteHomeMutation, type HomeSummaryFragment } from "../../gql/graphql";
import { errorMessage } from "../../lib/errors";
import { canEdit, isOwner } from "../../lib/roles";
import { button, dangerButton, errorText, row } from "../ui/styles";

/** Edit / delete buttons for a home, shown according to the user's role. */
export function HomeActions({ home }: { home: HomeSummaryFragment }) {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [deleteHome, { loading: deleting }] = useDeleteHomeMutation({
    variables: { id: home.id },
    update(cache) {
      cache.evict({ id: cache.identify(home) });
      cache.gc();
    },
  });

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${home.name}" and all of its yards? This cannot be undone.`)) return;
    setError(null);
    try {
      await deleteHome();
      navigate("/homes", { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  if (!canEdit(home.myRole)) return null;

  return (
    <>
      <div style={row}>
        <Link to={`/homes/${home.id}/edit`} style={{ ...button, textDecoration: "none", color: "inherit" }}>
          Edit
        </Link>
        {isOwner(home.myRole) && (
          <button style={dangerButton} onClick={handleDelete} disabled={deleting}>
            Delete
          </button>
        )}
      </div>
      {error && <p style={errorText}>{error}</p>}
    </>
  );
}
