import {
  ApolloClient,
  InMemoryCache,
  ApolloLink,
  HttpLink,
  Observable,
  from,
} from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { useAuthStore } from "./stores/authStore";

const authLink = new ApolloLink((operation, forward) => {
  const token = useAuthStore.getState().token;
  operation.setContext(
    ({ headers = {} }: { headers: Record<string, string> }) => ({
      headers: {
        ...headers,
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    })
  );
  return forward(operation);
});

const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  const httpUnauthorized =
    !!networkError && "statusCode" in networkError && networkError.statusCode === 401;
  const gqlUnauthenticated = graphQLErrors?.some(
    (err) => err.extensions?.code === "UNAUTHENTICATED"
  );
  // Only refresh when an authenticated request was rejected (e.g. expired token),
  // not for failed logins. The retried request goes straight to httpLink, so no loop.
  const hadToken = !!useAuthStore.getState().token;
  if ((httpUnauthorized || gqlUnauthenticated) && hadToken) {
    return new Observable((observer) => {
      fetch("/auth/refresh", { method: "POST", credentials: "include" })
        .then((res) => {
          if (!res.ok) throw new Error("Refresh failed");
          return res.json() as Promise<{ token: string }>;
        })
        .then(({ token }) => {
          const currentUser = useAuthStore.getState().user;
          if (currentUser) {
            useAuthStore.getState().setAuth(token, currentUser);
          }
          operation.setContext(
            ({ headers = {} }: { headers: Record<string, string> }) => ({
              headers: { ...headers, authorization: `Bearer ${token}` },
            })
          );
          forward(operation).subscribe({
            next: observer.next.bind(observer),
            error: observer.error.bind(observer),
            complete: observer.complete.bind(observer),
          });
        })
        .catch(() => {
          useAuthStore.getState().clearAuth();
          observer.error(networkError ?? graphQLErrors?.[0]);
        });
    });
  }
});

const httpLink = new HttpLink({
  uri: "/graphql",
  credentials: "include",
});

export const apolloClient = new ApolloClient({
  link: from([authLink, errorLink, httpLink]),
  cache: new InMemoryCache(),
  connectToDevTools: true,
});
