import type { HomeQuery } from "../../gql/graphql";
import { HomeActions } from "../homes/HomeActions";
import { ParcelImport } from "../homes/ParcelImport";
import { YardList } from "../yards/YardList";
import { muted } from "../ui/styles";
import { canEdit } from "../../lib/roles";

type Home = NonNullable<HomeQuery["home"]>;

export function MapSidebar({ home }: { home: Home }) {
  const editable = canEdit(home.myRole);

  return (
    <aside style={{ width: "360px", flexShrink: 0, overflowY: "auto", padding: "16px", background: "#f6f7f4", borderRight: "1px solid #ddd" }}>
      <h1 style={{ margin: "0 0 4px" }}>{home.name}</h1>
      <p style={muted}>{home.address}</p>
      {home.notes && <p style={{ whiteSpace: "pre-wrap" }}>{home.notes}</p>}
      <HomeActions home={home} />
      {editable && (
        <div style={{ margin: "16px 0" }}>
          <ParcelImport homeId={home.id} hasParcel={!!home.parcelGeoJson} />
        </div>
      )}
      <YardList homeId={home.id} yards={home.yards} editable={editable} />
    </aside>
  );
}
