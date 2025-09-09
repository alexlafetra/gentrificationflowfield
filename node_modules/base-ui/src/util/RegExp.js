export const escapeRegExp = (string) => {
    const reRegExpChar = /[\\^$.*+?()[\]{}|]/g;
    const reHasRegExpChar = new RegExp(reRegExpChar.source);

    return string && reHasRegExpChar.test(string)
        ? string.replace(reRegExpChar, '\\$&')
        : string;
};
