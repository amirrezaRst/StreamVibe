//! user input used inside a RegExp must be escaped, or a crafted value can
//! either match unintended documents or cause catastrophic backtracking
const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

module.exports = { escapeRegex };
