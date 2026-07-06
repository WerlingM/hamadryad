import React from "react";
import ReactDOM from "react-dom/client";
import { ApolloProvider } from "@apollo/client";
import { RouterProvider } from "react-router-dom";
import { apolloClient } from "./apollo";
import { router } from "./router";

const root = document.getElementById("root");
if (!root) throw new Error("Root element #root not found in index.html");

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <ApolloProvider client={apolloClient}>
      <RouterProvider router={router} />
    </ApolloProvider>
  </React.StrictMode>
);
