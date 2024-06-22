export function hasOwnProperty(obj: object, propName: PropertyKey) {
  return Object.prototype.hasOwnProperty.call(obj, propName);
}
