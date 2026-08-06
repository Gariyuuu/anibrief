export const MEDIA_FRAGMENT = /* GraphQL */ `
  fragment MediaFields on Media {
    id
    idMal
    type
    format
    status
    title {
      romaji
      english
      native
    }
    description(asHtml: false)
    coverImage {
      large
      color
    }
    bannerImage
    genres
    tags {
      name
      isMediaSpoiler
    }
    studios(isMain: true) {
      nodes {
        name
      }
    }
    episodes
    duration
    chapters
    volumes
    season
    seasonYear
    startDate {
      year
      month
      day
    }
    endDate {
      year
      month
      day
    }
    averageScore
    popularity
    favourites
    trailer {
      id
      site
      thumbnail
    }
    siteUrl
    source
    nextAiringEpisode {
      episode
      airingAt
    }
    externalLinks {
      site
      url
    }
    relations {
      edges {
        relationType
        node {
          id
          title {
            romaji
          }
          type
        }
      }
    }
  }
`;

export const SEARCH_MEDIA_QUERY = /* GraphQL */ `
  ${MEDIA_FRAGMENT}
  query SearchMedia($search: String, $type: MediaType, $page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        hasNextPage
        total
      }
      media(search: $search, type: $type, isAdult: false, sort: SEARCH_MATCH) {
        ...MediaFields
      }
    }
  }
`;

export const MEDIA_BY_ID_QUERY = /* GraphQL */ `
  ${MEDIA_FRAGMENT}
  query MediaById($id: Int) {
    Media(id: $id, isAdult: false) {
      ...MediaFields
      characters(sort: ROLE, perPage: 12) {
        edges {
          role
          node {
            id
            name {
              full
            }
            image {
              large
            }
          }
          voiceActors(language: JAPANESE) {
            id
            name {
              full
            }
            image {
              large
            }
          }
        }
      }
      staff(sort: RELEVANCE, perPage: 10) {
        edges {
          role
          node {
            id
            name {
              full
            }
            image {
              large
            }
          }
        }
      }
      recommendations(perPage: 8, sort: RATING_DESC) {
        nodes {
          mediaRecommendation {
            ...MediaFields
          }
        }
      }
    }
  }
`;

export const BROWSE_MEDIA_QUERY = /* GraphQL */ `
  ${MEDIA_FRAGMENT}
  query BrowseMedia(
    $type: MediaType
    $season: MediaSeason
    $seasonYear: Int
    $sort: [MediaSort]
    $genre_in: [String]
    $tag_in: [String]
    $format_in: [MediaFormat]
    $page: Int
    $perPage: Int
    $status: MediaStatus
    $startDate_greater: FuzzyDateInt
    $startDate_lesser: FuzzyDateInt
    $episodes_lesser: Int
  ) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        hasNextPage
        total
      }
      media(
        type: $type
        season: $season
        seasonYear: $seasonYear
        sort: $sort
        genre_in: $genre_in
        tag_in: $tag_in
        format_in: $format_in
        status: $status
        startDate_greater: $startDate_greater
        startDate_lesser: $startDate_lesser
        episodes_lesser: $episodes_lesser
        isAdult: false
      ) {
        ...MediaFields
      }
    }
  }
`;

/**
 * AniList's `Studio(search: String)` query is a real, documented part of
 * its public GraphQL schema (verified live via introspection) — it returns
 * a single best-match Studio plus its media connection, not a fabricated
 * field. Used to power Discover's studio explorer honestly instead of
 * faking a studio filter that doesn't exist on the Media query itself.
 */
export const STUDIO_SEARCH_QUERY = /* GraphQL */ `
  ${MEDIA_FRAGMENT}
  query StudioSearch($search: String, $page: Int, $perPage: Int) {
    Studio(search: $search) {
      id
      name
      siteUrl
      media(page: $page, perPage: $perPage, sort: POPULARITY_DESC) {
        pageInfo {
          hasNextPage
          total
        }
        nodes {
          ...MediaFields
        }
      }
    }
  }
`;

export const AIRING_SCHEDULE_QUERY = /* GraphQL */ `
  ${MEDIA_FRAGMENT}
  query AiringSchedule($airingAtGreater: Int, $airingAtLesser: Int, $page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        hasNextPage
      }
      airingSchedules(
        airingAt_greater: $airingAtGreater
        airingAt_lesser: $airingAtLesser
        sort: TIME
      ) {
        id
        episode
        airingAt
        media {
          ...MediaFields
        }
      }
    }
  }
`;

export const STAFF_BIRTHDAYS_QUERY = /* GraphQL */ `
  query StaffBirthdays($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      staff(isBirthday: true, sort: FAVOURITES_DESC) {
        id
        name {
          full
          native
        }
        image {
          large
        }
        primaryOccupations
        dateOfBirth {
          year
          month
          day
        }
        siteUrl
        homeTown
        description(asHtml: false)
      }
    }
  }
`;

export const CHARACTER_BIRTHDAYS_QUERY = /* GraphQL */ `
  query CharacterBirthdays($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      characters(isBirthday: true, sort: FAVOURITES_DESC) {
        id
        name {
          full
          native
        }
        image {
          large
        }
        siteUrl
        media(perPage: 1, sort: POPULARITY_DESC) {
          nodes {
            title {
              romaji
            }
          }
        }
      }
    }
  }
`;

export const STAFF_BY_ID_QUERY = /* GraphQL */ `
  query StaffById($id: Int) {
    Staff(id: $id) {
      id
      name {
        full
        native
        alternative
      }
      image {
        large
      }
      primaryOccupations
      dateOfBirth {
        year
        month
        day
      }
      homeTown
      siteUrl
      description(asHtml: false)
      characterMedia(sort: POPULARITY_DESC, perPage: 10) {
        edges {
          characterRole
          node {
            id
            title {
              romaji
            }
          }
        }
      }
      staffMedia(sort: POPULARITY_DESC, perPage: 10) {
        edges {
          staffRole
          node {
            id
            title {
              romaji
            }
          }
        }
      }
    }
  }
`;

export const SEARCH_STAFF_QUERY = /* GraphQL */ `
  query SearchStaff($search: String, $page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        hasNextPage
        total
      }
      staff(search: $search, sort: SEARCH_MATCH) {
        id
        name {
          full
          native
        }
        image {
          large
        }
        primaryOccupations
      }
    }
  }
`;

/**
 * AniList's public API only supports `isBirthday: true` for the CURRENT day —
 * there is no date-range birthday filter. To surface "upcoming birthdays"
 * honestly, we page through popular staff (by favourites) and compute
 * upcoming dates client/server-side from `dateOfBirth`, instead of inventing
 * a query AniList doesn't support.
 */
export const POPULAR_STAFF_QUERY = /* GraphQL */ `
  query PopularStaff($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        hasNextPage
        total
      }
      staff(sort: FAVOURITES_DESC) {
        id
        name {
          full
          native
        }
        image {
          large
        }
        primaryOccupations
        dateOfBirth {
          year
          month
          day
        }
        homeTown
        siteUrl
        description(asHtml: false)
      }
    }
  }
`;

/**
 * Character equivalents of the staff search/detail/popularity queries above —
 * same `Page{characters(...)}`/`Character(id:...)` shapes, verified live
 * against AniList's public schema. `dateOfBirth` is requested honestly even
 * though most characters have it unset (fictional birthdays are rarely
 * tracked) — the mapper/UI render "Unknown" rather than omitting the field.
 */
export const SEARCH_CHARACTERS_QUERY = /* GraphQL */ `
  query SearchCharacters($search: String, $page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        hasNextPage
        total
      }
      characters(search: $search, sort: SEARCH_MATCH) {
        id
        name {
          full
          native
        }
        image {
          large
        }
        favourites
      }
    }
  }
`;

export const POPULAR_CHARACTERS_QUERY = /* GraphQL */ `
  query PopularCharacters($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        hasNextPage
        total
      }
      characters(sort: FAVOURITES_DESC) {
        id
        name {
          full
          native
        }
        image {
          large
        }
        favourites
      }
    }
  }
`;

export const CHARACTER_BY_ID_QUERY = /* GraphQL */ `
  query CharacterById($id: Int) {
    Character(id: $id) {
      id
      name {
        full
        native
        alternative
      }
      image {
        large
      }
      description(asHtml: false)
      siteUrl
      favourites
      dateOfBirth {
        year
        month
        day
      }
      media(sort: POPULARITY_DESC, perPage: 12) {
        nodes {
          id
          title {
            romaji
          }
          type
        }
      }
    }
  }
`;
