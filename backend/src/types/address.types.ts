export interface State {
  id: string;
  stateName: string;
  stateCode: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StateInput {
  stateName: string;
}

export interface City {
  id: string;
  cityName: string;
  cityCode: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CityInput {
  cityName: string;
}

export interface Address {
  id: string;
  address: string;
  pinCode: string;
  stateId: string;
  cityId: string;
  createdAt: Date;
  updatedAt: Date;
  state?: State;
  city?: City;
}

export interface AddressInput {
  address: string;
  pinCode: string;
  stateId: string;
  cityId: string;
}
