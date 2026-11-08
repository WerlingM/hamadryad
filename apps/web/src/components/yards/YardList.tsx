import { useCreateYardMutation, type YardFieldsFragment } from "../../gql/graphql";
import { card, muted } from "../ui/styles";
import { YardForm, type YardFormValues } from "./YardForm";
import { YardRow } from "./YardRow";

interface YardListProps {
  homeId: string;
  yards: YardFieldsFragment[];
  editable: boolean;
}

export function YardList({ homeId, yards, editable }: YardListProps) {
  const [createYard] = useCreateYardMutation({ refetchQueries: ["Home"] });

  const handleAdd = async (values: YardFormValues) => {
    await createYard({
      variables: {
        homeId,
        input: { name: values.name, location: values.location, description: values.description || null },
      },
    });
  };

  return (
    <section>
      <h2>Yards</h2>
      {yards.length === 0 && <p style={muted}>No yards yet.</p>}
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {yards.map((yard) => (
          <YardRow key={yard.id} yard={yard} editable={editable} />
        ))}
      </ul>
      {editable && (
        <div style={card}>
          <h3 style={{ marginTop: 0 }}>Add a yard</h3>
          <YardForm submitLabel="Add yard" onSubmit={handleAdd} />
        </div>
      )}
    </section>
  );
}
