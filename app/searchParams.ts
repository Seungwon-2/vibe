import { createSearchParamsCache, parseAsArrayOf, parseAsInteger, parseAsString } from 'nuqs/server';

export const searchParamParsers = {
  keyword:    parseAsString.withDefault(''),
  types:      parseAsArrayOf(parseAsString).withDefault([]),  // 다중 타입 (OR)
  generation: parseAsInteger.withDefault(0),
  page:       parseAsInteger.withDefault(1),
  heightCat:  parseAsString.withDefault(''),
  weightCat:  parseAsString.withDefault(''),
  moveKeyword: parseAsString.withDefault(''),
  moveTypes: parseAsArrayOf(parseAsString).withDefault([]),
  moveGeneration: parseAsInteger.withDefault(0),
  moveDamageClass: parseAsString.withDefault(''),
  movePage: parseAsInteger.withDefault(1),
};

export const searchParamsCache = createSearchParamsCache(searchParamParsers);
