"use client";

import { useRef, useState, type ChangeEvent, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { Button, toast, useSelection } from "@payloadcms/ui";
import { SelectAllStatus } from "@payloadcms/ui/providers/Selection";

const barStyle: CSSProperties = {
  display: "flex",
  gap: "8px",
  alignItems: "center",
  flexWrap: "wrap",
  marginBottom: "16px",
};

interface ImportResult {
  message?: string;
  error?: string;
  errors?: string[];
}

async function downloadExport(collectionSlug: string, ids?: (string | number)[]) {
  const url = new URL("/api/cms/export", window.location.origin);
  url.searchParams.set("collection", collectionSlug);
  if (ids?.length) url.searchParams.set("ids", ids.join(","));

  const res = await fetch(url.toString());
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    toast.error(body?.error ?? "Export failed");
    return;
  }

  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = `${collectionSlug}-export.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objectUrl);
}

/**
 * Renders above every wired collection's list table (admin.components.beforeListTable).
 * "Bulk Export JSON" reacts live to row checkboxes via useSelection() — Payload
 * has no separate registration point for custom bulk actions in this version.
 */
export const ImportExportBar = ({ collectionSlug }: { collectionSlug: string }) => {
  const { count, selectAll, selectedIDs } = useSelection();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  async function onFileChosen(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setImporting(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("collection", collectionSlug);
      const res = await fetch("/api/cms/import", { method: "POST", body: form });
      const result = (await res.json()) as ImportResult;

      if (!res.ok) {
        toast.error(result.error ?? "Import failed");
        return;
      }
      toast.success(result.message ?? "Import complete");
      if (result.errors?.length) {
        toast.warning(`${result.errors.length} item(s) failed — see console for details`);
        console.warn("Import errors:", result.errors);
      }
      router.refresh();
    } catch {
      toast.error("Import failed");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div style={barStyle}>
      <Button
        size="small"
        buttonStyle="secondary"
        onClick={() => void downloadExport(collectionSlug)}
      >
        Export All JSON
      </Button>
      {count > 0 && (
        <Button
          size="small"
          buttonStyle="secondary"
          onClick={() =>
            void downloadExport(
              collectionSlug,
              selectAll === SelectAllStatus.AllAvailable ? undefined : selectedIDs
            )
          }
        >
          Bulk Export JSON ({count})
        </Button>
      )}
      <Button
        size="small"
        buttonStyle="secondary"
        disabled={importing}
        onClick={() => fileInputRef.current?.click()}
      >
        {importing ? "Importing…" : "Import JSON"}
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={onFileChosen}
      />
    </div>
  );
};

export default ImportExportBar;
