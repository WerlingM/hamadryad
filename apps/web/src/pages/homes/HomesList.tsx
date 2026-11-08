import { Link } from "react-router-dom";
import { useHomesQuery } from "../../gql/graphql";
import { PageLayout } from "../../components/layout/PageLayout";
import { card, errorText, muted, primaryButton } from "../../components/ui/styles";

export function HomesList() {
  const { data, loading, error } = useHomesQuery();
  const homes = data?.homes ?? [];

  return (
    <PageLayout
      title="Your homes"
      actions={
        <Link to="/homes/new" style={{ ...primaryButton, textDecoration: "none" }}>
          Add home
        </Link>
      }
    >
      {loading && <p>Loading…</p>}
      {error && <p style={errorText}>{error.message}</p>}
      {!loading && !error && homes.length === 0 && (
        <p style={muted}>You have no homes yet. Add one to get started.</p>
      )}
      {homes.map((home) => (
        <Link key={home.id} to={`/homes/${home.id}`} style={{ color: "inherit", textDecoration: "none" }}>
          <div style={card}>
            <strong>{home.name}</strong>
            <p style={muted}>{home.address}</p>
            <p style={muted}>
              {home.yards.length === 0
                ? "No yards"
                : home.yards.map((yard) => yard.name).join(" · ")}
            </p>
          </div>
        </Link>
      ))}
    </PageLayout>
  );
}
