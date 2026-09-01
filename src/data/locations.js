import { City, Country, State } from 'country-state-city'

// This package supplies a complete country/state/city dataset rather than a short mock list.
export const countries = Country.getAllCountries()
export const statesFor = countryCode => State.getStatesOfCountry(countryCode)
export const citiesFor = (countryCode, stateCode) => City.getCitiesOfState(countryCode, stateCode)
export const countryName = countryCode => countries.find(country => country.isoCode === countryCode)?.name || ''
export const stateName = (countryCode, stateCode) => statesFor(countryCode).find(state => state.isoCode === stateCode)?.name || ''
