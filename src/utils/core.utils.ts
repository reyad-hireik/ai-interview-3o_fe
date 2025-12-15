export const isEmpty = (value: any, omitArray: boolean = false) => {
    if (value === null || value === undefined || value === 'null' || value === 'undefined') {
        return true;
    }
    if (typeof value === 'string') {
        return value.trim().length === 0;
    }
    if (Array.isArray(value)) {
        if (omitArray) {
            return false;
        }
        return value.length === 0;
    }
    if (typeof value === 'object') {
        return Object.keys(value).length === 0;
    }

    return false;
};