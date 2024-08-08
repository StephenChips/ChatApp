export function hasOwnProperty(obj: object, propName: PropertyKey) {
  return Object.prototype.hasOwnProperty.call(obj, propName);
}

export function countIf<T>(array: T[], shouldCount: (item: T, index: number, array: T[]) => boolean) {
  let count = 0;
  for (let i = 0; i < array.length; i++) {
    if (shouldCount(array[i], i, array)) count++;
  }
  return count;
}