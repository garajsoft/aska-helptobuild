"use client";

import type { TextFieldClientProps } from "payload";
import { FieldLabel, useField } from "@payloadcms/ui";
import { COMPONENT_CATEGORY_SUGGESTIONS } from "@/collections/Components";

/**
 * Free-text category input with a native <datalist> of suggested category
 * names — lets users pick a standard category or type their own, unlike a
 * `select` field which only accepts predefined options.
 */
export const CategoryField = ({ field, path }: TextFieldClientProps) => {
  const { value, setValue } = useField<string>({ path });

  return (
    <div className="field-type text">
      <FieldLabel label={field.label} required={field.required} />
      <input
        list="aska-component-category-suggestions"
        className="field-type text"
        value={value ?? ""}
        onChange={(e) => setValue(e.target.value)}
        placeholder="e.g. Heroes, or your own category"
      />
      <datalist id="aska-component-category-suggestions">
        {COMPONENT_CATEGORY_SUGGESTIONS.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
    </div>
  );
};

export default CategoryField;
