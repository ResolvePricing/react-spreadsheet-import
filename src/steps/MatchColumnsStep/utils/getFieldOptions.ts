import type { Fields } from "../../../types"

export const getFieldOptions = <T extends string>(fields: Fields<T>, fieldKey: string) => {
  // biome-ignore lint/style/noNonNullAssertion: <explanation>
  const field = fields.find(({ key }) => fieldKey === key)!
  return field.fieldType.type === "select" ? field.fieldType.options : []
}
