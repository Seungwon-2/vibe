import { createSearchParamsCache, parseAsArrayOf, parseAsInteger, parseAsString } from 'nuqs/server';

export const searchParamParsers = {
  keyword:    parseAsString.withDefault(''),
  types:      parseAsArrayOf(parseAsString).withDefault([]),  // 다중 타입 (OR)
  generation: parseAsInteger.withDefault(0),
  page:       parseAsInteger.withDefault(1),
  heightCat:  parseAsString.withDefault(''),
  weightCat:  parseAsString.withDefault(''),
};

export const searchParamsCache = createSearchParamsCache(searchParamParsers);
