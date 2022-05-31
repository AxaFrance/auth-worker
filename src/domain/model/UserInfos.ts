export interface UserInfos {
    family_name: string;
    gender: string;
    given_name: string;
    name: string;
    sub: string;
    middle_name: string;
    nickname: string;
    preferred_username: string;
    profile: string;
    picture: string;
    website: string;
    email: string;
    email_verified: boolean;
    birthdate: string;
    zoneinfo: string;
    locale: string;
    phone_number: string;
    phone_number_verified: boolean;
    address: Address;
    updated_at: number;
}

interface Address {
    formatted: string;
    street_address: string;
    locality: string;
    region: string;
    postal_code: string;
    country: string;
}
