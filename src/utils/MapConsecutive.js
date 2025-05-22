/**
 * Code from https://labex.io/tutorials/javascript-map-consecutive-elements-28479
 * 
 * @param {Array} arr Array to be iterated over
 * @param {Number} n Number of consecutive elements within a sub-array
 * @param {Function} fn Function to operate on a sub-array (accepts the whole sub-array as input)
 * @returns {Array}
 */
const mapConsecutive = (arr, n, fn) =>
    arr.slice(n - 1).map((v, i) => fn(arr.slice(i, i + n)));

export default mapConsecutive;