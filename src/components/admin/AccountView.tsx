"use client";

import type { DocumentViewClientProps } from "payload";
import { Button, DefaultEditView } from "@payloadcms/ui";

// Payload's own Account view has no logout affordance - our AskaNav sidebar
// (which replaces DefaultNav wholesale) doesn't render one either, so there
// was previously no way to log out from the UI at all. Wrap the stock edit
// view with a Log Out button rather than reimplementing it.
export const AccountView = (props: DocumentViewClientProps) => (
  <>
    <DefaultEditView {...props} />
    <div style={{ padding: "0 var(--gutter-h) var(--gutter-h)" }}>
      <Button el="anchor" url="/admin/logout" buttonStyle="secondary">
        Log Out
      </Button>
    </div>
  </>
);

export default AccountView;
