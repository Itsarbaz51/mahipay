export interface Address {
  id: string;
  address: string;
  pinCode: string;
  stateId: string;
  cityId: string;
}

export interface AddressInput {
  address: string;
  pinCode: string;
  stateId: string;
  cityId: string;
}

export interface City {
  id: string;
  cityName: string;
}

export interface CityInput {
  cityName: string;
}

export interface State {
  id: string;
  stateName: string;
}

export interface StateInput {
  stateName: string;
}
