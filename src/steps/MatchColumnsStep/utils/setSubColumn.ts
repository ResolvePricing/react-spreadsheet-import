import { ColumnType, type MatchedOptions, type MatchedSelectColumn, type MatchedSelectOptionsColumn } from "../MatchColumnsStep"
export const setSubColumn = <T>(
  oldColumn: MatchedSelectColumn<T> | MatchedSelectOptionsColumn<T>,
  entry: string,
  value: string,
): MatchedSelectColumn<T> | MatchedSelectOptionsColumn<T> => {
  const options = oldColumn.matchedOptions.map((option) => (option.entry === entry ? { ...option, value } : option))
  const allMathced = options.every(({ value }) => !!value)
  if (allMathced) {
    return { ...oldColumn, matchedOptions: options as MatchedOptions<T>[], type: ColumnType.matchedSelectOptions }
  }
  return { ...oldColumn, matchedOptions: options as MatchedOptions<T>[], type: ColumnType.matchedSelect }
  
}
