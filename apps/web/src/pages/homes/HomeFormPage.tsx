import { useNavigate, useParams } from "react-router-dom";
import { useCreateHomeMutation, useHomeQuery, useUpdateHomeMutation } from "../../gql/graphql";
import { PageLayout } from "../../components/layout/PageLayout";
import { HomeForm, type HomeFormValues } from "../../components/homes/HomeForm";
import { errorText } from "../../components/ui/styles";

const toInput = (values: HomeFormValues) => ({
  name: values.name,
  address: values.address,
  notes: values.notes || null,
});

/** Create a home (/homes/new) or edit one (/homes/:homeId/edit). */
export function HomeFormPage() {
  const { homeId } = useParams();
  const navigate = useNavigate();
  const isEdit = !!homeId;

  const { data, loading, error } = useHomeQuery({ variables: { id: homeId ?? "" }, skip: !isEdit });
  const [createHome] = useCreateHomeMutation({
    update(cache) {
      cache.evict({ fieldName: "homes" });
    },
  });
  const [updateHome] = useUpdateHomeMutation();

  const handleSubmit = async (values: HomeFormValues) => {
    if (isEdit) {
      await updateHome({ variables: { id: homeId, input: toInput(values) } });
      navigate(`/homes/${homeId}`);
    } else {
      const result = await createHome({ variables: { input: toInput(values) } });
      const id = result.data?.createHome.id;
      navigate(id ? `/homes/${id}` : "/homes");
    }
  };

  const cancel = () => navigate(isEdit ? `/homes/${homeId}` : "/homes");
  const home = data?.home;

  return (
    <PageLayout
      title={isEdit ? "Edit home" : "Add home"}
      back={isEdit ? { to: `/homes/${homeId}`, label: home?.name ?? "Home" } : { to: "/homes", label: "Homes" }}
    >
      {isEdit && loading && <p>Loading…</p>}
      {isEdit && error && <p style={errorText}>{error.message}</p>}
      {isEdit && !loading && !error && !home && <p style={errorText}>Home not found.</p>}
      {(!isEdit || home) && (
        <HomeForm
          initial={home ? { name: home.name, address: home.address, notes: home.notes ?? "" } : undefined}
          submitLabel={isEdit ? "Save" : "Create home"}
          onSubmit={handleSubmit}
          onCancel={cancel}
        />
      )}
    </PageLayout>
  );
}
