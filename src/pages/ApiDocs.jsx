import { useMemo } from "react";
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";
import PageHeader from "../components/PageHeader";
import { BASE_URL } from "../api/client";

export default function ApiDocs() {
  const specUrl = `${BASE_URL}/v3/api-docs`;

  // Swagger UI makes its "Try it out" calls through its own fetch client, bypassing our axios
  // instance entirely. This interceptor stamps every outgoing request with the same JWT already
  // stored by the app's own login flow, so the docs page opens already authenticated — no manual
  // "Authorize" + paste-a-token step needed.
  const requestInterceptor = useMemo(
    () => (req) => {
      const token = localStorage.getItem("ic_token");
      if (token) {
        req.headers.Authorization = `Bearer ${token}`;
      }
      return req;
    },
    []
  );

  return (
    <div>
      <PageHeader
        eyebrow="REFERÊNCIA"
        title="Documentação da API"
        subtitle="Endpoints, parâmetros e modelos do backend, gerados automaticamente a partir do código e já autenticados com a sua sessão."
      />
      <div style={{ padding: 32 }}>
        <div className="panel api-docs-panel">
          <SwaggerUI url={specUrl} requestInterceptor={requestInterceptor} docExpansion="list" />
        </div>
      </div>
    </div>
  );
}
