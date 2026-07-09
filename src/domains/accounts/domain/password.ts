export const MIN_PASSWORD_LENGTH = 8;

const HAS_LOWERCASE = /[a-z]/;
const HAS_UPPERCASE = /[A-Z]/;
const HAS_DIGIT = /\d/;
const HAS_SPECIAL = /[^A-Za-z0-9]/;

export function isValidPassword(password: string): boolean {
	return (
		password.length >= MIN_PASSWORD_LENGTH &&
		HAS_LOWERCASE.test(password) &&
		HAS_UPPERCASE.test(password) &&
		HAS_DIGIT.test(password) &&
		HAS_SPECIAL.test(password)
	);
}
