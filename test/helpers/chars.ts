export const asciiCharList = [...Array(0x80).keys()].map(c =>
    String.fromCodePoint(c),
);
export const asciiPrintableCharList = asciiCharList.filter(char =>
    /^[\x20-\x7E]$/.test(char),
);
