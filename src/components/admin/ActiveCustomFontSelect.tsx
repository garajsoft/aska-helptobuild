"use client";

import { SelectInput, useField, useFormFields } from "@payloadcms/ui";
import type { TextFieldClientComponent } from "payload";

const LIBRARY_FIELD_NAME = "customFontLibrary";

/**
 * Renders `typography.activeCustomFont` (a plain text field storing the
 * chosen font-library array row's stable `id`) as a dropdown built from
 * whatever's currently in the sibling `typography.customFontLibrary` array —
 * read straight out of live form state, not a schema-time option list. Add,
 * rename, or remove a library entry and this list updates immediately, no
 * rebuild or redeploy needed.
 */
export const ActiveCustomFontSelect: TextFieldClientComponent = ({ field, path }) => {
  const { value, setValue } = useField<string>({ potentiallyStalePath: path });
  const libraryPath = path.replace(/[^.]+$/, LIBRARY_FIELD_NAME);

  const options = useFormFields(([fields]) => {
    const rows = fields[libraryPath]?.rows ?? [];
    return rows.map((row, i) => ({
      value: String(row.id),
      label:
        (fields[`${libraryPath}.${i}.label`]?.value as string | undefined) || `Font ${i + 1}`,
    }));
  });

  return (
    <SelectInput
      name={field.name}
      path={path}
      label={field.label}
      description={field.admin && "description" in field.admin ? field.admin.description : undefined}
      options={options}
      value={value ?? ""}
      onChange={(option) =>
        setValue(option && !Array.isArray(option) ? option.value : null)
      }
    />
  );
};

export default ActiveCustomFontSelect;
