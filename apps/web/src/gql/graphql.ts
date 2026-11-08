import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  Date: { input: string; output: string; }
  DateTime: { input: string; output: string; }
  JSON: { input: unknown; output: unknown; }
};

/** Returned by login and register mutations. */
export type AuthPayload = {
  __typename?: 'AuthPayload';
  token: Scalars['String']['output'];
  user: User;
};

export type Bed = {
  __typename?: 'Bed';
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  /** Bed outline as a GeoJSON Polygon geometry. */
  geometry?: Maybe<Scalars['JSON']['output']>;
  id: Scalars['ID']['output'];
  moisture: Moisture;
  name: Scalars['String']['output'];
  sortOrder: Scalars['Int']['output'];
  sunlight: Sunlight;
  updatedAt: Scalars['DateTime']['output'];
  yard: Yard;
};

export type BedFilter = {
  moisture?: InputMaybe<Moisture>;
  sunlight?: InputMaybe<Sunlight>;
};

export type CreateHomeInput = {
  address: Scalars['String']['input'];
  name: Scalars['String']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
};

export type CreateYardInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  location: YardLocation;
  name: Scalars['String']['input'];
  /** Defaults to after the last yard in the home. */
  sortOrder?: InputMaybe<Scalars['Int']['input']>;
};

export type Home = {
  __typename?: 'Home';
  address: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  members: Array<HomeMember>;
  /** The current user's role on this home. */
  myRole?: Maybe<MemberRole>;
  name: Scalars['String']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  parcelGeoJson?: Maybe<Scalars['JSON']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  yards: Array<Yard>;
};


export type HomeYardsArgs = {
  filter?: InputMaybe<YardFilter>;
};

export type HomeMember = {
  __typename?: 'HomeMember';
  id: Scalars['ID']['output'];
  role: MemberRole;
  user: User;
};

export type LoginInput = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};

export type MemberRole =
  | 'EDITOR'
  | 'OWNER'
  | 'VIEWER';

export type Moisture =
  | 'AVERAGE'
  | 'DRY'
  | 'MOIST'
  | 'WET';

/** Root mutation type */
export type Mutation = {
  __typename?: 'Mutation';
  createHome: Home;
  createYard: Yard;
  deleteHome: Scalars['Boolean']['output'];
  deleteYard: Scalars['Boolean']['output'];
  /** Replace the home's parcel boundary from GeoJSON text (FeatureCollection, Feature, or Polygon/MultiPolygon in WGS 84). */
  importParcel: Home;
  login: AuthPayload;
  register: AuthPayload;
  updateHome: Home;
  updateYard: Yard;
};


/** Root mutation type */
export type MutationCreateHomeArgs = {
  input: CreateHomeInput;
};


/** Root mutation type */
export type MutationCreateYardArgs = {
  homeId: Scalars['ID']['input'];
  input: CreateYardInput;
};


/** Root mutation type */
export type MutationDeleteHomeArgs = {
  id: Scalars['ID']['input'];
};


/** Root mutation type */
export type MutationDeleteYardArgs = {
  id: Scalars['ID']['input'];
};


/** Root mutation type */
export type MutationImportParcelArgs = {
  geoJson: Scalars['String']['input'];
  homeId: Scalars['ID']['input'];
};


/** Root mutation type */
export type MutationLoginArgs = {
  input: LoginInput;
};


/** Root mutation type */
export type MutationRegisterArgs = {
  input: RegisterInput;
};


/** Root mutation type */
export type MutationUpdateHomeArgs = {
  id: Scalars['ID']['input'];
  input: UpdateHomeInput;
};


/** Root mutation type */
export type MutationUpdateYardArgs = {
  id: Scalars['ID']['input'];
  input: UpdateYardInput;
};

/** Root query type */
export type Query = {
  __typename?: 'Query';
  home?: Maybe<Home>;
  /** Homes the current user is a member of. */
  homes: Array<Home>;
  /** Returns the currently authenticated user, or null. */
  me?: Maybe<User>;
};


/** Root query type */
export type QueryHomeArgs = {
  id: Scalars['ID']['input'];
};

export type RegisterInput = {
  displayName: Scalars['String']['input'];
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};

export type Sunlight =
  | 'FULL_SHADE'
  | 'FULL_SUN'
  | 'PART_SHADE';

export type UpdateHomeInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateYardInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  location?: InputMaybe<YardLocation>;
  name?: InputMaybe<Scalars['String']['input']>;
  sortOrder?: InputMaybe<Scalars['Int']['input']>;
};

export type User = {
  __typename?: 'User';
  displayName: Scalars['String']['output'];
  email: Scalars['String']['output'];
  id: Scalars['ID']['output'];
};

export type Yard = {
  __typename?: 'Yard';
  beds: Array<Bed>;
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  home: Home;
  id: Scalars['ID']['output'];
  location: YardLocation;
  name: Scalars['String']['output'];
  sortOrder: Scalars['Int']['output'];
  updatedAt: Scalars['DateTime']['output'];
};


export type YardBedsArgs = {
  filter?: InputMaybe<BedFilter>;
};

export type YardFilter = {
  location?: InputMaybe<YardLocation>;
};

export type YardLocation =
  | 'BACK'
  | 'FRONT'
  | 'OTHER'
  | 'SIDE_LEFT'
  | 'SIDE_RIGHT';

export type CreateYardMutationVariables = Exact<{
  homeId: Scalars['ID']['input'];
  input: CreateYardInput;
}>;


export type CreateYardMutation = { __typename?: 'Mutation', createYard: { __typename?: 'Yard', id: string, name: string, location: YardLocation, description?: string | null, sortOrder: number, beds: Array<{ __typename?: 'Bed', id: string, name: string }> } };

export type UpdateYardMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateYardInput;
}>;


export type UpdateYardMutation = { __typename?: 'Mutation', updateYard: { __typename?: 'Yard', id: string, name: string, location: YardLocation, description?: string | null, sortOrder: number, beds: Array<{ __typename?: 'Bed', id: string, name: string }> } };

export type DeleteYardMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteYardMutation = { __typename?: 'Mutation', deleteYard: boolean };

export type LoginMutationVariables = Exact<{
  input: LoginInput;
}>;


export type LoginMutation = { __typename?: 'Mutation', login: { __typename?: 'AuthPayload', token: string, user: { __typename?: 'User', id: string, email: string, displayName: string } } };

export type HomeSummaryFragment = { __typename?: 'Home', id: string, name: string, address: string, notes?: string | null, myRole?: MemberRole | null };

export type YardFieldsFragment = { __typename?: 'Yard', id: string, name: string, location: YardLocation, description?: string | null, sortOrder: number, beds: Array<{ __typename?: 'Bed', id: string, name: string }> };

export type HomesQueryVariables = Exact<{ [key: string]: never; }>;


export type HomesQuery = { __typename?: 'Query', homes: Array<{ __typename?: 'Home', id: string, name: string, address: string, notes?: string | null, myRole?: MemberRole | null, yards: Array<{ __typename?: 'Yard', id: string, name: string }> }> };

export type HomeQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type HomeQuery = { __typename?: 'Query', home?: { __typename?: 'Home', parcelGeoJson?: unknown | null, id: string, name: string, address: string, notes?: string | null, myRole?: MemberRole | null, yards: Array<{ __typename?: 'Yard', id: string, name: string, location: YardLocation, description?: string | null, sortOrder: number, beds: Array<{ __typename?: 'Bed', id: string, name: string }> }> } | null };

export type CreateHomeMutationVariables = Exact<{
  input: CreateHomeInput;
}>;


export type CreateHomeMutation = { __typename?: 'Mutation', createHome: { __typename?: 'Home', id: string, name: string, address: string, notes?: string | null, myRole?: MemberRole | null } };

export type UpdateHomeMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateHomeInput;
}>;


export type UpdateHomeMutation = { __typename?: 'Mutation', updateHome: { __typename?: 'Home', id: string, name: string, address: string, notes?: string | null, myRole?: MemberRole | null } };

export type DeleteHomeMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteHomeMutation = { __typename?: 'Mutation', deleteHome: boolean };

export type ImportParcelMutationVariables = Exact<{
  homeId: Scalars['ID']['input'];
  geoJson: Scalars['String']['input'];
}>;


export type ImportParcelMutation = { __typename?: 'Mutation', importParcel: { __typename?: 'Home', id: string, parcelGeoJson?: unknown | null, updatedAt: string } };

export const HomeSummaryFragmentDoc = gql`
    fragment HomeSummary on Home {
  id
  name
  address
  notes
  myRole
}
    `;
export const YardFieldsFragmentDoc = gql`
    fragment YardFields on Yard {
  id
  name
  location
  description
  sortOrder
  beds {
    id
    name
  }
}
    `;
export const CreateYardDocument = gql`
    mutation CreateYard($homeId: ID!, $input: CreateYardInput!) {
  createYard(homeId: $homeId, input: $input) {
    ...YardFields
  }
}
    ${YardFieldsFragmentDoc}`;
export type CreateYardMutationFn = Apollo.MutationFunction<CreateYardMutation, CreateYardMutationVariables>;

/**
 * __useCreateYardMutation__
 *
 * To run a mutation, you first call `useCreateYardMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateYardMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createYardMutation, { data, loading, error }] = useCreateYardMutation({
 *   variables: {
 *      homeId: // value for 'homeId'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateYardMutation(baseOptions?: Apollo.MutationHookOptions<CreateYardMutation, CreateYardMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateYardMutation, CreateYardMutationVariables>(CreateYardDocument, options);
      }
export type CreateYardMutationHookResult = ReturnType<typeof useCreateYardMutation>;
export type CreateYardMutationResult = Apollo.MutationResult<CreateYardMutation>;
export type CreateYardMutationOptions = Apollo.BaseMutationOptions<CreateYardMutation, CreateYardMutationVariables>;
export const UpdateYardDocument = gql`
    mutation UpdateYard($id: ID!, $input: UpdateYardInput!) {
  updateYard(id: $id, input: $input) {
    ...YardFields
  }
}
    ${YardFieldsFragmentDoc}`;
export type UpdateYardMutationFn = Apollo.MutationFunction<UpdateYardMutation, UpdateYardMutationVariables>;

/**
 * __useUpdateYardMutation__
 *
 * To run a mutation, you first call `useUpdateYardMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateYardMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateYardMutation, { data, loading, error }] = useUpdateYardMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateYardMutation(baseOptions?: Apollo.MutationHookOptions<UpdateYardMutation, UpdateYardMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateYardMutation, UpdateYardMutationVariables>(UpdateYardDocument, options);
      }
export type UpdateYardMutationHookResult = ReturnType<typeof useUpdateYardMutation>;
export type UpdateYardMutationResult = Apollo.MutationResult<UpdateYardMutation>;
export type UpdateYardMutationOptions = Apollo.BaseMutationOptions<UpdateYardMutation, UpdateYardMutationVariables>;
export const DeleteYardDocument = gql`
    mutation DeleteYard($id: ID!) {
  deleteYard(id: $id)
}
    `;
export type DeleteYardMutationFn = Apollo.MutationFunction<DeleteYardMutation, DeleteYardMutationVariables>;

/**
 * __useDeleteYardMutation__
 *
 * To run a mutation, you first call `useDeleteYardMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteYardMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteYardMutation, { data, loading, error }] = useDeleteYardMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteYardMutation(baseOptions?: Apollo.MutationHookOptions<DeleteYardMutation, DeleteYardMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteYardMutation, DeleteYardMutationVariables>(DeleteYardDocument, options);
      }
export type DeleteYardMutationHookResult = ReturnType<typeof useDeleteYardMutation>;
export type DeleteYardMutationResult = Apollo.MutationResult<DeleteYardMutation>;
export type DeleteYardMutationOptions = Apollo.BaseMutationOptions<DeleteYardMutation, DeleteYardMutationVariables>;
export const LoginDocument = gql`
    mutation Login($input: LoginInput!) {
  login(input: $input) {
    token
    user {
      id
      email
      displayName
    }
  }
}
    `;
export type LoginMutationFn = Apollo.MutationFunction<LoginMutation, LoginMutationVariables>;

/**
 * __useLoginMutation__
 *
 * To run a mutation, you first call `useLoginMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useLoginMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [loginMutation, { data, loading, error }] = useLoginMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useLoginMutation(baseOptions?: Apollo.MutationHookOptions<LoginMutation, LoginMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<LoginMutation, LoginMutationVariables>(LoginDocument, options);
      }
export type LoginMutationHookResult = ReturnType<typeof useLoginMutation>;
export type LoginMutationResult = Apollo.MutationResult<LoginMutation>;
export type LoginMutationOptions = Apollo.BaseMutationOptions<LoginMutation, LoginMutationVariables>;
export const HomesDocument = gql`
    query Homes {
  homes {
    ...HomeSummary
    yards {
      id
      name
    }
  }
}
    ${HomeSummaryFragmentDoc}`;

/**
 * __useHomesQuery__
 *
 * To run a query within a React component, call `useHomesQuery` and pass it any options that fit your needs.
 * When your component renders, `useHomesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useHomesQuery({
 *   variables: {
 *   },
 * });
 */
export function useHomesQuery(baseOptions?: Apollo.QueryHookOptions<HomesQuery, HomesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<HomesQuery, HomesQueryVariables>(HomesDocument, options);
      }
export function useHomesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<HomesQuery, HomesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<HomesQuery, HomesQueryVariables>(HomesDocument, options);
        }
// @ts-ignore
export function useHomesSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<HomesQuery, HomesQueryVariables>): Apollo.UseSuspenseQueryResult<HomesQuery, HomesQueryVariables>;
export function useHomesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<HomesQuery, HomesQueryVariables>): Apollo.UseSuspenseQueryResult<HomesQuery | undefined, HomesQueryVariables>;
export function useHomesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<HomesQuery, HomesQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<HomesQuery, HomesQueryVariables>(HomesDocument, options);
        }
export type HomesQueryHookResult = ReturnType<typeof useHomesQuery>;
export type HomesLazyQueryHookResult = ReturnType<typeof useHomesLazyQuery>;
export type HomesSuspenseQueryHookResult = ReturnType<typeof useHomesSuspenseQuery>;
export type HomesQueryResult = Apollo.QueryResult<HomesQuery, HomesQueryVariables>;
export const HomeDocument = gql`
    query Home($id: ID!) {
  home(id: $id) {
    ...HomeSummary
    parcelGeoJson
    yards {
      ...YardFields
    }
  }
}
    ${HomeSummaryFragmentDoc}
${YardFieldsFragmentDoc}`;

/**
 * __useHomeQuery__
 *
 * To run a query within a React component, call `useHomeQuery` and pass it any options that fit your needs.
 * When your component renders, `useHomeQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useHomeQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useHomeQuery(baseOptions: Apollo.QueryHookOptions<HomeQuery, HomeQueryVariables> & ({ variables: HomeQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<HomeQuery, HomeQueryVariables>(HomeDocument, options);
      }
export function useHomeLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<HomeQuery, HomeQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<HomeQuery, HomeQueryVariables>(HomeDocument, options);
        }
// @ts-ignore
export function useHomeSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<HomeQuery, HomeQueryVariables>): Apollo.UseSuspenseQueryResult<HomeQuery, HomeQueryVariables>;
export function useHomeSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<HomeQuery, HomeQueryVariables>): Apollo.UseSuspenseQueryResult<HomeQuery | undefined, HomeQueryVariables>;
export function useHomeSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<HomeQuery, HomeQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<HomeQuery, HomeQueryVariables>(HomeDocument, options);
        }
export type HomeQueryHookResult = ReturnType<typeof useHomeQuery>;
export type HomeLazyQueryHookResult = ReturnType<typeof useHomeLazyQuery>;
export type HomeSuspenseQueryHookResult = ReturnType<typeof useHomeSuspenseQuery>;
export type HomeQueryResult = Apollo.QueryResult<HomeQuery, HomeQueryVariables>;
export const CreateHomeDocument = gql`
    mutation CreateHome($input: CreateHomeInput!) {
  createHome(input: $input) {
    ...HomeSummary
  }
}
    ${HomeSummaryFragmentDoc}`;
export type CreateHomeMutationFn = Apollo.MutationFunction<CreateHomeMutation, CreateHomeMutationVariables>;

/**
 * __useCreateHomeMutation__
 *
 * To run a mutation, you first call `useCreateHomeMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateHomeMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createHomeMutation, { data, loading, error }] = useCreateHomeMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateHomeMutation(baseOptions?: Apollo.MutationHookOptions<CreateHomeMutation, CreateHomeMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateHomeMutation, CreateHomeMutationVariables>(CreateHomeDocument, options);
      }
export type CreateHomeMutationHookResult = ReturnType<typeof useCreateHomeMutation>;
export type CreateHomeMutationResult = Apollo.MutationResult<CreateHomeMutation>;
export type CreateHomeMutationOptions = Apollo.BaseMutationOptions<CreateHomeMutation, CreateHomeMutationVariables>;
export const UpdateHomeDocument = gql`
    mutation UpdateHome($id: ID!, $input: UpdateHomeInput!) {
  updateHome(id: $id, input: $input) {
    ...HomeSummary
  }
}
    ${HomeSummaryFragmentDoc}`;
export type UpdateHomeMutationFn = Apollo.MutationFunction<UpdateHomeMutation, UpdateHomeMutationVariables>;

/**
 * __useUpdateHomeMutation__
 *
 * To run a mutation, you first call `useUpdateHomeMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateHomeMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateHomeMutation, { data, loading, error }] = useUpdateHomeMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateHomeMutation(baseOptions?: Apollo.MutationHookOptions<UpdateHomeMutation, UpdateHomeMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateHomeMutation, UpdateHomeMutationVariables>(UpdateHomeDocument, options);
      }
export type UpdateHomeMutationHookResult = ReturnType<typeof useUpdateHomeMutation>;
export type UpdateHomeMutationResult = Apollo.MutationResult<UpdateHomeMutation>;
export type UpdateHomeMutationOptions = Apollo.BaseMutationOptions<UpdateHomeMutation, UpdateHomeMutationVariables>;
export const DeleteHomeDocument = gql`
    mutation DeleteHome($id: ID!) {
  deleteHome(id: $id)
}
    `;
export type DeleteHomeMutationFn = Apollo.MutationFunction<DeleteHomeMutation, DeleteHomeMutationVariables>;

/**
 * __useDeleteHomeMutation__
 *
 * To run a mutation, you first call `useDeleteHomeMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteHomeMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteHomeMutation, { data, loading, error }] = useDeleteHomeMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteHomeMutation(baseOptions?: Apollo.MutationHookOptions<DeleteHomeMutation, DeleteHomeMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteHomeMutation, DeleteHomeMutationVariables>(DeleteHomeDocument, options);
      }
export type DeleteHomeMutationHookResult = ReturnType<typeof useDeleteHomeMutation>;
export type DeleteHomeMutationResult = Apollo.MutationResult<DeleteHomeMutation>;
export type DeleteHomeMutationOptions = Apollo.BaseMutationOptions<DeleteHomeMutation, DeleteHomeMutationVariables>;
export const ImportParcelDocument = gql`
    mutation ImportParcel($homeId: ID!, $geoJson: String!) {
  importParcel(homeId: $homeId, geoJson: $geoJson) {
    id
    parcelGeoJson
    updatedAt
  }
}
    `;
export type ImportParcelMutationFn = Apollo.MutationFunction<ImportParcelMutation, ImportParcelMutationVariables>;

/**
 * __useImportParcelMutation__
 *
 * To run a mutation, you first call `useImportParcelMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useImportParcelMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [importParcelMutation, { data, loading, error }] = useImportParcelMutation({
 *   variables: {
 *      homeId: // value for 'homeId'
 *      geoJson: // value for 'geoJson'
 *   },
 * });
 */
export function useImportParcelMutation(baseOptions?: Apollo.MutationHookOptions<ImportParcelMutation, ImportParcelMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<ImportParcelMutation, ImportParcelMutationVariables>(ImportParcelDocument, options);
      }
export type ImportParcelMutationHookResult = ReturnType<typeof useImportParcelMutation>;
export type ImportParcelMutationResult = Apollo.MutationResult<ImportParcelMutation>;
export type ImportParcelMutationOptions = Apollo.BaseMutationOptions<ImportParcelMutation, ImportParcelMutationVariables>;