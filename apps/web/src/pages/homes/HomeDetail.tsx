import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDeleteHomeMutation, useHomeQuery } from "../../gql/graphql";
import { PageLayout } from "../../components/layout/PageLayout";
import { YardList } from "../../components/yards/YardList";
import { button, dangerButton, errorText, muted } from "../../components/ui/styles";
import { errorMessage } from "../../lib/errors";
import { canEdit, isOwner } from "../../lib/roles";

export function HomeDetail() {
  const { homeId = "" } = useParams();
  const navigate = useNavigate();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { data, loading, error } = useHomeQuery({ variables: { id: homeId } });
  const [deleteHome, { loading: deleting }] = useDeleteHomeMutation({
    variables: { id: homeId },
    update(cache) {
      cache.evict({ id: cache.identify({ __typename: "Home", id: homeId }) });
      cache.gc();
    },
  });

  const home = data?.home;
  const back = { to: "/homes", label: "Homes" };

  if (loading || error || !home) {
    return (
      <PageLayout title="Home" back={back}>
        {loading && <p>Loading…</p>}
        {error && <p style={errorText}>{error.message}</p>}
        {!loading && !error && <p style={errorText}>Home not found.</p>}
      </PageLayout>
    );
  }

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${home.name}" and all of its yards? This cannot be undone.`)) return;
    setDeleteError(null);
    try {
      await deleteHome();
      navigate("/homes", { replace: true });
    } catch (err) {
      setDeleteError(errorMessage(err));
    }
  };

  return (
    <PageLayout
      title={home.name}
      back={back}
      actions={
        <>
          {canEdit(home.myRole) && (
            <Link to={`/homes/${home.id}/edit`} style={{ ...button, textDecoration: "none", color: "inherit" }}>
              Edit
            </Link>
          )}
          {isOwner(home.myRole) && (
            <button style={dangerButton} onClick={handleDelete} disabled={deleting}>
              Delete
            </button>
          )}
        </>
      }
    >
      <p style={muted}>{home.address}</p>
      {home.notes && <p style={{ whiteSpace: "pre-wrap" }}>{home.notes}</p>}
      {deleteError && <p style={errorText}>{deleteError}</p>}
      <YardList homeId={home.id} yards={home.yards} editable={canEdit(home.myRole)} />
    </PageLayout>
  );
}
