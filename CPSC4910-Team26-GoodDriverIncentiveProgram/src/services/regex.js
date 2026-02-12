// REGEX for username. Allows only letters and numbers, and must be between 3 and 20 characters long.
export const USERNAME_REGEX = /^[a-zA-Z0-9]{3,20}$/;
export const USERNAME_REGEX_ERROR = "Username must be 3-20 characters long and contain only letters and numbers";