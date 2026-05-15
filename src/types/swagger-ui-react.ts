import type { ComponentType } from "react";

declare module "swagger-ui-react" {
  export interface SwaggerUIProps {
    spec?: unknown;
    url?: string;
    [key: string]: unknown;
  }

  const SwaggerUI: ComponentType<SwaggerUIProps>;
  export default SwaggerUI;
}

export {};
