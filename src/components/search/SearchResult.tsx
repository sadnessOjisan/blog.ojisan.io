import * as React from "react"
import {
  Hits,
  Panel,
  PoweredBy,
  connectStateResults,
} from "react-instantsearch-dom"
import {
  SearchState,
  AllSearchResults,
  AlgoliaError,
} from "react-instantsearch-core"
import { Hit } from "./Hit"

// alogoriaのStateResultsProvidedをそのまま使う
interface IProps {
  searchState: SearchState
  searchResults: AllSearchResults
  error: AlgoliaError
}

const SearchResult: React.FC<IProps> = props => {
  const { searchState, searchResults, error } = props
  if (searchState && !searchState.query) {
    return null
  }

  return (
    <div style={{ background: "white" }}>
      <Panel header={`"${searchState.query}"の検索結果`} footer={<PoweredBy />}>
        {error ? <div>{error.message}</div> : null}
        {searchResults && searchResults.nbHits > 0 ? (
          <Hits hitComponent={Hit} />
        ) : (
          <div>No results</div>
        )}
      </Panel>
    </div>
  )
}

export const SearchResultList = connectStateResults(SearchResult)
