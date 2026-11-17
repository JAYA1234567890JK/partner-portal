export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const mobilePattern = /^\+?[0-9\s().-]{8,18}$/;
export function validateRegistration(values) {
  const errors = {};
  ['fullName', 'businessName', 'email', 'mobile', 'password', 'confirmPassword', 'businessType', 'city', 'state'].forEach((field) => { if (!values[field]?.trim()) errors[field] = 'This field is required.'; });
  if (values.email && !emailPattern.test(values.email)) errors.email = 'Enter a valid email address.';
  if (values.mobile && !mobilePattern.test(values.mobile)) errors.mobile = 'Enter a valid mobile number.';
  if (values.password && values.password.length < 8) errors.password = 'Use at least 8 characters.';
  if (values.confirmPassword && values.password !== values.confirmPassword) errors.confirmPassword = 'Passwords do not match.';
  if (!values.terms) errors.terms = 'Please agree to the terms to continue.';
  return errors;
}
