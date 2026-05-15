"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });
import "swagger-ui-react/swagger-ui.css";

export default function ApiDocsPage() {
  const [spec, setSpec] = useState(null);

  useEffect(() => {
    fetch("/api/docs")
      .then((res) => res.json())
      .then((data) => setSpec(data));
  }, []);

  if (!spec) return <div style={{ padding: "2rem", textAlign: "center" }}>Cargando API docs...</div>;

  return (
    <div style={{ padding: "1rem" }}>
      <SwaggerUI spec={spec} />
    </div>
  );
}
