import { Autocomplete, Box, CircularProgress, TextField, Typography } from '@mui/material';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { PlaceSuggestionDTO } from '@back2u/shared-types';

import { api } from '../lib/api.js';

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

interface Props {
  label?: string;
  /** The current place name (controlled). */
  value: string;
  /** Raw text changes (so the parent can keep the typed name). */
  onChange: (name: string) => void;
  /** Fired when a suggestion is chosen (resolved coords) or cleared (null). */
  onSelect: (place: PlaceSuggestionDTO | null) => void;
  /** Bias suggestions toward a point (e.g. the user's city). */
  proximity?: { lng: number; lat: number };
  helperText?: string;
  error?: boolean;
  required?: boolean;
  disabled?: boolean;
}

/**
 * Place-name search with geocoded suggestions. Users type a landmark/area and pick
 * from a dropdown; selecting resolves the latitude/longitude automatically so no one
 * has to type raw coordinates.
 */
export function PlaceAutocomplete({
  label = 'Place name',
  value,
  onChange,
  onSelect,
  proximity,
  helperText,
  error,
  required,
  disabled,
}: Props) {
  const [input, setInput] = useState(value);
  const debounced = useDebounced(input, 300);

  // Keep the input in sync if the parent resets the value externally.
  useEffect(() => {
    setInput(value);
  }, [value]);

  const { data: options = [], isFetching } = useQuery({
    queryKey: ['place-search', debounced.trim(), proximity?.lng, proximity?.lat],
    queryFn: () =>
      api.searchPlaces(debounced.trim(), {
        limit: 6,
        ...(proximity ? { lng: proximity.lng, lat: proximity.lat } : {}),
      }),
    enabled: debounced.trim().length >= 2,
    staleTime: 60_000,
  });

  return (
    <Autocomplete<PlaceSuggestionDTO, false, false, true>
      freeSolo
      disabled={disabled}
      // The server already ranks/filters; don't let MUI re-filter the labels.
      filterOptions={(opts) => opts}
      options={options}
      loading={isFetching}
      inputValue={input}
      getOptionLabel={(option) => (typeof option === 'string' ? option : option.name)}
      isOptionEqualToValue={(option, val) =>
        typeof option !== 'string' && typeof val !== 'string' && option.lng === val.lng && option.lat === val.lat
      }
      noOptionsText={debounced.trim().length < 2 ? 'Type at least 2 characters' : 'No matching places'}
      onInputChange={(_e, val) => {
        setInput(val);
        onChange(val);
      }}
      onChange={(_e, val) => {
        if (val && typeof val !== 'string') {
          onSelect(val);
          onChange(val.name);
          setInput(val.name);
        } else if (!val) {
          onSelect(null);
        }
      }}
      renderOption={(props, option) => {
        const { key, ...rest } = props as React.HTMLAttributes<HTMLLIElement> & { key?: string };
        return (
          <Box component="li" key={`${option.name}-${option.lng}-${option.lat}`} {...rest} sx={{ gap: 1.25 }}>
            <PlaceOutlinedIcon sx={{ fontSize: 18, color: '#0F766E', flexShrink: 0 }} />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" noWrap>
                {option.name}
              </Typography>
              {(option.city || option.country) && (
                <Typography variant="caption" color="text.secondary" noWrap>
                  {[option.city, option.country].filter(Boolean).join(', ')}
                </Typography>
              )}
            </Box>
          </Box>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          required={required}
          error={error}
          helperText={helperText}
          placeholder="e.g. Atomic Junction, Accra"
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {isFetching ? <CircularProgress color="inherit" size={18} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
}
