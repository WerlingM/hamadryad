import { useParams } from "react-router-dom";
import { useHomeQuery } from "../../gql/graphql";
import { AppHeader } from "../../components/layout/AppHeader";
import { PageLayout } from "../../components/layout/PageLayout";
import { MapSidebar } from "../../components/map/MapSidebar";
import { YardMap } from "../../components/map/YardMap";
import { ParcelLayer } from "../../components/map/ParcelLayer";
import { BaseLayerToggle } from "../../components/map/BaseLayerToggle";
import { errorText } from "../../components/ui/styles";
import { geometryBounds } from "../../lib/geo";

/** Core page for a home: sidebar with details and yards beside a full-screen map. */
export default function HomeMap() {
  const { homeId = "" } = useParams();
  const { data, loading, error } = useHomeQuery({ variables: { id: homeId } });
  const home = data?.home;

  if (loading || error || !home) {
    return (
      <PageLayout title="Home" back={{ to: "/homes", label: "Homes" }}>
        {loading && <p>Loading…</p>}
        {error && <p style={errorText}>{error.message}</p>}
        {!loading && !error && <p style={errorText}>Home not found.</p>}
      </PageLayout>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", fontFamily: "sans-serif" }}>
      <AppHeader />
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <MapSidebar home={home} />
        <div style={{ flex: 1, position: "relative" }}>
          <YardMap initialBounds={geometryBounds(home.parcelGeoJson)}>
            <ParcelLayer geometry={home.parcelGeoJson} />
            <BaseLayerToggle />
          </YardMap>
        </div>
      </div>
    </div>
  );
}
